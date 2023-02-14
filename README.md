# ethfs-sdk
An sdk for uploading files to the ethstorage network.

## Installation

With [npm](https://npmjs.org) do

```bash
$ npm install ethfs-sdk
```

## Usage
### Create FlatDirectory

```js
import {DirectoryContractFactory, DirectoryContractFactoryByRPC, createDirectory} from "ethfs-sdk";

const privateKey = "0x...";


const factory = DirectoryContractFactory(window.ethereum);
or
const factory = DirectoryContractFactoryByRPC("https://galileo.web3q.io:8545", privateKey);


const address = await createDirectory(factory);
// 0xC7c5CB39D5be1626c782C980b6008AC157DbC49d
```


### Upload file

```js
import {DirectoryContract, DirectoryContractByRPC, upload} from "ethfs-sdk";

const contractAddress = "0xC7c5CB39D5be1626c782C980b6008AC157DbC49d";
const privateKey = "";


const contract = DirectoryContract(window.ethereum, contractAddress);
or
const contract = DirectoryContractByRPC("https://galileo.web3q.io:8545", privateKey, contractAddress);


const onProgress = (chunkIndex, totalChunk, fileName) => {
}
const onSuccess = (fileName) => {
}
const onError = (message) => {
}

const fileName = "0.jpeg";
const fileSize = 1024;
const content = Buffer;
const dirPath = "test/" // "" means the file is in the root directory
await upload(contract, fileName, fileSize, content, "", onProgress, onSuccess, onError);
// file path: 0xC7c5CB39D5be1626c782C980b6008AC157DbC49d/test/0.jpeg
```
