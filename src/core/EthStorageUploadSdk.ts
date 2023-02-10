import { ethers } from "ethers";
import fs from "fs";
const sha3 = require('js-sha3').keccak_256;

const fileAbi = [
  "function write(bytes memory filename, bytes memory data) public payable",
  "function writeChunk(bytes memory name, uint256 chunkId, bytes memory data) public payable",
  "function files(bytes memory filename) public view returns (bytes memory)",
  "function setDefault(bytes memory _defaultFile) public",
  "function refund() public",
  "function remove(bytes memory name) external returns (uint256)",
  "function countChunks(bytes memory name) external view returns (uint256)",
  "function getChunkHash(bytes memory name, uint256 chunkId) public view returns (bytes32)"
];

const GALILEO_CHAIN_ID = 3334;

const REMOVE_FAIL = -1;
const REMOVE_NORMAL = 0;
const REMOVE_SUCCESS = 1;

const bufferChunk = (buffer, chunkSize) => {
  let i = 0;
  let result = [];
  const len = buffer.length;
  const chunkLength = Math.ceil(len / chunkSize);
  while (i < len) {
    result.push(buffer.slice(i, i += chunkLength));
  }
  return result;
}

// Exported Types
export type ExternalProvider = {
  isMetaMask?: boolean;
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (request: { method: string, params?: Array<any> }, callback: (error: any, response: any) => void) => void
  send?: (request: { method: string, params?: Array<any> }, callback: (error: any, response: any) => void) => void
  request?: (request: { method: string, params?: Array<any> }) => Promise<any>
}

export type JsonRpcFetchFunc = (method: string, params?: Array<any>) => Promise<any>;

interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath: string;
  size: number;
}

export function defineReadOnly<T, K extends keyof T>(object: T, name: K, value: T[K]): void {
  Object.defineProperty(object, name, {
    enumerable: true,
    value: value,
    writable: false,
  });
}

export class EthStorageUploadSdk {
  readonly provider: ethers.providers.Web3Provider;
  readonly contract: ethers.Contract;

  constructor(provider: ExternalProvider | JsonRpcFetchFunc, address) {
    let localProvider = new ethers.providers.Web3Provider(provider);
    let localContract = new ethers.Contract(address, fileAbi, localProvider);
    localContract.connect(localProvider.getSigner());

    defineReadOnly(this, "provider", localProvider);
    defineReadOnly(this, "contract", localContract);
  }

  stringToHex(s: string): string {
   return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (res) => {
        const data: string | ArrayBuffer = res.target.result;
        if (typeof data !== 'object') {
          resolve(Buffer.from(data));
        } else {
          reject();
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  async delete(hexName) {
    const estimatedGas = await this.contract.estimateGas.remove(hexName);
    let tx = await this.contract.remove(hexName, {
      gasLimit: estimatedGas.mul(6).div(5).toString()
    });
    const receipt = await tx.wait();
    if (receipt.status) {
      return REMOVE_SUCCESS;
    } else {
      return REMOVE_FAIL;
    }
  }

  async checkAndDelete(hexName, chunkLength) {
    let oldChunkLength = await this.contract.countChunks(hexName);
    if (oldChunkLength > chunkLength) {
      // delete
      return this.delete(hexName);
    }
    return REMOVE_NORMAL;
  }

  async upload(file: File | string, dirPath?: string) {
    if (!file) {
      throw new Error(`missing file, file : ${file}`);
    }

    // load file
    let content, name, fileSize;
    if (typeof file === 'string') {
      // path
      const fileStat = fs.statSync(file);
      if (fileStat.isFile()) {
        content = fs.readFileSync(file);
        name = file.substring(file.lastIndexOf("/") + 1)
        name = dirPath ? dirPath + name : name;
        fileSize = fileStat.size;
      } else {
        throw new Error(`Not support file dir, file dir: ${file}`);
      }
    } else {
      // raw file
      content = await this.readFile(file);
      name = dirPath ? dirPath + file.name : file.name;
      fileSize = file.size;
    }
    const hexName = this.stringToHex(name);
    const {chainId} = await this.provider.getNetwork()


    // Data need to be sliced if file > 475K
    let chunks: any[] = [];
    if (chainId === GALILEO_CHAIN_ID) {
      // Data need to be sliced if file > 475K
      if (fileSize > 475 * 1024) {
        const chunkSize = Math.ceil(fileSize / (475 * 1024));
        chunks = bufferChunk(content, chunkSize);
        fileSize = fileSize / chunkSize;
      } else {
        chunks.push(content);
      }
    } else {
      // Data need to be sliced if file > 24K
      if (fileSize > 24 * 1024 - 326) {
        const chunkSize = Math.ceil(fileSize / (24 * 1024 - 326));
        chunks = bufferChunk(content, chunkSize);
        fileSize = fileSize / chunkSize;
      } else {
        chunks.push(content);
      }
    }


    const clearState = await this.checkAndDelete(hexName, chunks.length);
    if (clearState === REMOVE_FAIL) {
      // onError(new Error("Check Old File Fail!"));
      // return;
      return {upload: 0};
    }

    let cost = 0;
    if ((chainId === GALILEO_CHAIN_ID) && (fileSize > 24 * 1024 - 326)) {
      // eth storage need stake
      cost = Math.floor((fileSize + 326) / 1024 / 24);
    }

    let uploadState = true;
    for (const index in chunks) {
      const chunk = chunks[index];
      const hexData = '0x' + chunk.toString('hex');

      if (clearState === REMOVE_NORMAL) {
        // check is change
        const localHash = '0x' + sha3(chunk);
        let hash = await this.contract.getChunkHash(hexName, index);
        if (localHash === hash) {
          // TODO progress
          console.log(`File chunkId: ${index}: The data is not changed.`);
          continue;
        }
      }

      // upload file
      const estimatedGas = await this.contract.estimateGas.writeChunk(hexName, index, hexData, {
        value: ethers.utils.parseEther(cost.toString())
      });
      const tx = await this.contract.writeChunk(hexName, index, hexData, {
        gasLimit: estimatedGas.mul(6).div(5).toString(),
        value: ethers.utils.parseEther(cost.toString())
      });
      // get result
      const receipt = await tx.wait();
      if (!receipt.status) {
        uploadState = false;
        // TODO upload fail
        break;
      }
    }

    // upload finish
  }
}

export default EthStorageUploadSdk;
