import { FFASpawning } from 'bf6-portal-utils/ffa-spawning/index.ts';
import { InteractMultiClickDetector } from 'bf6-portal-utils/interact-multi-click-detector/index.ts';
import { Logger } from 'bf6-portal-utils/logger/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { UI } from 'bf6-portal-utils/ui/index.ts';
import { MapDetector } from 'bf6-portal-utils/map-detector/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';

import { Scavenger } from './scavenger/index.ts';
import { PlayerUndeployFixer } from './utils/player-undeploy-fixer.ts';
import { DropInSpawning } from './dropin-spawning/index.ts';
import { createVehicleSpawner } from './utils/vehicle-spawner.ts';

import { getPlayerStateVectorString } from './helpers/index.ts';

import { getSpawnDataAndInitializeOptions } from './spawns.ts';

const DEBUGGING = false;

let staticLogger: Logger | undefined;
let dynamicLogger: Logger | undefined;
let debugMenu: UI.Container | undefined;
let spawnType: 'ffa' | 'dropin' = 'ffa';

type AwardSounds = ({ sfxAsset: mod.RuntimeSpawn_Common; amplitude: number } | undefined)[];

type KillStreakCallInRewards = { [killStreak: number]: { gadget: mod.Gadgets; message: mod.Message } };

// TODO: Leader is treated like having a flag-worthy streak.
// TODO: Smaller combat zones or dynamic combat zones.
// TODO: Microtask more of the UI, like Big Bounties.

// TODO: Assists
// TODO: Refresh/clear scoreboard of leavers.
class BountyHunter {
    // ---- Private Static Constants ---- //

    private static readonly _NOT_SPOTTED_MESSAGE = mod.Message(mod.stringkeys.bountyHunter.hud.notSpotted);

    private static readonly _SCAVENGER_LOG_MESSAGE = mod.Message(mod.stringkeys.bountyHunter.hud.scavengerLog);

    private static readonly _UNKNOWN_HEADING_MESSAGE = mod.Message(
        mod.stringkeys.bountyHunter.hud.bigBounty.unknownHeading
    );

    private static readonly _TARGET_POINTS: number = 400;

    private static readonly _BASE_KILL_POINTS: number = 10;

    private static readonly _BIG_BOUNTY_THRESHOLD: number = 30;

    private static readonly _MAX_BIG_BOUNTIES: number = 3;

