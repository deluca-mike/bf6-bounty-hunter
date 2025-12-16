import { FFASpawning } from 'bf6-portal-utils/ffa-spawning';
import { InteractMultiClickDetector } from 'bf6-portal-utils/interact-multi-click-detector';
import { Logger } from 'bf6-portal-utils/logger';
import { MapDetector } from 'bf6-portal-utils/map-detector';
import { PerformanceStats } from 'bf6-portal-utils/performance-stats';
import { Sounds } from 'bf6-portal-utils/sounds';
import { UI } from 'bf6-portal-utils/ui';

import { PlayerUndeployFixer } from './utils/player-undeploy-fixer';

import {
    EASTWOOD_SPAWNS,
    EASTWOOD_FFA_SPAWNING_SOLDIER_OPTIONS,
    EMPIRE_STATE_SPAWNS,
    EMPIRE_STATE_FFA_SPAWNING_SOLDIER_OPTIONS,
} from './spawns';

let staticLogger: Logger | undefined;
let dynamicLogger: Logger | undefined;
let performanceStats: PerformanceStats | undefined;
let debugMenu: UI.Container | undefined;

let playerId: number = 0;
const playerLogs: { [playerId: number]: string[] } = {};

// TODO: Assists
// TODO: Refresh/clear scoreboard of leavers.
class BountyHunter {
    // ---- Private Static Constants ---- //

    private static readonly _TARGET_POINTS: number = 500;

    private static readonly _BASE_KILL_POINTS: number = 10;

    private static readonly _BIG_BOUNTY_THRESHOLD: number = 30;

    private static readonly _MAX_BIG_BOUNTIES: number = 3;

