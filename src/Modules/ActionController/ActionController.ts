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
// import Moveable from 'moveable';
import { ConsumerPlatform, ILayout, IMedia, IRegion, OptionsType } from '../../types';
import { getAllAttributes, nextId } from '../Generators';
import './action-controller.css';
import {PreviewTranslations} from "../../Lib/translations";

export class Action {
    readonly id: string;
    readonly xml: Element;

    constructor(id: string, xml: Element) {
        this.id = id;
        this.xml = xml;
    }
}

export class ActionsWrapper extends HTMLDivElement {
    constructor() {
        super();

        this.classList.add('action-controller', 'noselect');
    }
}

customElements.define('action-controller', ActionsWrapper, { extends: 'div' });

export type InactOptions = {
    [k: string]: any;
} & OptionsType['previewTranslations'];

export default class ActionController {
    readonly parent: ILayout;
    readonly actions: Action[];
    readonly options: InactOptions;
    readonly $container: HTMLElement | null;
    readonly $actionController: ActionsWrapper;
    readonly $actionListContainer: Element | null;
    $actionControllerTitle: HTMLElement | null;
    $actionsContainer: HTMLElement | null;
    translations: any = {};
    private keyboardHandler: ((ev: KeyboardEvent) => void) | null = null;

    constructor(parent: ILayout, actions: Action[], options: InactOptions) {
        this.parent = parent;
        this.actions = actions;
        this.options = options;
        this.$actionListContainer = null;
        this.$container = <HTMLDivElement | null>(document.querySelector(`#${this.parent.containerName}[data-sequence="${this.parent.index}"]`));
        this.$actionControllerTitle = null;
        this.$actionsContainer = null;

        if (this.$container && this.$container.getElementsByClassName('action-controller')[0]) {
            this.$actionController = this.$container.getElementsByClassName('action-controller')[0] as ActionsWrapper;
        } else {
            this.$actionController = document.createElement('div', { is: 'action-controller' });
        }

        this.init();
    }

