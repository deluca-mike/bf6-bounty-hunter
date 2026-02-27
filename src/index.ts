import { Events } from 'bf6-portal-utils/events/index.ts';
import { FFADropIns } from 'bf6-portal-utils/ffa-drop-ins/index.ts';
import { FFASpawnPoints } from 'bf6-portal-utils/ffa-spawn-points/index.ts';
import { MapDetector } from 'bf6-portal-utils/map-detector/index.ts';
import { MultiClickDetector } from 'bf6-portal-utils/multi-click-detector/index.ts';
import { PlayerUndeployFixer } from 'bf6-portal-utils/player-undeploy-fixer/index.ts';
import { ScavengerDrop } from 'bf6-portal-utils/scavenger-drop/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';

import { DebugTool } from './debug-tool/index.ts';
import { BountyHunter } from './bounty-hunter/index.ts';
import { createVehicleSpawner, spawnVehicleSpawners } from './vehicles.ts';

import { getPlayerStateVectorString } from './helpers/index.ts';

import { getSpawnDataAndInitializeOptions } from './spawns.ts';

const DEBUGGING = false;

let adminDebugTool: DebugTool | undefined;
let telemetryInterval: number | undefined;
let spawnType: 'spawnPoints' | 'dropIns' | 'default' | undefined;

function createAdminDebugTool(player: mod.Player): void {
    if (!DEBUGGING) return;

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

    if (mod.GetObjId(player) != 0) return;

    const debugToolOptions: DebugTool.Options = {
        staticLogger: {
            visible: true,
        },
        dynamicLogger: {
            visible: true,
            height: 700,
        },
        debugMenu: {
            visible: false,
        },
    };

    adminDebugTool = new DebugTool(player, debugToolOptions);

    new MultiClickDetector(player, () => {
        adminDebugTool?.showDebugMenu();
    });

    adminDebugTool?.addDebugMenuButton(mod.Message(mod.stringkeys.debug.buttons.giveAIKill10), async () =>
        BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 10))
    );

    adminDebugTool?.addDebugMenuButton(mod.Message(mod.stringkeys.debug.buttons.giveAIKill20), async () =>
        BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 20))
    );

    adminDebugTool?.addDebugMenuButton(mod.Message(mod.stringkeys.debug.buttons.spawnHelicopter), async (player) => {
        await createVehicleSpawner(
            mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition),
            0,
            mod.VehicleList.AH64,
            true,
            5
        );
    });

    adminDebugTool?.addDebugMenuButton(mod.Message(mod.stringkeys.debug.buttons.spawnQuadbike), async (player) => {
        await createVehicleSpawner(
            mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition),
            0,
            mod.VehicleList.Quadbike,
            true,
            5
        );
    });

    const adminLogger = (text: string) => adminDebugTool?.dynamicLog(text);

    Events.setLogging(adminLogger, Events.LogLevel.Warning);
    FFADropIns.setLogging(adminLogger, FFADropIns.LogLevel.Warning);
    FFASpawnPoints.setLogging(adminLogger, FFASpawnPoints.LogLevel.Warning);
    MapDetector.setLogging(adminLogger, MapDetector.LogLevel.Warning);
    MultiClickDetector.setLogging(adminLogger, MultiClickDetector.LogLevel.Warning);
    PlayerUndeployFixer.setLogging(adminLogger, PlayerUndeployFixer.LogLevel.Warning);
    ScavengerDrop.setLogging(adminLogger, ScavengerDrop.LogLevel.Warning);
    Sounds.setLogging(adminLogger, Sounds.LogLevel.Warning);
    Timers.setLogging(adminLogger, Timers.LogLevel.Warning);
}

function destroyAdminDebugTool(): void {
    if (!DEBUGGING) return;

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; ++i) {
        const player = mod.ValueInArray(players, i) as mod.Player;

        if (mod.GetObjId(player) === 0) return;
    }

    Timers.clearInterval(telemetryInterval);
    adminDebugTool?.destroy();
    telemetryInterval = undefined;
    adminDebugTool = undefined;
}

