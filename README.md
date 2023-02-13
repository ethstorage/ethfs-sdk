# ethfs-sdk
An sdk for uploading files to the ethstorage network.

## Installation

With [npm](https://npmjs.org) do

```bash
$ npm install ethfs-sdk
```

## Usage

```js
import {upload} from "ethfs-sdk";
```

## Upload file

```
upload(
    provider, // window.ethereum
    address, // contract address
    file: File | string,
    dirPath: string = "", // The file is in the root directory by default
    onProgress: Function = noop,
    onSuccess: Function = noop,
    onError: Function = noop
)
```

```js
function onProgress(chunkIndex, totalChunk, file) {
}

function onSuccess(file) {
}

function onError(s) {
}

const contractAddress = "0xCda64Cb111ED359716CC91dAfd5cb0ffB66A524d";

// const file = "from <input />";

await upload(window.ethereum, contractAddress, file, "",
    onProgress, onSuccess, onError);

```