    // In milliseconds.
    private static readonly _SPOTTING_DURATIONS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        5_000, // 4
        10_000, // 5
        15_000, // 6
        20_000, // 7
        29_000, // 8
    ];

    // In milliseconds.
    private static readonly _STREAK_SPOTTING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        25_000, // 4
        20_000, // 5
        15_000, // 6
        10_000, // 7
        1_000, // 8
    ];

    // In milliseconds.
    private static readonly _STREAK_FLAGGING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        0, // 4
        16_000, // 5
        8_000, // 6
        4_000, // 7
        2_000, // 8
    ];

    private static readonly _BOUNTY_MULTIPLIERS: number[] = [
        1, // 0
        1, // 1
        1, // 2
        2, // 3
        2, // 4
        3, // 5
        4, // 6
        5, // 7
        6, // 8
        7, // 9
        8, // 10
    ];

    private static readonly _AWARD_SOUNDS: AwardSounds = [
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 0
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 1
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 2
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 3
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 4
        {
            sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Notification_SectorBonus_ProgressBarFinished_OneShot2D,
            amplitude: 1,
        }, // 5
        {
            sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Notification_SectorBonus_ProgressBarFinished_OneShot2D,
            amplitude: 1,
        }, // 6
        {
            sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Scorelog_Accolades_AccoladeTypes_CareerBest_OneShot2D,
            amplitude: 1,
        }, // 7
        {
            sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Scorelog_Accolades_AccoladeTypes_CareerBest_OneShot2D,
            amplitude: 1,
        }, // 8
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Notification_SidePanel_Mastery_OneShot2D, amplitude: 2 }, // 9
    ];

    private static readonly _KILL_STREAK_CALLIN_REWARDS: KillStreakCallInRewards = {
        3: {
            gadget: mod.Gadgets.CallIn_UAV_Overwatch,
            message: mod.Message(mod.stringkeys.bountyHunter.hud.callInLogs.uav),
        },
        6: {
            gadget: mod.Gadgets.CallIn_Artillery_Strike,
            message: mod.Message(mod.stringkeys.bountyHunter.hud.callInLogs.artilleryStrike),
        },
        9: {
            gadget: mod.Gadgets.CallIn_Smoke_Screen,
            message: mod.Message(mod.stringkeys.bountyHunter.hud.callInLogs.smokeScreen),
        },
        12: {
            gadget: mod.Gadgets.CallIn_UAV_Overwatch,
            message: mod.Message(mod.stringkeys.bountyHunter.hud.callInLogs.uav),
        },
        15: {
            gadget: mod.Gadgets.CallIn_Smoke_Screen,
            message: mod.Message(mod.stringkeys.bountyHunter.hud.callInLogs.smokeScreen),
        },
        18: {
            gadget: mod.Gadgets.CallIn_UAV_Overwatch,
            message: mod.Message(mod.stringkeys.bountyHunter.hud.callInLogs.uav),
        },
    };

    private static readonly _ZERO_VECTOR: mod.Vector = mod.CreateVector(0, 0, 0);

    private static readonly _WORLD_ICON_OFFSET: mod.Vector = mod.CreateVector(0, 3, 0);

    private static readonly _AWARD_DURATION: number = 2; // In seconds.

    private static readonly _ALL_BOUNTY_HUNTERS: { [playerId: number]: BountyHunter } = {};

    private static readonly _BIG_BOUNTIES: Map<number, { bounty: number; position: mod.Vector }> = new Map();

    // ---- Private Static Methods ---- //

    private static _getSelfInfoContainerParams(player: mod.Player): UI.ContainerParams {
        return {
            width: 450,
            height: 130,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            depth: mod.UIDepth.BelowGameUI,
            receiver: player,
        };
    }

    private static _getKillStreakMessage(killStreak: number): mod.Message {
        return mod.Message(mod.stringkeys.bountyHunter.hud.killStreak, killStreak, this._getBounty(killStreak));
    }

    private static _getSpottedMessage(killStreak: number): mod.Message {
        const duration = this._getSpottingDuration(killStreak);
        const delay = this._getSpottingDelay(killStreak);

        return !duration || !delay
            ? this._NOT_SPOTTED_MESSAGE
            : mod.Message(mod.stringkeys.bountyHunter.hud.spotted, duration / 1_000, delay / 1_000);
    }

    private static _getSpottingDuration(killStreak: number): number {
        const durations = this._SPOTTING_DURATIONS;
        return killStreak < durations.length ? durations[killStreak] : durations[durations.length - 1];
    }

    private static _getSpottingDelay(killStreak: number): number {
        const delays = this._STREAK_SPOTTING_DELAYS;
        return killStreak < delays.length ? delays[killStreak] : delays[delays.length - 1];
    }

    private static _getFlaggingDelay(killStreak: number): number {
        const delays = this._STREAK_FLAGGING_DELAYS;
        return killStreak < delays.length ? delays[killStreak] : delays[delays.length - 1];
    }

    private static _getBounty(killStreak: number): number {
        const multipliers = this._BOUNTY_MULTIPLIERS;
        return (
            this._BASE_KILL_POINTS *
            (killStreak < multipliers.length ? multipliers[killStreak] : multipliers[multipliers.length - 1])
        );
    }

    private static _getAwardMessage(points: number): mod.Message {
        return mod.Message(mod.stringkeys.bountyHunter.hud.award, points);
    }

    private static _getAwardSound(
        killStreak: number
    ): { sfxAsset: mod.RuntimeSpawn_Common; amplitude: number } | undefined {
        const sounds = this._AWARD_SOUNDS;
        return killStreak < sounds.length ? sounds[killStreak] : sounds[sounds.length - 1];
    }

    private static _createWorldIcon(position: mod.Vector): mod.WorldIcon {
        const worldIcon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, position, this._ZERO_VECTOR);
        mod.SetWorldIconColor(worldIcon, UI.COLORS.BF_RED_BRIGHT); // TODO: Use color based on kill streak?
        mod.SetWorldIconImage(worldIcon, mod.WorldIconImages.Triangle);
        mod.EnableWorldIconImage(worldIcon, true);
        mod.EnableWorldIconText(worldIcon, true);

        return worldIcon;
    }

    private static _deleteWorldIcon(worldIcon?: mod.WorldIcon): void {
        if (!worldIcon) return;

        mod.UnspawnObject(worldIcon);
    }

    private static _updateBigBounties(player: mod.Player, bounty: number, position: mod.Vector): void {
        if (bounty < this._BIG_BOUNTY_THRESHOLD) {
            // Try to delete the big bounty, but if it didn't exist, return so we don't force UI updates.
            if (!this._BIG_BOUNTIES.delete(mod.GetObjId(player))) return;
        } else {
            this._BIG_BOUNTIES.set(mod.GetObjId(player), { bounty, position });
        }

        // dynamicLogger?.logAsync(`<BH> ${this._BIG_BOUNTIES.size} total big bounties.`);

        const bigBounties = Array.from(this._BIG_BOUNTIES.entries())
            .sort((a, b) => a[1].bounty - b[1].bounty) // Ascending sort.
            .map(([playerId, { bounty, position }]) => ({
                bountyHunter: this.getFromPlayerId(playerId),
                bounty,
                position,
            }));

        Object.values(this._ALL_BOUNTY_HUNTERS).forEach((bountyHunter) => {
            bountyHunter._updateBigBountiesUI(bigBounties);
        });
    }

    private static _getKillStreakUIParams(parent: UI.Container): UI.TextParams {
        return {
            y: 70,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: this._getKillStreakMessage(0),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            parent,
        };
    }

    private static _getSpottedUIParams(parent: UI.Container): UI.TextParams {
        return {
            y: 100,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: this._getSpottedMessage(0),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            parent,
        };
    }

    private static _getAwardUIParams(player: mod.Player): UI.TextParams {
        return {
            y: -100,
            width: 100,
            height: 32,
            anchor: mod.UIAnchor.Center,
            message: this._getAwardMessage(0),
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            textSize: 24,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            textAlpha: 0.5,
            visible: false,
            receiver: player,
        };
    }

    private static _getBigBountyTextUIParams(
        x: number,
        width: number,
        anchor: mod.UIAnchor,
        message: mod.Message,
        textColor: mod.Vector
    ): UI.ChildParams<UI.TextParams> {
        return {
            type: UI.Text,
            x,
            width,
            height: 20,
            anchor,
            message,
            textSize: 14,
            textColor,
            textAnchor: anchor,
        };
    }

    private static _getBigBountyRowUIParams(y: number): UI.ChildParams<UI.ContainerParams> {
        const childrenParams = [
            this._getBigBountyTextUIParams(
                3,
                90,
                mod.UIAnchor.CenterLeft,
                mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, 0),
                UI.COLORS.BF_GREEN_BRIGHT
            ),
            this._getBigBountyTextUIParams(
                88,
                60,
                mod.UIAnchor.CenterLeft,
                this._UNKNOWN_HEADING_MESSAGE,
                UI.COLORS.WHITE
            ),
            this._getBigBountyTextUIParams(3, 200, mod.UIAnchor.CenterRight, mod.Message(0), UI.COLORS.BF_RED_BRIGHT),
        ];

        return {
            type: UI.Container,
            y,
            width: 294,
            height: 24,
            anchor: mod.UIAnchor.BottomLeft,
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.7,
            bgFill: mod.UIBgFill.Blur,
            visible: false,
            childrenParams: childrenParams,
        };
    }

    private static _getBigBountyUIParams(player: mod.Player): UI.ContainerParams {
        const childrenParams = Array.from({ length: this._MAX_BIG_BOUNTIES }, (_, index) =>
            this._getBigBountyRowUIParams(index * (20 + 4))
        );

        return {
            x: 32,
            y: 340,
            width: 296,
            height: this._MAX_BIG_BOUNTIES * 24,
            anchor: mod.UIAnchor.BottomLeft,
            depth: mod.UIDepth.AboveGameUI,
            childrenParams: childrenParams,
            visible: false,
            receiver: player,
        };
    }

    private static _getHeading(start: mod.Vector, target: mod.Vector): number {
        const dx = mod.XComponentOf(target) - mod.XComponentOf(start);
        const dz = mod.ZComponentOf(target) - mod.ZComponentOf(start);
        const angleRadians = Math.atan2(dx, -dz);
        const angleDegrees = angleRadians * (180 / Math.PI);

        return angleDegrees < 0 ? angleDegrees + 360 : angleDegrees;
    }

    private static _getDistanceMessage(bountyPosition: mod.Vector, position?: mod.Vector): mod.Message {
        if (!position) return this._UNKNOWN_HEADING_MESSAGE;

        const heading = this._getHeading(position, bountyPosition);
        const distance = ~~mod.DistanceBetween(position, bountyPosition);

        if (heading < 22.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingN, distance);
        if (heading < 67.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingNE, distance);
        if (heading < 112.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingE, distance);
        if (heading < 157.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingSE, distance);
        if (heading < 202.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingS, distance);
        if (heading < 247.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingSW, distance);
        if (heading < 292.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingW, distance);
        if (heading < 337.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingNW, distance);
        return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingN, distance);
    }

    private static _awardScavenger(player: mod.Player): void {
        mod.DisplayHighlightedWorldLogMessage(this._SCAVENGER_LOG_MESSAGE, player);
        mod.Resupply(player, mod.ResupplyTypes.AmmoCrate);
    }

    // ---- Public Static Methods ---- //

    public static initialize(): void {
        mod.SetScoreboardType(mod.ScoreboardType.CustomFFA);
        mod.SetGameModeTargetScore(this._TARGET_POINTS);
        mod.SetScoreboardColumnWidths(160, 160, 160, 160, 160);

        mod.SetScoreboardColumnNames(
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.points),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.kills),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.assists),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.deaths),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.bounty)
        );

        // dynamicLogger?.logAsync(`Setting up scoreboard header.`);
        // const headerName = mod.Message(
        //     mod.stringkeys.bountyHunter.scoreboard.header,
        //     this._TARGET_POINTS,
        //     mod.stringkeys.bountyHunter.scoreboard.none,
        // );

        // mod.SetScoreboardHeader(headerName);

        // dynamicLogger?.logAsync(`Setting up scoreboard sorting.`);
        // mod.SetScoreboardSorting(1);

        // mod.SetScoreboardSorting(0, false);
    }

    public static get leader(): BountyHunter | undefined {
        return Object.values(this._ALL_BOUNTY_HUNTERS).reduce(
            (leader: BountyHunter | undefined, bountyHunter: BountyHunter) => {
                return leader && leader.points > bountyHunter.points ? leader : bountyHunter;
            },
            undefined
        );
    }

    public static getFromPlayer(player: mod.Player): BountyHunter {
        return this._ALL_BOUNTY_HUNTERS[mod.GetObjId(player)];
    }

    public static getFromPlayerId(playerId: number): BountyHunter {
        return this._ALL_BOUNTY_HUNTERS[playerId];
    }

    public static handleKill(killerPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const killer = this.getFromPlayer(killerPlayer);
        const victim = victimPlayer && this.getFromPlayer(victimPlayer);
        const victimIsValid = victim && !victim._deleteIfNotValid();

        if (victimIsValid) {
            Scavenger.createDrop(victimPlayer, (player: mod.Player) => this._awardScavenger(player));
        }

        const victimKillStreak = victim?._killStreak ?? 0; // This needs to be captured before the victim's kill streak is reset.
        const bounty = this._getBounty(victimKillStreak);

        if (victimPlayer && bounty >= this._BIG_BOUNTY_THRESHOLD) {
            this._updateBigBounties(victimPlayer, 0, this._ZERO_VECTOR);
        }

        if (victimIsValid) {
            victim._killStreakBeforeDeath = victim._killStreak;
            ++victim._deaths;
            victim._setKillStreak(0);
            victim._bigBountiesUI?.hide();
            victim._stopFlagging();

            mod.SetScoreboardPlayerValues(
                victimPlayer,
                victim._points,
                victim._kills,
                victim._assists,
                victim._deaths,
                this._getBounty(0)
            );
        }

        if (killer._playerId == victim?._playerId) return;

        // dynamicLogger?.logAsync(
        //     `<BH> P_${killer ? killer._playerId : 'U'} killed P_${victim ? victim._playerId : 'U'} and got ${bounty} PTS.`
        // );

        if (killer._deleteIfNotValid()) return;

        killer._awardBounty(victimKillStreak, bounty);
        ++killer._kills;
        killer._setKillStreak(killer._killStreak + 1);

        if (victim) {
            mod.DisplayHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.bountyHunter.hud.killLog, victim._player, victimKillStreak, bounty),
                killer._player
            );
        }

        mod.SetGameModeScore(killerPlayer, killer._points);

        mod.SetScoreboardPlayerValues(
            killerPlayer,
            killer._points,
            killer._kills,
            killer._assists,
            killer._deaths,
            this._getBounty(killer._killStreak)
        );

        const spottingDelay = this._getSpottingDelay(killer._killStreak);

        if (spottingDelay) {
            Timers.clearInterval(killer._spottingIntervalId);

            const spottingDuration = this._getSpottingDuration(killer._killStreak);

            killer._spottingIntervalId = Timers.setInterval(
                () => killer._spot(spottingDuration),
                spottingDuration + spottingDelay,
                true
            );
        }

        const flaggingDelay = this._getFlaggingDelay(killer._killStreak);

        if (flaggingDelay) {
            Timers.clearInterval(killer._flaggingIntervalId);

            const bounty = BountyHunter._getBounty(killer._killStreak);
            const flag = killer._getFlag(bounty);

            killer._flaggingIntervalId = Timers.setInterval(() => killer._flag(bounty, flag), flaggingDelay, true);
        }
    }

    public static handleAssist(assisterPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const assister = this.getFromPlayer(assisterPlayer);
        const victim = victimPlayer && this.getFromPlayer(victimPlayer);

        if (assister._playerId == victim?._playerId) return;

        // Need to handle the race condition where `handleAssist` and `handleKill` for the same victim can be called in any order.
        const killStreakBeforeDeath = victim?._killStreakBeforeDeath ?? 0;
        const killStreak = victim?._killStreak ?? 0;

        const bounty = ~~(this._getBounty(killStreak || killStreakBeforeDeath) / 2);

        dynamicLogger?.logAsync(
            `P_${assister ? assister._playerId : 'U'} assisted in killing P_${victim ? victim._playerId : 'U'} and got ${bounty} PTS.`
        );

        if (assister._deleteIfNotValid()) return;

        assister._points += bounty;
        ++assister._assists;

        if (victim) {
            mod.DisplayHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.bountyHunter.hud.assistLog, victim._player, killStreak, bounty),
                assister._player
            );
        }

        mod.SetGameModeScore(assisterPlayer, assister._points);

        mod.SetScoreboardPlayerValues(
            assisterPlayer,
            assister._points,
            assister._kills,
            assister._assists,
            assister._deaths,
            BountyHunter._getBounty(assister._killStreak)
        );
    }

    public static handleDeployed(player: mod.Player): void {
        const bountyHunter = this.getFromPlayer(player);
        bountyHunter._killStreakBeforeDeath = 0;
        bountyHunter._bigBountiesUI?.show();
    }

    constructor(player: mod.Player) {
        this._player = player;
        this._playerId = mod.GetObjId(player);

        this._isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

        BountyHunter._ALL_BOUNTY_HUNTERS[this._playerId] = this;

        if (this._isAI) {
            // dynamicLogger?.logAsync(`<BH> P_${this._playerId} is an AI soldier, skipping initialization.`);
            return;
        }

        this._selfInfoContainer = new UI.Container(BountyHunter._getSelfInfoContainerParams(player));
        this._killStreakUI = new UI.Text(BountyHunter._getKillStreakUIParams(this._selfInfoContainer));
        this._spottedUI = new UI.Text(BountyHunter._getSpottedUIParams(this._selfInfoContainer));
        this._awardUI = new UI.Text(BountyHunter._getAwardUIParams(player));
        this._bigBountiesUI = new UI.Container(BountyHunter._getBigBountyUIParams(player));
    }

    // ---- Private Variables ---- //

    private _player: mod.Player;

    private _playerId: number;

    private _selfInfoContainer?: UI.Container;

    private _killStreakUI?: UI.Text;

    private _spottedUI?: UI.Text;

    private _awardUI?: UI.Text;

    private _bigBountiesUI?: UI.Container;

    private _isAI: boolean = false;

    private _spottingIntervalId?: number;

    private _flaggingIntervalId?: number;

    private _flaggingWorldIcon?: mod.WorldIcon;

    private _killStreakBeforeDeath: number = 0;

    private _kills: number = 0;

    private _assists: number = 0;

    private _deaths: number = 0;

    private _killStreak: number = 0;

    private _points: number = 0;

    // ---- Public Getters ---- //

    public get player(): mod.Player {
        return this._player;
    }

    public get playerId(): number {
        return this._playerId;
    }

    public get isAI(): boolean {
        return this._isAI;
    }

    public get kills(): number {
        return this._kills;
    }

    public get assists(): number {
        return this._assists;
    }

    public get deaths(): number {
        return this._deaths;
    }

    public get killStreak(): number {
        return this._killStreak;
    }

    public get points(): number {
        return this._points;
    }

    // ---- Private Methods ---- //

    private _spot(duration: number): void {
        if (this._deleteIfNotValid()) return;

        mod.SpotTarget(this._player, duration, mod.SpotStatus.SpotInBoth);

        dynamicLogger?.logAsync(`<BH> Spotting P_${this._playerId} for ${duration / 1_000}s.`);
    }

    private _getFlag(bounty: number): mod.WorldIcon {
        this._flaggingWorldIcon = this._flaggingWorldIcon ?? BountyHunter._createWorldIcon(BountyHunter._ZERO_VECTOR);

        mod.SetWorldIconText(this._flaggingWorldIcon, mod.Message(mod.stringkeys.bountyHunter.worldIcon, bounty));

        return this._flaggingWorldIcon;
    }

    private _stopFlagging(): void {
        if (!this._flaggingIntervalId) return;

        Timers.clearInterval(this._flaggingIntervalId);
        this._flaggingIntervalId = undefined;

        if (!this._flaggingWorldIcon) return;

        BountyHunter._deleteWorldIcon(this._flaggingWorldIcon);
        this._flaggingWorldIcon = undefined;
    }

    private _flag(bounty: number, flaggingWorldIcon: mod.WorldIcon): void {
        if (this._deleteIfNotValid()) return;

        const position = mod.Add(
            mod.GetSoldierState(this._player, mod.SoldierStateVector.GetPosition),
            BountyHunter._WORLD_ICON_OFFSET
        );

        mod.SetWorldIconPosition(flaggingWorldIcon, position);

        dynamicLogger?.logAsync(`<BH> Flagged P_${this._playerId} (Bounty: ${bounty} PTS).`);

        BountyHunter._updateBigBounties(this._player, bounty, position);
    }

    private _awardBounty(victimKillStreak: number, bounty: number): void {
        this._points += bounty;

        if (this._isAI) return;

        const sound = BountyHunter._getAwardSound(victimKillStreak);

        if (sound) {
            Sounds.play2D(sound.sfxAsset, { duration: 5, player: this._player, amplitude: sound.amplitude });
        }

        this._awardUI?.setMessage(BountyHunter._getAwardMessage(bounty)).show();

        mod.Wait(BountyHunter._AWARD_DURATION).then(() => this._awardUI?.hide());
    }

    private _setKillStreak(killStreak: number): void {
        this._killStreak = killStreak;

        if (this._isAI) return;

        this._killStreakUI?.setMessage(BountyHunter._getKillStreakMessage(killStreak));
        this._spottedUI?.setMessage(BountyHunter._getSpottedMessage(killStreak));

        const callIn = BountyHunter._KILL_STREAK_CALLIN_REWARDS[killStreak];

        if (!callIn) return;

        mod.AddEquipment(this._player, callIn.gadget);
        mod.DisplayHighlightedWorldLogMessage(callIn.message, this._player);
    }

    private async _updateBigBountiesUI(
        bigBounties: { bountyHunter: BountyHunter; bounty: number; position: mod.Vector }[]
    ): Promise<void> {
        if (this._isAI) return;

        await Promise.resolve(); // Send the rest of the code to the microtask queue.

        const position = mod.GetSoldierState(this._player, mod.SoldierStateBool.IsAlive)
            ? mod.GetSoldierState(this._player, mod.SoldierStateVector.GetPosition)
            : undefined;

        const availableBigBounties = bigBounties
            .filter(({ bountyHunter }) => bountyHunter._playerId !== this._playerId)
            .slice(0, BountyHunter._MAX_BIG_BOUNTIES);

        // if (this._playerId === 0) {
        //     dynamicLogger?.logAsync(`<BH> Updating big bounties UI with ${availableBigBounties.length} big bounties.`);
        // }

        const startingIndex = availableBigBounties.length - 1;

        for (let index = BountyHunter._MAX_BIG_BOUNTIES - 1; index >= 0; --index) {
            const row = this._bigBountiesUI?.children[index] as UI.Container;

            if (index > startingIndex) {
                row.hide();
                continue;
            }

            const rowChildren = row.children as UI.Text[];

            const { bountyHunter, bounty, position: bountyPosition } = availableBigBounties[index];

            rowChildren[0].setMessage(mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, bounty));
            rowChildren[1].setMessage(BountyHunter._getDistanceMessage(bountyPosition, position));
            rowChildren[2].setMessage(mod.Message(bountyHunter.player));

            row.show();
        }
    }

    private _deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this._player)) return false;

        dynamicLogger?.logAsync(`<BH> P_${this._playerId} is no longer in the game.`);

        this._stopFlagging();
        Timers.clearInterval(this._spottingIntervalId);
        this._killStreak = 0;
        this._selfInfoContainer?.delete();
        this._awardUI?.delete();
        this._bigBountiesUI?.delete();

        BountyHunter._updateBigBounties(this._player, 0, BountyHunter._ZERO_VECTOR); // TODO: Perhaps position should be undefined.

        delete BountyHunter._ALL_BOUNTY_HUNTERS[this._playerId];

        return true;
    }
}

