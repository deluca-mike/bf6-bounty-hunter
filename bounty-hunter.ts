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

const SPAWNS: { location: mod.Vector, orientation: number }[] = [
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
    }
];

let staticLogger: Logger | undefined;
let dynamicLogger: Logger | undefined;
let debugMenu: UI.Container | undefined;

// TODO: Either handle the case where there are no spawns, or spawn at HQ1.
class FFAAutoSpawningSoldier {

    private static allSoldiers: { [playerId: number]: FFAAutoSpawningSoldier } = {};

    private static readonly DELAY: number = 10;

    private static readonly SAFE_MINIMUM_DISTANCE: number = 20;
    
    private static readonly ACCEPTABLE_MAXIMUM_DISTANCE: number = 50;

    private static readonly PRIME_STEPS: number[] = [2039, 2027, 2017];

    private static readonly MAX_SPAWN_CHECKS: number = 10;

    private static spawns: { spawnPoint: mod.SpawnPoint, location: mod.Vector }[] = [];

    private static spawnQueue: FFAAutoSpawningSoldier[] = [];

    private static queueProcessingEnabled: boolean = false;

    private static queueProcessingActive: boolean = false;

    public static setSpawns(spawns: { location: mod.Vector, orientation: number }[]): void {
        FFAAutoSpawningSoldier.spawns = spawns.map(spawn => {
            return {
                spawnPoint: mod.GetSpawnPoint(mod.GetObjId(mod.SpawnObject(mod.RuntimeSpawn_Common.PlayerSpawner, spawn.location, FFAAutoSpawningSoldier.getRotationVector(spawn.orientation)))), // TODO: check if this can be just `as mod.SpawnPoint`.
                location: spawn.location
            };
        });

        dynamicLogger?.log(`<FFAASS>: Set ${FFAAutoSpawningSoldier.spawns.length} spawn points.`);
    }

    private static getRotationVector(orientation: number): mod.Vector {
        return mod.CreateVector(0, mod.DegreesToRadians(180 - orientation), 0);
    }

    private static getBestSpawnPoint(): mod.SpawnPoint {
        // Prime Walking Algorithm
        const primeSteps = FFAAutoSpawningSoldier.PRIME_STEPS;
        const stepSize = primeSteps[~~mod.RandomReal(0, primeSteps.length) % primeSteps.length]; // Mod because `RandomReal` is apparently inclusive of the end value.
        const spawns = FFAAutoSpawningSoldier.spawns;
        const startIndex = ~~mod.RandomReal(0, spawns.length) % spawns.length; // Mod because `RandomReal` is apparently inclusive of the end value.

        let bestFallback: mod.SpawnPoint = spawns[startIndex].spawnPoint;
        let maxDistance = -1;

        for (let i = 0; i < FFAAutoSpawningSoldier.MAX_SPAWN_CHECKS; ++i) {
            const index = (startIndex + (i * stepSize)) % spawns.length;
            const candidate = spawns[index];
            const distanceToClosestPlayer = FFAAutoSpawningSoldier.getDistanceToClosestPlayer(candidate.location);
        
            if (distanceToClosestPlayer >= FFAAutoSpawningSoldier.SAFE_MINIMUM_DISTANCE && distanceToClosestPlayer <= FFAAutoSpawningSoldier.ACCEPTABLE_MAXIMUM_DISTANCE) {
                dynamicLogger?.log(`<FFAASS>: Spawn-${index} is ideal (${distanceToClosestPlayer.toFixed(2)}m).`);
                return candidate.spawnPoint; 
            }
        
            if (distanceToClosestPlayer > maxDistance) {
                maxDistance = distanceToClosestPlayer;
                bestFallback = candidate.spawnPoint;
            }
        }

        dynamicLogger?.log(`<FFAASS>: Non-ideal fallback spawn (${maxDistance.toFixed(2)}m).`);

        return bestFallback;
    }

