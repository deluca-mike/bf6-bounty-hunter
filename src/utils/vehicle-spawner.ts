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
