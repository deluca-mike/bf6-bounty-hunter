import { Timers } from 'bf6-portal-utils/timers/index.ts';

import { getVectorString } from '../helpers/index.ts';

export namespace Scavenger {
    export enum LogLevel {
        Debug = 0,
        Info = 1,
        Error = 2,
    }

    const _DURATION: number = 37_000; // 37 seconds

    const _CHECK_INTERVAL: number = 200; // 0.2 seconds

    let _logger: ((text: string) => void) | undefined;

    let _logLevel: Scavenger.LogLevel = LogLevel.Info;

    function _log(logLevel: Scavenger.LogLevel, text: string): void {
        if (_logLevel >= logLevel) {
            _logger?.(text);
        }
    }

    export function setLogging(logger?: (text: string) => void, logLevel?: Scavenger.LogLevel): void {
        _logger = logger;
        _logLevel = logLevel ?? Scavenger.LogLevel.Info;
    }

    export function createDrop(body: mod.Player, onScavenge: (player: mod.Player) => void): void {
        const position = mod.GetSoldierState(body, mod.SoldierStateVector.GetPosition);

        let checkTickDown = 1; // First check will be in 1 `_CHECK_INTERVAL` tick.

        const checkInterval = Timers.setInterval(() => {
            if (--checkTickDown > 0) return; // Skip

            const closestScavenger = mod.ClosestPlayerTo(position);

            if (!mod.IsPlayerValid(closestScavenger)) {
                checkTickDown = 10; // Check back in 10 ticks.
                return;
            }

            const distance = mod.DistanceBetween(
                position,
                mod.GetSoldierState(closestScavenger, mod.SoldierStateVector.GetPosition)
            );

            // If closest scavenger is too far, check again in a few ticks, scaled by distance.
            if (distance > 2) {
                checkTickDown = Math.min(10, Math.max(1, Math.floor(distance / 4)));
                return;
            }

            Timers.clearInterval(checkInterval);
            Timers.clearInterval(endTimeout);
            onScavenge(closestScavenger);
            _log(LogLevel.Info, `Scavenger P-${mod.GetObjId(closestScavenger)} found drop.`);
        }, _CHECK_INTERVAL);

        const endTimeout = Timers.setTimeout(() => {
            Timers.clearInterval(checkInterval);
            _log(LogLevel.Debug, `Scavenger drop timed out.`);
        }, _DURATION);

        _log(LogLevel.Debug, `Scavenger drop created at ${getVectorString(position)}.`);
    }
}