const EASTWOOD_VEHICLE_SPAWNS: { position: mod.Vector; orientation: number; spawner?: mod.VehicleSpawner }[] = [
    { position: mod.CreateVector(-120.1, 233.56, 119.31), orientation: 165 },
    { position: mod.CreateVector(-140.71, 233.92, 201.34), orientation: 165 },
    { position: mod.CreateVector(-143.84, 232.07, -52.17), orientation: 195 },
    { position: mod.CreateVector(-217.75, 232.44, -71.8), orientation: 180 },
    { position: mod.CreateVector(-227.42, 231.72, 98.61), orientation: 195 },
    { position: mod.CreateVector(-29.41, 224.58, 307.04), orientation: 10 },
    { position: mod.CreateVector(-234.72, 232.0, 2.4), orientation: 345 },
    { position: mod.CreateVector(-257.67, 230.56, 40.01), orientation: 15 },
    { position: mod.CreateVector(-290.52, 231.01, 64.09), orientation: 120 },
    { position: mod.CreateVector(-312.76, 230.72, -75.22), orientation: 240 },
    { position: mod.CreateVector(-34.92, 237.75, 99.43), orientation: 15 },
    { position: mod.CreateVector(-82.81, 231.48, -6.97), orientation: 0 },
    { position: mod.CreateVector(115.6, 232.77, -33.15), orientation: 45 },
    { position: mod.CreateVector(128.51, 224.15, 97.84), orientation: 345 },
    { position: mod.CreateVector(137.39, 232.04, -2.6), orientation: 68 },
    { position: mod.CreateVector(166.25, 240.04, -196.81), orientation: 180 },
    { position: mod.CreateVector(232.85, 229.41, 39.2), orientation: 345 },
    { position: mod.CreateVector(312.06, 232.39, -17.16), orientation: 195 },
    { position: mod.CreateVector(34.61, 234.35, -12.16), orientation: 45 },
    { position: mod.CreateVector(62.12, 233.11, -56.33), orientation: 0 },
    { position: mod.CreateVector(70.73, 227.54, 113.09), orientation: 0 },
    { position: mod.CreateVector(75.96, 229.28, 73.16), orientation: 255 },
];

