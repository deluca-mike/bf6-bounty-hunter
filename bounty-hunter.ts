class UI {

    private static readonly CLICK_HANDLERS = new Map<string, (player: mod.Player) => Promise<void>>();

    public static readonly COLORS = {
        BLACK: mod.CreateVector(0, 0, 0),
        GREY_25: mod.CreateVector(0.25, 0.25, 0.25),
        GREY_50: mod.CreateVector(0.5, 0.5, 0.5),
        GREY_75: mod.CreateVector(0.75, 0.75, 0.75),
        WHITE: mod.CreateVector(1, 1, 1),
        RED: mod.CreateVector(1, 0, 0),
        GREEN: mod.CreateVector(0, 1, 0),
        BLUE: mod.CreateVector(0, 0, 1),
        YELLOW: mod.CreateVector(1, 1, 0),
        PURPLE: mod.CreateVector(1, 0, 1),
        CYAN: mod.CreateVector(0, 1, 1),
        MAGENTA: mod.CreateVector(1, 0, 1),
    };

    private static rootNode: UI.Node;

    private static counter: number = 0;

    public static root(): UI.Node {
        if (UI.rootNode) return UI.rootNode;

        UI.rootNode = {
            type: UI.Type.Root,
            name: 'ui_root',
            uiWidget: () => mod.GetUIRoot(),
        };

        return UI.rootNode;
    }

    public static createContainer(params: UI.ContainerParams, receiver?: mod.Player | mod.Team): UI.Container {
        const parent = UI.parseNode(params.parent);
        const name = params.name ?? UI.makeName(parent, receiver);
    
        const args: [
            string,
            mod.Vector,
            mod.Vector,
            mod.UIAnchor,
            mod.UIWidget,
            boolean,
            number,
            mod.Vector,
            number,
            mod.UIBgFill,
            mod.UIDepth,
        ] = [
            name,
            mod.CreateVector(params.x ?? 0, params.y ?? 0, 0),
            mod.CreateVector(params.width ?? 0, params.height ?? 0, 0),
            params.anchor ?? mod.UIAnchor.Center,
            parent.uiWidget(),
            params.visible ?? true,
            params.padding ?? 0,
            params.bgColor ?? UI.COLORS.BLACK,
            params.bgAlpha ?? 1,
            params.bgFill ?? mod.UIBgFill.Solid,
            params.depth ?? mod.UIDepth.AboveGameUI,
        ];
    
        if (receiver == undefined) {
            mod.AddUIContainer(...args);
        } else {
            mod.AddUIContainer(...args, receiver);
        }

        const uiWidget = () => mod.FindUIWidgetWithName(name) as mod.UIWidget;

        const container = {
            type: UI.Type.Container,
            name: name,
            uiWidget: uiWidget,
            parent: parent,
            children: [] as (UI.Container | UI.Text | UI.Button)[],
            isVisible: () => mod.GetUIWidgetVisible(uiWidget()),
            show: () => mod.SetUIWidgetVisible(uiWidget(), true),
            hide: () => mod.SetUIWidgetVisible(uiWidget(), false),
            delete: () => mod.DeleteUIWidget(uiWidget()),
            getPosition: () => UI.getPosition(uiWidget()),
            setPosition: (x: number, y: number) => mod.SetUIWidgetPosition(uiWidget(), mod.CreateVector(x, y, 0)),
        };

        for (const childParams of params.childrenParams ?? []) {
            childParams.parent = container;

            const child =
                childParams.type === 'container' ? UI.createContainer(childParams) :
                childParams.type === 'text' ? UI.createText(childParams) :
                childParams.type === 'button' ? UI.createButton(childParams as UI.ButtonParams) :
                undefined;

            if (!child) continue;

            container.children.push(child);
        }
    
        return container;
    }

    public static createText(params: UI.TextParams, receiver?: mod.Player | mod.Team): UI.Text {
        const parent = UI.parseNode(params.parent);
        const name = params.name ?? UI.makeName(parent, receiver);
    
        const args: [
            string,
            mod.Vector,
            mod.Vector,
            mod.UIAnchor,
            mod.UIWidget,
            boolean,
            number,
            mod.Vector,
            number,
            mod.UIBgFill,
            mod.Message,
            number,
            mod.Vector,
            number,
            mod.UIAnchor,
            mod.UIDepth,
        ] = [
            name,
            mod.CreateVector(params.x ?? 0, params.y ?? 0, 0),
            mod.CreateVector(params.width ?? 0, params.height ?? 0, 0),
            params.anchor ?? mod.UIAnchor.Center,
            parent.uiWidget(),
            params.visible ?? true,
            params.padding ?? 0,
            params.bgColor ?? UI.COLORS.WHITE,
            params.bgAlpha ?? 0,
            params.bgFill ?? mod.UIBgFill.None,
            params.message ?? mod.Message(""),
            params.textSize ?? 36,
            params.textColor ?? UI.COLORS.BLACK,
            params.textAlpha ?? 1,
            params.textAnchor ?? mod.UIAnchor.Center,
            params.depth ?? mod.UIDepth.AboveGameUI,
        ];
    
        if (receiver == undefined) {
            mod.AddUIText(...args);
        } else {
            mod.AddUIText(...args, receiver);
        }
    
        const uiWidget = () => mod.FindUIWidgetWithName(name) as mod.UIWidget;

        return {
            type: UI.Type.Text,
            name: name,
            uiWidget: uiWidget,
            parent: parent,
            isVisible: () => mod.GetUIWidgetVisible(uiWidget()),
            show: () => mod.SetUIWidgetVisible(uiWidget(), true),
            hide: () => mod.SetUIWidgetVisible(uiWidget(), false),
            delete: () => mod.DeleteUIWidget(uiWidget()),
            getPosition: () => UI.getPosition(uiWidget()),
            setPosition: (x: number, y: number) => mod.SetUIWidgetPosition(uiWidget(), mod.CreateVector(x, y, 0)),
            setMessage: (message: mod.Message) => mod.SetUITextLabel(uiWidget(), message),
        };
    }

    public static createButton(params: UI.ButtonParams, receiver?: mod.Player | mod.Team): UI.Button {
        const parent = UI.parseNode(params.parent);
    
        const containerParams: UI.ContainerParams = {
            x: params.x,
            y: params.y,
            width: params.width,
            height: params.height,
            anchor: params.anchor,
            parent: parent,
            visible: params.visible,
            padding: 0,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            depth: params.depth,
        };
    
        const container = UI.createContainer(containerParams, receiver);
        const buttonName = params.name ?? `${container.name}_button`;

        const containerUiWidget = container.uiWidget();
    
        mod.AddUIButton(
            buttonName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(params.width ?? 0, params.height ?? 0, 0),
            params.anchor ?? mod.UIAnchor.Center,
            containerUiWidget,
            true,
            params.padding ?? 0,
            params.bgColor ?? UI.COLORS.BLACK,
            params.bgAlpha ?? 1,
            params.bgFill ?? mod.UIBgFill.Solid,
            params.buttonEnabled ?? true,
            params.baseColor ?? UI.COLORS.WHITE,
            params.baseAlpha ?? 1,
            params.disabledColor ?? UI.COLORS.GREY_50,
            params.disabledAlpha ?? 1,
            params.pressedColor ?? UI.COLORS.GREEN,
            params.pressedAlpha ?? 1,
            params.hoverColor ?? UI.COLORS.CYAN,
            params.hoverAlpha ?? 1,
            params.focusedColor ?? UI.COLORS.YELLOW,
            params.focusedAlpha ?? 1,
            params.depth ?? mod.UIDepth.AboveGameUI,
        );
    
        if (params.onClick) {
            UI.CLICK_HANDLERS.set(buttonName, params.onClick);
        }
    
        const buttonUiWidget = () => mod.FindUIWidgetWithName(buttonName) as mod.UIWidget;

        const button: UI.Button = {
            type: UI.Type.Button,
            name: container.name,
            uiWidget: () => containerUiWidget,
            parent: container.parent,
            buttonName: buttonName,
            buttonUiWidget: buttonUiWidget,
            isVisible: () => mod.GetUIWidgetVisible(containerUiWidget),
            show: () => mod.SetUIWidgetVisible(containerUiWidget, true),
            hide: () => mod.SetUIWidgetVisible(containerUiWidget, false),
            delete: () => mod.DeleteUIWidget(containerUiWidget),
            getPosition: () => UI.getPosition(containerUiWidget),
            setPosition: (x: number, y: number) => mod.SetUIWidgetPosition(containerUiWidget, mod.CreateVector(x, y, 0)),
            isEnabled: () => mod.GetUIButtonEnabled(buttonUiWidget()),
            enable: () => mod.SetUIButtonEnabled(buttonUiWidget(), true),
            disable: () => mod.SetUIButtonEnabled(buttonUiWidget(), false),
        };

        if (!params.label) return button;

        const label = UI.createText({
            ...params.label,
            name: `${button.name}_label`,
            parent: button.uiWidget(),
            width: params.width,
            height: params.height,
            visible: true,
            depth: params.depth,
        });
    
        button.labelName = `${container.name}_label`;
        button.labelUiWidget = label.uiWidget;
        button.setLabelMessage = label.setMessage;
    
        return button;
    }

    public static async handleButtonClick(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): Promise<void> {
        // NOTE: mod.UIButtonEvent is currently broken or undefined, so we're not using it for now.
        // if (event != mod.UIButtonEvent.ButtonUp) return;

        const clickHandler = UI.CLICK_HANDLERS.get(mod.GetUIWidgetName(widget));

        if (!clickHandler) return;

        await clickHandler(player);
    }

    public static parseNode(node?: UI.Node | mod.UIWidget): UI.Node {
        if (!node) return UI.root();
        
        if (node.hasOwnProperty('uiWidget')) return node as UI.Node;

        return {
            type: UI.Type.Unknown,
            name: 'ui_unknown',
            uiWidget: () => node as mod.UIWidget,
        };
    }

    private static makeName(parent: UI.Node, receiver?: mod.Player | mod.Team): string {
        return `${parent.name}${receiver ? `_${mod.GetObjId(receiver)}` : ''}_${UI.counter++}`;
    }

    private static getPosition(widget: mod.UIWidget): { x: number, y: number } {
        const position = mod.GetUIWidgetPosition(widget);
        return { x: mod.XComponentOf(position), y: mod.YComponentOf(position) };
    }
}

