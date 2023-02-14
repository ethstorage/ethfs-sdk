# ethfs-sdk
EthStorage upload file sdk.

## Installation

With [npm](https://npmjs.org) do

```bash
$ npm install ethfs-sdk
```

## Usage
### Create FlatDirectory

```js
import {DirectoryContractFactory, DirectoryContractFactoryByRPC, createDirectory} from "ethfs-sdk";

const provider = window.ethereum;
const rpc = "https://galileo.web3q.io:8545";
const privateKey = "0x...";


const factory = DirectoryContractFactory(provider);
or
const factory = DirectoryContractFactoryByRPC(rpc, privateKey);


const address = await createDirectory(factory);
// 0xC7c5CB39D5be1626c782C980b6008AC157DbC49d
```


### Upload file

```js
import {DirectoryContract, DirectoryContractByRPC, upload} from "ethfs-sdk";

const contractAddress = "0xC7c5CB39D5be1626c782C980b6008AC157DbC49d";
const provider = window.ethereum;
const rpc = "https://galileo.web3q.io:8545";
const privateKey = "";


const contract = DirectoryContract(provider, contractAddress);
or
const contract = DirectoryContractByRPC(rpc, privateKey, contractAddress);

// callback, can be null
const onProgress = (chunkIndex, totalChunk, fileName) => {}
const onSuccess = (fileName) => {}
const onError = (message) => {}

const fileName = "0.jpeg";
const fileSize = 1024;
const content = Buffer;
const dirPath = "test/" // "" means the file is in the root directory
await upload(contract, fileName, fileSize, content, dirPath,
    onProgress, onSuccess, onError);
// file path: 0xC7c5CB39D5be1626c782C980b6008AC157DbC49d/test/0.jpeg
```
