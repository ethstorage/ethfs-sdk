# ethfs-sdk
EthStorage upload file sdk.

## Installation

With [npm](https://npmjs.org) do

```bash
$ npm install ethfs-sdk
```

## Usage

### Get Signer
```js
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();


or


const rpc = "https://galileo.web3q.io:8545";
const privateKey = "0x...";
const provider = new ethers.providers.JsonRpcProvider(rpc);
const signer = new ethers.Wallet(privateKey, provider);
```


### Create FlatDirectory

```js
import {createDirectory} from "ethfs-sdk";

const signer = getSigner(); 
const directoryAddress = await createDirectory(signer);
// 0xC7c5CB39D5be1626c782C980b6008AC157DbC49d
```


### Upload file

```js
import {upload} from "ethfs-sdk";

const signer = getSigner();
const contract = "0xC7c5CB39D5be1626c782C980b6008AC157DbC49d";

const fileName = "0.jpeg";
const fileSize = 1024;
const content = Buffer;
// "" means the file is in the root directory
const dirPath = "test/";

// callback, can be null
const onProgress = (chunkIndex, totalChunk, fileName) => {
// ...
}
const onSuccess = (fileName) => {
// ...
}
const onError = (message) => {
// ...
}

await upload(signer, contract, fileName, fileSize, content, dirPath,
    onProgress, onSuccess, onError);
// file path: 0xC7c5CB39D5be1626c782C980b6008AC157DbC49d/test/0.jpeg
```