namespace UI {

    export enum Type {
        Root = "root",
        Container = "container",
        Text = "text",
        Button = "button",
        Unknown = "unknown",
    }

    export type Node = {
        type: Type,
        name: string,
        uiWidget: () => mod.UIWidget,
    }

    export type Element = Node & {
        parent: Node,
        isVisible: () => boolean,
        show: () => void,
        hide: () => void,
        delete: () => void,
        getPosition: () => { x: number, y: number },
        setPosition: (x: number, y: number) => void,
    }

    export type Container = Element & {
        children: (Container | Text | Button)[],
    }
    
    export type Text = Element & {
        setMessage: (message: mod.Message) => void,
    }
    
    export type Button = Element & {
        buttonName: string,
        buttonUiWidget: () => mod.UIWidget,
        isEnabled: () => boolean,
        enable: () => void,
        disable: () => void,
        labelName?: string,
        labelUiWidget?: () => mod.UIWidget,
        setLabelMessage?: (message: mod.Message) => void,
    }

    interface Params {
        type?: Type,
        name?: string,
        x?: number,
        y?: number,
        width?: number,
        height?: number,
        anchor?: mod.UIAnchor,
        parent?: mod.UIWidget | Node,
        visible?: boolean,
        padding?: number,
        bgColor?: mod.Vector,
        bgAlpha?: number,
        bgFill?: mod.UIBgFill,
        depth?: mod.UIDepth,
    }