    init() {
        const self = this;
        let _previewTranslations: any = {};

        self.translations = PreviewTranslations;

        // get preview translations
        if ('previewTranslations' in window) {
            _previewTranslations = window['previewTranslations'];
            self.translations = _previewTranslations;
        }
    
        const $container = <HTMLDivElement | null>(document.querySelector(`#${this.parent.containerName}[data-sequence="${this.parent.index}"]`));

        this.$actionController.innerHTML = '';

        if (this.$actionController &&
            this.$actionController.getElementsByClassName('action-controller-title').length > 0
        ) {
            this.$actionControllerTitle = this.$actionController.getElementsByClassName('action-controller-title')[0] as HTMLElement;
        } else {
            this.$actionControllerTitle = document.createElement('div');
            this.$actionControllerTitle.classList.add('action-controller-title');
            this.$actionControllerTitle.innerHTML = `
                <button class="toggle"></button>
                <span class="title">${self.translations.actionControllerTitle}</span>
            `;
        }

        if (this.$actionController &&
            this.$actionController.getElementsByClassName('actions-container').length > 0
        ) {
            this.$actionsContainer?.remove();
        }

        // Always create $actionsContainer
        this.$actionsContainer = document.createElement('div');
        this.$actionsContainer.classList.add('actions-container');

        if ($container) {
            $container.insertBefore(this.$actionController, $container.firstElementChild);

            if (this.$actionController &&
                this.$actionController.getElementsByClassName('action-controller-title').length === 0
            ) {
                this.$actionController.appendChild(this.$actionControllerTitle);
            }

            this.$actionController.appendChild(this.$actionsContainer);

            // Loop through actions
            Array.from(this.actions).forEach((newAction) => {
                // Create new action object
                const $newAction = document.createElement('div');

                // Copy element attributes
                const attributes = getAllAttributes(newAction.xml);

                Array.from(Object.keys(attributes)).forEach((attribKey) => {
                    $newAction.setAttribute(`data-${attribKey}`, attributes[attribKey].value);
                    $newAction.setAttribute(attribKey, attributes[attribKey].value);
                });

                // Build html for the new action
                let html = '';

                // Add action type
                html += '<span class="action-row-title">' + self.translations[$newAction.getAttribute('actiontype') || ''];

                if ($newAction.getAttribute('actiontype') == 'navWidget') {
                    html += ' <span title="' + self.translations.widgetId + '">[' + $newAction.getAttribute('widgetid') + ']</span>';
                } else if ($newAction.getAttribute('actiontype') == 'navLayout') {
                    html += ' <span title="' + self.translations.layoutCode + '">[' + $newAction.getAttribute('layoutcode') + ']</span>';
                }
                html += '</span>';

                // Add target
                html += '<span class="action-row-target" title="' + self.translations.target + '">' + $newAction.getAttribute('target');
                if ($newAction.getAttribute('targetid') != '') {
                    html += '(' + $newAction.getAttribute('targetid') + $newAction.getAttribute('layoutcode') + ')';
                }
                html += '</span>';
                
                // Add HTML string to the action
                $newAction.innerHTML = html;

                // Append new action to the controller
                $newAction.classList.add('action');
                $newAction.setAttribute('originalid', newAction.id);
                $newAction.setAttribute('id', 'A-' + newAction.id + '-' + nextId(self.options as OptionsType));
                this.$actionsContainer?.insertBefore($newAction, this.$actionsContainer?.lastElementChild);
            });

            // 
            // Enable dragging
            // const $draggableContainer = new Moveable($container, {
            //     target: this.$actionController,
            //     draggable: true,
            // });

            // Toggle actions visibility
            const $actionsToggler = this.$actionController.querySelector<HTMLElement>('.toggle');
            
            if ($actionsToggler) {
                $actionsToggler.onclick = function() {
                    self.$actionController.classList.toggle('d-none');
                };
            }

            // Only render webhook controller in CMS
            if (this.parent.xlr.config.platform !== ConsumerPlatform.CMS) {
                this.$actionController.style.display = 'none';
                return;
            }

            const $webhookActions = this.$actionController.querySelectorAll<HTMLElement>('.action[triggertype="webhook"]');
            // Display according to the number of clickable actions
            this.$actionController.style.setProperty(
                'display',
                $webhookActions.length === 0 ?
                'none' : 'flex'
            );

            // Handle webhook action trigger click
            if ($webhookActions.length > 0) {
                $webhookActions.forEach(($webhookAction) => {
                    $webhookAction.onclick = function(event: Event) {
                        event.stopPropagation();
                        self.runAction($webhookAction.dataset, self.options);
                    };
                    $webhookAction.classList.add('clickable');
                });
            }
        }
    }

    openLayoutInNewTab(layoutCode: string, options: InactOptions) {
        const url = options.layoutPreviewUrl.replace('[layoutCode]', layoutCode) + '?findByCode=1';

        console.debug('[ActionController::openLayoutInNewTab] Navigating to layout in new tab with code', { layoutCode, url });
        // Send a postMessage to the parent frame so the CMS can handle the confirmation
        // and navigation (confirm() is blocked in sandboxed iframes without allow-modals).
        window.parent.postMessage({ type: 'xlr:navLayout', layoutCode, url }, '*');
        // Also emit via the XLR event system for non-iframe consumers.
        this.parent.xlr.emitter.emit('navLayout', layoutCode, url);
    }

    openLayoutInPlayer(layoutCode: string, _options: InactOptions) {
        console.debug('[ActionController::openLayoutInPlayer] Navigating to layout in player with code', { layoutCode, options: _options });
        this.parent.xlr.emitter.emit('navLayout', layoutCode, '');
    }

    prevOrNextLayout(targetId: string, actionType: string) {
        console.debug('[ActionController::prevOrNextLayout] Changing layout with data', { targetId, actionType });
        // For screen-level actions targetId may be "0" (the screen has no numeric ID).
        // Guard using this.parent.layoutId instead so the check always works.
        if (this.parent.xlr.currentLayout?.layoutId !== this.parent.layoutId) {
            return;
        }
        if (actionType === 'next') {
            this.parent.xlr.gotoNextLayout();
        } else if (actionType === 'previous') {
            this.parent.xlr.gotoPrevLayout();
        }
    }