    private static readonly _SPOTTING_DURATIONS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        5, // 4
        10, // 5
        15, // 6
        20, // 7
        29, // 8
    ];

    private static readonly _STREAK_SPOTTING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        25, // 4
        20, // 5
        15, // 6
        10, // 7
        1, // 8
    ];

    private static readonly _STREAK_FLAGGING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        0, // 4
        16, // 5
        8, // 6
        4, // 7
        2, // 8
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

    private static readonly _AWARD_SOUNDS: ({ sfxAsset: mod.RuntimeSpawn_Common; amplitude: number } | undefined)[] = [
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

    private static readonly _ZERO_VECTOR: mod.Vector = mod.CreateVector(0, 0, 0);

    private static readonly _WORLD_ICON_OFFSET: mod.Vector = mod.CreateVector(0, 3, 0);

    private static readonly _AWARD_DURATION: number = 2;

    private static readonly _ALL_BOUNTY_HUNTERS: { [playerId: number]: BountyHunter } = {};

    private static readonly _BIG_BOUNTIES: Map<number, { bounty: number; position: mod.Vector }> = new Map();

    private static readonly _SELF_INFO_CONTAINER_PARAMS: UI.ContainerParams = {
        x: 0,
        y: 0,
        width: 450,
        height: 120,
        anchor: mod.UIAnchor.TopCenter,
        bgColor: UI.COLORS.BF_GREY_4,
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Blur,
        depth: mod.UIDepth.BelowGameUI,
    };

    // ---- Private Static Methods ---- //

    private static _getKillStreakMessage(killStreak: number): mod.Message {
        return mod.Message(mod.stringkeys.bountyHunter.hud.killStreak, killStreak, this._getBounty(killStreak));
    }

    private static _getSpottedMessage(killStreak: number): mod.Message {
        const duration = this._getSpottingDuration(killStreak);
        const delay = this._getSpottingDelay(killStreak);

        return !duration || !delay
            ? mod.Message(mod.stringkeys.bountyHunter.hud.notSpotted)
            : mod.Message(mod.stringkeys.bountyHunter.hud.spotted, duration, delay);
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
        this._BIG_BOUNTIES.set(mod.GetObjId(player), { bounty, position });

        const bigBounties = Array.from(this._BIG_BOUNTIES.entries())
            .filter(([_, { bounty }]) => bounty >= this._BIG_BOUNTY_THRESHOLD)
            .sort((a, b) => a[1].bounty - b[1].bounty) // Ascending sort.
            .slice(0, this._MAX_BIG_BOUNTIES)
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
            x: 0,
            y: 60,
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
            x: 0,
            y: 90,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: this._getSpottedMessage(0),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            parent,
        };
    }

    private static _getAwardUIParams(): UI.TextParams {
        return {
            x: 0,
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
        };
    }

    private static _getBigBountyTextUIParams(
        x: number,
        width: number,
        anchor: mod.UIAnchor,
        message: mod.Message,
        textColor: mod.Vector
    ): UI.TextParams {
        return {
            type: UI.Type.Text,
            x,
            width,
            height: 20,
            anchor,
            message: message,
            textSize: 14,
            textColor,
            textAnchor: anchor,
        };
    }

    private static _getBigBountyRowUIParams(y: number): UI.ContainerParams {
        const childrenParams: UI.TextParams[] = [
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
                mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.unknownHeading),
                UI.COLORS.WHITE
            ),
            this._getBigBountyTextUIParams(3, 200, mod.UIAnchor.CenterRight, mod.Message(0), UI.COLORS.BF_RED_BRIGHT),
        ];

        return {
            type: UI.Type.Container,
            y: y,
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

    private static _getBigBountyUIParams(): UI.ContainerParams {
        const childrenParams: UI.ContainerParams[] = Array(this._MAX_BIG_BOUNTIES)
            .fill({})
            .map((_, index) => this._getBigBountyRowUIParams(index * (20 + 4)));

        return {
            x: 32,
            y: 340,
            width: 296,
            height: this._MAX_BIG_BOUNTIES * 24,
            anchor: mod.UIAnchor.BottomLeft,
            depth: mod.UIDepth.AboveGameUI,
            childrenParams: childrenParams,
            visible: false,
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
        if (!position) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.unknownHeading);

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

        // dynamicLogger?.log(`Setting up scoreboard header.`);
        // const headerName = mod.Message(
        //     mod.stringkeys.bountyHunter.scoreboard.header,
        //     this._TARGET_POINTS,
        //     mod.stringkeys.bountyHunter.scoreboard.none,
        // );

        // mod.SetScoreboardHeader(headerName);

        // dynamicLogger?.log(`Setting up scoreboard sorting.`);
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
        const victimKillStreak = victim?._killStreak ?? 0; // This needs to be captured before the victim's kill streak is reset.
        const bounty = this._getBounty(victimKillStreak);

        if (victimPlayer && bounty >= this._BIG_BOUNTY_THRESHOLD) {
            this._updateBigBounties(victimPlayer, 0, mod.CreateVector(0, 0, 0)); // TODO: Perhaps position should be undefined.
        }

        if (victimIsValid) {
            victim._killStreakBeforeDeath = victim._killStreak;
            ++victim._deaths;
            victim._setKillStreak(0);
            victim._bigBountiesUI?.hide();

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

        dynamicLogger?.log(
            `<BH> P_${killer ? killer._playerId : 'U'} killed P_${victim ? victim._playerId : 'U'} and got ${bounty} PTS.`
        );

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

        if (!killer._isSpotted && this._getSpottingDelay(killer._killStreak)) {
            killer._isSpotted = true;
            killer._spot();
        }

        if (!killer._isFlagged && this._getFlaggingDelay(killer._killStreak)) {
            killer._isFlagged = true;
            killer._flag();
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

        dynamicLogger?.log(
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
            // dynamicLogger?.log(`<BH> P_${this._playerId} is an AI soldier, skipping initialization.`);
            return;
        }

        const selfInfoContainer = new UI.Container(BountyHunter._SELF_INFO_CONTAINER_PARAMS, player);

        this._killStreakUI = new UI.Text(BountyHunter._getKillStreakUIParams(selfInfoContainer), player);
        this._spottedUI = new UI.Text(BountyHunter._getSpottedUIParams(selfInfoContainer), player);
        this._awardUI = new UI.Text(BountyHunter._getAwardUIParams(), player);
        this._bigBountiesUI = new UI.Container(BountyHunter._getBigBountyUIParams(), player);
    }

    // ---- Private Variables ---- //

    private _player: mod.Player;

    private _playerId: number;

    private _killStreakUI?: UI.Text;

    private _spottedUI?: UI.Text;

    private _awardUI?: UI.Text;

    private _bigBountiesUI?: UI.Container;

    private _isAI: boolean = false;

    private _isSpotted: boolean = false;

    private _isFlagged: boolean = false;

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

    private _spot(): void {
        if (this._deleteIfNotValid()) return;

        const duration = BountyHunter._getSpottingDuration(this._killStreak);
        const delay = BountyHunter._getSpottingDelay(this._killStreak);

        if (!delay || !duration) {
            // dynamicLogger?.log(`<BH> Suspending spotting for P_${this._playerId}.`);
            this._isSpotted = false;
            return;
        }

        dynamicLogger?.log(`<BH> Spotting P_${this._playerId} for ${duration}s on, ${delay}s off.`);

        mod.SpotTarget(this._player, duration, mod.SpotStatus.SpotInBoth);
        mod.Wait(duration + delay).then(() => this._spot());
    }

    private _flag(worldIcon?: mod.WorldIcon): void {
        if (this._deleteIfNotValid()) return BountyHunter._deleteWorldIcon(worldIcon);

        const delay = BountyHunter._getFlaggingDelay(this._killStreak);

        if (!delay) {
            // dynamicLogger?.log(`<BH> Suspending flagging for P_${this._playerId}.`);

            this._isFlagged = false;

            return BountyHunter._deleteWorldIcon(worldIcon);
        }

        const position = mod.Add(
            mod.GetSoldierState(this._player, mod.SoldierStateVector.GetPosition),
            BountyHunter._WORLD_ICON_OFFSET
        );

        if (worldIcon) {
            mod.SetWorldIconPosition(worldIcon, position);
        } else {
            worldIcon = BountyHunter._createWorldIcon(position);
        }

        const bounty = BountyHunter._getBounty(this._killStreak);

        mod.SetWorldIconText(worldIcon, mod.Message(mod.stringkeys.bountyHunter.worldIcon, bounty));

        dynamicLogger?.log(`<BH> Flagging P_${this._playerId} every ${delay}s (${bounty} PTS).`);

        mod.Wait(delay).then(() => this._flag(worldIcon));

        if (bounty < BountyHunter._BIG_BOUNTY_THRESHOLD) return;

        BountyHunter._updateBigBounties(this._player, bounty, position);
    }

    private _awardBounty(victimKillStreak: number, bounty: number): void {
        const sound = BountyHunter._getAwardSound(victimKillStreak);

        if (sound) {
            Sounds.play2D(sound.sfxAsset, { duration: 5, player: this._player, amplitude: sound.amplitude });
        }

        this._points += bounty;

        if (!this._awardUI) return;

        this._awardUI.setMessage(BountyHunter._getAwardMessage(bounty));
        this._awardUI.show();

        mod.Wait(BountyHunter._AWARD_DURATION).then(() => this._awardUI?.hide());
    }

    private _setKillStreak(killStreak: number): void {
        this._killStreak = killStreak;
        this._killStreakUI?.setMessage(BountyHunter._getKillStreakMessage(killStreak));
        this._spottedUI?.setMessage(BountyHunter._getSpottedMessage(killStreak));
    }

    private _updateBigBountiesUI(
        bigBounties: { bountyHunter: BountyHunter; bounty: number; position: mod.Vector }[]
    ): void {
        if (this._isAI) return;

        const position = mod.GetSoldierState(this._player, mod.SoldierStateBool.IsAlive)
            ? mod.GetSoldierState(this._player, mod.SoldierStateVector.GetPosition)
            : undefined;

        const availableBigBounties = bigBounties.filter(
            ({ bountyHunter }) => bountyHunter._playerId !== this._playerId
        );
        const startingIndex = availableBigBounties.length - 1;

        for (let index = BountyHunter._MAX_BIG_BOUNTIES - 1; index >= 0; --index) {
            const row = this._bigBountiesUI?.children[index] as UI.Container;

            if (index > startingIndex) {
                (row.children[0] as UI.Text).setMessage(
                    mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, 0)
                );
                (row.children[1] as UI.Text).setMessage(
                    mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.unknownHeading)
                );
                (row.children[2] as UI.Text).setMessage(mod.Message(-1));

                row.hide();

                continue;
            }

            const { bountyHunter, bounty, position: bountyPosition } = availableBigBounties[index];

            (row.children[0] as UI.Text).setMessage(
                mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, bounty)
            );
            (row.children[1] as UI.Text).setMessage(BountyHunter._getDistanceMessage(bountyPosition, position));
            (row.children[2] as UI.Text).setMessage(mod.Message(bountyHunter.player));

            row.show();
        }
    }

    private _deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this._player)) return false;

        dynamicLogger?.log(`<BH> P_${this._playerId} is no longer in the game.`);

        this._killStreak = 0;
        this._killStreakUI?.delete();
        this._spottedUI?.delete();

        BountyHunter._updateBigBounties(this._player, 0, mod.CreateVector(0, 0, 0)); // TODO: Perhaps position should be undefined.

        delete BountyHunter._ALL_BOUNTY_HUNTERS[this._playerId];

        return true;
    }
}