const DEBUG_MENU = {
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    anchor: mod.UIAnchor.Center,
    bgColor: UI.COLORS.BLACK,
    bgAlpha: 0.5,
    visible: false,
    uiInputModeWhenVisible: true,
    childrenParams: [
        {
            type: UI.TextButton,
            x: 0,
            y: 0,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.debug.buttons.toggleStaticLogger),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            onClick: async (player: mod.Player): Promise<void> => {
                staticLogger?.toggle();
            },
        } as UI.ChildParams<UI.TextButtonParams>,
        {
            type: UI.TextButton,
            x: 0,
            y: 20,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.debug.buttons.toggleDynamicLogger),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            onClick: async (player: mod.Player): Promise<void> => {
                dynamicLogger?.toggle();
            },
        } as UI.ChildParams<UI.TextButtonParams>,
        {
            type: UI.TextButton,
            x: 0,
            y: 40,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.debug.buttons.clearDynamicLogs),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            onClick: async (player: mod.Player): Promise<void> => {
                dynamicLogger?.clear();
            },
        } as UI.ChildParams<UI.TextButtonParams>,
        {
            type: UI.TextButton,
            x: 0,
            y: 60,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.debug.buttons.giveAIKill10),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 10));
            },
        } as UI.ChildParams<UI.TextButtonParams>,
        {
            type: UI.TextButton,
            x: 0,
            y: 80,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.debug.buttons.giveAIKill20),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 20));
            },
        } as UI.ChildParams<UI.TextButtonParams>,
        {
            type: UI.TextButton,
            x: 0,
            y: 100,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.debug.buttons.spawnHelicopter),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            onClick: async (player: mod.Player): Promise<void> => {
                await createVehicleSpawner(
                    mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition),
                    0,
                    mod.VehicleList.AH64,
                    true,
                    10
                );
            },
        } as UI.ChildParams<UI.TextButtonParams>,
        {
            type: UI.TextButton,
            x: 0,
            y: 0,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.BottomCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            message: mod.Message(mod.stringkeys.debug.buttons.close),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            onClick: async (player: mod.Player): Promise<void> => {
                debugMenu?.hide();
            },
        } as UI.ChildParams<UI.TextButtonParams>,
    ],
};