    /** Change media in region (next/previous) with wrap-around at boundaries. */
    gotoMediaInRegion(regionId: string, actionType: string) {
        console.debug('[ActionController::gotoMediaInRegion] Changing media in region with data', { regionId, actionType });
        this.parent.regions.forEach((regionObj) => {
            if (regionObj.id !== regionId || regionObj.ended) return;

            const total = regionObj.totalMediaObjects;
            if (total === 0) return;

            // Cancel current media's timer before navigating so it doesn't fire
            // after currMedia has changed and cause a double-advance.
            if (regionObj.currMedia?.mediaTimer) {
                clearInterval(regionObj.currMedia.mediaTimer);
                regionObj.currMedia.mediaTimer = undefined;
            }

            // Compute new index with wrap-around. We do NOT delegate to
            // playNextMedia() / playPreviousMedia() here because those carry
            // normal playlist-cycle semantics (finished(), regionExpired()) that
            // must not fire during user-driven navigation.
            const newIndex = actionType === 'next'
                ? (regionObj.currentMediaIndex + 1) % total
                : (regionObj.currentMediaIndex - 1 + total) % total;

            regionObj.oldMedia = regionObj.currMedia;
            regionObj.currentMediaIndex = newIndex;
            regionObj.currMedia = regionObj.mediaObjects[newIndex];
            regionObj.nxtMedia = regionObj.mediaObjects[(newIndex + 1) % total];
            regionObj.complete = false;

            regionObj.transitionNodes(regionObj.oldMedia, regionObj.currMedia);
        });
    }

    loadMediaInRegion(regionId: string, widgetId: string) {
        console.debug('[ActionController::loadMediaInRegion] Loading media in region with data', { regionId, widgetId });
        const self = this;
        // Find target region
        let targetRegion: IRegion | undefined;
        
        self.parent.regions.forEach((regionObj) => {
            if (regionObj.id === regionId) {
                targetRegion = regionObj;
            }
        });

        // Find media in actions
        let targetMedia: IMedia | undefined;
        if (targetRegion) {
            targetRegion.mediaObjectsActions.forEach((media) => {
                if (media.id === widgetId) {
                    targetMedia = media;
                }
            });
        }

        // Mark media as temporary (removed after region stop playing or loops)
        if (targetMedia) {
            targetMedia.singlePlay = true;
        }

        // If region is empty, remove the background color and empty message
        if (targetRegion?.totalMediaObjects === 0) {
            targetRegion.complete = false;
        }

        // Bail out early when the target widget was not found in the drawer
        if (!targetMedia) {
            console.debug('[ActionController::loadMediaInRegion] Target media not found in mediaObjectsActions', { regionId, widgetId });
            return;
        }

        // Guard against duplicate insertion if the action fires multiple times before the widget plays
        if (targetRegion && targetRegion.mediaObjects.some((m) => m.id === targetMedia!.id)) {
            console.debug('[ActionController::loadMediaInRegion] Target media already queued, skipping duplicate insertion');
            return;
        }

        // Cancel the current media's duration timer so it doesn't fire and interrupt
        // the target widget mid-playback (e.g. an Interactive Zone timer still ticking).
        if (targetRegion?.currMedia?.mediaTimer) {
            clearInterval(targetRegion.currMedia.mediaTimer);
            targetRegion.currMedia.mediaTimer = undefined;
        }

        // Reset complete so the HTML-media guard in playNextMedia() doesn't block
        // the transition (that guard is for single-media loops, not navWidget injections).
        if (targetRegion) {
            targetRegion.complete = false;
        }

        // Create media in region and play it next
        targetRegion?.mediaObjects.splice(targetRegion.currentMediaIndex + 1, 0, targetMedia);

        // Keep totalMediaObjects in sync with the actual array length
        if (targetRegion) {
            targetRegion.totalMediaObjects = targetRegion.mediaObjects.length;
        }

        // Drawer media items are never run through the normal prepareMedia pipeline,
        // so their DOM element has no background-image / src set and is not yet in the
        // region DOM. Prepare it now so Media.run() finds a ready element to show.
        if (targetRegion) {
            targetRegion.prepareMedia(targetMedia);
        }

        console.debug('[ActionController::loadMediaInRegion] Target media loaded, playing next', { regionId, widgetId });
        targetRegion?.playNextMedia();
    }

