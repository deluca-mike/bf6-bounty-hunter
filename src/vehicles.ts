import { MapDetector } from 'bf6-portal-utils/map-detector/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { Vectors } from 'bf6-portal-utils/vectors/index.ts';

export async function createVehicleSpawner(
    position: mod.Vector,
    orientation: number,
    vehicleType: mod.VehicleList,
    autoSpawn: boolean,
    respawnTime: number
): Promise<mod.VehicleSpawner> {
    return new Promise((resolve) => {
        const spawner = mod.SpawnObject(
            mod.RuntimeSpawn_Common.VehicleSpawner,
            position,
            Vectors.getRotationVector(orientation)
        ) as mod.VehicleSpawner;

        const setupVehicleSpawner = () => {
            mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
            mod.SetVehicleSpawnerAutoSpawn(spawner, autoSpawn);
            mod.SetVehicleSpawnerRespawnTime(spawner, respawnTime);

            // SetVehicleSpawnerAbandonVehiclesOutOfCombatArea
            // SetVehicleSpawnerApplyDamageToAbandonVehicle
            // SetVehicleSpawnerKeepAliveAbandonRadius
            // SetVehicleSpawnerKeepAliveSpawnerRadius
            // SetVehicleSpawnerTimeUntilAbandon
        };

        Timers.setTimeout(setupVehicleSpawner, 2_000);

        resolve(spawner);
    });
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

export function spawnVehicleSpawners(logger?: (text: string) => void): void {
    const currentMap = MapDetector.currentMap();

    if (currentMap == MapDetector.Map.Eastwood) {
        EASTWOOD_VEHICLE_SPAWNS.forEach((spawn) => {
            createVehicleSpawner(spawn.position, spawn.orientation, mod.VehicleList.GolfCart, true, 10)
                .then((spawner) => {
                    spawn.spawner = spawner;
                })
                .catch((error) => {
                    logger?.(`<SCRIPT> Error creating vehicle spawner: ${error?.toString()}`);
                });
        });
    }
}