export function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): void {
    UI.handleButtonEvent(player, widget, event);
}

export function OnGameModeStarted(): void {
    mod.SetGameModeTimeLimit(20 * 60); // 20 minutes

    BountyHunter.initialize();

    const spawnInitData = getSpawnDataAndInitializeOptions();

    if (spawnInitData.spawnData) {
        FFASpawning.Soldier.initialize(spawnInitData.spawnData, spawnInitData.spawnOptions);
        FFASpawning.Soldier.enableSpawnQueueProcessing();
        spawnType = 'ffa';
    } else if (spawnInitData.dropInData) {
        DropInSpawning.Soldier.initialize(spawnInitData.dropInData, spawnInitData.spawnOptions);
        DropInSpawning.Soldier.enableSpawnQueueProcessing();
        spawnType = 'dropin';
    } else {
        dynamicLogger?.logAsync(`<SCRIPT> No spawn data or drop in data found.`);
        return;
    }

    if (MapDetector.currentMap() !== MapDetector.Map.Eastwood) return;

    EASTWOOD_VEHICLE_SPAWNS.forEach((spawn) => {
        createVehicleSpawner(spawn.position, spawn.orientation, mod.VehicleList.GolfCart, true, 10)
            .then((spawner) => {
                spawn.spawner = spawner;
            })
            .catch((error) => {
                dynamicLogger?.logAsync(`<SCRIPT> Error creating vehicle spawner: ${error?.toString()}`);
            });
    });
}