    export interface ContainerParams extends Params {
        childrenParams?: (ContainerParams | TextParams | ButtonParams)[],
    }

    export interface TextParams extends Params {
        message?: mod.Message,
        textSize?: number,
        textColor?: mod.Vector,
        textAlpha?: number,
        textAnchor?: mod.UIAnchor,
    }

    export interface LabelParams {
        message?: mod.Message,
        textSize?: number,
        textColor?: mod.Vector,
        textAlpha?: number,
    }

    export interface ButtonParams extends Params {
        buttonEnabled?: boolean,
        baseColor?: mod.Vector,
        baseAlpha?: number,
        disabledColor?: mod.Vector,
        disabledAlpha?: number,
        pressedColor?: mod.Vector,
        pressedAlpha?: number,
        hoverColor?: mod.Vector,
        hoverAlpha?: number,
        focusedColor?: mod.Vector,
        focusedAlpha?: number,
        onClick?: (player: mod.Player) => Promise<void>,
        label?: LabelParams,
    }

}

class Logger {

    static readonly PADDING: number = 10;

    constructor(
        player: mod.Player,
        options?: Logger.Options
    ) {
        this.width = options?.width ?? 400;
        this.height = options?.height ?? 300;
        this.textColor = options?.textColor ?? UI.COLORS.GREEN;

        this.window = UI.createContainer({
            x: options?.x ?? 10,
            y: options?.y ?? 10,
            width: this.width,
            height: this.height,
            parent: options?.parent,
            anchor: options?.anchor ?? mod.UIAnchor.TopLeft,
            bgColor: options?.bgColor ?? UI.COLORS.BLACK,
            bgAlpha: options?.bgAlpha ?? 0.5,
            padding: Logger.PADDING,
            visible: options?.visible ?? false,
        }, player);

        this.staticRows = options?.staticRows ?? false;
        this.truncate = this.staticRows || (options?.truncate ?? false);
        // this.scaleFactor = options?.textScale === 'small' ? 0.8 : options?.textScale === 'large' ? 1.2 : 1;
        this.scaleFactor = 1; // TODO: Implement fixes/corrections for part widths when scale factor is not 1.
        this.rowHeight = 20 * this.scaleFactor;
        this.maxRows = ~~((this.height - Logger.PADDING) / this.rowHeight); // round down to nearest integer
        this.nextRowIndex = this.maxRows - 1;
    }

