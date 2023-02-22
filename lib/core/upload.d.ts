/// <reference types="node" />
import { Signer } from "ethers";
export declare const FileAbi: string[];
export declare const FlatDirectoryAbi: string[];
export declare function upload(signer: Signer, address: string, directoryPath: string, fileSize: number, fileData: Buffer, onProgress?: Function, onSuccess?: Function, onError?: Function): Promise<void>;
export declare function createDirectory(signer: Signer): Promise<string | false>;