function showTelemetry(player: mod.Player): void {
    if (!DEBUGGING) return;

    if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

    if (mod.GetObjId(player) != 0) return;

    const updateTelemetry = () => {
        adminDebugTool?.staticLog(
            `Position: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetPosition)}`,
            1
        );

        adminDebugTool?.staticLog(
            `Facing: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetFacingDirection)}`,
            2
        );

        adminDebugTool?.staticLog(`Active timers: ${Timers.getActiveTimerCount()}`, 3);
    };

    telemetryInterval = Timers.setInterval(updateTelemetry, 1000);
}

function stopTelemetry(player: mod.Player): void {
    if (!DEBUGGING) return;

    if (mod.GetObjId(player) != 0) return;

    Timers.clearInterval(telemetryInterval);

    adminDebugTool?.clearStaticLogger();
    adminDebugTool?.hideDebugMenu();
}

function handleGameModeSetup(): void {
    mod.SetGameModeTimeLimit(20 * 60); // 20 minutes

    BountyHunter.initialize();

    const spawnInitData = getSpawnDataAndInitializeOptions();

    if (spawnInitData.spawnData) {
        FFASpawnPoints.initialize(spawnInitData.spawnData, spawnInitData.spawnOptions);
        FFASpawnPoints.enableSpawnQueueProcessing();
        spawnType = 'spawnPoints';
        adminDebugTool?.dynamicLog(`<SCRIPT> FFA spawn type initialized.`);
    } else if (spawnInitData.dropInData) {
        FFADropIns.initialize(spawnInitData.dropInData, spawnInitData.spawnOptions);
        FFADropIns.enableSpawnQueueProcessing();
        spawnType = 'dropIns';
        adminDebugTool?.dynamicLog(`<SCRIPT> Drop in spawn type initialized.`);
    } else {
        adminDebugTool?.dynamicLog(`<SCRIPT> No spawn data or drop in data found.`);
        spawnType = 'default';
        return;
    }

    const adminLogger = (text: string) => adminDebugTool?.dynamicLog(text);

    spawnVehicleSpawners(adminLogger);
}

function handleTimeLimitReached(): void {
    if (!mod.GetMatchTimeElapsed()) return;

    const leader = BountyHunter.leader;

    if (leader) {
        mod.EndGameMode(leader.player);
    } else {
        mod.EndGameMode(mod.GetTeam(0));
    }
}

function createSpawningSoldier(player: mod.Player): boolean {
    if (!spawnType) return false;

    if (spawnType === 'default') return true;

    const playerId = mod.GetObjId(player);

    const soldier =
        spawnType === 'spawnPoints'
            ? new FFASpawnPoints.Soldier(player, DEBUGGING && playerId === 0)
            : new FFADropIns.Soldier(player, DEBUGGING && playerId === 0);

    soldier.startDelayForPrompt();

    return true;
}

function handlePlayerJoinedGame(player: mod.Player): void {
    new BountyHunter(player);

    const tryCreateSpawningSoldier = () => {
        if (!createSpawningSoldier(player)) return;

        Timers.clearInterval(interval);
    };

    const interval = Timers.setInterval(tryCreateSpawningSoldier, 1_000, true);
}

function handlePlayerUndeployed(player: mod.Player): void {
    if (spawnType === 'spawnPoints') {
        FFASpawnPoints.Soldier.startDelayForPrompt(player);
    } else if (spawnType === 'dropIns') {
        FFADropIns.Soldier.startDelayForPrompt(player);
    } else {
        adminDebugTool?.dynamicLog(`<SCRIPT> No spawn type found when P_${mod.GetObjId(player)} undeployed.`);
    }
}

// Event subscriptions for the admin debug tool.
Events.OnPlayerJoinGame.subscribe(createAdminDebugTool);
Events.OnPlayerDeployed.subscribe(showTelemetry);
Events.OnPlayerUndeploy.subscribe(stopTelemetry);
Events.OnPlayerLeaveGame.subscribe(destroyAdminDebugTool);

// Event subscriptions for game mode.
Events.OnGameModeStarted.subscribe(handleGameModeSetup);
Events.OnTimeLimitReached.subscribe(handleTimeLimitReached);
Events.OnPlayerJoinGame.subscribe(handlePlayerJoinedGame);
Events.OnPlayerEarnedKill.subscribe(BountyHunter.handleKill);
Events.OnPlayerDeployed.subscribe(BountyHunter.handleDeployed);
Events.OnPlayerUndeploy.subscribe(handlePlayerUndeployed);
Events.OnPlayerEarnedKillAssist.subscribe(BountyHunter.handleAssist);