    private static getDistanceToClosestPlayer(location: mod.Vector): number {
        const closestPlayer = mod.ClosestPlayerTo(location);

        if (!mod.IsPlayerValid(closestPlayer)) return FFAAutoSpawningSoldier.SAFE_MINIMUM_DISTANCE; // No players alive on the map.

        return mod.DistanceBetween(location, mod.GetSoldierState(closestPlayer, mod.SoldierStateVector.GetPosition));
    }

    private static processSpawnQueue(): void {
        FFAAutoSpawningSoldier.queueProcessingActive = true;

        if (!FFAAutoSpawningSoldier.queueProcessingEnabled) {
            FFAAutoSpawningSoldier.queueProcessingActive = false;
            return;
        }

        dynamicLogger?.log(`<FFAASS>: Processing ${FFAAutoSpawningSoldier.spawnQueue.length} in queue.`);

        if (FFAAutoSpawningSoldier.spawnQueue.length == 0) {
            dynamicLogger?.log(`<FFAASS>: No players in queue. Suspending processing.`);
            FFAAutoSpawningSoldier.queueProcessingActive = false;
            return;
        }

        while (FFAAutoSpawningSoldier.spawnQueue.length > 0) {
            const soldier = FFAAutoSpawningSoldier.spawnQueue.shift();

            if (!soldier || soldier.deleteIfNotValid()) continue;

            dynamicLogger?.log(`<FFAASS>: Spawning Player-${soldier.playerId}.`);

            mod.SpawnPlayerFromSpawnPoint(soldier.player, FFAAutoSpawningSoldier.getBestSpawnPoint());
        }

        mod.Wait(1).then(() => FFAAutoSpawningSoldier.processSpawnQueue());
    }

    public static startDelay(player: mod.Player): void {
        dynamicLogger?.log(`<FFAASS>: Start delay request for Player-${mod.GetObjId(player)}.`);

        const soldier = FFAAutoSpawningSoldier.allSoldiers[mod.GetObjId(player)];

        if (!soldier || soldier.deleteIfNotValid()) return;

        soldier.startDelay();
    }

    public static forceIntoQueue(player: mod.Player): void {
        if (!mod.IsPlayerValid(player)) return;

        const soldier = FFAAutoSpawningSoldier.allSoldiers[mod.GetObjId(player)];

        if (!soldier || soldier.deleteIfNotValid()) return;

        soldier.addToQueue();
    }

    public static enableSpawnQueueProcessing(): void {
        dynamicLogger?.log(`<FFAASS>: Enabling processing spawn queue.`);

        if (FFAAutoSpawningSoldier.queueProcessingEnabled) return;

        FFAAutoSpawningSoldier.queueProcessingEnabled = true;
        FFAAutoSpawningSoldier.processSpawnQueue();
    }

    public static disableSpawnQueueProcessing(): void {
        dynamicLogger?.log(`<FFAASS>: Disabling processing spawn queue.`);

        FFAAutoSpawningSoldier.queueProcessingEnabled = false;
    }