    /** Run action based on action data */
    runAction(actionData: {[k: string]: any}, options: InactOptions) {
        // If this layout is no longer active (being cancelled or navigated away from),
        // discard the action so it doesn't interfere with the outgoing transition.
        // inLoop is set to false synchronously before finishAllRegions() in all nav paths.
        if (!this.parent.inLoop) {
            return;
        }

        console.debug('[ActionController::runAction] Triggering action', { actionData });

        if(actionData.actiontype == 'navLayout') {
            if (this.parent.xlr.config.platform === ConsumerPlatform.CMS) {
                // Open layout preview in a new tab (CMS preview only)
                this.openLayoutInNewTab(actionData.layoutcode, options);
            } else {
                // All player platforms (Electron, ChromeOS, Android, etc.)
                this.openLayoutInPlayer(actionData.layoutcode, options);
            }
        } else if((actionData.actiontype == 'previous' || actionData.actiontype == 'next') && actionData.target == 'region') {
            this.gotoMediaInRegion(actionData.targetid, actionData.actiontype);
        } else if(actionData.actiontype == 'navWidget' && actionData.target == 'region') {
            this.loadMediaInRegion(actionData.targetid, actionData.widgetid);
        } else if(actionData.target === 'screen') {
            this.prevOrNextLayout(actionData.targetid, actionData.actiontype);
        } else {
            // TODO Handle other action types ( later? )
            console.log(actionData.actiontype + ' > ' + actionData.target + '[' + actionData.targetid + ']');
        }
    };

    initTouchActions() {
        const self = this;

        this.$actionController.querySelectorAll<HTMLElement>('.action[triggerType="touch"]').forEach(function($el) {
            const dataset = $el.dataset;

            // Find source object
            let $sourceObj;

            if (dataset.source === 'layout') {
                $sourceObj = <HTMLDivElement | null>(document.querySelector(`#${self.parent.containerName}[data-sequence="${self.parent.index}"]`));
            } else {
                const regionObjects = Array.from(self.parent.regions);

                // Loop through layout regions
                for (const regionObj of regionObjects) {
                    if (dataset.source === 'region') {
                        // Try to find the region
                        if (regionObj.id === dataset.sourceid) {
                            $sourceObj = regionObj.html as HTMLElement;
                            break;
                        }
                    } else if (dataset.source === 'widget') {
                        // Try to find widget/media
                        const mediaObjects = Array.from(regionObj.mediaObjects);

                        for (const mediaObject of mediaObjects) {
                            if (mediaObject.id === dataset.sourceid) {
                                $sourceObj = mediaObject.html as HTMLElement;
                                break;
                            }
                        }
                    }

                    // Break loop if we already have a $sourceObj
                    if ($sourceObj != undefined) {
                        break;
                    }
                }
            }

            // Handle source click
            // FIXME: We need to handle the case where a drawer widget has an action and it has been loaded to the preview
            if($sourceObj != undefined) {
                $sourceObj.onclick = function(ev: Event) {
                    ev.stopPropagation();
                    self.runAction(dataset, self.options);
                };
                $sourceObj.classList.add('clickable');
            }
        });
    }

    /** Dispatch an incoming webhook trigger to any matching actions on this layout. */
    handleWebhookTrigger(triggerCode: string, widgetId?: string) {
        this.$actionController
            .querySelectorAll<HTMLElement>('.action[triggertype="webhook"]')
            .forEach(($el) => {
                const ds = $el.dataset;
                if (ds.triggercode !== triggerCode) return;
                if (widgetId && ds.sourceid !== widgetId) return;
                this.runAction(ds, this.options);
            });
    }

    initKeyboardActions() {
        const self = this;
        const keyActions = new Map<string, DOMStringMap[]>();

        this.$actionController.querySelectorAll<HTMLElement>('.action[triggertype="keyPress"]').forEach(($el) => {
            const dataset = $el.dataset;
            const code = dataset.triggercode;

            if (code) {
                if (!keyActions.get(code)) {
                    keyActions.set(code, []);
                }
                keyActions.get(code)!.push(dataset);
            }
        });

        // Nothing to do if this layout has no keyboard-triggered actions.
        if (keyActions.size === 0) return;

        this.keyboardHandler = (ev: KeyboardEvent) => {
            const actions = keyActions.get(ev.code);
            if (actions) {
                actions.forEach((dataset) => {
                    self.runAction(dataset, self.options);
                });
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    /** Remove the keydown listener registered by initKeyboardActions. Call when the layout ends or is cancelled. */
    removeKeyboardActions() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    }
}