    private window: UI.Container;

    private staticRows: boolean;

    private truncate: boolean;

    private rows: { [rowIndex: number]: UI.Container } = {};

    private nextRowIndex: number;

    private width: number;

    private height: number;

    private textColor: mod.Vector;

    private scaleFactor: number;

    private rowHeight: number;

    maxRows: number;

    name(): string {
        return this.window.name;
    }

    isVisible(): boolean {
        return this.window.isVisible();
    }

    show(): void {
        this.window.show();
    }

    hide(): void {
        this.window.hide();
    }

    toggle(): void {
        this.isVisible() ? this.hide() : this.show();
    }

    clear(): void {
        Object.keys(this.rows).forEach(key => this.deleteRow(parseInt(key)));
    }

    destroy(): void {
        this.clear();
        this.window.delete();
    }

    log(text: string, rowIndex?: number): void {
        return this.staticRows ? this.logInRow(text, rowIndex ?? 0) : this.logNext(text);
    }

    private logInRow(text: string, rowIndex: number): void {
        if (rowIndex >= this.maxRows) return; // Actually, this should be an error.

        this.fillRow(this.createRow(rowIndex), Logger.getParts(text));
    }

    private logNext(text: string): void {
        this.logNextParts(Logger.getParts(text));
    }

    private logNextParts(parts: string[]): void {
        const remaining = this.fillRow(this.prepareNextRow(), parts);

        if (!remaining) return;

        this.logNextParts(remaining);
    }

