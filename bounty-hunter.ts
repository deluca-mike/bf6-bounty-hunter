// TODO: Always use blur fill
// TODO: Consider returning the UI element from each function to chain calls.
// TODO: button sounds
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
        BF_GREY_1: mod.CreateVector(0.8353, 0.9216, 0.9765), // D5EBF9
        BF_GREY_2: mod.CreateVector(0.3294, 0.3686, 0.3882), // 545E63
        BF_GREY_3: mod.CreateVector(0.2118, 0.2235, 0.2353), // 36393C
        BF_GREY_4: mod.CreateVector(0.0314, 0.0431, 0.0431), // 080B0B,
        BF_BLUE_BRIGHT: mod.CreateVector(0.4392, 0.9216, 1.0000), // 70EBFF
        BF_BLUE_DARK: mod.CreateVector(0.0745, 0.1843, 0.2471), // 132F3F
        BF_RED_BRIGHT: mod.CreateVector(1.0000, 0.5137, 0.3804), // FF8361
        BF_RED_DARK: mod.CreateVector(0.2510, 0.0941, 0.0667), // 401811
        BF_GREEN_BRIGHT: mod.CreateVector(0.6784, 0.9922, 0.5255), // ADFD86
        BF_GREEN_DARK: mod.CreateVector(0.2784, 0.4471, 0.2118), // 477236
        BF_YELLOW_BRIGHT: mod.CreateVector(1.0000, 0.9882, 0.6118), // FFFC9C
        BF_YELLOW_DARK: mod.CreateVector(0.4431, 0.3765, 0.0000), // 716000
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
            params.bgColor ?? UI.COLORS.BF_GREY_4,
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
            getSize: () => UI.getSize(uiWidget()),
            setSize: (width: number, height: number) => mod.SetUIWidgetSize(uiWidget(), mod.CreateVector(width, height, 0)),
        };

        for (const childParams of params.childrenParams ?? []) {
            childParams.parent = container;

            const child =
                childParams.type === 'container' ? UI.createContainer(childParams) :
                childParams.type === 'text' ? UI.createText(childParams as UI.TextParams) :
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
            params.message,
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
            getSize: () => UI.getSize(uiWidget()),
            setSize: (width: number, height: number) => mod.SetUIWidgetSize(uiWidget(), mod.CreateVector(width, height, 0)),
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
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            depth: params.depth ?? mod.UIDepth.AboveGameUI,
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
            params.bgColor ?? UI.COLORS.WHITE,
            params.bgAlpha ?? 1,
            params.bgFill ?? mod.UIBgFill.Solid,
            params.buttonEnabled ?? true,
            params.baseColor ?? UI.COLORS.BF_GREY_2,
            params.baseAlpha ?? 1,
            params.disabledColor ?? UI.COLORS.BF_GREY_3,
            params.disabledAlpha ?? 1,
            params.pressedColor ?? UI.COLORS.BF_GREEN_BRIGHT,
            params.pressedAlpha ?? 1,
            params.hoverColor ?? UI.COLORS.BF_GREY_1,
            params.hoverAlpha ?? 1,
            params.focusedColor ?? UI.COLORS.BF_GREY_1,
            params.focusedAlpha ?? 1,
            params.depth ?? mod.UIDepth.AboveGameUI,
        );
    
        if (params.onClick) {
            UI.CLICK_HANDLERS.set(buttonName, params.onClick);
        }
    
        const buttonUiWidget = () => mod.FindUIWidgetWithName(buttonName) as mod.UIWidget;

        const label = params.label ? UI.createText({
            ...params.label,
            name: `${container.name}_label`,
            parent: containerUiWidget,
            width: params.width,
            height: params.height,
            visible: true,
            depth: params.depth,
        }) : undefined;

        const setSize = (width: number, height: number) => {
            container.setSize(width, height);
            mod.SetUIWidgetSize(buttonUiWidget(), mod.CreateVector(width, height, 0));
            label?.setSize(width, height);
        };

        return {
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
            getSize: () => UI.getSize(containerUiWidget),
            setSize: setSize,
            isEnabled: () => mod.GetUIButtonEnabled(buttonUiWidget()),
            enable: () => mod.SetUIButtonEnabled(buttonUiWidget(), true),
            disable: () => mod.SetUIButtonEnabled(buttonUiWidget(), false),
            labelName: label?.name,
            labelUiWidget: label?.uiWidget,
            setLabelMessage: label?.setMessage,
        };
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

    private static getSize(widget: mod.UIWidget): { width: number, height: number } {
        const size = mod.GetUIWidgetSize(widget);
        return { width: mod.XComponentOf(size), height: mod.YComponentOf(size) };
    }

}

namespace UI {

    export enum Type {
        Root = 'root',
        Container = 'container',
        Text = 'text',
        Button = 'button',
        Unknown = 'unknown',
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
        getSize: () => { width: number, height: number },
        setSize: (width: number, height: number) => void,
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
        message: mod.Message,
        textSize?: number,
        textColor?: mod.Vector,
        textAlpha?: number,
        textAnchor?: mod.UIAnchor,
    }

    export interface LabelParams {
        message: mod.Message,
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

    private static readonly PADDING: number = 10;