const DEBUG_MENU = {
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    anchor: mod.UIAnchor.Center,
    bgColor: UI.COLORS.BLACK,
    bgAlpha: 0.5,
    visible: false,
    childrenParams: [
        {
            type: UI.Type.Button,
            x: 0,
            y: 0,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.toggleStaticLogger),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                staticLogger?.toggle();
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 20,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.toggleDynamicLogger),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                dynamicLogger?.toggle();
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 40,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveKill),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(player);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 60,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveAssist),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleAssist(player);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 80,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.cyclePlayerLogs),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                playerId = (playerId + 1) % 32;

                const logLine = `P_${playerId} last log: ${playerLogs[playerId] && playerLogs[playerId].length > 0 ? playerLogs[playerId][playerLogs[playerId].length - 1] : 'No logs'}`;

                staticLogger?.log(logLine, 4);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 100,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.printPlayerLogs),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                const lastLogIndex =
                    playerLogs[playerId] && playerLogs[playerId].length > 0 ? playerLogs[playerId].length - 1 : -1;

                staticLogger?.log(lastLogIndex >= 6 ? playerLogs[playerId][lastLogIndex - 6] : 'No logs', 6);
                staticLogger?.log(lastLogIndex >= 5 ? playerLogs[playerId][lastLogIndex - 5] : 'No logs', 7);
                staticLogger?.log(lastLogIndex >= 4 ? playerLogs[playerId][lastLogIndex - 4] : 'No logs', 8);
                staticLogger?.log(lastLogIndex >= 3 ? playerLogs[playerId][lastLogIndex - 3] : 'No logs', 9);
                staticLogger?.log(lastLogIndex >= 2 ? playerLogs[playerId][lastLogIndex - 2] : 'No logs', 10);
                staticLogger?.log(lastLogIndex >= 1 ? playerLogs[playerId][lastLogIndex - 1] : 'No logs', 11);
                staticLogger?.log(lastLogIndex >= 0 ? playerLogs[playerId][lastLogIndex] : 'No logs', 12);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 120,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.clearDynamicLogs),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                dynamicLogger?.clear();
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 140,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveAIKill10),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 10));
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 160,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveAIKill20),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 20));
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 0,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.BottomCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.close),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                mod.EnableUIInputMode(false, player);
                debugMenu?.hide();
            },
        },
    ],
};

