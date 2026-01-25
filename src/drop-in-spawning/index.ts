import { SolidUI } from 'bf6-portal-utils/solid-ui/index.ts';
import { Timers } from 'bf6-portal-utils/timers/index.ts';
import { Logging } from 'bf6-portal-utils/logging/index.ts';

import { UI } from 'bf6-portal-utils/ui/index.ts';
import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UITextButton } from 'bf6-portal-utils/ui/components/text-button/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';

// version: 1.0.0
export namespace DropInSpawning {
    const logger = new Logging('DIS');

    /**
     * Log levels for controlling logging verbosity.
     */
    export const LogLevel = Logging.LogLevel;

    /**
     * Attaches a logger and defines a minimum log level and whether to include the runtime error in the log.
     * @param log - The logger function to use. Pass undefined to disable logging.
     * @param logLevel - The minimum log level to use.
     * @param includeError - Whether to include the runtime error in the log.
     */
    export function setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        logger.setLogging(log, logLevel, includeError);
    }

    export type SpawnRectangle = {
        minX: number;
        minZ: number;
        maxX: number;
        maxZ: number;
    };

    interface Point {
        x: number;
        z: number;
    }

    class SpawnRegion {
        private rectangles: SpawnRectangle[] = [];
        private cumulativeAreas: number[] = [];
        private totalArea: number = 0;

        constructor(zones: SpawnRectangle[]) {
            if (!zones || zones.length === 0) {
                throw new Error('SpawnRegion must be initialized with at least one rectangle.');
            }

            // Pre-calculate areas and weights
            for (const zone of zones) {
                // Ensure min is actually smaller than max to prevent negative areas
                const width = Math.abs(zone.maxX - zone.minX);
                const depth = Math.abs(zone.maxZ - zone.minZ);
                const area = width * depth;

                if (area <= 0) continue;

                // Only add zones that actually have size
                this.rectangles.push(zone);
                this.totalArea += area;
                this.cumulativeAreas.push(this.totalArea);
            }
        }

        private _randomFloat(min: number, max: number): number {
            return min + Math.random() * (max - min);
        }

        /**
         * Returns a random X/Z coordinate uniformly distributed across all zones.
         * Time Complexity: O(log N) where N is the number of rectangles.
         */
        public getSpawnPoint(): Point {
            // 1. Select which Rectangle to spawn in based on Area Weight
            // (Larger rectangles get picked more often)
            const randomValue = Math.random() * this.totalArea;

            // Binary Search to find the rectangle index
            let low = 0;
            let high = this.cumulativeAreas.length - 1;
            let selectedIndex = -1;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);

                if (this.cumulativeAreas[mid] >= randomValue) {
                    selectedIndex = mid;
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            }

            const rectangle = this.rectangles[selectedIndex];

            return {
                x: this._randomFloat(rectangle.minX, rectangle.maxX),
                z: this._randomFloat(rectangle.minZ, rectangle.maxZ),
            };
        }
    }

    export type SpawnData = { spawnRectangles: SpawnRectangle[]; y: number };

    export type Spawn = {
        index: number;
        spawnPoint: mod.SpawnPoint;
        location: mod.Vector;
    };

    export type InitializeOptions = {
        dropInPoints?: number;
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

        private static _createRandomSpawnPoint(
            spawnRegion: SpawnRegion,
            y: number,
            index: number
        ): DropInSpawning.Spawn {
            const { x, z } = spawnRegion.getSpawnPoint();
            const location = mod.CreateVector(x, y, z);

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

            if (logger.willLog(LogLevel.Debug)) {
                logger.log(`Processing ${this._spawnQueue.length} in queue.`, LogLevel.Debug);
            }

            if (this._spawnQueue.length == 0) {
                if (logger.willLog(LogLevel.Debug)) {
                    logger.log(`No players in queue. Suspending processing.`, LogLevel.Debug);
                }

                this._queueProcessingActive = false;
                return;
            }

            while (this._spawnQueue.length > 0) {
                const soldier = this._spawnQueue.shift();

                if (!soldier || soldier._deleteIfNotValid()) continue;

                const spawn = this._spawns[Math.floor(Math.random() * this._spawns.length)];

                if (logger.willLog(LogLevel.Debug)) {
                    logger.log(
                        `Spawning P_${soldier._playerId} at ${this.getVectorString(spawn.location)}.`,
                        LogLevel.Debug
                    );
                }

                mod.SpawnPlayerFromSpawnPoint(soldier._player, spawn.spawnPoint);
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

        // Should be called in the `OnGameModeStarted()` event.
        public static initialize(
            spawnData: DropInSpawning.SpawnData,
            options?: DropInSpawning.InitializeOptions
        ): void {
            mod.EnableHQ(mod.GetHQ(1), false);
            mod.EnableHQ(mod.GetHQ(2), false);

            const spawnRegion = new SpawnRegion(spawnData.spawnRectangles);

            if (logger.willLog(LogLevel.Info)) {
                logger.log(`Using ${spawnData.spawnRectangles.length} drop-in rectangles.`, LogLevel.Info);
            }

            const dropInPoints = options?.dropInPoints ?? 64;

            this._spawns = Array.from({ length: dropInPoints }, (_, index) =>
                this._createRandomSpawnPoint(spawnRegion, spawnData.y, index)
            );

            this._initialPromptDelay = options?.initialPromptDelay ?? this._initialPromptDelay;
            this._promptDelay = options?.promptDelay ?? this._promptDelay;
            this._queueProcessingDelay = options?.queueProcessingDelay ?? this._queueProcessingDelay;

            if (logger.willLog(LogLevel.Info)) {
                logger.log(`Initialized with ${dropInPoints} drop-in spawn points.`, LogLevel.Info);
            }
        }

        // Starts the countdown before prompting the player to spawn or delay again, usually in the `OnPlayerJoinGame()` and `OnPlayerUndeploy()` events.
        // AI soldiers will skip the countdown and spawn immediately.
        public static startDelayForPrompt(player: mod.Player): void {
            if (logger.willLog(LogLevel.Debug)) {
                logger.log(`Start delay request for P_${mod.GetObjId(player)}.`, LogLevel.Debug);
            }

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

            this._promptUI = SolidUI.h(UIContainer, {
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

            SolidUI.h(UITextButton, {
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

            SolidUI.h(UITextButton, {
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

            this._countdownUI = SolidUI.h(UIText, {
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

                this._debugPositionUI = SolidUI.h(UIText, {
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

        private _promptUI?: UIContainer;

        private _countdownUI?: UIText;

        private _updatePositionInterval?: number;

        private _debugPositionUI?: UIText;

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

            if (logger.willLog(LogLevel.Debug)) {
                logger.log(`Starting ${delay}s delay for P_${this._playerId}.`, LogLevel.Debug);
            }

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

            if (logger.willLog(LogLevel.Debug)) {
                logger.log(`P_${this._playerId} added to queue (${Soldier._spawnQueue.length} total).`, LogLevel.Debug);
            }

            if (!Soldier._queueProcessingEnabled || Soldier._queueProcessingActive) return;

            if (logger.willLog(LogLevel.Debug)) {
                logger.log(`Restarting spawn queue processing.`, LogLevel.Debug);
            }

            Soldier._processSpawnQueue();
        }

        private _deleteIfNotValid(): boolean {
            if (mod.IsPlayerValid(this._player)) return false;

            logger.log(`P_${this._playerId} is no longer valid.`, LogLevel.Warning);

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
