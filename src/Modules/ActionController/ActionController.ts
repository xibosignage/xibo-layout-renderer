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
import { ILayout, IMedia, IRegion, OptionsType } from '../../types';
import { getAllAttributes, nextId } from '../Generators/Generators';
import './action-controller.css';

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
    readonly $actionController: ActionsWrapper;
    readonly $actionListContainer: Element | null;
    translations: any = {};

    constructor(parent: ILayout, actions: Action[], options: InactOptions) {
        this.parent = parent;
        this.actions = actions;
        this.options = options;
        this.$actionController = document.createElement('div', { is: 'action-controller' });
        this.$actionListContainer = null;

        this.init();
    }

    init() {
        const self = this;
        let previewTranslations: any = {};

        // get preview translations
        if ('previewTranslations' in window) {
            previewTranslations = window['previewTranslations'];
            self.translations = previewTranslations;
        }
    
        const $container = document.getElementById(this.parent.containerName);
        const $actionTitle = document.createElement('div');
        const $actionsContainer = document.createElement('div');

        $actionTitle.classList.add('action-controller-title');
        $actionTitle.innerHTML = `
            <button class="toggle"></button>
            <span class="title">${previewTranslations.actionControllerTitle}</span>
        `;

        $actionsContainer.classList.add('actions-container');

        if ($container) {
            $container.insertBefore(this.$actionController, $container.firstElementChild);
    
            this.$actionController.appendChild($actionTitle);
            this.$actionController.appendChild($actionsContainer);

            // Loop through actions
            Array.from(this.actions).forEach(function(newAction) {
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
                html += '<span class="action-row-title">' + previewTranslations[$newAction.getAttribute('actiontype') || ''];

                if ($newAction.getAttribute('actiontype') == 'navWidget') {
                    html += ' <span title="' + previewTranslations.widgetId + '">[' + $newAction.getAttribute('widgetid') + ']</span>';
                } else if ($newAction.getAttribute('actiontype') == 'navLayout') {
                    html += ' <span title="' + previewTranslations.layoutCode + '">[' + $newAction.getAttribute('layoutcode') + ']</span>';
                }
                html += '</span>';

                // Add target
                html += '<span class="action-row-target" title="' + previewTranslations.target + '">' + $newAction.getAttribute('target');
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
                $actionsContainer.insertBefore($newAction, $actionsContainer.lastElementChild);
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
        if(confirm(this.translations.navigateToLayout.replace('[layoutTag]', layoutCode))) {
            var url = options.layoutPreviewUrl.replace('[layoutCode]', layoutCode) + '?findByCode=1';
            window.open(url, '_blank');
        }
    }

    /** Change media in region (next/previous) */
    nextMediaInRegion(regionId: string, actionType: string) {
        // Find target region
        this.parent.regions.forEach((regionObj) => {
            if (regionObj.id === regionId) {
                if (actionType === 'next') {
                    regionObj.playNextMedia();
                } else {
                    regionObj.playPreviousMedia();
                }
            }
        });
    }

    loadMediaInRegion(regionId: string, widgetId: string) {
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
        if (targetRegion?.mediaObjects.length === 0) {
            targetRegion.complete = false;
        }

        // Create media in region and play it next
        targetRegion?.mediaObjects.splice(targetRegion.currentMediaIndex + 1, 0, targetMedia as IMedia);
        targetRegion?.playNextMedia();
    }

    /** Run action based on action data */
    runAction(actionData: {[k: string]: any}, options: InactOptions) {
        if(actionData.actiontype == 'navLayout') {
            // Open layout preview in a new tab
            this.openLayoutInNewTab(actionData.layoutcode, options);
        } else if((actionData.actiontype == 'previous' || actionData.actiontype == 'next') && actionData.target == 'region') {
            this.nextMediaInRegion(actionData.targetid, actionData.actiontype);
        } else if(actionData.actiontype == 'navWidget' && actionData.target == 'region') {
            this.loadMediaInRegion(actionData.targetid, actionData.widgetid);
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
                $sourceObj = document.getElementById(self.parent.containerName);
            } else {
                const regionObjects = Array.from(self.parent.regions);

                // Loop through layout regions
                for (const regionObj of regionObjects) {
                    if (dataset.source === 'region') {
                        // Try to find the region
                        if (regionObj.id === dataset.sourceid) {
                            $sourceObj = document.getElementById(regionObj.containerName);
                            break;
                        }
                    } else if (dataset.source === 'widget') {
                        // Try to find widget/media
                        const mediaObjects = Array.from(regionObj.mediaObjects);

                        for (const mediaObject of mediaObjects) {
                            if (mediaObject.id === dataset.sourceid) {
                                $sourceObj = document.getElementById(mediaObject.containerName);
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
}