export function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): void {
    UI.handleButtonClick(player, widget, event);
}

export function OngoingGlobal(): void {
    performanceStats?.trackTick();
}

export function OnGameModeStarted(): void {
    BountyHunter.initialize();

    const { spawnData, spawnOptions } =
        MapDetector.currentMap() == MapDetector.Map.EmpireState
            ? { spawnData: EMPIRE_STATE_SPAWNS, spawnOptions: EMPIRE_STATE_FFA_SPAWNING_SOLDIER_OPTIONS }
            : { spawnData: EASTWOOD_SPAWNS, spawnOptions: EASTWOOD_FFA_SPAWNING_SOLDIER_OPTIONS };

    FFASpawning.Soldier.initialize(spawnData, spawnOptions);
    FFASpawning.Soldier.enableSpawnQueueProcessing();
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
    if (mod.GetObjId(eventPlayer) != 0) return;

    if (!InteractMultiClickDetector.checkMultiClick(eventPlayer)) return;

    debugMenu?.show();
    mod.EnableUIInputMode(true, eventPlayer);
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    playerLogs[mod.GetObjId(eventPlayer)] = [`OnPlayerJoinGame started`];

    new BountyHunter(eventPlayer);
    const soldier = new FFASpawning.Soldier(eventPlayer);

    soldier.startDelayForPrompt();

    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerJoinGame completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

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

    debugMenu = new UI.Container(DEBUG_MENU, eventPlayer);
    performanceStats = new PerformanceStats({ log: (text: string) => dynamicLogger?.log(text) });
    performanceStats?.startHeartbeat();

    const logger = (text: string) => dynamicLogger?.log(text);
    FFASpawning.Soldier.setLogging(logger, FFASpawning.LogLevel.Info);
    PlayerUndeployFixer.setLogging(logger);
}

