import {createNanoEvents} from "nanoevents";
import {
    GetLayoutParamType,
    GetLayoutType,
    ILayout,
    initialLayout,
    InputLayoutType,
    OptionsType
} from "../../Types/Layout.types.js";
import {nextId} from "../Generators.js";
import Region from "../Region.js";

import './layout.css';
import {IXlr} from "../../Types/XLR.types.js";

export function initRenderingDOM(targetContainer: Element | null) {
    let _targetContainer = targetContainer;
    const previewPlayer = document.createElement('div');
    const previewScreen = document.createElement('div');

    // Preview player
    previewPlayer.className = 'player-preview';
    previewPlayer.id = 'player_container';

    // Preview screen
    previewScreen.className = 'screen-preview';
    previewScreen.id = 'screen_container';

    if (!_targetContainer) {
        _targetContainer = document.body;
    }

    if (_targetContainer) {
        if (_targetContainer.querySelector('#player_container') === null) {
            _targetContainer.insertBefore(previewPlayer, _targetContainer.firstChild);

            if (previewPlayer.querySelector('#screen_container') === null) {
                previewPlayer.appendChild(previewScreen);
            }
        }
    }
}

export async function getXlf(layoutOptions: OptionsType) {
    console.log({layoutOptions});
    const apiHost = 'http://localhost';
    const res = await fetch(apiHost + layoutOptions.xlfUrl, {mode: 'no-cors'});
    return await res.text();
}

export function getLayout(params: GetLayoutParamType): GetLayoutType {
    let _currentLayout = undefined;
    let _nextLayout = undefined;
    let {
        inputLayouts,
        currentLayout,
        nextLayout,
        currentLayoutIndex
    } = params.xlr;
    const hasLayout = inputLayouts.length > 0;
    const layoutStartCount = currentLayoutIndex === -1 ? 0 : currentLayoutIndex;
    const nextLayoutIndex = currentLayoutIndex + 1;

    if (currentLayout === undefined && nextLayout === undefined) {
        // Preview just got started
        if (hasLayout) {
            _currentLayout = {...initialLayout, ...inputLayouts[currentLayoutIndex]};

            if (inputLayouts.length > 1) {
                _nextLayout = {...initialLayout, ...inputLayouts[nextLayoutIndex]};
            } else {
                _nextLayout = _currentLayout;
            }
        }
    } else {
        if (hasLayout) {
            if (params.moveNext) {
                _currentLayout = nextLayout;
            }

            if (inputLayouts.length > 1 && nextLayoutIndex < inputLayouts.length) {
                if (Boolean(params.xlr.layouts[nextLayoutIndex])) {
                    _nextLayout = params.xlr.layouts[nextLayoutIndex];
                } else {
                    _nextLayout = {...initialLayout, ...inputLayouts[nextLayoutIndex]};
                }
            }
            console.log({nextLayout: _nextLayout});

            // If _nextLayout is undefined, then we go back to first layout
            if (_nextLayout === undefined) {
                _nextLayout = params.xlr.layouts[0];
            }
        }
    }

    console.log({currentLayoutIndex});

    return {
        currentLayoutIndex,
        inputLayouts: params.xlr.inputLayouts,
        current: _currentLayout,
        next: _nextLayout,
    }
}

export interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}

export default function Layout(
    data: Document | null,
    options: OptionsType,
    xlr: IXlr,
    layout?: ILayout
) {
    const props = {
        data: data,
        options: options,
        layout: layout || initialLayout,
    }
    const emitter = createNanoEvents<ILayoutEvents>();

    emitter.on('start', (layout) => {
        layout.done = false;
        console.log('Layout start emitted > Layout ID > ', layout.id);
    });

    emitter.on('end', (layout) => {
        layout.done = true;
        /* Remove layout that has ended */
        let $layout = document.getElementById(layout.containerName);

        if ($layout !== null) {
            $layout.remove();
        }

        // Transition next layout to current layout and prepare next layout if exist
        xlr.prepareLayouts().then((parent) => {
            xlr.playSchedules(parent);
        });
    });

    const layoutObject: ILayout = {
        ...props.layout,
        options: props.options,
        emitter,
        on: function<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]) {
            return emitter.on(event, callback);
        },
        run() {
            const layout = this;
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
                // playLog(4, "debug", "Running region " + self.regionObjects[i].id, false);
                layout.regions[i].run();
            }
        },

        parseXlf() {
            const layout = this;
            const {data, options} = props;
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

                let tmpUrl = options.layoutBackgroundDownloadUrl.replace(":id", (layout.id as unknown) as string) + '?preview=1';

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

            for (let regionXml of layoutRegions) {
                layout.regions.push(Region(
                    layout,
                    regionXml,
                    regionXml?.getAttribute('id') || '',
                    options,
                ));
            }
        },

        prepareLayout() {
            this.parseXlf();
        },

        regionExpired() {
            const self = this;
            self.allExpired = true;

            for (let layoutRegion of self.regions) {
                if (!layoutRegion.complete) {
                    self.allExpired = false;
                }
            }

            if (self.allExpired) {
                self.end();
            }
        },

        end() {
            /* Ask the layout to gracefully stop running now */
            for (let layoutRegion of this.regions) {
                layoutRegion.end();
            }
        },
    }

    layoutObject.prepareLayout();

    return layoutObject;
}
