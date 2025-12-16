export class PlayerUndeployFixer {
    private static readonly _MAX_TIME_TO_UNDEPLOY: number = 30;

    private static readonly _lastPlayerDeathTime: { [playerId: number]: number } = {};

    private static readonly _lastPlayerUndeployTime: { [playerId: number]: number } = {};

    private static _log?: (text: string) => void;

    public static setLogging(log: (text: string) => void): void {
        this._log = log;
    }

    public static playerDied(player: mod.Player, undeployCallback: (player: mod.Player) => void): void {
        const playerId = mod.GetObjId(player);
        const thisDeathTime = mod.GetMatchTimeElapsed();

        this._lastPlayerDeathTime[playerId] = thisDeathTime;

        mod.Wait(this._MAX_TIME_TO_UNDEPLOY).then(() => {
            const isSameDeathEvent = this._lastPlayerDeathTime[playerId] === thisDeathTime;
            const hasUndeployed = (this._lastPlayerUndeployTime[playerId] || 0) >= thisDeathTime;

            if (!isSameDeathEvent || hasUndeployed) return;

            this._log?.(`<PUF> P_${playerId} stuck in limbo. Calling undeployCallback.`);

            undeployCallback(player);
        });
    }

    public static playerUndeployed(player: mod.Player): void {
        // As you noted, this must be the actual time, not MAX_INTEGER
        this._lastPlayerUndeployTime[mod.GetObjId(player)] = mod.GetMatchTimeElapsed();
    }
}
