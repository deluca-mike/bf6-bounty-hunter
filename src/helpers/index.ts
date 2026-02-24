import { Vectors } from 'bf6-portal-utils/vectors/index.ts';

export function getPlayerStateVectorString(player: mod.Player, type: mod.SoldierStateVector): string {
    return Vectors.getVectorString(mod.GetSoldierState(player, type), 2);
}
