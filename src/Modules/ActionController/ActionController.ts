import { ILayout, OptionsType } from "../../types";

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

        this.classList.add('actions-wrapper', 'noselect');
    }
}

customElements.define('actions-wrapper', ActionsWrapper, { extends: 'div' });

export type InactOptions = {
    [k: string]: any;
} & OptionsType['previewTranslations'];

export default class ActionController {
    readonly parent: ILayout;
    readonly actions: Action[];
    readonly options: InactOptions;
    readonly $actionsWrapper: ActionsWrapper;
    readonly $actionListContainer: Element | null;

    constructor(parent: ILayout, actions: Action[], options: InactOptions) {
        this.parent = parent;
        this.actions = actions;
        this.options = options;
        this.$actionsWrapper = document.createElement('div', { is: 'actions-wrapper' });
        this.$actionListContainer = null;

        this.init();
    }

    init() {
        const $parentElement = document.getElementById(this.parent.containerName);
        const $actionsWrapperTitle = document.createElement('div');

        $actionsWrapperTitle.classList.add('actions-wrapper-title');
        $actionsWrapperTitle.innerHTML = `
            <button class="toggle"></button>
            <span class="title">${this.options.previewTranslations.actionControllerTItle}</span>
        `;

        $parentElement?.insertBefore($parentElement?.firstElementChild as Node, this.$actionsWrapper);

        this.$actionsWrapper.appendChild($actionsWrapperTitle);
    }
}
