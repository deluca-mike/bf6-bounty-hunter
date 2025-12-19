import { getRotationVector } from '../helpers/index.ts';

export async function createVehicleSpawner(
    position: mod.Vector,
    orientation: number,
    vehicleType: mod.VehicleList,
    autoSpawn: boolean,
    respawnTime: number
): Promise<mod.VehicleSpawner> {
    const spawner = mod.SpawnObject(
        mod.RuntimeSpawn_Common.VehicleSpawner,
        position,
        getRotationVector(orientation)
    ) as mod.VehicleSpawner;

    await mod.Wait(5);

    mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
    mod.SetVehicleSpawnerAutoSpawn(spawner, autoSpawn);
    mod.SetVehicleSpawnerRespawnTime(spawner, respawnTime);

    // SetVehicleSpawnerAbandonVehiclesOutOfCombatArea
    // SetVehicleSpawnerApplyDamageToAbandonVehicle
    // SetVehicleSpawnerKeepAliveAbandonRadius
    // SetVehicleSpawnerKeepAliveSpawnerRadius
    // SetVehicleSpawnerTimeUntilAbandon

    return spawner;
}
