import { createNanoEvents } from "nanoevents";
import {OptionsType} from "../Types/Layout.types.js";
import {IRegion} from "../Types/Region.types.js";
import {IMedia, initialMedia} from "../Types/Media.types.js";
import {nextId} from "./Generators.js";

export interface IMediaEvents {
    start: (layout: IMedia) => void;
    end: (layout: IMedia) => void;
}

export default function Media(
    region: IRegion,
    mediaId: string,
    xml: Element,
    options: OptionsType,
) {
    const props = {
        region,
        mediaId,
        xml,
        options,
    };
    let mediaTimer: string | number | NodeJS.Timeout | null | undefined = null;
    let mediaTimeCount = 0;
    const emitter = createNanoEvents<IMediaEvents>();
    const mediaObject: IMedia = {
        ...initialMedia,
        ...props,
    };

    emitter.on('start', function(media) {
        mediaTimer = setInterval(() => {
            mediaTimeCount++;
            if (mediaTimeCount > media.duration) {
                media.emitter?.emit('end', media);
            }
        }, 1000)
    });

    // @NOTE: Transitions
    // 1: Hide/Show
    // 2: Fade In/Out
    // 3: Fly In/Out
    // In XLF, we have transIn, transOut, transDuration, and transDirection
    // transIn is always on the media
    // transOut can also be on the media
    // When all regions are expired, the layout checks for region.exitTransition
    emitter.on('end', function(media) {
        if (mediaTimer) {
            clearInterval(mediaTimer);
            mediaTimeCount = 0;
            media.region.playNextMedia();
        }
    });

    mediaObject.init = function() {
        const self = this;
        self.id = props.mediaId;
        self.containerName = `M-${self.id}-${nextId(props.options)}`;
        self.iframeName = `${self.containerName}-iframe`;
        self.mediaType = self.xml?.getAttribute('type') || '';
        self.render = self.xml?.getAttribute('render') || '';
        self.duration = parseInt(self.xml?.getAttribute('duration') as string) || 5;

        const $mediaIframe = document.createElement('iframe');
        const options = self.xml?.getElementsByTagName('options');

        if (options) {
            for (let _options of Array.from(options)) {
                // Get options
                const mediaOptions = _options.children;
                for (let mediaOption of Array.from(mediaOptions)) {
                    self.options[mediaOption.nodeName.toLowerCase()] = mediaOption.textContent;
                }
            }
        }

        // Show in fullscreen?
        if(self.options.showfullscreen === "1") {
            // Set dimensions as the layout ones
            self.divWidth = self.region.layout.sWidth;
            self.divHeight = self.region.layout.sHeight;
        } else {
            // Set dimensions as the region ones
            self.divWidth = self.region.sWidth;
            self.divHeight = self.region.sHeight;
        }

        $mediaIframe.scrolling = 'no';
        $mediaIframe.id = self.iframeName;
        $mediaIframe.width = `${self.divWidth}px`;
        $mediaIframe.height = `${self.divHeight}px`;
        $mediaIframe.style.cssText = `border: 0; visibility: hidden;`;

        let $media = document.getElementById(self.containerName);

        if ($media === null) {
            $media = document.createElement('div');
            $media.id = self.containerName;
        }

        $media.className = 'media--item';

        /* Scale the Content Container */
        $media.style.cssText = `
            display: none;
            width: ${self.divWidth}px;
            height: ${self.divHeight}px;
            position: absolute;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        `;

        const $region = document.getElementById(`${self.region.containerName}`);

        const tmpUrl = self.region.options.getResourceUrl.replace(":regionId", self.region.id).replace(":id", self.id) + '?preview=1&layoutPreview=1&scale_override=' + self.region.layout.scaleFactor;

        $mediaIframe.src = `${tmpUrl}&width=${self.divWidth}&height=${self.divHeight}`;

        if (self.render === 'html' || self.mediaType === 'ticker') {
            self.checkIframeStatus = true;
            self.iframe = $mediaIframe;
        }  else if (self.mediaType === "image") {
            // preload.addFiles(tmpUrl);
            $media.style.cssText = $media.style.cssText.concat(`background-image: url('${tmpUrl}');`);
            if (self.options['scaletype'] === 'stretch') {
                $media.style.cssText = $media.style.cssText.concat(`background-size: 100% 100%;`);
            } else if (self.options['scaletype'] === 'fit') {
                $media.style.cssText = $media.style.cssText.concat(`background-size: cover;`);
            } else {
                // Center scale type, do we have align or valign?
                const align = (self.options['align'] == "") ? "center" : self.options['align'];
                const valign = (self.options['valign'] == "" || self.options['valign'] == "middle") ? "center" : self.options['valign'];
                $media.style.cssText = $media.style.cssText.concat(`background-position: ${align} ${valign}`);
            }
        }

        // Check if the media has fade-in/out transitions
        if (Boolean(self.options['transin']) && Boolean(self.options['transinduration'])) {
            $media.classList.remove('fade-out');

            const transInDuration = Number(self.options.transinduration) / 1000;

            $media.style.animationDuration = `${transInDuration}s`;
            $media.classList.add('fade-in');
        }

        // Add media to the region
        // Second media if exists, will be off-canvas
        // All added media will be hidden by default
        // It will start showing when region.nextMedia() function is called

        // Add html node to media for 
        self.html = $media;

        // Check/set iframe based widgets play status
        if(self.iframe && self.checkIframeStatus) {
            // Set state as false ( for now )
            self.ready = false;

            // Append iframe
            $media.innerHTML = '';
            $media.appendChild(self.iframe as Node);

            // On iframe load, set state as ready to play full preview
            (self.iframe) && self.iframe.addEventListener('load', function(){
                self.ready = true;
                if (self.iframe) {
                    const iframeStyles = self.iframe.style.cssText;
                    self.iframe.style.cssText = iframeStyles?.concat('visibility: visible;');
                }
            });
        }

    };

    mediaObject.run = function() {
        const self = this;
        const $media = document.getElementById(self.containerName);
        const regionOldMedia = self.region.oldMedia;
        let transInDuration = 1;
        let transOutDuration = 1;

        if (Boolean(self.options['transinduration'])) {
            transInDuration = Number(self.options.transinduration) / 1000;
        }

        if (Boolean(self.options['transoutduration'])) {
            transOutDuration = Number(self.options.transoutduration) / 1000;
        }

        const showCurrentMedia = ($media: HTMLElement) => {
            $media.style.display = 'block';

            $media.classList.remove('fade-out');
            if (Boolean(self.options['transin']) && !$media.classList.contains('fade-in')) {
                $media.style.animationDuration = `${transInDuration}s`;
                $media.classList.add('fade-in');
            }
        };
        const hideOldMedia = new Promise((resolve) => {
            // Hide oldMedia
            if (regionOldMedia) {
                const $oldMedia = document.getElementById(regionOldMedia.containerName);
                if ($oldMedia) {
                    if (Boolean(regionOldMedia.options['transout']) && !$oldMedia.classList.contains('fade-out')) {
                        $oldMedia.classList.remove('fade-in');
    
                        $oldMedia.style.animationDuration = `${transOutDuration}s`;
                        $oldMedia.classList.add('fade-out');

                        resolve(true);

                        setTimeout(() => {
                            $oldMedia.style.display = 'none';
                            $oldMedia.remove();
                        }, transOutDuration * 1000);
                    }
                }
            }
        });

        if ($media) {
            if (regionOldMedia) {
                hideOldMedia.then((isDone) => {
                    if (isDone) {
                        showCurrentMedia($media);
                    }
                });
            } else {
                showCurrentMedia($media);
            }
        }

        self.emitter?.emit('start', self);
    };

    mediaObject.stop = async function() {
        const $media = document.getElementById(`${this.containerName}`);

        if ($media) {
            $media.style.display = 'none';
            $media.remove();
        }
    };

    
    mediaObject.on = function<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]) {
        return emitter.on(event, callback);
    };

    mediaObject.emitter = emitter;

    mediaObject.init();

    return mediaObject;
}