    constructor(
        player?: mod.Player,
        options?: Logger.Options
    ) {
        this.width = options?.width ?? 400;
        this.height = options?.height ?? 300;
        this.textColor = options?.textColor ?? UI.COLORS.BF_GREEN_BRIGHT;

        this.window = UI.createContainer({
            x: options?.x ?? 10,
            y: options?.y ?? 10,
            width: this.width,
            height: this.height,
            parent: options?.parent,
            anchor: options?.anchor ?? mod.UIAnchor.TopLeft,
            bgColor: options?.bgColor ?? UI.COLORS.BF_GREY_4,
            bgAlpha: options?.bgAlpha ?? 0.5,
            bgFill: options?.bgFill ?? mod.UIBgFill.Blur,
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

    public maxRows: number;

    public name(): string {
        return this.window.name;
    }

    public isVisible(): boolean {
        return this.window.isVisible();
    }

    public show(): void {
        this.window.show();
    }

    public hide(): void {
        this.window.hide();
    }

    public toggle(): void {
        this.isVisible() ? this.hide() : this.show();
    }

    public clear(): void {
        Object.keys(this.rows).forEach(key => this.deleteRow(parseInt(key)));
    }

    public destroy(): void {
        this.clear();
        this.window.delete();
    }

    public log(text: string, rowIndex?: number): void {
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

// TODO: analyzeHealth shjould be a method to get the health status and log it.
class PerformanceStats {
    
    private sampleRateSeconds: number = 0.5; // 0.5 is ideal as it aligns perfectly with both 30Hz and 60Hz
    
    private tickBucket: number = 0;

    private isStarted: boolean = false;

    private cachedTickRate: number = 60; 
    
    private log: (text: string) => void;

    constructor(log: (text: string) => void, sampleRateSeconds?: number) {
        this.log = log;
        this.sampleRateSeconds = sampleRateSeconds ?? 0.5;
    }

    public get tickRate(): number {
        return this.cachedTickRate;
    }
    
    public trackPerformanceTick(): void {
        this.tickBucket++;
    }

    public startPerformanceHeartbeat(): void {
        if (this.isStarted) return;

        this.isStarted = true;

        mod.Wait(this.sampleRateSeconds).then(() => this.performanceHeartbeat());
    }

    private performanceHeartbeat(): void {
        // The raw "Ticks Per Requested Second" (the composite metric).
        this.analyzeHealth(this.cachedTickRate = this.tickBucket / this.sampleRateSeconds);

        this.tickBucket = 0;

        mod.Wait(this.sampleRateSeconds).then(() => this.performanceHeartbeat());
    }

    private analyzeHealth(tickRate: number): void {
        // We have accumulated too many ticks for the requested time, which means the Wait() took longer than requested.
        if (tickRate >= 65) {
            this.log(`<PS> Script Callbacks Deprioritized (Virtual Rate: ${tickRate.toFixed(1)}Hz).`);
            return;
        }
        
        // We didn't even get 30 ticks in the time window, which means the server is under stress.
        if (tickRate <= 25) {
            this.log(`<PS> Server Stress (Virtual Rate: ${tickRate.toFixed(1)}Hz).`);
            return;
        }
    }
}

class FFASpawningSoldier {

    private static allSoldiers: { [playerId: number]: FFASpawningSoldier } = {};

    // Time until the player is asked to spawn to delay the prompt again.
    private static readonly DELAY: number = 10;

    private static readonly PRIME_STEPS: number[] = [2039, 2027, 2017];

    // The maximum number of random spawns to consider when trying to find a spawn point for a player.
    private static readonly MAX_SPAWN_CHECKS: number = 12;

    // The delay between processing the spawn queue.
    private static readonly QUEUE_PROCESSING_DELAY: number = 1;

    private static spawns: FFASpawningSoldier.Spawn[] = [];

    // The minimum distance a spawn point must be to another player to be considered safe.
    private static minimumSafeDistance: number = 20;
    
    // The maximum distance a spawn point must be to another player to be considered acceptable.
    private static maximumInterestingDistance: number = 40;

    // The amount to scale the midpoint between the `minimumSafeDistance` and `maximumInterestingDistance` to evaluate a fallback spawn.
    private static safeOverInterestingFallbackFactor: number = 1.5;

    private static spawnQueue: FFASpawningSoldier[] = [];

    private static queueProcessingEnabled: boolean = false;

    private static queueProcessingActive: boolean = false;

    private static logger?: (text: string) => void;

    private static logLevel: FFASpawningSoldier.LogLevel = 2;

    private static log(logLevel: FFASpawningSoldier.LogLevel, text: string): void {
        if (logLevel < FFASpawningSoldier.logLevel) return;

        FFASpawningSoldier.logger?.(`<FFASS> ${text}`);
    }

    private static getRotationVector(orientation: number): mod.Vector {
        return mod.CreateVector(0, mod.DegreesToRadians(180 - orientation), 0);
    }

    private static getBestSpawnPoint(): FFASpawningSoldier.Spawn {
        const primeSteps = FFASpawningSoldier.PRIME_STEPS; // Prime Walking Algorithm
        const stepSize = primeSteps[~~mod.RandomReal(0, primeSteps.length) % primeSteps.length]; // Mod because `RandomReal` is apparently inclusive of the end value.
        const spawns = FFASpawningSoldier.spawns;
        const startIndex = ~~mod.RandomReal(0, spawns.length) % spawns.length; // Mod because `RandomReal` is apparently inclusive of the end value.

        let safeFallbackSpawn: FFASpawningSoldier.Spawn | undefined = undefined;
        let safeFallbackDistance: number = Number.MAX_SAFE_INTEGER;

        let interestingFallbackSpawn: FFASpawningSoldier.Spawn | undefined = undefined;
        let interestingFallbackDistance: number = -1;

        for (let i = 0; i < FFASpawningSoldier.MAX_SPAWN_CHECKS; ++i) {
            const index = (startIndex + (i * stepSize)) % spawns.length;
            const candidate = spawns[index];
            const distance = FFASpawningSoldier.getDistanceToClosestPlayer(candidate.location);
        
            // If the spawn is ideal, return it.
            if (distance >= FFASpawningSoldier.minimumSafeDistance && distance <= FFASpawningSoldier.maximumInterestingDistance) {
                FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Spawn-${index} is ideal (${distance.toFixed(2)}m).`);
                return candidate; 
            }

            if (distance >= FFASpawningSoldier.minimumSafeDistance) {
                // If the spawn is safe but not interesting, check if its more interesting than the current most interesting safe fallback.
                if (distance < safeFallbackDistance) {
                    safeFallbackSpawn = candidate;
                    safeFallbackDistance = distance;
                }
            } else if (distance <= FFASpawningSoldier.maximumInterestingDistance) {
                // If the spawn is interesting but not safe, check if its safer than the current safest interesting fallback.
                if (distance > interestingFallbackDistance) {
                    interestingFallbackSpawn = candidate;
                    interestingFallbackDistance = distance;
                }
            }
        }

        if (!safeFallbackSpawn) return interestingFallbackSpawn ?? spawns[startIndex]; // No safe fallback, return the interesting fallback.

        if (!interestingFallbackSpawn) return safeFallbackSpawn; // No interesting fallback, return the safe fallback.

        // Get the midpoint between the `minimumSafeDistance` and `maximumInterestingDistance` and scale it by the `safeOverInterestingFallbackFactor`.
        const scaledMidpoint = FFASpawningSoldier.safeOverInterestingFallbackFactor * (FFASpawningSoldier.minimumSafeDistance + FFASpawningSoldier.maximumInterestingDistance) / 2;

        // Determine the fallback spawn by comparing the distance to the scaled midpoint. A higher `safeOverInterestingFallbackFactor` will favour the safe fallback more.
        const { spawn, distance } =
            safeFallbackDistance - scaledMidpoint < scaledMidpoint - interestingFallbackDistance
                ? { spawn: safeFallbackSpawn, distance: safeFallbackDistance }
                : { spawn: interestingFallbackSpawn, distance: interestingFallbackDistance };

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Info, `Spawn-${spawn.index} is the non-ideal fallback (${distance.toFixed(2)}m).`);

        return spawn;
    }

    private static getDistanceToClosestPlayer(location: mod.Vector): number {
        const closestPlayer = mod.ClosestPlayerTo(location);

        if (!mod.IsPlayerValid(closestPlayer)) return FFASpawningSoldier.minimumSafeDistance; // No players alive on the map.

        return mod.DistanceBetween(location, mod.GetSoldierState(closestPlayer, mod.SoldierStateVector.GetPosition));
    }

    private static processSpawnQueue(): void {
        FFASpawningSoldier.queueProcessingActive = true;

        if (!FFASpawningSoldier.queueProcessingEnabled) {
            FFASpawningSoldier.queueProcessingActive = false;
            return;
        }

        if (FFASpawningSoldier.spawns.length == 0) {
            FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Error, `No spawn points set.`);
            FFASpawningSoldier.queueProcessingActive = false;
            return;
        }

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Processing ${FFASpawningSoldier.spawnQueue.length} in queue.`);

        if (FFASpawningSoldier.spawnQueue.length == 0) {
            FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `No players in queue. Suspending processing.`);
            FFASpawningSoldier.queueProcessingActive = false;
            return;
        }

        while (FFASpawningSoldier.spawnQueue.length > 0) {
            const soldier = FFASpawningSoldier.spawnQueue.shift();

            if (!soldier || soldier.deleteIfNotValid()) continue;

            const spawn = FFASpawningSoldier.getBestSpawnPoint();

            FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Spawning P-${soldier.playerId} at ${FFASpawningSoldier.getVectorString(spawn.location)}.`);

            mod.SpawnPlayerFromSpawnPoint(soldier.player, spawn.spawnPoint);
        }

        mod.Wait(FFASpawningSoldier.QUEUE_PROCESSING_DELAY).then(() => FFASpawningSoldier.processSpawnQueue());
    }
    
    public static getVectorString(vector: mod.Vector): string {
        return `<${mod.XComponentOf(vector).toFixed(2)}, ${mod.YComponentOf(vector).toFixed(2)}, ${mod.ZComponentOf(vector).toFixed(2)}>`;
    }

    // Attaches a logger and defines a minimum log level.
    public static setLogging(log?: (text: string) => void, logLevel?: FFASpawningSoldier.LogLevel): void {
        FFASpawningSoldier.logger = log;
        FFASpawningSoldier.logLevel = logLevel ?? FFASpawningSoldier.LogLevel.Info;
    }

    // Should be called in the `OnGameModeStarted()` event. Orientation is the compass angle integer.
    public static initialize(spawns: FFASpawningSoldier.SpawnData[], options?: FFASpawningSoldier.InitializeOptions): void {
        mod.EnableHQ(mod.GetHQ(1), false);
        mod.EnableHQ(mod.GetHQ(2), false);

        FFASpawningSoldier.spawns = spawns.map((spawn, index) => {
            return {
                index: index,
                spawnPoint: mod.SpawnObject(mod.RuntimeSpawn_Common.PlayerSpawner, spawn.location, FFASpawningSoldier.getRotationVector(spawn.orientation)),
                location: spawn.location
            };
        });

        this.minimumSafeDistance = options?.minimumSafeDistance ?? this.minimumSafeDistance;
        this.maximumInterestingDistance = options?.maximumInterestingDistance ?? this.maximumInterestingDistance;
        this.safeOverInterestingFallbackFactor = options?.safeOverInterestingFallbackFactor ?? this.safeOverInterestingFallbackFactor;

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Info, `Set ${FFASpawningSoldier.spawns.length} spawn points (MSD: ${this.minimumSafeDistance}m, MID: ${this.maximumInterestingDistance}m, SOIF: ${this.safeOverInterestingFallbackFactor}).`);
    }

    // Starts the countdown before prompting the player to spawn or delay again, usually in the `OnPlayerJoinGame()` and `OnPlayerUndeploy()` events.
    // AI soldiers will skip the countdown and spawn immediately.
    public static startDelayForPrompt(player: mod.Player): void {
        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Start delay request for P-${mod.GetObjId(player)}.`);

        const soldier = FFASpawningSoldier.allSoldiers[mod.GetObjId(player)];

        if (!soldier || soldier.deleteIfNotValid()) return;

        soldier.startDelayForPrompt();
    }

    // Forces a player to be added to the spawn queue, skipping the countdown and prompt.
    public static forceIntoQueue(player: mod.Player): void {
        if (!mod.IsPlayerValid(player)) return;

        const soldier = FFASpawningSoldier.allSoldiers[mod.GetObjId(player)];

        if (!soldier || soldier.deleteIfNotValid()) return;

        soldier.addToQueue();
    }

    // Enables the processing of the spawn queue.
    public static enableSpawnQueueProcessing(): void {
        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Info, `Enabling processing spawn queue.`);

        if (FFASpawningSoldier.queueProcessingEnabled) return;

        FFASpawningSoldier.queueProcessingEnabled = true;
        FFASpawningSoldier.processSpawnQueue();
    }

    // Disables the processing of the spawn queue.
    public static disableSpawnQueueProcessing(): void {
        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Info, `Disabling processing spawn queue.`);

        FFASpawningSoldier.queueProcessingEnabled = false;
    }

    // Every player that should be ahndled by this spawning system should be instantiated as a `FFASpawningSoldier`, usually in the `OnPlayerSpawned()` event.
    constructor(player: mod.Player) {
        this.player = player;
        this.playerId = mod.GetObjId(player);

        FFASpawningSoldier.allSoldiers[this.playerId] = this;

        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

        this.promptUI = UI.createContainer({
            x: 0,
            y: 0,
            width: 440,
            height: 140,
            anchor: mod.UIAnchor.Center,
            visible: false,
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            childrenParams: [
                {
                    type: UI.Type.Button,
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
                    label: {
                        message: mod.Message(mod.stringkeys.ffaAutoSpawningSoldier.buttons.spawn),
                        textSize: 30,
                        textColor: UI.COLORS.BF_GREEN_BRIGHT,
                    },
                    onClick: async (player: mod.Player): Promise<void> => {
                        this.addToQueue();
                    },
                },
                {
                    type: UI.Type.Button,
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
                    label: {
                        message: mod.Message(mod.stringkeys.ffaAutoSpawningSoldier.buttons.delay, FFASpawningSoldier.DELAY),
                        textSize: 30,
                        textColor: UI.COLORS.BF_YELLOW_BRIGHT,
                    },
                    onClick: async (player: mod.Player): Promise<void> => {
                        this.startDelayForPrompt();
                    },
                },
            ]
        }, player);

        this.countdownUI = UI.createText({
            x: 0,
            y: 60,
            width: 400,
            height: 50,
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.ffaAutoSpawningSoldier.countdown, this.delayCountdown),
            textSize: 30,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Solid,
            visible: false,
        }, player);
    }

    public player: mod.Player;

    private playerId: number;

    private delayCountdown: number = FFASpawningSoldier.DELAY;

    private promptUI?: UI.Container;

    private countdownUI?: UI.Text;

    // Starts the countdown before prompting the player to spawn or delay again, usually in the `OnPlayerJoinGame()` and `OnPlayerUndeploy()` events.
    // AI soldiers will skip the countdown and spawn immediately.
    public startDelayForPrompt(): void {
        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Starting delay for P-${this.playerId}.`);

        if (mod.GetSoldierState(this.player, mod.SoldierStateBool.IsAISoldier)) return this.addToQueue();

        this.countdownUI?.show();
        this.promptUI?.hide();
        mod.EnableUIInputMode(false, this.player);

        this.delayCountdown = FFASpawningSoldier.DELAY;
        this.handleDelayCountdown();
    }

    private handleDelayCountdown(): void {
        if (this.deleteIfNotValid()) return;

        this.countdownUI?.setMessage(mod.Message(mod.stringkeys.ffaAutoSpawningSoldier.countdown, this.delayCountdown--));

        if (this.delayCountdown < 0) return this.showPrompt();

        mod.Wait(1).then(() => this.handleDelayCountdown());
    }

    private showPrompt(): void {
        this.countdownUI?.hide();
        mod.EnableUIInputMode(true, this.player);
        this.promptUI?.show();
    }

    private addToQueue(): void {
        FFASpawningSoldier.spawnQueue.push(this);

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `P-${this.playerId} added to queue (${FFASpawningSoldier.spawnQueue.length} total).`);

        this.countdownUI?.hide();
        this.promptUI?.hide();
        mod.EnableUIInputMode(false, this.player);

        if (!FFASpawningSoldier.queueProcessingEnabled || FFASpawningSoldier.queueProcessingActive) return;

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Restarting spawn queue processing.`);
        FFASpawningSoldier.processSpawnQueue();
    }

    private deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this.player)) return false;

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Info, `P-${this.playerId} is no longer in the game.`);

        this.promptUI?.delete();
        this.countdownUI?.delete();
        delete FFASpawningSoldier.allSoldiers[this.playerId];
        return true;
    }

}