export function OnTimeLimitReached(): void {
    if (!mod.GetMatchTimeElapsed()) return;

    const leader = BountyHunter.leader;

    if (leader) {
        mod.EndGameMode(leader.player);
    } else {
        mod.EndGameMode(mod.GetTeam(0));
    }
}

export function OngoingPlayer(eventPlayer: mod.Player): void {
    if (!DEBUGGING) return;

    if (mod.GetObjId(eventPlayer) != 0) return;

    if (!InteractMultiClickDetector.checkMultiClick(eventPlayer)) return;

    debugMenu?.show();
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    const playerId = mod.GetObjId(eventPlayer);

    new BountyHunter(eventPlayer);

    const soldier =
        spawnType === 'ffa'
            ? new FFASpawning.Soldier(eventPlayer, DEBUGGING && playerId === 0)
            : new DropInSpawning.Soldier(eventPlayer, DEBUGGING && playerId === 0);

    soldier.startDelayForPrompt();

    if (!DEBUGGING) return;

    if (playerId !== 0) return;

    staticLogger = new Logger(eventPlayer, {
        staticRows: true,
        visible: false,
        anchor: mod.UIAnchor.TopLeft,
        textColor: UI.COLORS.BF_RED_BRIGHT,
    });

    dynamicLogger = new Logger(eventPlayer, {
        staticRows: false,
        visible: false,
        anchor: mod.UIAnchor.TopRight,
        width: 700,
        height: 800,
    });

    debugMenu = new UI.Container({ ...DEBUG_MENU, receiver: eventPlayer });

    const logger = (text: string) => dynamicLogger?.logAsync(text);
    PlayerUndeployFixer.setLogging(logger);
    Timers.setLogging(logger);
    Scavenger.setLogging(logger);

    if (spawnType === 'ffa') {
        FFASpawning.Soldier.setLogging(logger, FFASpawning.LogLevel.Info);
    } else {
        DropInSpawning.Soldier.setLogging(logger, DropInSpawning.LogLevel.Info);
    }
}