    private fillRow(row: UI.Container, parts: string[]): string[] | null {
        let x = 0;
        let lastPartIndex = -1;

        for (let i = 0; i < parts.length; ++i) {
            const isLastPart = i === parts.length - 1;

            if (this.rowLimitReached(x, parts[i], isLastPart)) {
                if (this.truncate) {
                    this.createPartText(row, '...', x, 3);
                    return null;
                }

                return parts.slice(lastPartIndex + 1);
            }

            // Extra width of 3 for the last part (which likely does not have 3 characters).
            x += this.createPartText(row, parts[i], x, isLastPart ? 3 : 0);

            lastPartIndex = i;
        }

        return null;
    }

    private rowLimitReached(x: number, part: string, isLastPart: boolean): boolean {
        const limit = this.width - (Logger.PADDING * 2) - 3; // the row width minus the padding and 3 extra.

        // The early limit is the row width minus the padding, the width of the largest possible part and the width of the ellipsi.
        if (x + 57 <= limit) return false;

        // The last part is too long.
        if (isLastPart && (x + this.getTextWidth(part) >= limit)) return true;

        // The part plus the width of the ellipsis is too long.
        if (x + this.getTextWidth(part) + 12 >= limit) return true;

        return false;
    }

    private prepareNextRow(): UI.Container {
        const rowIndex = this.nextRowIndex;
        const row = this.createRow(rowIndex, (this.maxRows - 1) * this.rowHeight);

        this.nextRowIndex = (rowIndex + 1) % this.maxRows;

        Object.values(this.rows).forEach((row, index) => {
            if (!row) return;

            const { y } = row.getPosition();

            if (y <= 1) return this.deleteRow(index);

            row.setPosition(0, y - this.rowHeight);
        });

        return row;
    }

    private createRow(rowIndex: number, y?: number): UI.Container {
        this.deleteRow(rowIndex);

        const row = UI.createContainer({
            x: 0,
            y: y ?? (this.rowHeight * rowIndex),
            width: this.width - (Logger.PADDING * 2),
            height: this.rowHeight,
            anchor: mod.UIAnchor.TopLeft,
            parent: this.window.uiWidget(),
            bgFill: mod.UIBgFill.None,
        });

        this.rows[rowIndex] = row;

        return row;
    }

    private deleteRow(rowIndex: number): void { 
        this.rows[rowIndex]?.delete();
        delete this.rows[rowIndex];
    }

    private createPartText(row: UI.Container, part: string, x: number, extraWidth: number = 0): number {
        if (part === ' ') return 7; // Space won't be a character, but instead just an instruction for the next part to be offset by 7.

        const partWidth = this.getTextWidth(part) + extraWidth;

        UI.createText({
            x: x,
            y: 0,
            width: partWidth,
            height: this.rowHeight,
            anchor: mod.UIAnchor.CenterLeft,
            parent: row.uiWidget(),
            message: Logger.buildMessage(part),
            textSize: this.rowHeight,
            textColor: this.textColor,
            textAnchor: mod.UIAnchor.CenterLeft,
        });

        return partWidth;
    }

    private getTextWidth(part: string): number {
        return this.scaleFactor * part.split('').reduce((accumulator, character) => accumulator + Logger.getCharacterWidth(character), 0);
    }

    private static getParts(text: string): string[] {
        return (text.match(/( |[^ ]{1,3})/g) ?? []) as string[];
    }

