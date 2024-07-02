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
} from "./Modules/Layout";
import { platform } from './Modules/Platform';
import {
    ILayout, initialLayout, InputLayoutType, OptionsType,
} from "./Types/Layout";
import { ELayoutType, initialXlr, IXlr } from './Types/XLR';

export function XiboLayoutRenderer(
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
            // Check if there's a current layout
            if (xlr.currentLayout !== undefined) {
                xlr.currentLayout.emitter?.emit('start', xlr.currentLayout);
                xlr.currentLayout.run();
            }
        },

        async prepareLayoutXlf(inputLayout: ILayout, type: ELayoutType) {
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
                    newOptions.xlfUrl.replace(':layoutId', inputLayout.layoutId);
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
                
                xlrLayoutObj.id = inputLayout.layoutId;
                xlrLayoutObj.layoutId = inputLayout.layoutId;
                xlrLayoutObj.options = newOptions;

                resolve(Layout(layoutXlfNode, newOptions, self, xlrLayoutObj));
            });
        },

        async prepareLayouts() {
            const self = this;
            // Get layouts
            const xlrLayouts = getLayout({xlr: self});

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
