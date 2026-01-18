import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import { UI } from 'bf6-portal-utils/ui/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';

// version: 1.0.0
export namespace DropInSpawning {
    export enum LogLevel {
        Debug = 0,
        Info = 1,
        Error = 2,
    }

    export type SpawnData = { minX: number; minZ: number; maxX: number; maxZ: number; y: number };

    export type Spawn = {
        index: number;
        spawnPoint: mod.SpawnPoint;
        location: mod.Vector;
    };

    export type InitializeOptions = {
        initialPromptDelay?: number;
        promptDelay?: number;
        queueProcessingDelay?: number;
    };

    export class Soldier {
        private static readonly _ZERO_VECTOR: mod.Vector = mod.CreateVector(0, 0, 0);

        private static readonly _ALL_SOLDIERS: { [playerId: number]: Soldier } = {};

        private static _spawns: DropInSpawning.Spawn[] = [];

        private static _spawnQueue: Soldier[] = [];

        // Time subsequent delays between prompts (in seconds).
        private static _promptDelay: number = 10;

        // Time initial delay until the player is asked to spawn (in seconds).
        private static _initialPromptDelay: number = this._promptDelay;

        // The delay between processing the spawn queue (in seconds).
        private static _queueProcessingDelay: number = 2;

        private static _queueProcessingEnabled: boolean = false;

        private static _queueProcessingActive: boolean = false;

        private static _logger?: (text: string) => void;

        private static _logLevel: DropInSpawning.LogLevel = 2;

        private static _log(logLevel: DropInSpawning.LogLevel, text: string): void {
            if (logLevel < this._logLevel) return;

            this._logger?.(`<DIS> ${text}`);
        }

        private static _createRandomSpawnPoint(
            spawnData: DropInSpawning.SpawnData,
            index: number
        ): DropInSpawning.Spawn {
            const location = mod.CreateVector(
                mod.RandomReal(spawnData.minX, spawnData.maxX),
                spawnData.y,
                mod.RandomReal(spawnData.minZ, spawnData.maxZ)
            );

            const spawnPoint = mod.SpawnObject(
                mod.RuntimeSpawn_Common.PlayerSpawner,
                location,
                this._ZERO_VECTOR
            ) as mod.SpawnPoint;

            return {
                index,
                spawnPoint,
                location,
            };
        }

        private static _processSpawnQueue(): void {
            this._queueProcessingActive = true;

            if (!this._queueProcessingEnabled) {
                this._queueProcessingActive = false;
                return;
            }

            this._log(DropInSpawning.LogLevel.Debug, `Processing ${this._spawnQueue.length} in queue.`);

            if (this._spawnQueue.length == 0) {
                this._log(DropInSpawning.LogLevel.Debug, `No players in queue. Suspending processing.`);
                this._queueProcessingActive = false;
                return;
            }

            while (this._spawnQueue.length > 0) {
                const soldier = this._spawnQueue.shift();

                if (!soldier || soldier._deleteIfNotValid()) continue;

                const spawn = this._spawns[Math.floor(Math.random() * this._spawns.length)];

                this._log(
                    DropInSpawning.LogLevel.Debug,
                    `Spawning P_${soldier._playerId} at ${this.getVectorString(spawn.location)}.`
                );

                mod.SpawnPlayerFromSpawnPoint(soldier._player, spawn.spawnPoint);

                if (soldier._isAISoldier) {
                    Timers.setTimeout(() => mod.AIParachuteBehavior(soldier._player), 2_000);
                }
            }

            Timers.setTimeout(() => this._processSpawnQueue(), this._queueProcessingDelay * 1000);
        }

        private static _getPosition(player: mod.Player): { x: number; y: number; z: number } {
            if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) return { x: 0, y: 0, z: 0 };

            const position = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);

