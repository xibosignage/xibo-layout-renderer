import {GetLayoutType, ILayout, initialLayout, InputLayoutType, OptionsType} from "./Types/Layout.types.js";
import Layout, {getLayout, getXlf, initRenderingDOM} from "./Modules/Layout/Layout.js";
import {platform} from "./Modules/Platform.js";
import {ELayoutType, initialXlr, IXlr, PrepareLayoutsType} from "./Types/XLR.types.js";
import {resolve} from "path";
// import {authApp} from "./Modules/Auth";

export default function XiboLayoutRenderer(
    inputLayouts: InputLayoutType[],
    options?: OptionsType,
) {
    const props = {
        inputLayouts,
        options,
    }

    const xlrObject: IXlr = {
        ...initialXlr,
        bootstrap() {
            // Place to set configurations and initialize required props
            const self = this;
            self.inputLayouts = !Array.isArray(props.inputLayouts) ?
                [props.inputLayouts] : props.inputLayouts;
            self.config = JSON.parse(JSON.stringify({...platform, ...props.options}));
        },
        init() {
            return new Promise<IXlr>((resolve) => {
                const self = this;

                // Prepare rendering DOM
                const previewCanvas = document.querySelector('.preview-canvas');

                initRenderingDOM(previewCanvas);

                self.prepareLayouts().then((xlr) => {
                    resolve(xlr);
                });
            });
        },

        playSchedules(xlr: IXlr) {
            // console.log({currentLayout: xlr.currentLayout});
            // Check if there's a current layout
            console.log({xlr, currentLayoutIndex: xlr.currentLayoutIndex})
            if (xlr.currentLayout !== undefined) {
                xlr.currentLayout.emitter?.emit('start', xlr.currentLayout);
                // while (xlr.currentLayoutIndex <= xlr.inputLayouts.length) {
                    xlr.currentLayout.run();
                // }
            }
        },

        async prepareLayoutXlf(inputLayout: ILayout, type: ELayoutType) {
            const self = this;
            // Compose layout props first
            const newOptions: OptionsType = Object.assign({}, platform);

            if (inputLayout && Boolean(inputLayout.layoutId)) {
                newOptions.xlfUrl =
                    newOptions.xlfUrl.replace(':layoutId', inputLayout.layoutId);
            }

            let layoutXlf: string;
            let layoutXlfNode: Document;
            if (inputLayout.layoutNode === null) {
                layoutXlf = await getXlf(newOptions);

                const parser = new window.DOMParser();
                layoutXlfNode = parser.parseFromString(layoutXlf as string, 'text/xml');
            } else {
                layoutXlfNode = inputLayout.layoutNode;
            }

            return new Promise<ILayout>((resolve) => {
                resolve(Layout(layoutXlfNode, newOptions, self, {
                    ...initialLayout,
                    ...inputLayout,
                    id: inputLayout.layoutId,
                    layoutId: inputLayout.layoutId,
                    options: newOptions,
                }));
            });
        },

        async prepareLayouts(params?: PrepareLayoutsType) {
            const self = this;
            // Get layouts
            const xlrLayouts = getLayout({xlr: self, moveNext: params?.moveNext});

            self.currentLayoutId = xlrLayouts.current?.layoutId;

            const layouts = await Promise.all<Array<Promise<ILayout>>>([
                self.prepareLayoutXlf(xlrLayouts.current, ELayoutType.CURRENT),
                self.prepareLayoutXlf(xlrLayouts.next, ELayoutType.NEXT)
            ]);

            return new Promise<IXlr>((resolve) => {
                self.currentLayout = layouts[0];
                self.nextLayout = layouts[1];
                self.currentLayoutIndex = xlrLayouts.currentLayoutIndex;
                self.layouts[self.currentLayoutIndex] = self.currentLayout;

                resolve(self);
            });
        },
    }

    xlrObject.bootstrap();

    return xlrObject;
}