export function OnPlayerDied(
    victimPlayer: mod.Player,
    killerPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {
    playerLogs[mod.GetObjId(victimPlayer)].push(`OnPlayerDied started`);

    BountyHunter.handleKill(killerPlayer, victimPlayer);
    PlayerUndeployFixer.playerDied(victimPlayer, (player: mod.Player) => OnPlayerUndeploy(player));

    playerLogs[mod.GetObjId(victimPlayer)].push(`OnPlayerDied completed`);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerUndeploy started`);

    PlayerUndeployFixer.playerUndeployed(eventPlayer);
    FFASpawning.Soldier.startDelayForPrompt(eventPlayer);

    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerUndeploy completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger?.clear();
    debugMenu?.hide();
    mod.EnableUIInputMode(false, eventPlayer);
}

export function OnPlayerEarnedKillAssist(assisterPlayer: mod.Player, victimPlayer: mod.Player): void {
    BountyHunter.handleAssist(assisterPlayer, victimPlayer);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerDeployed started`);

    BountyHunter.handleDeployed(eventPlayer);

    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerDeployed completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

    debug(eventPlayer);
}

function debug(player: mod.Player): void {
    mod.Wait(0.5).then(() => {
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) return;

        staticLogger?.log(`Position: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetPosition)}`, 0);
        staticLogger?.log(
            `Facing: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetFacingDirection)}`,
            1
        );
        staticLogger?.log(`Tick Rate: ${performanceStats?.tickRate.toFixed(1)}Hz`, 2);

        debug(player);
    });
}

function getPlayerStateVectorString(player: mod.Player, type: mod.SoldierStateVector): string {
    return getVectorString(mod.GetSoldierState(player, type));
}

function getVectorString(vector: mod.Vector): string {
    return `<${mod.XComponentOf(vector).toFixed(2)}, ${mod.YComponentOf(vector).toFixed(2)}, ${mod.ZComponentOf(vector).toFixed(2)}>`;
}
