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
import './splash-screen.css';
import xiboLogoImg from './img/logo.png';
import loaderImg from './img/loader.gif';
import {OptionsType} from '../../Types/Layout';

export interface ISplashScreen {
    init: () => void;
    show: () => void;
    hide: () => void;
}

export interface PreviewSplashElement extends HTMLDivElement {
    hide: () => void;
}

export default function SplashScreen($parent: Element | null, config?: OptionsType): ISplashScreen {
    const $previewSplash = document.createElement('div') as PreviewSplashElement;
    const $previewLoader = document.createElement('div');
    const $previewLoaderCaption = document.createElement('div');
    const $defaultNoLayout = document.createElement('div');

     const splashScreenObj = {
         init() {
             $previewSplash.classList.add('preview-splash');

             // Don't show Xibo logo on CMS Preview
             if (config && config.platform !== 'CMS') {
                 $previewSplash.style.setProperty(
                     'background-image',
                     `url(${xiboLogoImg})`,
                 );
                 $previewSplash.style.setProperty(
                     'background-size',
                     '200px 120px',
                 );
                 $previewSplash.style.setProperty(
                     'background-position',
                     'bottom right',
                 );
             }

             $previewSplash.constructor.prototype.hide = () => {
                 this.hide();
             };

             $previewLoader.classList.add('preview-loader');
             $previewLoaderCaption.classList.add('preview-loaderCaption');

             // Show loader bar and text on CMS Preview
             if (config && config.platform === 'CMS') {
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