    constructor(player: mod.Player, isAISoldier?: boolean) {
        this.player = player;
        this.playerId = mod.GetObjId(player);

        FFAAutoSpawningSoldier.allSoldiers[this.playerId] = this;

        if (isAISoldier) return;

        this.promptUI = UI.createContainer({
            x: 0,
            y: 0,
            width: 400,
            height: 80,
            anchor: mod.UIAnchor.Center,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0.5,
            visible: false,
            childrenParams: [
                {
                    type: UI.Type.Button,
                    x: 0,
                    y: 40,
                    width: 400,
                    height: 40,
                    anchor: mod.UIAnchor.TopCenter,
                    bgColor: UI.COLORS.GREY_25,
                    baseColor: UI.COLORS.BLACK,
                    label: {
                        message: mod.Message(mod.stringkeys.ffaAutoSpawningSoldier.buttons.spawn),
                        textSize: 30,
                        textColor: UI.COLORS.GREEN,
                    },
                    onClick: async (player: mod.Player): Promise<void> => {
                        this.addToQueue();
                    },
                },
                {
                    type: UI.Type.Button,
                    x: 0,
                    y: 0,
                    width: 400,
                    height: 40,
                    anchor: mod.UIAnchor.TopCenter,
                    bgColor: UI.COLORS.GREY_25,
                    baseColor: UI.COLORS.BLACK,
                    label: {
                        message: mod.Message(mod.stringkeys.ffaAutoSpawningSoldier.buttons.delay, FFAAutoSpawningSoldier.DELAY),
                        textSize: 30,
                        textColor: UI.COLORS.GREEN,
                    },
                    onClick: async (player: mod.Player): Promise<void> => {
                        this.startDelay();
                    },
                },
            ]
        }, player);

        this.countdownUI = UI.createText({
            x: 0,
            y: 60,
            width: 400,
            height: 30,
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.ffaAutoSpawningSoldier.countdown, this.delayCountdown),
            textSize: 30,
            textColor: UI.COLORS.GREEN,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0.5,
            bgFill: mod.UIBgFill.Solid,
            padding: 5,
            visible: false,
        }, player);
    }

    public player: mod.Player;

    private playerId: number;

    private delayCountdown: number = FFAAutoSpawningSoldier.DELAY;

    private promptUI?: UI.Container;

    private countdownUI?: UI.Text;

    private startDelay(): void {
        dynamicLogger?.log(`<FFAASS>: Starting delay for Player-${this.playerId}.`);

        this.countdownUI?.show();
        this.promptUI?.hide();
        mod.EnableUIInputMode(false, this.player);

        this.delayCountdown = FFAAutoSpawningSoldier.DELAY;
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
        FFAAutoSpawningSoldier.spawnQueue.push(this);

        dynamicLogger?.log(`<FFAASS>: Player-${this.playerId} added to queue (${FFAAutoSpawningSoldier.spawnQueue.length} total).`);

        this.countdownUI?.hide();
        this.promptUI?.hide();
        mod.EnableUIInputMode(false, this.player);

        if (!FFAAutoSpawningSoldier.queueProcessingEnabled || FFAAutoSpawningSoldier.queueProcessingActive) return;

        dynamicLogger?.log(`<FFAASS>: Restarting spawn queue processing.`);
        FFAAutoSpawningSoldier.processSpawnQueue();
    }

    private deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this.player)) return false;

        dynamicLogger?.log(`<FFAASS>: Player-${this.playerId} is no longer in the game!`);

        this.promptUI?.delete();
        this.countdownUI?.delete();
        delete FFAAutoSpawningSoldier.allSoldiers[this.playerId];
        return true;
    }

}

class BountyHunter {

    private static allBountyHunters: { [playerId: number]: BountyHunter } = {};
    
    public static readonly TARGET_POINTS: number = 250;

    public static readonly BASE_KILL_POINTS: number = 10;

    public static readonly SPOTTING_DURTATION: number = 3;

    public static readonly BOUNTY_MULTIPLIERS: number[] = [
        1, // 0
        1, // 1
        1, // 2
        2, // 3
        2, // 4
        4, // 5
        5, // 6
        6, // 7
        7, // 8
        8, // 9
        8, // 10
    ];

    // NOTE: Set these to either 0 or a number at least 1 second larger than `SPOTTING_DURTATION`.
    public static readonly STREAK_SPOTTING_DELAYS: number[] = [
        0, // 0
        30, // 1
        27, // 2
        24, // 3
        21, // 4
        19, // 5
        16, // 6
        13, // 7
        10, // 8
        7, // 9
        4, // 10
    ];

    public static getLeader(): BountyHunter | undefined {
        return Object.values(BountyHunter.allBountyHunters).reduce((leader: BountyHunter | undefined, bountyHunter: BountyHunter) => {
            return leader && leader.points > bountyHunter.points ? leader : bountyHunter;
        }, undefined);
    }
    
    public static getFromPlayer(player: mod.Player): BountyHunter {
        return BountyHunter.allBountyHunters[mod.GetObjId(player)];
    }