    private static getCharacterWidth(char: string): number {
        if (['W', 'm', '@'].includes(char)) return 14;
        if (['['].includes(char)) return 13; // TODO: '[' is always prepended by a '\', so needs to be larger than ']'.
        if (['M', 'w'].includes(char)) return 12.5;
        if (['#', '?', '+'].includes(char)) return 12;
        if (['-', '='].includes(char)) return 11.5;
        if (['U', '$', '%', '&', '~'].includes(char)) return 11;
        if (['C', 'D', 'G', 'H', 'N', 'O', 'Q', 'S', '<', '>'].includes(char)) return 10.5;
        if (['0', '3', '6', '8', '9', 'A', 'B', 'V', 'X', '_'].includes(char)) return 10;
        if (['2', '4', '5', 'E', 'F', 'K', 'P', 'R', 'Y', 'Z', 'a', 'h', 's'].includes(char)) return 9.5;
        if (['7', 'b', 'c', 'd', 'e', 'g', 'n', 'o', 'p', 'q', 'u', '^', '*', '`'].includes(char)) return 9;
        if (['L', 'T', 'k', 'v', 'x', 'y', 'z'].includes(char)) return 8.5; // TODO: Maybe 'x' could be 8.
        if (['J', ']', '"', '\\', '/'].includes(char)) return 8;
        if (['1'].includes(char)) return 7.5;
        if ([' '].includes(char)) return 7;
        if (['r'].includes(char)) return 6.5; // TODO: Maybe 'r' should be 6.
        if (['f', '{', '}'].includes(char)) return 6; // TODO: Maybe 'f' should be 5.5.
        if (['t'].includes(char)) return 5.5;
        if (['(', ')', ','].includes(char)) return 5;
        if (['\'', ';'].includes(char)) return 4.5;
        if (['!', 'I', '|', '.' , ':'].includes(char)) return 4;
        if (['i', 'j', 'l'].includes(char)) return 3.5;

        return 10;
    }

    private static buildMessage(part: string): mod.Message {
        if (part.length === 3) return mod.Message(mod.stringkeys.logger.format[3], Logger.getChar(part[0]), Logger.getChar(part[1]), Logger.getChar(part[2]));
        if (part.length === 2) return mod.Message(mod.stringkeys.logger.format[2], Logger.getChar(part[0]), Logger.getChar(part[1]));
        if (part.length === 1) return mod.Message(mod.stringkeys.logger.format[1], Logger.getChar(part[0]));

        return mod.Message(mod.stringkeys.logger.format.badFormat);
    };

    private static getChar(char: string): string {
        return mod.stringkeys.logger.chars[char] ?? mod.stringkeys.logger.chars['*'];
    }

}

namespace Logger {

    export interface Options {
        staticRows?: boolean,
        truncate?: boolean,
        parent?: mod.UIWidget | UI.Node,
        anchor?: mod.UIAnchor,
        x?: number,
        y?: number,
        width?: number,
        height?: number,
        bgColor?: mod.Vector,
        bgAlpha?: number,
        bgFill?: mod.UIBgFill,
        textColor?: mod.Vector,
        textScale?: 'small' | 'medium' | 'large',
        visible?: boolean,
    }

}

const SPAWNS: { location: mod.Vector, orientation: number }[] = [
    {
        location: mod.CreateVector(0, 0, 0),
        orientation: 0,
    },
    {
        location: mod.CreateVector(0, 0, 0),
        orientation: 0,
    }
];

let staticLogger: Logger | undefined;
let dynamicLogger: Logger | undefined;

class BountyHunter {
    private static allBountyHunters: { [playerId: number]: BountyHunter } = {};
    
    public static readonly TARGET_POINTS: number = 250;

    public static readonly BASE_KILL_POINTS: number = 10;

    public static readonly SPOTTING_DURTATION: number = 3;

    public static readonly BOUNTY_MULTIPLIERS: Record<number, number> = {
        0: 1,
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 2,
        7: 3,
        8: 4,
        9: 5,
        10: 6,
    }

