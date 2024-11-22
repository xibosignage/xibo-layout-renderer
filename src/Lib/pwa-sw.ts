export default function PwaSW() {
    const swScope = '/pwa/sw.js';

    return {
        async getSW() {
            return await navigator.serviceWorker.getRegistration(swScope);
        },
        postMsg(msg: any) {
            return new Promise(resolve => {
                navigator.serviceWorker.controller?.postMessage(msg);
                resolve(true);
            })
        }
    }
}