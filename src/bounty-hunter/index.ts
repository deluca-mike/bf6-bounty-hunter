import { Logging } from 'bf6-portal-utils/logging/index.ts';
import { UI } from 'bf6-portal-utils/ui/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { ScavengerDrop } from 'bf6-portal-utils/scavenger-drop/index.ts';

// TODO: Leader is treated like having a flag-worthy streak.
// TODO: Smaller combat zones or dynamic combat zones.
// TODO: Light beam from the sky for bounties.
// TODO: Assists
// TODO: Refresh/clear scoreboard of leavers.
export class BountyHunter {
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

    private static readonly _SPOTTED_OUTLINE_THICKNESS: number = 6;

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
        25_000, // 8
        29_000, // 9
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
        5_000, // 8
        1_000, // 9
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

    private static readonly _AWARD_SOUNDS: BountyHunter.AwardSounds = [
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

    private static readonly _KILL_STREAK_CALLIN_REWARDS: BountyHunter.KillStreakCallInRewards = {
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

    private static readonly _ALL_BOUNTY_HUNTERS: Map<number, BountyHunter> = new Map();

    private static readonly _BIG_BOUNTIES: Map<
        number,
        { bountyHunter: BountyHunter; bounty: number; position: mod.Vector }
    > = new Map();

    private static _logger = new Logging('BH');

    // ---- Private Static Methods ---- //

    private static _getSelfInfoContainerParams(player: mod.Player): UIContainer.Params {
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

    private static _updateBigBounties(bountyHunter: BountyHunter, bounty: number, position: mod.Vector): boolean {
        const playerId = bountyHunter._playerId;

        if (bounty < this._BIG_BOUNTY_THRESHOLD) {
            // Try to delete the big bounty, but if it didn't exist, return so we don't force UI updates.
            if (!this._BIG_BOUNTIES.delete(playerId)) return false;
        } else {
            this._BIG_BOUNTIES.set(playerId, { bountyHunter, bounty, position });
        }

        if (this._logger.willLog(this.LogLevel.Debug)) {
            this._logger.log(`${this._BIG_BOUNTIES.size} total big bounties.`, this.LogLevel.Debug);
        }

        const bigBounties = Array.from(this._BIG_BOUNTIES.values()).sort((a, b) => a.bounty - b.bounty); // Ascending sort.

        for (const bountyHunter of this._ALL_BOUNTY_HUNTERS.values()) {
            bountyHunter._updateBigBountiesUI(bigBounties);
        }

        return true;
    }

    private static _clearBigBounty(victim: BountyHunter, bounty: number, killer?: BountyHunter): void {
        const wasBigBounty = this._updateBigBounties(victim, 0, this._ZERO_VECTOR);

        if (!killer || !wasBigBounty) return;

        for (const bountyHunter of this._ALL_BOUNTY_HUNTERS.values()) {
            if (bountyHunter._playerId === killer._playerId && bountyHunter._playerId === victim._playerId) continue;

            mod.DisplayHighlightedWorldLogMessage(
                mod.Message(mod.stringkeys.bountyHunter.hud.bigBountyCollected, killer._player, bounty, victim._player),
                bountyHunter._player
            );
        }
    }

    private static _getKillStreakUIParams(parent: UIContainer): UIText.Params {
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

    private static _getSpottedUIParams(parent: UIContainer): UIText.Params {
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

    private static _getAwardUIParams(player: mod.Player): UIText.Params {
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
    ): UIContainer.ChildParams<UIText.Params> {
        return {
            type: UIText,
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

    private static _getBigBountyRowUIParams(y: number): UIContainer.ChildParams<UIContainer.Params> {
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
            type: UIContainer,
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

    private static _getBigBountyUIParams(player: mod.Player): UIContainer.Params {
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

    private static _getSpottedOutlineUIParams(player: mod.Player): UIContainer.Params[] {
        return [
            {
                anchor: mod.UIAnchor.TopCenter,
                width: 3840,
                height: this._SPOTTED_OUTLINE_THICKNESS,
                bgColor: UI.COLORS.BF_RED_BRIGHT,
                bgAlpha: 0.8,
                bgFill: mod.UIBgFill.GradientTop,
                depth: mod.UIDepth.AboveGameUI,
                visible: false,
                receiver: player,
            },
            {
                anchor: mod.UIAnchor.BottomCenter,
                width: 3840,
                height: this._SPOTTED_OUTLINE_THICKNESS,
                bgColor: UI.COLORS.BF_RED_BRIGHT,
                bgAlpha: 0.8,
                bgFill: mod.UIBgFill.GradientBottom,
                depth: mod.UIDepth.AboveGameUI,
                visible: false,
                receiver: player,
            },
            {
                anchor: mod.UIAnchor.CenterLeft,
                width: this._SPOTTED_OUTLINE_THICKNESS,
                height: 2160,
                bgColor: UI.COLORS.BF_RED_BRIGHT,
                bgAlpha: 0.8,
                bgFill: mod.UIBgFill.GradientLeft,
                depth: mod.UIDepth.AboveGameUI,
                visible: false,
                receiver: player,
            },
            {
                anchor: mod.UIAnchor.CenterRight,
                width: this._SPOTTED_OUTLINE_THICKNESS,
                height: 2160,
                bgColor: UI.COLORS.BF_RED_BRIGHT,
                bgAlpha: 0.8,
                bgFill: mod.UIBgFill.GradientRight,
                depth: mod.UIDepth.AboveGameUI,
                visible: false,
                receiver: player,
            },
        ];
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
        mod.Resupply(player, mod.ResupplyTypes.AmmoCrate);

        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
            mod.DisplayHighlightedWorldLogMessage(this._SCAVENGER_LOG_MESSAGE, player);
        }
    }

    // ---- Public Static Methods ---- //

    /**
     * Attaches a logger and defines a minimum log level and whether to include the runtime error in the log.
     * @param log - The logger function to use. Pass undefined to disable logging.
     * @param logLevel - The minimum log level to use.
     * @param includeError - Whether to include the runtime error in the log.
     */
    public static setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        this._logger.setLogging(log, logLevel, includeError);
    }

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
        let leader: BountyHunter | undefined;

        for (const bountyHunter of this._ALL_BOUNTY_HUNTERS.values()) {
            if (leader && leader.points >= bountyHunter.points) continue;

            leader = bountyHunter;
        }

        return leader;
    }

    public static getFromPlayer(player: mod.Player): BountyHunter | undefined {
        return this.getFromPlayerId(mod.GetObjId(player));
    }

    public static getFromPlayerId(playerId: number): BountyHunter | undefined {
        return this._ALL_BOUNTY_HUNTERS.get(playerId);
    }

    public static handleKill(killerPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const killer = killerPlayer && this.getFromPlayer(killerPlayer);
        const victim = victimPlayer && this.getFromPlayer(victimPlayer);
        const victimIsValid = victim !== undefined && !victim._deleteIfNotValid();
        const killerIsValid = killer !== undefined && !killer._deleteIfNotValid();

        if (victimIsValid) {
            new ScavengerDrop(victimPlayer!, (player: mod.Player) => this._awardScavenger(player));
        }

        const victimKillStreak = victim?._killStreak ?? 0; // This needs to be captured before the victim's kill streak is reset.
        const bounty = this._getBounty(victimKillStreak);

        if (victim && bounty >= this._BIG_BOUNTY_THRESHOLD) {
            this._clearBigBounty(victim, bounty, killer);
        }

        if (victimIsValid) {
            victim._killStreakBeforeDeath = victim._killStreak;
            ++victim._deaths;
            victim._setKillStreak(0);
            victim._bigBountiesUI?.hide();
            victim._stopFlagging();

            mod.SetScoreboardPlayerValues(
                victimPlayer!,
                victim._points,
                victim._kills,
                victim._assists,
                victim._deaths,
                this._getBounty(0)
            );
        }

        if (this._logger.willLog(this.LogLevel.Info)) {
            this._logger.log(
                `P_${killer ? killer._playerId : 'U'} killed P_${victim ? victim._playerId : 'U'} and got ${bounty} PTS.`,
                this.LogLevel.Info
            );
        }

        if (!killerIsValid) return;

        if (killer._playerId == victim?._playerId) return;

        killer._awardBounty(victimKillStreak, bounty);
        ++killer._kills;
        killer._setKillStreak(killer._killStreak + 1);

        if (victim && !killer._isAI) {
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
        const assister = assisterPlayer && this.getFromPlayer(assisterPlayer);
        const victim = victimPlayer && this.getFromPlayer(victimPlayer);
        const assisterIsValid = assister !== undefined && !assister._deleteIfNotValid();

        // Need to handle the race condition where `handleAssist` and `handleKill` for the same victim can be called in any order.
        const killStreakBeforeDeath = victim?._killStreakBeforeDeath ?? 0;
        const killStreak = victim?._killStreak ?? 0;

        const bounty = ~~(this._getBounty(killStreak || killStreakBeforeDeath) / 2);

        if (this._logger.willLog(this.LogLevel.Info)) {
            this._logger.log(
                `P_${assister ? assister._playerId : 'U'} co-killed P_${victim ? victim._playerId : 'U'} and got ${bounty} PTS.`,
                this.LogLevel.Info
            );
        }

        if (!assisterIsValid) return;

        if (assister._playerId == victim?._playerId) return;

        assister._points += bounty;
        ++assister._assists;

        if (victim && !assister._isAI) {
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

        if (!bountyHunter) return;

        bountyHunter._killStreakBeforeDeath = 0;
        bountyHunter._bigBountiesUI?.show();
    }

    constructor(player: mod.Player) {
        this._player = player;
        this._playerId = mod.GetObjId(player);

        this._isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

        BountyHunter._ALL_BOUNTY_HUNTERS.set(this._playerId, this);

        if (this._isAI) return;

        this._selfInfoContainer = new UIContainer(BountyHunter._getSelfInfoContainerParams(player));
        this._killStreakUI = new UIText(BountyHunter._getKillStreakUIParams(this._selfInfoContainer));
        this._spottedUI = new UIText(BountyHunter._getSpottedUIParams(this._selfInfoContainer));
        this._awardUI = new UIText(BountyHunter._getAwardUIParams(player));
        this._bigBountiesUI = new UIContainer(BountyHunter._getBigBountyUIParams(player));

        this._spottedOutlineUIs = BountyHunter._getSpottedOutlineUIParams(player).map(
            (params) => new UIContainer(params)
        );
    }

    // ---- Private Variables ---- //

    private _player: mod.Player;

    private _playerId: number;

    private _selfInfoContainer?: UIContainer;

    private _killStreakUI?: UIText;

    private _spottedUI?: UIText;

    private _awardUI?: UIText;

    private _bigBountiesUI?: UIContainer;

    private _spottedOutlineUIs?: UIContainer[];

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

        if (BountyHunter._logger.willLog(BountyHunter.LogLevel.Info)) {
            BountyHunter._logger.log(
                `Spotting P_${this._playerId} for ${duration / 1_000}s.`,
                BountyHunter.LogLevel.Info
            );
        }

        if (this._isAI) return;

        this._spottedOutlineUIs?.forEach((ui) => ui.show());

        Timers.setTimeout(() => this._spottedOutlineUIs?.forEach((ui) => ui.hide()), duration);
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

        if (BountyHunter._logger.willLog(BountyHunter.LogLevel.Info)) {
            BountyHunter._logger.log(
                `Flagged P_${this._playerId} (Bounty: ${bounty} PTS).`,
                BountyHunter.LogLevel.Info
            );
        }

        BountyHunter._updateBigBounties(this, bounty, position);
    }

    private _awardBounty(victimKillStreak: number, bounty: number): void {
        this._points += bounty;

        if (this._isAI) return;

        const sound = BountyHunter._getAwardSound(victimKillStreak);

        if (sound) {
            Sounds.play2D(sound.sfxAsset, { duration: 5_000, target: this._player, amplitude: sound.amplitude });
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

        const startingIndex = availableBigBounties.length - 1;

        for (let index = BountyHunter._MAX_BIG_BOUNTIES - 1; index >= 0; --index) {
            const row = this._bigBountiesUI?.children[index] as UIContainer;

            if (index > startingIndex) {
                row.hide();
                continue;
            }

            const rowChildren = row.children as UIText[];

            const { bountyHunter, bounty, position: bountyPosition } = availableBigBounties[index];

            rowChildren[0].setMessage(mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, bounty));
            rowChildren[1].setMessage(BountyHunter._getDistanceMessage(bountyPosition, position));
            rowChildren[2].setMessage(mod.Message(bountyHunter.player));

            row.show();
        }
    }

    private _deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this._player)) return false;

        BountyHunter._logger.log(`P_${this._playerId} is no longer in the game.`, BountyHunter.LogLevel.Warning);

        this._stopFlagging();
        Timers.clearInterval(this._spottingIntervalId);
        this._killStreak = 0;
        this._selfInfoContainer?.delete();
        this._awardUI?.delete();
        this._bigBountiesUI?.delete();

        BountyHunter._updateBigBounties(this, 0, BountyHunter._ZERO_VECTOR); // TODO: Perhaps position should be undefined.

        BountyHunter._ALL_BOUNTY_HUNTERS.delete(this._playerId);

        return true;
    }
}

export namespace BountyHunter {
    export const LogLevel = Logging.LogLevel;

    export type AwardSounds = ({ sfxAsset: mod.RuntimeSpawn_Common; amplitude: number } | undefined)[];

    export type KillStreakCallInRewards = { [killStreak: number]: { gadget: mod.Gadgets; message: mod.Message } };
}
