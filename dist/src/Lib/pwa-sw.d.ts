export default function PwaSW(): {
    getSW(): Promise<ServiceWorkerRegistration | undefined>;
    postMsg(msg: any): Promise<unknown>;
};
