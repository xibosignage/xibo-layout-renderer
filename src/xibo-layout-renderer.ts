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
import { createNanoEvents } from 'nanoevents';

import Layout, { getLayout, getXlf, initRenderingDOM } from './Modules/Layout';
import { platform } from './Modules/Platform';
import {
    ILayout, initialLayout, InputLayoutType, OptionsType,
} from './Types/Layout';
import { ELayoutType, initialXlr, IXlr, IXlrEvents } from './Types/XLR';
import SplashScreen, {ISplashScreen, PreviewSplashElement} from './Modules/SplashScreen';
import {isLayoutValid} from "./Modules/Generators/Generators";

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

    let splashScreen: ISplashScreen;

    xlrObject.emitter = createNanoEvents<IXlrEvents>();

    xlrObject.emitter.on('layoutChange', async (layoutId: number) => {
        let targetLayout: { layout: ILayout; pos: ELayoutType } | undefined;

        if (layoutId === xlrObject.nextLayout?.layoutId) {
            targetLayout = {
                layout: xlrObject.nextLayout,
                pos: ELayoutType.NEXT
            };
        }

        if (targetLayout?.layout && targetLayout?.pos) {
            xlrObject.nextLayout = await xlrObject.prepareLayoutXlf(xlrObject.nextLayout);
        }
    });
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
        splashScreen = SplashScreen(
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
        const $splashScreen = document.querySelector('.preview-splash') as PreviewSplashElement;
        // Check if there's a current layout
        if (xlr.currentLayout !== undefined) {
            if ($splashScreen && $splashScreen.style.display === 'block') {
                $splashScreen?.hide();
            }

            xlr.currentLayout.emitter.emit('start', xlr.currentLayout);
            xlr.currentLayout.run();
        } else {
            // Show splash screen
            if ($splashScreen) {
                $splashScreen?.show();
            }

        }
    };

    xlrObject.updateLoop = function(inputLayouts: InputLayoutType[]) {
        this.updateLayouts(inputLayouts);
    };

    xlrObject.updateScheduleLayouts = function(scheduleLayouts: InputLayoutType[]) {
        this.uniqueLayouts = scheduleLayouts;
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

        // Case 1: no inputLayouts

        // Case 2: If currentLayout is still in the loop even when it has changed index,
        // then currentLayout is still valid and just continue playing
        const isCurrentLayoutValid = isLayoutValid(this.uniqueLayouts, this.currentLayoutId);
        if (isCurrentLayoutValid) {
            // Check if currentLayout sequence is still valid
            if (this.currentLayout && this.currentLayout.index < this.inputLayouts.length) {

                // If nextLayout index is still in the loop, then update nextLayout
                if (this.nextLayout && this.nextLayout.index < this.inputLayouts.length) {
                    this.nextLayout = await this.getLayout(this.inputLayouts[this.nextLayout.index]);
                } else {
                    // Case 3: If currentLayout is still in the loop and nextLayout index is not in the loop,
                    // then we move to loop[0]
                    // Else, nextLayout sequence is out loop, then move to loop[0]
                    this.currentLayoutIndex = this.inputLayouts.length - 1;
                    this.nextLayout = await this.getLayout(this.inputLayouts[0]);
                }
            } else {
                // Sequence of currentLayout is out of loop, then move to loop[0]
                this.currentLayout = undefined;
                this.nextLayout = undefined;
                this.currentLayoutIndex = 0;

                this.prepareLayouts().then(xlr => {
                    this.playSchedules(xlr);
                });
            }
        } else {
            // Case 4: If currentLayout is not in the loop,
            // then we expire currentLayout and move to loop[0]
            this.currentLayout = undefined;
            this.nextLayout = undefined;
            this.currentLayoutIndex = 0;

            this.prepareLayouts().then(xlr => {
                this.playSchedules(xlr);
            });
        }
        //
        // /**
        //  * Case 0: When inputLayouts length = 0
        //  */
        // if (inputLayouts.length === 0) {
        //
        //     if (this.currentLayout) {
        //         this.currentLayout.inLoop = false;
        //     }
        //
        //     this.currentLayout = undefined;
        //     this.nextLayout = undefined;
        //     this.currentLayoutIndex = 0;
        //
        //     this.prepareLayouts().then(xlr => {
        //         this.playSchedules(xlr);
        //     });
        // }
        // /** Case 1: When currentLayout is not in inputLayouts
        //  * Then, replace everything and start from first layout
        //  */
        // else if (inputLayouts.filter((inputLayout) => inputLayout.layoutId === this.currentLayout?.layoutId).length === 0) {
        //
        //     if (this.currentLayout) {
        //         this.currentLayout.inLoop = false;
        //     }
        //
        //     // Clean up currentLayout
        //     await this.currentLayout?.finishAllRegions();
        //
        //     this.currentLayout = undefined;
        //     this.nextLayout = undefined;
        //     this.currentLayoutIndex = 0;
        //
        //     const xlr = await this.prepareLayouts();
        //     this.playSchedules(xlr);
        // } else {
        //     /** Case 2: When currentLayout is in inputLayouts, then continue playing
        //      * Also check for nextLayout if in inputLayouts and same sequence, then don't change and continue playing.
        //      * If not in inputLayouts, then replace and prepare nextLayout.
        //      */
        //
        //     // 2.1 We don't have to do anything for currentLayout
        //     // 2.2 Check for nextLayout
        //     // Get nextLayout index
        //     const currLayoutIndex = this.currentLayout?.index as number;
        //     const nxtLayoutIndex = this.nextLayout?.index as number;
        //     const tempOldNxtLayout = this.inputLayouts[nxtLayoutIndex];
        //     let newNxtLayoutIndex = currLayoutIndex + 1;
        //
        //     // Check if nextLayout still exists in the loop
        //     if (Boolean(this.inputLayouts[nxtLayoutIndex])) {
        //
        //     }
        //
        //     if (nxtLayoutIndex !== newNxtLayoutIndex) {
        //
        //         if (Boolean(this.inputLayouts[newNxtLayoutIndex])) {
        //             this.nextLayout = await this.getLayout(this.inputLayouts[newNxtLayoutIndex].layoutId);
        //         } else {
        //             // Check if newNxtLayoutIndex is still within inputLayouts
        //             if ((newNxtLayoutIndex + 1) > inputLayouts.length) {
        //                 // Goes back to first layout in the sequence
        //                 newNxtLayoutIndex = 0;
        //             }
        //
        //             if (Boolean(inputLayouts[newNxtLayoutIndex])) {
        //                 this.nextLayout = await this.getLayout(this.inputLayouts[newNxtLayoutIndex].layoutId);
        //             }
        //
        //             if (tempOldNxtLayout) {
        //                 const oldNxtLayout = await this.getLayout(tempOldNxtLayout.layoutId);
        //                 // Finish old next layout and remove from layouts list
        //                 (oldNxtLayout) && await oldNxtLayout.finishAllRegions();
        //             }
        //         }
        //     } else {
        //         // Check if newNxtLayout is not the same with nextLayout
        //         // Then, replace nextLayout with new one
        //         if (inputLayouts[nxtLayoutIndex].layoutId !== this.nextLayout?.layoutId) {
        //             this.nextLayout = await this.getLayout(this.inputLayouts[nxtLayoutIndex].layoutId);
        //         }
        //
        //         // Remove old nextLayout if it's not in inputLayouts
        //         if (tempOldNxtLayout?.index && Boolean(this.inputLayouts[tempOldNxtLayout?.index])) {
        //             if (inputLayouts.filter((_layout) => _layout.layoutId === tempOldNxtLayout?.layoutId).length === 0) {
        //                 const oldNxtLayout = await this.getLayout(tempOldNxtLayout.layoutId);
        //                 (oldNxtLayout) && await oldNxtLayout.finishAllRegions();
        //             }
        //         }
        //     }
        // }
    };

    xlrObject.getLayout = async function(inputLayout: InputLayoutType) {
        const findLayout = this.uniqueLayouts.find((_layout) => _layout.layoutId === inputLayout.layoutId);

        if (findLayout === undefined) {
            return undefined;
        }

        const foundLayout = {
            ...initialLayout,
            ...findLayout,
        };

        return await this.prepareLayoutXlf({...foundLayout, ...inputLayout});
    };

    xlrObject.prepareLayouts = async function() {
        const self = this;

        // Don't prepare layout if it's just the splash screen
        if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
            return Promise.resolve(self);
        }

        // Get layouts
        const xlrLayouts = getLayout({xlr: self});

        console.debug('prepareLayouts::xlrLayouts', xlrLayouts);

        self.currentLayoutId = xlrLayouts.current?.layoutId as ILayout['layoutId'];

        if (xlrLayouts.current) {
            xlrLayouts.current = await self.prepareLayoutXlf(xlrLayouts.current);
        }

        if (xlrLayouts.next) {
            xlrLayouts.next = await self.prepareLayoutXlf(xlrLayouts.next);
        }

        return new Promise<IXlr>(async (resolve) => {
            self.currentLayoutIndex = xlrLayouts.currentLayoutIndex;
            self.currentLayout = xlrLayouts.current;

            if (self.inputLayouts.length === 1) {
                // Use current layout as next layout if only one layout is available
                self.nextLayout = xlrLayouts.current;
            } else {
                // If loop has changed and next layout is not in the loop, set next layout to first layout
                if (self.inputLayouts.length > 1 &&
                    xlrLayouts.next &&
                    Boolean(self.inputLayouts[xlrLayouts.next.index])) {
                    self.nextLayout = xlrLayouts.next;
                } else {
                    self.nextLayout = await this.getLayout(this.inputLayouts[0]);
                }
            }

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
        } else if (self.config.platform === 'chromeOS' && inputLayout !== undefined) {
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
            xlrLayoutObj.scheduleId = inputLayout?.scheduleId || undefined;
            xlrLayoutObj.options = newOptions;
            xlrLayoutObj.index = inputLayout.index;

            resolve(Layout(layoutXlfNode, newOptions, self, xlrLayoutObj));
        });
    };

    xlrObject.gotoPrevLayout = async function() {
        const _currentLayoutIndex = this.currentLayoutIndex;
        let _assumedPrevIndex = _currentLayoutIndex - 1;

        // If previous layout is same as current layout or
        // if there's only one layout, do nothing
        if (_assumedPrevIndex < 0) {
            return;
        }

        console.debug('XLR::gotoPrevLayout', {
            previousLayoutIndex: _assumedPrevIndex,
            method: 'XLR::gotoPrevLayout',
            shouldParse: false,
        });

        if (Boolean(this.inputLayouts[_assumedPrevIndex])) {
            // end current layout
            await this.currentLayout?.finishAllRegions();

            // and set the previous layout as current layout
            this.currentLayoutIndex = _assumedPrevIndex;

            this.prepareLayouts().then(() => {
                this.playSchedules(this);
            });
        }
    };

    xlrObject.gotoNextLayout = async function() {
        console.debug('XLR::gotoNextLayout', {
            nextLayoutIndex: this.currentLayoutIndex + 1,
            method: 'XLR::gotoNextLayout',
            shouldParse: false,
        });

        await xlrObject.currentLayout?.finishAllRegions();
    };

    xlrObject.bootstrap();

    return xlrObject;
}
