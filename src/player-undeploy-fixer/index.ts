import { Events } from 'bf6-portal-utils/events/index.ts';
import { Logging } from 'bf6-portal-utils/logging/index.ts';

export class PlayerUndeployFixer {
    private static readonly _MAX_TIME_TO_UNDEPLOY: number = 30;

    private static readonly _lastPlayerDeathTime: { [playerId: number]: number } = {};

    private static readonly _lastPlayerUndeployTime: { [playerId: number]: number } = {};

    private static _logger = new Logging('PUF');

    static {
        Events.OnPlayerDied.subscribe(PlayerUndeployFixer.playerDied);
        Events.OnPlayerUndeploy.subscribe(PlayerUndeployFixer.playerUndeployed);
    }

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
        PlayerUndeployFixer._logger.setLogging(log, logLevel, includeError);
    }

    public static playerDied(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        const thisDeathTime = Date.now();

        PlayerUndeployFixer._lastPlayerDeathTime[playerId] = thisDeathTime;

        mod.Wait(PlayerUndeployFixer._MAX_TIME_TO_UNDEPLOY).then(() => {
            const isSameDeathEvent = PlayerUndeployFixer._lastPlayerDeathTime[playerId] === thisDeathTime;
            const hasUndeployed = (PlayerUndeployFixer._lastPlayerUndeployTime[playerId] || 0) >= thisDeathTime;

            if (!isSameDeathEvent || hasUndeployed) return;

            PlayerUndeployFixer._logger.log(
                `P_${playerId} stuck in limbo. Forcing undeployment.`,
                PlayerUndeployFixer.LogLevel.Warning
            );

            Events.OnPlayerUndeploy.trigger(player);
        });
    }

    public static playerUndeployed(player: mod.Player): void {
        PlayerUndeployFixer._lastPlayerUndeployTime[mod.GetObjId(player)] = Date.now();
    }
}

export namespace PlayerUndeployFixer {
    export const LogLevel = Logging.LogLevel;
}
