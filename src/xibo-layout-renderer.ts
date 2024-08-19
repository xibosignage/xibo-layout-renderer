/*
 * Copyright (C) 2024 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://www.xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import {
    Layout, getLayout, getXlf, initRenderingDOM
} from './Modules/Layout';
import { platform } from './Modules/Platform';
import {
    ILayout, initialLayout, InputLayoutType, OptionsType,
} from './Types/Layout';
import { initialXlr, IXlr } from './Types/XLR';
import {SplashScreen, ISplashScreen} from './Modules/SplashScreen';

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

            // Prepare rendering DOM
            const previewCanvas = document.querySelector('.preview-canvas');

            initRenderingDOM(previewCanvas);

            // Prepare splash screen
            const splashScreen = SplashScreen(
                document.querySelector('.player-preview'),
                self.config,
            );

            splashScreen.show();

        },
        init() {
            return new Promise<IXlr>((resolve) => {
                const self = this;

                self.prepareLayouts().then((xlr) => {
                    resolve(xlr);
                });
            });
        },

        playSchedules(xlr: IXlr) {
            // Check if there's a current layout
            if (xlr.currentLayout !== undefined) {
                xlr.currentLayout.emitter?.emit('start', xlr.currentLayout);
                xlr.currentLayout.run();
            }
        },

        updateLayouts(inputLayouts: InputLayoutType[]) {
            /**
             * @TODO
             * Case 1: If currentLayout in inputLayouts and in the same sequence,
             * Then, continue playing currentLayout.
             * Check nextLayout in inputLayouts. If in inputLayouts and same sequence, then don't change.
             * If not in inputLayouts, then replace and prepare nextLayout.
             *
             * Case 2: If currentLayout in inputLayouts but not in the same sequence,
             * Then, replace loop, prepare layouts and start currentLayout
             *
             * Case 3: If currentLayout not in inputLayouts,
             * Then, replace everything and start from first layout in sequence.
             */
            const self = this;

            self.inputLayouts = inputLayouts;

            const xlrLayouts = getLayout({xlr: self});

            console.log({xlrLayouts});
        },

        async prepareLayouts() {
            const self = this;
            // Get layouts
            const xlrLayouts = getLayout({xlr: self});

            self.currentLayoutId = xlrLayouts.current?.layoutId as ILayout['layoutId'];

            const layoutsXlf = () => {
                let xlf = [];

                xlf.push(xlrLayouts.current);

                if (xlrLayouts.current?.layoutId !== xlrLayouts.next?.layoutId) {
                    xlf.push(xlrLayouts.next);
                }

                return xlf.reduce((coll: Promise<ILayout>[], item) => {
                    return [
                        ...coll,
                        self.prepareLayoutXlf(item),
                    ];
                }, []);
            };
            const layouts = await Promise.all<Array<Promise<ILayout>>>(layoutsXlf());

            return new Promise<IXlr>((resolve) => {
                self.layouts = layouts;
                self.currentLayout = self.layouts[0];

                if (Boolean(self.layouts[1])) {
                    self.nextLayout = self.layouts[1];
                } else {
                    // Use current layout as next layout if only one layout is available
                    self.nextLayout = self.layouts[0];
                }

                self.currentLayoutIndex = xlrLayouts.currentLayoutIndex;
                self.layouts[self.currentLayoutIndex] = self.currentLayout;

                resolve(self);
            });
        },

        async prepareLayoutXlf(inputLayout: ILayout) {
            const self = this;
            // Compose layout props first
            let newOptions: OptionsType = Object.assign({}, platform);

            newOptions = {
                ...newOptions,
                ...props.options,
            };

            if (self.config.platform ==='CMS' &&
                inputLayout && Boolean(inputLayout.layoutId)
            ) {
                newOptions.xlfUrl =
                    newOptions.xlfUrl.replace(':layoutId', String(inputLayout.layoutId));
            } else if (self.config.platform === 'chromeOS') {
                newOptions.xlfUrl = inputLayout.path as string;
            }

            let layoutXlf: string;
            let layoutXlfNode: Document | null;
            if (inputLayout && inputLayout.layoutNode === null) {
                layoutXlf = await getXlf(newOptions);

                const parser = new window.DOMParser();
                layoutXlfNode = parser.parseFromString(layoutXlf as string, 'text/xml');
            } else {
                layoutXlfNode = inputLayout && inputLayout.layoutNode;
            }

            return new Promise<ILayout>((resolve) => {
                const xlrLayoutObj = initialLayout;
                
                xlrLayoutObj.id = Number(inputLayout.layoutId);
                xlrLayoutObj.layoutId = Number(inputLayout.layoutId);
                xlrLayoutObj.options = newOptions;

                resolve(Layout(layoutXlfNode, newOptions, self, xlrLayoutObj));
            });
        },
    }

    xlrObject.bootstrap();

    return xlrObject;
}
