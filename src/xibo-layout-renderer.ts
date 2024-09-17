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
import Layout, { getLayout, getXlf, initRenderingDOM } from './Modules/Layout';
import { platform } from './Modules/Platform';
import {
    ILayout, initialLayout, InputLayoutType, OptionsType,
} from './Types/Layout';
import { initialXlr, IXlr } from './Types/XLR';
import SplashScreen, {PreviewSplashElement} from './Modules/SplashScreen';
import {getIndexByLayoutId} from './Modules/Generators/Generators';

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
    };


    xlrObject.bootstrap = function() {
        // Place to set configurations and initialize required props
        const self = this;
        self.inputLayouts = !Array.isArray(props.inputLayouts) ?
            [props.inputLayouts] : props.inputLayouts;
        self.config = JSON.parse(JSON.stringify({...platform, ...props.options}));

        // Prepare rendering DOM
        const previewCanvas = document.querySelector('#preview_canvas');

        initRenderingDOM(previewCanvas);

        // Prepare splash screen
        const splashScreen = SplashScreen(
            document.querySelector('.player-preview'),
            self.config,
        );

        splashScreen.show();
    };
    xlrObject.init = function() {
        return new Promise<IXlr>((resolve) => {
            const self = this;

            // Check if only have splash screen from inputLayouts
            if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
                resolve(self);
            } else {
                self.prepareLayouts().then((xlr) => {
                    resolve(xlr);
                });
            }
        });
    };

    xlrObject.playSchedules = function(xlr: IXlr) {
        // Check if there's a current layout
        if (xlr.currentLayout !== undefined) {
            const $splashScreen = document.querySelector('.preview-splash') as PreviewSplashElement;
            if ($splashScreen && $splashScreen.style.display === 'block') {
                $splashScreen?.hide();
            }

            xlr.currentLayout.emitter.emit('start', xlr.currentLayout);
            xlr.currentLayout.run();
        }
    };

    xlrObject.updateLoop = function(inputLayouts: InputLayoutType[]) {
        this.updateLayouts(inputLayouts);
    };

    xlrObject.updateLayouts = async function(inputLayouts: InputLayoutType[]) {
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

        this.inputLayouts = inputLayouts;
        /** Case 1: When currentLayout is not in inputLayouts
         * Then, replace everything and start from first layout
         */
        if (inputLayouts.filter((inputLayout) => inputLayout.layoutId === this.currentLayout?.layoutId).length === 0) {
            const xlr = await this.prepareLayouts();
            this.playSchedules(xlr);
        } else {
            /** Case 2: When currentLayout is in inputLayouts, then continue playing
             * Also check for nextLayout if in inputLayouts and same sequence, then don't change and continue playing.
             * If not in inputLayouts, then replace and prepare nextLayout.
             */

            // 2.1 We don't have to do anything for currentLayout
            // 2.2 Check for nextLayout
            // Get nextLayout index
            const currLayoutIndex = getIndexByLayoutId(inputLayouts, this.currentLayout?.layoutId).index as number;
            const nxtLayoutIndex = getIndexByLayoutId(inputLayouts, this.nextLayout?.layoutId).index as number;
            const tempOldNxtLayout = this.layouts[nxtLayoutIndex];
            let newNxtLayoutIndex = currLayoutIndex + 1;

            if (nxtLayoutIndex !== newNxtLayoutIndex) {
                // Delete old nextLayout
                delete this.layouts[nxtLayoutIndex];

                if (Boolean(this.layouts[newNxtLayoutIndex])) {
                    this.nextLayout = this.layouts[newNxtLayoutIndex];
                    this.layouts[newNxtLayoutIndex] = this.nextLayout;
                } else {
                    // Check if newNxtLayoutIndex is still within inputLayouts
                    if ((newNxtLayoutIndex + 1) > inputLayouts.length) {
                        // Goes back to first layout in the sequence
                        newNxtLayoutIndex = 0;
                    }

                    if (Boolean(inputLayouts[newNxtLayoutIndex])) {
                        const tempNxtLayout = {...initialLayout, ...inputLayouts[newNxtLayoutIndex]};
                        this.nextLayout = await this.prepareLayoutXlf(tempNxtLayout);
                        this.layouts[newNxtLayoutIndex] = this.nextLayout;
                    }

                    // Move old nextLayout to its index
                    let hasOldNxtLayout = inputLayouts
                        .filter((_layout) => _layout.layoutId === tempOldNxtLayout?.layoutId);

                    if (hasOldNxtLayout.length === 1) {
                        const oldNxtLayoutIndex =
                            getIndexByLayoutId(inputLayouts, hasOldNxtLayout[0].layoutId).index as number;
                        this.layouts[oldNxtLayoutIndex] = tempOldNxtLayout;
                    }
                }
            } else {
                // Check if newNxtLayout is not the same with nextLayout
                // Then, replace nextLayout with new one
                if (inputLayouts[nxtLayoutIndex].layoutId !== this.nextLayout?.layoutId) {
                    const tempNewNxtLayout = {...initialLayout, ...inputLayouts[nxtLayoutIndex]};
                    this.nextLayout = await this.prepareLayoutXlf(tempNewNxtLayout);
                    this.layouts[nxtLayoutIndex] = this.nextLayout;
                }

                // Remove old nextLayout if it's not in inputLayouts
                if (tempOldNxtLayout?.index && Boolean(this.layouts[tempOldNxtLayout?.index])) {
                    if (inputLayouts.filter((_layout) => _layout.layoutId === tempOldNxtLayout?.layoutId).length === 0) {
                        delete this.layouts[tempOldNxtLayout?.index];
                    }
                }
            }
        }
    };

    xlrObject.prepareLayouts = async function() {
        const self = this;
        // Get layouts
        const xlrLayouts = getLayout({xlr: self});

        console.log('prepareLayouts::xlrLayouts', xlrLayouts);

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
        console.log('prepareLayouts::layouts', layouts);
        console.log('prepareLayouts::xlr>layouts', self.layouts);

        return new Promise<IXlr>((resolve) => {
            layouts.map((layoutItem) => {
                if (!Boolean(self.layouts[layoutItem.index])) {
                    self.layouts[layoutItem.index] = layoutItem;
                }
            });
            self.currentLayoutIndex = xlrLayouts.currentLayoutIndex;
            self.currentLayout = self.layouts[self.currentLayoutIndex];

            if (Boolean(layouts[1])) {
                self.nextLayout = layouts[1];
            } else {
                // Use current layout as next layout if only one layout is available
                self.nextLayout = self.layouts[0];
            }

            self.layouts[self.currentLayoutIndex] = self.currentLayout;

            resolve(self);
        });
    };

    xlrObject.prepareLayoutXlf = async function(inputLayout: ILayout) {
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
            xlrLayoutObj.index = getIndexByLayoutId(this.inputLayouts, xlrLayoutObj.layoutId).index as number;

            resolve(Layout(layoutXlfNode, newOptions, self, xlrLayoutObj));
        });
    };

    xlrObject.bootstrap();

    return xlrObject;
}