export function OnPlayerDied(
    victimPlayer: mod.Player,
    killerPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {
    BountyHunter.handleKill(killerPlayer, victimPlayer);
    PlayerUndeployFixer.playerDied(victimPlayer, (player: mod.Player) => OnPlayerUndeploy(player));
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    PlayerUndeployFixer.playerUndeployed(eventPlayer);

    if (spawnType === 'ffa') {
        FFASpawning.Soldier.startDelayForPrompt(eventPlayer);
    } else {
        DropInSpawning.Soldier.startDelayForPrompt(eventPlayer);
    }

    if (!DEBUGGING) return;

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger?.clear();
    debugMenu?.hide();
}

export function OnPlayerEarnedKillAssist(assisterPlayer: mod.Player, victimPlayer: mod.Player): void {
    BountyHunter.handleAssist(assisterPlayer, victimPlayer);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    BountyHunter.handleDeployed(eventPlayer);

    if (!DEBUGGING) return;

    if (mod.GetObjId(eventPlayer) != 0) return;

    debug(eventPlayer);
}

function debug(player: mod.Player): void {
    mod.Wait(0.5).then(() => {
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) return;

        staticLogger?.logAsync(
            `Position: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetPosition)}`,
            0
        );

        staticLogger?.logAsync(
            `Facing: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetFacingDirection)}`,
            1
        );

        debug(player);
    });
}
