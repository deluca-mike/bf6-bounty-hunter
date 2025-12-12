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
            params.bgColor ?? UI.COLORS.WHITE,
            params.bgAlpha ?? 0,
            params.bgFill ?? mod.UIBgFill.None,
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

    public static handleButtonClick(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): void {
        // NOTE: mod.UIButtonEvent is currently broken or undefined, so we're not using it for now.
        // if (event != mod.UIButtonEvent.ButtonUp) return;

        const clickHandler = UI.CLICK_HANDLERS.get(mod.GetUIWidgetName(widget));

        if (!clickHandler) return;

        clickHandler(player).catch((error) => {
            console.error(`Error in click handler for widget ${mod.GetUIWidgetName(widget)}:`, error);
        });
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

class PerformanceStats {

    private stressThreshold: number = 25;

    private deprioritizedThreshold: number = 65;
    
    private sampleRateSeconds: number = 0.5; // 0.5 is ideal as it aligns perfectly with both 30Hz and 60Hz
    
    private tickBucket: number = 0;

    private isStarted: boolean = false;

    private cachedTickRate: number = 30; 
    
    private log?: (text: string) => void;

    constructor(options?: PerformanceStats.Options) {
        this.log = options?.log ?? (() => {});
        this.sampleRateSeconds = options?.sampleRateSeconds ?? 0.5;
        this.stressThreshold = options?.stressThreshold ?? 25;
        this.deprioritizedThreshold = options?.deprioritizedThreshold ?? 65;
    }

    public get tickRate(): number {
        return this.cachedTickRate;
    }
    
    // This should be called once every tick, so it is best to be called in the `OngoingGlobal()` event handler.
    public trackTick(): void {
        this.tickBucket++;
    }

    // This starts the performance tracking heartbeat, which is a loop that tracks the performance of the script. It can be called once, any time.
    // If called multiple times, it will only start one loop.
    public startHeartbeat(): void {
        if (this.isStarted) return;

        this.isStarted = true;

        mod.Wait(this.sampleRateSeconds).then(() => this.heartbeat());
    }

    private heartbeat(): void {
        // The raw "Ticks Per Requested Second" (the composite metric).
        this.analyzeHealth(this.cachedTickRate = this.tickBucket / this.sampleRateSeconds);

        this.tickBucket = 0;

        mod.Wait(this.sampleRateSeconds).then(() => this.heartbeat());
    }

    private analyzeHealth(tickRate: number): void {
        if (!this.log) return;

        // We have accumulated too many ticks for the requested time, which means the Wait() took longer than requested.
        if (tickRate >= this.deprioritizedThreshold) {
            this.log(`<PS> Script Callbacks Deprioritized (Virtual Rate: ${tickRate.toFixed(1)}Hz).`);
            return;
        }
        
        // We didn't even get 30 ticks in the time window, which means the server is under stress.
        if (tickRate <= this.stressThreshold) {
            this.log(`<PS> Server Stress (Virtual Rate: ${tickRate.toFixed(1)}Hz).`);
            return;
        }
    }
}

namespace PerformanceStats {

    export type Options = {
        log?: (text: string) => void;
        stressThreshold?: number;
        deprioritizedThreshold?: number;
        sampleRateSeconds?: number;
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

            FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Spawning P_${soldier.playerId} at ${FFASpawningSoldier.getVectorString(spawn.location)}.`);

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

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Info, `Set ${FFASpawningSoldier.spawns.length} spawn points (S: ${this.minimumSafeDistance}m, I: ${this.maximumInterestingDistance}m, F: ${this.safeOverInterestingFallbackFactor}).`);
    }

    // Starts the countdown before prompting the player to spawn or delay again, usually in the `OnPlayerJoinGame()` and `OnPlayerUndeploy()` events.
    // AI soldiers will skip the countdown and spawn immediately.
    public static startDelayForPrompt(player: mod.Player): void {
        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Start delay request for P_${mod.GetObjId(player)}.`);

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

    // Every player that should be handled by this spawning system should be instantiated as a `FFASpawningSoldier`, usually in the `OnPlayerSpawned()` event.
    constructor(player: mod.Player) {
        this.player = player;
        this.playerId = mod.GetObjId(player);

        FFASpawningSoldier.allSoldiers[this.playerId] = this;

        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
            FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `P_${this.playerId} is an AI soldier, skipping initialization.`);
            return;
        }

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
        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Starting delay for P_${this.playerId}.`);

        if (mod.GetSoldierState(this.player, mod.SoldierStateBool.IsAISoldier)) {
            FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `P_${this.playerId} is an AI soldier, skipping delay.`);
            return this.addToQueue();
        }

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

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `P_${this.playerId} added to queue (${FFASpawningSoldier.spawnQueue.length} total).`);

        this.countdownUI?.hide();
        this.promptUI?.hide();
        mod.EnableUIInputMode(false, this.player);

        if (!FFASpawningSoldier.queueProcessingEnabled || FFASpawningSoldier.queueProcessingActive) return;

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Debug, `Restarting spawn queue processing.`);
        FFASpawningSoldier.processSpawnQueue();
    }

    private deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this.player)) return false;

        FFASpawningSoldier.log(FFASpawningSoldier.LogLevel.Info, `P_${this.playerId} is no longer in the game.`);

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

    private static hqCoordinates: mod.Vector;

    // Returns the current map as a `MapDetector.Map` enum value, if possible.
    public static get currenMap(): MapDetector.Map | undefined {
        const { x, y, z } = MapDetector.getHQCoordinates(0);

        if (x == -1044) return MapDetector.Map.Downtown; // Downtown <-1044.5, 122.02, 220.17>
        if (x == -1474) return MapDetector.Map.Marina; // Marina <-1474.05, 103.09, -690.45>
        if (x == -164) return MapDetector.Map.BlackwellFields; // Blackwell Fields <-164.96, 76.32, -322.58>
        if (x == -195) return MapDetector.Map.Eastwood; // Eastwood <-195.29, 231.54, -41.5>
        if (x == -274) return MapDetector.Map.DefenseNexus; // Defense Nexus <-274.12, 138.65, 309.02>
        if (x == -299) return MapDetector.Map.GolfCourse; // Golf Course <-299.32, 191.91, -644.38>
        if (x == -30) return MapDetector.Map.PortalSandboxMarina; // Portal Sandbox Marina <-30.02, 32.4, -0.01>
        if (x == -323) return MapDetector.Map.ManhattanBridge; // Manhattan Bridge <-323.32, 52.3, -440.95>
        if (x == -39) return MapDetector.Map.OperationFirestorm; // Operation Firestorm <-39.67, 124.69, -116.68>
        if (x == -672) return MapDetector.Map.EmpireState; // Empire State <-672.19, 53.79, -115.11>
        if (x == -84) return MapDetector.Map.SiegeOfCairo; // Siege of Cairo <-84.27, 64.38, -58.42>
        if (x == -99 && y == 88) return MapDetector.Map.MirakValley; // Mirak Valley <-99.78, 88.62, -253.42>
        if (x == -99 && y == 92) return MapDetector.Map.NewSobekCity; // New Sobek City <-99.78, 92.4, -124.58>
        if (x == 293) return MapDetector.Map.SaintsQuarter; // Saints Quarter <293.13, 70.35, 134.51>
        if (x == 427) return MapDetector.Map.Area22B; // Area 22B <427.68, 177.51, -743.26>
        if (x == 566) return MapDetector.Map.RedlineStorage; // Redline Storage <566.77, 144.8, 356.16>
        if (x == 849) return MapDetector.Map.IberianOffensive; // Iberian Offensive <849.16, 78.37, 116.74>
        if (x == 94) return MapDetector.Map.LiberationPeak; // Liberation Peak <94.71, 133.43, 77.46>

        return;
    }

    // Returns the current map as a `mod.Maps` enum value, if possible.
    public static get currentNativeMap(): mod.Maps | undefined {
        const map = this.currenMap;

        if (map == MapDetector.Map.BlackwellFields) return mod.Maps.Badlands;
        if (map == MapDetector.Map.DefenseNexus) return mod.Maps.Granite_TechCampus;
        if (map == MapDetector.Map.Downtown) return mod.Maps.Granite_MainStreet;
        if (map == MapDetector.Map.Eastwood) return mod.Maps.Eastwood;
        if (map == MapDetector.Map.EmpireState) return mod.Maps.Aftermath;
        if (map == MapDetector.Map.GolfCourse) return mod.Maps.Granite_ClubHouse;
        if (map == MapDetector.Map.IberianOffensive) return mod.Maps.Battery;
        if (map == MapDetector.Map.LiberationPeak) return mod.Maps.Capstone;
        if (map == MapDetector.Map.ManhattanBridge) return mod.Maps.Dumbo;
        if (map == MapDetector.Map.Marina) return mod.Maps.Granite_Marina;
        if (map == MapDetector.Map.MirakValley) return mod.Maps.Tungsten;
        if (map == MapDetector.Map.NewSobekCity) return mod.Maps.Outskirts;
        if (map == MapDetector.Map.OperationFirestorm) return mod.Maps.Firestorm;
        if (map == MapDetector.Map.PortalSandboxMarina) return mod.Maps.Sand;
        if (map == MapDetector.Map.SaintsQuarter) return mod.Maps.Limestone;
        if (map == MapDetector.Map.SiegeOfCairo) return mod.Maps.Abbasid;

        // An oversight in the `mod.Maps` enum has ommitted the following maps:
        if (map == MapDetector.Map.Area22B) return;
        if (map == MapDetector.Map.RedlineStorage) return;

        return;
    }
    
    // Returns the current map as a string, if possible.
    public static get currentMapName(): string | undefined {
        return this.currenMap?.toString();
    }

    // Returns true if the current map is the given `MapDetector.Map` enum value.
    public static isCurrentMap(map: MapDetector.Map): boolean {
        return this.currenMap == map;
    }

    // Returns true if the current map is the given `mod.Maps` enum value.
    public static isCurrentNativeMap(map: mod.Maps): boolean {
        return this.currentNativeMap == map;
    }

    // Returns the HQ coordinates of the current map (used for finding the HQ coordinates of the current map).
    public static getHQCoordinates(decimalPlaces: number = 2): { x: number, y: number, z: number } {
        const hqCoordinates = mod.GetObjectPosition(mod.GetHQ(1));
        const scale = 10 ** decimalPlaces;
        const x = (~~(mod.XComponentOf(hqCoordinates) * scale)) / scale;
        const y = (~~(mod.YComponentOf(hqCoordinates) * scale)) / scale;
        const z = (~~(mod.ZComponentOf(hqCoordinates) * scale)) / scale;
        return { x, y, z };
    }

}

namespace MapDetector {
    
    export enum Map {
        Area22B = 'Area 22B',
        BlackwellFields = 'Blackwell Fields',
        DefenseNexus = 'Defense Nexus',
        Downtown = 'Downtown',
        Eastwood = 'Eastwood',
        EmpireState = 'Empire State',
        GolfCourse = 'Golf Course',
        IberianOffensive = 'Iberian Offensive',
        LiberationPeak = 'Liberation Peak',
        ManhattanBridge = 'Manhattan Bridge',
        Marina = 'Marina',
        MirakValley = 'Mirak Valley',
        NewSobekCity = 'New Sobek City',
        OperationFirestorm = 'Operation Firestorm',
        PortalSandboxMarina = 'Portal Sandbox Marina',
        RedlineStorage = 'Redline Storage',
        SaintsQuarter = 'Saints Quarter',
        SiegeOfCairo = 'Siege of Cairo',
    }

}

class Sounds {

    private static readonly DURATION_BUFFER: number = 1;

    private static readonly DEFAULT_2D_DURATION: number = 3;

    private static readonly DEFAULT_3D_DURATION: number = 10;

    // A mapping of arrays of sound objects for each sfx asset that has been requested.
    // This mechanism ensures efficient sound management by reusing sound objects and avoiding unnecessary spawns.
    private static readonly SOUND_OBJECT_POOL: Map<mod.RuntimeSpawn_Common, Sounds.SoundObject[]> = new Map();

    private static logger?: (text: string) => void;

    private static logLevel: Sounds.LogLevel = 2;

    private static soundObjectsCount: number = 0;

    private static log(logLevel: Sounds.LogLevel, text: string): void {
        if (logLevel < Sounds.logLevel) return;

        Sounds.logger?.(`<Sounds> ${text}`);
    }
    
    private static getVectorString(vector: mod.Vector): string {
        return `<${mod.XComponentOf(vector).toFixed(2)}, ${mod.YComponentOf(vector).toFixed(2)}, ${mod.ZComponentOf(vector).toFixed(2)}>`;
    }

    // Returns the array of `SoundObject` for the given sfx asset, and initializes the array if it doesn't exist.
    private static getSoundObjects(sfxAsset: mod.RuntimeSpawn_Common): Sounds.SoundObject[] {
        const soundObjects = this.SOUND_OBJECT_POOL.get(sfxAsset);

        if (soundObjects) return soundObjects;

        this.SOUND_OBJECT_POOL.set(sfxAsset, []);

        this.log(Sounds.LogLevel.Debug, `SoundObjects for new SFX asset initialized.`);

        return this.SOUND_OBJECT_POOL.get(sfxAsset)!;
    }

    private static createSoundObject(soundObjects: Sounds.SoundObject[], sfxAsset: mod.RuntimeSpawn_Common): Sounds.SoundObject {
        const newSoundObject = {
            sfx: mod.SpawnObject(sfxAsset, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0)),
            availableTime: 0,
        }

        this.soundObjectsCount++;

        soundObjects.push(newSoundObject);

        this.log(Sounds.LogLevel.Debug, `New SoundObject created. SFX ssset now has ${soundObjects.length} SoundObjects.`);

        return newSoundObject;
    }

    // Returns the first available `SoundObject` for the given sfx asset, and creates a new `SoundObject` if none is available.
    private static getAvailableSoundObject(sfxAsset: mod.RuntimeSpawn_Common, curentTime: number = mod.GetMatchTimeElapsed()): Sounds.SoundObject {
        const soundObjects = this.getSoundObjects(sfxAsset);

        const soundObject = soundObjects.find((soundObject) => curentTime >= soundObject.availableTime);

        if (soundObject) {
            this.log(Sounds.LogLevel.Debug, `Available SoundObject found (in array of ${soundObjects.length} SoundObjects).`);
            return soundObject;
        }

        return this.createSoundObject(soundObjects, sfxAsset);
    }

    // Creates a `PlayedSound` with that will automatically stop the underlying sound after the specified duration, and that can be stopped manually.
    private static createPlayedSound(soundObject: Sounds.SoundObject, currentTime: number, duration: number): Sounds.PlayedSound {
        const availableTime = duration == 0 ? Number.MAX_SAFE_INTEGER : soundObject.availableTime = currentTime + duration + this.DURATION_BUFFER;

        const stop = () => {
            soundObject.availableTime = 0;
            mod.StopSound(soundObject.sfx);
        };

        if (duration > 0) {
            mod.Wait(duration).then(() => {
                this.log(Sounds.LogLevel.Debug, `Sound stopped automatically after ${duration} seconds.`);
                stop();
            });
        }

        return {
            stop: () => {
                if (mod.GetMatchTimeElapsed() > availableTime) {
                    this.log(Sounds.LogLevel.Error, `Sound already stopped.`);
                    return;
                }

                this.log(Sounds.LogLevel.Debug, `Sound stopped manually.`);

                stop();
            },
        };
    }

    private static play2DSound(sfxAsset: mod.RuntimeSpawn_Common, currentTime: number, duration: number, amplitude: number): Sounds.PlayedSound {
        const soundObject = this.getAvailableSoundObject(sfxAsset, currentTime);
        mod.PlaySound(soundObject.sfx, amplitude);
        this.log(Sounds.LogLevel.Info, `2D sound played for all players (amplitude ${amplitude.toFixed(2)}, duration ${duration.toFixed(2)}s).`);
        return this.createPlayedSound(soundObject, currentTime, duration);
    }

    private static play2DSoundForPlayer(sfxAsset: mod.RuntimeSpawn_Common, currentTime: number, duration: number, amplitude: number, player: mod.Player): Sounds.PlayedSound {
        const soundObject = this.getAvailableSoundObject(sfxAsset, currentTime);
        mod.PlaySound(soundObject.sfx, amplitude, player);
        this.log(Sounds.LogLevel.Info, `2D sound played for player ${mod.GetObjId(player)} (amplitude ${amplitude.toFixed(2)}, duration ${duration.toFixed(2)}s).`);
        return this.createPlayedSound(soundObject, currentTime, duration);
    }

    private static play2DSoundForSquad(sfxAsset: mod.RuntimeSpawn_Common, currentTime: number, duration: number, amplitude: number, squad: mod.Squad): Sounds.PlayedSound {
        const soundObject = this.getAvailableSoundObject(sfxAsset, currentTime);
        mod.PlaySound(soundObject.sfx, amplitude, squad);
        this.log(Sounds.LogLevel.Info, `2D sound played for squad (amplitude ${amplitude.toFixed(2)}, duration ${duration.toFixed(2)}s).`); // TODO: Get Squad ID if and when API is fixed.
        return this.createPlayedSound(soundObject, currentTime, duration);
    }

    private static play2DSoundForTeam(sfxAsset: mod.RuntimeSpawn_Common, currentTime: number, duration: number, amplitude: number, team: mod.Team): Sounds.PlayedSound {
        const soundObject = this.getAvailableSoundObject(sfxAsset, currentTime);
        mod.PlaySound(soundObject.sfx, amplitude, team);
        this.log(Sounds.LogLevel.Info, `2D sound played for player ${mod.GetObjId(team)} (amplitude ${amplitude.toFixed(2)}, duration ${duration.toFixed(2)}s).`);
        return this.createPlayedSound(soundObject, currentTime, duration);
    }

    public static play2D(sfxAsset: mod.RuntimeSpawn_Common, params: Sounds.Params2D = {}): Sounds.PlayedSound {
        const duration = params.duration ?? this.DEFAULT_2D_DURATION;
        const currentTime = mod.GetMatchTimeElapsed();
        const amplitude = params.amplitude ?? 1;

        if (params.player) return this.play2DSoundForPlayer(sfxAsset, currentTime, duration, amplitude, params.player);

        if (params.squad) return this.play2DSoundForSquad(sfxAsset, currentTime, duration, amplitude, params.squad);

        if (params.team) return this.play2DSoundForTeam(sfxAsset, currentTime, duration, amplitude, params.team);

        return this.play2DSound(sfxAsset, currentTime, duration, amplitude);
    }

    public static play3D(sfxAsset: mod.RuntimeSpawn_Common, position: mod.Vector, params: Sounds.Params3D = {}): Sounds.PlayedSound {
        const currentTime = mod.GetMatchTimeElapsed();
        const soundObject = this.getAvailableSoundObject(sfxAsset, currentTime);
        const amplitude = params.amplitude ?? 1;
        const attenuationRange = params.attenuationRange ?? 10;
        const duration = params.duration ?? this.DEFAULT_3D_DURATION;

        mod.PlaySound(soundObject.sfx, amplitude, position, attenuationRange);

        this.log(Sounds.LogLevel.Info, `3D sound played at position ${this.getVectorString(position)} (amplitude ${amplitude.toFixed(2)}, att. range ${attenuationRange.toFixed(2)}m, duration ${duration.toFixed(2)}s).`); // TODO: Get Squad ID if and when API is fixed.

        return this.createPlayedSound(soundObject, currentTime, duration);
    }

    // Attaches a logger and defines a minimum log level.
    public static setLogging(log?: (text: string) => void, logLevel?: Sounds.LogLevel): void {
        Sounds.logger = log;
        Sounds.logLevel = logLevel ?? Sounds.LogLevel.Info;
    }

    // Creates a new `SoundObject` for the given sfx asset if it doesn't exist.
    // This helps the game client load the sound asset in memory to it can play quicker when needed.
    // This is onyl needed once per asset, if at all.
    public static preload(sfxAsset: mod.RuntimeSpawn_Common): void {
        const soundObjects = this.getSoundObjects(sfxAsset);

        if (soundObjects.length) return;

        this.createSoundObject(soundObjects, sfxAsset);
    }

    // Returns the total number of `SoundObject`s created.
    public static get objectCount(): number {
        return this.soundObjectsCount;
    }

    // Returns the number of `SoundObject`s created for the given sfx asset.
    public static objectCountForAsset(sfxAsset: mod.RuntimeSpawn_Common): number {
        return this.getSoundObjects(sfxAsset).length;
    }

}

namespace Sounds {

    export type SoundObject = {
        sfx: mod.SFX,
        availableTime: number,
    }

    export type PlayedSound = {
        stop: () => void,
    }
    
    export type Params2D = {
        amplitude?: number,
        player?: mod.Player,
        squad?: mod.Squad,
        team?: mod.Team,
        duration?: number, // 0 for infinite duration (i.e. for looping assets)
    }

    export type Params3D = {
        amplitude?: number,
        attenuationRange?: number,
        duration?: number, // 0 for infinite duration (i.e. for looping assets)
    }

    export enum LogLevel {
        Debug = 0,
        Info = 1,
        Error = 2,
    }

}

class InteractMultiClickDetector {

    private static readonly STATES: Record<number, { lastIsInteracting: boolean, clickCount: number, sequenceStartTime: number }> = {};

    private static readonly WINDOW_MS = 1_000;

    private static readonly REQUIRED_CLICKS = 3;

    public static checkMultiClick(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        const isInteracting = mod.GetSoldierState(player, mod.SoldierStateBool.IsInteracting);

        let state = this.STATES[playerId];

        // If player's state is undefined, create it.
        if (!state) {
            this.STATES[playerId] = state = {
                lastIsInteracting: isInteracting,
                clickCount: 0,
                sequenceStartTime: 0
            };
        }

        if (isInteracting === state.lastIsInteracting) return false; // Fast exit for the vast majority of ticks.

        state.lastIsInteracting = isInteracting;

        if (!isInteracting) return false; // Return false on a falling edge.

        const now = Date.now();

        // If the time window has passed, reset the sequence.
        if (state.clickCount > 0 && (now - state.sequenceStartTime > this.WINDOW_MS)) {
            state.clickCount = 0;
        }

        if (state.clickCount === 0) {
            state.sequenceStartTime = now;
            state.clickCount = 1;

            return false;
        }

        if (++state.clickCount !== this.REQUIRED_CLICKS) return false;

        state.clickCount = 0; // Reset for next unique sequence.

        return true;
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

const EASTWOOD_FFA_SPAWNING_SOLDIER_OPTIONS: FFASpawningSoldier.InitializeOptions = {
    minimumSafeDistance: 40,
    maximumInterestingDistance: 80,
    safeOverInterestingFallbackFactor: 1.5,
};

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

const EMPIRE_STATE_FFA_SPAWNING_SOLDIER_OPTIONS: FFASpawningSoldier.InitializeOptions = {
    minimumSafeDistance: 20,
    maximumInterestingDistance: 40,
    safeOverInterestingFallbackFactor: 1.5,
};

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

    public static playerDied(player: mod.Player, undeployCallback: (player: mod.Player) => void): void {
        const playerId = mod.GetObjId(player);
        
        const thisDeathTime = mod.GetMatchTimeElapsed();
        
        this.lastPlayerDeathTime[playerId] = thisDeathTime;

        mod.Wait(this.MAX_TIME_TO_UNDEPLOY).then(() => {
            const isSameDeathEvent = this.lastPlayerDeathTime[playerId] === thisDeathTime;
            const hasUndeployed = (this.lastPlayerUndeployTime[playerId] || 0) >= thisDeathTime;

            if (!isSameDeathEvent || hasUndeployed) return;

            dynamicLogger?.log(`<PUF> P_${playerId} stuck in limbo. Calling undeployCallback.`);

            undeployCallback(player);
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

    private static readonly BIG_BOUNTY_THRESHOLD: number = 30;

    private static readonly MAX_BIG_BOUNTIES: number = 3;

    private static readonly SPOTTING_DURTATIONS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        5, // 4
        10, // 5
        15, // 6
        20, // 7
        29, // 8
    ];

    private static readonly STREAK_SPOTTING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        25, // 4
        20, // 5
        15, // 6
        10, // 7
        1, // 8
    ];

    private static readonly STREAK_FLAGGING_DELAYS: number[] = [
        0, // 0
        0, // 1
        0, // 2
        0, // 3
        0, // 4
        16, // 5
        8, // 6
        4, // 7
        2, // 8
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

    private static readonly AWARD_SOUNDS: ({ sfxAsset: mod.RuntimeSpawn_Common, amplitude: number } | undefined)[] = [
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 0
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 1
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 2
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 3
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_EOR_MasteryRankUp_OneShot2D, amplitude: 3 }, // 4
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Notification_SectorBonus_ProgressBarFinished_OneShot2D, amplitude: 1 }, // 5
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Notification_SectorBonus_ProgressBarFinished_OneShot2D, amplitude: 1 }, // 6
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Scorelog_Accolades_AccoladeTypes_CareerBest_OneShot2D, amplitude: 1 }, // 7
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Scorelog_Accolades_AccoladeTypes_CareerBest_OneShot2D, amplitude: 1 }, // 8
        { sfxAsset: mod.RuntimeSpawn_Common.SFX_UI_Notification_SidePanel_Mastery_OneShot2D, amplitude: 2 }, // 9
    ];

    private static readonly ZERO_VECTOR: mod.Vector = mod.CreateVector(0, 0, 0);

    private static readonly WORLD_ICON_SCALE: mod.Vector = mod.CreateVector(0.5, 0.5, 0.5);

    private static readonly WORLD_ICON_OFFSET: mod.Vector = mod.CreateVector(0, 3, 0);

    private static readonly AWARD_DURATION: number = 2;

    private static readonly ALL_BOUNTY_HUNTERS: { [playerId: number]: BountyHunter } = {};

    private static readonly BIG_BOUNTIES: Map<number, { bounty: number, position: mod.Vector }> = new Map();

    private static readonly SELF_INFO_CONTAINER_PARAMS: UI.ContainerParams = {
        x: 0,
        y: 0,
        width: 450,
        height: 120,
        anchor: mod.UIAnchor.TopCenter,
        bgColor: UI.COLORS.BF_GREY_4,
        bgAlpha: 0.75,
        bgFill: mod.UIBgFill.Blur,
        depth: mod.UIDepth.BelowGameUI
    };

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
        return mod.Message(mod.stringkeys.bountyHunter.hud.award, points);
    }

    private static getAwardSound(killStreak: number): { sfxAsset: mod.RuntimeSpawn_Common, amplitude: number } | undefined {
        const sounds = BountyHunter.AWARD_SOUNDS;
        return killStreak < sounds.length ? sounds[killStreak] : sounds[sounds.length - 1];
    }

    private static createWorldIcon(position: mod.Vector): mod.WorldIcon {
        const worldIcon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, position, BountyHunter.ZERO_VECTOR, BountyHunter.WORLD_ICON_SCALE);
        mod.SetWorldIconColor(worldIcon, UI.COLORS.BF_RED_BRIGHT); // TODO: Use color based on kill streak?
        mod.SetWorldIconImage(worldIcon, mod.WorldIconImages.Triangle);
        mod.EnableWorldIconImage(worldIcon, true);
        mod.EnableWorldIconText(worldIcon, true);

        return worldIcon;
    }

    private static deleteWorldIcon(worldIcon?: mod.WorldIcon): void {
        if (!worldIcon) return;
    
        mod.UnspawnObject(worldIcon);
    }

    private static updateBigBounties(player: mod.Player, bounty: number, position: mod.Vector): void {
        this.BIG_BOUNTIES.set(mod.GetObjId(player), { bounty, position });

        const bigBounties =
            Array
                .from(BountyHunter.BIG_BOUNTIES.entries())
                .filter(([_, { bounty }]) => bounty >= BountyHunter.BIG_BOUNTY_THRESHOLD)
                .sort((a, b) => a[1].bounty - b[1].bounty) // Ascending sort.
                .slice(0, BountyHunter.MAX_BIG_BOUNTIES)
                .map(([playerId, { bounty, position }]) => ({ bountyHunter: BountyHunter.getFromPlayerId(playerId), bounty, position }));

        Object.values(BountyHunter.ALL_BOUNTY_HUNTERS).forEach((bountyHunter) => {
            bountyHunter.updateBigBountiesUI(bigBounties);
        });
    }

    private static getKillStreakUIParams(parent: UI.Container): UI.TextParams {
        return {
            x: 0,
            y: 60,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: BountyHunter.getKillStreakMessage(0),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            parent,
        };
    }

    private static getSpottedUIParams(parent: UI.Container): UI.TextParams {
        return {
            x: 0,
            y: 90,
            width: 400,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            message: BountyHunter.getSpottedMessage(0),
            textSize: 20,
            textColor: UI.COLORS.BF_GREEN_BRIGHT,
            parent,
        };
    }

    private static getAwardUIParams(): UI.TextParams {
        return {
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
        };
    }

    private static getBigBountyTextUIParams(x: number, width: number, anchor: mod.UIAnchor, message: mod.Message, textColor: mod.Vector): UI.TextParams {
        return {
            type: UI.Type.Text,
            x,
            width,
            height: 20,
            anchor,
            message: message,
            textSize: 14,
            textColor,
            textAnchor: anchor,
        };
    }

    private static getBigBountyRowUIParams(y: number): UI.ContainerParams {
        const childrenParams: UI.TextParams[] = [
            this.getBigBountyTextUIParams(3, 90, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, 0), UI.COLORS.BF_GREEN_BRIGHT),
            this.getBigBountyTextUIParams(88, 60, mod.UIAnchor.CenterLeft, mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.unknownHeading), UI.COLORS.WHITE),
            this.getBigBountyTextUIParams(3, 200, mod.UIAnchor.CenterRight, mod.Message(0), UI.COLORS.BF_RED_BRIGHT),
        ];

        return {
            type: UI.Type.Container,
            y: y,
            width: 294,
            height: 24,
            anchor: mod.UIAnchor.BottomLeft,
            bgColor: UI.COLORS.BF_GREY_4,
            bgAlpha: 0.70,
            bgFill: mod.UIBgFill.Blur,
            visible: false,
            childrenParams: childrenParams,
        };
    }

    private static getBigBountyUIParams(): UI.ContainerParams {
        const childrenParams: UI.ContainerParams[] = Array(BountyHunter.MAX_BIG_BOUNTIES).fill({}).map((_, index) => this.getBigBountyRowUIParams(index * (20 + 4)));

        return {
            x: 32,
            y: 340,
            width: 296,
            height: BountyHunter.MAX_BIG_BOUNTIES * 24,
            anchor: mod.UIAnchor.BottomLeft,
            depth: mod.UIDepth.AboveGameUI,
            childrenParams: childrenParams,
            visible: false,
        };
    }

    private static getHeading(start: mod.Vector, target: mod.Vector): number {
        const dx = mod.XComponentOf(target) - mod.XComponentOf(start);
        const dz = mod.ZComponentOf(target) - mod.ZComponentOf(start);
        const angleRadians = Math.atan2(dx, -dz);
        const angleDegrees = angleRadians * (180 / Math.PI);

        return angleDegrees < 0 ? angleDegrees + 360 : angleDegrees;
    }

    private static getDistanceMessage(bountyPosition: mod.Vector, position?: mod.Vector): mod.Message {
        if (!position) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.unknownHeading);

        const heading = this.getHeading(position, bountyPosition);
        const distance = ~~mod.DistanceBetween(position, bountyPosition);

        if (heading < 22.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingN, distance);
        if (heading < 67.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingNE, distance);
        if (heading < 112.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingE, distance);
        if (heading < 157.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingSE, distance);
        if (heading < 202.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingS, distance);
        if (heading < 247.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingSW, distance);
        if (heading < 292.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingW, distance);
        if (heading < 337.5) return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingNW, distance);
        return mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.headingN, distance);
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
        return Object.values(BountyHunter.ALL_BOUNTY_HUNTERS).reduce((leader: BountyHunter | undefined, bountyHunter: BountyHunter) => {
            return leader && leader.points > bountyHunter.points ? leader : bountyHunter;
        }, undefined);
    }
    
    public static getFromPlayer(player: mod.Player): BountyHunter {
        return BountyHunter.ALL_BOUNTY_HUNTERS[mod.GetObjId(player)];
    }
    
    public static getFromPlayerId(playerId: number): BountyHunter {
        return BountyHunter.ALL_BOUNTY_HUNTERS[playerId];
    }

    public static handleKill(killerPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const killer = BountyHunter.getFromPlayer(killerPlayer);
        const victim = victimPlayer && BountyHunter.getFromPlayer(victimPlayer);
        const victimIsValid = victim && !victim.deleteIfNotValid();
        const victimKillStreak = victim?.killStreak ?? 0; // This needs to be captured before the victim's kill streak is reset.
        const bounty = BountyHunter.getBounty(victimKillStreak);

        if (victimPlayer && bounty >= BountyHunter.BIG_BOUNTY_THRESHOLD) {
            BountyHunter.updateBigBounties(victimPlayer, 0, mod.CreateVector(0, 0, 0)); // TODO: Perhaps position should be undefined.
        }

        if (victimIsValid) {
            victim.killBeforeDeath = victim.killStreak;
            ++victim.deaths;
            victim.setKillStreak(0);
            victim.bigBountiesUI?.hide();

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

        dynamicLogger?.log(`<BH> P_${killer ? killer.playerId : 'U'} killed P_${victim ? victim.playerId : 'U'} and got ${bounty} PTS.`);

        if (killer.deleteIfNotValid()) return;

        killer.awardBounty(victimKillStreak, bounty);
        ++killer.kills;
        killer.setKillStreak(killer.killStreak + 1);

        if (victim) {
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.bountyHunter.hud.killLog, victim.player, victimKillStreak, bounty), killer.player);
        }

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

        dynamicLogger?.log(`P_${assister ? assister.playerId : 'U'} assisted in killing P_${victim ? victim.playerId : 'U'} and got ${bounty} PTS.`);

        if (assister.deleteIfNotValid()) return;

        assister.points += bounty;
        ++assister.assists;

        if (victim) {
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.bountyHunter.hud.assistLog, victim.player, killStreak, bounty), assister.player);
        }

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
        bountyHunter.bigBountiesUI?.show();
    }

    constructor(player: mod.Player) {
        this.player = player;
        this.playerId = mod.GetObjId(player);

        this.isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);

        BountyHunter.ALL_BOUNTY_HUNTERS[this.playerId] = this;

        if (this.isAI) {
            // dynamicLogger?.log(`<BH> P_${this.playerId} is an AI soldier, skipping initialization.`);
            return;
        }

        const selfInfoContainer = UI.createContainer(BountyHunter.SELF_INFO_CONTAINER_PARAMS, player);
    
        this.killStreakUI = UI.createText(BountyHunter.getKillStreakUIParams(selfInfoContainer), player);
        this.spottedUI = UI.createText(BountyHunter.getSpottedUIParams(selfInfoContainer), player);
        this.awardUI = UI.createText(BountyHunter.getAwardUIParams(), player);
        this.bigBountiesUI = UI.createContainer(BountyHunter.getBigBountyUIParams(), player);
    }

    // ---- Private Variables ---- //

    private killStreakUI?: UI.Text;

    private spottedUI?: UI.Text;

    private awardUI?: UI.Text;

    private bigBountiesUI?: UI.Container;

    private playerId: number;

    private isAI: boolean = false;

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
            // dynamicLogger?.log(`<BH> Suspending spotting for P_${this.playerId}.`);
            this.isSpotted = false;
            return;
        }

        dynamicLogger?.log(`<BH> Spotting P_${this.playerId} for ${duration}s on, ${delay}s off.`);

        mod.SpotTarget(this.player, duration, mod.SpotStatus.SpotInBoth);
        mod.Wait(duration + delay).then(() => this.spot());
    }

    private flag(worldIcon?: mod.WorldIcon): void {
        if (this.deleteIfNotValid()) return BountyHunter.deleteWorldIcon(worldIcon);

        const delay = BountyHunter.getFlaggingDelay(this.killStreak);

        if (!delay) {
            // dynamicLogger?.log(`<BH> Suspending flagging for P_${this.playerId}.`);

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

        mod.SetWorldIconText(worldIcon, mod.Message(mod.stringkeys.bountyHunter.worldIcon, bounty));

        dynamicLogger?.log(`<BH> Flagging P_${this.playerId} every ${delay}s (${bounty} PTS).`);

        mod.Wait(delay).then(() => this.flag(worldIcon));

        if (bounty < BountyHunter.BIG_BOUNTY_THRESHOLD) return;

        BountyHunter.updateBigBounties(this.player, bounty, position);
    }

    private awardBounty(victimKillStreak: number, bounty: number): void {
        const sound = BountyHunter.getAwardSound(victimKillStreak);

        if (sound) {
            Sounds.play2D(sound.sfxAsset, { duration: 5, player: this.player, amplitude: sound.amplitude });
        }

        this.points += bounty;

        if (!this.awardUI) return;

        this.awardUI.setMessage(BountyHunter.getAwardMessage(bounty));
        this.awardUI.show();
        
        mod.Wait(BountyHunter.AWARD_DURATION).then(() => this.awardUI?.hide());
    }

    private setKillStreak(killStreak: number): void {
        this.killStreak = killStreak;
        this.killStreakUI?.setMessage(BountyHunter.getKillStreakMessage(killStreak));
        this.spottedUI?.setMessage(BountyHunter.getSpottedMessage(killStreak));
    }

    private updateBigBountiesUI(bigBounties: { bountyHunter: BountyHunter, bounty: number, position: mod.Vector }[]): void {
        if (this.isAI) return;

        const position = mod.GetSoldierState(this.player, mod.SoldierStateBool.IsAlive) ? mod.GetSoldierState(this.player, mod.SoldierStateVector.GetPosition) : undefined;

        const availableBigBounties = bigBounties.filter(({ bountyHunter }) => bountyHunter.playerId !== this.playerId);
        const startingIndex = availableBigBounties.length - 1;

        for (let index = BountyHunter.MAX_BIG_BOUNTIES - 1; index >= 0; --index) {
            const row = this.bigBountiesUI?.children[index] as UI.Container;

            if (index > startingIndex) {
                (row.children[0] as UI.Text).setMessage(mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, 0));
                (row.children[1] as UI.Text).setMessage(mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.unknownHeading));
                (row.children[2] as UI.Text).setMessage(mod.Message(-1));

                row.hide();

                continue;
            }

            const { bountyHunter, bounty, position: bountyPosition } = availableBigBounties[index];

            // child.visible = true;
            (row.children[0] as UI.Text).setMessage(mod.Message(mod.stringkeys.bountyHunter.hud.bigBounty.points, bounty));
            (row.children[1] as UI.Text).setMessage(BountyHunter.getDistanceMessage(bountyPosition, position));
            (row.children[2] as UI.Text).setMessage(mod.Message(bountyHunter.player));

            row.show();
        }
    }

    private deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this.player)) return false;

        dynamicLogger?.log(`<BH> P_${this.playerId} is no longer in the game.`);

        this.killStreak = 0;
        this.killStreakUI?.delete();
        this.spottedUI?.delete();

        BountyHunter.updateBigBounties(this.player, 0, mod.CreateVector(0, 0, 0)); // TODO: Perhaps position should be undefined.

        delete BountyHunter.ALL_BOUNTY_HUNTERS[this.playerId];

        return true;
    }

}

const DEBUG_MENU = {
    x: 0,
    y: 0,
    width: 300,
    height: 300,
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

                const logLine = `P_${playerId} last log: ${playerLogs[playerId] && playerLogs[playerId].length > 0 ? playerLogs[playerId][playerLogs[playerId].length - 1] : 'No logs'}`;

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

                staticLogger?.log(lastLogIndex >= 6 ? playerLogs[playerId][lastLogIndex - 6] : 'No logs', 6);
                staticLogger?.log(lastLogIndex >= 5 ? playerLogs[playerId][lastLogIndex - 5] : 'No logs', 7);
                staticLogger?.log(lastLogIndex >= 4 ? playerLogs[playerId][lastLogIndex - 4] : 'No logs', 8);
                staticLogger?.log(lastLogIndex >= 3 ? playerLogs[playerId][lastLogIndex - 3] : 'No logs', 9);
                staticLogger?.log(lastLogIndex >= 2 ? playerLogs[playerId][lastLogIndex - 2] : 'No logs', 10);
                staticLogger?.log(lastLogIndex >= 1 ? playerLogs[playerId][lastLogIndex - 1] : 'No logs', 11);
                staticLogger?.log(lastLogIndex >= 0 ? playerLogs[playerId][lastLogIndex] : 'No logs', 12);
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 120,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.clearDynamicLogs),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                dynamicLogger?.clear();
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 140,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveAIKill10),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 10));
            },
        },
        {
            type: UI.Type.Button,
            x: 0,
            y: 160,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.TopCenter,
            bgColor: UI.COLORS.GREY_25,
            baseColor: UI.COLORS.BLACK,
            label: {
                message: mod.Message(mod.stringkeys.debug.buttons.giveAIKill20),
                textSize: 20,
                textColor: UI.COLORS.GREEN,
            },
            onClick: async (player: mod.Player): Promise<void> => {
                BountyHunter.handleKill(mod.ValueInArray(mod.AllPlayers(), 20));
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

export function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): void {
    UI.handleButtonClick(player, widget, event);
}

export function OngoingGlobal(): void {
    performanceStats?.trackTick();
}

export function OnGameModeStarted(): void {
    BountyHunter.initialize();

    const { spawnData, spawnOptions } =
        MapDetector.currenMap == MapDetector.Map.EmpireState
            ? { spawnData: EMPIRE_STATE_SPAWNS, spawnOptions: EMPIRE_STATE_FFA_SPAWNING_SOLDIER_OPTIONS }
            : { spawnData: EASTWOOD_SPAWNS, spawnOptions: EASTWOOD_FFA_SPAWNING_SOLDIER_OPTIONS };

    FFASpawningSoldier.initialize(spawnData, spawnOptions);
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

export function OngoingPlayer(eventPlayer: mod.Player): void {
    if (mod.GetObjId(eventPlayer) != 0) return;

    if (!InteractMultiClickDetector.checkMultiClick(eventPlayer)) return;

    debugMenu?.show();
    mod.EnableUIInputMode(true, eventPlayer);
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    playerLogs[mod.GetObjId(eventPlayer)] = [`OnPlayerJoinGame started`];

    new BountyHunter(eventPlayer);
    const soldier = new FFASpawningSoldier(eventPlayer);

    soldier.startDelayForPrompt();

    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerJoinGame completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger = new Logger(eventPlayer, { staticRows: true, visible: false, anchor: mod.UIAnchor.TopLeft, textColor: UI.COLORS.BF_RED_BRIGHT });
    dynamicLogger = new Logger(eventPlayer, { staticRows: false, visible: false, anchor: mod.UIAnchor.TopRight, width: 700, height: 800 });
    debugMenu = UI.createContainer(DEBUG_MENU, eventPlayer);
    performanceStats = new PerformanceStats({ log: (text: string) => dynamicLogger?.log(text) });
    performanceStats?.startHeartbeat();
    
    const logger = (text: string) => dynamicLogger?.log(text);
    FFASpawningSoldier.setLogging(logger, FFASpawningSoldier.LogLevel.Info);
}

export function OnPlayerDied(victimPlayer: mod.Player, killerPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock): void {
    playerLogs[mod.GetObjId(victimPlayer)].push(`OnPlayerDied started`);

    BountyHunter.handleKill(killerPlayer, victimPlayer);
    PlayerUndeployFixer.playerDied(victimPlayer, (player: mod.Player) => OnPlayerUndeploy(player));

    playerLogs[mod.GetObjId(victimPlayer)].push(`OnPlayerDied completed`);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerUndeploy started`);

    PlayerUndeployFixer.playerUndeployed(eventPlayer);
    FFASpawningSoldier.startDelayForPrompt(eventPlayer);

    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerUndeploy completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger?.clear();
    debugMenu?.hide();
    mod.EnableUIInputMode(false, eventPlayer);
}

export function OnPlayerEarnedKillAssist(assisterPlayer: mod.Player, victimPlayer: mod.Player): void {
    BountyHunter.handleAssist(assisterPlayer, victimPlayer);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerDeployed started`);

    BountyHunter.handleDeployed(eventPlayer);

    playerLogs[mod.GetObjId(eventPlayer)].push(`OnPlayerDeployed completed`);

    if (mod.GetObjId(eventPlayer) != 0) return;

    debug(eventPlayer);
}

function debug(player: mod.Player): void {
    mod.Wait(0.5).then(() => {
        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) return;

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
