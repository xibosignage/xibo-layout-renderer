declare const window: Window &
    typeof globalThis & {
        jQuery: any;
        $: any;
    }

import jQuery from "jquery";

window.jQuery = window.$ = jQuery;
