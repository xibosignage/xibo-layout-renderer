/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import xml2js from 'xml2js';

export type MediaActionProps = {
    actionType: string;
    id: string;
    layoutCode: string;
    source: string;
    sourceId: string;
    target: string;
    targetId: string;
    triggerCode: string;
    triggerType: string;
    widgetId: string;
}

export class MediaFactory {
    private props: Record<string, any> = {};
    private options: Record<string, any> = {};
    private actions: Record<keyof MediaActionProps, any>[] = [];
    private rootDoc: {
        $: Record<string, any>;
        action: { $: Record<keyof MediaActionProps, any> }[];
        options: Record<string, any>[];
    } = {
        $: {},
        action: [],
        options: [],
    };

    constructor(private mediaXmlString: string) {
        this.parse();
    }

    async parse() {
        const parser = new xml2js.Parser();
        const rootDoc = await parser.parseStringPromise(this.mediaXmlString);

        if (rootDoc.media) {
            this.rootDoc = rootDoc.media;

            // Set available actions
            if (Object.hasOwn(this.rootDoc, 'action')) {
                this.rootDoc['action'].map((actionItem: { $: MediaActionProps }) => {
                    const actionProps = actionItem.$;

                    // Get all properties
                    if (Object.keys(actionProps).length > 0) {
                        this.actions.push(actionProps);
                    }
                })
            }

            // Set available options
            if (this.rootDoc.options && this.rootDoc.options.length > 0) {
                this.rootDoc.options.map((optionItems) => {
                    if (Object.keys(optionItems).length > 0) {
                        Object.keys(optionItems).forEach((optionKey: string) => {
                            this.options[optionKey] = optionItems[optionKey][0];
                        })
                    }
                })
            }

            // Set media props
            if (this.rootDoc.$ && Object.keys(this.rootDoc.$).length > 0) {
                this.props = this.rootDoc.$;

                // Set correct data type for known props
                if (Object.hasOwn(this.props, 'id')) {
                    this.props.id = parseInt(this.props.id);
                }

                if (Object.hasOwn(this.props, 'duration')) {
                    this.props.duration = parseInt(this.props.duration);
                }

                if (Object.hasOwn(this.props, 'enableStat')) {
                    this.props.enableStat = this.props.enableStat === '1';
                }

                if (Object.hasOwn(this.props, 'useDuration')) {
                    this.props.useDuration = this.props.useDuration === '1';
                }
            }
        }
    }
}