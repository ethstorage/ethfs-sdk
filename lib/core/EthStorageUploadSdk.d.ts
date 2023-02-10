import { ethers } from "ethers";
export type ExternalProvider = {
    isMetaMask?: boolean;
    isStatus?: boolean;
    host?: string;
    path?: string;
    sendAsync?: (request: {
        method: string;
        params?: Array<any>;
    }, callback: (error: any, response: any) => void) => void;
    send?: (request: {
        method: string;
        params?: Array<any>;
    }, callback: (error: any, response: any) => void) => void;
    request?: (request: {
        method: string;
        params?: Array<any>;
    }) => Promise<any>;
};
export type JsonRpcFetchFunc = (method: string, params?: Array<any>) => Promise<any>;
interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;
    size: number;
}
export declare function defineReadOnly<T, K extends keyof T>(object: T, name: K, value: T[K]): void;
export declare class EthStorageUploadSdk {
    readonly provider: ethers.providers.Web3Provider;
    readonly contract: ethers.Contract;
    constructor(provider: ExternalProvider | JsonRpcFetchFunc, address: any);
    stringToHex(s: string): string;
    readFile(file: any): Promise<unknown>;
    delete(hexName: any): Promise<1 | -1>;
    checkAndDelete(hexName: any, chunkLength: any): Promise<1 | -1 | 0>;
    upload(file: File | string, dirPath?: string): Promise<{
        upload: number;
    }>;
}
export default EthStorageUploadSdk;