namespace FFASpawningSoldier {

    export enum LogLevel {
        Debug = 0,
        Info = 1,
        Error = 2,
    }

    export interface SpawnData {
        location: mod.Vector;
        orientation: number;
    }

    export type Spawn = {
        index: number;
        spawnPoint: mod.SpawnPoint;
        location: mod.Vector;
    }

    export interface InitializeOptions {
        minimumSafeDistance?: number;
        maximumInterestingDistance?: number;
        safeOverInterestingFallbackFactor?: number;
    }

}

class MapDetector {

    public static getCurrentMap(): mod.Maps | undefined {
        const { x, y, z } = MapDetector.getHQCoordinates(0);

        if (x == -1044) return mod.Maps.Granite_MainStreet; // Downtown -1044.5, 122.02, 220.17
        if (x == -1474) return mod.Maps.Granite_Marina; // Marina -1474.05, 103.09, -690.45
        if (x == -164) return mod.Maps.Badlands; // Blackwell Fields -164.96, 76.32, -322.58
        if (x == -195) return mod.Maps.Eastwood; // Eastwood -195.29, 231.54, -41.5
        if (x == -274) return mod.Maps.Granite_TechCampus; // Defense Nexus -274.12, 138.65, 309.02
        if (x == -299) return mod.Maps.Granite_ClubHouse; // Golf Course -299.32, 191.91, -644.38
        if (x == -30) return mod.Maps.Sand; // Portal Sandbox Marina -30.02, 32.4, -0.01
        if (x == -323) return mod.Maps.Dumbo; // Manhattan Bridge -323.32, 52.3, -440.95
        if (x == -39) return mod.Maps.Firestorm; // Operation Firestorm -39.67, 124.69, -116.68
        if (x == -672) return mod.Maps.Aftermath; // Empire State -672.19, 53.79, -115.11
        if (x == -84) return mod.Maps.Abbasid; // Siege of Cairo -84.27, 64.38, -58.42
        if (x == -99 && y == 88) return mod.Maps.Tungsten; // Mirak Valley -99.78, 88.62, -253.42
        if (x == -99 && y == 92) return mod.Maps.Outskirts; // New Sobek City -99.78, 92.4, -124.58
        if (x == 293) return mod.Maps.Limestone; // Saints Quarter 293.13, 70.35, 134.51
        if (x == 849) return mod.Maps.Battery; // Iberian Offensive 849.16, 78.37, 116.74
        if (x == 94) return mod.Maps.Capstone; // Liberation Peak 94.71, 133.43, 77.46

        return;
    }
    
