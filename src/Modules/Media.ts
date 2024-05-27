import { createNanoEvents } from "nanoevents";
import {OptionsType} from "../Types/Layout.types";
import {IRegion} from "../Types/Region.types";
import {IMedia, initialMedia} from "../Types/Media.types";
import {capitalizeStr, getMediaId, nextId, preloadVideo} from "./Generators";
import { TransitionElementOptions, flyTransitionKeyframes, transitionElement } from "./Transitions";

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
        region: region,
        mediaId: mediaId,
        xml: xml,
        options: options,
    };
    let mediaTimer: string | number | NodeJS.Timeout | null | undefined = null;
    let mediaTimeCount = 0;
    const emitter = createNanoEvents<IMediaEvents>();
    const mediaObject: IMedia = {
        ...initialMedia,
        ...props,
    };

    emitter.on('start', function(media) {
        if (media.mediaType === 'video') {
            const $videoMedia = document.getElementById(getMediaId(media)) as HTMLVideoElement;

            if ($videoMedia) {
                $videoMedia.onloadstart = () => {
                    console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                };
                $videoMedia.ondurationchange = () => {
                    media.duration = $videoMedia.duration;
                    media.region.mediaObjects[media.index] = media;

                    $videoMedia.autoplay = true;
                    console.log('Showing Media ' + media.id + ' for ' + media.duration + 's of Region ' + media.region.regionId);
                };
                $videoMedia.onloadeddata = () => {
                    if ($videoMedia.readyState >= 2) {
                        console.log(`${capitalizeStr(media.mediaType)} data for media > ${media.id} has been fully loaded . . .`);
                    }
                };
                $videoMedia.oncanplay = () => {
                    console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);

                    const videoPlayPromise = $videoMedia.play();

                    if (videoPlayPromise !== undefined) {
                        videoPlayPromise.then(() => {
                            console.log('autoplay started . . .');
                            // Autoplay restarted
                        }).catch(error => {
                            $videoMedia.muted = true;
                            $videoMedia.play();
                        });
                    }
                };
                $videoMedia.onplaying = () => {
                    console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
                };
                $videoMedia.onended = () => {
                    console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                    media.emitter?.emit('end', media);
                };
            }
        } else {
            mediaTimer = setInterval(() => {
                mediaTimeCount++;
                if (mediaTimeCount > media.duration) {
                    media.emitter?.emit('end', media);
                }
            }, 1000)
            console.log('Showing Media ' + media.id + ' for ' + media.duration + 's of Region ' + media.region.regionId);
        }
    });

    emitter.on('end', function(media) {
        if (mediaTimer) {
            clearInterval(mediaTimer);
            mediaTimeCount = 0;
        }

        media.region.playNextMedia();
    });

    mediaObject.init = function() {
        const self = mediaObject;
        self.id = props.mediaId;
        self.idCounter = nextId(props.options);
        self.containerName = `M-${self.id}-${self.idCounter}`;
        self.iframeName = `${self.containerName}-iframe`;
        self.mediaType = self.xml?.getAttribute('type') || '';
        self.render = self.xml?.getAttribute('render') || '';
        self.duration = parseInt(self.xml?.getAttribute('duration') as string) || 5;
        self.options = { ...props.options, mediaId };

        const $mediaIframe = document.createElement('iframe');
        const mediaOptions = self.xml?.getElementsByTagName('options');

        if (mediaOptions) {
            for (let _options of Array.from(mediaOptions)) {
                // Get options
                const _mediaOptions = _options.children;
                for (let mediaOption of Array.from(_mediaOptions)) {
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

        const $mediaId = getMediaId(self);
        let $media = document.getElementById($mediaId);

        if ($media === null) {
            if (self.mediaType === 'video') {
                $media = document.createElement('video');
            } else {
                $media = document.createElement('div');
            }
        
            $media.id = $mediaId;
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

        self.url = tmpUrl;

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
        } else if (self.mediaType === 'video') {
            const $videoMedia = $media as HTMLVideoElement;

            $videoMedia.preload = 'auto';

            // $videoSrc.src = tmpUrl;
            // $videoMedia.appendChild($videoSrc);
            $videoMedia.textContent = 'Unsupported Video';

            if (Boolean(self.options['mute'])) {
                $videoMedia.muted = self.options.mute === '1';
            }

            $videoMedia.playsInline = true;
            $media = $videoMedia;
        }

        // Check if the media has fade-in/out transitions
        if (Boolean(self.options['transin']) && Boolean(self.options['transinduration'])) {
            const transInDuration = Number(self.options.transinduration);
            const fadeInTrans = transitionElement('fadeIn', { duration: transInDuration });
            $media.animate(fadeInTrans.keyframes, fadeInTrans.timing);
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
        const self = mediaObject;
        const regionOldMedia = self.region.oldMedia;
        let transInDuration = 1;
        let transOutDuration = 1;

        if (Boolean(self.options['transinduration'])) {
            transInDuration = Number(self.options.transinduration);
        }

        if (regionOldMedia && Boolean(regionOldMedia.options['transoutduration'])) {
            transOutDuration = Number(regionOldMedia.options.transoutduration);
        }

        let defaultTransInOptions: TransitionElementOptions = {duration: transInDuration};
        let defaultTransOutOptions: TransitionElementOptions = {duration: transOutDuration};
        let transIn = transitionElement('defaultIn', {duration: defaultTransInOptions.duration});
        let transOut = transitionElement('defaultOut', {duration: defaultTransOutOptions.duration});

        if (Boolean(self.options['transin'])) {
            let transInName = self.options['transin'];

            if (transInName === 'fly') {
                transInName = `${transInName}In`;
                defaultTransInOptions.keyframes = flyTransitionKeyframes({
                    trans: 'in',
                    direction: 'NE',
                    height: self.divHeight,
                    width: self.divWidth,
                });
            }

            transIn = transitionElement(transInName, defaultTransInOptions);
        }

        if (regionOldMedia && Boolean(regionOldMedia.options['transout'])) {
            let transOutName = regionOldMedia.options['transout'];

            if (transOutName === 'fly') {
                transOutName = `${transOutName}Out`;
                defaultTransOutOptions.keyframes = flyTransitionKeyframes({
                    trans: 'out',
                    direction: 'NE',
                    height: regionOldMedia.divHeight,
                    width: regionOldMedia.divWidth,
                });
            }
            
            transOut = transitionElement(transOutName, defaultTransOutOptions);
        }

        const showCurrentMedia = async () => {
            let $mediaId = getMediaId(self);
            let $media = document.getElementById($mediaId);

            if ($media === null) {
                $media = getNewMedia();
            }

            if ($media !== null) {
                $media.style.display = 'block'

                if (Boolean(self.options['transin'])) {
                    $media.animate(transIn.keyframes, transIn.timing);
                }

                if (self.mediaType === 'video' && self.url !== null) {
                    ($media as HTMLVideoElement).src = await preloadVideo(self.url);
                }

                self.emitter?.emit('start', self);
            }
        };
        const hideOldMedia = new Promise((resolve) => {
            // Hide oldMedia
            if (regionOldMedia) {
                const $oldMedia = document.getElementById(getMediaId(regionOldMedia));
                if ($oldMedia) {
                    const removeOldMedia = () => {
                        $oldMedia.style.display = 'none';
                        $oldMedia.remove();
                    };

                    if (Boolean(regionOldMedia.options['transout'])) {
                        $oldMedia.animate(transOut.keyframes, transOut.timing);
                    }

                    // Resolve this right away
                    // As a result, the transition between two media object
                    // seems like a cross-over
                    resolve(true);

                    if (Boolean(regionOldMedia.options['transout'])) {
                        setTimeout(removeOldMedia, transOutDuration);
                    } else {
                        removeOldMedia();
                    }
                }
            }
        });
        const getNewMedia = (): HTMLElement | null => {
            const $region = document.getElementById(`${self.region.containerName}`);
            // This function is for checking whether
            // the region still has to show a media item
            // when another region is not finished yet
            if (self.region.complete && !self.region.layout.allEnded) {
                // Add currentMedia to the region

                ($region) && $region.insertBefore(self.html as Node, $region.lastElementChild);

                return self.html as HTMLElement;
            }

            return null;
        };

        if (regionOldMedia) {
            hideOldMedia.then((isDone) => {
                if (isDone) {
                    showCurrentMedia();
                }
            });
        } else {
            showCurrentMedia();
        }
    };

    mediaObject.stop = async function() {
        const self = mediaObject;
        const $media = document.getElementById(getMediaId(self));

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