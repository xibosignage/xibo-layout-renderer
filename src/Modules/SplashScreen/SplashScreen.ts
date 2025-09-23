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
import './splash-screen.css';
import xiboLogoImg from './img/logo.png';
import loaderImg from './img/loader.gif';
import {OptionsType} from '../../Types/Layout';
import {ConsumerPlatform} from "../../Types/Platform";

export interface ISplashScreen {
    init: () => void;
    show: () => void;
    hide: () => void;
}

export interface PreviewSplashElement extends HTMLDivElement {
    hide: () => void;
    show: () => void;
}

export default function SplashScreen($parent: Element | null, config?: OptionsType): ISplashScreen {
    const $previewSplash = document.createElement('div') as PreviewSplashElement;
    const $previewLoader = document.createElement('div');
    const $previewLoaderCaption = document.createElement('div');
    const $defaultNoLayout = document.createElement('div');

     const splashScreenObj = {
         async init() {
             $previewSplash.classList.add('preview-splash');

             // Don't show Xibo logo on CMS Preview
             if (config && config.platform !== ConsumerPlatform.CMS) {
                 let splashScreenImg = xiboLogoImg;

                 if (config.icons?.splashScreen && config.icons.splashScreen.length > 0) {
                     splashScreenImg = config.icons.splashScreen;
                 }

                 $previewSplash.style.setProperty(
                     'background-image',
                     `url(${splashScreenImg})`,
                 );
                 $previewSplash.style.setProperty(
                     'background-size',
                     '200px',
                 );
                 $previewSplash.style.setProperty(
                     'background-position',
                     'calc(100% - 50px) calc(100% - 30px)',
                 );
             }

             $previewSplash.constructor.prototype.hide = () => {
                 this.hide();
             };
             $previewSplash.constructor.prototype.show = () => {
                 this.show();
             };

             $previewLoader.classList.add('preview-loader');
             $previewLoaderCaption.classList.add('preview-loaderCaption');

             // Show loader bar and text on CMS Preview
             if (config && config.platform === ConsumerPlatform.CMS) {
                 $previewLoader.style.setProperty(
                     'background-image',
                     `url(${loaderImg})`,
                 );
                 $previewLoaderCaption.innerHTML = '<p>Loading Layout...</p>';
             }

             $previewSplash.insertBefore($previewLoader, $previewSplash.lastElementChild);
             $previewSplash.insertBefore($previewLoaderCaption, null);

             this.hide();
         },
         show() {
             if ($parent) {
                 $parent.insertBefore($previewSplash, $parent.firstElementChild);
                 $previewSplash.style.setProperty('display', 'block');
             }
         },
         hide() {
             $previewSplash.style.setProperty('display', 'none');
         },
    };

     splashScreenObj.init();

     return splashScreenObj;
}