    public static readonly STREAK_SPOTTING_DELAYS: Record<number, number> = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 11,
        7: 9,
        8: 7,
        9: 5,
        10: 3,
    }

    constructor(player: mod.Player) {
        dynamicLogger?.log(`Player-${mod.GetObjId(player)} has joined the game!`);
        this.player = player;
        BountyHunter.allBountyHunters[mod.GetObjId(player)] = this;

        const container = UI.createContainer({
            x: 0,
            y: 0,
            width: 450,
            height: 120,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0.5,
            depth: mod.UIDepth.BelowGameUI
        });

        this.killStreakUI = UI.createText({
            x: 0,
            y: 60,
            width: 200,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.hud.killStreak, 0),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            parent: container,
        }, player);

        this.spottedUI = UI.createText({
            x: 0,
            y: 90,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.hud.notSpotted),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            parent: container,
        }, player);
    }

    public static leader?: BountyHunter;

    private killStreakUI: UI.Text;

    private spottedUI: UI.Text;

    public isSpotted: boolean = false;

    public player: mod.Player;

    public kills: number = 0;

    public deaths: number = 0;

    public killStreak: number = 0;

    public points: number = 0;

    public spot(): void {
        if (!mod.IsPlayerValid(this.player)) return BountyHunter.delete(this.player);

        if (!this.isSpotted) {
            dynamicLogger?.log(`Player-${mod.GetObjId(this.player)} is not spotted!`);
            this.spottedUI.setMessage(mod.Message(mod.stringkeys.hud.notSpotted));
            return;
        }

        dynamicLogger?.log(`Player-${mod.GetObjId(this.player)} is spotted!`);

        const delay = BountyHunter.STREAK_SPOTTING_DELAYS[this.killStreak];

        this.spottedUI.setMessage(mod.Message(mod.stringkeys.hud.spotted, BountyHunter.SPOTTING_DURTATION, delay));

        mod.SpotTarget(this.player, BountyHunter.SPOTTING_DURTATION, mod.SpotStatus.SpotInBoth);

        mod.Wait(delay).then(() => this.spot());
    }

    public setKillStreak(killStreak: number): void {
        this.killStreak = killStreak;
        this.killStreakUI.setMessage(mod.Message(mod.stringkeys.hud.killStreak, killStreak));
    }

    public static getFromPlayer(player: mod.Player): BountyHunter {
        return BountyHunter.allBountyHunters[mod.GetObjId(player)];
    }

    public static handleKill(killerPlayer: mod.Player, victimPlayer: mod.Player): void {
        dynamicLogger?.log(`Player-${mod.GetObjId(killerPlayer)} killed Player-${mod.GetObjId(victimPlayer)}!`);

        const killer = BountyHunter.getFromPlayer(killerPlayer);
        const victim = BountyHunter.getFromPlayer(victimPlayer);

        const bounty = BountyHunter.BASE_KILL_POINTS * BountyHunter.BOUNTY_MULTIPLIERS[victim.killStreak];

        victim.setKillStreak(0);
        victim.isSpotted = false;
        ++victim.deaths;

        if (mod.IsPlayerValid(victimPlayer)) {
            mod.SetScoreboardPlayerValues(
                victimPlayer,
                victim.points,
                victim.kills,
                victim.deaths,
                0,
                BountyHunter.BASE_KILL_POINTS * BountyHunter.BOUNTY_MULTIPLIERS[0]
            );
        } else {
            BountyHunter.delete(victimPlayer);
        }

        killer.points += bounty;
        ++killer.kills;
        killer.setKillStreak(killer.killStreak + 1);

        dynamicLogger?.log(`Player-${mod.GetObjId(killer.player)} awarded ${bounty} points and is on a ${killer.killStreak} kill streak!`);

        if (!mod.IsPlayerValid(killerPlayer)) return BountyHunter.delete(killerPlayer);

        mod.SetGameModeScore(killerPlayer, killer.points);

        mod.SetScoreboardPlayerValues(
            killerPlayer,
            killer.points,
            killer.kills,
            killer.deaths,
            killer.killStreak,
            BountyHunter.BASE_KILL_POINTS * BountyHunter.BOUNTY_MULTIPLIERS[killer.killStreak]
        );

        if (!BountyHunter.leader || killer.points > BountyHunter.leader.points) {
            BountyHunter.leader = killer;
        }

        if (killer.isSpotted || !BountyHunter.STREAK_SPOTTING_DELAYS[killer.killStreak]) return;

        killer.isSpotted = true;
        killer.spot();
    }

    public static delete(player: mod.Player): void {
        dynamicLogger?.log(`Player-${mod.GetObjId(player)} is no longer in the game!`);

        BountyHunter.getFromPlayer(player).isSpotted = false;

        delete BountyHunter.allBountyHunters[mod.GetObjId(player)];
    }
}

