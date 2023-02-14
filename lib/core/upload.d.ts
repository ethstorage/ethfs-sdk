/// <reference types="node" />
import { Contract, ContractFactory } from "ethers";
export declare const FileAbi: string[];
export declare const FlatDirectoryAbi: string[];
export declare function DirectoryContract(_provider: any, _address: any): Contract;
export declare function DirectoryContractByRPC(_providerUrl: any, _privateKey: any, _address: any): Contract;
export declare function DirectoryContractFactory(_provider: any): ContractFactory;
export declare function DirectoryContractFactoryByRPC(_providerUrl: any, _privateKey: any): ContractFactory;
export declare function upload(contract: Contract, fileName: string, fileSize: number, fileData: Buffer, dirPath?: string, onProgress?: Function, onSuccess?: Function, onError?: Function): Promise<void>;
export declare function createDirectory(factory: ContractFactory): Promise<string | false>;
