var XiboLayoutRenderer = (function () {
  'use strict';

  let createNanoEvents = () => ({
    emit(event, ...args) {
      for (
        let i = 0,
          callbacks = this.events[event] || [],
          length = callbacks.length;
        i < length;
        i++
      ) {
        callbacks[i](...args);
      }
    },
    events: {},
    on(event, cb) {
  (this.events[event] ||= []).push(cb);
      return () => {
        this.events[event] = this.events[event]?.filter(i => cb !== i);
      }
    }
  });

  const RESOURCE_URL = '/playlist/widget/resource/:regionId/:id';
  const XLF_URL = '/layout/xlf/:layoutId';
  const LAYOUT_BACKGROUND_DOWNLOAD_URL = '/layout/background/:id';
  const LAYOUT_PREVIEW_URL = '/layout/preview/[layoutCode]';
  const LIBRARY_DOWNLOAD_URL = '/library/download/:id';
  const LOADER_URL = '/theme/default/img/loader.gif';
  const platform = {
      getResourceUrl: RESOURCE_URL,
      xlfUrl: XLF_URL,
      layoutBackgroundDownloadUrl: LAYOUT_BACKGROUND_DOWNLOAD_URL,
      layoutPreviewUrl: LAYOUT_PREVIEW_URL,
      libraryDownloadUrl: LIBRARY_DOWNLOAD_URL,
      loaderUrl: LOADER_URL,
      idCounter: 0,
      inPreview: true,
      appHost: null,
      platform: 'CMS',
  };

  const initialLayout = {
      id: null,
      layoutId: null,
      sw: 0,
      sh: 0,
      xw: 0,
      xh: 0,
      zIndex: 0,
      scaleFactor: 1,
      sWidth: 0,
      sHeight: 0,
      offsetX: 0,
      offsetY: 0,
      bgColor: '',
      bgImage: '',
      bgId: '',
      containerName: '',
      layoutNode: null,
      regionMaxZIndex: 0,
      ready: false,
      regionObjects: [],
      drawer: [],
      allExpired: false,
      regions: [],
      actions: [],
      options: platform,
      done: false,
      allEnded: false,
      path: '',
      prepareLayout() {
      },
      parseXlf() {
      },
      run() {
      },
      on(event, callback) {
          return {};
      },
      regionExpired() {
      },
      end() {
      },
      regionEnded() {
      },
      stopAllMedia() {
          return Promise.resolve();
      },
  };

  function nextId(options) {
      if (options.idCounter > 500) {
          options.idCounter = 0;
      }
      options.idCounter = options.idCounter + 1;
      return options.idCounter;
  }
  const getMediaId = ({ mediaType, containerName }) => {
      let mediaId = containerName;
      if (mediaType === 'video') {
          mediaId = mediaId + '-vid';
      }
      else if (mediaType === 'audio') {
          mediaId = mediaId + '-aud';
      }
      return mediaId;
  };
  const capitalizeStr = (inputStr) => {
      if (inputStr === null) {
          return '';
      }
      return String(inputStr).charAt(0).toUpperCase() + String(inputStr).substring(1);
  };
  async function getDataBlob(src) {
      return fetch(src, { mode: 'no-cors' })
          .then((res) => res.blob())
          .then((blob) => new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
      }));
  }
  async function preloadMediaBlob(src, type) {
      const res = await fetch(src, { mode: 'no-cors' });
      let blob = new Blob();
      if (type === 'image') {
          blob = new Blob();
      }
      else if (type === 'video') {
          blob = await res.blob();
      }
      else if (type === 'audio') {
          const data = await res.arrayBuffer();
          blob = new Blob([data], { type: audioFileType(getFileExt(src)) });
      }
      console.log({ blob });
      return URL.createObjectURL(blob);
  }
  async function fetchJSON(url) {
      return fetch(url)
          .then(res => res.json())
          .catch(err => {
          console.log(err);
      });
  }
  function getFileExt(filename) {
      const filenameArr = String(filename).split('.');
      return filenameArr[filenameArr.length - 1];
  }
  function audioFileType(str) {
      const validAudioTypes = {
          'mp3': 'audio/mp3',
          'wav': 'audio/wav',
          'ogg': 'audio/ogg',
      };
      if (Boolean(validAudioTypes[str])) {
          return validAudioTypes[str];
      }
      return undefined;
  }
  function composeResourceUrlByPlatform(platform, params) {
      let resourceUrl = params.regionOptions.getResourceUrl
          .replace(":regionId", params.regionId)
          .replace(":id", params.mediaId) +
          '?preview=1&layoutPreview=1';
      if (platform === 'chromeOS') {
          resourceUrl = params.cmsUrl +
              '/chromeOS/resource/' +
              params.fileId +
              '?saveAs=' + params.uri;
      }
      else if (!Boolean(params['mediaType'])) {
          resourceUrl += '&scale_override=' + params.scaleFactor;
      }
      return resourceUrl;
  }
  function getIndexByLayoutId(layoutsInput, layoutId) {
      let layoutIndexes = layoutsInput.reduce((a, b, indx) => {
          a[Number(b.layoutId)] = {
              ...b,
              index: indx
          };
          return a;
      }, {});
      if (layoutId === null || !layoutId) {
          return layoutIndexes;
      }
      return layoutIndexes[layoutId];
  }

  const initialRegion = {
      layout: initialLayout,
      id: '',
      regionId: '',
      xml: null,
      mediaObjects: [],
      mediaObjectsActions: [],
      currentMedia: -1,
      complete: false,
      containerName: '',
      ending: false,
      ended: false,
      oneMedia: false,
      oldMedia: undefined,
      curMedia: undefined,
      nxtMedia: undefined,
      currentMediaIndex: 0,
      totalMediaObjects: 0,
      ready: false,
      options: {},
      sWidth: 0,
      sHeight: 0,
      offsetX: 0,
      offsetY: 0,
      zIndex: 0,
      index: -1,
      prepareRegion() {
      },
      playNextMedia() {
      },
      transitionNodes() {
      },
      finished() {
      },
      run() {
      },
      end() {
      },
      exitTransition() { },
      exitTransitionComplete() { },
      on(event, callback) {
          return {};
      },
      prepareMediaObjects() {
      },
  };

  const initialMedia = {
      region: initialRegion,
      xml: null,
      id: '',
      index: 0,
      idCounter: 0,
      containerName: '',
      html: null,
      iframe: null,
      iframeName: '',
      mediaType: '',
      render: 'html',
      attachedAudio: false,
      singlePlay: false,
      timeoutId: setTimeout(() => { }, 100),
      ready: true,
      checkIframeStatus: false,
      loadIframeOnRun: false,
      tempSrc: '',
      finished: false,
      schemaVersion: '1',
      type: '',
      duration: 0,
      useDuration: Boolean(0),
      fileId: '',
      uri: '',
      options: {},
      divWidth: 0,
      divHeight: 0,
      url: null,
      loop: false,
      run() { },
      init() { },
      stop() {
          return Promise.resolve();
      },
      on(event, callback) {
          return {};
      },
  };

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
  const defaultTrans = (duration, trans) => {
      const defaultKeyframes = [
          { display: trans === 'in' ? 'none' : 'block' },
          { display: trans === 'out' ? 'none' : 'block' },
      ];
      const defaultTiming = {
          duration,
      };
      return {
          keyframes: defaultKeyframes,
          timing: defaultTiming,
      };
  };
  const fadeInElem = (duration) => {
      const fadeInKeyframes = [
          { opacity: 0 },
          { opacity: 1 },
      ];
      const fadeInTiming = {
          duration,
          fill: 'forwards',
      };
      return {
          keyframes: fadeInKeyframes,
          timing: fadeInTiming,
      };
  };
  const fadeOutElem = (duration) => {
      const fadeOutKeyframes = [
          { opacity: 1 },
          { opacity: 0, zIndex: -1 },
      ];
      const fadeOutTiming = {
          duration,
          fill: 'forwards',
      };
      return {
          keyframes: fadeOutKeyframes,
          timing: fadeOutTiming,
      };
  };
  const flyInElem = (duration, keyframeOptions, direction) => {
      const flyInKeyframes = [
          { opacity: 0 },
          { opacity: 1, zIndex: 1 },
      ];
      const flyInTiming = {
          duration,
          fill: 'forwards',
      };
      if (keyframeOptions && Boolean(keyframeOptions.from)) {
          flyInKeyframes[0] = { ...keyframeOptions.from, ...flyInKeyframes[0] };
      }
      if (keyframeOptions && Boolean(keyframeOptions.to)) {
          flyInKeyframes[1] = { ...keyframeOptions.to, ...flyInKeyframes[1] };
      }
      return {
          keyframes: flyInKeyframes,
          timing: flyInTiming,
      };
  };
  const flyOutElem = (duration, keyframeOptions, direction) => {
      const flyOutKeyframes = [
          { opacity: 1 },
          { opacity: 0, zIndex: -1 },
      ];
      const flyOutTiming = {
          duration,
          fill: 'forwards',
      };
      if (keyframeOptions && Boolean(keyframeOptions.from)) {
          flyOutKeyframes[0] = { ...keyframeOptions.from, ...flyOutKeyframes[0] };
      }
      if (keyframeOptions && Boolean(keyframeOptions.to)) {
          flyOutKeyframes[1] = { ...keyframeOptions.to, ...flyOutKeyframes[1] };
      }
      return {
          keyframes: flyOutKeyframes,
          timing: flyOutTiming,
      };
  };
  const transitionElement = (transition, options) => {
      const transitions = {
          fadeIn: fadeInElem(options.duration),
          fadeOut: fadeOutElem(options.duration),
          flyIn: flyInElem(options.duration, options.keyframes, options.direction),
          flyOut: flyOutElem(options.duration, options.keyframes, options.direction),
          defaultIn: defaultTrans(options.duration, 'in'),
          defaultOut: defaultTrans(options.duration, 'out'),
      };
      return transitions[transition];
  };
  const flyTransitionKeyframes = (params) => {
      const keyframes = {
          from: {},
          to: {},
      };
      const opacityAttr = (source) => {
          if (source === 'from') {
              return params.trans === 'in' ? 0 : 1;
          }
          return params.trans === 'out' ? 1 : 0;
      };
      switch (params.direction) {
          case 'N':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  top: params.trans === 'in' ? `${params.height}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  top: params.trans === 'in' ? 0 : `-${params.height}px`,
              };
              break;
          case 'NE':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  top: params.trans === 'in' ? `${params.height}px` : 0,
                  left: params.trans === 'in' ? `-${params.width}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  top: params.trans === 'in' ? 0 : `-${params.height}px`,
                  left: params.trans === 'in' ? 0 : `${params.width}px`,
              };
              break;
          case 'E':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  left: params.trans === 'in' ? `-${params.width}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  left: params.trans === 'in' ? 0 : `${params.width}px`,
              };
              break;
          case 'SE':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  top: params.trans === 'in' ? `-${params.height}px` : 0,
                  left: params.trans === 'in' ? `-${params.width}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  top: params.trans === 'in' ? 0 : `${params.height}px`,
                  left: params.trans === 'in' ? 0 : `${params.width}px`,
              };
              break;
          case 'S':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  top: params.trans === 'in' ? `-${params.height}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  top: params.trans === 'in' ? 0 : `${params.height}px`,
              };
              break;
          case 'SW':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  top: params.trans === 'in' ? `-${params.height}px` : 0,
                  left: params.trans === 'in' ? `${params.width}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  top: params.trans === 'in' ? 0 : `${params.height}px`,
                  left: params.trans === 'in' ? 0 : `-${params.width}px`,
              };
              break;
          case 'W':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  left: params.trans === 'in' ? `${params.width}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  left: params.trans === 'in' ? 0 : `-${params.width}px`,
              };
              break;
          case 'NW':
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  top: params.trans === 'in' ? `${params.height}px` : 0,
                  left: params.trans === 'in' ? `${params.width}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  top: params.trans === 'in' ? 0 : `-${params.height}px`,
                  left: params.trans === 'in' ? 0 : `-${params.width}px`,
              };
              break;
          default:
              keyframes.from = {
                  opacity: opacityAttr('from'),
                  top: params.trans === 'in' ? `${params.height}px` : 0,
              };
              keyframes.to = {
                  opacity: opacityAttr('to'),
                  top: params.trans === 'in' ? 0 : `-${params.height}px`,
              };
              break;
      }
      return keyframes;
  };

  function VideoMedia(media) {
      const videoMediaObject = {
          init() {
              const $videoMedia = document.getElementById(getMediaId(media));
              if ($videoMedia) {
                  $videoMedia.onloadstart = () => {
                      console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
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
                  if (media.duration === 0) {
                      $videoMedia.ondurationchange = () => {
                          console.log('Showing Media ' + media.id + ' for ' + $videoMedia.duration + 's of Region ' + media.region.regionId);
                      };
                      $videoMedia.onended = () => {
                          console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                          media.emitter?.emit('end', media);
                      };
                  }
              }
          }
      };
      return videoMediaObject;
  }

  function AudioMedia(media) {
      const audioMediaObject = {
          init() {
              const $audioMedia = document.getElementById(getMediaId(media));
              let $playBtn = null;
              if ($audioMedia) {
                  $audioMedia.onloadstart = () => {
                      console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                  };
                  $audioMedia.onloadeddata = () => {
                      if ($audioMedia.readyState >= 2) {
                          console.log(`${capitalizeStr(media.mediaType)} data for media > ${media.id} has been fully loaded . . .`);
                      }
                  };
                  $audioMedia.oncanplay = () => {
                      console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);
                  };
                  $audioMedia.onplaying = () => {
                      console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
                      if ($playBtn !== null) {
                          $playBtn.remove();
                      }
                  };
                  const audioPlayPromise = $audioMedia.play();
                  if (audioPlayPromise !== undefined) {
                      audioPlayPromise.then(() => {
                          console.log('autoplay started . . .');
                          // Autoplay restarted
                      }).catch(error => {
                          if (error.name === 'NotAllowedError') {
                              // Let's show a play audio button
                              $playBtn = document.createElement('button');
                              $playBtn.classList.add('play-audio-btn');
                              $playBtn.textContent = 'Play Audio';
                              $playBtn.addEventListener('click', () => {
                                  $audioMedia.muted = false;
                                  $audioMedia.play();
                              });
                              $audioMedia.parentNode?.insertBefore($playBtn, $audioMedia.nextSibling);
                          }
                      });
                  }
                  if (media.duration === 0) {
                      $audioMedia.ondurationchange = () => {
                          console.log('Showing Media ' + media.id + ' for ' + $audioMedia.duration + 's of Region ' + media.region.regionId);
                      };
                      $audioMedia.onended = () => {
                          console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                          media.emitter?.emit('end', media);
                      };
                  }
              }
          },
      };
      return audioMediaObject;
  }

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
  function Media(region, mediaId, xml, options, xlr) {
      const props = {
          region: region,
          mediaId: mediaId,
          xml: xml,
          options: options,
      };
      let mediaTimer = null;
      let mediaTimeCount = 0;
      const emitter = createNanoEvents();
      const mediaObject = {
          ...initialMedia,
          ...props,
      };
      const startMediaTimer = (media) => {
          mediaTimer = setInterval(() => {
              mediaTimeCount++;
              if (mediaTimeCount > media.duration) {
                  media.emitter?.emit('end', media);
              }
          }, 1000);
          console.log('Showing Media ' + media.id + ' for ' + media.duration + 's of Region ' + media.region.regionId);
      };
      emitter.on('start', function (media) {
          if (media.mediaType === 'video') {
              VideoMedia(media).init();
              if (media.duration > 0) {
                  startMediaTimer(media);
              }
          }
          else if (media.mediaType === 'audio') {
              AudioMedia(media).init();
              if (media.duration > 0) {
                  startMediaTimer(media);
              }
          }
          else {
              startMediaTimer(media);
          }
      });
      emitter.on('end', function (media) {
          if (mediaTimer) {
              clearInterval(mediaTimer);
              mediaTimeCount = 0;
          }
          media.region.playNextMedia();
      });
      mediaObject.init = function () {
          const self = mediaObject;
          self.id = props.mediaId;
          self.fileId = self.xml?.getAttribute('fileId') || '';
          self.idCounter = nextId(props.options);
          self.containerName = `M-${self.id}-${self.idCounter}`;
          self.iframeName = `${self.containerName}-iframe`;
          self.mediaType = self.xml?.getAttribute('type') || '';
          self.render = self.xml?.getAttribute('render') || '';
          self.duration = parseInt(self.xml?.getAttribute('duration')) || 0;
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
          // Check for options.uri and add it to media
          if (Boolean(self.options['uri'])) {
              self.uri = self.options['uri'];
          }
          // Show in fullscreen?
          if (self.options.showfullscreen === "1") {
              // Set dimensions as the layout ones
              self.divWidth = self.region.layout.sWidth;
              self.divHeight = self.region.layout.sHeight;
          }
          else {
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
              }
              else if (self.mediaType === 'audio') {
                  $media = new Audio();
              }
              else {
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
          document.getElementById(`${self.region.containerName}`);
          const resourceUrlParams = {
              ...xlr.config.config,
              regionOptions: self.region.options,
              layoutId: self.region.layout.layoutId,
              regionId: self.region.id,
              mediaId: self.id,
              fileId: self.fileId,
              scaleFactor: self.region.layout.scaleFactor,
              uri: self.uri,
          };
          if (self.mediaType === 'image' || self.mediaType === 'video') {
              resourceUrlParams.mediaType = self.mediaType;
          }
          const tmpUrl = composeResourceUrlByPlatform(xlr.config.platform, resourceUrlParams);
          self.url = tmpUrl;
          // Loop if media has loop, or if region has loop and a single media
          self.loop =
              self.options['loop'] == '1' ||
                  (self.region.options['loop'] == '1' && self.region.totalMediaObjects == 1);
          $mediaIframe.src = `${tmpUrl}&width=${self.divWidth}&height=${self.divHeight}`;
          if (self.render === 'html' || self.mediaType === 'ticker' || self.mediaType === 'webpage') {
              self.checkIframeStatus = true;
              self.iframe = $mediaIframe;
          }
          else if (self.mediaType === "image") {
              // preload.addFiles(tmpUrl);
              // $media.style.cssText = $media.style.cssText.concat(`background-image: url('${tmpUrl}');`);
              if (self.options['scaletype'] === 'stretch') {
                  $media.style.cssText = $media.style.cssText.concat(`background-size: 100% 100%;`);
              }
              else if (self.options['scaletype'] === 'fit') {
                  $media.style.cssText = $media.style.cssText.concat(`background-size: cover;`);
              }
              else {
                  // Center scale type, do we have align or valign?
                  const align = (self.options['align'] == "") ? "center" : self.options['align'];
                  const valign = (self.options['valign'] == "" || self.options['valign'] == "middle") ? "center" : self.options['valign'];
                  $media.style.cssText = $media.style.cssText.concat(`background-position: ${align} ${valign}`);
              }
          }
          else if (self.mediaType === 'video') {
              const $videoMedia = $media;
              $videoMedia.preload = 'auto';
              $videoMedia.textContent = 'Unsupported Video';
              if (Boolean(self.options['mute'])) {
                  $videoMedia.muted = self.options.mute === '1';
              }
              if (Boolean(self.options['scaletype'])) {
                  if (self.options.scaletype === 'stretch') {
                      $videoMedia.style.objectFit = 'fill';
                  }
              }
              $videoMedia.playsInline = true;
              if (self.loop) {
                  $videoMedia.loop = true;
              }
              $media = $videoMedia;
          }
          else if (self.mediaType === 'audio') {
              const $audioMedia = $media;
              $audioMedia.preload = 'auto';
              $audioMedia.textContent = 'Unsupported Audio';
              $audioMedia.autoplay = true;
              if (self.loop) {
                  $audioMedia.loop = true;
              }
              $media = $audioMedia;
          }
          // Duration is per item condition
          if (self.render === 'html' || self.mediaType === 'ticker') {
              /* Check if the ticker duration is based on the number of items in the feed */
              if (self.options['durationisperitem'] === '1') {
                  const regex = new RegExp('<!-- NUMITEMS=(.*?) -->');
                  (async () => {
                      let html = await fetchJSON(`${tmpUrl}&width=${self.divWidth}&height=${self.divHeight}`);
                      console.log({ html });
                      const res = regex.exec(html);
                      if (res !== null) {
                          self.duration = parseInt(String(self.duration)) * parseInt(res[1]);
                      }
                  })();
              }
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
          // When there's only 1 item and loop = false, don't remove the item but leave it at its last state
          // For image, and only 1 item, it should still have the transition for next state
          // Add conditions for video duration being 0 or 1 and also the loop property
          // For video url, we have to create a URL out of the XLF video URL
          /**
           * @DONE
           * Case 1: Video duration = 0, this will play the video for its entire duration
           * Case 2: Video duration is set > 0 and loop = false
           * E.g. Set duration = 100s, video duration = 62s
           * the video will play until 62s and will stop to its last frame until 100s
           * After 100s, it will expire
           * Case 3: Video duration is set > 0 and loop = true
           * E.g. Set duration = 100s, video duration = 62s, loop = true
           * the video will play until 62s and will loop through until the remaining 38s
           * to complete the 100s set duration
           */
          // Add html node to media for 
          self.html = $media;
          // Check/set iframe based widgets play status
          // if(self.iframe && self.checkIframeStatus) {
          //     // Set state as false ( for now )
          //     self.ready = false;
          //
          //     // Append iframe
          //     $media.innerHTML = '';
          //     $media.appendChild(self.iframe as Node);
          //
          //     // On iframe load, set state as ready to play full preview
          //     (self.iframe) && self.iframe.addEventListener('load', function(){
          //         self.ready = true;
          //         if (self.iframe) {
          //             const iframeStyles = self.iframe.style.cssText;
          //             self.iframe.style.cssText = iframeStyles?.concat('visibility: visible;');
          //         }
          //     });
          // }
      };
      mediaObject.run = function () {
          const self = mediaObject;
          let transInDuration = 1;
          let transInDirection = 'E';
          if (Boolean(self.options['transinduration'])) {
              transInDuration = Number(self.options.transinduration);
          }
          if (Boolean(self.options['transindirection'])) {
              transInDirection = self.options.transindirection;
          }
          let defaultTransInOptions = { duration: transInDuration };
          let transIn = transitionElement('defaultIn', { duration: defaultTransInOptions.duration });
          if (Boolean(self.options['transin'])) {
              let transInName = self.options['transin'];
              if (transInName === 'fly') {
                  transInName = `${transInName}In`;
                  defaultTransInOptions.keyframes = flyTransitionKeyframes({
                      trans: 'in',
                      direction: transInDirection,
                      height: self.divHeight,
                      width: self.divWidth,
                  });
              }
              transIn = transitionElement(transInName, defaultTransInOptions);
          }
          const showCurrentMedia = async () => {
              let $mediaId = getMediaId(self);
              let $media = document.getElementById($mediaId);
              const isCMS = xlr.config.platform === 'CMS';
              if ($media === null) {
                  $media = getNewMedia();
              }
              if ($media !== null) {
                  $media.style.setProperty('display', 'block');
                  if (Boolean(self.options['transin'])) {
                      $media.animate(transIn.keyframes, transIn.timing);
                  }
                  if (self.mediaType === 'image' && self.url !== null) {
                      $media.style
                          .setProperty('background-image', `url(${!isCMS ? self.url : await getDataBlob(self.url)}`);
                  }
                  else if (self.mediaType === 'video' && self.url !== null) {
                      $media.src =
                          isCMS ? await preloadMediaBlob(self.url, self.mediaType) : self.url;
                  }
                  else if (self.mediaType === 'audio' && self.url !== null) {
                      $media.src =
                          isCMS ? await preloadMediaBlob(self.url, self.mediaType) : self.url;
                  }
                  else if ((self.render === 'html' || self.mediaType === 'webpage') &&
                      self.iframe && self.checkIframeStatus) {
                      // Set state as false ( for now )
                      self.ready = false;
                      // Append iframe
                      $media.innerHTML = '';
                      $media.appendChild(self.iframe);
                      // On iframe load, set state as ready to play full preview
                      (self.iframe) && self.iframe.addEventListener('load', function () {
                          self.ready = true;
                          if (self.iframe) {
                              const iframeStyles = self.iframe.style.cssText;
                              self.iframe.style.cssText = iframeStyles?.concat('visibility: visible;');
                          }
                      });
                  }
                  self.emitter?.emit('start', self);
              }
          };
          const getNewMedia = () => {
              const $region = document.getElementById(`${self.region.containerName}`);
              // This function is for checking whether
              // the region still has to show a media item
              // when another region is not finished yet
              if (self.region.complete && !self.region.layout.allEnded) {
                  // Add currentMedia to the region
                  ($region) && $region.insertBefore(self.html, $region.lastElementChild);
                  return self.html;
              }
              return null;
          };
          showCurrentMedia();
      };
      mediaObject.stop = async function () {
          const self = mediaObject;
          const $media = document.getElementById(getMediaId(self));
          if ($media) {
              $media.style.display = 'none';
              $media.remove();
          }
      };
      mediaObject.on = function (event, callback) {
          return emitter.on(event, callback);
      };
      mediaObject.emitter = emitter;
      mediaObject.init();
      return mediaObject;
  }

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
  function Region(layout, xml, regionId, options, xlr) {
      const props = {
          layout: layout,
          xml: xml,
          regionId: regionId,
          options: options,
      };
      const emitter = createNanoEvents();
      let regionObject = {
          ...initialRegion,
          ...props,
      };
      regionObject.prepareRegion = function () {
          const self = regionObject;
          const { layout, options } = self;
          self.id = props.regionId;
          self.options = { ...platform, ...props.options };
          self.containerName = `R-${self.id}-${nextId(self.options)}`;
          self.xml = props.xml;
          self.mediaObjects = [];
          self.sWidth = (self.xml) && Number(self.xml?.getAttribute('width')) * layout.scaleFactor;
          self.sHeight = (self.xml) && Number(self.xml?.getAttribute('height')) * layout.scaleFactor;
          self.offsetX = (self.xml) && Number(self.xml?.getAttribute('left')) * layout.scaleFactor;
          self.offsetY = (self.xml) && Number(self.xml?.getAttribute('top')) * layout.scaleFactor;
          self.zIndex = (self.xml) && Number(self.xml?.getAttribute('zindex'));
          const regionOptions = self.xml?.getElementsByTagName('options');
          if (regionOptions) {
              for (let _options of Array.from(regionOptions)) {
                  // Get options
                  const _regionOptions = _options.children;
                  for (let regionOption of Array.from(_regionOptions)) {
                      self.options[regionOption.nodeName.toLowerCase()] = regionOption.textContent;
                  }
              }
          }
          let $region = document.getElementById(self.containerName);
          const $layout = document.getElementById(`${self.layout.containerName}`);
          if ($region === null) {
              $region = document.createElement('div');
              $region.id = self.containerName;
          }
          ($layout) && $layout.appendChild($region);
          /* Scale the Layout Container */
          /* Add region styles */
          $region.style.cssText = `
            width: ${self.sWidth}px;
            height: ${self.sHeight}px;
            position: absolute;
            left: ${self.offsetX}px;
            top: ${self.offsetY}px;
            z-index: ${Math.round(self.zIndex)};
        `;
          $region.className = 'region--item';
          /* Parse region media objects */
          const regionMediaItems = Array.from(self.xml.getElementsByTagName('media'));
          self.totalMediaObjects = regionMediaItems.length;
          Array.from(regionMediaItems).forEach((mediaXml, indx) => {
              const mediaObj = Media(self, mediaXml?.getAttribute('id') || '', mediaXml, options, xlr);
              mediaObj.index = indx;
              self.mediaObjects.push(mediaObj);
          });
          self.prepareMediaObjects();
      };
      regionObject.finished = function () {
          const self = regionObject;
          console.log('Region::finished called . . . ', self.id);
          // Mark as complete
          self.complete = true;
          self.layout.regions[regionObject.index] = regionObject;
          self.layout.regionExpired();
      };
      regionObject.prepareMediaObjects = function () {
          const self = regionObject;
          let nextMediaIndex;
          if (self.mediaObjects.length > 0) {
              if (self.curMedia) {
                  self.oldMedia = self.curMedia;
              }
              else {
                  self.oldMedia = undefined;
              }
              if (self.currentMediaIndex >= self.mediaObjects.length) {
                  self.currentMediaIndex = 0;
              }
              self.curMedia = self.mediaObjects[self.currentMediaIndex];
              nextMediaIndex = self.currentMediaIndex + 1;
              if (nextMediaIndex >= self.mediaObjects.length ||
                  (!Boolean(self.mediaObjects[nextMediaIndex]) &&
                      self.mediaObjects.length === 1)) {
                  nextMediaIndex = 0;
              }
              if (Boolean(self.mediaObjects[nextMediaIndex])) {
                  self.nxtMedia = self.mediaObjects[nextMediaIndex];
              }
              const $region = document.getElementById(`${self.containerName}`);
              // Append available media to region DOM
              if (self.curMedia) {
                  ($region) && $region.insertBefore(self.curMedia.html, $region.lastElementChild);
              }
              if (self.nxtMedia) {
                  ($region) && $region.insertBefore(self.nxtMedia.html, $region.lastElementChild);
              }
          }
      };
      regionObject.run = function () {
          console.log('Called Region::run > ', regionObject.id);
          if (regionObject.curMedia) {
              regionObject.transitionNodes(regionObject.oldMedia, regionObject.curMedia);
          }
      };
      regionObject.transitionNodes = function (oldMedia, newMedia) {
          const self = regionObject;
          let transOutDuration = 1;
          let transOutDirection = 'E';
          if (newMedia) {
              if (oldMedia && Boolean(oldMedia.options['transoutduration'])) {
                  transOutDuration = Number(oldMedia.options.transoutduration);
              }
              if (oldMedia && Boolean(oldMedia.options['transoutdirection'])) {
                  transOutDirection = oldMedia.options.transoutdirection;
              }
              let defaultTransOutOptions = { duration: transOutDuration };
              let transOut = transitionElement('defaultOut', { duration: defaultTransOutOptions.duration });
              let transOutName;
              if (oldMedia && Boolean(oldMedia.options['transout'])) {
                  transOutName = oldMedia.options['transout'];
                  if (transOutName === 'fly') {
                      transOutName = `${transOutName}Out`;
                      defaultTransOutOptions.keyframes = flyTransitionKeyframes({
                          trans: 'out',
                          direction: transOutDirection,
                          height: oldMedia.divHeight,
                          width: oldMedia.divWidth,
                      });
                  }
                  transOut = transitionElement(transOutName, defaultTransOutOptions);
              }
              const hideOldMedia = new Promise((resolve) => {
                  // Hide oldMedia
                  if (oldMedia) {
                      const $oldMedia = document.getElementById(getMediaId(oldMedia));
                      if ($oldMedia) {
                          const removeOldMedia = () => {
                              $oldMedia.style.setProperty('display', 'none');
                              $oldMedia.remove();
                          };
                          let oldMediaAnimate;
                          if (Boolean(oldMedia.options['transout'])) {
                              oldMediaAnimate = $oldMedia.animate(transOut.keyframes, transOut.timing);
                          }
                          if (Boolean(oldMedia.options['transout']) && self.totalMediaObjects > 1) {
                              if (transOutName === 'flyOut') {
                                  // Reset last item to original position and state
                                  oldMediaAnimate ? oldMediaAnimate.finished
                                      .then(() => {
                                      resolve(true);
                                      oldMediaAnimate?.effect?.updateTiming({ fill: 'none' });
                                      removeOldMedia();
                                  }) : undefined;
                              }
                              else {
                                  setTimeout(removeOldMedia, transOutDuration / 2);
                                  resolve(true);
                              }
                          }
                          else {
                              removeOldMedia();
                              // Resolve this right away
                              // As a result, the transition between two media object
                              // seems like a cross-over
                              resolve(true);
                          }
                      }
                  }
              });
              if (oldMedia) {
                  hideOldMedia.then((isDone) => {
                      if (isDone) {
                          newMedia.run();
                      }
                  });
              }
              else {
                  newMedia.run();
              }
          }
      };
      regionObject.playNextMedia = function () {
          const self = regionObject;
          /* The current media has finished running */
          if (self.ended) {
              return;
          }
          if (self.currentMediaIndex === self.mediaObjects.length - 1) {
              self.finished();
              if (self.layout.allEnded) {
                  return;
              }
          }
          // When the region has completed and when currentMedia is html
          // Then, preserve the currentMedia state
          if (self.complete &&
              self.curMedia?.render === 'html') {
              return;
          }
          // When the region has completed and mediaObjects.length = 1
          // and curMedia.loop = false, then put the media on
          // its current state
          if (self.complete && self.mediaObjects.length === 1 &&
              self.curMedia?.render !== 'html' &&
              self.curMedia?.mediaType === 'image' &&
              !self.curMedia?.loop) {
              return;
          }
          self.currentMediaIndex = self.currentMediaIndex + 1;
          self.prepareMediaObjects();
          self.transitionNodes(self.oldMedia, self.curMedia);
      };
      regionObject.end = function () {
          const self = regionObject;
          self.ending = true;
          /* The Layout has finished running */
          /* Do any region exit transition then clean up */
          self.layout.regions[self.index] = self;
          console.log('Calling Region::end ', self);
          self.exitTransition();
      };
      regionObject.exitTransition = function () {
          const self = regionObject;
          /* TODO: Actually implement region exit transitions */
          const $region = document.getElementById(`${self.containerName}`);
          if ($region) {
              $region.style.display = 'none';
          }
          console.log('Called Region::exitTransition ', self.id);
          self.exitTransitionComplete();
      };
      regionObject.exitTransitionComplete = function () {
          const self = regionObject;
          console.log('Called Region::exitTransitionComplete ', self.id);
          self.ended = true;
          self.layout.regions[self.index] = self;
          self.layout.regionEnded();
      };
      regionObject.on = function (event, callback) {
          return emitter.on(event, callback);
      };
      regionObject.emitter = emitter;
      regionObject.prepareRegion();
      return regionObject;
  }

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
  const playAgainClickHandle = function (ev) {
      ev.preventDefault();
      history.go(0);
  };
  function initRenderingDOM(targetContainer) {
      let _targetContainer = targetContainer;
      const previewPlayer = document.createElement('div');
      const previewScreen = document.createElement('div');
      const endPlay = document.createElement('div');
      const playAgainLink = document.createElement('a');
      // Preview player
      previewPlayer.className = 'player-preview';
      previewPlayer.id = 'player_container';
      // Preview screen
      previewScreen.className = 'screen-preview';
      previewScreen.id = 'screen_container';
      // Ended play
      endPlay.className = 'preview-ended';
      endPlay.id = 'play_ended';
      endPlay.style.display = 'none';
      // Play again link
      playAgainLink.id = 'play_back_preview';
      playAgainLink.className = 'play-back-preview';
      playAgainLink.style.cssText = 'text-decoration: none; color: #ffffff;';
      playAgainLink.innerHTML = 'Play again?';
      playAgainLink.removeEventListener('click', playAgainClickHandle);
      playAgainLink.addEventListener('click', playAgainClickHandle);
      if (!_targetContainer) {
          _targetContainer = document.body;
      }
      if (_targetContainer) {
          if (_targetContainer.querySelector('#player_container') === null) {
              _targetContainer.insertBefore(previewPlayer, _targetContainer.firstChild);
              if (previewPlayer.querySelector('#screen_container') === null) {
                  previewPlayer.appendChild(previewScreen);
              }
              if (previewPlayer.querySelector('#play_ended') === null) {
                  previewPlayer.appendChild(endPlay);
                  if (endPlay.querySelector('a') === null) {
                      endPlay.appendChild(playAgainLink);
                  }
              }
          }
      }
  }
  async function getXlf(layoutOptions) {
      let apiHost = window.location.origin;
      let xlfUrl = apiHost + layoutOptions.xlfUrl;
      if (layoutOptions.platform === 'CMS') {
          xlfUrl = apiHost + layoutOptions.xlfUrl;
      }
      else if (layoutOptions.platform === 'chromeOS') {
          xlfUrl = layoutOptions.xlfUrl;
      }
      else if (layoutOptions.platform !== 'CMS' && layoutOptions.appHost !== null) {
          xlfUrl = layoutOptions.appHost + layoutOptions.xlfUrl;
      }
      const res = await fetch(xlfUrl);
      return await res.text();
  }
  function getLayout(params) {
      let _currentLayout = undefined;
      let _nextLayout = undefined;
      let { inputLayouts, currentLayout, nextLayout, currentLayoutIndex: currLayoutIndx } = params.xlr;
      const hasLayout = inputLayouts.length > 0;
      let currentLayoutIndex = currLayoutIndx;
      let nextLayoutIndex = currentLayoutIndex + 1;
      if (currentLayout === undefined && nextLayout === undefined) {
          let activeLayout;
          // Preview just got started
          if (hasLayout) {
              let nextLayoutTemp = { ...initialLayout };
              activeLayout = inputLayouts[currentLayoutIndex];
              _currentLayout = { ...initialLayout, ...activeLayout };
              if (inputLayouts.length > 1) {
                  nextLayoutTemp = { ...nextLayoutTemp, ...inputLayouts[nextLayoutIndex] };
                  _nextLayout = nextLayoutTemp;
              }
              else {
                  _nextLayout = _currentLayout;
              }
              _currentLayout.id = activeLayout.layoutId;
              if (nextLayoutTemp) {
                  _nextLayout.id = nextLayoutTemp.layoutId;
              }
          }
      }
      else {
          if (hasLayout) {
              _currentLayout = nextLayout;
              currentLayoutIndex = getIndexByLayoutId(inputLayouts, _currentLayout?.layoutId).index;
              nextLayoutIndex = currentLayoutIndex + 1;
              if (inputLayouts.length > 1 && nextLayoutIndex < inputLayouts.length) {
                  if (Boolean(params.xlr.layouts[nextLayoutIndex])) {
                      _nextLayout = params.xlr.layouts[nextLayoutIndex];
                  }
                  else {
                      _nextLayout = { ...initialLayout, ...inputLayouts[nextLayoutIndex] };
                  }
              }
              // If _nextLayout is undefined, then we go back to first layout
              if (_nextLayout === undefined) {
                  _nextLayout = params.xlr.layouts[0];
              }
          }
      }
      return {
          currentLayoutIndex,
          inputLayouts: params.xlr.inputLayouts,
          current: _currentLayout,
          next: _nextLayout,
      };
  }
  function Layout(data, options, xlr, layout) {
      const props = {
          data: data,
          options: options,
          layout: layout || initialLayout,
      };
      const emitter = createNanoEvents();
      emitter.on('start', (layout) => {
          layout.done = false;
          console.log('Layout start emitted > Layout ID > ', layout.id);
      });
      emitter.on('end', (layout) => {
          console.log('Ending layout with ID of > ', layout.layoutId);
          layout.done = true;
          /* Remove layout that has ended */
          const $layout = document.getElementById(layout.containerName);
          console.log({ $layout });
          if ($layout !== null) {
              $layout.remove();
          }
          if (xlr.config.platform !== 'CMS') {
              // Transition next layout to current layout and prepare next layout if exist
              xlr.prepareLayouts().then((parent) => {
                  xlr.playSchedules(parent);
              });
          }
      });
      const layoutObject = {
          ...props.layout,
          options: props.options,
          emitter,
      };
      layoutObject.on = function (event, callback) {
          return emitter.on(event, callback);
      };
      layoutObject.run = function () {
          const layout = layoutObject;
          const $layoutContainer = document.getElementById(`${layout.containerName}`);
          const $splashScreen = document.getElementById(`splash_${layout.id}`);
          if ($layoutContainer) {
              $layoutContainer.style.display = 'block';
          }
          if ($splashScreen) {
              $splashScreen.style.display = 'none';
          }
          console.log('Layout running > Layout ID > ', layout.id);
          console.log('Layout Regions > ', layout.regions);
          for (let i = 0; i < layout.regions.length; i++) {
              // playLog(4, "debug", "Running region " + self.regions[i].id, false);
              layout.regions[i].run();
          }
      };
      layoutObject.parseXlf = function () {
          const layout = layoutObject;
          const { data, options } = props;
          layout.containerName = "L" + layout.id + "-" + nextId(options);
          layout.regions = [];
          /* Create a hidden div to show the layout in */
          let $layout = document.getElementById(layout.containerName);
          if ($layout === null) {
              $layout = document.createElement('div');
              $layout.id = layout.containerName;
          }
          let $screen = document.getElementById('screen_container');
          ($screen) && $screen.appendChild($layout);
          if ($layout) {
              $layout.style.display = 'none';
              $layout.style.outline = 'red solid thin';
          }
          layout.layoutNode = data;
          /* Calculate the screen size */
          layout.sw = $screen?.offsetWidth || 0;
          layout.sh = $screen?.offsetHeight || 0;
          layout.xw = Number(layout.layoutNode?.firstElementChild?.getAttribute('width'));
          layout.xh = Number(layout.layoutNode?.firstElementChild?.getAttribute('height'));
          layout.zIndex = Number(layout.layoutNode?.firstElementChild?.getAttribute('zindex')) || 0;
          /* Calculate Scale Factor */
          layout.scaleFactor = Math.min((layout.sw / layout.xw), (layout.sh / layout.xh));
          layout.sWidth = Math.round(layout.xw * layout.scaleFactor);
          layout.sHeight = Math.round(layout.xh * layout.scaleFactor);
          layout.offsetX = Math.abs(layout.sw - layout.sWidth) / 2;
          layout.offsetY = Math.abs(layout.sh - layout.sHeight) / 2;
          const layoutStyles = `
            width: ${layout.sWidth}px;
            height: ${layout.sHeight}px;
            position: absolute;
            left: ${layout.offsetX}px;
            top: ${layout.offsetY}px;
        `;
          /* Scale the Layout Container */
          if ($layout) {
              $layout.style.cssText = layoutStyles;
          }
          if ($layout && layout.zIndex !== null) {
              $layout.style.cssText = layoutStyles.concat(`z-index: ${layout.zIndex};`);
          }
          /* Set the layout background */
          layout.bgColor = layout.layoutNode?.firstElementChild?.getAttribute('bgcolor') || '';
          layout.bgImage = layout.layoutNode?.firstElementChild?.getAttribute('background') || '';
          if (!(layout.bgImage === "" || typeof layout.bgImage === 'undefined')) {
              /* Extract the image ID from the filename */
              layout.bgId = layout.bgImage.substring(0, layout.bgImage.indexOf('.'));
              let tmpUrl = options.layoutBackgroundDownloadUrl.replace(":id", layout.id) + '?preview=1';
              // preload.addFiles(tmpUrl + "&width=" + self.sWidth + "&height=" + self.sHeight + "&dynamic&proportional=0");
              if ($layout) {
                  $layout.style.cssText = layoutStyles.concat(`
                    background: url('${tmpUrl}&width=${layout.sWidth}&height=${layout.sHeight}&dynamic&proportional=0');
                    backgroundRepeat: "no-repeat";
                    backgroundSize: ${layout.sWidth}px ${layout.sHeight}px;
                    backgroundPosition: "0px 0px";
                `);
              }
          }
          // Set the background color
          if ($layout) {
              $layout.style.cssText = layoutStyles.concat(`background-color: layout.bgColor;`);
          }
          // Hide if layout is not the currentLayout
          if ($layout && xlr.currentLayoutId !== undefined && xlr.currentLayoutId !== layout.id) {
              $layout.style.cssText = $layout.style.cssText.concat('display: none;');
          }
          // Create regions
          const layoutRegions = Array.from(layout?.layoutNode?.getElementsByTagName('region') || []);
          Array.from(layoutRegions).forEach((regionXml, indx) => {
              const regionObj = Region(layout, regionXml, regionXml?.getAttribute('id') || '', options, xlr);
              regionObj.index = indx;
              layout.regions.push(regionObj);
          });
      };
      layoutObject.prepareLayout = function () {
          layoutObject.parseXlf();
      };
      layoutObject.regionExpired = function () {
          const self = layoutObject;
          self.allExpired = true;
          for (let layoutRegion of self.regions) {
              if (!layoutRegion.complete) {
                  self.allExpired = false;
              }
          }
          if (self.allExpired) {
              self.end();
          }
      };
      layoutObject.regionEnded = function () {
          const self = layoutObject;
          self.allEnded = true;
          for (var i = 0; i < self.regions.length; i++) {
              if (!self.regions[i].ended) {
                  self.allEnded = false;
              }
          }
          if (self.allEnded) {
              self.stopAllMedia().then(() => {
                  console.log('starting to end layout . . .');
                  if (xlr.config.platform === 'CMS') {
                      const $end = document.getElementById('play_ended');
                      const $preview = document.getElementById('screen_container');
                      if ($preview) {
                          while ($preview.firstChild) {
                              $preview.removeChild($preview.firstChild);
                          }
                          $preview.style.display = 'none';
                      }
                      if ($end) {
                          $end.style.display = 'block';
                      }
                  }
                  self.emitter?.emit('end', self);
              });
          }
      };
      layoutObject.end = function () {
          console.log('Executing Layout::end and Calling Region::end ', layoutObject);
          /* Ask the layout to gracefully stop running now */
          for (let layoutRegion of layoutObject.regions) {
              layoutRegion.end();
          }
      };
      layoutObject.stopAllMedia = function () {
          console.log('Stopping all media . . .');
          return new Promise(async (resolve) => {
              for (var i = 0; i < layoutObject.regions.length; i++) {
                  var region = layoutObject.regions[i];
                  for (var j = 0; j < region.mediaObjects.length; j++) {
                      var media = region.mediaObjects[j];
                      await media.stop();
                  }
              }
              resolve();
          });
      };
      layoutObject.prepareLayout();
      return layoutObject;
  }

  var ELayoutType;
  (function (ELayoutType) {
      ELayoutType[ELayoutType["CURRENT"] = 0] = "CURRENT";
      ELayoutType[ELayoutType["NEXT"] = 1] = "NEXT";
  })(ELayoutType || (ELayoutType = {}));
  const initialXlr = {
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
          return Promise.resolve({});
      },
      playSchedules() {
      },
      prepareLayoutXlf(inputLayout) {
          return Promise.resolve({});
      },
      prepareLayouts() {
          return Promise.resolve({});
      }
  };

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
  function XiboLayoutRenderer(inputLayouts, options) {
      const props = {
          inputLayouts,
          options,
      };
      const xlrObject = {
          ...initialXlr,
          bootstrap() {
              // Place to set configurations and initialize required props
              const self = this;
              self.inputLayouts = !Array.isArray(props.inputLayouts) ?
                  [props.inputLayouts] : props.inputLayouts;
              self.config = JSON.parse(JSON.stringify({ ...platform, ...props.options }));
          },
          init() {
              return new Promise((resolve) => {
                  const self = this;
                  // Prepare rendering DOM
                  const previewCanvas = document.querySelector('.preview-canvas');
                  initRenderingDOM(previewCanvas);
                  self.prepareLayouts().then((xlr) => {
                      resolve(xlr);
                  });
              });
          },
          playSchedules(xlr) {
              // Check if there's a current layout
              if (xlr.currentLayout !== undefined) {
                  xlr.currentLayout.emitter?.emit('start', xlr.currentLayout);
                  xlr.currentLayout.run();
              }
          },
          async prepareLayoutXlf(inputLayout) {
              const self = this;
              // Compose layout props first
              let newOptions = Object.assign({}, platform);
              newOptions = {
                  ...newOptions,
                  ...props.options,
              };
              if (self.config.platform === 'CMS' &&
                  inputLayout && Boolean(inputLayout.layoutId)) {
                  newOptions.xlfUrl =
                      newOptions.xlfUrl.replace(':layoutId', String(inputLayout.layoutId));
              }
              else if (self.config.platform === 'chromeOS') {
                  newOptions.xlfUrl = inputLayout.path;
              }
              let layoutXlf;
              let layoutXlfNode;
              if (inputLayout && inputLayout.layoutNode === null) {
                  layoutXlf = await getXlf(newOptions);
                  const parser = new window.DOMParser();
                  layoutXlfNode = parser.parseFromString(layoutXlf, 'text/xml');
              }
              else {
                  layoutXlfNode = inputLayout && inputLayout.layoutNode;
              }
              return new Promise((resolve) => {
                  const xlrLayoutObj = initialLayout;
                  xlrLayoutObj.id = Number(inputLayout.layoutId);
                  xlrLayoutObj.layoutId = Number(inputLayout.layoutId);
                  xlrLayoutObj.options = newOptions;
                  resolve(Layout(layoutXlfNode, newOptions, self, xlrLayoutObj));
              });
          },
          async prepareLayouts() {
              const self = this;
              // Get layouts
              const xlrLayouts = getLayout({ xlr: self });
              self.currentLayoutId = xlrLayouts.current?.layoutId;
              const layoutsXlf = () => {
                  let xlf = [];
                  xlf.push(xlrLayouts.current);
                  if (xlrLayouts.current?.layoutId !== xlrLayouts.next?.layoutId) {
                      xlf.push(xlrLayouts.next);
                  }
                  return xlf.reduce((coll, item) => {
                      return [
                          ...coll,
                          self.prepareLayoutXlf(item),
                      ];
                  }, []);
              };
              const layouts = await Promise.all(layoutsXlf());
              return new Promise((resolve) => {
                  self.layouts = layouts;
                  self.currentLayout = self.layouts[0];
                  if (Boolean(self.layouts[1])) {
                      self.nextLayout = self.layouts[1];
                  }
                  else {
                      // Use current layout as next layout if only one layout is available
                      self.nextLayout = self.layouts[0];
                  }
                  self.currentLayoutIndex = xlrLayouts.currentLayoutIndex;
                  self.layouts[self.currentLayoutIndex] = self.currentLayout;
                  resolve(self);
              });
          },
      };
      xlrObject.bootstrap();
      return xlrObject;
  }

  return XiboLayoutRenderer;

})();