export function OnGameModeStarted(): void {
    mod.SetGameModeTimeLimit(1200); // 20 minutes
    mod.SetScoreboardType(mod.ScoreboardType.CustomFFA);
    mod.SetGameModeTargetScore(BountyHunter.TARGET_POINTS);
    mod.SetScoreboardColumnWidths(150, 150, 150, 150, 250);

    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.scoreboard.columns.points),
        mod.Message(mod.stringkeys.scoreboard.columns.kills),
        mod.Message(mod.stringkeys.scoreboard.columns.deaths),
        mod.Message(mod.stringkeys.scoreboard.columns.bounty),
        mod.Message(mod.stringkeys.scoreboard.columns.streak),
    );
}

export function OnTimeLimitReached(): void {
    if (!mod.GetMatchTimeElapsed()) return;

    if (BountyHunter.leader) {
        mod.EndGameMode(BountyHunter.leader.player);
    } else {
        mod.EndGameMode(mod.GetTeam(0));
    }
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    new BountyHunter(eventPlayer);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    if (mod.GetObjId(eventPlayer) != 0) return;

    if (!staticLogger) {
        staticLogger = new Logger(eventPlayer, { staticRows: true, visible: true, anchor: mod.UIAnchor.TopLeft });
        dynamicLogger = new Logger(eventPlayer, { staticRows: false, visible: true, anchor: mod.UIAnchor.TopRight });
    }

    dynamicLogger?.log(`Hello Player-${mod.GetObjId(eventPlayer)}!`);

    logPosition(eventPlayer);

    // dynamicLogger?.log(`Setting up scoreboard header.`);
    // const headerName = mod.Message(
    //     mod.stringkeys.scoreboard.header,
    //     BountyHunter.TARGET_POINTS,
    //     mod.stringkeys.scoreboard.none,
    // );

    // mod.SetScoreboardHeader(headerName);

    // dynamicLogger?.log(`Setting up scoreboard sorting.`);
    // mod.SetScoreboardSorting(1);
}

function logPosition(player: mod.Player): void {
    mod.Wait(0.5).then(() => {
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) return;

        staticLogger?.log(`Position: ${getPositionString(player)}`);
        logPosition(player);
    });
}

function getPositionString(player: mod.Player): string {
    const position = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);

    return `<${mod.XComponentOf(position).toFixed(2)}, ${mod.YComponentOf(position).toFixed(2)}, ${mod.ZComponentOf(position).toFixed(2)}>`;
}

export function OnPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock): void {
    BountyHunter.handleKill(eventOtherPlayer, eventPlayer);
}

// export function GetSpawner(number: number): Spawner;
// export function GetSpatialObject(spatialObjectNumber: number): SpatialObject;
// export function MoveObject(object: mod.Object, positionDelta: Vector, rotationDelta: Vector): void;
// export function GetObjectPosition(object: mod.Object): Vector;
// export function GetObjectRotation(object: mod.Object): Vector;

let test = false;

export function OngoingSpawner(eventSpawner: mod.Spawner): void {
    if (test) return;

    test = true;

    const id = mod.GetObjId(eventSpawner);
    const position = mod.GetObjectPosition(eventSpawner);
    const rotation = mod.GetObjectRotation(eventSpawner);

    mod.Wait(20).then(() => {
        dynamicLogger?.log(`Spawner-${id} is at ${mod.XComponentOf(position).toFixed(2)}, ${mod.YComponentOf(position).toFixed(2)}, ${mod.ZComponentOf(position).toFixed(2)} and facing ${mod.XComponentOf(rotation).toFixed(0)}, ${mod.YComponentOf(rotation).toFixed(0)}, ${mod.ZComponentOf(rotation).toFixed(0)}!`);
    });
}