            return {
                x: ~~(mod.XComponentOf(position) * 100),
                y: ~~(mod.YComponentOf(position) * 100),
                z: ~~(mod.ZComponentOf(position) * 100),
            };
        }

        public static getVectorString(vector: mod.Vector): string {
            return `<${mod.XComponentOf(vector).toFixed(2)}, ${mod.YComponentOf(vector).toFixed(2)}, ${mod
                .ZComponentOf(vector)
                .toFixed(2)}>`;
        }

        // Attaches a logger and defines a minimum log level.
        public static setLogging(log?: (text: string) => void, logLevel?: DropInSpawning.LogLevel): void {
            this._logger = log;
            this._logLevel = logLevel ?? DropInSpawning.LogLevel.Info;
        }

        // Should be called in the `OnGameModeStarted()` event.
        public static initialize(
            spawnData: DropInSpawning.SpawnData,
            options?: DropInSpawning.InitializeOptions
        ): void {
            mod.EnableHQ(mod.GetHQ(1), false);
            mod.EnableHQ(mod.GetHQ(2), false);

            this._spawns = Array.from({ length: 32 }, (_, index) => this._createRandomSpawnPoint(spawnData, index));

            this._initialPromptDelay = options?.initialPromptDelay ?? this._initialPromptDelay;
            this._promptDelay = options?.promptDelay ?? this._promptDelay;
            this._queueProcessingDelay = options?.queueProcessingDelay ?? this._queueProcessingDelay;

            this._log(DropInSpawning.LogLevel.Info, `Initialized with ${this._spawns.length} spawn points.`);
        }

        // Starts the countdown before prompting the player to spawn or delay again, usually in the `OnPlayerJoinGame()` and `OnPlayerUndeploy()` events.
        // AI soldiers will skip the countdown and spawn immediately.
        public static startDelayForPrompt(player: mod.Player): void {
            this._log(DropInSpawning.LogLevel.Debug, `Start delay request for P_${mod.GetObjId(player)}.`);

            const soldier = this._ALL_SOLDIERS[mod.GetObjId(player)];

            if (!soldier || soldier._deleteIfNotValid()) return;

            soldier.startDelayForPrompt();
        }

        // Forces a player to be added to the spawn queue, skipping the countdown and prompt.
        public static forceIntoQueue(player: mod.Player): void {
            if (!mod.IsPlayerValid(player)) return;

            const soldier = this._ALL_SOLDIERS[mod.GetObjId(player)];

            if (!soldier || soldier._deleteIfNotValid()) return;

            soldier._addToQueue();
        }

        // Enables the processing of the spawn queue.
        public static enableSpawnQueueProcessing(): void {
            if (this._queueProcessingEnabled) return;

            this._queueProcessingEnabled = true;
            this._processSpawnQueue();
        }

        // Disables the processing of the spawn queue.
        public static disableSpawnQueueProcessing(): void {
            this._queueProcessingEnabled = false;
        }

        // Every player that should be handled by this spawning system should be instantiated as a `DropInSpawning`, usually in the `OnPlayerSpawned()` event.
        constructor(player: mod.Player, showDebugPosition: boolean = false) {
            this._player = player;
            this._playerId = mod.GetObjId(player);

            Soldier._ALL_SOLDIERS[this._playerId] = this;

            this._isAISoldier = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

            if (this._isAISoldier) return;

            const [delayCountdown, setDelayCountdown] = SolidUI.createSignal(-1);

            this._delayCountdown = { get: delayCountdown, set: setDelayCountdown };

            this._promptUI = SolidUI.h(UI.Container, {
                x: 0,
                y: 0,
                width: 440,
                height: 140,
                anchor: mod.UIAnchor.Center,
                visible: () => delayCountdown() === 0,
                bgColor: UI.COLORS.BF_GREY_4,
                bgAlpha: 0.5,
                bgFill: mod.UIBgFill.Blur,
                receiver: player,
                uiInputModeWhenVisible: true,
            });

            SolidUI.h(UI.TextButton, {
                parent: this._promptUI,
                x: 0,
                y: 20,
                width: 400,
                height: 40,
                anchor: mod.UIAnchor.TopCenter,
                bgColor: UI.COLORS.BF_GREY_2,
                baseColor: UI.COLORS.BF_GREY_2,
                baseAlpha: 1,
                pressedColor: UI.COLORS.BF_GREEN_DARK,
                pressedAlpha: 1,
                hoverColor: UI.COLORS.BF_GREY_1,
                hoverAlpha: 1,
                focusedColor: UI.COLORS.BF_GREY_1,
                focusedAlpha: 1,
                message: mod.Message(mod.stringkeys.dropInSpawning.buttons.spawn),
                textSize: 30,
                textColor: UI.COLORS.BF_GREEN_BRIGHT,
                onClick: async (player: mod.Player): Promise<void> => this._addToQueue(),
            });

            SolidUI.h(UI.TextButton, {
                parent: this._promptUI,
                x: 0,
                y: 80,
                width: 400,
                height: 40,
                anchor: mod.UIAnchor.TopCenter,
                bgColor: UI.COLORS.BF_GREY_2,
                baseColor: UI.COLORS.BF_GREY_2,
                baseAlpha: 1,
                pressedColor: UI.COLORS.BF_YELLOW_DARK,
                pressedAlpha: 1,
                hoverColor: UI.COLORS.BF_GREY_1,
                hoverAlpha: 1,
                focusedColor: UI.COLORS.BF_GREY_1,
                focusedAlpha: 1,
                message: mod.Message(mod.stringkeys.dropInSpawning.buttons.delay, Soldier._promptDelay),
                textSize: 30,
                textColor: UI.COLORS.BF_YELLOW_BRIGHT,
                onClick: async (player: mod.Player): Promise<void> => this.startDelayForPrompt(Soldier._promptDelay),
            });

            this._countdownUI = SolidUI.h(UI.Text, {
                x: 0,
                y: 60,
                width: 400,
                height: 50,
                anchor: mod.UIAnchor.TopCenter,
                message: () => mod.Message(mod.stringkeys.dropInSpawning.countdown, delayCountdown()),
                textSize: 30,
                textColor: UI.COLORS.BF_GREEN_BRIGHT,
                bgColor: UI.COLORS.BF_GREY_4,
                bgAlpha: 0.5,
                bgFill: mod.UIBgFill.Solid,
                visible: () => delayCountdown() > 0,
                receiver: player,
            });

            if (showDebugPosition) {
                const [playerPosition, setPlayerPosition] = SolidUI.createStore({ x: 0, y: 0, z: 0 });

                this._updatePositionInterval = Timers.setInterval(() => {
                    setPlayerPosition((state) => {
                        const { x, y, z } = Soldier._getPosition(player);
                        state.x = x;
                        state.y = y;
                        state.z = z;
                    });
                }, 1_000);

                this._debugPositionUI = SolidUI.h(UI.Text, {
                    width: 360,
                    height: 26,
                    anchor: mod.UIAnchor.BottomCenter,
                    message: () =>
                        mod.Message(
                            mod.stringkeys.dropInSpawning.debug.position,
                            playerPosition.x,
                            playerPosition.y,
                            playerPosition.z
                        ),
                    textSize: 20,
                    textColor: UI.COLORS.BF_GREEN_BRIGHT,
                    bgColor: UI.COLORS.BF_GREY_4,
                    bgAlpha: 0.75,
                    bgFill: mod.UIBgFill.Blur,
                    receiver: player,
                });
            }
        }

        private _player: mod.Player;

        private _playerId: number;

        private _isAISoldier: boolean;

        private _delayCountdown: { get: () => number; set: (value: number) => void } = { get: () => -1, set: () => {} };

        private _delayCountdownInterval?: number;

        private _promptUI?: UI.Container;

        private _countdownUI?: UI.Text;

        private _updatePositionInterval?: number;

        private _debugPositionUI?: UI.Text;

        public get player(): mod.Player {
            return this._player;
        }

        public get playerId(): number {
            return this._playerId;
        }

        // Starts the countdown before prompting the player to spawn or delay again, usually in the `OnPlayerJoinGame()` and `OnPlayerUndeploy()` events.
        // AI soldiers will skip the countdown and spawn immediately.
        public startDelayForPrompt(delay: number = Soldier._initialPromptDelay): void {
            if (this._isAISoldier) return this._addToQueue();

            Soldier._log(DropInSpawning.LogLevel.Debug, `Starting ${delay}s delay for P_${this._playerId}.`);

            if (delay <= 0) return this._addToQueue();

            this._delayCountdown.set(delay);

            Timers.clearInterval(this._delayCountdownInterval);
            this._delayCountdownInterval = Timers.setInterval(() => this._handleDelayCountdown(), 1_000);
        }

        private _handleDelayCountdown(): void {
            if (this._deleteIfNotValid()) return;

            const timeLeft = this._delayCountdown.get();

            if (timeLeft > 0) return this._delayCountdown.set(timeLeft - 1);

            Timers.clearInterval(this._delayCountdownInterval);
        }

        private _addToQueue(): void {
            if (!this._isAISoldier) {
                this._delayCountdown.set(-1);
            }

            Soldier._spawnQueue.push(this);

            Soldier._log(
                DropInSpawning.LogLevel.Debug,
                `P_${this._playerId} added to queue (${Soldier._spawnQueue.length} total).`
            );

            if (!Soldier._queueProcessingEnabled || Soldier._queueProcessingActive) return;

            Soldier._log(DropInSpawning.LogLevel.Debug, `Restarting spawn queue processing.`);
            Soldier._processSpawnQueue();
        }

        private _deleteIfNotValid(): boolean {
            if (mod.IsPlayerValid(this._player)) return false;

            Soldier._log(DropInSpawning.LogLevel.Info, `P_${this._playerId} is no longer valid.`);

            Timers.clearInterval(this._delayCountdownInterval);
            Timers.clearInterval(this._updatePositionInterval);

            this._promptUI?.delete();
            this._countdownUI?.delete();
            this._debugPositionUI?.delete();

            delete Soldier._ALL_SOLDIERS[this._playerId];

            return true;
        }
    }
}