    public static handleKill(killerPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const killer = BountyHunter.getFromPlayer(killerPlayer);
        const victim = victimPlayer && BountyHunter.getFromPlayer(victimPlayer);
        const victimIsValid = victim && !victim.deleteIfNotValid();

        dynamicLogger?.log(`Player-${killer?.playerId} killed Player-${victim ? victim.playerId : 'U'}!`);

        if (victim) {
            victim.killBeforeDeath = victim.killStreak;
            victim.setKillStreak(0);
            ++victim.deaths;

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

        const bounty = BountyHunter.getBounty(victim?.killStreak ?? 0);

        killer.points += bounty;
        ++killer.kills;
        killer.setKillStreak(killer.killStreak + 1);

        dynamicLogger?.log(`Player-${killer.playerId} got ${bounty}pts (${killer.killStreak} kill streak)!`);

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

        if (killer.isSpotted || !BountyHunter.getSpottedDelay(killer.killStreak)) return;

        killer.isSpotted = true;
        killer.spot();
    }

    public static handleAssist(assisterPlayer: mod.Player, victimPlayer?: mod.Player): void {
        const assister = BountyHunter.getFromPlayer(assisterPlayer);
        const victim = victimPlayer && BountyHunter.getFromPlayer(victimPlayer);

        dynamicLogger?.log(`Player-${assister?.playerId} assisted in killing Player-${victim ? victim.playerId : 'U'}!`);

        if (assister.playerId == victim?.playerId) return;

        // Need to handle the race condition where `handleAssist` and `handleKill` for the same victim can be called in any order.
        const killStreakBeforeDeath = victim?.killBeforeDeath ?? 0;
        const killStreak = victim?.killStreak ?? 0;

        const bounty = BountyHunter.getBounty(killStreak || killStreakBeforeDeath);

        assister.points += bounty / 2;
        ++assister.assists;

        dynamicLogger?.log(`Player-${assister.playerId} got ${bounty / 2}pts!`);

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
        BountyHunter.getFromPlayer(player).killBeforeDeath = 0;
    }

    public static getKillStreakMessage(killStreak: number): mod.Message {
        return mod.Message(mod.stringkeys.bountyHunter.hud.killStreak, killStreak, BountyHunter.getBounty(killStreak));
    }

    public static getSpottedMessage(delay: number): mod.Message {
        return delay < 1
            ? mod.Message(mod.stringkeys.bountyHunter.hud.notSpotted)
            : mod.Message(mod.stringkeys.bountyHunter.hud.spotted, BountyHunter.SPOTTING_DURTATION, delay);
    }

    public static getSpottedDelay(killStreak: number): number {
        const delays = BountyHunter.STREAK_SPOTTING_DELAYS;
        return killStreak < delays.length ? delays[killStreak] : delays[delays.length - 1];
    }

    public static getBounty(killStreak: number): number {
        const multipliers = BountyHunter.BOUNTY_MULTIPLIERS;
        return BountyHunter.BASE_KILL_POINTS * (killStreak < multipliers.length ? multipliers[killStreak] : multipliers[multipliers.length - 1]);
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
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0.5,
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
            textColor: UI.COLORS.GREEN,
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
            textColor: UI.COLORS.GREEN,
            parent: container,
        }, player);
    }

    private killStreakUI: UI.Text;

    private spottedUI: UI.Text;

    private playerId: number;

    private isSpotted: boolean = false;

    public player: mod.Player;

    public kills: number = 0;

    public assists: number = 0;

    public deaths: number = 0;

    public killStreak: number = 0;

    public killBeforeDeath: number = 0;

    public points: number = 0;

    public spot(): void {
        if (this.deleteIfNotValid()) return;

        const delay = BountyHunter.getSpottedDelay(this.killStreak);

        if (delay < 1) {
            dynamicLogger?.log(`<BH>: Suspending spotting for Player-${this.playerId}.`);
            return;
        }

        dynamicLogger?.log(`<BH>: Spotting Player-${this.playerId} every ${delay}s!`);

        mod.SpotTarget(this.player, BountyHunter.SPOTTING_DURTATION, mod.SpotStatus.SpotInBoth);

        mod.Wait(delay).then(() => this.spot());
    }

    public setKillStreak(killStreak: number): void {
        const delay = BountyHunter.getSpottedDelay(this.killStreak = killStreak);
        this.killStreakUI.setMessage(BountyHunter.getKillStreakMessage(killStreak));
        this.spottedUI.setMessage(BountyHunter.getSpottedMessage(delay));
    }

    private deleteIfNotValid(): boolean {
        if (mod.IsPlayerValid(this.player)) return false;

        dynamicLogger?.log(`<BH>: Player-${this.playerId} is no longer in the game!`);

        this.killStreak = 0;

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
                dynamicLogger?.log(`<DEBUG>: Clicked toggle static logger button`);
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
                dynamicLogger?.log(`<DEBUG>: Clicked toggle dynamic logger button`);
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
                dynamicLogger?.log(`<DEBUG>: Clicked give kill button`);
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
                dynamicLogger?.log(`<DEBUG>: Clicked give assist button`);
                BountyHunter.handleAssist(player);
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
                dynamicLogger?.log(`<DEBUG>: Clicked close button`);
                mod.EnableUIInputMode(false, player);
                debugMenu?.hide();
            },
        },
    ]
};