    public static getCurrentMapName(): string | undefined {
        const map = MapDetector.getCurrentMap();
        
        if (map == mod.Maps.Abbasid) return 'Siege of Cairo';
        if (map == mod.Maps.Aftermath) return 'Empire State';
        if (map == mod.Maps.Badlands) return 'Blackwell Fields';
        if (map == mod.Maps.Battery) return 'Iberian Offensive';
        if (map == mod.Maps.Capstone) return 'Liberation Peak';
        if (map == mod.Maps.Dumbo) return 'Manhattan Bridge';
        if (map == mod.Maps.Eastwood) return 'Eastwood';
        if (map == mod.Maps.Firestorm) return 'Operation Firestorm';
        if (map == mod.Maps.Granite_ClubHouse) return 'Golf Course';
        if (map == mod.Maps.Granite_MainStreet) return 'Downtown';
        if (map == mod.Maps.Granite_Marina) return 'Marina';
        if (map == mod.Maps.Granite_TechCampus) return 'Defense Nexus';
        if (map == mod.Maps.Limestone) return 'Saints Quarter';
        if (map == mod.Maps.Outskirts) return 'New Sobek City';
        if (map == mod.Maps.Sand) return 'Portal Sandbox Marina';
        if (map == mod.Maps.Tungsten) return 'Mirak Valley';

        return undefined;
    }

    public static getHQCoordinates(decimalPlaces: number = 2): { x: number, y: number, z: number } {
        const scale = 10 ** decimalPlaces;
        const hqPosition = mod.GetObjectPosition(mod.GetHQ(1));
        const x = (~~(mod.XComponentOf(hqPosition) * scale)) / scale;
        const y = (~~(mod.YComponentOf(hqPosition) * scale)) / scale;
        const z = (~~(mod.ZComponentOf(hqPosition) * scale)) / scale;
        return { x, y, z };
    }

}

const EASTWOOD_SPAWNS: FFASpawningSoldier.SpawnData[] = [
    {
        location: mod.CreateVector(-296.85, 235.07, -68.62),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-263.63, 235.47, -81.83),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-183.30, 237.29, -90.60),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-148.71, 236.77, -78.93),
        orientation: 0,
    },
    {
        location: mod.CreateVector(-118.32, 239.35, 15.71),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-149.41, 237.77, 10.04),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-208.97, 238.23, -4.04),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-245.57, 236.44, 3.57),
        orientation: 0,
    },
    {
        location: mod.CreateVector(-289.62, 235.20, 53.69),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-253.38, 234.52, 74.99),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-159.43, 237.38, 96.86),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-128.28, 237.49, 104.55),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-156.21, 237.18, 166.81),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-156.21, 237.18, 166.81),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-83.35, 239.04, 217.75),
        orientation: 270,
    },
    {
        location: mod.CreateVector(279.12, 232.46, -11.11),
        orientation: 180,
    },
    {
        location: mod.CreateVector(206.62, 240.11, -160.75),
        orientation: 270,
    },
    {
        location: mod.CreateVector(194.76, 240.08, -201.06),
        orientation: 180,
    },
    {
        location: mod.CreateVector(218.22, 230.12, 44.09),
        orientation: 90,
    },
    {
        location: mod.CreateVector(120.66, 231.78, 5.75),
        orientation: 180,
    },
    {
        location: mod.CreateVector(94.32, 233.69, -30.49),
        orientation: 180,
    },
    {
        location: mod.CreateVector(25.72, 227.23, 305.69),
        orientation: 0,
    },
    {
        location: mod.CreateVector(140.24, 226.12, 189.48),
        orientation: 270,
    },
    {
        location: mod.CreateVector(224.47, 225.83, 100.33),
        orientation: 0,
    },
    {
        location: mod.CreateVector(328.33, 233.86, 30.59),
        orientation: 270,
    },
    {
        location: mod.CreateVector(62.51, 234.33, 45.48),
        orientation: 90,
    },
    {
        location: mod.CreateVector(10.91, 232.19, 81.13),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-48.83, 238.32, 92.06),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-95.22, 235.34, 61.43),
        orientation: 0,
    },
    {
        location: mod.CreateVector(-197.68, 233.88, 23.08),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-224.46, 231.68, 45.27),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-226.03, 232.04, 21.26),
        orientation: 270, // 32
    },
    {
        location: mod.CreateVector(178.51, 240.89, -177.08),
        orientation: 90,
    },
    {
        location: mod.CreateVector(220.78, 237.68, -134.05),
        orientation: 270,
    },
    {
        location: mod.CreateVector(-375.86, 233.60, -16.30),
        orientation: 90,
    },
    {
        location: mod.CreateVector(-238.17, 253.83, -167.73),
        orientation: 180,
    },
    {
        location: mod.CreateVector(-22.73, 238.87, -98.50),
        orientation: 180,
    },
    {
        location: mod.CreateVector(87.33, 239.70, -135.99),
        orientation: 90,
    },
    {
        location: mod.CreateVector(96.97, 229.28, 27.41),
        orientation: 100,
    },
    {
        location: mod.CreateVector(74.03, 229.28, 50.20),
        orientation: 100,
    },
    {
        location: mod.CreateVector(292.51, 235.34, -79.08),
        orientation: 255,
    },
    {
        location: mod.CreateVector(95.86, 233.02, -34.06),
        orientation: 345,
    },
];

