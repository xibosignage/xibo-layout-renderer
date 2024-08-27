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
import {ILayout, InputLayoutType, OptionsType} from '../Layout';
import {platform} from '../../Modules/Platform';

export type PrepareLayoutsType = {
    moveNext?: boolean;
};

export enum ELayoutType {
    CURRENT,
    NEXT,
}

export interface IXlr {
    inputLayouts: InputLayoutType[],
    config: OptionsType,
    layouts: ILayout[],
    currentLayoutIndex: number;
    currentLayoutId: number | null;
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    bootstrap(): void;
    init(): Promise<IXlr>;
    playSchedules(xlr: IXlr): void;
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout>;
    prepareLayouts(): Promise<IXlr>;
    updateLayouts(): void;
    updateLoop(inputLayouts: InputLayoutType[]): void;
}

export const initialXlr: IXlr = {
    inputLayouts: [],
    config: platform,
    layouts: [],
    currentLayoutIndex: 0,
    currentLayoutId: null,
    currentLayout: undefined,
    nextLayout: undefined,
    bootstrap() {
    },
    init() {
        return Promise.resolve(<IXlr>{});
    },
    playSchedules() {
    },
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout> {
        return Promise.resolve(<ILayout>{});
    },
    prepareLayouts(): Promise<IXlr> {
        return Promise.resolve(<IXlr>{});
    },
    updateLayouts() {
    },
    updateLoop(inputLayouts: InputLayoutType[]) {
    }
};