export function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent) {
    UI.handleButtonClick(player, widget, event);
}

export function OnGameModeStarted(): void {
    mod.SetGameModeTimeLimit(1200); // 20 minutes
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

    mod.EnableHQ(mod.GetHQ(1), false);
    mod.EnableHQ(mod.GetHQ(2), false);

    FFAAutoSpawningSoldier.setSpawns(SPAWNS);
    FFAAutoSpawningSoldier.enableSpawnQueueProcessing();

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
    new BountyHunter(eventPlayer);
    new FFAAutoSpawningSoldier(eventPlayer);

    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
        dynamicLogger?.log(`<SCRIPT>: Player-${mod.GetObjId(eventPlayer)} is AI, forcing into spawn queue.`);
        FFAAutoSpawningSoldier.forceIntoQueue(eventPlayer);
        return;
    }

    FFAAutoSpawningSoldier.startDelay(eventPlayer);

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger = new Logger(eventPlayer, { staticRows: true, visible: false, anchor: mod.UIAnchor.TopLeft });
    dynamicLogger = new Logger(eventPlayer, { staticRows: false, visible: false, anchor: mod.UIAnchor.TopRight, width: 500, height: 700 });
    debugMenu = UI.createContainer(DEBUG_MENU, eventPlayer);
}

export function OnPlayerDied(victimPlayer: mod.Player, killerPlayer: mod.Player, eventDeathType: mod.DeathType, eventWeaponUnlock: mod.WeaponUnlock): void {
    BountyHunter.handleKill(killerPlayer, victimPlayer);
}

export function OnPlayerEarnedKillAssist(assisterPlayer: mod.Player, victimPlayer: mod.Player): void {
    BountyHunter.handleAssist(assisterPlayer, victimPlayer);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
        dynamicLogger?.log(`<SCRIPT>: Player-${mod.GetObjId(eventPlayer)} is AI, forcing into spawn queue.`);
        FFAAutoSpawningSoldier.forceIntoQueue(eventPlayer);
        return;
    }

    FFAAutoSpawningSoldier.startDelay(eventPlayer);

    if (mod.GetObjId(eventPlayer) != 0) return;

    staticLogger?.clear();
    debugMenu?.hide();
    mod.EnableUIInputMode(false, eventPlayer);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    dynamicLogger?.log(`<SCRIPT>: Player-${mod.GetObjId(eventPlayer)} spawned on Team-${mod.GetObjId(mod.GetTeam(eventPlayer))}.`);

    BountyHunter.handleDeployed(eventPlayer);

    if (mod.GetObjId(eventPlayer) != 0) return;
    
    dynamicLogger?.show();
    staticLogger?.show();

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

        debug(player);
    });
}

function getPlayerStateVectorString(player: mod.Player, type: mod.SoldierStateVector): string {
    return getVectorString(mod.GetSoldierState(player, type));
}

function getVectorString(vector: mod.Vector): string {
    return `<${mod.XComponentOf(vector).toFixed(2)}, ${mod.YComponentOf(vector).toFixed(2)}, ${mod.ZComponentOf(vector).toFixed(2)}>`;
}