const EMPIRE_STATE_SPAWNS: FFASpawningSoldier.SpawnData[] = [
    {
        location: mod.CreateVector(-734.85, 55.51, -201.63), // -734.85, 55.51, -201.63, 130
        orientation: 130,
    },
    {
        location: mod.CreateVector(-687.65, 55.53, -209.33), // -687.65, 55.53, -209.33, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-655.35, 55.53, -190.42), // -655.35, 55.53, -190.42, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-629.26, 53.58, -187.67), // -629.26, 53.58,-187.67, 100
        orientation: 100,
    },
    {
        location: mod.CreateVector(-599.66, 55.40, -183.89), // -599.66, 55.40, -183.89, 165
        orientation: 165,
    },
    {
        location: mod.CreateVector(-601.05, 53.95, -166.36), // -601.05, 53.95, -166.36, 15
        orientation: 15,
    },
    {
        location: mod.CreateVector(-572.73, 53.81, -169.83), // -572.73, 53.81, -169.83, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-546.36, 57.17, -152.70), // -546.36, 57.17, -152.70, 140
        orientation: 140,
    },
    {
        location: mod.CreateVector(-541.88, 54.22, -131.05), // -541.88, 54.22, -131.05, 12
        orientation: 12,
    },
    {
        location: mod.CreateVector(-558.50, 54.14, -134.86), // -558.50, 54.14, -134.86, 15
        orientation: 15,
    },
    {
        location: mod.CreateVector(-583.95, 54.11, -142.10), // -583.95, 54.11, -142.10, 285
        orientation: 285,
    },
    {
        location: mod.CreateVector(-597.59, 54.12, -144.59), // -597.59, 54.12, -144.59, 15
        orientation: 15,
    },
    {
        location: mod.CreateVector(-607.91, 53.96, -148.15), // -607.91, 53.96, -148.15, 195
        orientation: 195,
    },
    {
        location: mod.CreateVector(-605.18, 53.96, -138.80), // -605.18, 53.96, -138.80, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-609.13, 53.96, -156.55), // -609.13, 53.96, -156.5, 210
        orientation: 210,
    },
    {
        location: mod.CreateVector(-603.25, 53.92, -161.07), // -603.25, 53.92, -161.07, 105
        orientation: 105,
    },
    {
        location: mod.CreateVector(-713.72, 55.51, -123.17), // -713.72, 55.51, -123.17, 60
        orientation: 60,
    },
    {
        location: mod.CreateVector(-688.12, 53.88, 88.88), // -688.12, 53.88, 88.88, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-671.92, 53.69, 130.71), // -671.92, 53.69, 130.71, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-631.21, 53.35, 116.63), // -631.21, 53.35, 116.63, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-655.82, 53.18, 114.35), // -655.82, 53.18, 114.35, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-640.35, 63.92, 139.18), // -640.35, 63.92, 139.18, 345
        orientation: 345,
    },
    {
        location: mod.CreateVector(-619.06, 67.11, 106.43), // -619.06, 67.11, 106.43, 135
        orientation: 135,
    },
    {
        location: mod.CreateVector(-602.50, 60.03, 119.62), // -602.50, 60.03, 119.62, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-555.67, 60.01, 61.52), // -555.67, 60.01, 61.52, 315
        orientation: 315,
    },
    {
        location: mod.CreateVector(-628.17, 53.76, 72.84), // -628.17, 53.76, 72.84, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-658.57, 53.81, 64.01), // -658.57, 53.81, 64.01, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-676.66, 50.91, -1.26), // -676.66, 50.91, -1.26, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-676.80, 50.90, -11.68), // -676.80, 50.90, -11.68, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-679.45, 55.33, -56.34), // -679.45, 55.33, -56.34, 167
        orientation: 167,
    },
    {
        location: mod.CreateVector(-664.22, 53.84, -89.28), // -664.22, 53.84, -89.28, 172
        orientation: 172,
    },
    {
        location: mod.CreateVector(-648.75, 53.95, -63.93), // -648.75, 53.95, -63.93, 300
        orientation: 300,
    },
    {
        location: mod.CreateVector(-656.32, 58.72, -22.40), // -656.32, 58.72, -22.40, 135
        orientation: 135,
    },
    {
        location: mod.CreateVector(-650.03, 59.15, 7.81), // -650.03, 59.15, 7.81, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-654.99, 54.41, 56.23), // -654.99, 54.41, 56.23, 30
        orientation: 30,
    },
    {
        location: mod.CreateVector(-577.60, 63.71, 33.96), // -577.60, 63.71, 33.96, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-552.68, 65.13, 72.39), // -552.68, 65.13, 72.39, 45
        orientation: 45,
    },
    {
        location: mod.CreateVector(-520.48, 65.01, 48.25), // -520.48, 65.01, 48.25, 330
        orientation: 330,
    },
    {
        location: mod.CreateVector(-512.44, 59.41, -2.87), // -512.44, 59.41, -2.87, 300
        orientation: 300,
    },
    {
        location: mod.CreateVector(-515.46, 58.72, -48.61), // -515.46, 58.72, -48.61, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-528.53, 54.31, -118.11), // -528.53, 54.31, -118.11, 190
        orientation: 190,
    },
    {
        location: mod.CreateVector(-545.10, 54.23, -119.99), // -545.10, 54.23, -119.99, 190
        orientation: 190,
    },
    {
        location: mod.CreateVector(-562.49, 54.14, -123.81), // -562.49, 54.14, -123.81, 190
        orientation: 190,
    },
    {
        location: mod.CreateVector(-593.80, 57.28, -138.38), // -593.80, 57.28, -138.38, 150
        orientation: 150,
    },
    {
        location: mod.CreateVector(-641.84, 54.04, -100.91), // -641.84, 54.04, -100.91, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-624.90, 54.10, -88.99), // -624.90, 54.10, -88.99, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-624.65, 54.15, -80.79), // -624.65, 54.15, -80.79, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-622.93, 54.27, -75.62), // -622.93, 54.27, -75.62, 185
        orientation: 185,
    },
    {
        location: mod.CreateVector(-642.74, 54.04, -89.46), // -642.74, 54.04, -89.46, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-616.13, 53.97, -94.49), // -616.13, 53.97, -94.49, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-591.21, 54.16, -93.33), // -591.21, 54.16, -93.33, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-582.85, 54.16, -93.77), // -582.85, 54.16, -93.77, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-574.61, 54.20, -92.79), // -574.61, 54.20, -92.79, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-560.21, 54.15, -81.57), // -560.21, 54.15, -81.57, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-551.29, 57.32, -87.07), // -551.29, 57.32, -87.07, 320
        orientation: 320,
    },
    {
        location: mod.CreateVector(-549.44, 57.36, -87.11), // -549.44, 57.36, -87.11, 52
        orientation: 52,
    },
    {
        location: mod.CreateVector(-549.33, 54.19, -81.07), // -549.33, 54.19, -81.07, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-571.71, 54.99, -48.15), // -571.71, 54.99, -48.15, 315
        orientation: 315,
    },
    {
        location: mod.CreateVector(-544.90, 58.72, -42.49), // -544.90, 58.72, -42.49, 285
        orientation: 285,
    },
    {
        location: mod.CreateVector(-587.56, 58.72, -50.29), // -587.56, 58.72, -50.29, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-570.26, 58.72, -23.35), // -570.26, 58.72, -23.35, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-531.83, 58.72, -40.35), // -531.83, 58.72, -40.35, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-549.18, 58.72, -24.43), // -549.18, 58.72, -24.43, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-547.73, 58.72, -38.94), // -547.73, 58.72, -38.94, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-572.69, 58.72, -24.02), // -572.69, 58.72, -24.02, 30
        orientation: 30,
    },
    {
        location: mod.CreateVector(-588.32, 63.20, -16.33), // -588.32, 63.20, -16.33, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-586.75, 63.20, -46.06), // -586.75, 63.20, -46.06, 105
        orientation: 105,
    },
    {
        location: mod.CreateVector(-649.90, 63.21, -6.24), // -649.90, 63.21, -6.24, 0
        orientation: 0,
    },
    {
        location: mod.CreateVector(-648.79, 63.20, -32.73), // -648.79, 63.20, -32.73, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-626.02, 63.20, 7.70), // -626.02, 63.20, 7.70, 60
        orientation: 60,
    },
    {
        location: mod.CreateVector(-630.83, 58.72, -48.37), // -630.83, 58.72, -48.37, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-620.66, 58.72, -35.48), // -620.66, 58.72, -35.48, 330
        orientation: 330,
    },
    {
        location: mod.CreateVector(-592.22, 54.16, -81.50), // -592.22, 54.16, -81.50, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-583.83, 54.16, -82.12), // -583.83, 54.16, -82.12, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-575.53, 54.20, -81.39), // -575.53, 54.20, -81.39, 180
        orientation: 180,
    },
    {
        location: mod.CreateVector(-670.32, 62.58, 28.07), // -670.32, 62.58, 28.07, 120
        orientation: 120,
    },
    {
        location: mod.CreateVector(-649.10, 58.72, 20.38), // -649.10, 58.72, 20.38, 240
        orientation: 240,
    },
    {
        location: mod.CreateVector(-645.78, 58.72, 11.86), // -645.78, 58.72, 11.86, 12
        orientation: 12,
    },
    {
        location: mod.CreateVector(-629.98, 58.72, -10.13), // -629.98, 58.72, -10.13, 255
        orientation: 255,
    },
    {
        location: mod.CreateVector(-600.25, 55.21, -35.98), // -600.25, 55.21, -35.98, 120
        orientation: 120,
    },
    {
        location: mod.CreateVector(-619.69, 57.44, -75.57), // -619.69, 57.44, -75.57, 135
        orientation: 135,
    },
    {
        location: mod.CreateVector(-615.33, 54.15, -81.16), // -615.33, 54.15, -81.16, 60
        orientation: 60,
    },
    {
        location: mod.CreateVector(-612.86, 54.10, -88.07), // -612.86, 54.10, -88.07, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-595.17, 54.29, -67.62), // -595.17, 54.29, -67.62, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-583.70, 54.29, -66.67), // -583.70, 54.29, -66.67, 90
        orientation: 90,
    },
    {
        location: mod.CreateVector(-573.42, 57.96, 5.52), // -573.42, 57.96, 5.52, 270
        orientation: 270,
    },
    {
        location: mod.CreateVector(-540.28, 59.95, 13.92), // -540.28, 59.95, 13.92, 330
        orientation: 330,
    },
    {
        location: mod.CreateVector(-585.35, 63.72, 31.45), // -585.35, 63.72, 31.45, 30
        orientation: 30,
    },
    {
        location: mod.CreateVector(-614.29, 53.92, -164.92), // -614.29, 53.92, -164.92, 285
        orientation: 285,
    },
    {
        location: mod.CreateVector(-607.00, 57.12, -167.20), // -607.00, 57.12, -167.20, 330
        orientation: 330,
    },
];

