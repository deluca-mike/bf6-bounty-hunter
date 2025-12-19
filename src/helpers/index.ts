export function getPlayerStateVectorString(player: mod.Player, type: mod.SoldierStateVector): string {
    return getVectorString(mod.GetSoldierState(player, type));
}

export function getVectorString(vector: mod.Vector): string {
    return `<${mod.XComponentOf(vector).toFixed(2)}, ${mod.YComponentOf(vector).toFixed(2)}, ${mod.ZComponentOf(vector).toFixed(2)}>`;
}

export function getRotationVector(orientation: number): mod.Vector {
    return mod.CreateVector(0, mod.DegreesToRadians(180 - orientation), 0);
}
