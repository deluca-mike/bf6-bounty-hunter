import { Events } from 'bf6-portal-utils/events/index.ts';
import { FFASpawning } from 'bf6-portal-utils/ffa-spawning/index.ts';
import { MultiClickDetector } from 'bf6-portal-utils/multi-click-detector/index.ts';
import { Sounds } from 'bf6-portal-utils/sounds/index.ts';
import { MapDetector } from 'bf6-portal-utils/map-detector/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { ScavengerDrop } from 'bf6-portal-utils/scavenger-drop/index.ts';

import { UI } from 'bf6-portal-utils/ui/index.ts';

import { DebugTool } from './debug-tool/index.ts';
import { BountyHunter } from './bounty-hunter/index.ts';
import { PlayerUndeployFixer } from './player-undeploy-fixer/index.ts';
import { DropInSpawning } from './drop-in-spawning/index.ts';
import { createVehicleSpawner } from './utils/vehicle-spawner.ts';

import { getPlayerStateVectorString } from './helpers/index.ts';

import { getSpawnDataAndInitializeOptions } from './spawns.ts';

const DEBUGGING = false;

let adminDebugTool: DebugTool | undefined;
let telemetryInterval: number | undefined;
let spawnType: 'ffa' | 'dropIn' | 'default' | undefined;

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

    const logger = (text: string) => adminDebugTool?.dynamicLog(text);

    PlayerUndeployFixer.setLogging(logger, PlayerUndeployFixer.LogLevel.Warning);
    Timers.setLogging(logger, Timers.LogLevel.Warning);
    ScavengerDrop.setLogging(logger, ScavengerDrop.LogLevel.Warning);
    Sounds.setLogging(logger, Sounds.LogLevel.Warning);
    FFASpawning.setLogging(logger, FFASpawning.LogLevel.Warning);
    DropInSpawning.setLogging(logger, DropInSpawning.LogLevel.Warning);
    MultiClickDetector.setLogging(logger, MultiClickDetector.LogLevel.Warning);
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

    telemetryInterval = Timers.setInterval(() => {
        adminDebugTool?.staticLog(
            `Position: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetPosition)}`,
            1
        );

        adminDebugTool?.staticLog(
            `Facing: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetFacingDirection)}`,
            2
        );

        adminDebugTool?.staticLog(`Active timers: ${Timers.getActiveTimerCount()}`, 3);
    }, 1000);
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
        FFASpawning.Soldier.initialize(spawnInitData.spawnData, spawnInitData.spawnOptions);
        FFASpawning.Soldier.enableSpawnQueueProcessing();
        spawnType = 'ffa';
        adminDebugTool?.dynamicLog(`<SCRIPT> FFA spawn type initialized.`);
    } else if (spawnInitData.dropInData) {
        DropInSpawning.Soldier.initialize(spawnInitData.dropInData, spawnInitData.spawnOptions);
        DropInSpawning.Soldier.enableSpawnQueueProcessing();
        spawnType = 'dropIn';
        adminDebugTool?.dynamicLog(`<SCRIPT> Drop in spawn type initialized.`);
    } else {
        adminDebugTool?.dynamicLog(`<SCRIPT> No spawn data or drop in data found.`);
        spawnType = 'default';
        return;
    }

    if (MapDetector.currentMap() !== MapDetector.Map.Eastwood) return;

    EASTWOOD_VEHICLE_SPAWNS.forEach((spawn) => {
        createVehicleSpawner(spawn.position, spawn.orientation, mod.VehicleList.GolfCart, true, 10)
            .then((spawner) => {
                spawn.spawner = spawner;
            })
            .catch((error) => {
                adminDebugTool?.dynamicLog(`<SCRIPT> Error creating vehicle spawner: ${error?.toString()}`);
            });
    });
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
        spawnType === 'ffa'
            ? new FFASpawning.Soldier(player, DEBUGGING && playerId === 0)
            : new DropInSpawning.Soldier(player, DEBUGGING && playerId === 0);

    soldier.startDelayForPrompt();

    return true;
}

function handlePlayerJoinedGame(player: mod.Player): void {
    new BountyHunter(player);

    const interval = Timers.setInterval(
        () => {
            if (!createSpawningSoldier(player)) return;

            Timers.clearInterval(interval);
        },
        1_000,
        true
    );
}

function handlePlayerUndeployed(player: mod.Player): void {
    if (spawnType === 'ffa') {
        FFASpawning.Soldier.startDelayForPrompt(player);
    } else if (spawnType === 'dropIn') {
        DropInSpawning.Soldier.startDelayForPrompt(player);
    } else {
        adminDebugTool?.dynamicLog(`<SCRIPT> No spawn type found when P_${mod.GetObjId(player)} undeployed.`);
    }
}

// Event subscription needed for handling UI button events.
Events.OnPlayerUIButtonEvent.subscribe(UI.handleButtonEvent);

// Event subscriptions for the admin debug tool.
Events.OnPlayerJoinGame.subscribe(createAdminDebugTool);
Events.OnPlayerDeployed.subscribe(showTelemetry);
Events.OnPlayerUndeploy.subscribe(stopTelemetry);
Events.OnPlayerLeaveGame.subscribe(destroyAdminDebugTool);

// Event subscriptions needed for multi-click detectors.
Events.OngoingPlayer.subscribe(MultiClickDetector.handleOngoingPlayer);
Events.OnPlayerLeaveGame.subscribe(MultiClickDetector.pruneInvalidPlayers);

// Event subscriptions for game mode.
Events.OnGameModeStarted.subscribe(handleGameModeSetup);
Events.OnTimeLimitReached.subscribe(handleTimeLimitReached);
Events.OnPlayerJoinGame.subscribe(handlePlayerJoinedGame);
Events.OnPlayerEarnedKill.subscribe(
    (killer: mod.Player, victim: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock) =>
        BountyHunter.handleKill(killer, victim)
);
Events.OnPlayerDeployed.subscribe((player: mod.Player) => BountyHunter.handleDeployed(player));
Events.OnPlayerUndeploy.subscribe(handlePlayerUndeployed);
Events.OnPlayerEarnedKillAssist.subscribe((assister: mod.Player, victim: mod.Player) =>
    BountyHunter.handleAssist(assister, victim)
);