let staticLogger: Logger | undefined;
let dynamicLogger: Logger | undefined;
let performanceStats: PerformanceStats | undefined;
let debugMenu: UI.Container | undefined;

let playerId: number = 0;
const playerLogs: { [playerId: number]: string[] } = {};

class PlayerUndeployFixer {

    private static readonly MAX_TIME_TO_UNDEPLOY: number = 30;

    private static lastPlayerDeathTime: {[playerId: number]: number} = {};

    private static lastPlayerUndeployTime: {[playerId: number]: number} = {};

    public static playerDied(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        
        const thisDeathTime = mod.GetMatchTimeElapsed();
        
        this.lastPlayerDeathTime[playerId] = thisDeathTime;

        mod.Wait(this.MAX_TIME_TO_UNDEPLOY).then(() => {
            const isSameDeathEvent = this.lastPlayerDeathTime[playerId] === thisDeathTime;
            const hasUndeployed = (this.lastPlayerUndeployTime[playerId] || 0) >= thisDeathTime;

            if (!isSameDeathEvent || hasUndeployed) return;

            dynamicLogger?.log(`<PUF> P-${playerId} stuck in limbo. Force undeploying.`);

            mod.UndeployPlayer(player);
        });
    }

    public static playerUndeployed(player: mod.Player): void {
        // As you noted, this must be the actual time, not MAX_INTEGER
        this.lastPlayerUndeployTime[mod.GetObjId(player)] = mod.GetMatchTimeElapsed();
    }
}

// TODO: Assists
// TODO: Refresh/clear scoreboard of leavers.
class BountyHunter {

    // ---- Private Static Constants ---- //
    
    private static readonly TARGET_POINTS: number = 500;

    private static readonly BASE_KILL_POINTS: number = 10;

    private static readonly SPOTTING_DURTATIONS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        5, // 4
        10, // 5
        20, // 6
    ];

    private static readonly STREAK_SPOTTING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        16, // 4
        11, // 5
        1, // 6
    ];

    private static readonly STREAK_FLAGGING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        0, // 4
        8, // 5
        4, // 6
        2, // 7
    ];

    private static readonly BOUNTY_MULTIPLIERS: number[] = [
        1, // 0
        1, // 1
        1, // 2
        2, // 3
        2, // 4
        3, // 5
        4, // 6
        5, // 7
        6, // 8
        7, // 9
        8, // 10
    ];

    private static readonly ZERO_VECTOR: mod.Vector = mod.CreateVector(0, 0, 0);

    private static readonly WORLD_ICON_SCALE: mod.Vector = mod.CreateVector(0.5, 0.5, 0.5);

    private static readonly WORLD_ICON_OFFSET: mod.Vector = mod.CreateVector(0, 3, 0);

    private static readonly AWARD_DURATION: number = 2;

    // ---- Private Static Variables ---- //

    private static allBountyHunters: { [playerId: number]: BountyHunter } = {};

    // ---- Private Static Methods ---- //

    private static getKillStreakMessage(killStreak: number): mod.Message {
        return mod.Message(mod.stringkeys.bountyHunter.hud.killStreak, killStreak, BountyHunter.getBounty(killStreak));
    }

    private static getSpottedMessage(killStreak: number): mod.Message {
        const duration = BountyHunter.getSpottingDuration(killStreak);
        const delay = BountyHunter.getSpottingDelay(killStreak);

        return !duration || !delay
            ? mod.Message(mod.stringkeys.bountyHunter.hud.notSpotted)
            : mod.Message(mod.stringkeys.bountyHunter.hud.spotted, duration, delay);
    }

    private static getSpottingDuration(killStreak: number): number {
        const durations = BountyHunter.SPOTTING_DURTATIONS;
        return killStreak < durations.length ? durations[killStreak] : durations[durations.length - 1];
    }

    private static getSpottingDelay(killStreak: number): number {
        const delays = BountyHunter.STREAK_SPOTTING_DELAYS;
        return killStreak < delays.length ? delays[killStreak] : delays[delays.length - 1];
    }

    private static getFlaggingDelay(killStreak: number): number {
        const delays = BountyHunter.STREAK_FLAGGING_DELAYS;
        return killStreak < delays.length ? delays[killStreak] : delays[delays.length - 1];
    }

    private static getBounty(killStreak: number): number {
        const multipliers = BountyHunter.BOUNTY_MULTIPLIERS;
        return BountyHunter.BASE_KILL_POINTS * (killStreak < multipliers.length ? multipliers[killStreak] : multipliers[multipliers.length - 1]);
    }

    private static getAwardMessage(points: number): mod.Message {
        return mod.Message(mod.stringkeys.bountyHunter.award, points);
    }

    // ---- Public Static Methods ---- //

    public static initialize(): void {
        mod.SetScoreboardType(mod.ScoreboardType.CustomFFA);
        mod.SetGameModeTargetScore(BountyHunter.TARGET_POINTS);
        mod.SetScoreboardColumnWidths(160, 160, 160, 160, 160);

        mod.SetScoreboardColumnNames(
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.points),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.kills),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.assists),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.deaths),
            mod.Message(mod.stringkeys.bountyHunter.scoreboard.columns.bounty),
        );

        // dynamicLogger?.log(`Setting up scoreboard header.`);
        // const headerName = mod.Message(
        //     mod.stringkeys.bountyHunter.scoreboard.header,
        //     BountyHunter.TARGET_POINTS,
        //     mod.stringkeys.bountyHunter.scoreboard.none,
        // );

        // mod.SetScoreboardHeader(headerName);

        // dynamicLogger?.log(`Setting up scoreboard sorting.`);
        // mod.SetScoreboardSorting(1);

        // mod.SetScoreboardSorting(0, false);
    }

    public static getLeader(): BountyHunter | undefined {
        return Object.values(BountyHunter.allBountyHunters).reduce((leader: BountyHunter | undefined, bountyHunter: BountyHunter) => {
            return leader && leader.points > bountyHunter.points ? leader : bountyHunter;
        }, undefined);
    }
    
    public static getFromPlayer(player: mod.Player): BountyHunter {
        return BountyHunter.allBountyHunters[mod.GetObjId(player)];
    }
    
    public static getFromPlayerId(playerId: number): BountyHunter {
        return BountyHunter.allBountyHunters[playerId];
    }

    public static handleKill(killerPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const killer = BountyHunter.getFromPlayer(killerPlayer);
        const victim = victimPlayer && BountyHunter.getFromPlayer(victimPlayer);
        const victimIsValid = victim && !victim.deleteIfNotValid();

        const bounty = BountyHunter.getBounty(victim?.killStreak ?? 0); // This needs to be retreived before the victim's kill streak is reset.

        if (victimIsValid) {
            victim.killBeforeDeath = victim.killStreak;
            ++victim.deaths;
            victim.setKillStreak(0);

            mod.SetScoreboardPlayerValues(
                victimPlayer,
                victim.points,
                victim.kills,
                victim.assists,
                victim.deaths,
                BountyHunter.getBounty(0),
            );
        }

        if (killer.playerId == victim?.playerId) return;

        killer.awardPoints(bounty);
        ++killer.kills;
        killer.setKillStreak(killer.killStreak + 1);

        // dynamicLogger?.log(`<BH> P-${killer.playerId} killed P-${victim ? victim.playerId : 'U'} and got ${bounty} PTS.`);

        if (killer.deleteIfNotValid()) return;

        mod.SetGameModeScore(killerPlayer, killer.points);

        mod.SetScoreboardPlayerValues(
            killerPlayer,
            killer.points,
            killer.kills,
            killer.assists,
            killer.deaths,
            BountyHunter.getBounty(killer.killStreak)
        );

        if (!killer.isSpotted && BountyHunter.getSpottingDelay(killer.killStreak)) {
            killer.isSpotted = true;
            killer.spot();
        }

        if (!killer.isFlagged && BountyHunter.getFlaggingDelay(killer.killStreak)) {
            killer.isFlagged = true;
            killer.flag();
        }
    }

    public static handleAssist(assisterPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const assister = BountyHunter.getFromPlayer(assisterPlayer);
        const victim = victimPlayer && BountyHunter.getFromPlayer(victimPlayer);

        if (assister.playerId == victim?.playerId) return;

        // Need to handle the race condition where `handleAssist` and `handleKill` for the same victim can be called in any order.
        const killStreakBeforeDeath = victim?.killBeforeDeath ?? 0;
        const killStreak = victim?.killStreak ?? 0;

        const bounty = ~~(BountyHunter.getBounty(killStreak || killStreakBeforeDeath) / 2);

        assister.points += bounty;
        ++assister.assists;

        dynamicLogger?.log(`P-${assister.playerId} assisted in killing P-${victim ? victim.playerId : 'U'} and got ${bounty} PTS.`);

        if (assister.deleteIfNotValid()) return;

        mod.SetGameModeScore(assisterPlayer, assister.points);

        mod.SetScoreboardPlayerValues(
            assisterPlayer,
            assister.points,
            assister.kills,
            assister.assists,
            assister.deaths,
            BountyHunter.getBounty(assister.killStreak)
        );
    }

    public static handleDeployed(player: mod.Player): void {
        const bountyHunter = BountyHunter.getFromPlayer(player);
        bountyHunter.killBeforeDeath = 0;
    }

    public static createWorldIcon(position: mod.Vector): mod.WorldIcon {
        const worldIcon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, position, BountyHunter.ZERO_VECTOR, BountyHunter.WORLD_ICON_SCALE);
        mod.SetWorldIconColor(worldIcon, UI.COLORS.BF_RED_BRIGHT); // TODO: Use color based on kill streak?
        mod.SetWorldIconImage(worldIcon, mod.WorldIconImages.Triangle);
        mod.EnableWorldIconImage(worldIcon, true);
        mod.EnableWorldIconText(worldIcon, true);

        return worldIcon;
    }

    public static deleteWorldIcon(worldIcon?: mod.WorldIcon): void {
        if (!worldIcon) return;
    
        mod.UnspawnObject(worldIcon);
    }

    constructor(player: mod.Player) {
        this.player = player;
        this.playerId = mod.GetObjId(player);

        BountyHunter.allBountyHunters[this.playerId] = this;

        const container = UI.createContainer({
            x: 0,
            y: 0,
            width: 450,
            height: 120,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.75,
            bgFill: mod.UIBgFill.Blur,
            depth: mod.UIDepth.BelowGameUI
        }, player);

        this.killStreakUI = UI.createText({
            x: 0,
            y: 60,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: BountyHunter.getKillStreakMessage(0),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            parent: container,
        }, player);

        this.spottedUI = UI.createText({
            x: 0,
            y: 90,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: BountyHunter.getSpottedMessage(0),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            parent: container,
        }, player);

        this.awardUI = UI.createText({
            x: 0,
            y: -100,
            width: 100,
            height: 32,
            anchor: mod.UIAnchor.Center,
            message: BountyHunter.getAwardMessage(0),
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Blur,
            textSize: 24,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            textAlpha: 0.5,
            visible: false,
        }, player);
    }

    // ---- Private Variables ---- //

    private killStreakUI: UI.Text;

    private spottedUI: UI.Text;

    private awardUI: UI.Text;

    private playerId: number;

    private isSpotted: boolean = false;

    private isFlagged: boolean = false;

    private killBeforeDeath: number = 0;

    // ---- Public Variables ---- //

    public player: mod.Player;

    public kills: number = 0;

    public assists: number = 0;

    public deaths: number = 0;

    public killStreak: number = 0;

    public points: number = 0;

    // ---- Private Methods ---- //

    private spot(): void {
        if (this.deleteIfNotValid()) return;

        const duration = BountyHunter.getSpottingDuration(this.killStreak);
        const delay = BountyHunter.getSpottingDelay(this.killStreak);

        if (!delay || !duration) {
            // dynamicLogger?.log(`<BH> Suspending spotting for P-${this.playerId}.`);
            this.isSpotted = false;
            return;
        }

        dynamicLogger?.log(`<BH> Spotting P-${this.playerId} for ${duration}s on, ${delay}s off.`);

        mod.SpotTarget(this.player, duration, mod.SpotStatus.SpotInBoth);
        mod.Wait(duration + delay).then(() => this.spot());
    }

    private flag(worldIcon?: mod.WorldIcon): void {
        if (this.deleteIfNotValid()) return BountyHunter.deleteWorldIcon(worldIcon);

        const delay = BountyHunter.getFlaggingDelay(this.killStreak);

        if (!delay) {
            // dynamicLogger?.log(`<BH> Suspending flagging for P-${this.playerId}.`);

            this.isFlagged = false;
            
            return BountyHunter.deleteWorldIcon(worldIcon);
        }

        const position = mod.Add(mod.GetSoldierState(this.player, mod.SoldierStateVector.GetPosition), BountyHunter.WORLD_ICON_OFFSET);

        if (worldIcon) {
            mod.SetWorldIconPosition(worldIcon, position);
        } else {
            worldIcon = BountyHunter.createWorldIcon(position);
        }

        const bounty = BountyHunter.getBounty(this.killStreak);

        mod.SetWorldIconText(worldIcon, mod.Message(mod.stringkeys.bountyHunter.worldIconText, bounty));

        dynamicLogger?.log(`<BH> Flagging P-${this.playerId} every ${delay}s (${bounty} PTS).`);

        mod.Wait(delay).then(() => this.flag(worldIcon));
    }

    private awardPoints(points: number): void {
        this.points += points;
        this.awardUI.setMessage(BountyHunter.getAwardMessage(points));
        this.awardUI.show();
        
        mod.Wait(BountyHunter.AWARD_DURATION).then(() => this.awardUI.hide());
    }

    private setKillStreak(killStreak: number): void {
        this.killStreak = killStreak;
        this.killStreakUI.setMessage(BountyHunter.getKillStreakMessage(killStreak));
        this.spottedUI.setMessage(BountyHunter.getSpottedMessage(killStreak));
    }

    private deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this.player)) return false;

        dynamicLogger?.log(`<BH> P-${this.playerId} is no longer in the game.`);

        this.killStreak = 0;
        this.killStreakUI.delete();
        this.spottedUI.delete();

        delete BountyHunter.allBountyHunters[this.playerId];

        return true;
    }

}

const DEBUG_MENU = {
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    anchor: mod.UIAnchor.Center,
    bgColor: UI.COLORS.BLACK,
    bgAlpha: 0.5,
    visible: false,
    childrenParams: [
        {
            type: UI.Type.Button,
            x: 0,
            y: 0,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.toggleStaticLogger),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                staticLogger?.toggle();
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 20,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.toggleDynamicLogger),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                dynamicLogger?.toggle();
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 40,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveKill),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(player);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 60,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveAssist),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleAssist(player);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 80,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.cyclePlayerLogs),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                playerId = (playerId + 1) % 32;

                const logLine = `P-${playerId} last log: ${playerLogs[playerId] && playerLogs[playerId].length > 0 ? playerLogs[playerId][playerLogs[playerId].length - 1] : 'No logs'}`;

                staticLogger?.log(logLine, 4);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 100,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.printPlayerLogs),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                const lastLogIndex = playerLogs[playerId] && playerLogs[playerId].length > 0 ? playerLogs[playerId].length - 1 : -1;

                staticLogger?.log(lastLogIndex >= 3 ? playerLogs[playerId][lastLogIndex - 3] : 'No logs', 6);
                staticLogger?.log(lastLogIndex >= 2 ? playerLogs[playerId][lastLogIndex - 2] : 'No logs', 7);
                staticLogger?.log(lastLogIndex >= 1 ? playerLogs[playerId][lastLogIndex - 1] : 'No logs', 8);
                staticLogger?.log(lastLogIndex >= 0 ? playerLogs[playerId][lastLogIndex] : 'No logs', 9);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 0,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.BottomCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.close),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                mod.EnableUIInputMode(false, player);
                debugMenu?.hide();
            },
        },
    ]
};

export function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent) {
    UI.handleButtonClick(player, widget, event);
}

export function OngoingGlobal(): void {
    performanceStats?.trackPerformanceTick();
}

export function OnGameModeStarted(): void {
    BountyHunter.initialize();

    const map = MapDetector.getCurrentMap();

    FFASpawningSoldier.initialize(map == mod.Maps.Aftermath ? EMPIRE_STATE_SPAWNS : EASTWOOD_SPAWNS);
    FFASpawningSoldier.enableSpawnQueueProcessing();
}

export function OnTimeLimitReached(): void {
    if (!mod.GetMatchTimeElapsed()) return;

    const leader = BountyHunter.getLeader();

    if (leader) {
        mod.EndGameMode(leader.player);
    } else {
        mod.EndGameMode(mod.GetTeam(0));
    }
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    // playerLogs[mod.GetObjId(eventPlayer)] = [`OnPlayerJoinGame started`];

    new BountyHunter(eventPlayer);
    const soldier = new FFASpawningSoldier(eventPlayer);

    soldier.startDelayForPrompt();

    // playerLogs[mod.GetObjId(eventPlayer)] = [`OnPlayerJoinGame completed`];

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger = new Logger(eventPlayer, { staticRows: true, visible: false, anchor: mod.UIAnchor.TopLeft, textColor: UI.COLORS.BF_RED_BRIGHT });
    dynamicLogger = new Logger(eventPlayer, { staticRows: false, visible: false, anchor: mod.UIAnchor.TopRight, width: 700, height: 800 });
    debugMenu = UI.createContainer(DEBUG_MENU, eventPlayer);
    performanceStats = new PerformanceStats((text: string) => dynamicLogger?.log(text));
    performanceStats?.startPerformanceHeartbeat();
    
    const logger = (text: string) => dynamicLogger?.log(text);
    FFASpawningSoldier.setLogging(logger, FFASpawningSoldier.LogLevel.Info);
}

export function OnPlayerDied(victimPlayer: mod.Player, killerPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock): void {
    // playerLogs[mod.GetObjId(victimPlayer)].push(`OnPlayerDied started`);

    BountyHunter.handleKill(killerPlayer, victimPlayer);
    PlayerUndeployFixer.playerDied(victimPlayer);

    // playerLogs[mod.GetObjId(victimPlayer)].push(`OnPlayerDied completed`);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    // playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerUndeploy started`);

    PlayerUndeployFixer.playerUndeployed(eventPlayer);
    FFASpawningSoldier.startDelayForPrompt(eventPlayer);

    // playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerUndeploy completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger?.clear();
    debugMenu?.hide();
    mod.EnableUIInputMode(false, eventPlayer);
}

export function OnPlayerEarnedKillAssist(assisterPlayer: mod.Player, victimPlayer: mod.Player): void {
    BountyHunter.handleAssist(assisterPlayer, victimPlayer);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    // playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerDeployed started`);

    BountyHunter.handleDeployed(eventPlayer);

    // playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerDeployed completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

    debug(eventPlayer);
}

function debug(player: mod.Player): void {
    mod.Wait(0.5).then(() => {
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) return;

        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsProne) && mod.GetSoldierState(player, mod.SoldierStateBool.IsReloading)) {
            debugMenu?.show();
            mod.EnableUIInputMode(true, player);
        }

        staticLogger?.log(`Position: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetPosition)}`, 0);
        staticLogger?.log(`Facing: ${getPlayerStateVectorString(player, mod.SoldierStateVector.GetFacingDirection)}`, 1);
        staticLogger?.log(`Tick Rate: ${performanceStats?.tickRate.toFixed(1)}Hz`, 2);

        debug(player);
    });
}

function getPlayerStateVectorString(player: mod.Player, type: mod.SoldierStateVector): string {
    return getVectorString(mod.GetSoldierState(player, type));
}

function getVectorString(vector: mod.Vector): string {
    return `<${mod.XComponentOf(vector).toFixed(2)}, ${mod.YComponentOf(vector).toFixed(2)}, ${mod.ZComponentOf(vector).toFixed(2)}>`;
}
