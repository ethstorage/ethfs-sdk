(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.JSUTILS = {}));
})(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule$1(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	var byteLength_1 = byteLength;
	var toByteArray_1 = toByteArray;
	var fromByteArray_1 = fromByteArray;

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i];
	  revLookup[code.charCodeAt(i)] = i;
	}

	// Support decoding URL-safe base64 strings, as Node.js does.
	// See: https://en.wikipedia.org/wiki/Base64#URL_applications
	revLookup['-'.charCodeAt(0)] = 62;
	revLookup['_'.charCodeAt(0)] = 63;

	function getLens (b64) {
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // Trim off extra bytes after placeholder bytes are found
	  // See: https://github.com/beatgammit/base64-js/issues/42
	  var validLen = b64.indexOf('=');
	  if (validLen === -1) validLen = len;

	  var placeHoldersLen = validLen === len
	    ? 0
	    : 4 - (validLen % 4);

	  return [validLen, placeHoldersLen]
	}

	// base64 is 4/3 + up to two characters of the original data
	function byteLength (b64) {
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function _byteLength (b64, validLen, placeHoldersLen) {
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function toByteArray (b64) {
	  var tmp;
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];

	  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

	  var curByte = 0;

	  // if there are placeholders, only get up to the last complete 4 chars
	  var len = placeHoldersLen > 0
	    ? validLen - 4
	    : validLen;

	  var i;
	  for (i = 0; i < len; i += 4) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 18) |
	      (revLookup[b64.charCodeAt(i + 1)] << 12) |
	      (revLookup[b64.charCodeAt(i + 2)] << 6) |
	      revLookup[b64.charCodeAt(i + 3)];
	    arr[curByte++] = (tmp >> 16) & 0xFF;
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 2) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 2) |
	      (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 1) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 10) |
	      (revLookup[b64.charCodeAt(i + 1)] << 4) |
	      (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] +
	    lookup[num >> 12 & 0x3F] +
	    lookup[num >> 6 & 0x3F] +
	    lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp =
	      ((uint8[i] << 16) & 0xFF0000) +
	      ((uint8[i + 1] << 8) & 0xFF00) +
	      (uint8[i + 2] & 0xFF);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 2] +
	      lookup[(tmp << 4) & 0x3F] +
	      '=='
	    );
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 10] +
	      lookup[(tmp >> 4) & 0x3F] +
	      lookup[(tmp << 2) & 0x3F] +
	      '='
	    );
	  }

	  return parts.join('')
	}

	var base64Js = {
		byteLength: byteLength_1,
		toByteArray: toByteArray_1,
		fromByteArray: fromByteArray_1
	};

	/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
	var read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	};

	var write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = ((value * c) - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	};

	var ieee754 = {
		read: read,
		write: write
	};

	var toString = {}.toString;

	var isarray = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};

	/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <http://feross.org>
	 * @license  MIT
	 */

	var buffer = createCommonjsModule$1(function (module, exports) {





	exports.Buffer = Buffer;
	exports.SlowBuffer = SlowBuffer;
	exports.INSPECT_MAX_BYTES = 50;

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = commonjsGlobal.TYPED_ARRAY_SUPPORT !== undefined
	  ? commonjsGlobal.TYPED_ARRAY_SUPPORT
	  : typedArraySupport();

	/*
	 * Export kMaxLength after typed array support is determined.
	 */
	exports.kMaxLength = kMaxLength();

	function typedArraySupport () {
	  try {
	    var arr = new Uint8Array(1);
	    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }};
	    return arr.foo() === 42 && // typed array instances can be augmented
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length);
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length);
	    }
	    that.length = length;
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}

	Buffer.poolSize = 8192; // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype;
	  return arr
	};

	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	};

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype;
	  Buffer.__proto__ = Uint8Array;
	  if (typeof Symbol !== 'undefined' && Symbol.species &&
	      Buffer[Symbol.species] === Buffer) {
	    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	    Object.defineProperty(Buffer, Symbol.species, {
	      value: null,
	      configurable: true
	    });
	  }
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size);
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	};

	function allocUnsafe (that, size) {
	  assertSize(size);
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0;
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	};
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	};

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8';
	  }

	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0;
	  that = createBuffer(that, length);

	  var actual = that.write(string, encoding);

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual);
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0;
	  that = createBuffer(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array);
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset);
	  } else {
	    array = new Uint8Array(array, byteOffset, length);
	  }

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array;
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array);
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (Buffer.isBuffer(obj)) {
	    var len = checked(obj.length) | 0;
	    that = createBuffer(that, len);

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len);
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isarray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0;
	  }
	  return Buffer.alloc(+length)
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	};

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	};

	Buffer.concat = function concat (list, length) {
	  if (!isarray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }

	  var i;
	  if (length === undefined) {
	    length = 0;
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length;
	    }
	  }

	  var buffer = Buffer.allocUnsafe(length);
	  var pos = 0;
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i];
	    if (!Buffer.isBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos);
	    pos += buf.length;
	  }
	  return buffer
	};

	function byteLength (string, encoding) {
	  if (Buffer.isBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string;
	  }

	  var len = string.length;
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	Buffer.byteLength = byteLength;

	function slowToString (encoding, start, end) {
	  var loweredCase = false;

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0;
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length;
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0;
	  start >>>= 0;

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8';

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase();
	        loweredCase = true;
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true;

	function swap (b, n, m) {
	  var i = b[n];
	  b[n] = b[m];
	  b[m] = i;
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length;
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1);
	  }
	  return this
	};

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length;
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3);
	    swap(this, i + 1, i + 2);
	  }
	  return this
	};

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length;
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7);
	    swap(this, i + 1, i + 6);
	    swap(this, i + 2, i + 5);
	    swap(this, i + 3, i + 4);
	  }
	  return this
	};

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0;
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	};

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	};

	Buffer.prototype.inspect = function inspect () {
	  var str = '';
	  var max = exports.INSPECT_MAX_BYTES;
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
	    if (this.length > max) str += ' ... ';
	  }
	  return '<Buffer ' + str + '>'
	};

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!Buffer.isBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0;
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0;
	  }
	  if (thisStart === undefined) {
	    thisStart = 0;
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length;
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0;
	  end >>>= 0;
	  thisStart >>>= 0;
	  thisEnd >>>= 0;

	  if (this === target) return 0

	  var x = thisEnd - thisStart;
	  var y = end - start;
	  var len = Math.min(x, y);

	  var thisCopy = this.slice(thisStart, thisEnd);
	  var targetCopy = target.slice(start, end);

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i];
	      y = targetCopy[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset;
	    byteOffset = 0;
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff;
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000;
	  }
	  byteOffset = +byteOffset;  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1);
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1;
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0;
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding);
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (Buffer.isBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF; // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1;
	  var arrLength = arr.length;
	  var valLength = val.length;

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase();
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2;
	      arrLength /= 2;
	      valLength /= 2;
	      byteOffset /= 2;
	    }
	  }

	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i;
	  if (dir) {
	    var foundIndex = -1;
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i;
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex;
	        foundIndex = -1;
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true;
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false;
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	};

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	};

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	};

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0;
	  var remaining = buf.length - offset;
	  if (!length) {
	    length = remaining;
	  } else {
	    length = Number(length);
	    if (length > remaining) {
	      length = remaining;
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length;
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2;
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16);
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed;
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8';
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset;
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0;
	    if (isFinite(length)) {
	      length = length | 0;
	      if (encoding === undefined) encoding = 'utf8';
	    } else {
	      encoding = length;
	      length = undefined;
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset;
	  if (length === undefined || length > remaining) length = remaining;

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8';

	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	};

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	};

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64Js.fromByteArray(buf)
	  } else {
	    return base64Js.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end);
	  var res = [];

	  var i = start;
	  while (i < end) {
	    var firstByte = buf[i];
	    var codePoint = null;
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1;

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint;

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte;
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1];
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          fourthByte = buf[i + 3];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint;
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD;
	      bytesPerSequence = 1;
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000;
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
	      codePoint = 0xDC00 | codePoint & 0x3FF;
	    }

	    res.push(codePoint);
	    i += bytesPerSequence;
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000;

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length;
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = '';
	  var i = 0;
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    );
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F);
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i]);
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length;

	  if (!start || start < 0) start = 0;
	  if (!end || end < 0 || end > len) end = len;

	  var out = '';
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i]);
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end);
	  var res = '';
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length;
	  start = ~~start;
	  end = end === undefined ? len : ~~end;

	  if (start < 0) {
	    start += len;
	    if (start < 0) start = 0;
	  } else if (start > len) {
	    start = len;
	  }

	  if (end < 0) {
	    end += len;
	    if (end < 0) end = 0;
	  } else if (end > len) {
	    end = len;
	  }

	  if (end < start) end = start;

	  var newBuf;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end);
	    newBuf.__proto__ = Buffer.prototype;
	  } else {
	    var sliceLen = end - start;
	    newBuf = new Buffer(sliceLen, undefined);
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start];
	    }
	  }

	  return newBuf
	};

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length);
	  }

	  var val = this[offset + --byteLength];
	  var mul = 1;
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  return this[offset]
	};

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] | (this[offset + 1] << 8)
	};

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return (this[offset] << 8) | this[offset + 1]
	};

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	};

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	};

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var i = byteLength;
	  var mul = 1;
	  var val = this[offset + --i];
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	};

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset] | (this[offset + 1] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset + 1] | (this[offset] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	};

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	};

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return ieee754.read(this, offset, true, 23, 4)
	};

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return ieee754.read(this, offset, false, 23, 4)
	};

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return ieee754.read(this, offset, true, 52, 8)
	};

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return ieee754.read(this, offset, false, 52, 8)
	};

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var mul = 1;
	  var i = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8;
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 1] = (value >>> 8);
	    this[offset] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = 0;
	  var mul = 1;
	  var sub = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  var sub = 0;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  if (value < 0) value = 0xff + value + 1;
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 3] = (value >>> 24);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (value < 0) value = 0xffffffff + value + 1;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4);
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4);
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	};

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8);
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8);
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	};

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (targetStart >= target.length) targetStart = target.length;
	  if (!targetStart) targetStart = 0;
	  if (end > 0 && end < start) end = start;

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length;
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start;
	  }

	  var len = end - start;
	  var i;

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    );
	  }

	  return len
	};

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start;
	      start = 0;
	      end = this.length;
	    } else if (typeof end === 'string') {
	      encoding = end;
	      end = this.length;
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0);
	      if (code < 256) {
	        val = code;
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255;
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0;
	  end = end === undefined ? this.length : end >>> 0;

	  if (!val) val = 0;

	  var i;
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val;
	    }
	  } else {
	    var bytes = Buffer.isBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString());
	    var len = bytes.length;
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len];
	    }
	  }

	  return this
	};

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '=';
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity;
	  var codePoint;
	  var length = string.length;
	  var leadSurrogate = null;
	  var bytes = [];

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i);

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint;

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	        leadSurrogate = codePoint;
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	    }

	    leadSurrogate = null;

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint);
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF);
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo;
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i);
	    hi = c >> 8;
	    lo = c % 256;
	    byteArray.push(lo);
	    byteArray.push(hi);
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64Js.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i];
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}
	});

	var bn$1 = createCommonjsModule$1(function (module) {
	(function (module, exports) {

	  // Utils
	  function assert (val, msg) {
	    if (!val) throw new Error(msg || 'Assertion failed');
	  }

	  // Could use `inherits` module, but don't want to move from single file
	  // architecture yet.
	  function inherits (ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function () {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  }

	  // BN

	  function BN (number, base, endian) {
	    if (BN.isBN(number)) {
	      return number;
	    }

	    this.negative = 0;
	    this.words = null;
	    this.length = 0;

	    // Reduction context
	    this.red = null;

	    if (number !== null) {
	      if (base === 'le' || base === 'be') {
	        endian = base;
	        base = 10;
	      }

	      this._init(number || 0, base || 10, endian || 'be');
	    }
	  }
	  if (typeof module === 'object') {
	    module.exports = BN;
	  } else {
	    exports.BN = BN;
	  }

	  BN.BN = BN;
	  BN.wordSize = 26;

	  var Buffer;
	  try {
	    if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
	      Buffer = window.Buffer;
	    } else {
	      Buffer = buffer.Buffer;
	    }
	  } catch (e) {
	  }

	  BN.isBN = function isBN (num) {
	    if (num instanceof BN) {
	      return true;
	    }

	    return num !== null && typeof num === 'object' &&
	      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
	  };

	  BN.max = function max (left, right) {
	    if (left.cmp(right) > 0) return left;
	    return right;
	  };

	  BN.min = function min (left, right) {
	    if (left.cmp(right) < 0) return left;
	    return right;
	  };

	  BN.prototype._init = function init (number, base, endian) {
	    if (typeof number === 'number') {
	      return this._initNumber(number, base, endian);
	    }

	    if (typeof number === 'object') {
	      return this._initArray(number, base, endian);
	    }

	    if (base === 'hex') {
	      base = 16;
	    }
	    assert(base === (base | 0) && base >= 2 && base <= 36);

	    number = number.toString().replace(/\s+/g, '');
	    var start = 0;
	    if (number[0] === '-') {
	      start++;
	      this.negative = 1;
	    }

	    if (start < number.length) {
	      if (base === 16) {
	        this._parseHex(number, start, endian);
	      } else {
	        this._parseBase(number, base, start);
	        if (endian === 'le') {
	          this._initArray(this.toArray(), base, endian);
	        }
	      }
	    }
	  };

	  BN.prototype._initNumber = function _initNumber (number, base, endian) {
	    if (number < 0) {
	      this.negative = 1;
	      number = -number;
	    }
	    if (number < 0x4000000) {
	      this.words = [number & 0x3ffffff];
	      this.length = 1;
	    } else if (number < 0x10000000000000) {
	      this.words = [
	        number & 0x3ffffff,
	        (number / 0x4000000) & 0x3ffffff
	      ];
	      this.length = 2;
	    } else {
	      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
	      this.words = [
	        number & 0x3ffffff,
	        (number / 0x4000000) & 0x3ffffff,
	        1
	      ];
	      this.length = 3;
	    }

	    if (endian !== 'le') return;

	    // Reverse the bytes
	    this._initArray(this.toArray(), base, endian);
	  };

	  BN.prototype._initArray = function _initArray (number, base, endian) {
	    // Perhaps a Uint8Array
	    assert(typeof number.length === 'number');
	    if (number.length <= 0) {
	      this.words = [0];
	      this.length = 1;
	      return this;
	    }

	    this.length = Math.ceil(number.length / 3);
	    this.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      this.words[i] = 0;
	    }

	    var j, w;
	    var off = 0;
	    if (endian === 'be') {
	      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
	        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
	        this.words[j] |= (w << off) & 0x3ffffff;
	        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
	        off += 24;
	        if (off >= 26) {
	          off -= 26;
	          j++;
	        }
	      }
	    } else if (endian === 'le') {
	      for (i = 0, j = 0; i < number.length; i += 3) {
	        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
	        this.words[j] |= (w << off) & 0x3ffffff;
	        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
	        off += 24;
	        if (off >= 26) {
	          off -= 26;
	          j++;
	        }
	      }
	    }
	    return this._strip();
	  };

	  function parseHex4Bits (string, index) {
	    var c = string.charCodeAt(index);
	    // '0' - '9'
	    if (c >= 48 && c <= 57) {
	      return c - 48;
	    // 'A' - 'F'
	    } else if (c >= 65 && c <= 70) {
	      return c - 55;
	    // 'a' - 'f'
	    } else if (c >= 97 && c <= 102) {
	      return c - 87;
	    } else {
	      assert(false, 'Invalid character in ' + string);
	    }
	  }

	  function parseHexByte (string, lowerBound, index) {
	    var r = parseHex4Bits(string, index);
	    if (index - 1 >= lowerBound) {
	      r |= parseHex4Bits(string, index - 1) << 4;
	    }
	    return r;
	  }

	  BN.prototype._parseHex = function _parseHex (number, start, endian) {
	    // Create possibly bigger array to ensure that it fits the number
	    this.length = Math.ceil((number.length - start) / 6);
	    this.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      this.words[i] = 0;
	    }

	    // 24-bits chunks
	    var off = 0;
	    var j = 0;

	    var w;
	    if (endian === 'be') {
	      for (i = number.length - 1; i >= start; i -= 2) {
	        w = parseHexByte(number, start, i) << off;
	        this.words[j] |= w & 0x3ffffff;
	        if (off >= 18) {
	          off -= 18;
	          j += 1;
	          this.words[j] |= w >>> 26;
	        } else {
	          off += 8;
	        }
	      }
	    } else {
	      var parseLength = number.length - start;
	      for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
	        w = parseHexByte(number, start, i) << off;
	        this.words[j] |= w & 0x3ffffff;
	        if (off >= 18) {
	          off -= 18;
	          j += 1;
	          this.words[j] |= w >>> 26;
	        } else {
	          off += 8;
	        }
	      }
	    }

	    this._strip();
	  };

	  function parseBase (str, start, end, mul) {
	    var r = 0;
	    var b = 0;
	    var len = Math.min(str.length, end);
	    for (var i = start; i < len; i++) {
	      var c = str.charCodeAt(i) - 48;

	      r *= mul;

	      // 'a'
	      if (c >= 49) {
	        b = c - 49 + 0xa;

	      // 'A'
	      } else if (c >= 17) {
	        b = c - 17 + 0xa;

	      // '0' - '9'
	      } else {
	        b = c;
	      }
	      assert(c >= 0 && b < mul, 'Invalid character');
	      r += b;
	    }
	    return r;
	  }

	  BN.prototype._parseBase = function _parseBase (number, base, start) {
	    // Initialize as zero
	    this.words = [0];
	    this.length = 1;

	    // Find length of limb in base
	    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
	      limbLen++;
	    }
	    limbLen--;
	    limbPow = (limbPow / base) | 0;

	    var total = number.length - start;
	    var mod = total % limbLen;
	    var end = Math.min(total, total - mod) + start;

	    var word = 0;
	    for (var i = start; i < end; i += limbLen) {
	      word = parseBase(number, i, i + limbLen, base);

	      this.imuln(limbPow);
	      if (this.words[0] + word < 0x4000000) {
	        this.words[0] += word;
	      } else {
	        this._iaddn(word);
	      }
	    }

	    if (mod !== 0) {
	      var pow = 1;
	      word = parseBase(number, i, number.length, base);

	      for (i = 0; i < mod; i++) {
	        pow *= base;
	      }

	      this.imuln(pow);
	      if (this.words[0] + word < 0x4000000) {
	        this.words[0] += word;
	      } else {
	        this._iaddn(word);
	      }
	    }

	    this._strip();
	  };

	  BN.prototype.copy = function copy (dest) {
	    dest.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      dest.words[i] = this.words[i];
	    }
	    dest.length = this.length;
	    dest.negative = this.negative;
	    dest.red = this.red;
	  };

	  function move (dest, src) {
	    dest.words = src.words;
	    dest.length = src.length;
	    dest.negative = src.negative;
	    dest.red = src.red;
	  }

	  BN.prototype._move = function _move (dest) {
	    move(dest, this);
	  };

	  BN.prototype.clone = function clone () {
	    var r = new BN(null);
	    this.copy(r);
	    return r;
	  };

	  BN.prototype._expand = function _expand (size) {
	    while (this.length < size) {
	      this.words[this.length++] = 0;
	    }
	    return this;
	  };

	  // Remove leading `0` from `this`
	  BN.prototype._strip = function strip () {
	    while (this.length > 1 && this.words[this.length - 1] === 0) {
	      this.length--;
	    }
	    return this._normSign();
	  };

	  BN.prototype._normSign = function _normSign () {
	    // -0 = 0
	    if (this.length === 1 && this.words[0] === 0) {
	      this.negative = 0;
	    }
	    return this;
	  };

	  // Check Symbol.for because not everywhere where Symbol defined
	  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
	  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
	    try {
	      BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
	    } catch (e) {
	      BN.prototype.inspect = inspect;
	    }
	  } else {
	    BN.prototype.inspect = inspect;
	  }

	  function inspect () {
	    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
	  }

	  /*

	  var zeros = [];
	  var groupSizes = [];
	  var groupBases = [];

	  var s = '';
	  var i = -1;
	  while (++i < BN.wordSize) {
	    zeros[i] = s;
	    s += '0';
	  }
	  groupSizes[0] = 0;
	  groupSizes[1] = 0;
	  groupBases[0] = 0;
	  groupBases[1] = 0;
	  var base = 2 - 1;
	  while (++base < 36 + 1) {
	    var groupSize = 0;
	    var groupBase = 1;
	    while (groupBase < (1 << BN.wordSize) / base) {
	      groupBase *= base;
	      groupSize += 1;
	    }
	    groupSizes[base] = groupSize;
	    groupBases[base] = groupBase;
	  }

	  */

	  var zeros = [
	    '',
	    '0',
	    '00',
	    '000',
	    '0000',
	    '00000',
	    '000000',
	    '0000000',
	    '00000000',
	    '000000000',
	    '0000000000',
	    '00000000000',
	    '000000000000',
	    '0000000000000',
	    '00000000000000',
	    '000000000000000',
	    '0000000000000000',
	    '00000000000000000',
	    '000000000000000000',
	    '0000000000000000000',
	    '00000000000000000000',
	    '000000000000000000000',
	    '0000000000000000000000',
	    '00000000000000000000000',
	    '000000000000000000000000',
	    '0000000000000000000000000'
	  ];

	  var groupSizes = [
	    0, 0,
	    25, 16, 12, 11, 10, 9, 8,
	    8, 7, 7, 7, 7, 6, 6,
	    6, 6, 6, 6, 6, 5, 5,
	    5, 5, 5, 5, 5, 5, 5,
	    5, 5, 5, 5, 5, 5, 5
	  ];

	  var groupBases = [
	    0, 0,
	    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
	    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
	    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
	    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
	    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
	  ];

	  BN.prototype.toString = function toString (base, padding) {
	    base = base || 10;
	    padding = padding | 0 || 1;

	    var out;
	    if (base === 16 || base === 'hex') {
	      out = '';
	      var off = 0;
	      var carry = 0;
	      for (var i = 0; i < this.length; i++) {
	        var w = this.words[i];
	        var word = (((w << off) | carry) & 0xffffff).toString(16);
	        carry = (w >>> (24 - off)) & 0xffffff;
	        off += 2;
	        if (off >= 26) {
	          off -= 26;
	          i--;
	        }
	        if (carry !== 0 || i !== this.length - 1) {
	          out = zeros[6 - word.length] + word + out;
	        } else {
	          out = word + out;
	        }
	      }
	      if (carry !== 0) {
	        out = carry.toString(16) + out;
	      }
	      while (out.length % padding !== 0) {
	        out = '0' + out;
	      }
	      if (this.negative !== 0) {
	        out = '-' + out;
	      }
	      return out;
	    }

	    if (base === (base | 0) && base >= 2 && base <= 36) {
	      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
	      var groupSize = groupSizes[base];
	      // var groupBase = Math.pow(base, groupSize);
	      var groupBase = groupBases[base];
	      out = '';
	      var c = this.clone();
	      c.negative = 0;
	      while (!c.isZero()) {
	        var r = c.modrn(groupBase).toString(base);
	        c = c.idivn(groupBase);

	        if (!c.isZero()) {
	          out = zeros[groupSize - r.length] + r + out;
	        } else {
	          out = r + out;
	        }
	      }
	      if (this.isZero()) {
	        out = '0' + out;
	      }
	      while (out.length % padding !== 0) {
	        out = '0' + out;
	      }
	      if (this.negative !== 0) {
	        out = '-' + out;
	      }
	      return out;
	    }

	    assert(false, 'Base should be between 2 and 36');
	  };

	  BN.prototype.toNumber = function toNumber () {
	    var ret = this.words[0];
	    if (this.length === 2) {
	      ret += this.words[1] * 0x4000000;
	    } else if (this.length === 3 && this.words[2] === 0x01) {
	      // NOTE: at this stage it is known that the top bit is set
	      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
	    } else if (this.length > 2) {
	      assert(false, 'Number can only safely store up to 53 bits');
	    }
	    return (this.negative !== 0) ? -ret : ret;
	  };

	  BN.prototype.toJSON = function toJSON () {
	    return this.toString(16, 2);
	  };

	  if (Buffer) {
	    BN.prototype.toBuffer = function toBuffer (endian, length) {
	      return this.toArrayLike(Buffer, endian, length);
	    };
	  }

	  BN.prototype.toArray = function toArray (endian, length) {
	    return this.toArrayLike(Array, endian, length);
	  };

	  var allocate = function allocate (ArrayType, size) {
	    if (ArrayType.allocUnsafe) {
	      return ArrayType.allocUnsafe(size);
	    }
	    return new ArrayType(size);
	  };

	  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
	    this._strip();

	    var byteLength = this.byteLength();
	    var reqLength = length || Math.max(1, byteLength);
	    assert(byteLength <= reqLength, 'byte array longer than desired length');
	    assert(reqLength > 0, 'Requested array length <= 0');

	    var res = allocate(ArrayType, reqLength);
	    var postfix = endian === 'le' ? 'LE' : 'BE';
	    this['_toArrayLike' + postfix](res, byteLength);
	    return res;
	  };

	  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
	    var position = 0;
	    var carry = 0;

	    for (var i = 0, shift = 0; i < this.length; i++) {
	      var word = (this.words[i] << shift) | carry;

	      res[position++] = word & 0xff;
	      if (position < res.length) {
	        res[position++] = (word >> 8) & 0xff;
	      }
	      if (position < res.length) {
	        res[position++] = (word >> 16) & 0xff;
	      }

	      if (shift === 6) {
	        if (position < res.length) {
	          res[position++] = (word >> 24) & 0xff;
	        }
	        carry = 0;
	        shift = 0;
	      } else {
	        carry = word >>> 24;
	        shift += 2;
	      }
	    }

	    if (position < res.length) {
	      res[position++] = carry;

	      while (position < res.length) {
	        res[position++] = 0;
	      }
	    }
	  };

	  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
	    var position = res.length - 1;
	    var carry = 0;

	    for (var i = 0, shift = 0; i < this.length; i++) {
	      var word = (this.words[i] << shift) | carry;

	      res[position--] = word & 0xff;
	      if (position >= 0) {
	        res[position--] = (word >> 8) & 0xff;
	      }
	      if (position >= 0) {
	        res[position--] = (word >> 16) & 0xff;
	      }

	      if (shift === 6) {
	        if (position >= 0) {
	          res[position--] = (word >> 24) & 0xff;
	        }
	        carry = 0;
	        shift = 0;
	      } else {
	        carry = word >>> 24;
	        shift += 2;
	      }
	    }

	    if (position >= 0) {
	      res[position--] = carry;

	      while (position >= 0) {
	        res[position--] = 0;
	      }
	    }
	  };

	  if (Math.clz32) {
	    BN.prototype._countBits = function _countBits (w) {
	      return 32 - Math.clz32(w);
	    };
	  } else {
	    BN.prototype._countBits = function _countBits (w) {
	      var t = w;
	      var r = 0;
	      if (t >= 0x1000) {
	        r += 13;
	        t >>>= 13;
	      }
	      if (t >= 0x40) {
	        r += 7;
	        t >>>= 7;
	      }
	      if (t >= 0x8) {
	        r += 4;
	        t >>>= 4;
	      }
	      if (t >= 0x02) {
	        r += 2;
	        t >>>= 2;
	      }
	      return r + t;
	    };
	  }

	  BN.prototype._zeroBits = function _zeroBits (w) {
	    // Short-cut
	    if (w === 0) return 26;

	    var t = w;
	    var r = 0;
	    if ((t & 0x1fff) === 0) {
	      r += 13;
	      t >>>= 13;
	    }
	    if ((t & 0x7f) === 0) {
	      r += 7;
	      t >>>= 7;
	    }
	    if ((t & 0xf) === 0) {
	      r += 4;
	      t >>>= 4;
	    }
	    if ((t & 0x3) === 0) {
	      r += 2;
	      t >>>= 2;
	    }
	    if ((t & 0x1) === 0) {
	      r++;
	    }
	    return r;
	  };

	  // Return number of used bits in a BN
	  BN.prototype.bitLength = function bitLength () {
	    var w = this.words[this.length - 1];
	    var hi = this._countBits(w);
	    return (this.length - 1) * 26 + hi;
	  };

	  function toBitArray (num) {
	    var w = new Array(num.bitLength());

	    for (var bit = 0; bit < w.length; bit++) {
	      var off = (bit / 26) | 0;
	      var wbit = bit % 26;

	      w[bit] = (num.words[off] >>> wbit) & 0x01;
	    }

	    return w;
	  }

	  // Number of trailing zero bits
	  BN.prototype.zeroBits = function zeroBits () {
	    if (this.isZero()) return 0;

	    var r = 0;
	    for (var i = 0; i < this.length; i++) {
	      var b = this._zeroBits(this.words[i]);
	      r += b;
	      if (b !== 26) break;
	    }
	    return r;
	  };

	  BN.prototype.byteLength = function byteLength () {
	    return Math.ceil(this.bitLength() / 8);
	  };

	  BN.prototype.toTwos = function toTwos (width) {
	    if (this.negative !== 0) {
	      return this.abs().inotn(width).iaddn(1);
	    }
	    return this.clone();
	  };

	  BN.prototype.fromTwos = function fromTwos (width) {
	    if (this.testn(width - 1)) {
	      return this.notn(width).iaddn(1).ineg();
	    }
	    return this.clone();
	  };

	  BN.prototype.isNeg = function isNeg () {
	    return this.negative !== 0;
	  };

	  // Return negative clone of `this`
	  BN.prototype.neg = function neg () {
	    return this.clone().ineg();
	  };

	  BN.prototype.ineg = function ineg () {
	    if (!this.isZero()) {
	      this.negative ^= 1;
	    }

	    return this;
	  };

	  // Or `num` with `this` in-place
	  BN.prototype.iuor = function iuor (num) {
	    while (this.length < num.length) {
	      this.words[this.length++] = 0;
	    }

	    for (var i = 0; i < num.length; i++) {
	      this.words[i] = this.words[i] | num.words[i];
	    }

	    return this._strip();
	  };

	  BN.prototype.ior = function ior (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuor(num);
	  };

	  // Or `num` with `this`
	  BN.prototype.or = function or (num) {
	    if (this.length > num.length) return this.clone().ior(num);
	    return num.clone().ior(this);
	  };

	  BN.prototype.uor = function uor (num) {
	    if (this.length > num.length) return this.clone().iuor(num);
	    return num.clone().iuor(this);
	  };

	  // And `num` with `this` in-place
	  BN.prototype.iuand = function iuand (num) {
	    // b = min-length(num, this)
	    var b;
	    if (this.length > num.length) {
	      b = num;
	    } else {
	      b = this;
	    }

	    for (var i = 0; i < b.length; i++) {
	      this.words[i] = this.words[i] & num.words[i];
	    }

	    this.length = b.length;

	    return this._strip();
	  };

	  BN.prototype.iand = function iand (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuand(num);
	  };

	  // And `num` with `this`
	  BN.prototype.and = function and (num) {
	    if (this.length > num.length) return this.clone().iand(num);
	    return num.clone().iand(this);
	  };

	  BN.prototype.uand = function uand (num) {
	    if (this.length > num.length) return this.clone().iuand(num);
	    return num.clone().iuand(this);
	  };

	  // Xor `num` with `this` in-place
	  BN.prototype.iuxor = function iuxor (num) {
	    // a.length > b.length
	    var a;
	    var b;
	    if (this.length > num.length) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    for (var i = 0; i < b.length; i++) {
	      this.words[i] = a.words[i] ^ b.words[i];
	    }

	    if (this !== a) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    this.length = a.length;

	    return this._strip();
	  };

	  BN.prototype.ixor = function ixor (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuxor(num);
	  };

	  // Xor `num` with `this`
	  BN.prototype.xor = function xor (num) {
	    if (this.length > num.length) return this.clone().ixor(num);
	    return num.clone().ixor(this);
	  };

	  BN.prototype.uxor = function uxor (num) {
	    if (this.length > num.length) return this.clone().iuxor(num);
	    return num.clone().iuxor(this);
	  };

	  // Not ``this`` with ``width`` bitwidth
	  BN.prototype.inotn = function inotn (width) {
	    assert(typeof width === 'number' && width >= 0);

	    var bytesNeeded = Math.ceil(width / 26) | 0;
	    var bitsLeft = width % 26;

	    // Extend the buffer with leading zeroes
	    this._expand(bytesNeeded);

	    if (bitsLeft > 0) {
	      bytesNeeded--;
	    }

	    // Handle complete words
	    for (var i = 0; i < bytesNeeded; i++) {
	      this.words[i] = ~this.words[i] & 0x3ffffff;
	    }

	    // Handle the residue
	    if (bitsLeft > 0) {
	      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
	    }

	    // And remove leading zeroes
	    return this._strip();
	  };

	  BN.prototype.notn = function notn (width) {
	    return this.clone().inotn(width);
	  };

	  // Set `bit` of `this`
	  BN.prototype.setn = function setn (bit, val) {
	    assert(typeof bit === 'number' && bit >= 0);

	    var off = (bit / 26) | 0;
	    var wbit = bit % 26;

	    this._expand(off + 1);

	    if (val) {
	      this.words[off] = this.words[off] | (1 << wbit);
	    } else {
	      this.words[off] = this.words[off] & ~(1 << wbit);
	    }

	    return this._strip();
	  };

	  // Add `num` to `this` in-place
	  BN.prototype.iadd = function iadd (num) {
	    var r;

	    // negative + positive
	    if (this.negative !== 0 && num.negative === 0) {
	      this.negative = 0;
	      r = this.isub(num);
	      this.negative ^= 1;
	      return this._normSign();

	    // positive + negative
	    } else if (this.negative === 0 && num.negative !== 0) {
	      num.negative = 0;
	      r = this.isub(num);
	      num.negative = 1;
	      return r._normSign();
	    }

	    // a.length > b.length
	    var a, b;
	    if (this.length > num.length) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    var carry = 0;
	    for (var i = 0; i < b.length; i++) {
	      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
	      this.words[i] = r & 0x3ffffff;
	      carry = r >>> 26;
	    }
	    for (; carry !== 0 && i < a.length; i++) {
	      r = (a.words[i] | 0) + carry;
	      this.words[i] = r & 0x3ffffff;
	      carry = r >>> 26;
	    }

	    this.length = a.length;
	    if (carry !== 0) {
	      this.words[this.length] = carry;
	      this.length++;
	    // Copy the rest of the words
	    } else if (a !== this) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    return this;
	  };

	  // Add `num` to `this`
	  BN.prototype.add = function add (num) {
	    var res;
	    if (num.negative !== 0 && this.negative === 0) {
	      num.negative = 0;
	      res = this.sub(num);
	      num.negative ^= 1;
	      return res;
	    } else if (num.negative === 0 && this.negative !== 0) {
	      this.negative = 0;
	      res = num.sub(this);
	      this.negative = 1;
	      return res;
	    }

	    if (this.length > num.length) return this.clone().iadd(num);

	    return num.clone().iadd(this);
	  };

	  // Subtract `num` from `this` in-place
	  BN.prototype.isub = function isub (num) {
	    // this - (-num) = this + num
	    if (num.negative !== 0) {
	      num.negative = 0;
	      var r = this.iadd(num);
	      num.negative = 1;
	      return r._normSign();

	    // -this - num = -(this + num)
	    } else if (this.negative !== 0) {
	      this.negative = 0;
	      this.iadd(num);
	      this.negative = 1;
	      return this._normSign();
	    }

	    // At this point both numbers are positive
	    var cmp = this.cmp(num);

	    // Optimization - zeroify
	    if (cmp === 0) {
	      this.negative = 0;
	      this.length = 1;
	      this.words[0] = 0;
	      return this;
	    }

	    // a > b
	    var a, b;
	    if (cmp > 0) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    var carry = 0;
	    for (var i = 0; i < b.length; i++) {
	      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
	      carry = r >> 26;
	      this.words[i] = r & 0x3ffffff;
	    }
	    for (; carry !== 0 && i < a.length; i++) {
	      r = (a.words[i] | 0) + carry;
	      carry = r >> 26;
	      this.words[i] = r & 0x3ffffff;
	    }

	    // Copy rest of the words
	    if (carry === 0 && i < a.length && a !== this) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    this.length = Math.max(this.length, i);

	    if (a !== this) {
	      this.negative = 1;
	    }

	    return this._strip();
	  };

	  // Subtract `num` from `this`
	  BN.prototype.sub = function sub (num) {
	    return this.clone().isub(num);
	  };

	  function smallMulTo (self, num, out) {
	    out.negative = num.negative ^ self.negative;
	    var len = (self.length + num.length) | 0;
	    out.length = len;
	    len = (len - 1) | 0;

	    // Peel one iteration (compiler can't do it, because of code complexity)
	    var a = self.words[0] | 0;
	    var b = num.words[0] | 0;
	    var r = a * b;

	    var lo = r & 0x3ffffff;
	    var carry = (r / 0x4000000) | 0;
	    out.words[0] = lo;

	    for (var k = 1; k < len; k++) {
	      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
	      // note that ncarry could be >= 0x3ffffff
	      var ncarry = carry >>> 26;
	      var rword = carry & 0x3ffffff;
	      var maxJ = Math.min(k, num.length - 1);
	      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
	        var i = (k - j) | 0;
	        a = self.words[i] | 0;
	        b = num.words[j] | 0;
	        r = a * b + rword;
	        ncarry += (r / 0x4000000) | 0;
	        rword = r & 0x3ffffff;
	      }
	      out.words[k] = rword | 0;
	      carry = ncarry | 0;
	    }
	    if (carry !== 0) {
	      out.words[k] = carry | 0;
	    } else {
	      out.length--;
	    }

	    return out._strip();
	  }

	  // TODO(indutny): it may be reasonable to omit it for users who don't need
	  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
	  // multiplication (like elliptic secp256k1).
	  var comb10MulTo = function comb10MulTo (self, num, out) {
	    var a = self.words;
	    var b = num.words;
	    var o = out.words;
	    var c = 0;
	    var lo;
	    var mid;
	    var hi;
	    var a0 = a[0] | 0;
	    var al0 = a0 & 0x1fff;
	    var ah0 = a0 >>> 13;
	    var a1 = a[1] | 0;
	    var al1 = a1 & 0x1fff;
	    var ah1 = a1 >>> 13;
	    var a2 = a[2] | 0;
	    var al2 = a2 & 0x1fff;
	    var ah2 = a2 >>> 13;
	    var a3 = a[3] | 0;
	    var al3 = a3 & 0x1fff;
	    var ah3 = a3 >>> 13;
	    var a4 = a[4] | 0;
	    var al4 = a4 & 0x1fff;
	    var ah4 = a4 >>> 13;
	    var a5 = a[5] | 0;
	    var al5 = a5 & 0x1fff;
	    var ah5 = a5 >>> 13;
	    var a6 = a[6] | 0;
	    var al6 = a6 & 0x1fff;
	    var ah6 = a6 >>> 13;
	    var a7 = a[7] | 0;
	    var al7 = a7 & 0x1fff;
	    var ah7 = a7 >>> 13;
	    var a8 = a[8] | 0;
	    var al8 = a8 & 0x1fff;
	    var ah8 = a8 >>> 13;
	    var a9 = a[9] | 0;
	    var al9 = a9 & 0x1fff;
	    var ah9 = a9 >>> 13;
	    var b0 = b[0] | 0;
	    var bl0 = b0 & 0x1fff;
	    var bh0 = b0 >>> 13;
	    var b1 = b[1] | 0;
	    var bl1 = b1 & 0x1fff;
	    var bh1 = b1 >>> 13;
	    var b2 = b[2] | 0;
	    var bl2 = b2 & 0x1fff;
	    var bh2 = b2 >>> 13;
	    var b3 = b[3] | 0;
	    var bl3 = b3 & 0x1fff;
	    var bh3 = b3 >>> 13;
	    var b4 = b[4] | 0;
	    var bl4 = b4 & 0x1fff;
	    var bh4 = b4 >>> 13;
	    var b5 = b[5] | 0;
	    var bl5 = b5 & 0x1fff;
	    var bh5 = b5 >>> 13;
	    var b6 = b[6] | 0;
	    var bl6 = b6 & 0x1fff;
	    var bh6 = b6 >>> 13;
	    var b7 = b[7] | 0;
	    var bl7 = b7 & 0x1fff;
	    var bh7 = b7 >>> 13;
	    var b8 = b[8] | 0;
	    var bl8 = b8 & 0x1fff;
	    var bh8 = b8 >>> 13;
	    var b9 = b[9] | 0;
	    var bl9 = b9 & 0x1fff;
	    var bh9 = b9 >>> 13;

	    out.negative = self.negative ^ num.negative;
	    out.length = 19;
	    /* k = 0 */
	    lo = Math.imul(al0, bl0);
	    mid = Math.imul(al0, bh0);
	    mid = (mid + Math.imul(ah0, bl0)) | 0;
	    hi = Math.imul(ah0, bh0);
	    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
	    w0 &= 0x3ffffff;
	    /* k = 1 */
	    lo = Math.imul(al1, bl0);
	    mid = Math.imul(al1, bh0);
	    mid = (mid + Math.imul(ah1, bl0)) | 0;
	    hi = Math.imul(ah1, bh0);
	    lo = (lo + Math.imul(al0, bl1)) | 0;
	    mid = (mid + Math.imul(al0, bh1)) | 0;
	    mid = (mid + Math.imul(ah0, bl1)) | 0;
	    hi = (hi + Math.imul(ah0, bh1)) | 0;
	    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
	    w1 &= 0x3ffffff;
	    /* k = 2 */
	    lo = Math.imul(al2, bl0);
	    mid = Math.imul(al2, bh0);
	    mid = (mid + Math.imul(ah2, bl0)) | 0;
	    hi = Math.imul(ah2, bh0);
	    lo = (lo + Math.imul(al1, bl1)) | 0;
	    mid = (mid + Math.imul(al1, bh1)) | 0;
	    mid = (mid + Math.imul(ah1, bl1)) | 0;
	    hi = (hi + Math.imul(ah1, bh1)) | 0;
	    lo = (lo + Math.imul(al0, bl2)) | 0;
	    mid = (mid + Math.imul(al0, bh2)) | 0;
	    mid = (mid + Math.imul(ah0, bl2)) | 0;
	    hi = (hi + Math.imul(ah0, bh2)) | 0;
	    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
	    w2 &= 0x3ffffff;
	    /* k = 3 */
	    lo = Math.imul(al3, bl0);
	    mid = Math.imul(al3, bh0);
	    mid = (mid + Math.imul(ah3, bl0)) | 0;
	    hi = Math.imul(ah3, bh0);
	    lo = (lo + Math.imul(al2, bl1)) | 0;
	    mid = (mid + Math.imul(al2, bh1)) | 0;
	    mid = (mid + Math.imul(ah2, bl1)) | 0;
	    hi = (hi + Math.imul(ah2, bh1)) | 0;
	    lo = (lo + Math.imul(al1, bl2)) | 0;
	    mid = (mid + Math.imul(al1, bh2)) | 0;
	    mid = (mid + Math.imul(ah1, bl2)) | 0;
	    hi = (hi + Math.imul(ah1, bh2)) | 0;
	    lo = (lo + Math.imul(al0, bl3)) | 0;
	    mid = (mid + Math.imul(al0, bh3)) | 0;
	    mid = (mid + Math.imul(ah0, bl3)) | 0;
	    hi = (hi + Math.imul(ah0, bh3)) | 0;
	    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
	    w3 &= 0x3ffffff;
	    /* k = 4 */
	    lo = Math.imul(al4, bl0);
	    mid = Math.imul(al4, bh0);
	    mid = (mid + Math.imul(ah4, bl0)) | 0;
	    hi = Math.imul(ah4, bh0);
	    lo = (lo + Math.imul(al3, bl1)) | 0;
	    mid = (mid + Math.imul(al3, bh1)) | 0;
	    mid = (mid + Math.imul(ah3, bl1)) | 0;
	    hi = (hi + Math.imul(ah3, bh1)) | 0;
	    lo = (lo + Math.imul(al2, bl2)) | 0;
	    mid = (mid + Math.imul(al2, bh2)) | 0;
	    mid = (mid + Math.imul(ah2, bl2)) | 0;
	    hi = (hi + Math.imul(ah2, bh2)) | 0;
	    lo = (lo + Math.imul(al1, bl3)) | 0;
	    mid = (mid + Math.imul(al1, bh3)) | 0;
	    mid = (mid + Math.imul(ah1, bl3)) | 0;
	    hi = (hi + Math.imul(ah1, bh3)) | 0;
	    lo = (lo + Math.imul(al0, bl4)) | 0;
	    mid = (mid + Math.imul(al0, bh4)) | 0;
	    mid = (mid + Math.imul(ah0, bl4)) | 0;
	    hi = (hi + Math.imul(ah0, bh4)) | 0;
	    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
	    w4 &= 0x3ffffff;
	    /* k = 5 */
	    lo = Math.imul(al5, bl0);
	    mid = Math.imul(al5, bh0);
	    mid = (mid + Math.imul(ah5, bl0)) | 0;
	    hi = Math.imul(ah5, bh0);
	    lo = (lo + Math.imul(al4, bl1)) | 0;
	    mid = (mid + Math.imul(al4, bh1)) | 0;
	    mid = (mid + Math.imul(ah4, bl1)) | 0;
	    hi = (hi + Math.imul(ah4, bh1)) | 0;
	    lo = (lo + Math.imul(al3, bl2)) | 0;
	    mid = (mid + Math.imul(al3, bh2)) | 0;
	    mid = (mid + Math.imul(ah3, bl2)) | 0;
	    hi = (hi + Math.imul(ah3, bh2)) | 0;
	    lo = (lo + Math.imul(al2, bl3)) | 0;
	    mid = (mid + Math.imul(al2, bh3)) | 0;
	    mid = (mid + Math.imul(ah2, bl3)) | 0;
	    hi = (hi + Math.imul(ah2, bh3)) | 0;
	    lo = (lo + Math.imul(al1, bl4)) | 0;
	    mid = (mid + Math.imul(al1, bh4)) | 0;
	    mid = (mid + Math.imul(ah1, bl4)) | 0;
	    hi = (hi + Math.imul(ah1, bh4)) | 0;
	    lo = (lo + Math.imul(al0, bl5)) | 0;
	    mid = (mid + Math.imul(al0, bh5)) | 0;
	    mid = (mid + Math.imul(ah0, bl5)) | 0;
	    hi = (hi + Math.imul(ah0, bh5)) | 0;
	    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
	    w5 &= 0x3ffffff;
	    /* k = 6 */
	    lo = Math.imul(al6, bl0);
	    mid = Math.imul(al6, bh0);
	    mid = (mid + Math.imul(ah6, bl0)) | 0;
	    hi = Math.imul(ah6, bh0);
	    lo = (lo + Math.imul(al5, bl1)) | 0;
	    mid = (mid + Math.imul(al5, bh1)) | 0;
	    mid = (mid + Math.imul(ah5, bl1)) | 0;
	    hi = (hi + Math.imul(ah5, bh1)) | 0;
	    lo = (lo + Math.imul(al4, bl2)) | 0;
	    mid = (mid + Math.imul(al4, bh2)) | 0;
	    mid = (mid + Math.imul(ah4, bl2)) | 0;
	    hi = (hi + Math.imul(ah4, bh2)) | 0;
	    lo = (lo + Math.imul(al3, bl3)) | 0;
	    mid = (mid + Math.imul(al3, bh3)) | 0;
	    mid = (mid + Math.imul(ah3, bl3)) | 0;
	    hi = (hi + Math.imul(ah3, bh3)) | 0;
	    lo = (lo + Math.imul(al2, bl4)) | 0;
	    mid = (mid + Math.imul(al2, bh4)) | 0;
	    mid = (mid + Math.imul(ah2, bl4)) | 0;
	    hi = (hi + Math.imul(ah2, bh4)) | 0;
	    lo = (lo + Math.imul(al1, bl5)) | 0;
	    mid = (mid + Math.imul(al1, bh5)) | 0;
	    mid = (mid + Math.imul(ah1, bl5)) | 0;
	    hi = (hi + Math.imul(ah1, bh5)) | 0;
	    lo = (lo + Math.imul(al0, bl6)) | 0;
	    mid = (mid + Math.imul(al0, bh6)) | 0;
	    mid = (mid + Math.imul(ah0, bl6)) | 0;
	    hi = (hi + Math.imul(ah0, bh6)) | 0;
	    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
	    w6 &= 0x3ffffff;
	    /* k = 7 */
	    lo = Math.imul(al7, bl0);
	    mid = Math.imul(al7, bh0);
	    mid = (mid + Math.imul(ah7, bl0)) | 0;
	    hi = Math.imul(ah7, bh0);
	    lo = (lo + Math.imul(al6, bl1)) | 0;
	    mid = (mid + Math.imul(al6, bh1)) | 0;
	    mid = (mid + Math.imul(ah6, bl1)) | 0;
	    hi = (hi + Math.imul(ah6, bh1)) | 0;
	    lo = (lo + Math.imul(al5, bl2)) | 0;
	    mid = (mid + Math.imul(al5, bh2)) | 0;
	    mid = (mid + Math.imul(ah5, bl2)) | 0;
	    hi = (hi + Math.imul(ah5, bh2)) | 0;
	    lo = (lo + Math.imul(al4, bl3)) | 0;
	    mid = (mid + Math.imul(al4, bh3)) | 0;
	    mid = (mid + Math.imul(ah4, bl3)) | 0;
	    hi = (hi + Math.imul(ah4, bh3)) | 0;
	    lo = (lo + Math.imul(al3, bl4)) | 0;
	    mid = (mid + Math.imul(al3, bh4)) | 0;
	    mid = (mid + Math.imul(ah3, bl4)) | 0;
	    hi = (hi + Math.imul(ah3, bh4)) | 0;
	    lo = (lo + Math.imul(al2, bl5)) | 0;
	    mid = (mid + Math.imul(al2, bh5)) | 0;
	    mid = (mid + Math.imul(ah2, bl5)) | 0;
	    hi = (hi + Math.imul(ah2, bh5)) | 0;
	    lo = (lo + Math.imul(al1, bl6)) | 0;
	    mid = (mid + Math.imul(al1, bh6)) | 0;
	    mid = (mid + Math.imul(ah1, bl6)) | 0;
	    hi = (hi + Math.imul(ah1, bh6)) | 0;
	    lo = (lo + Math.imul(al0, bl7)) | 0;
	    mid = (mid + Math.imul(al0, bh7)) | 0;
	    mid = (mid + Math.imul(ah0, bl7)) | 0;
	    hi = (hi + Math.imul(ah0, bh7)) | 0;
	    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
	    w7 &= 0x3ffffff;
	    /* k = 8 */
	    lo = Math.imul(al8, bl0);
	    mid = Math.imul(al8, bh0);
	    mid = (mid + Math.imul(ah8, bl0)) | 0;
	    hi = Math.imul(ah8, bh0);
	    lo = (lo + Math.imul(al7, bl1)) | 0;
	    mid = (mid + Math.imul(al7, bh1)) | 0;
	    mid = (mid + Math.imul(ah7, bl1)) | 0;
	    hi = (hi + Math.imul(ah7, bh1)) | 0;
	    lo = (lo + Math.imul(al6, bl2)) | 0;
	    mid = (mid + Math.imul(al6, bh2)) | 0;
	    mid = (mid + Math.imul(ah6, bl2)) | 0;
	    hi = (hi + Math.imul(ah6, bh2)) | 0;
	    lo = (lo + Math.imul(al5, bl3)) | 0;
	    mid = (mid + Math.imul(al5, bh3)) | 0;
	    mid = (mid + Math.imul(ah5, bl3)) | 0;
	    hi = (hi + Math.imul(ah5, bh3)) | 0;
	    lo = (lo + Math.imul(al4, bl4)) | 0;
	    mid = (mid + Math.imul(al4, bh4)) | 0;
	    mid = (mid + Math.imul(ah4, bl4)) | 0;
	    hi = (hi + Math.imul(ah4, bh4)) | 0;
	    lo = (lo + Math.imul(al3, bl5)) | 0;
	    mid = (mid + Math.imul(al3, bh5)) | 0;
	    mid = (mid + Math.imul(ah3, bl5)) | 0;
	    hi = (hi + Math.imul(ah3, bh5)) | 0;
	    lo = (lo + Math.imul(al2, bl6)) | 0;
	    mid = (mid + Math.imul(al2, bh6)) | 0;
	    mid = (mid + Math.imul(ah2, bl6)) | 0;
	    hi = (hi + Math.imul(ah2, bh6)) | 0;
	    lo = (lo + Math.imul(al1, bl7)) | 0;
	    mid = (mid + Math.imul(al1, bh7)) | 0;
	    mid = (mid + Math.imul(ah1, bl7)) | 0;
	    hi = (hi + Math.imul(ah1, bh7)) | 0;
	    lo = (lo + Math.imul(al0, bl8)) | 0;
	    mid = (mid + Math.imul(al0, bh8)) | 0;
	    mid = (mid + Math.imul(ah0, bl8)) | 0;
	    hi = (hi + Math.imul(ah0, bh8)) | 0;
	    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
	    w8 &= 0x3ffffff;
	    /* k = 9 */
	    lo = Math.imul(al9, bl0);
	    mid = Math.imul(al9, bh0);
	    mid = (mid + Math.imul(ah9, bl0)) | 0;
	    hi = Math.imul(ah9, bh0);
	    lo = (lo + Math.imul(al8, bl1)) | 0;
	    mid = (mid + Math.imul(al8, bh1)) | 0;
	    mid = (mid + Math.imul(ah8, bl1)) | 0;
	    hi = (hi + Math.imul(ah8, bh1)) | 0;
	    lo = (lo + Math.imul(al7, bl2)) | 0;
	    mid = (mid + Math.imul(al7, bh2)) | 0;
	    mid = (mid + Math.imul(ah7, bl2)) | 0;
	    hi = (hi + Math.imul(ah7, bh2)) | 0;
	    lo = (lo + Math.imul(al6, bl3)) | 0;
	    mid = (mid + Math.imul(al6, bh3)) | 0;
	    mid = (mid + Math.imul(ah6, bl3)) | 0;
	    hi = (hi + Math.imul(ah6, bh3)) | 0;
	    lo = (lo + Math.imul(al5, bl4)) | 0;
	    mid = (mid + Math.imul(al5, bh4)) | 0;
	    mid = (mid + Math.imul(ah5, bl4)) | 0;
	    hi = (hi + Math.imul(ah5, bh4)) | 0;
	    lo = (lo + Math.imul(al4, bl5)) | 0;
	    mid = (mid + Math.imul(al4, bh5)) | 0;
	    mid = (mid + Math.imul(ah4, bl5)) | 0;
	    hi = (hi + Math.imul(ah4, bh5)) | 0;
	    lo = (lo + Math.imul(al3, bl6)) | 0;
	    mid = (mid + Math.imul(al3, bh6)) | 0;
	    mid = (mid + Math.imul(ah3, bl6)) | 0;
	    hi = (hi + Math.imul(ah3, bh6)) | 0;
	    lo = (lo + Math.imul(al2, bl7)) | 0;
	    mid = (mid + Math.imul(al2, bh7)) | 0;
	    mid = (mid + Math.imul(ah2, bl7)) | 0;
	    hi = (hi + Math.imul(ah2, bh7)) | 0;
	    lo = (lo + Math.imul(al1, bl8)) | 0;
	    mid = (mid + Math.imul(al1, bh8)) | 0;
	    mid = (mid + Math.imul(ah1, bl8)) | 0;
	    hi = (hi + Math.imul(ah1, bh8)) | 0;
	    lo = (lo + Math.imul(al0, bl9)) | 0;
	    mid = (mid + Math.imul(al0, bh9)) | 0;
	    mid = (mid + Math.imul(ah0, bl9)) | 0;
	    hi = (hi + Math.imul(ah0, bh9)) | 0;
	    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
	    w9 &= 0x3ffffff;
	    /* k = 10 */
	    lo = Math.imul(al9, bl1);
	    mid = Math.imul(al9, bh1);
	    mid = (mid + Math.imul(ah9, bl1)) | 0;
	    hi = Math.imul(ah9, bh1);
	    lo = (lo + Math.imul(al8, bl2)) | 0;
	    mid = (mid + Math.imul(al8, bh2)) | 0;
	    mid = (mid + Math.imul(ah8, bl2)) | 0;
	    hi = (hi + Math.imul(ah8, bh2)) | 0;
	    lo = (lo + Math.imul(al7, bl3)) | 0;
	    mid = (mid + Math.imul(al7, bh3)) | 0;
	    mid = (mid + Math.imul(ah7, bl3)) | 0;
	    hi = (hi + Math.imul(ah7, bh3)) | 0;
	    lo = (lo + Math.imul(al6, bl4)) | 0;
	    mid = (mid + Math.imul(al6, bh4)) | 0;
	    mid = (mid + Math.imul(ah6, bl4)) | 0;
	    hi = (hi + Math.imul(ah6, bh4)) | 0;
	    lo = (lo + Math.imul(al5, bl5)) | 0;
	    mid = (mid + Math.imul(al5, bh5)) | 0;
	    mid = (mid + Math.imul(ah5, bl5)) | 0;
	    hi = (hi + Math.imul(ah5, bh5)) | 0;
	    lo = (lo + Math.imul(al4, bl6)) | 0;
	    mid = (mid + Math.imul(al4, bh6)) | 0;
	    mid = (mid + Math.imul(ah4, bl6)) | 0;
	    hi = (hi + Math.imul(ah4, bh6)) | 0;
	    lo = (lo + Math.imul(al3, bl7)) | 0;
	    mid = (mid + Math.imul(al3, bh7)) | 0;
	    mid = (mid + Math.imul(ah3, bl7)) | 0;
	    hi = (hi + Math.imul(ah3, bh7)) | 0;
	    lo = (lo + Math.imul(al2, bl8)) | 0;
	    mid = (mid + Math.imul(al2, bh8)) | 0;
	    mid = (mid + Math.imul(ah2, bl8)) | 0;
	    hi = (hi + Math.imul(ah2, bh8)) | 0;
	    lo = (lo + Math.imul(al1, bl9)) | 0;
	    mid = (mid + Math.imul(al1, bh9)) | 0;
	    mid = (mid + Math.imul(ah1, bl9)) | 0;
	    hi = (hi + Math.imul(ah1, bh9)) | 0;
	    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
	    w10 &= 0x3ffffff;
	    /* k = 11 */
	    lo = Math.imul(al9, bl2);
	    mid = Math.imul(al9, bh2);
	    mid = (mid + Math.imul(ah9, bl2)) | 0;
	    hi = Math.imul(ah9, bh2);
	    lo = (lo + Math.imul(al8, bl3)) | 0;
	    mid = (mid + Math.imul(al8, bh3)) | 0;
	    mid = (mid + Math.imul(ah8, bl3)) | 0;
	    hi = (hi + Math.imul(ah8, bh3)) | 0;
	    lo = (lo + Math.imul(al7, bl4)) | 0;
	    mid = (mid + Math.imul(al7, bh4)) | 0;
	    mid = (mid + Math.imul(ah7, bl4)) | 0;
	    hi = (hi + Math.imul(ah7, bh4)) | 0;
	    lo = (lo + Math.imul(al6, bl5)) | 0;
	    mid = (mid + Math.imul(al6, bh5)) | 0;
	    mid = (mid + Math.imul(ah6, bl5)) | 0;
	    hi = (hi + Math.imul(ah6, bh5)) | 0;
	    lo = (lo + Math.imul(al5, bl6)) | 0;
	    mid = (mid + Math.imul(al5, bh6)) | 0;
	    mid = (mid + Math.imul(ah5, bl6)) | 0;
	    hi = (hi + Math.imul(ah5, bh6)) | 0;
	    lo = (lo + Math.imul(al4, bl7)) | 0;
	    mid = (mid + Math.imul(al4, bh7)) | 0;
	    mid = (mid + Math.imul(ah4, bl7)) | 0;
	    hi = (hi + Math.imul(ah4, bh7)) | 0;
	    lo = (lo + Math.imul(al3, bl8)) | 0;
	    mid = (mid + Math.imul(al3, bh8)) | 0;
	    mid = (mid + Math.imul(ah3, bl8)) | 0;
	    hi = (hi + Math.imul(ah3, bh8)) | 0;
	    lo = (lo + Math.imul(al2, bl9)) | 0;
	    mid = (mid + Math.imul(al2, bh9)) | 0;
	    mid = (mid + Math.imul(ah2, bl9)) | 0;
	    hi = (hi + Math.imul(ah2, bh9)) | 0;
	    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
	    w11 &= 0x3ffffff;
	    /* k = 12 */
	    lo = Math.imul(al9, bl3);
	    mid = Math.imul(al9, bh3);
	    mid = (mid + Math.imul(ah9, bl3)) | 0;
	    hi = Math.imul(ah9, bh3);
	    lo = (lo + Math.imul(al8, bl4)) | 0;
	    mid = (mid + Math.imul(al8, bh4)) | 0;
	    mid = (mid + Math.imul(ah8, bl4)) | 0;
	    hi = (hi + Math.imul(ah8, bh4)) | 0;
	    lo = (lo + Math.imul(al7, bl5)) | 0;
	    mid = (mid + Math.imul(al7, bh5)) | 0;
	    mid = (mid + Math.imul(ah7, bl5)) | 0;
	    hi = (hi + Math.imul(ah7, bh5)) | 0;
	    lo = (lo + Math.imul(al6, bl6)) | 0;
	    mid = (mid + Math.imul(al6, bh6)) | 0;
	    mid = (mid + Math.imul(ah6, bl6)) | 0;
	    hi = (hi + Math.imul(ah6, bh6)) | 0;
	    lo = (lo + Math.imul(al5, bl7)) | 0;
	    mid = (mid + Math.imul(al5, bh7)) | 0;
	    mid = (mid + Math.imul(ah5, bl7)) | 0;
	    hi = (hi + Math.imul(ah5, bh7)) | 0;
	    lo = (lo + Math.imul(al4, bl8)) | 0;
	    mid = (mid + Math.imul(al4, bh8)) | 0;
	    mid = (mid + Math.imul(ah4, bl8)) | 0;
	    hi = (hi + Math.imul(ah4, bh8)) | 0;
	    lo = (lo + Math.imul(al3, bl9)) | 0;
	    mid = (mid + Math.imul(al3, bh9)) | 0;
	    mid = (mid + Math.imul(ah3, bl9)) | 0;
	    hi = (hi + Math.imul(ah3, bh9)) | 0;
	    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
	    w12 &= 0x3ffffff;
	    /* k = 13 */
	    lo = Math.imul(al9, bl4);
	    mid = Math.imul(al9, bh4);
	    mid = (mid + Math.imul(ah9, bl4)) | 0;
	    hi = Math.imul(ah9, bh4);
	    lo = (lo + Math.imul(al8, bl5)) | 0;
	    mid = (mid + Math.imul(al8, bh5)) | 0;
	    mid = (mid + Math.imul(ah8, bl5)) | 0;
	    hi = (hi + Math.imul(ah8, bh5)) | 0;
	    lo = (lo + Math.imul(al7, bl6)) | 0;
	    mid = (mid + Math.imul(al7, bh6)) | 0;
	    mid = (mid + Math.imul(ah7, bl6)) | 0;
	    hi = (hi + Math.imul(ah7, bh6)) | 0;
	    lo = (lo + Math.imul(al6, bl7)) | 0;
	    mid = (mid + Math.imul(al6, bh7)) | 0;
	    mid = (mid + Math.imul(ah6, bl7)) | 0;
	    hi = (hi + Math.imul(ah6, bh7)) | 0;
	    lo = (lo + Math.imul(al5, bl8)) | 0;
	    mid = (mid + Math.imul(al5, bh8)) | 0;
	    mid = (mid + Math.imul(ah5, bl8)) | 0;
	    hi = (hi + Math.imul(ah5, bh8)) | 0;
	    lo = (lo + Math.imul(al4, bl9)) | 0;
	    mid = (mid + Math.imul(al4, bh9)) | 0;
	    mid = (mid + Math.imul(ah4, bl9)) | 0;
	    hi = (hi + Math.imul(ah4, bh9)) | 0;
	    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
	    w13 &= 0x3ffffff;
	    /* k = 14 */
	    lo = Math.imul(al9, bl5);
	    mid = Math.imul(al9, bh5);
	    mid = (mid + Math.imul(ah9, bl5)) | 0;
	    hi = Math.imul(ah9, bh5);
	    lo = (lo + Math.imul(al8, bl6)) | 0;
	    mid = (mid + Math.imul(al8, bh6)) | 0;
	    mid = (mid + Math.imul(ah8, bl6)) | 0;
	    hi = (hi + Math.imul(ah8, bh6)) | 0;
	    lo = (lo + Math.imul(al7, bl7)) | 0;
	    mid = (mid + Math.imul(al7, bh7)) | 0;
	    mid = (mid + Math.imul(ah7, bl7)) | 0;
	    hi = (hi + Math.imul(ah7, bh7)) | 0;
	    lo = (lo + Math.imul(al6, bl8)) | 0;
	    mid = (mid + Math.imul(al6, bh8)) | 0;
	    mid = (mid + Math.imul(ah6, bl8)) | 0;
	    hi = (hi + Math.imul(ah6, bh8)) | 0;
	    lo = (lo + Math.imul(al5, bl9)) | 0;
	    mid = (mid + Math.imul(al5, bh9)) | 0;
	    mid = (mid + Math.imul(ah5, bl9)) | 0;
	    hi = (hi + Math.imul(ah5, bh9)) | 0;
	    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
	    w14 &= 0x3ffffff;
	    /* k = 15 */
	    lo = Math.imul(al9, bl6);
	    mid = Math.imul(al9, bh6);
	    mid = (mid + Math.imul(ah9, bl6)) | 0;
	    hi = Math.imul(ah9, bh6);
	    lo = (lo + Math.imul(al8, bl7)) | 0;
	    mid = (mid + Math.imul(al8, bh7)) | 0;
	    mid = (mid + Math.imul(ah8, bl7)) | 0;
	    hi = (hi + Math.imul(ah8, bh7)) | 0;
	    lo = (lo + Math.imul(al7, bl8)) | 0;
	    mid = (mid + Math.imul(al7, bh8)) | 0;
	    mid = (mid + Math.imul(ah7, bl8)) | 0;
	    hi = (hi + Math.imul(ah7, bh8)) | 0;
	    lo = (lo + Math.imul(al6, bl9)) | 0;
	    mid = (mid + Math.imul(al6, bh9)) | 0;
	    mid = (mid + Math.imul(ah6, bl9)) | 0;
	    hi = (hi + Math.imul(ah6, bh9)) | 0;
	    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
	    w15 &= 0x3ffffff;
	    /* k = 16 */
	    lo = Math.imul(al9, bl7);
	    mid = Math.imul(al9, bh7);
	    mid = (mid + Math.imul(ah9, bl7)) | 0;
	    hi = Math.imul(ah9, bh7);
	    lo = (lo + Math.imul(al8, bl8)) | 0;
	    mid = (mid + Math.imul(al8, bh8)) | 0;
	    mid = (mid + Math.imul(ah8, bl8)) | 0;
	    hi = (hi + Math.imul(ah8, bh8)) | 0;
	    lo = (lo + Math.imul(al7, bl9)) | 0;
	    mid = (mid + Math.imul(al7, bh9)) | 0;
	    mid = (mid + Math.imul(ah7, bl9)) | 0;
	    hi = (hi + Math.imul(ah7, bh9)) | 0;
	    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
	    w16 &= 0x3ffffff;
	    /* k = 17 */
	    lo = Math.imul(al9, bl8);
	    mid = Math.imul(al9, bh8);
	    mid = (mid + Math.imul(ah9, bl8)) | 0;
	    hi = Math.imul(ah9, bh8);
	    lo = (lo + Math.imul(al8, bl9)) | 0;
	    mid = (mid + Math.imul(al8, bh9)) | 0;
	    mid = (mid + Math.imul(ah8, bl9)) | 0;
	    hi = (hi + Math.imul(ah8, bh9)) | 0;
	    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
	    w17 &= 0x3ffffff;
	    /* k = 18 */
	    lo = Math.imul(al9, bl9);
	    mid = Math.imul(al9, bh9);
	    mid = (mid + Math.imul(ah9, bl9)) | 0;
	    hi = Math.imul(ah9, bh9);
	    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
	    w18 &= 0x3ffffff;
	    o[0] = w0;
	    o[1] = w1;
	    o[2] = w2;
	    o[3] = w3;
	    o[4] = w4;
	    o[5] = w5;
	    o[6] = w6;
	    o[7] = w7;
	    o[8] = w8;
	    o[9] = w9;
	    o[10] = w10;
	    o[11] = w11;
	    o[12] = w12;
	    o[13] = w13;
	    o[14] = w14;
	    o[15] = w15;
	    o[16] = w16;
	    o[17] = w17;
	    o[18] = w18;
	    if (c !== 0) {
	      o[19] = c;
	      out.length++;
	    }
	    return out;
	  };

	  // Polyfill comb
	  if (!Math.imul) {
	    comb10MulTo = smallMulTo;
	  }

	  function bigMulTo (self, num, out) {
	    out.negative = num.negative ^ self.negative;
	    out.length = self.length + num.length;

	    var carry = 0;
	    var hncarry = 0;
	    for (var k = 0; k < out.length - 1; k++) {
	      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
	      // note that ncarry could be >= 0x3ffffff
	      var ncarry = hncarry;
	      hncarry = 0;
	      var rword = carry & 0x3ffffff;
	      var maxJ = Math.min(k, num.length - 1);
	      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
	        var i = k - j;
	        var a = self.words[i] | 0;
	        var b = num.words[j] | 0;
	        var r = a * b;

	        var lo = r & 0x3ffffff;
	        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
	        lo = (lo + rword) | 0;
	        rword = lo & 0x3ffffff;
	        ncarry = (ncarry + (lo >>> 26)) | 0;

	        hncarry += ncarry >>> 26;
	        ncarry &= 0x3ffffff;
	      }
	      out.words[k] = rword;
	      carry = ncarry;
	      ncarry = hncarry;
	    }
	    if (carry !== 0) {
	      out.words[k] = carry;
	    } else {
	      out.length--;
	    }

	    return out._strip();
	  }

	  function jumboMulTo (self, num, out) {
	    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
	    // var fftm = new FFTM();
	    // return fftm.mulp(self, num, out);
	    return bigMulTo(self, num, out);
	  }

	  BN.prototype.mulTo = function mulTo (num, out) {
	    var res;
	    var len = this.length + num.length;
	    if (this.length === 10 && num.length === 10) {
	      res = comb10MulTo(this, num, out);
	    } else if (len < 63) {
	      res = smallMulTo(this, num, out);
	    } else if (len < 1024) {
	      res = bigMulTo(this, num, out);
	    } else {
	      res = jumboMulTo(this, num, out);
	    }

	    return res;
	  };

	  // Multiply `this` by `num`
	  BN.prototype.mul = function mul (num) {
	    var out = new BN(null);
	    out.words = new Array(this.length + num.length);
	    return this.mulTo(num, out);
	  };

	  // Multiply employing FFT
	  BN.prototype.mulf = function mulf (num) {
	    var out = new BN(null);
	    out.words = new Array(this.length + num.length);
	    return jumboMulTo(this, num, out);
	  };

	  // In-place Multiplication
	  BN.prototype.imul = function imul (num) {
	    return this.clone().mulTo(num, this);
	  };

	  BN.prototype.imuln = function imuln (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(typeof num === 'number');
	    assert(num < 0x4000000);

	    // Carry
	    var carry = 0;
	    for (var i = 0; i < this.length; i++) {
	      var w = (this.words[i] | 0) * num;
	      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
	      carry >>= 26;
	      carry += (w / 0x4000000) | 0;
	      // NOTE: lo is 27bit maximum
	      carry += lo >>> 26;
	      this.words[i] = lo & 0x3ffffff;
	    }

	    if (carry !== 0) {
	      this.words[i] = carry;
	      this.length++;
	    }

	    return isNegNum ? this.ineg() : this;
	  };

	  BN.prototype.muln = function muln (num) {
	    return this.clone().imuln(num);
	  };

	  // `this` * `this`
	  BN.prototype.sqr = function sqr () {
	    return this.mul(this);
	  };

	  // `this` * `this` in-place
	  BN.prototype.isqr = function isqr () {
	    return this.imul(this.clone());
	  };

	  // Math.pow(`this`, `num`)
	  BN.prototype.pow = function pow (num) {
	    var w = toBitArray(num);
	    if (w.length === 0) return new BN(1);

	    // Skip leading zeroes
	    var res = this;
	    for (var i = 0; i < w.length; i++, res = res.sqr()) {
	      if (w[i] !== 0) break;
	    }

	    if (++i < w.length) {
	      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
	        if (w[i] === 0) continue;

	        res = res.mul(q);
	      }
	    }

	    return res;
	  };

	  // Shift-left in-place
	  BN.prototype.iushln = function iushln (bits) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var r = bits % 26;
	    var s = (bits - r) / 26;
	    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
	    var i;

	    if (r !== 0) {
	      var carry = 0;

	      for (i = 0; i < this.length; i++) {
	        var newCarry = this.words[i] & carryMask;
	        var c = ((this.words[i] | 0) - newCarry) << r;
	        this.words[i] = c | carry;
	        carry = newCarry >>> (26 - r);
	      }

	      if (carry) {
	        this.words[i] = carry;
	        this.length++;
	      }
	    }

	    if (s !== 0) {
	      for (i = this.length - 1; i >= 0; i--) {
	        this.words[i + s] = this.words[i];
	      }

	      for (i = 0; i < s; i++) {
	        this.words[i] = 0;
	      }

	      this.length += s;
	    }

	    return this._strip();
	  };

	  BN.prototype.ishln = function ishln (bits) {
	    // TODO(indutny): implement me
	    assert(this.negative === 0);
	    return this.iushln(bits);
	  };

	  // Shift-right in-place
	  // NOTE: `hint` is a lowest bit before trailing zeroes
	  // NOTE: if `extended` is present - it will be filled with destroyed bits
	  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var h;
	    if (hint) {
	      h = (hint - (hint % 26)) / 26;
	    } else {
	      h = 0;
	    }

	    var r = bits % 26;
	    var s = Math.min((bits - r) / 26, this.length);
	    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
	    var maskedWords = extended;

	    h -= s;
	    h = Math.max(0, h);

	    // Extended mode, copy masked part
	    if (maskedWords) {
	      for (var i = 0; i < s; i++) {
	        maskedWords.words[i] = this.words[i];
	      }
	      maskedWords.length = s;
	    }

	    if (s === 0) ; else if (this.length > s) {
	      this.length -= s;
	      for (i = 0; i < this.length; i++) {
	        this.words[i] = this.words[i + s];
	      }
	    } else {
	      this.words[0] = 0;
	      this.length = 1;
	    }

	    var carry = 0;
	    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
	      var word = this.words[i] | 0;
	      this.words[i] = (carry << (26 - r)) | (word >>> r);
	      carry = word & mask;
	    }

	    // Push carried bits as a mask
	    if (maskedWords && carry !== 0) {
	      maskedWords.words[maskedWords.length++] = carry;
	    }

	    if (this.length === 0) {
	      this.words[0] = 0;
	      this.length = 1;
	    }

	    return this._strip();
	  };

	  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
	    // TODO(indutny): implement me
	    assert(this.negative === 0);
	    return this.iushrn(bits, hint, extended);
	  };

	  // Shift-left
	  BN.prototype.shln = function shln (bits) {
	    return this.clone().ishln(bits);
	  };

	  BN.prototype.ushln = function ushln (bits) {
	    return this.clone().iushln(bits);
	  };

	  // Shift-right
	  BN.prototype.shrn = function shrn (bits) {
	    return this.clone().ishrn(bits);
	  };

	  BN.prototype.ushrn = function ushrn (bits) {
	    return this.clone().iushrn(bits);
	  };

	  // Test if n bit is set
	  BN.prototype.testn = function testn (bit) {
	    assert(typeof bit === 'number' && bit >= 0);
	    var r = bit % 26;
	    var s = (bit - r) / 26;
	    var q = 1 << r;

	    // Fast case: bit is much higher than all existing words
	    if (this.length <= s) return false;

	    // Check bit and return
	    var w = this.words[s];

	    return !!(w & q);
	  };

	  // Return only lowers bits of number (in-place)
	  BN.prototype.imaskn = function imaskn (bits) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var r = bits % 26;
	    var s = (bits - r) / 26;

	    assert(this.negative === 0, 'imaskn works only with positive numbers');

	    if (this.length <= s) {
	      return this;
	    }

	    if (r !== 0) {
	      s++;
	    }
	    this.length = Math.min(s, this.length);

	    if (r !== 0) {
	      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
	      this.words[this.length - 1] &= mask;
	    }

	    return this._strip();
	  };

	  // Return only lowers bits of number
	  BN.prototype.maskn = function maskn (bits) {
	    return this.clone().imaskn(bits);
	  };

	  // Add plain number `num` to `this`
	  BN.prototype.iaddn = function iaddn (num) {
	    assert(typeof num === 'number');
	    assert(num < 0x4000000);
	    if (num < 0) return this.isubn(-num);

	    // Possible sign change
	    if (this.negative !== 0) {
	      if (this.length === 1 && (this.words[0] | 0) <= num) {
	        this.words[0] = num - (this.words[0] | 0);
	        this.negative = 0;
	        return this;
	      }

	      this.negative = 0;
	      this.isubn(num);
	      this.negative = 1;
	      return this;
	    }

	    // Add without checks
	    return this._iaddn(num);
	  };

	  BN.prototype._iaddn = function _iaddn (num) {
	    this.words[0] += num;

	    // Carry
	    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
	      this.words[i] -= 0x4000000;
	      if (i === this.length - 1) {
	        this.words[i + 1] = 1;
	      } else {
	        this.words[i + 1]++;
	      }
	    }
	    this.length = Math.max(this.length, i + 1);

	    return this;
	  };

	  // Subtract plain number `num` from `this`
	  BN.prototype.isubn = function isubn (num) {
	    assert(typeof num === 'number');
	    assert(num < 0x4000000);
	    if (num < 0) return this.iaddn(-num);

	    if (this.negative !== 0) {
	      this.negative = 0;
	      this.iaddn(num);
	      this.negative = 1;
	      return this;
	    }

	    this.words[0] -= num;

	    if (this.length === 1 && this.words[0] < 0) {
	      this.words[0] = -this.words[0];
	      this.negative = 1;
	    } else {
	      // Carry
	      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
	        this.words[i] += 0x4000000;
	        this.words[i + 1] -= 1;
	      }
	    }

	    return this._strip();
	  };

	  BN.prototype.addn = function addn (num) {
	    return this.clone().iaddn(num);
	  };

	  BN.prototype.subn = function subn (num) {
	    return this.clone().isubn(num);
	  };

	  BN.prototype.iabs = function iabs () {
	    this.negative = 0;

	    return this;
	  };

	  BN.prototype.abs = function abs () {
	    return this.clone().iabs();
	  };

	  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
	    var len = num.length + shift;
	    var i;

	    this._expand(len);

	    var w;
	    var carry = 0;
	    for (i = 0; i < num.length; i++) {
	      w = (this.words[i + shift] | 0) + carry;
	      var right = (num.words[i] | 0) * mul;
	      w -= right & 0x3ffffff;
	      carry = (w >> 26) - ((right / 0x4000000) | 0);
	      this.words[i + shift] = w & 0x3ffffff;
	    }
	    for (; i < this.length - shift; i++) {
	      w = (this.words[i + shift] | 0) + carry;
	      carry = w >> 26;
	      this.words[i + shift] = w & 0x3ffffff;
	    }

	    if (carry === 0) return this._strip();

	    // Subtraction overflow
	    assert(carry === -1);
	    carry = 0;
	    for (i = 0; i < this.length; i++) {
	      w = -(this.words[i] | 0) + carry;
	      carry = w >> 26;
	      this.words[i] = w & 0x3ffffff;
	    }
	    this.negative = 1;

	    return this._strip();
	  };

	  BN.prototype._wordDiv = function _wordDiv (num, mode) {
	    var shift = this.length - num.length;

	    var a = this.clone();
	    var b = num;

	    // Normalize
	    var bhi = b.words[b.length - 1] | 0;
	    var bhiBits = this._countBits(bhi);
	    shift = 26 - bhiBits;
	    if (shift !== 0) {
	      b = b.ushln(shift);
	      a.iushln(shift);
	      bhi = b.words[b.length - 1] | 0;
	    }

	    // Initialize quotient
	    var m = a.length - b.length;
	    var q;

	    if (mode !== 'mod') {
	      q = new BN(null);
	      q.length = m + 1;
	      q.words = new Array(q.length);
	      for (var i = 0; i < q.length; i++) {
	        q.words[i] = 0;
	      }
	    }

	    var diff = a.clone()._ishlnsubmul(b, 1, m);
	    if (diff.negative === 0) {
	      a = diff;
	      if (q) {
	        q.words[m] = 1;
	      }
	    }

	    for (var j = m - 1; j >= 0; j--) {
	      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
	        (a.words[b.length + j - 1] | 0);

	      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
	      // (0x7ffffff)
	      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

	      a._ishlnsubmul(b, qj, j);
	      while (a.negative !== 0) {
	        qj--;
	        a.negative = 0;
	        a._ishlnsubmul(b, 1, j);
	        if (!a.isZero()) {
	          a.negative ^= 1;
	        }
	      }
	      if (q) {
	        q.words[j] = qj;
	      }
	    }
	    if (q) {
	      q._strip();
	    }
	    a._strip();

	    // Denormalize
	    if (mode !== 'div' && shift !== 0) {
	      a.iushrn(shift);
	    }

	    return {
	      div: q || null,
	      mod: a
	    };
	  };

	  // NOTE: 1) `mode` can be set to `mod` to request mod only,
	  //       to `div` to request div only, or be absent to
	  //       request both div & mod
	  //       2) `positive` is true if unsigned mod is requested
	  BN.prototype.divmod = function divmod (num, mode, positive) {
	    assert(!num.isZero());

	    if (this.isZero()) {
	      return {
	        div: new BN(0),
	        mod: new BN(0)
	      };
	    }

	    var div, mod, res;
	    if (this.negative !== 0 && num.negative === 0) {
	      res = this.neg().divmod(num, mode);

	      if (mode !== 'mod') {
	        div = res.div.neg();
	      }

	      if (mode !== 'div') {
	        mod = res.mod.neg();
	        if (positive && mod.negative !== 0) {
	          mod.iadd(num);
	        }
	      }

	      return {
	        div: div,
	        mod: mod
	      };
	    }

	    if (this.negative === 0 && num.negative !== 0) {
	      res = this.divmod(num.neg(), mode);

	      if (mode !== 'mod') {
	        div = res.div.neg();
	      }

	      return {
	        div: div,
	        mod: res.mod
	      };
	    }

	    if ((this.negative & num.negative) !== 0) {
	      res = this.neg().divmod(num.neg(), mode);

	      if (mode !== 'div') {
	        mod = res.mod.neg();
	        if (positive && mod.negative !== 0) {
	          mod.isub(num);
	        }
	      }

	      return {
	        div: res.div,
	        mod: mod
	      };
	    }

	    // Both numbers are positive at this point

	    // Strip both numbers to approximate shift value
	    if (num.length > this.length || this.cmp(num) < 0) {
	      return {
	        div: new BN(0),
	        mod: this
	      };
	    }

	    // Very short reduction
	    if (num.length === 1) {
	      if (mode === 'div') {
	        return {
	          div: this.divn(num.words[0]),
	          mod: null
	        };
	      }

	      if (mode === 'mod') {
	        return {
	          div: null,
	          mod: new BN(this.modrn(num.words[0]))
	        };
	      }

	      return {
	        div: this.divn(num.words[0]),
	        mod: new BN(this.modrn(num.words[0]))
	      };
	    }

	    return this._wordDiv(num, mode);
	  };

	  // Find `this` / `num`
	  BN.prototype.div = function div (num) {
	    return this.divmod(num, 'div', false).div;
	  };

	  // Find `this` % `num`
	  BN.prototype.mod = function mod (num) {
	    return this.divmod(num, 'mod', false).mod;
	  };

	  BN.prototype.umod = function umod (num) {
	    return this.divmod(num, 'mod', true).mod;
	  };

	  // Find Round(`this` / `num`)
	  BN.prototype.divRound = function divRound (num) {
	    var dm = this.divmod(num);

	    // Fast case - exact division
	    if (dm.mod.isZero()) return dm.div;

	    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

	    var half = num.ushrn(1);
	    var r2 = num.andln(1);
	    var cmp = mod.cmp(half);

	    // Round down
	    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

	    // Round up
	    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
	  };

	  BN.prototype.modrn = function modrn (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(num <= 0x3ffffff);
	    var p = (1 << 26) % num;

	    var acc = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      acc = (p * acc + (this.words[i] | 0)) % num;
	    }

	    return isNegNum ? -acc : acc;
	  };

	  // WARNING: DEPRECATED
	  BN.prototype.modn = function modn (num) {
	    return this.modrn(num);
	  };

	  // In-place division by number
	  BN.prototype.idivn = function idivn (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(num <= 0x3ffffff);

	    var carry = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      var w = (this.words[i] | 0) + carry * 0x4000000;
	      this.words[i] = (w / num) | 0;
	      carry = w % num;
	    }

	    this._strip();
	    return isNegNum ? this.ineg() : this;
	  };

	  BN.prototype.divn = function divn (num) {
	    return this.clone().idivn(num);
	  };

	  BN.prototype.egcd = function egcd (p) {
	    assert(p.negative === 0);
	    assert(!p.isZero());

	    var x = this;
	    var y = p.clone();

	    if (x.negative !== 0) {
	      x = x.umod(p);
	    } else {
	      x = x.clone();
	    }

	    // A * x + B * y = x
	    var A = new BN(1);
	    var B = new BN(0);

	    // C * x + D * y = y
	    var C = new BN(0);
	    var D = new BN(1);

	    var g = 0;

	    while (x.isEven() && y.isEven()) {
	      x.iushrn(1);
	      y.iushrn(1);
	      ++g;
	    }

	    var yp = y.clone();
	    var xp = x.clone();

	    while (!x.isZero()) {
	      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
	      if (i > 0) {
	        x.iushrn(i);
	        while (i-- > 0) {
	          if (A.isOdd() || B.isOdd()) {
	            A.iadd(yp);
	            B.isub(xp);
	          }

	          A.iushrn(1);
	          B.iushrn(1);
	        }
	      }

	      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
	      if (j > 0) {
	        y.iushrn(j);
	        while (j-- > 0) {
	          if (C.isOdd() || D.isOdd()) {
	            C.iadd(yp);
	            D.isub(xp);
	          }

	          C.iushrn(1);
	          D.iushrn(1);
	        }
	      }

	      if (x.cmp(y) >= 0) {
	        x.isub(y);
	        A.isub(C);
	        B.isub(D);
	      } else {
	        y.isub(x);
	        C.isub(A);
	        D.isub(B);
	      }
	    }

	    return {
	      a: C,
	      b: D,
	      gcd: y.iushln(g)
	    };
	  };

	  // This is reduced incarnation of the binary EEA
	  // above, designated to invert members of the
	  // _prime_ fields F(p) at a maximal speed
	  BN.prototype._invmp = function _invmp (p) {
	    assert(p.negative === 0);
	    assert(!p.isZero());

	    var a = this;
	    var b = p.clone();

	    if (a.negative !== 0) {
	      a = a.umod(p);
	    } else {
	      a = a.clone();
	    }

	    var x1 = new BN(1);
	    var x2 = new BN(0);

	    var delta = b.clone();

	    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
	      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
	      if (i > 0) {
	        a.iushrn(i);
	        while (i-- > 0) {
	          if (x1.isOdd()) {
	            x1.iadd(delta);
	          }

	          x1.iushrn(1);
	        }
	      }

	      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
	      if (j > 0) {
	        b.iushrn(j);
	        while (j-- > 0) {
	          if (x2.isOdd()) {
	            x2.iadd(delta);
	          }

	          x2.iushrn(1);
	        }
	      }

	      if (a.cmp(b) >= 0) {
	        a.isub(b);
	        x1.isub(x2);
	      } else {
	        b.isub(a);
	        x2.isub(x1);
	      }
	    }

	    var res;
	    if (a.cmpn(1) === 0) {
	      res = x1;
	    } else {
	      res = x2;
	    }

	    if (res.cmpn(0) < 0) {
	      res.iadd(p);
	    }

	    return res;
	  };

	  BN.prototype.gcd = function gcd (num) {
	    if (this.isZero()) return num.abs();
	    if (num.isZero()) return this.abs();

	    var a = this.clone();
	    var b = num.clone();
	    a.negative = 0;
	    b.negative = 0;

	    // Remove common factor of two
	    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
	      a.iushrn(1);
	      b.iushrn(1);
	    }

	    do {
	      while (a.isEven()) {
	        a.iushrn(1);
	      }
	      while (b.isEven()) {
	        b.iushrn(1);
	      }

	      var r = a.cmp(b);
	      if (r < 0) {
	        // Swap `a` and `b` to make `a` always bigger than `b`
	        var t = a;
	        a = b;
	        b = t;
	      } else if (r === 0 || b.cmpn(1) === 0) {
	        break;
	      }

	      a.isub(b);
	    } while (true);

	    return b.iushln(shift);
	  };

	  // Invert number in the field F(num)
	  BN.prototype.invm = function invm (num) {
	    return this.egcd(num).a.umod(num);
	  };

	  BN.prototype.isEven = function isEven () {
	    return (this.words[0] & 1) === 0;
	  };

	  BN.prototype.isOdd = function isOdd () {
	    return (this.words[0] & 1) === 1;
	  };

	  // And first word and num
	  BN.prototype.andln = function andln (num) {
	    return this.words[0] & num;
	  };

	  // Increment at the bit position in-line
	  BN.prototype.bincn = function bincn (bit) {
	    assert(typeof bit === 'number');
	    var r = bit % 26;
	    var s = (bit - r) / 26;
	    var q = 1 << r;

	    // Fast case: bit is much higher than all existing words
	    if (this.length <= s) {
	      this._expand(s + 1);
	      this.words[s] |= q;
	      return this;
	    }

	    // Add bit and propagate, if needed
	    var carry = q;
	    for (var i = s; carry !== 0 && i < this.length; i++) {
	      var w = this.words[i] | 0;
	      w += carry;
	      carry = w >>> 26;
	      w &= 0x3ffffff;
	      this.words[i] = w;
	    }
	    if (carry !== 0) {
	      this.words[i] = carry;
	      this.length++;
	    }
	    return this;
	  };

	  BN.prototype.isZero = function isZero () {
	    return this.length === 1 && this.words[0] === 0;
	  };

	  BN.prototype.cmpn = function cmpn (num) {
	    var negative = num < 0;

	    if (this.negative !== 0 && !negative) return -1;
	    if (this.negative === 0 && negative) return 1;

	    this._strip();

	    var res;
	    if (this.length > 1) {
	      res = 1;
	    } else {
	      if (negative) {
	        num = -num;
	      }

	      assert(num <= 0x3ffffff, 'Number is too big');

	      var w = this.words[0] | 0;
	      res = w === num ? 0 : w < num ? -1 : 1;
	    }
	    if (this.negative !== 0) return -res | 0;
	    return res;
	  };

	  // Compare two numbers and return:
	  // 1 - if `this` > `num`
	  // 0 - if `this` == `num`
	  // -1 - if `this` < `num`
	  BN.prototype.cmp = function cmp (num) {
	    if (this.negative !== 0 && num.negative === 0) return -1;
	    if (this.negative === 0 && num.negative !== 0) return 1;

	    var res = this.ucmp(num);
	    if (this.negative !== 0) return -res | 0;
	    return res;
	  };

	  // Unsigned comparison
	  BN.prototype.ucmp = function ucmp (num) {
	    // At this point both numbers have the same sign
	    if (this.length > num.length) return 1;
	    if (this.length < num.length) return -1;

	    var res = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      var a = this.words[i] | 0;
	      var b = num.words[i] | 0;

	      if (a === b) continue;
	      if (a < b) {
	        res = -1;
	      } else if (a > b) {
	        res = 1;
	      }
	      break;
	    }
	    return res;
	  };

	  BN.prototype.gtn = function gtn (num) {
	    return this.cmpn(num) === 1;
	  };

	  BN.prototype.gt = function gt (num) {
	    return this.cmp(num) === 1;
	  };

	  BN.prototype.gten = function gten (num) {
	    return this.cmpn(num) >= 0;
	  };

	  BN.prototype.gte = function gte (num) {
	    return this.cmp(num) >= 0;
	  };

	  BN.prototype.ltn = function ltn (num) {
	    return this.cmpn(num) === -1;
	  };

	  BN.prototype.lt = function lt (num) {
	    return this.cmp(num) === -1;
	  };

	  BN.prototype.lten = function lten (num) {
	    return this.cmpn(num) <= 0;
	  };

	  BN.prototype.lte = function lte (num) {
	    return this.cmp(num) <= 0;
	  };

	  BN.prototype.eqn = function eqn (num) {
	    return this.cmpn(num) === 0;
	  };

	  BN.prototype.eq = function eq (num) {
	    return this.cmp(num) === 0;
	  };

	  //
	  // A reduce context, could be using montgomery or something better, depending
	  // on the `m` itself.
	  //
	  BN.red = function red (num) {
	    return new Red(num);
	  };

	  BN.prototype.toRed = function toRed (ctx) {
	    assert(!this.red, 'Already a number in reduction context');
	    assert(this.negative === 0, 'red works only with positives');
	    return ctx.convertTo(this)._forceRed(ctx);
	  };

	  BN.prototype.fromRed = function fromRed () {
	    assert(this.red, 'fromRed works only with numbers in reduction context');
	    return this.red.convertFrom(this);
	  };

	  BN.prototype._forceRed = function _forceRed (ctx) {
	    this.red = ctx;
	    return this;
	  };

	  BN.prototype.forceRed = function forceRed (ctx) {
	    assert(!this.red, 'Already a number in reduction context');
	    return this._forceRed(ctx);
	  };

	  BN.prototype.redAdd = function redAdd (num) {
	    assert(this.red, 'redAdd works only with red numbers');
	    return this.red.add(this, num);
	  };

	  BN.prototype.redIAdd = function redIAdd (num) {
	    assert(this.red, 'redIAdd works only with red numbers');
	    return this.red.iadd(this, num);
	  };

	  BN.prototype.redSub = function redSub (num) {
	    assert(this.red, 'redSub works only with red numbers');
	    return this.red.sub(this, num);
	  };

	  BN.prototype.redISub = function redISub (num) {
	    assert(this.red, 'redISub works only with red numbers');
	    return this.red.isub(this, num);
	  };

	  BN.prototype.redShl = function redShl (num) {
	    assert(this.red, 'redShl works only with red numbers');
	    return this.red.shl(this, num);
	  };

	  BN.prototype.redMul = function redMul (num) {
	    assert(this.red, 'redMul works only with red numbers');
	    this.red._verify2(this, num);
	    return this.red.mul(this, num);
	  };

	  BN.prototype.redIMul = function redIMul (num) {
	    assert(this.red, 'redMul works only with red numbers');
	    this.red._verify2(this, num);
	    return this.red.imul(this, num);
	  };

	  BN.prototype.redSqr = function redSqr () {
	    assert(this.red, 'redSqr works only with red numbers');
	    this.red._verify1(this);
	    return this.red.sqr(this);
	  };

	  BN.prototype.redISqr = function redISqr () {
	    assert(this.red, 'redISqr works only with red numbers');
	    this.red._verify1(this);
	    return this.red.isqr(this);
	  };

	  // Square root over p
	  BN.prototype.redSqrt = function redSqrt () {
	    assert(this.red, 'redSqrt works only with red numbers');
	    this.red._verify1(this);
	    return this.red.sqrt(this);
	  };

	  BN.prototype.redInvm = function redInvm () {
	    assert(this.red, 'redInvm works only with red numbers');
	    this.red._verify1(this);
	    return this.red.invm(this);
	  };

	  // Return negative clone of `this` % `red modulo`
	  BN.prototype.redNeg = function redNeg () {
	    assert(this.red, 'redNeg works only with red numbers');
	    this.red._verify1(this);
	    return this.red.neg(this);
	  };

	  BN.prototype.redPow = function redPow (num) {
	    assert(this.red && !num.red, 'redPow(normalNum)');
	    this.red._verify1(this);
	    return this.red.pow(this, num);
	  };

	  // Prime numbers with efficient reduction
	  var primes = {
	    k256: null,
	    p224: null,
	    p192: null,
	    p25519: null
	  };

	  // Pseudo-Mersenne prime
	  function MPrime (name, p) {
	    // P = 2 ^ N - K
	    this.name = name;
	    this.p = new BN(p, 16);
	    this.n = this.p.bitLength();
	    this.k = new BN(1).iushln(this.n).isub(this.p);

	    this.tmp = this._tmp();
	  }

	  MPrime.prototype._tmp = function _tmp () {
	    var tmp = new BN(null);
	    tmp.words = new Array(Math.ceil(this.n / 13));
	    return tmp;
	  };

	  MPrime.prototype.ireduce = function ireduce (num) {
	    // Assumes that `num` is less than `P^2`
	    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
	    var r = num;
	    var rlen;

	    do {
	      this.split(r, this.tmp);
	      r = this.imulK(r);
	      r = r.iadd(this.tmp);
	      rlen = r.bitLength();
	    } while (rlen > this.n);

	    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
	    if (cmp === 0) {
	      r.words[0] = 0;
	      r.length = 1;
	    } else if (cmp > 0) {
	      r.isub(this.p);
	    } else {
	      if (r.strip !== undefined) {
	        // r is a BN v4 instance
	        r.strip();
	      } else {
	        // r is a BN v5 instance
	        r._strip();
	      }
	    }

	    return r;
	  };

	  MPrime.prototype.split = function split (input, out) {
	    input.iushrn(this.n, 0, out);
	  };

	  MPrime.prototype.imulK = function imulK (num) {
	    return num.imul(this.k);
	  };

	  function K256 () {
	    MPrime.call(
	      this,
	      'k256',
	      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
	  }
	  inherits(K256, MPrime);

	  K256.prototype.split = function split (input, output) {
	    // 256 = 9 * 26 + 22
	    var mask = 0x3fffff;

	    var outLen = Math.min(input.length, 9);
	    for (var i = 0; i < outLen; i++) {
	      output.words[i] = input.words[i];
	    }
	    output.length = outLen;

	    if (input.length <= 9) {
	      input.words[0] = 0;
	      input.length = 1;
	      return;
	    }

	    // Shift by 9 limbs
	    var prev = input.words[9];
	    output.words[output.length++] = prev & mask;

	    for (i = 10; i < input.length; i++) {
	      var next = input.words[i] | 0;
	      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
	      prev = next;
	    }
	    prev >>>= 22;
	    input.words[i - 10] = prev;
	    if (prev === 0 && input.length > 10) {
	      input.length -= 10;
	    } else {
	      input.length -= 9;
	    }
	  };

	  K256.prototype.imulK = function imulK (num) {
	    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
	    num.words[num.length] = 0;
	    num.words[num.length + 1] = 0;
	    num.length += 2;

	    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
	    var lo = 0;
	    for (var i = 0; i < num.length; i++) {
	      var w = num.words[i] | 0;
	      lo += w * 0x3d1;
	      num.words[i] = lo & 0x3ffffff;
	      lo = w * 0x40 + ((lo / 0x4000000) | 0);
	    }

	    // Fast length reduction
	    if (num.words[num.length - 1] === 0) {
	      num.length--;
	      if (num.words[num.length - 1] === 0) {
	        num.length--;
	      }
	    }
	    return num;
	  };

	  function P224 () {
	    MPrime.call(
	      this,
	      'p224',
	      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
	  }
	  inherits(P224, MPrime);

	  function P192 () {
	    MPrime.call(
	      this,
	      'p192',
	      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
	  }
	  inherits(P192, MPrime);

	  function P25519 () {
	    // 2 ^ 255 - 19
	    MPrime.call(
	      this,
	      '25519',
	      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
	  }
	  inherits(P25519, MPrime);

	  P25519.prototype.imulK = function imulK (num) {
	    // K = 0x13
	    var carry = 0;
	    for (var i = 0; i < num.length; i++) {
	      var hi = (num.words[i] | 0) * 0x13 + carry;
	      var lo = hi & 0x3ffffff;
	      hi >>>= 26;

	      num.words[i] = lo;
	      carry = hi;
	    }
	    if (carry !== 0) {
	      num.words[num.length++] = carry;
	    }
	    return num;
	  };

	  // Exported mostly for testing purposes, use plain name instead
	  BN._prime = function prime (name) {
	    // Cached version of prime
	    if (primes[name]) return primes[name];

	    var prime;
	    if (name === 'k256') {
	      prime = new K256();
	    } else if (name === 'p224') {
	      prime = new P224();
	    } else if (name === 'p192') {
	      prime = new P192();
	    } else if (name === 'p25519') {
	      prime = new P25519();
	    } else {
	      throw new Error('Unknown prime ' + name);
	    }
	    primes[name] = prime;

	    return prime;
	  };

	  //
	  // Base reduction engine
	  //
	  function Red (m) {
	    if (typeof m === 'string') {
	      var prime = BN._prime(m);
	      this.m = prime.p;
	      this.prime = prime;
	    } else {
	      assert(m.gtn(1), 'modulus must be greater than 1');
	      this.m = m;
	      this.prime = null;
	    }
	  }

	  Red.prototype._verify1 = function _verify1 (a) {
	    assert(a.negative === 0, 'red works only with positives');
	    assert(a.red, 'red works only with red numbers');
	  };

	  Red.prototype._verify2 = function _verify2 (a, b) {
	    assert((a.negative | b.negative) === 0, 'red works only with positives');
	    assert(a.red && a.red === b.red,
	      'red works only with red numbers');
	  };

	  Red.prototype.imod = function imod (a) {
	    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

	    move(a, a.umod(this.m)._forceRed(this));
	    return a;
	  };

	  Red.prototype.neg = function neg (a) {
	    if (a.isZero()) {
	      return a.clone();
	    }

	    return this.m.sub(a)._forceRed(this);
	  };

	  Red.prototype.add = function add (a, b) {
	    this._verify2(a, b);

	    var res = a.add(b);
	    if (res.cmp(this.m) >= 0) {
	      res.isub(this.m);
	    }
	    return res._forceRed(this);
	  };

	  Red.prototype.iadd = function iadd (a, b) {
	    this._verify2(a, b);

	    var res = a.iadd(b);
	    if (res.cmp(this.m) >= 0) {
	      res.isub(this.m);
	    }
	    return res;
	  };

	  Red.prototype.sub = function sub (a, b) {
	    this._verify2(a, b);

	    var res = a.sub(b);
	    if (res.cmpn(0) < 0) {
	      res.iadd(this.m);
	    }
	    return res._forceRed(this);
	  };

	  Red.prototype.isub = function isub (a, b) {
	    this._verify2(a, b);

	    var res = a.isub(b);
	    if (res.cmpn(0) < 0) {
	      res.iadd(this.m);
	    }
	    return res;
	  };

	  Red.prototype.shl = function shl (a, num) {
	    this._verify1(a);
	    return this.imod(a.ushln(num));
	  };

	  Red.prototype.imul = function imul (a, b) {
	    this._verify2(a, b);
	    return this.imod(a.imul(b));
	  };

	  Red.prototype.mul = function mul (a, b) {
	    this._verify2(a, b);
	    return this.imod(a.mul(b));
	  };

	  Red.prototype.isqr = function isqr (a) {
	    return this.imul(a, a.clone());
	  };

	  Red.prototype.sqr = function sqr (a) {
	    return this.mul(a, a);
	  };

	  Red.prototype.sqrt = function sqrt (a) {
	    if (a.isZero()) return a.clone();

	    var mod3 = this.m.andln(3);
	    assert(mod3 % 2 === 1);

	    // Fast case
	    if (mod3 === 3) {
	      var pow = this.m.add(new BN(1)).iushrn(2);
	      return this.pow(a, pow);
	    }

	    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
	    //
	    // Find Q and S, that Q * 2 ^ S = (P - 1)
	    var q = this.m.subn(1);
	    var s = 0;
	    while (!q.isZero() && q.andln(1) === 0) {
	      s++;
	      q.iushrn(1);
	    }
	    assert(!q.isZero());

	    var one = new BN(1).toRed(this);
	    var nOne = one.redNeg();

	    // Find quadratic non-residue
	    // NOTE: Max is such because of generalized Riemann hypothesis.
	    var lpow = this.m.subn(1).iushrn(1);
	    var z = this.m.bitLength();
	    z = new BN(2 * z * z).toRed(this);

	    while (this.pow(z, lpow).cmp(nOne) !== 0) {
	      z.redIAdd(nOne);
	    }

	    var c = this.pow(z, q);
	    var r = this.pow(a, q.addn(1).iushrn(1));
	    var t = this.pow(a, q);
	    var m = s;
	    while (t.cmp(one) !== 0) {
	      var tmp = t;
	      for (var i = 0; tmp.cmp(one) !== 0; i++) {
	        tmp = tmp.redSqr();
	      }
	      assert(i < m);
	      var b = this.pow(c, new BN(1).iushln(m - i - 1));

	      r = r.redMul(b);
	      c = b.redSqr();
	      t = t.redMul(c);
	      m = i;
	    }

	    return r;
	  };

	  Red.prototype.invm = function invm (a) {
	    var inv = a._invmp(this.m);
	    if (inv.negative !== 0) {
	      inv.negative = 0;
	      return this.imod(inv).redNeg();
	    } else {
	      return this.imod(inv);
	    }
	  };

	  Red.prototype.pow = function pow (a, num) {
	    if (num.isZero()) return new BN(1).toRed(this);
	    if (num.cmpn(1) === 0) return a.clone();

	    var windowSize = 4;
	    var wnd = new Array(1 << windowSize);
	    wnd[0] = new BN(1).toRed(this);
	    wnd[1] = a;
	    for (var i = 2; i < wnd.length; i++) {
	      wnd[i] = this.mul(wnd[i - 1], a);
	    }

	    var res = wnd[0];
	    var current = 0;
	    var currentLen = 0;
	    var start = num.bitLength() % 26;
	    if (start === 0) {
	      start = 26;
	    }

	    for (i = num.length - 1; i >= 0; i--) {
	      var word = num.words[i];
	      for (var j = start - 1; j >= 0; j--) {
	        var bit = (word >> j) & 1;
	        if (res !== wnd[0]) {
	          res = this.sqr(res);
	        }

	        if (bit === 0 && current === 0) {
	          currentLen = 0;
	          continue;
	        }

	        current <<= 1;
	        current |= bit;
	        currentLen++;
	        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

	        res = this.mul(res, wnd[current]);
	        currentLen = 0;
	        current = 0;
	      }
	      start = 26;
	    }

	    return res;
	  };

	  Red.prototype.convertTo = function convertTo (num) {
	    var r = num.umod(this.m);

	    return r === num ? r.clone() : r;
	  };

	  Red.prototype.convertFrom = function convertFrom (num) {
	    var res = num.clone();
	    res.red = null;
	    return res;
	  };

	  //
	  // Montgomery method engine
	  //

	  BN.mont = function mont (num) {
	    return new Mont(num);
	  };

	  function Mont (m) {
	    Red.call(this, m);

	    this.shift = this.m.bitLength();
	    if (this.shift % 26 !== 0) {
	      this.shift += 26 - (this.shift % 26);
	    }

	    this.r = new BN(1).iushln(this.shift);
	    this.r2 = this.imod(this.r.sqr());
	    this.rinv = this.r._invmp(this.m);

	    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
	    this.minv = this.minv.umod(this.r);
	    this.minv = this.r.sub(this.minv);
	  }
	  inherits(Mont, Red);

	  Mont.prototype.convertTo = function convertTo (num) {
	    return this.imod(num.ushln(this.shift));
	  };

	  Mont.prototype.convertFrom = function convertFrom (num) {
	    var r = this.imod(num.mul(this.rinv));
	    r.red = null;
	    return r;
	  };

	  Mont.prototype.imul = function imul (a, b) {
	    if (a.isZero() || b.isZero()) {
	      a.words[0] = 0;
	      a.length = 1;
	      return a;
	    }

	    var t = a.imul(b);
	    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
	    var u = t.isub(c).iushrn(this.shift);
	    var res = u;

	    if (u.cmp(this.m) >= 0) {
	      res = u.isub(this.m);
	    } else if (u.cmpn(0) < 0) {
	      res = u.iadd(this.m);
	    }

	    return res._forceRed(this);
	  };

	  Mont.prototype.mul = function mul (a, b) {
	    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

	    var t = a.mul(b);
	    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
	    var u = t.isub(c).iushrn(this.shift);
	    var res = u;
	    if (u.cmp(this.m) >= 0) {
	      res = u.isub(this.m);
	    } else if (u.cmpn(0) < 0) {
	      res = u.iadd(this.m);
	    }

	    return res._forceRed(this);
	  };

	  Mont.prototype.invm = function invm (a) {
	    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
	    var res = this.imod(a._invmp(this.m).mul(this.r2));
	    return res._forceRed(this);
	  };
	})(module, commonjsGlobal);
	});

	const version$i = "logger/5.7.0";

	let _permanentCensorErrors = false;
	let _censorErrors = false;
	const LogLevels = { debug: 1, "default": 2, info: 2, warning: 3, error: 4, off: 5 };
	let _logLevel = LogLevels["default"];
	let _globalLogger = null;
	function _checkNormalize() {
	    try {
	        const missing = [];
	        // Make sure all forms of normalization are supported
	        ["NFD", "NFC", "NFKD", "NFKC"].forEach((form) => {
	            try {
	                if ("test".normalize(form) !== "test") {
	                    throw new Error("bad normalize");
	                }
	                ;
	            }
	            catch (error) {
	                missing.push(form);
	            }
	        });
	        if (missing.length) {
	            throw new Error("missing " + missing.join(", "));
	        }
	        if (String.fromCharCode(0xe9).normalize("NFD") !== String.fromCharCode(0x65, 0x0301)) {
	            throw new Error("broken implementation");
	        }
	    }
	    catch (error) {
	        return error.message;
	    }
	    return null;
	}
	const _normalizeError = _checkNormalize();
	var LogLevel;
	(function (LogLevel) {
	    LogLevel["DEBUG"] = "DEBUG";
	    LogLevel["INFO"] = "INFO";
	    LogLevel["WARNING"] = "WARNING";
	    LogLevel["ERROR"] = "ERROR";
	    LogLevel["OFF"] = "OFF";
	})(LogLevel || (LogLevel = {}));
	var ErrorCode;
	(function (ErrorCode) {
	    ///////////////////
	    // Generic Errors
	    // Unknown Error
	    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
	    // Not Implemented
	    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
	    // Unsupported Operation
	    //   - operation
	    ErrorCode["UNSUPPORTED_OPERATION"] = "UNSUPPORTED_OPERATION";
	    // Network Error (i.e. Ethereum Network, such as an invalid chain ID)
	    //   - event ("noNetwork" is not re-thrown in provider.ready; otherwise thrown)
	    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
	    // Some sort of bad response from the server
	    ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
	    // Timeout
	    ErrorCode["TIMEOUT"] = "TIMEOUT";
	    ///////////////////
	    // Operational  Errors
	    // Buffer Overrun
	    ErrorCode["BUFFER_OVERRUN"] = "BUFFER_OVERRUN";
	    // Numeric Fault
	    //   - operation: the operation being executed
	    //   - fault: the reason this faulted
	    ErrorCode["NUMERIC_FAULT"] = "NUMERIC_FAULT";
	    ///////////////////
	    // Argument Errors
	    // Missing new operator to an object
	    //  - name: The name of the class
	    ErrorCode["MISSING_NEW"] = "MISSING_NEW";
	    // Invalid argument (e.g. value is incompatible with type) to a function:
	    //   - argument: The argument name that was invalid
	    //   - value: The value of the argument
	    ErrorCode["INVALID_ARGUMENT"] = "INVALID_ARGUMENT";
	    // Missing argument to a function:
	    //   - count: The number of arguments received
	    //   - expectedCount: The number of arguments expected
	    ErrorCode["MISSING_ARGUMENT"] = "MISSING_ARGUMENT";
	    // Too many arguments
	    //   - count: The number of arguments received
	    //   - expectedCount: The number of arguments expected
	    ErrorCode["UNEXPECTED_ARGUMENT"] = "UNEXPECTED_ARGUMENT";
	    ///////////////////
	    // Blockchain Errors
	    // Call exception
	    //  - transaction: the transaction
	    //  - address?: the contract address
	    //  - args?: The arguments passed into the function
	    //  - method?: The Solidity method signature
	    //  - errorSignature?: The EIP848 error signature
	    //  - errorArgs?: The EIP848 error parameters
	    //  - reason: The reason (only for EIP848 "Error(string)")
	    ErrorCode["CALL_EXCEPTION"] = "CALL_EXCEPTION";
	    // Insufficient funds (< value + gasLimit * gasPrice)
	    //   - transaction: the transaction attempted
	    ErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
	    // Nonce has already been used
	    //   - transaction: the transaction attempted
	    ErrorCode["NONCE_EXPIRED"] = "NONCE_EXPIRED";
	    // The replacement fee for the transaction is too low
	    //   - transaction: the transaction attempted
	    ErrorCode["REPLACEMENT_UNDERPRICED"] = "REPLACEMENT_UNDERPRICED";
	    // The gas limit could not be estimated
	    //   - transaction: the transaction passed to estimateGas
	    ErrorCode["UNPREDICTABLE_GAS_LIMIT"] = "UNPREDICTABLE_GAS_LIMIT";
	    // The transaction was replaced by one with a higher gas price
	    //   - reason: "cancelled", "replaced" or "repriced"
	    //   - cancelled: true if reason == "cancelled" or reason == "replaced")
	    //   - hash: original transaction hash
	    //   - replacement: the full TransactionsResponse for the replacement
	    //   - receipt: the receipt of the replacement
	    ErrorCode["TRANSACTION_REPLACED"] = "TRANSACTION_REPLACED";
	    ///////////////////
	    // Interaction Errors
	    // The user rejected the action, such as signing a message or sending
	    // a transaction
	    ErrorCode["ACTION_REJECTED"] = "ACTION_REJECTED";
	})(ErrorCode || (ErrorCode = {}));
	const HEX = "0123456789abcdef";
	class Logger {
	    constructor(version) {
	        Object.defineProperty(this, "version", {
	            enumerable: true,
	            value: version,
	            writable: false
	        });
	    }
	    _log(logLevel, args) {
	        const level = logLevel.toLowerCase();
	        if (LogLevels[level] == null) {
	            this.throwArgumentError("invalid log level name", "logLevel", logLevel);
	        }
	        if (_logLevel > LogLevels[level]) {
	            return;
	        }
	        console.log.apply(console, args);
	    }
	    debug(...args) {
	        this._log(Logger.levels.DEBUG, args);
	    }
	    info(...args) {
	        this._log(Logger.levels.INFO, args);
	    }
	    warn(...args) {
	        this._log(Logger.levels.WARNING, args);
	    }
	    makeError(message, code, params) {
	        // Errors are being censored
	        if (_censorErrors) {
	            return this.makeError("censored error", code, {});
	        }
	        if (!code) {
	            code = Logger.errors.UNKNOWN_ERROR;
	        }
	        if (!params) {
	            params = {};
	        }
	        const messageDetails = [];
	        Object.keys(params).forEach((key) => {
	            const value = params[key];
	            try {
	                if (value instanceof Uint8Array) {
	                    let hex = "";
	                    for (let i = 0; i < value.length; i++) {
	                        hex += HEX[value[i] >> 4];
	                        hex += HEX[value[i] & 0x0f];
	                    }
	                    messageDetails.push(key + "=Uint8Array(0x" + hex + ")");
	                }
	                else {
	                    messageDetails.push(key + "=" + JSON.stringify(value));
	                }
	            }
	            catch (error) {
	                messageDetails.push(key + "=" + JSON.stringify(params[key].toString()));
	            }
	        });
	        messageDetails.push(`code=${code}`);
	        messageDetails.push(`version=${this.version}`);
	        const reason = message;
	        let url = "";
	        switch (code) {
	            case ErrorCode.NUMERIC_FAULT: {
	                url = "NUMERIC_FAULT";
	                const fault = message;
	                switch (fault) {
	                    case "overflow":
	                    case "underflow":
	                    case "division-by-zero":
	                        url += "-" + fault;
	                        break;
	                    case "negative-power":
	                    case "negative-width":
	                        url += "-unsupported";
	                        break;
	                    case "unbound-bitwise-result":
	                        url += "-unbound-result";
	                        break;
	                }
	                break;
	            }
	            case ErrorCode.CALL_EXCEPTION:
	            case ErrorCode.INSUFFICIENT_FUNDS:
	            case ErrorCode.MISSING_NEW:
	            case ErrorCode.NONCE_EXPIRED:
	            case ErrorCode.REPLACEMENT_UNDERPRICED:
	            case ErrorCode.TRANSACTION_REPLACED:
	            case ErrorCode.UNPREDICTABLE_GAS_LIMIT:
	                url = code;
	                break;
	        }
	        if (url) {
	            message += " [ See: https:/\/links.ethers.org/v5-errors-" + url + " ]";
	        }
	        if (messageDetails.length) {
	            message += " (" + messageDetails.join(", ") + ")";
	        }
	        // @TODO: Any??
	        const error = new Error(message);
	        error.reason = reason;
	        error.code = code;
	        Object.keys(params).forEach(function (key) {
	            error[key] = params[key];
	        });
	        return error;
	    }
	    throwError(message, code, params) {
	        throw this.makeError(message, code, params);
	    }
	    throwArgumentError(message, name, value) {
	        return this.throwError(message, Logger.errors.INVALID_ARGUMENT, {
	            argument: name,
	            value: value
	        });
	    }
	    assert(condition, message, code, params) {
	        if (!!condition) {
	            return;
	        }
	        this.throwError(message, code, params);
	    }
	    assertArgument(condition, message, name, value) {
	        if (!!condition) {
	            return;
	        }
	        this.throwArgumentError(message, name, value);
	    }
	    checkNormalize(message) {
	        if (_normalizeError) {
	            this.throwError("platform missing String.prototype.normalize", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "String.prototype.normalize", form: _normalizeError
	            });
	        }
	    }
	    checkSafeUint53(value, message) {
	        if (typeof (value) !== "number") {
	            return;
	        }
	        if (message == null) {
	            message = "value not safe";
	        }
	        if (value < 0 || value >= 0x1fffffffffffff) {
	            this.throwError(message, Logger.errors.NUMERIC_FAULT, {
	                operation: "checkSafeInteger",
	                fault: "out-of-safe-range",
	                value: value
	            });
	        }
	        if (value % 1) {
	            this.throwError(message, Logger.errors.NUMERIC_FAULT, {
	                operation: "checkSafeInteger",
	                fault: "non-integer",
	                value: value
	            });
	        }
	    }
	    checkArgumentCount(count, expectedCount, message) {
	        if (message) {
	            message = ": " + message;
	        }
	        else {
	            message = "";
	        }
	        if (count < expectedCount) {
	            this.throwError("missing argument" + message, Logger.errors.MISSING_ARGUMENT, {
	                count: count,
	                expectedCount: expectedCount
	            });
	        }
	        if (count > expectedCount) {
	            this.throwError("too many arguments" + message, Logger.errors.UNEXPECTED_ARGUMENT, {
	                count: count,
	                expectedCount: expectedCount
	            });
	        }
	    }
	    checkNew(target, kind) {
	        if (target === Object || target == null) {
	            this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
	        }
	    }
	    checkAbstract(target, kind) {
	        if (target === kind) {
	            this.throwError("cannot instantiate abstract class " + JSON.stringify(kind.name) + " directly; use a sub-class", Logger.errors.UNSUPPORTED_OPERATION, { name: target.name, operation: "new" });
	        }
	        else if (target === Object || target == null) {
	            this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
	        }
	    }
	    static globalLogger() {
	        if (!_globalLogger) {
	            _globalLogger = new Logger(version$i);
	        }
	        return _globalLogger;
	    }
	    static setCensorship(censorship, permanent) {
	        if (!censorship && permanent) {
	            this.globalLogger().throwError("cannot permanently disable censorship", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "setCensorship"
	            });
	        }
	        if (_permanentCensorErrors) {
	            if (!censorship) {
	                return;
	            }
	            this.globalLogger().throwError("error censorship permanent", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "setCensorship"
	            });
	        }
	        _censorErrors = !!censorship;
	        _permanentCensorErrors = !!permanent;
	    }
	    static setLogLevel(logLevel) {
	        const level = LogLevels[logLevel.toLowerCase()];
	        if (level == null) {
	            Logger.globalLogger().warn("invalid log level - " + logLevel);
	            return;
	        }
	        _logLevel = level;
	    }
	    static from(version) {
	        return new Logger(version);
	    }
	}
	Logger.errors = ErrorCode;
	Logger.levels = LogLevel;

	const version$h = "bytes/5.7.0";

	const logger$p = new Logger(version$h);
	///////////////////////////////
	function isHexable(value) {
	    return !!(value.toHexString);
	}
	function addSlice(array) {
	    if (array.slice) {
	        return array;
	    }
	    array.slice = function () {
	        const args = Array.prototype.slice.call(arguments);
	        return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
	    };
	    return array;
	}
	function isBytesLike(value) {
	    return ((isHexString(value) && !(value.length % 2)) || isBytes(value));
	}
	function isInteger(value) {
	    return (typeof (value) === "number" && value == value && (value % 1) === 0);
	}
	function isBytes(value) {
	    if (value == null) {
	        return false;
	    }
	    if (value.constructor === Uint8Array) {
	        return true;
	    }
	    if (typeof (value) === "string") {
	        return false;
	    }
	    if (!isInteger(value.length) || value.length < 0) {
	        return false;
	    }
	    for (let i = 0; i < value.length; i++) {
	        const v = value[i];
	        if (!isInteger(v) || v < 0 || v >= 256) {
	            return false;
	        }
	    }
	    return true;
	}
	function arrayify(value, options) {
	    if (!options) {
	        options = {};
	    }
	    if (typeof (value) === "number") {
	        logger$p.checkSafeUint53(value, "invalid arrayify value");
	        const result = [];
	        while (value) {
	            result.unshift(value & 0xff);
	            value = parseInt(String(value / 256));
	        }
	        if (result.length === 0) {
	            result.push(0);
	        }
	        return addSlice(new Uint8Array(result));
	    }
	    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
	        value = "0x" + value;
	    }
	    if (isHexable(value)) {
	        value = value.toHexString();
	    }
	    if (isHexString(value)) {
	        let hex = value.substring(2);
	        if (hex.length % 2) {
	            if (options.hexPad === "left") {
	                hex = "0" + hex;
	            }
	            else if (options.hexPad === "right") {
	                hex += "0";
	            }
	            else {
	                logger$p.throwArgumentError("hex data is odd-length", "value", value);
	            }
	        }
	        const result = [];
	        for (let i = 0; i < hex.length; i += 2) {
	            result.push(parseInt(hex.substring(i, i + 2), 16));
	        }
	        return addSlice(new Uint8Array(result));
	    }
	    if (isBytes(value)) {
	        return addSlice(new Uint8Array(value));
	    }
	    return logger$p.throwArgumentError("invalid arrayify value", "value", value);
	}
	function concat(items) {
	    const objects = items.map(item => arrayify(item));
	    const length = objects.reduce((accum, item) => (accum + item.length), 0);
	    const result = new Uint8Array(length);
	    objects.reduce((offset, object) => {
	        result.set(object, offset);
	        return offset + object.length;
	    }, 0);
	    return addSlice(result);
	}
	function stripZeros(value) {
	    let result = arrayify(value);
	    if (result.length === 0) {
	        return result;
	    }
	    // Find the first non-zero entry
	    let start = 0;
	    while (start < result.length && result[start] === 0) {
	        start++;
	    }
	    // If we started with zeros, strip them
	    if (start) {
	        result = result.slice(start);
	    }
	    return result;
	}
	function zeroPad(value, length) {
	    value = arrayify(value);
	    if (value.length > length) {
	        logger$p.throwArgumentError("value out of range", "value", arguments[0]);
	    }
	    const result = new Uint8Array(length);
	    result.set(value, length - value.length);
	    return addSlice(result);
	}
	function isHexString(value, length) {
	    if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
	        return false;
	    }
	    if (length && value.length !== 2 + 2 * length) {
	        return false;
	    }
	    return true;
	}
	const HexCharacters = "0123456789abcdef";
	function hexlify(value, options) {
	    if (!options) {
	        options = {};
	    }
	    if (typeof (value) === "number") {
	        logger$p.checkSafeUint53(value, "invalid hexlify value");
	        let hex = "";
	        while (value) {
	            hex = HexCharacters[value & 0xf] + hex;
	            value = Math.floor(value / 16);
	        }
	        if (hex.length) {
	            if (hex.length % 2) {
	                hex = "0" + hex;
	            }
	            return "0x" + hex;
	        }
	        return "0x00";
	    }
	    if (typeof (value) === "bigint") {
	        value = value.toString(16);
	        if (value.length % 2) {
	            return ("0x0" + value);
	        }
	        return "0x" + value;
	    }
	    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
	        value = "0x" + value;
	    }
	    if (isHexable(value)) {
	        return value.toHexString();
	    }
	    if (isHexString(value)) {
	        if (value.length % 2) {
	            if (options.hexPad === "left") {
	                value = "0x0" + value.substring(2);
	            }
	            else if (options.hexPad === "right") {
	                value += "0";
	            }
	            else {
	                logger$p.throwArgumentError("hex data is odd-length", "value", value);
	            }
	        }
	        return value.toLowerCase();
	    }
	    if (isBytes(value)) {
	        let result = "0x";
	        for (let i = 0; i < value.length; i++) {
	            let v = value[i];
	            result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
	        }
	        return result;
	    }
	    return logger$p.throwArgumentError("invalid hexlify value", "value", value);
	}
	/*
	function unoddify(value: BytesLike | Hexable | number): BytesLike | Hexable | number {
	    if (typeof(value) === "string" && value.length % 2 && value.substring(0, 2) === "0x") {
	        return "0x0" + value.substring(2);
	    }
	    return value;
	}
	*/
	function hexDataLength(data) {
	    if (typeof (data) !== "string") {
	        data = hexlify(data);
	    }
	    else if (!isHexString(data) || (data.length % 2)) {
	        return null;
	    }
	    return (data.length - 2) / 2;
	}
	function hexDataSlice(data, offset, endOffset) {
	    if (typeof (data) !== "string") {
	        data = hexlify(data);
	    }
	    else if (!isHexString(data) || (data.length % 2)) {
	        logger$p.throwArgumentError("invalid hexData", "value", data);
	    }
	    offset = 2 + 2 * offset;
	    if (endOffset != null) {
	        return "0x" + data.substring(offset, 2 + 2 * endOffset);
	    }
	    return "0x" + data.substring(offset);
	}
	function hexConcat(items) {
	    let result = "0x";
	    items.forEach((item) => {
	        result += hexlify(item).substring(2);
	    });
	    return result;
	}
	function hexValue(value) {
	    const trimmed = hexStripZeros(hexlify(value, { hexPad: "left" }));
	    if (trimmed === "0x") {
	        return "0x0";
	    }
	    return trimmed;
	}
	function hexStripZeros(value) {
	    if (typeof (value) !== "string") {
	        value = hexlify(value);
	    }
	    if (!isHexString(value)) {
	        logger$p.throwArgumentError("invalid hex string", "value", value);
	    }
	    value = value.substring(2);
	    let offset = 0;
	    while (offset < value.length && value[offset] === "0") {
	        offset++;
	    }
	    return "0x" + value.substring(offset);
	}
	function hexZeroPad(value, length) {
	    if (typeof (value) !== "string") {
	        value = hexlify(value);
	    }
	    else if (!isHexString(value)) {
	        logger$p.throwArgumentError("invalid hex string", "value", value);
	    }
	    if (value.length > 2 * length + 2) {
	        logger$p.throwArgumentError("value out of range", "value", arguments[1]);
	    }
	    while (value.length < 2 * length + 2) {
	        value = "0x0" + value.substring(2);
	    }
	    return value;
	}
	function splitSignature(signature) {
	    const result = {
	        r: "0x",
	        s: "0x",
	        _vs: "0x",
	        recoveryParam: 0,
	        v: 0,
	        yParityAndS: "0x",
	        compact: "0x"
	    };
	    if (isBytesLike(signature)) {
	        let bytes = arrayify(signature);
	        // Get the r, s and v
	        if (bytes.length === 64) {
	            // EIP-2098; pull the v from the top bit of s and clear it
	            result.v = 27 + (bytes[32] >> 7);
	            bytes[32] &= 0x7f;
	            result.r = hexlify(bytes.slice(0, 32));
	            result.s = hexlify(bytes.slice(32, 64));
	        }
	        else if (bytes.length === 65) {
	            result.r = hexlify(bytes.slice(0, 32));
	            result.s = hexlify(bytes.slice(32, 64));
	            result.v = bytes[64];
	        }
	        else {
	            logger$p.throwArgumentError("invalid signature string", "signature", signature);
	        }
	        // Allow a recid to be used as the v
	        if (result.v < 27) {
	            if (result.v === 0 || result.v === 1) {
	                result.v += 27;
	            }
	            else {
	                logger$p.throwArgumentError("signature invalid v byte", "signature", signature);
	            }
	        }
	        // Compute recoveryParam from v
	        result.recoveryParam = 1 - (result.v % 2);
	        // Compute _vs from recoveryParam and s
	        if (result.recoveryParam) {
	            bytes[32] |= 0x80;
	        }
	        result._vs = hexlify(bytes.slice(32, 64));
	    }
	    else {
	        result.r = signature.r;
	        result.s = signature.s;
	        result.v = signature.v;
	        result.recoveryParam = signature.recoveryParam;
	        result._vs = signature._vs;
	        // If the _vs is available, use it to populate missing s, v and recoveryParam
	        // and verify non-missing s, v and recoveryParam
	        if (result._vs != null) {
	            const vs = zeroPad(arrayify(result._vs), 32);
	            result._vs = hexlify(vs);
	            // Set or check the recid
	            const recoveryParam = ((vs[0] >= 128) ? 1 : 0);
	            if (result.recoveryParam == null) {
	                result.recoveryParam = recoveryParam;
	            }
	            else if (result.recoveryParam !== recoveryParam) {
	                logger$p.throwArgumentError("signature recoveryParam mismatch _vs", "signature", signature);
	            }
	            // Set or check the s
	            vs[0] &= 0x7f;
	            const s = hexlify(vs);
	            if (result.s == null) {
	                result.s = s;
	            }
	            else if (result.s !== s) {
	                logger$p.throwArgumentError("signature v mismatch _vs", "signature", signature);
	            }
	        }
	        // Use recid and v to populate each other
	        if (result.recoveryParam == null) {
	            if (result.v == null) {
	                logger$p.throwArgumentError("signature missing v and recoveryParam", "signature", signature);
	            }
	            else if (result.v === 0 || result.v === 1) {
	                result.recoveryParam = result.v;
	            }
	            else {
	                result.recoveryParam = 1 - (result.v % 2);
	            }
	        }
	        else {
	            if (result.v == null) {
	                result.v = 27 + result.recoveryParam;
	            }
	            else {
	                const recId = (result.v === 0 || result.v === 1) ? result.v : (1 - (result.v % 2));
	                if (result.recoveryParam !== recId) {
	                    logger$p.throwArgumentError("signature recoveryParam mismatch v", "signature", signature);
	                }
	            }
	        }
	        if (result.r == null || !isHexString(result.r)) {
	            logger$p.throwArgumentError("signature missing or invalid r", "signature", signature);
	        }
	        else {
	            result.r = hexZeroPad(result.r, 32);
	        }
	        if (result.s == null || !isHexString(result.s)) {
	            logger$p.throwArgumentError("signature missing or invalid s", "signature", signature);
	        }
	        else {
	            result.s = hexZeroPad(result.s, 32);
	        }
	        const vs = arrayify(result.s);
	        if (vs[0] >= 128) {
	            logger$p.throwArgumentError("signature s out of range", "signature", signature);
	        }
	        if (result.recoveryParam) {
	            vs[0] |= 0x80;
	        }
	        const _vs = hexlify(vs);
	        if (result._vs) {
	            if (!isHexString(result._vs)) {
	                logger$p.throwArgumentError("signature invalid _vs", "signature", signature);
	            }
	            result._vs = hexZeroPad(result._vs, 32);
	        }
	        // Set or check the _vs
	        if (result._vs == null) {
	            result._vs = _vs;
	        }
	        else if (result._vs !== _vs) {
	            logger$p.throwArgumentError("signature _vs mismatch v and s", "signature", signature);
	        }
	    }
	    result.yParityAndS = result._vs;
	    result.compact = result.r + result.yParityAndS.substring(2);
	    return result;
	}

	const version$g = "bignumber/5.7.0";

	var BN = bn$1.BN;
	const logger$o = new Logger(version$g);
	const _constructorGuard$3 = {};
	const MAX_SAFE = 0x1fffffffffffff;
	function isBigNumberish(value) {
	    return (value != null) && (BigNumber.isBigNumber(value) ||
	        (typeof (value) === "number" && (value % 1) === 0) ||
	        (typeof (value) === "string" && !!value.match(/^-?[0-9]+$/)) ||
	        isHexString(value) ||
	        (typeof (value) === "bigint") ||
	        isBytes(value));
	}
	// Only warn about passing 10 into radix once
	let _warnedToStringRadix = false;
	class BigNumber {
	    constructor(constructorGuard, hex) {
	        if (constructorGuard !== _constructorGuard$3) {
	            logger$o.throwError("cannot call constructor directly; use BigNumber.from", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "new (BigNumber)"
	            });
	        }
	        this._hex = hex;
	        this._isBigNumber = true;
	        Object.freeze(this);
	    }
	    fromTwos(value) {
	        return toBigNumber(toBN(this).fromTwos(value));
	    }
	    toTwos(value) {
	        return toBigNumber(toBN(this).toTwos(value));
	    }
	    abs() {
	        if (this._hex[0] === "-") {
	            return BigNumber.from(this._hex.substring(1));
	        }
	        return this;
	    }
	    add(other) {
	        return toBigNumber(toBN(this).add(toBN(other)));
	    }
	    sub(other) {
	        return toBigNumber(toBN(this).sub(toBN(other)));
	    }
	    div(other) {
	        const o = BigNumber.from(other);
	        if (o.isZero()) {
	            throwFault$1("division-by-zero", "div");
	        }
	        return toBigNumber(toBN(this).div(toBN(other)));
	    }
	    mul(other) {
	        return toBigNumber(toBN(this).mul(toBN(other)));
	    }
	    mod(other) {
	        const value = toBN(other);
	        if (value.isNeg()) {
	            throwFault$1("division-by-zero", "mod");
	        }
	        return toBigNumber(toBN(this).umod(value));
	    }
	    pow(other) {
	        const value = toBN(other);
	        if (value.isNeg()) {
	            throwFault$1("negative-power", "pow");
	        }
	        return toBigNumber(toBN(this).pow(value));
	    }
	    and(other) {
	        const value = toBN(other);
	        if (this.isNegative() || value.isNeg()) {
	            throwFault$1("unbound-bitwise-result", "and");
	        }
	        return toBigNumber(toBN(this).and(value));
	    }
	    or(other) {
	        const value = toBN(other);
	        if (this.isNegative() || value.isNeg()) {
	            throwFault$1("unbound-bitwise-result", "or");
	        }
	        return toBigNumber(toBN(this).or(value));
	    }
	    xor(other) {
	        const value = toBN(other);
	        if (this.isNegative() || value.isNeg()) {
	            throwFault$1("unbound-bitwise-result", "xor");
	        }
	        return toBigNumber(toBN(this).xor(value));
	    }
	    mask(value) {
	        if (this.isNegative() || value < 0) {
	            throwFault$1("negative-width", "mask");
	        }
	        return toBigNumber(toBN(this).maskn(value));
	    }
	    shl(value) {
	        if (this.isNegative() || value < 0) {
	            throwFault$1("negative-width", "shl");
	        }
	        return toBigNumber(toBN(this).shln(value));
	    }
	    shr(value) {
	        if (this.isNegative() || value < 0) {
	            throwFault$1("negative-width", "shr");
	        }
	        return toBigNumber(toBN(this).shrn(value));
	    }
	    eq(other) {
	        return toBN(this).eq(toBN(other));
	    }
	    lt(other) {
	        return toBN(this).lt(toBN(other));
	    }
	    lte(other) {
	        return toBN(this).lte(toBN(other));
	    }
	    gt(other) {
	        return toBN(this).gt(toBN(other));
	    }
	    gte(other) {
	        return toBN(this).gte(toBN(other));
	    }
	    isNegative() {
	        return (this._hex[0] === "-");
	    }
	    isZero() {
	        return toBN(this).isZero();
	    }
	    toNumber() {
	        try {
	            return toBN(this).toNumber();
	        }
	        catch (error) {
	            throwFault$1("overflow", "toNumber", this.toString());
	        }
	        return null;
	    }
	    toBigInt() {
	        try {
	            return BigInt(this.toString());
	        }
	        catch (e) { }
	        return logger$o.throwError("this platform does not support BigInt", Logger.errors.UNSUPPORTED_OPERATION, {
	            value: this.toString()
	        });
	    }
	    toString() {
	        // Lots of people expect this, which we do not support, so check (See: #889)
	        if (arguments.length > 0) {
	            if (arguments[0] === 10) {
	                if (!_warnedToStringRadix) {
	                    _warnedToStringRadix = true;
	                    logger$o.warn("BigNumber.toString does not accept any parameters; base-10 is assumed");
	                }
	            }
	            else if (arguments[0] === 16) {
	                logger$o.throwError("BigNumber.toString does not accept any parameters; use bigNumber.toHexString()", Logger.errors.UNEXPECTED_ARGUMENT, {});
	            }
	            else {
	                logger$o.throwError("BigNumber.toString does not accept parameters", Logger.errors.UNEXPECTED_ARGUMENT, {});
	            }
	        }
	        return toBN(this).toString(10);
	    }
	    toHexString() {
	        return this._hex;
	    }
	    toJSON(key) {
	        return { type: "BigNumber", hex: this.toHexString() };
	    }
	    static from(value) {
	        if (value instanceof BigNumber) {
	            return value;
	        }
	        if (typeof (value) === "string") {
	            if (value.match(/^-?0x[0-9a-f]+$/i)) {
	                return new BigNumber(_constructorGuard$3, toHex$1(value));
	            }
	            if (value.match(/^-?[0-9]+$/)) {
	                return new BigNumber(_constructorGuard$3, toHex$1(new BN(value)));
	            }
	            return logger$o.throwArgumentError("invalid BigNumber string", "value", value);
	        }
	        if (typeof (value) === "number") {
	            if (value % 1) {
	                throwFault$1("underflow", "BigNumber.from", value);
	            }
	            if (value >= MAX_SAFE || value <= -MAX_SAFE) {
	                throwFault$1("overflow", "BigNumber.from", value);
	            }
	            return BigNumber.from(String(value));
	        }
	        const anyValue = value;
	        if (typeof (anyValue) === "bigint") {
	            return BigNumber.from(anyValue.toString());
	        }
	        if (isBytes(anyValue)) {
	            return BigNumber.from(hexlify(anyValue));
	        }
	        if (anyValue) {
	            // Hexable interface (takes priority)
	            if (anyValue.toHexString) {
	                const hex = anyValue.toHexString();
	                if (typeof (hex) === "string") {
	                    return BigNumber.from(hex);
	                }
	            }
	            else {
	                // For now, handle legacy JSON-ified values (goes away in v6)
	                let hex = anyValue._hex;
	                // New-form JSON
	                if (hex == null && anyValue.type === "BigNumber") {
	                    hex = anyValue.hex;
	                }
	                if (typeof (hex) === "string") {
	                    if (isHexString(hex) || (hex[0] === "-" && isHexString(hex.substring(1)))) {
	                        return BigNumber.from(hex);
	                    }
	                }
	            }
	        }
	        return logger$o.throwArgumentError("invalid BigNumber value", "value", value);
	    }
	    static isBigNumber(value) {
	        return !!(value && value._isBigNumber);
	    }
	}
	// Normalize the hex string
	function toHex$1(value) {
	    // For BN, call on the hex string
	    if (typeof (value) !== "string") {
	        return toHex$1(value.toString(16));
	    }
	    // If negative, prepend the negative sign to the normalized positive value
	    if (value[0] === "-") {
	        // Strip off the negative sign
	        value = value.substring(1);
	        // Cannot have multiple negative signs (e.g. "--0x04")
	        if (value[0] === "-") {
	            logger$o.throwArgumentError("invalid hex", "value", value);
	        }
	        // Call toHex on the positive component
	        value = toHex$1(value);
	        // Do not allow "-0x00"
	        if (value === "0x00") {
	            return value;
	        }
	        // Negate the value
	        return "-" + value;
	    }
	    // Add a "0x" prefix if missing
	    if (value.substring(0, 2) !== "0x") {
	        value = "0x" + value;
	    }
	    // Normalize zero
	    if (value === "0x") {
	        return "0x00";
	    }
	    // Make the string even length
	    if (value.length % 2) {
	        value = "0x0" + value.substring(2);
	    }
	    // Trim to smallest even-length string
	    while (value.length > 4 && value.substring(0, 4) === "0x00") {
	        value = "0x" + value.substring(4);
	    }
	    return value;
	}
	function toBigNumber(value) {
	    return BigNumber.from(toHex$1(value));
	}
	function toBN(value) {
	    const hex = BigNumber.from(value).toHexString();
	    if (hex[0] === "-") {
	        return (new BN("-" + hex.substring(3), 16));
	    }
	    return new BN(hex.substring(2), 16);
	}
	function throwFault$1(fault, operation, value) {
	    const params = { fault: fault, operation: operation };
	    if (value != null) {
	        params.value = value;
	    }
	    return logger$o.throwError(fault, Logger.errors.NUMERIC_FAULT, params);
	}
	// value should have no prefix
	function _base36To16(value) {
	    return (new BN(value, 36)).toString(16);
	}

	const logger$n = new Logger(version$g);
	const _constructorGuard$2 = {};
	const Zero$2 = BigNumber.from(0);
	const NegativeOne$2 = BigNumber.from(-1);
	function throwFault(message, fault, operation, value) {
	    const params = { fault: fault, operation: operation };
	    if (value !== undefined) {
	        params.value = value;
	    }
	    return logger$n.throwError(message, Logger.errors.NUMERIC_FAULT, params);
	}
	// Constant to pull zeros from for multipliers
	let zeros = "0";
	while (zeros.length < 256) {
	    zeros += zeros;
	}
	// Returns a string "1" followed by decimal "0"s
	function getMultiplier(decimals) {
	    if (typeof (decimals) !== "number") {
	        try {
	            decimals = BigNumber.from(decimals).toNumber();
	        }
	        catch (e) { }
	    }
	    if (typeof (decimals) === "number" && decimals >= 0 && decimals <= 256 && !(decimals % 1)) {
	        return ("1" + zeros.substring(0, decimals));
	    }
	    return logger$n.throwArgumentError("invalid decimal size", "decimals", decimals);
	}
	function formatFixed(value, decimals) {
	    if (decimals == null) {
	        decimals = 0;
	    }
	    const multiplier = getMultiplier(decimals);
	    // Make sure wei is a big number (convert as necessary)
	    value = BigNumber.from(value);
	    const negative = value.lt(Zero$2);
	    if (negative) {
	        value = value.mul(NegativeOne$2);
	    }
	    let fraction = value.mod(multiplier).toString();
	    while (fraction.length < multiplier.length - 1) {
	        fraction = "0" + fraction;
	    }
	    // Strip training 0
	    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
	    const whole = value.div(multiplier).toString();
	    if (multiplier.length === 1) {
	        value = whole;
	    }
	    else {
	        value = whole + "." + fraction;
	    }
	    if (negative) {
	        value = "-" + value;
	    }
	    return value;
	}
	function parseFixed(value, decimals) {
	    if (decimals == null) {
	        decimals = 0;
	    }
	    const multiplier = getMultiplier(decimals);
	    if (typeof (value) !== "string" || !value.match(/^-?[0-9.]+$/)) {
	        logger$n.throwArgumentError("invalid decimal value", "value", value);
	    }
	    // Is it negative?
	    const negative = (value.substring(0, 1) === "-");
	    if (negative) {
	        value = value.substring(1);
	    }
	    if (value === ".") {
	        logger$n.throwArgumentError("missing value", "value", value);
	    }
	    // Split it into a whole and fractional part
	    const comps = value.split(".");
	    if (comps.length > 2) {
	        logger$n.throwArgumentError("too many decimal points", "value", value);
	    }
	    let whole = comps[0], fraction = comps[1];
	    if (!whole) {
	        whole = "0";
	    }
	    if (!fraction) {
	        fraction = "0";
	    }
	    // Trim trailing zeros
	    while (fraction[fraction.length - 1] === "0") {
	        fraction = fraction.substring(0, fraction.length - 1);
	    }
	    // Check the fraction doesn't exceed our decimals size
	    if (fraction.length > multiplier.length - 1) {
	        throwFault("fractional component exceeds decimals", "underflow", "parseFixed");
	    }
	    // If decimals is 0, we have an empty string for fraction
	    if (fraction === "") {
	        fraction = "0";
	    }
	    // Fully pad the string with zeros to get to wei
	    while (fraction.length < multiplier.length - 1) {
	        fraction += "0";
	    }
	    const wholeValue = BigNumber.from(whole);
	    const fractionValue = BigNumber.from(fraction);
	    let wei = (wholeValue.mul(multiplier)).add(fractionValue);
	    if (negative) {
	        wei = wei.mul(NegativeOne$2);
	    }
	    return wei;
	}
	class FixedFormat {
	    constructor(constructorGuard, signed, width, decimals) {
	        if (constructorGuard !== _constructorGuard$2) {
	            logger$n.throwError("cannot use FixedFormat constructor; use FixedFormat.from", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "new FixedFormat"
	            });
	        }
	        this.signed = signed;
	        this.width = width;
	        this.decimals = decimals;
	        this.name = (signed ? "" : "u") + "fixed" + String(width) + "x" + String(decimals);
	        this._multiplier = getMultiplier(decimals);
	        Object.freeze(this);
	    }
	    static from(value) {
	        if (value instanceof FixedFormat) {
	            return value;
	        }
	        if (typeof (value) === "number") {
	            value = `fixed128x${value}`;
	        }
	        let signed = true;
	        let width = 128;
	        let decimals = 18;
	        if (typeof (value) === "string") {
	            if (value === "fixed") ;
	            else if (value === "ufixed") {
	                signed = false;
	            }
	            else {
	                const match = value.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);
	                if (!match) {
	                    logger$n.throwArgumentError("invalid fixed format", "format", value);
	                }
	                signed = (match[1] !== "u");
	                width = parseInt(match[2]);
	                decimals = parseInt(match[3]);
	            }
	        }
	        else if (value) {
	            const check = (key, type, defaultValue) => {
	                if (value[key] == null) {
	                    return defaultValue;
	                }
	                if (typeof (value[key]) !== type) {
	                    logger$n.throwArgumentError("invalid fixed format (" + key + " not " + type + ")", "format." + key, value[key]);
	                }
	                return value[key];
	            };
	            signed = check("signed", "boolean", signed);
	            width = check("width", "number", width);
	            decimals = check("decimals", "number", decimals);
	        }
	        if (width % 8) {
	            logger$n.throwArgumentError("invalid fixed format width (not byte aligned)", "format.width", width);
	        }
	        if (decimals > 80) {
	            logger$n.throwArgumentError("invalid fixed format (decimals too large)", "format.decimals", decimals);
	        }
	        return new FixedFormat(_constructorGuard$2, signed, width, decimals);
	    }
	}
	class FixedNumber {
	    constructor(constructorGuard, hex, value, format) {
	        if (constructorGuard !== _constructorGuard$2) {
	            logger$n.throwError("cannot use FixedNumber constructor; use FixedNumber.from", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "new FixedFormat"
	            });
	        }
	        this.format = format;
	        this._hex = hex;
	        this._value = value;
	        this._isFixedNumber = true;
	        Object.freeze(this);
	    }
	    _checkFormat(other) {
	        if (this.format.name !== other.format.name) {
	            logger$n.throwArgumentError("incompatible format; use fixedNumber.toFormat", "other", other);
	        }
	    }
	    addUnsafe(other) {
	        this._checkFormat(other);
	        const a = parseFixed(this._value, this.format.decimals);
	        const b = parseFixed(other._value, other.format.decimals);
	        return FixedNumber.fromValue(a.add(b), this.format.decimals, this.format);
	    }
	    subUnsafe(other) {
	        this._checkFormat(other);
	        const a = parseFixed(this._value, this.format.decimals);
	        const b = parseFixed(other._value, other.format.decimals);
	        return FixedNumber.fromValue(a.sub(b), this.format.decimals, this.format);
	    }
	    mulUnsafe(other) {
	        this._checkFormat(other);
	        const a = parseFixed(this._value, this.format.decimals);
	        const b = parseFixed(other._value, other.format.decimals);
	        return FixedNumber.fromValue(a.mul(b).div(this.format._multiplier), this.format.decimals, this.format);
	    }
	    divUnsafe(other) {
	        this._checkFormat(other);
	        const a = parseFixed(this._value, this.format.decimals);
	        const b = parseFixed(other._value, other.format.decimals);
	        return FixedNumber.fromValue(a.mul(this.format._multiplier).div(b), this.format.decimals, this.format);
	    }
	    floor() {
	        const comps = this.toString().split(".");
	        if (comps.length === 1) {
	            comps.push("0");
	        }
	        let result = FixedNumber.from(comps[0], this.format);
	        const hasFraction = !comps[1].match(/^(0*)$/);
	        if (this.isNegative() && hasFraction) {
	            result = result.subUnsafe(ONE.toFormat(result.format));
	        }
	        return result;
	    }
	    ceiling() {
	        const comps = this.toString().split(".");
	        if (comps.length === 1) {
	            comps.push("0");
	        }
	        let result = FixedNumber.from(comps[0], this.format);
	        const hasFraction = !comps[1].match(/^(0*)$/);
	        if (!this.isNegative() && hasFraction) {
	            result = result.addUnsafe(ONE.toFormat(result.format));
	        }
	        return result;
	    }
	    // @TODO: Support other rounding algorithms
	    round(decimals) {
	        if (decimals == null) {
	            decimals = 0;
	        }
	        // If we are already in range, we're done
	        const comps = this.toString().split(".");
	        if (comps.length === 1) {
	            comps.push("0");
	        }
	        if (decimals < 0 || decimals > 80 || (decimals % 1)) {
	            logger$n.throwArgumentError("invalid decimal count", "decimals", decimals);
	        }
	        if (comps[1].length <= decimals) {
	            return this;
	        }
	        const factor = FixedNumber.from("1" + zeros.substring(0, decimals), this.format);
	        const bump = BUMP.toFormat(this.format);
	        return this.mulUnsafe(factor).addUnsafe(bump).floor().divUnsafe(factor);
	    }
	    isZero() {
	        return (this._value === "0.0" || this._value === "0");
	    }
	    isNegative() {
	        return (this._value[0] === "-");
	    }
	    toString() { return this._value; }
	    toHexString(width) {
	        if (width == null) {
	            return this._hex;
	        }
	        if (width % 8) {
	            logger$n.throwArgumentError("invalid byte width", "width", width);
	        }
	        const hex = BigNumber.from(this._hex).fromTwos(this.format.width).toTwos(width).toHexString();
	        return hexZeroPad(hex, width / 8);
	    }
	    toUnsafeFloat() { return parseFloat(this.toString()); }
	    toFormat(format) {
	        return FixedNumber.fromString(this._value, format);
	    }
	    static fromValue(value, decimals, format) {
	        // If decimals looks more like a format, and there is no format, shift the parameters
	        if (format == null && decimals != null && !isBigNumberish(decimals)) {
	            format = decimals;
	            decimals = null;
	        }
	        if (decimals == null) {
	            decimals = 0;
	        }
	        if (format == null) {
	            format = "fixed";
	        }
	        return FixedNumber.fromString(formatFixed(value, decimals), FixedFormat.from(format));
	    }
	    static fromString(value, format) {
	        if (format == null) {
	            format = "fixed";
	        }
	        const fixedFormat = FixedFormat.from(format);
	        const numeric = parseFixed(value, fixedFormat.decimals);
	        if (!fixedFormat.signed && numeric.lt(Zero$2)) {
	            throwFault("unsigned value cannot be negative", "overflow", "value", value);
	        }
	        let hex = null;
	        if (fixedFormat.signed) {
	            hex = numeric.toTwos(fixedFormat.width).toHexString();
	        }
	        else {
	            hex = numeric.toHexString();
	            hex = hexZeroPad(hex, fixedFormat.width / 8);
	        }
	        const decimal = formatFixed(numeric, fixedFormat.decimals);
	        return new FixedNumber(_constructorGuard$2, hex, decimal, fixedFormat);
	    }
	    static fromBytes(value, format) {
	        if (format == null) {
	            format = "fixed";
	        }
	        const fixedFormat = FixedFormat.from(format);
	        if (arrayify(value).length > fixedFormat.width / 8) {
	            throw new Error("overflow");
	        }
	        let numeric = BigNumber.from(value);
	        if (fixedFormat.signed) {
	            numeric = numeric.fromTwos(fixedFormat.width);
	        }
	        const hex = numeric.toTwos((fixedFormat.signed ? 0 : 1) + fixedFormat.width).toHexString();
	        const decimal = formatFixed(numeric, fixedFormat.decimals);
	        return new FixedNumber(_constructorGuard$2, hex, decimal, fixedFormat);
	    }
	    static from(value, format) {
	        if (typeof (value) === "string") {
	            return FixedNumber.fromString(value, format);
	        }
	        if (isBytes(value)) {
	            return FixedNumber.fromBytes(value, format);
	        }
	        try {
	            return FixedNumber.fromValue(value, 0, format);
	        }
	        catch (error) {
	            // Allow NUMERIC_FAULT to bubble up
	            if (error.code !== Logger.errors.INVALID_ARGUMENT) {
	                throw error;
	            }
	        }
	        return logger$n.throwArgumentError("invalid FixedNumber value", "value", value);
	    }
	    static isFixedNumber(value) {
	        return !!(value && value._isFixedNumber);
	    }
	}
	const ONE = FixedNumber.from(1);
	const BUMP = FixedNumber.from("0.5");

	const version$f = "properties/5.7.0";

	var __awaiter$8 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$m = new Logger(version$f);
	function defineReadOnly(object, name, value) {
	    Object.defineProperty(object, name, {
	        enumerable: true,
	        value: value,
	        writable: false,
	    });
	}
	// Crawl up the constructor chain to find a static method
	function getStatic(ctor, key) {
	    for (let i = 0; i < 32; i++) {
	        if (ctor[key]) {
	            return ctor[key];
	        }
	        if (!ctor.prototype || typeof (ctor.prototype) !== "object") {
	            break;
	        }
	        ctor = Object.getPrototypeOf(ctor.prototype).constructor;
	    }
	    return null;
	}
	function resolveProperties(object) {
	    return __awaiter$8(this, void 0, void 0, function* () {
	        const promises = Object.keys(object).map((key) => {
	            const value = object[key];
	            return Promise.resolve(value).then((v) => ({ key: key, value: v }));
	        });
	        const results = yield Promise.all(promises);
	        return results.reduce((accum, result) => {
	            accum[(result.key)] = result.value;
	            return accum;
	        }, {});
	    });
	}
	function checkProperties(object, properties) {
	    if (!object || typeof (object) !== "object") {
	        logger$m.throwArgumentError("invalid object", "object", object);
	    }
	    Object.keys(object).forEach((key) => {
	        if (!properties[key]) {
	            logger$m.throwArgumentError("invalid object key - " + key, "transaction:" + key, object);
	        }
	    });
	}
	function shallowCopy(object) {
	    const result = {};
	    for (const key in object) {
	        result[key] = object[key];
	    }
	    return result;
	}
	const opaque = { bigint: true, boolean: true, "function": true, number: true, string: true };
	function _isFrozen(object) {
	    // Opaque objects are not mutable, so safe to copy by assignment
	    if (object === undefined || object === null || opaque[typeof (object)]) {
	        return true;
	    }
	    if (Array.isArray(object) || typeof (object) === "object") {
	        if (!Object.isFrozen(object)) {
	            return false;
	        }
	        const keys = Object.keys(object);
	        for (let i = 0; i < keys.length; i++) {
	            let value = null;
	            try {
	                value = object[keys[i]];
	            }
	            catch (error) {
	                // If accessing a value triggers an error, it is a getter
	                // designed to do so (e.g. Result) and is therefore "frozen"
	                continue;
	            }
	            if (!_isFrozen(value)) {
	                return false;
	            }
	        }
	        return true;
	    }
	    return logger$m.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
	}
	// Returns a new copy of object, such that no properties may be replaced.
	// New properties may be added only to objects.
	function _deepCopy(object) {
	    if (_isFrozen(object)) {
	        return object;
	    }
	    // Arrays are mutable, so we need to create a copy
	    if (Array.isArray(object)) {
	        return Object.freeze(object.map((item) => deepCopy(item)));
	    }
	    if (typeof (object) === "object") {
	        const result = {};
	        for (const key in object) {
	            const value = object[key];
	            if (value === undefined) {
	                continue;
	            }
	            defineReadOnly(result, key, deepCopy(value));
	        }
	        return result;
	    }
	    return logger$m.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
	}
	function deepCopy(object) {
	    return _deepCopy(object);
	}
	class Description {
	    constructor(info) {
	        for (const key in info) {
	            this[key] = deepCopy(info[key]);
	        }
	    }
	}

	const version$e = "abi/5.7.0";

	const logger$l = new Logger(version$e);
	const _constructorGuard$1 = {};
	let ModifiersBytes = { calldata: true, memory: true, storage: true };
	let ModifiersNest = { calldata: true, memory: true };
	function checkModifier(type, name) {
	    if (type === "bytes" || type === "string") {
	        if (ModifiersBytes[name]) {
	            return true;
	        }
	    }
	    else if (type === "address") {
	        if (name === "payable") {
	            return true;
	        }
	    }
	    else if (type.indexOf("[") >= 0 || type === "tuple") {
	        if (ModifiersNest[name]) {
	            return true;
	        }
	    }
	    if (ModifiersBytes[name] || name === "payable") {
	        logger$l.throwArgumentError("invalid modifier", "name", name);
	    }
	    return false;
	}
	// @TODO: Make sure that children of an indexed tuple are marked with a null indexed
	function parseParamType(param, allowIndexed) {
	    let originalParam = param;
	    function throwError(i) {
	        logger$l.throwArgumentError(`unexpected character at position ${i}`, "param", param);
	    }
	    param = param.replace(/\s/g, " ");
	    function newNode(parent) {
	        let node = { type: "", name: "", parent: parent, state: { allowType: true } };
	        if (allowIndexed) {
	            node.indexed = false;
	        }
	        return node;
	    }
	    let parent = { type: "", name: "", state: { allowType: true } };
	    let node = parent;
	    for (let i = 0; i < param.length; i++) {
	        let c = param[i];
	        switch (c) {
	            case "(":
	                if (node.state.allowType && node.type === "") {
	                    node.type = "tuple";
	                }
	                else if (!node.state.allowParams) {
	                    throwError(i);
	                }
	                node.state.allowType = false;
	                node.type = verifyType(node.type);
	                node.components = [newNode(node)];
	                node = node.components[0];
	                break;
	            case ")":
	                delete node.state;
	                if (node.name === "indexed") {
	                    if (!allowIndexed) {
	                        throwError(i);
	                    }
	                    node.indexed = true;
	                    node.name = "";
	                }
	                if (checkModifier(node.type, node.name)) {
	                    node.name = "";
	                }
	                node.type = verifyType(node.type);
	                let child = node;
	                node = node.parent;
	                if (!node) {
	                    throwError(i);
	                }
	                delete child.parent;
	                node.state.allowParams = false;
	                node.state.allowName = true;
	                node.state.allowArray = true;
	                break;
	            case ",":
	                delete node.state;
	                if (node.name === "indexed") {
	                    if (!allowIndexed) {
	                        throwError(i);
	                    }
	                    node.indexed = true;
	                    node.name = "";
	                }
	                if (checkModifier(node.type, node.name)) {
	                    node.name = "";
	                }
	                node.type = verifyType(node.type);
	                let sibling = newNode(node.parent);
	                //{ type: "", name: "", parent: node.parent, state: { allowType: true } };
	                node.parent.components.push(sibling);
	                delete node.parent;
	                node = sibling;
	                break;
	            // Hit a space...
	            case " ":
	                // If reading type, the type is done and may read a param or name
	                if (node.state.allowType) {
	                    if (node.type !== "") {
	                        node.type = verifyType(node.type);
	                        delete node.state.allowType;
	                        node.state.allowName = true;
	                        node.state.allowParams = true;
	                    }
	                }
	                // If reading name, the name is done
	                if (node.state.allowName) {
	                    if (node.name !== "") {
	                        if (node.name === "indexed") {
	                            if (!allowIndexed) {
	                                throwError(i);
	                            }
	                            if (node.indexed) {
	                                throwError(i);
	                            }
	                            node.indexed = true;
	                            node.name = "";
	                        }
	                        else if (checkModifier(node.type, node.name)) {
	                            node.name = "";
	                        }
	                        else {
	                            node.state.allowName = false;
	                        }
	                    }
	                }
	                break;
	            case "[":
	                if (!node.state.allowArray) {
	                    throwError(i);
	                }
	                node.type += c;
	                node.state.allowArray = false;
	                node.state.allowName = false;
	                node.state.readArray = true;
	                break;
	            case "]":
	                if (!node.state.readArray) {
	                    throwError(i);
	                }
	                node.type += c;
	                node.state.readArray = false;
	                node.state.allowArray = true;
	                node.state.allowName = true;
	                break;
	            default:
	                if (node.state.allowType) {
	                    node.type += c;
	                    node.state.allowParams = true;
	                    node.state.allowArray = true;
	                }
	                else if (node.state.allowName) {
	                    node.name += c;
	                    delete node.state.allowArray;
	                }
	                else if (node.state.readArray) {
	                    node.type += c;
	                }
	                else {
	                    throwError(i);
	                }
	        }
	    }
	    if (node.parent) {
	        logger$l.throwArgumentError("unexpected eof", "param", param);
	    }
	    delete parent.state;
	    if (node.name === "indexed") {
	        if (!allowIndexed) {
	            throwError(originalParam.length - 7);
	        }
	        if (node.indexed) {
	            throwError(originalParam.length - 7);
	        }
	        node.indexed = true;
	        node.name = "";
	    }
	    else if (checkModifier(node.type, node.name)) {
	        node.name = "";
	    }
	    parent.type = verifyType(parent.type);
	    return parent;
	}
	function populate(object, params) {
	    for (let key in params) {
	        defineReadOnly(object, key, params[key]);
	    }
	}
	const FormatTypes = Object.freeze({
	    // Bare formatting, as is needed for computing a sighash of an event or function
	    sighash: "sighash",
	    // Human-Readable with Minimal spacing and without names (compact human-readable)
	    minimal: "minimal",
	    // Human-Readable with nice spacing, including all names
	    full: "full",
	    // JSON-format a la Solidity
	    json: "json"
	});
	const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
	class ParamType {
	    constructor(constructorGuard, params) {
	        if (constructorGuard !== _constructorGuard$1) {
	            logger$l.throwError("use fromString", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "new ParamType()"
	            });
	        }
	        populate(this, params);
	        let match = this.type.match(paramTypeArray);
	        if (match) {
	            populate(this, {
	                arrayLength: parseInt(match[2] || "-1"),
	                arrayChildren: ParamType.fromObject({
	                    type: match[1],
	                    components: this.components
	                }),
	                baseType: "array"
	            });
	        }
	        else {
	            populate(this, {
	                arrayLength: null,
	                arrayChildren: null,
	                baseType: ((this.components != null) ? "tuple" : this.type)
	            });
	        }
	        this._isParamType = true;
	        Object.freeze(this);
	    }
	    // Format the parameter fragment
	    //   - sighash: "(uint256,address)"
	    //   - minimal: "tuple(uint256,address) indexed"
	    //   - full:    "tuple(uint256 foo, address bar) indexed baz"
	    format(format) {
	        if (!format) {
	            format = FormatTypes.sighash;
	        }
	        if (!FormatTypes[format]) {
	            logger$l.throwArgumentError("invalid format type", "format", format);
	        }
	        if (format === FormatTypes.json) {
	            let result = {
	                type: ((this.baseType === "tuple") ? "tuple" : this.type),
	                name: (this.name || undefined)
	            };
	            if (typeof (this.indexed) === "boolean") {
	                result.indexed = this.indexed;
	            }
	            if (this.components) {
	                result.components = this.components.map((comp) => JSON.parse(comp.format(format)));
	            }
	            return JSON.stringify(result);
	        }
	        let result = "";
	        // Array
	        if (this.baseType === "array") {
	            result += this.arrayChildren.format(format);
	            result += "[" + (this.arrayLength < 0 ? "" : String(this.arrayLength)) + "]";
	        }
	        else {
	            if (this.baseType === "tuple") {
	                if (format !== FormatTypes.sighash) {
	                    result += this.type;
	                }
	                result += "(" + this.components.map((comp) => comp.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ")";
	            }
	            else {
	                result += this.type;
	            }
	        }
	        if (format !== FormatTypes.sighash) {
	            if (this.indexed === true) {
	                result += " indexed";
	            }
	            if (format === FormatTypes.full && this.name) {
	                result += " " + this.name;
	            }
	        }
	        return result;
	    }
	    static from(value, allowIndexed) {
	        if (typeof (value) === "string") {
	            return ParamType.fromString(value, allowIndexed);
	        }
	        return ParamType.fromObject(value);
	    }
	    static fromObject(value) {
	        if (ParamType.isParamType(value)) {
	            return value;
	        }
	        return new ParamType(_constructorGuard$1, {
	            name: (value.name || null),
	            type: verifyType(value.type),
	            indexed: ((value.indexed == null) ? null : !!value.indexed),
	            components: (value.components ? value.components.map(ParamType.fromObject) : null)
	        });
	    }
	    static fromString(value, allowIndexed) {
	        function ParamTypify(node) {
	            return ParamType.fromObject({
	                name: node.name,
	                type: node.type,
	                indexed: node.indexed,
	                components: node.components
	            });
	        }
	        return ParamTypify(parseParamType(value, !!allowIndexed));
	    }
	    static isParamType(value) {
	        return !!(value != null && value._isParamType);
	    }
	}
	function parseParams(value, allowIndex) {
	    return splitNesting(value).map((param) => ParamType.fromString(param, allowIndex));
	}
	class Fragment {
	    constructor(constructorGuard, params) {
	        if (constructorGuard !== _constructorGuard$1) {
	            logger$l.throwError("use a static from method", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "new Fragment()"
	            });
	        }
	        populate(this, params);
	        this._isFragment = true;
	        Object.freeze(this);
	    }
	    static from(value) {
	        if (Fragment.isFragment(value)) {
	            return value;
	        }
	        if (typeof (value) === "string") {
	            return Fragment.fromString(value);
	        }
	        return Fragment.fromObject(value);
	    }
	    static fromObject(value) {
	        if (Fragment.isFragment(value)) {
	            return value;
	        }
	        switch (value.type) {
	            case "function":
	                return FunctionFragment.fromObject(value);
	            case "event":
	                return EventFragment.fromObject(value);
	            case "constructor":
	                return ConstructorFragment.fromObject(value);
	            case "error":
	                return ErrorFragment.fromObject(value);
	            case "fallback":
	            case "receive":
	                // @TODO: Something? Maybe return a FunctionFragment? A custom DefaultFunctionFragment?
	                return null;
	        }
	        return logger$l.throwArgumentError("invalid fragment object", "value", value);
	    }
	    static fromString(value) {
	        // Make sure the "returns" is surrounded by a space and all whitespace is exactly one space
	        value = value.replace(/\s/g, " ");
	        value = value.replace(/\(/g, " (").replace(/\)/g, ") ").replace(/\s+/g, " ");
	        value = value.trim();
	        if (value.split(" ")[0] === "event") {
	            return EventFragment.fromString(value.substring(5).trim());
	        }
	        else if (value.split(" ")[0] === "function") {
	            return FunctionFragment.fromString(value.substring(8).trim());
	        }
	        else if (value.split("(")[0].trim() === "constructor") {
	            return ConstructorFragment.fromString(value.trim());
	        }
	        else if (value.split(" ")[0] === "error") {
	            return ErrorFragment.fromString(value.substring(5).trim());
	        }
	        return logger$l.throwArgumentError("unsupported fragment", "value", value);
	    }
	    static isFragment(value) {
	        return !!(value && value._isFragment);
	    }
	}
	class EventFragment extends Fragment {
	    format(format) {
	        if (!format) {
	            format = FormatTypes.sighash;
	        }
	        if (!FormatTypes[format]) {
	            logger$l.throwArgumentError("invalid format type", "format", format);
	        }
	        if (format === FormatTypes.json) {
	            return JSON.stringify({
	                type: "event",
	                anonymous: this.anonymous,
	                name: this.name,
	                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
	            });
	        }
	        let result = "";
	        if (format !== FormatTypes.sighash) {
	            result += "event ";
	        }
	        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
	        if (format !== FormatTypes.sighash) {
	            if (this.anonymous) {
	                result += "anonymous ";
	            }
	        }
	        return result.trim();
	    }
	    static from(value) {
	        if (typeof (value) === "string") {
	            return EventFragment.fromString(value);
	        }
	        return EventFragment.fromObject(value);
	    }
	    static fromObject(value) {
	        if (EventFragment.isEventFragment(value)) {
	            return value;
	        }
	        if (value.type !== "event") {
	            logger$l.throwArgumentError("invalid event object", "value", value);
	        }
	        const params = {
	            name: verifyIdentifier(value.name),
	            anonymous: value.anonymous,
	            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
	            type: "event"
	        };
	        return new EventFragment(_constructorGuard$1, params);
	    }
	    static fromString(value) {
	        let match = value.match(regexParen);
	        if (!match) {
	            logger$l.throwArgumentError("invalid event string", "value", value);
	        }
	        let anonymous = false;
	        match[3].split(" ").forEach((modifier) => {
	            switch (modifier.trim()) {
	                case "anonymous":
	                    anonymous = true;
	                    break;
	                case "":
	                    break;
	                default:
	                    logger$l.warn("unknown modifier: " + modifier);
	            }
	        });
	        return EventFragment.fromObject({
	            name: match[1].trim(),
	            anonymous: anonymous,
	            inputs: parseParams(match[2], true),
	            type: "event"
	        });
	    }
	    static isEventFragment(value) {
	        return (value && value._isFragment && value.type === "event");
	    }
	}
	function parseGas(value, params) {
	    params.gas = null;
	    let comps = value.split("@");
	    if (comps.length !== 1) {
	        if (comps.length > 2) {
	            logger$l.throwArgumentError("invalid human-readable ABI signature", "value", value);
	        }
	        if (!comps[1].match(/^[0-9]+$/)) {
	            logger$l.throwArgumentError("invalid human-readable ABI signature gas", "value", value);
	        }
	        params.gas = BigNumber.from(comps[1]);
	        return comps[0];
	    }
	    return value;
	}
	function parseModifiers(value, params) {
	    params.constant = false;
	    params.payable = false;
	    params.stateMutability = "nonpayable";
	    value.split(" ").forEach((modifier) => {
	        switch (modifier.trim()) {
	            case "constant":
	                params.constant = true;
	                break;
	            case "payable":
	                params.payable = true;
	                params.stateMutability = "payable";
	                break;
	            case "nonpayable":
	                params.payable = false;
	                params.stateMutability = "nonpayable";
	                break;
	            case "pure":
	                params.constant = true;
	                params.stateMutability = "pure";
	                break;
	            case "view":
	                params.constant = true;
	                params.stateMutability = "view";
	                break;
	            case "external":
	            case "public":
	            case "":
	                break;
	            default:
	                console.log("unknown modifier: " + modifier);
	        }
	    });
	}
	function verifyState(value) {
	    let result = {
	        constant: false,
	        payable: true,
	        stateMutability: "payable"
	    };
	    if (value.stateMutability != null) {
	        result.stateMutability = value.stateMutability;
	        // Set (and check things are consistent) the constant property
	        result.constant = (result.stateMutability === "view" || result.stateMutability === "pure");
	        if (value.constant != null) {
	            if ((!!value.constant) !== result.constant) {
	                logger$l.throwArgumentError("cannot have constant function with mutability " + result.stateMutability, "value", value);
	            }
	        }
	        // Set (and check things are consistent) the payable property
	        result.payable = (result.stateMutability === "payable");
	        if (value.payable != null) {
	            if ((!!value.payable) !== result.payable) {
	                logger$l.throwArgumentError("cannot have payable function with mutability " + result.stateMutability, "value", value);
	            }
	        }
	    }
	    else if (value.payable != null) {
	        result.payable = !!value.payable;
	        // If payable we can assume non-constant; otherwise we can't assume
	        if (value.constant == null && !result.payable && value.type !== "constructor") {
	            logger$l.throwArgumentError("unable to determine stateMutability", "value", value);
	        }
	        result.constant = !!value.constant;
	        if (result.constant) {
	            result.stateMutability = "view";
	        }
	        else {
	            result.stateMutability = (result.payable ? "payable" : "nonpayable");
	        }
	        if (result.payable && result.constant) {
	            logger$l.throwArgumentError("cannot have constant payable function", "value", value);
	        }
	    }
	    else if (value.constant != null) {
	        result.constant = !!value.constant;
	        result.payable = !result.constant;
	        result.stateMutability = (result.constant ? "view" : "payable");
	    }
	    else if (value.type !== "constructor") {
	        logger$l.throwArgumentError("unable to determine stateMutability", "value", value);
	    }
	    return result;
	}
	class ConstructorFragment extends Fragment {
	    format(format) {
	        if (!format) {
	            format = FormatTypes.sighash;
	        }
	        if (!FormatTypes[format]) {
	            logger$l.throwArgumentError("invalid format type", "format", format);
	        }
	        if (format === FormatTypes.json) {
	            return JSON.stringify({
	                type: "constructor",
	                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
	                payable: this.payable,
	                gas: (this.gas ? this.gas.toNumber() : undefined),
	                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
	            });
	        }
	        if (format === FormatTypes.sighash) {
	            logger$l.throwError("cannot format a constructor for sighash", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "format(sighash)"
	            });
	        }
	        let result = "constructor(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
	        if (this.stateMutability && this.stateMutability !== "nonpayable") {
	            result += this.stateMutability + " ";
	        }
	        return result.trim();
	    }
	    static from(value) {
	        if (typeof (value) === "string") {
	            return ConstructorFragment.fromString(value);
	        }
	        return ConstructorFragment.fromObject(value);
	    }
	    static fromObject(value) {
	        if (ConstructorFragment.isConstructorFragment(value)) {
	            return value;
	        }
	        if (value.type !== "constructor") {
	            logger$l.throwArgumentError("invalid constructor object", "value", value);
	        }
	        let state = verifyState(value);
	        if (state.constant) {
	            logger$l.throwArgumentError("constructor cannot be constant", "value", value);
	        }
	        const params = {
	            name: null,
	            type: value.type,
	            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
	            payable: state.payable,
	            stateMutability: state.stateMutability,
	            gas: (value.gas ? BigNumber.from(value.gas) : null)
	        };
	        return new ConstructorFragment(_constructorGuard$1, params);
	    }
	    static fromString(value) {
	        let params = { type: "constructor" };
	        value = parseGas(value, params);
	        let parens = value.match(regexParen);
	        if (!parens || parens[1].trim() !== "constructor") {
	            logger$l.throwArgumentError("invalid constructor string", "value", value);
	        }
	        params.inputs = parseParams(parens[2].trim(), false);
	        parseModifiers(parens[3].trim(), params);
	        return ConstructorFragment.fromObject(params);
	    }
	    static isConstructorFragment(value) {
	        return (value && value._isFragment && value.type === "constructor");
	    }
	}
	class FunctionFragment extends ConstructorFragment {
	    format(format) {
	        if (!format) {
	            format = FormatTypes.sighash;
	        }
	        if (!FormatTypes[format]) {
	            logger$l.throwArgumentError("invalid format type", "format", format);
	        }
	        if (format === FormatTypes.json) {
	            return JSON.stringify({
	                type: "function",
	                name: this.name,
	                constant: this.constant,
	                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
	                payable: this.payable,
	                gas: (this.gas ? this.gas.toNumber() : undefined),
	                inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
	                outputs: this.outputs.map((output) => JSON.parse(output.format(format))),
	            });
	        }
	        let result = "";
	        if (format !== FormatTypes.sighash) {
	            result += "function ";
	        }
	        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
	        if (format !== FormatTypes.sighash) {
	            if (this.stateMutability) {
	                if (this.stateMutability !== "nonpayable") {
	                    result += (this.stateMutability + " ");
	                }
	            }
	            else if (this.constant) {
	                result += "view ";
	            }
	            if (this.outputs && this.outputs.length) {
	                result += "returns (" + this.outputs.map((output) => output.format(format)).join(", ") + ") ";
	            }
	            if (this.gas != null) {
	                result += "@" + this.gas.toString() + " ";
	            }
	        }
	        return result.trim();
	    }
	    static from(value) {
	        if (typeof (value) === "string") {
	            return FunctionFragment.fromString(value);
	        }
	        return FunctionFragment.fromObject(value);
	    }
	    static fromObject(value) {
	        if (FunctionFragment.isFunctionFragment(value)) {
	            return value;
	        }
	        if (value.type !== "function") {
	            logger$l.throwArgumentError("invalid function object", "value", value);
	        }
	        let state = verifyState(value);
	        const params = {
	            type: value.type,
	            name: verifyIdentifier(value.name),
	            constant: state.constant,
	            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
	            outputs: (value.outputs ? value.outputs.map(ParamType.fromObject) : []),
	            payable: state.payable,
	            stateMutability: state.stateMutability,
	            gas: (value.gas ? BigNumber.from(value.gas) : null)
	        };
	        return new FunctionFragment(_constructorGuard$1, params);
	    }
	    static fromString(value) {
	        let params = { type: "function" };
	        value = parseGas(value, params);
	        let comps = value.split(" returns ");
	        if (comps.length > 2) {
	            logger$l.throwArgumentError("invalid function string", "value", value);
	        }
	        let parens = comps[0].match(regexParen);
	        if (!parens) {
	            logger$l.throwArgumentError("invalid function signature", "value", value);
	        }
	        params.name = parens[1].trim();
	        if (params.name) {
	            verifyIdentifier(params.name);
	        }
	        params.inputs = parseParams(parens[2], false);
	        parseModifiers(parens[3].trim(), params);
	        // We have outputs
	        if (comps.length > 1) {
	            let returns = comps[1].match(regexParen);
	            if (returns[1].trim() != "" || returns[3].trim() != "") {
	                logger$l.throwArgumentError("unexpected tokens", "value", value);
	            }
	            params.outputs = parseParams(returns[2], false);
	        }
	        else {
	            params.outputs = [];
	        }
	        return FunctionFragment.fromObject(params);
	    }
	    static isFunctionFragment(value) {
	        return (value && value._isFragment && value.type === "function");
	    }
	}
	//export class StructFragment extends Fragment {
	//}
	function checkForbidden(fragment) {
	    const sig = fragment.format();
	    if (sig === "Error(string)" || sig === "Panic(uint256)") {
	        logger$l.throwArgumentError(`cannot specify user defined ${sig} error`, "fragment", fragment);
	    }
	    return fragment;
	}
	class ErrorFragment extends Fragment {
	    format(format) {
	        if (!format) {
	            format = FormatTypes.sighash;
	        }
	        if (!FormatTypes[format]) {
	            logger$l.throwArgumentError("invalid format type", "format", format);
	        }
	        if (format === FormatTypes.json) {
	            return JSON.stringify({
	                type: "error",
	                name: this.name,
	                inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
	            });
	        }
	        let result = "";
	        if (format !== FormatTypes.sighash) {
	            result += "error ";
	        }
	        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
	        return result.trim();
	    }
	    static from(value) {
	        if (typeof (value) === "string") {
	            return ErrorFragment.fromString(value);
	        }
	        return ErrorFragment.fromObject(value);
	    }
	    static fromObject(value) {
	        if (ErrorFragment.isErrorFragment(value)) {
	            return value;
	        }
	        if (value.type !== "error") {
	            logger$l.throwArgumentError("invalid error object", "value", value);
	        }
	        const params = {
	            type: value.type,
	            name: verifyIdentifier(value.name),
	            inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : [])
	        };
	        return checkForbidden(new ErrorFragment(_constructorGuard$1, params));
	    }
	    static fromString(value) {
	        let params = { type: "error" };
	        let parens = value.match(regexParen);
	        if (!parens) {
	            logger$l.throwArgumentError("invalid error signature", "value", value);
	        }
	        params.name = parens[1].trim();
	        if (params.name) {
	            verifyIdentifier(params.name);
	        }
	        params.inputs = parseParams(parens[2], false);
	        return checkForbidden(ErrorFragment.fromObject(params));
	    }
	    static isErrorFragment(value) {
	        return (value && value._isFragment && value.type === "error");
	    }
	}
	function verifyType(type) {
	    // These need to be transformed to their full description
	    if (type.match(/^uint($|[^1-9])/)) {
	        type = "uint256" + type.substring(4);
	    }
	    else if (type.match(/^int($|[^1-9])/)) {
	        type = "int256" + type.substring(3);
	    }
	    // @TODO: more verification
	    return type;
	}
	// See: https://github.com/ethereum/solidity/blob/1f8f1a3db93a548d0555e3e14cfc55a10e25b60e/docs/grammar/SolidityLexer.g4#L234
	const regexIdentifier = new RegExp("^[a-zA-Z$_][a-zA-Z0-9$_]*$");
	function verifyIdentifier(value) {
	    if (!value || !value.match(regexIdentifier)) {
	        logger$l.throwArgumentError(`invalid identifier "${value}"`, "value", value);
	    }
	    return value;
	}
	const regexParen = new RegExp("^([^)(]*)\\((.*)\\)([^)(]*)$");
	function splitNesting(value) {
	    value = value.trim();
	    let result = [];
	    let accum = "";
	    let depth = 0;
	    for (let offset = 0; offset < value.length; offset++) {
	        let c = value[offset];
	        if (c === "," && depth === 0) {
	            result.push(accum);
	            accum = "";
	        }
	        else {
	            accum += c;
	            if (c === "(") {
	                depth++;
	            }
	            else if (c === ")") {
	                depth--;
	                if (depth === -1) {
	                    logger$l.throwArgumentError("unbalanced parenthesis", "value", value);
	                }
	            }
	        }
	    }
	    if (accum) {
	        result.push(accum);
	    }
	    return result;
	}

	const logger$k = new Logger(version$e);
	function checkResultErrors(result) {
	    // Find the first error (if any)
	    const errors = [];
	    const checkErrors = function (path, object) {
	        if (!Array.isArray(object)) {
	            return;
	        }
	        for (let key in object) {
	            const childPath = path.slice();
	            childPath.push(key);
	            try {
	                checkErrors(childPath, object[key]);
	            }
	            catch (error) {
	                errors.push({ path: childPath, error: error });
	            }
	        }
	    };
	    checkErrors([], result);
	    return errors;
	}
	class Coder {
	    constructor(name, type, localName, dynamic) {
	        // @TODO: defineReadOnly these
	        this.name = name;
	        this.type = type;
	        this.localName = localName;
	        this.dynamic = dynamic;
	    }
	    _throwError(message, value) {
	        logger$k.throwArgumentError(message, this.localName, value);
	    }
	}
	class Writer {
	    constructor(wordSize) {
	        defineReadOnly(this, "wordSize", wordSize || 32);
	        this._data = [];
	        this._dataLength = 0;
	        this._padding = new Uint8Array(wordSize);
	    }
	    get data() {
	        return hexConcat(this._data);
	    }
	    get length() { return this._dataLength; }
	    _writeData(data) {
	        this._data.push(data);
	        this._dataLength += data.length;
	        return data.length;
	    }
	    appendWriter(writer) {
	        return this._writeData(concat(writer._data));
	    }
	    // Arrayish items; padded on the right to wordSize
	    writeBytes(value) {
	        let bytes = arrayify(value);
	        const paddingOffset = bytes.length % this.wordSize;
	        if (paddingOffset) {
	            bytes = concat([bytes, this._padding.slice(paddingOffset)]);
	        }
	        return this._writeData(bytes);
	    }
	    _getValue(value) {
	        let bytes = arrayify(BigNumber.from(value));
	        if (bytes.length > this.wordSize) {
	            logger$k.throwError("value out-of-bounds", Logger.errors.BUFFER_OVERRUN, {
	                length: this.wordSize,
	                offset: bytes.length
	            });
	        }
	        if (bytes.length % this.wordSize) {
	            bytes = concat([this._padding.slice(bytes.length % this.wordSize), bytes]);
	        }
	        return bytes;
	    }
	    // BigNumberish items; padded on the left to wordSize
	    writeValue(value) {
	        return this._writeData(this._getValue(value));
	    }
	    writeUpdatableValue() {
	        const offset = this._data.length;
	        this._data.push(this._padding);
	        this._dataLength += this.wordSize;
	        return (value) => {
	            this._data[offset] = this._getValue(value);
	        };
	    }
	}
	class Reader {
	    constructor(data, wordSize, coerceFunc, allowLoose) {
	        defineReadOnly(this, "_data", arrayify(data));
	        defineReadOnly(this, "wordSize", wordSize || 32);
	        defineReadOnly(this, "_coerceFunc", coerceFunc);
	        defineReadOnly(this, "allowLoose", allowLoose);
	        this._offset = 0;
	    }
	    get data() { return hexlify(this._data); }
	    get consumed() { return this._offset; }
	    // The default Coerce function
	    static coerce(name, value) {
	        let match = name.match("^u?int([0-9]+)$");
	        if (match && parseInt(match[1]) <= 48) {
	            value = value.toNumber();
	        }
	        return value;
	    }
	    coerce(name, value) {
	        if (this._coerceFunc) {
	            return this._coerceFunc(name, value);
	        }
	        return Reader.coerce(name, value);
	    }
	    _peekBytes(offset, length, loose) {
	        let alignedLength = Math.ceil(length / this.wordSize) * this.wordSize;
	        if (this._offset + alignedLength > this._data.length) {
	            if (this.allowLoose && loose && this._offset + length <= this._data.length) {
	                alignedLength = length;
	            }
	            else {
	                logger$k.throwError("data out-of-bounds", Logger.errors.BUFFER_OVERRUN, {
	                    length: this._data.length,
	                    offset: this._offset + alignedLength
	                });
	            }
	        }
	        return this._data.slice(this._offset, this._offset + alignedLength);
	    }
	    subReader(offset) {
	        return new Reader(this._data.slice(this._offset + offset), this.wordSize, this._coerceFunc, this.allowLoose);
	    }
	    readBytes(length, loose) {
	        let bytes = this._peekBytes(0, length, !!loose);
	        this._offset += bytes.length;
	        // @TODO: Make sure the length..end bytes are all 0?
	        return bytes.slice(0, length);
	    }
	    readValue() {
	        return BigNumber.from(this.readBytes(this.wordSize));
	    }
	}

	/**
	 * [js-sha3]{@link https://github.com/emn178/js-sha3}
	 *
	 * @version 0.8.0
	 * @author Chen, Yi-Cyuan [emn178@gmail.com]
	 * @copyright Chen, Yi-Cyuan 2015-2018
	 * @license MIT
	 */

	var sha3$1 = createCommonjsModule$1(function (module) {
	/*jslint bitwise: true */
	(function () {

	  var INPUT_ERROR = 'input is invalid type';
	  var FINALIZE_ERROR = 'finalize already called';
	  var WINDOW = typeof window === 'object';
	  var root = WINDOW ? window : {};
	  if (root.JS_SHA3_NO_WINDOW) {
	    WINDOW = false;
	  }
	  var WEB_WORKER = !WINDOW && typeof self === 'object';
	  var NODE_JS = !root.JS_SHA3_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
	  if (NODE_JS) {
	    root = commonjsGlobal;
	  } else if (WEB_WORKER) {
	    root = self;
	  }
	  var COMMON_JS = !root.JS_SHA3_NO_COMMON_JS && 'object' === 'object' && module.exports;
	  var ARRAY_BUFFER = !root.JS_SHA3_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
	  var HEX_CHARS = '0123456789abcdef'.split('');
	  var SHAKE_PADDING = [31, 7936, 2031616, 520093696];
	  var CSHAKE_PADDING = [4, 1024, 262144, 67108864];
	  var KECCAK_PADDING = [1, 256, 65536, 16777216];
	  var PADDING = [6, 1536, 393216, 100663296];
	  var SHIFT = [0, 8, 16, 24];
	  var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
	    0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
	    2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
	    2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
	    2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];
	  var BITS = [224, 256, 384, 512];
	  var SHAKE_BITS = [128, 256];
	  var OUTPUT_TYPES = ['hex', 'buffer', 'arrayBuffer', 'array', 'digest'];
	  var CSHAKE_BYTEPAD = {
	    '128': 168,
	    '256': 136
	  };

	  if (root.JS_SHA3_NO_NODE_JS || !Array.isArray) {
	    Array.isArray = function (obj) {
	      return Object.prototype.toString.call(obj) === '[object Array]';
	    };
	  }

	  if (ARRAY_BUFFER && (root.JS_SHA3_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
	    ArrayBuffer.isView = function (obj) {
	      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
	    };
	  }

	  var createOutputMethod = function (bits, padding, outputType) {
	    return function (message) {
	      return new Keccak(bits, padding, bits).update(message)[outputType]();
	    };
	  };

	  var createShakeOutputMethod = function (bits, padding, outputType) {
	    return function (message, outputBits) {
	      return new Keccak(bits, padding, outputBits).update(message)[outputType]();
	    };
	  };

	  var createCshakeOutputMethod = function (bits, padding, outputType) {
	    return function (message, outputBits, n, s) {
	      return methods['cshake' + bits].update(message, outputBits, n, s)[outputType]();
	    };
	  };

	  var createKmacOutputMethod = function (bits, padding, outputType) {
	    return function (key, message, outputBits, s) {
	      return methods['kmac' + bits].update(key, message, outputBits, s)[outputType]();
	    };
	  };

	  var createOutputMethods = function (method, createMethod, bits, padding) {
	    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
	      var type = OUTPUT_TYPES[i];
	      method[type] = createMethod(bits, padding, type);
	    }
	    return method;
	  };

	  var createMethod = function (bits, padding) {
	    var method = createOutputMethod(bits, padding, 'hex');
	    method.create = function () {
	      return new Keccak(bits, padding, bits);
	    };
	    method.update = function (message) {
	      return method.create().update(message);
	    };
	    return createOutputMethods(method, createOutputMethod, bits, padding);
	  };

	  var createShakeMethod = function (bits, padding) {
	    var method = createShakeOutputMethod(bits, padding, 'hex');
	    method.create = function (outputBits) {
	      return new Keccak(bits, padding, outputBits);
	    };
	    method.update = function (message, outputBits) {
	      return method.create(outputBits).update(message);
	    };
	    return createOutputMethods(method, createShakeOutputMethod, bits, padding);
	  };

	  var createCshakeMethod = function (bits, padding) {
	    var w = CSHAKE_BYTEPAD[bits];
	    var method = createCshakeOutputMethod(bits, padding, 'hex');
	    method.create = function (outputBits, n, s) {
	      if (!n && !s) {
	        return methods['shake' + bits].create(outputBits);
	      } else {
	        return new Keccak(bits, padding, outputBits).bytepad([n, s], w);
	      }
	    };
	    method.update = function (message, outputBits, n, s) {
	      return method.create(outputBits, n, s).update(message);
	    };
	    return createOutputMethods(method, createCshakeOutputMethod, bits, padding);
	  };

	  var createKmacMethod = function (bits, padding) {
	    var w = CSHAKE_BYTEPAD[bits];
	    var method = createKmacOutputMethod(bits, padding, 'hex');
	    method.create = function (key, outputBits, s) {
	      return new Kmac(bits, padding, outputBits).bytepad(['KMAC', s], w).bytepad([key], w);
	    };
	    method.update = function (key, message, outputBits, s) {
	      return method.create(key, outputBits, s).update(message);
	    };
	    return createOutputMethods(method, createKmacOutputMethod, bits, padding);
	  };

	  var algorithms = [
	    { name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod },
	    { name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod },
	    { name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod },
	    { name: 'cshake', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createCshakeMethod },
	    { name: 'kmac', padding: CSHAKE_PADDING, bits: SHAKE_BITS, createMethod: createKmacMethod }
	  ];

	  var methods = {}, methodNames = [];

	  for (var i = 0; i < algorithms.length; ++i) {
	    var algorithm = algorithms[i];
	    var bits = algorithm.bits;
	    for (var j = 0; j < bits.length; ++j) {
	      var methodName = algorithm.name + '_' + bits[j];
	      methodNames.push(methodName);
	      methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
	      if (algorithm.name !== 'sha3') {
	        var newMethodName = algorithm.name + bits[j];
	        methodNames.push(newMethodName);
	        methods[newMethodName] = methods[methodName];
	      }
	    }
	  }

	  function Keccak(bits, padding, outputBits) {
	    this.blocks = [];
	    this.s = [];
	    this.padding = padding;
	    this.outputBits = outputBits;
	    this.reset = true;
	    this.finalized = false;
	    this.block = 0;
	    this.start = 0;
	    this.blockCount = (1600 - (bits << 1)) >> 5;
	    this.byteCount = this.blockCount << 2;
	    this.outputBlocks = outputBits >> 5;
	    this.extraBytes = (outputBits & 31) >> 3;

	    for (var i = 0; i < 50; ++i) {
	      this.s[i] = 0;
	    }
	  }

	  Keccak.prototype.update = function (message) {
	    if (this.finalized) {
	      throw new Error(FINALIZE_ERROR);
	    }
	    var notString, type = typeof message;
	    if (type !== 'string') {
	      if (type === 'object') {
	        if (message === null) {
	          throw new Error(INPUT_ERROR);
	        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
	          message = new Uint8Array(message);
	        } else if (!Array.isArray(message)) {
	          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
	            throw new Error(INPUT_ERROR);
	          }
	        }
	      } else {
	        throw new Error(INPUT_ERROR);
	      }
	      notString = true;
	    }
	    var blocks = this.blocks, byteCount = this.byteCount, length = message.length,
	      blockCount = this.blockCount, index = 0, s = this.s, i, code;

	    while (index < length) {
	      if (this.reset) {
	        this.reset = false;
	        blocks[0] = this.block;
	        for (i = 1; i < blockCount + 1; ++i) {
	          blocks[i] = 0;
	        }
	      }
	      if (notString) {
	        for (i = this.start; index < length && i < byteCount; ++index) {
	          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
	        }
	      } else {
	        for (i = this.start; index < length && i < byteCount; ++index) {
	          code = message.charCodeAt(index);
	          if (code < 0x80) {
	            blocks[i >> 2] |= code << SHIFT[i++ & 3];
	          } else if (code < 0x800) {
	            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
	            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
	          } else if (code < 0xd800 || code >= 0xe000) {
	            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
	            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
	            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
	          } else {
	            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
	            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
	            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
	            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
	            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
	          }
	        }
	      }
	      this.lastByteIndex = i;
	      if (i >= byteCount) {
	        this.start = i - byteCount;
	        this.block = blocks[blockCount];
	        for (i = 0; i < blockCount; ++i) {
	          s[i] ^= blocks[i];
	        }
	        f(s);
	        this.reset = true;
	      } else {
	        this.start = i;
	      }
	    }
	    return this;
	  };

	  Keccak.prototype.encode = function (x, right) {
	    var o = x & 255, n = 1;
	    var bytes = [o];
	    x = x >> 8;
	    o = x & 255;
	    while (o > 0) {
	      bytes.unshift(o);
	      x = x >> 8;
	      o = x & 255;
	      ++n;
	    }
	    if (right) {
	      bytes.push(n);
	    } else {
	      bytes.unshift(n);
	    }
	    this.update(bytes);
	    return bytes.length;
	  };

	  Keccak.prototype.encodeString = function (str) {
	    var notString, type = typeof str;
	    if (type !== 'string') {
	      if (type === 'object') {
	        if (str === null) {
	          throw new Error(INPUT_ERROR);
	        } else if (ARRAY_BUFFER && str.constructor === ArrayBuffer) {
	          str = new Uint8Array(str);
	        } else if (!Array.isArray(str)) {
	          if (!ARRAY_BUFFER || !ArrayBuffer.isView(str)) {
	            throw new Error(INPUT_ERROR);
	          }
	        }
	      } else {
	        throw new Error(INPUT_ERROR);
	      }
	      notString = true;
	    }
	    var bytes = 0, length = str.length;
	    if (notString) {
	      bytes = length;
	    } else {
	      for (var i = 0; i < str.length; ++i) {
	        var code = str.charCodeAt(i);
	        if (code < 0x80) {
	          bytes += 1;
	        } else if (code < 0x800) {
	          bytes += 2;
	        } else if (code < 0xd800 || code >= 0xe000) {
	          bytes += 3;
	        } else {
	          code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
	          bytes += 4;
	        }
	      }
	    }
	    bytes += this.encode(bytes * 8);
	    this.update(str);
	    return bytes;
	  };

	  Keccak.prototype.bytepad = function (strs, w) {
	    var bytes = this.encode(w);
	    for (var i = 0; i < strs.length; ++i) {
	      bytes += this.encodeString(strs[i]);
	    }
	    var paddingBytes = w - bytes % w;
	    var zeros = [];
	    zeros.length = paddingBytes;
	    this.update(zeros);
	    return this;
	  };

	  Keccak.prototype.finalize = function () {
	    if (this.finalized) {
	      return;
	    }
	    this.finalized = true;
	    var blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
	    blocks[i >> 2] |= this.padding[i & 3];
	    if (this.lastByteIndex === this.byteCount) {
	      blocks[0] = blocks[blockCount];
	      for (i = 1; i < blockCount + 1; ++i) {
	        blocks[i] = 0;
	      }
	    }
	    blocks[blockCount - 1] |= 0x80000000;
	    for (i = 0; i < blockCount; ++i) {
	      s[i] ^= blocks[i];
	    }
	    f(s);
	  };

	  Keccak.prototype.toString = Keccak.prototype.hex = function () {
	    this.finalize();

	    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
	      extraBytes = this.extraBytes, i = 0, j = 0;
	    var hex = '', block;
	    while (j < outputBlocks) {
	      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
	        block = s[i];
	        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F] +
	          HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F] +
	          HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F] +
	          HEX_CHARS[(block >> 28) & 0x0F] + HEX_CHARS[(block >> 24) & 0x0F];
	      }
	      if (j % blockCount === 0) {
	        f(s);
	        i = 0;
	      }
	    }
	    if (extraBytes) {
	      block = s[i];
	      hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F];
	      if (extraBytes > 1) {
	        hex += HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F];
	      }
	      if (extraBytes > 2) {
	        hex += HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F];
	      }
	    }
	    return hex;
	  };

	  Keccak.prototype.arrayBuffer = function () {
	    this.finalize();

	    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
	      extraBytes = this.extraBytes, i = 0, j = 0;
	    var bytes = this.outputBits >> 3;
	    var buffer;
	    if (extraBytes) {
	      buffer = new ArrayBuffer((outputBlocks + 1) << 2);
	    } else {
	      buffer = new ArrayBuffer(bytes);
	    }
	    var array = new Uint32Array(buffer);
	    while (j < outputBlocks) {
	      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
	        array[j] = s[i];
	      }
	      if (j % blockCount === 0) {
	        f(s);
	      }
	    }
	    if (extraBytes) {
	      array[i] = s[i];
	      buffer = buffer.slice(0, bytes);
	    }
	    return buffer;
	  };

	  Keccak.prototype.buffer = Keccak.prototype.arrayBuffer;

	  Keccak.prototype.digest = Keccak.prototype.array = function () {
	    this.finalize();

	    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
	      extraBytes = this.extraBytes, i = 0, j = 0;
	    var array = [], offset, block;
	    while (j < outputBlocks) {
	      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
	        offset = j << 2;
	        block = s[i];
	        array[offset] = block & 0xFF;
	        array[offset + 1] = (block >> 8) & 0xFF;
	        array[offset + 2] = (block >> 16) & 0xFF;
	        array[offset + 3] = (block >> 24) & 0xFF;
	      }
	      if (j % blockCount === 0) {
	        f(s);
	      }
	    }
	    if (extraBytes) {
	      offset = j << 2;
	      block = s[i];
	      array[offset] = block & 0xFF;
	      if (extraBytes > 1) {
	        array[offset + 1] = (block >> 8) & 0xFF;
	      }
	      if (extraBytes > 2) {
	        array[offset + 2] = (block >> 16) & 0xFF;
	      }
	    }
	    return array;
	  };

	  function Kmac(bits, padding, outputBits) {
	    Keccak.call(this, bits, padding, outputBits);
	  }

	  Kmac.prototype = new Keccak();

	  Kmac.prototype.finalize = function () {
	    this.encode(this.outputBits, true);
	    return Keccak.prototype.finalize.call(this);
	  };

	  var f = function (s) {
	    var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9,
	      b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17,
	      b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33,
	      b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;
	    for (n = 0; n < 48; n += 2) {
	      c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
	      c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
	      c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
	      c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
	      c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
	      c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
	      c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
	      c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
	      c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
	      c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

	      h = c8 ^ ((c2 << 1) | (c3 >>> 31));
	      l = c9 ^ ((c3 << 1) | (c2 >>> 31));
	      s[0] ^= h;
	      s[1] ^= l;
	      s[10] ^= h;
	      s[11] ^= l;
	      s[20] ^= h;
	      s[21] ^= l;
	      s[30] ^= h;
	      s[31] ^= l;
	      s[40] ^= h;
	      s[41] ^= l;
	      h = c0 ^ ((c4 << 1) | (c5 >>> 31));
	      l = c1 ^ ((c5 << 1) | (c4 >>> 31));
	      s[2] ^= h;
	      s[3] ^= l;
	      s[12] ^= h;
	      s[13] ^= l;
	      s[22] ^= h;
	      s[23] ^= l;
	      s[32] ^= h;
	      s[33] ^= l;
	      s[42] ^= h;
	      s[43] ^= l;
	      h = c2 ^ ((c6 << 1) | (c7 >>> 31));
	      l = c3 ^ ((c7 << 1) | (c6 >>> 31));
	      s[4] ^= h;
	      s[5] ^= l;
	      s[14] ^= h;
	      s[15] ^= l;
	      s[24] ^= h;
	      s[25] ^= l;
	      s[34] ^= h;
	      s[35] ^= l;
	      s[44] ^= h;
	      s[45] ^= l;
	      h = c4 ^ ((c8 << 1) | (c9 >>> 31));
	      l = c5 ^ ((c9 << 1) | (c8 >>> 31));
	      s[6] ^= h;
	      s[7] ^= l;
	      s[16] ^= h;
	      s[17] ^= l;
	      s[26] ^= h;
	      s[27] ^= l;
	      s[36] ^= h;
	      s[37] ^= l;
	      s[46] ^= h;
	      s[47] ^= l;
	      h = c6 ^ ((c0 << 1) | (c1 >>> 31));
	      l = c7 ^ ((c1 << 1) | (c0 >>> 31));
	      s[8] ^= h;
	      s[9] ^= l;
	      s[18] ^= h;
	      s[19] ^= l;
	      s[28] ^= h;
	      s[29] ^= l;
	      s[38] ^= h;
	      s[39] ^= l;
	      s[48] ^= h;
	      s[49] ^= l;

	      b0 = s[0];
	      b1 = s[1];
	      b32 = (s[11] << 4) | (s[10] >>> 28);
	      b33 = (s[10] << 4) | (s[11] >>> 28);
	      b14 = (s[20] << 3) | (s[21] >>> 29);
	      b15 = (s[21] << 3) | (s[20] >>> 29);
	      b46 = (s[31] << 9) | (s[30] >>> 23);
	      b47 = (s[30] << 9) | (s[31] >>> 23);
	      b28 = (s[40] << 18) | (s[41] >>> 14);
	      b29 = (s[41] << 18) | (s[40] >>> 14);
	      b20 = (s[2] << 1) | (s[3] >>> 31);
	      b21 = (s[3] << 1) | (s[2] >>> 31);
	      b2 = (s[13] << 12) | (s[12] >>> 20);
	      b3 = (s[12] << 12) | (s[13] >>> 20);
	      b34 = (s[22] << 10) | (s[23] >>> 22);
	      b35 = (s[23] << 10) | (s[22] >>> 22);
	      b16 = (s[33] << 13) | (s[32] >>> 19);
	      b17 = (s[32] << 13) | (s[33] >>> 19);
	      b48 = (s[42] << 2) | (s[43] >>> 30);
	      b49 = (s[43] << 2) | (s[42] >>> 30);
	      b40 = (s[5] << 30) | (s[4] >>> 2);
	      b41 = (s[4] << 30) | (s[5] >>> 2);
	      b22 = (s[14] << 6) | (s[15] >>> 26);
	      b23 = (s[15] << 6) | (s[14] >>> 26);
	      b4 = (s[25] << 11) | (s[24] >>> 21);
	      b5 = (s[24] << 11) | (s[25] >>> 21);
	      b36 = (s[34] << 15) | (s[35] >>> 17);
	      b37 = (s[35] << 15) | (s[34] >>> 17);
	      b18 = (s[45] << 29) | (s[44] >>> 3);
	      b19 = (s[44] << 29) | (s[45] >>> 3);
	      b10 = (s[6] << 28) | (s[7] >>> 4);
	      b11 = (s[7] << 28) | (s[6] >>> 4);
	      b42 = (s[17] << 23) | (s[16] >>> 9);
	      b43 = (s[16] << 23) | (s[17] >>> 9);
	      b24 = (s[26] << 25) | (s[27] >>> 7);
	      b25 = (s[27] << 25) | (s[26] >>> 7);
	      b6 = (s[36] << 21) | (s[37] >>> 11);
	      b7 = (s[37] << 21) | (s[36] >>> 11);
	      b38 = (s[47] << 24) | (s[46] >>> 8);
	      b39 = (s[46] << 24) | (s[47] >>> 8);
	      b30 = (s[8] << 27) | (s[9] >>> 5);
	      b31 = (s[9] << 27) | (s[8] >>> 5);
	      b12 = (s[18] << 20) | (s[19] >>> 12);
	      b13 = (s[19] << 20) | (s[18] >>> 12);
	      b44 = (s[29] << 7) | (s[28] >>> 25);
	      b45 = (s[28] << 7) | (s[29] >>> 25);
	      b26 = (s[38] << 8) | (s[39] >>> 24);
	      b27 = (s[39] << 8) | (s[38] >>> 24);
	      b8 = (s[48] << 14) | (s[49] >>> 18);
	      b9 = (s[49] << 14) | (s[48] >>> 18);

	      s[0] = b0 ^ (~b2 & b4);
	      s[1] = b1 ^ (~b3 & b5);
	      s[10] = b10 ^ (~b12 & b14);
	      s[11] = b11 ^ (~b13 & b15);
	      s[20] = b20 ^ (~b22 & b24);
	      s[21] = b21 ^ (~b23 & b25);
	      s[30] = b30 ^ (~b32 & b34);
	      s[31] = b31 ^ (~b33 & b35);
	      s[40] = b40 ^ (~b42 & b44);
	      s[41] = b41 ^ (~b43 & b45);
	      s[2] = b2 ^ (~b4 & b6);
	      s[3] = b3 ^ (~b5 & b7);
	      s[12] = b12 ^ (~b14 & b16);
	      s[13] = b13 ^ (~b15 & b17);
	      s[22] = b22 ^ (~b24 & b26);
	      s[23] = b23 ^ (~b25 & b27);
	      s[32] = b32 ^ (~b34 & b36);
	      s[33] = b33 ^ (~b35 & b37);
	      s[42] = b42 ^ (~b44 & b46);
	      s[43] = b43 ^ (~b45 & b47);
	      s[4] = b4 ^ (~b6 & b8);
	      s[5] = b5 ^ (~b7 & b9);
	      s[14] = b14 ^ (~b16 & b18);
	      s[15] = b15 ^ (~b17 & b19);
	      s[24] = b24 ^ (~b26 & b28);
	      s[25] = b25 ^ (~b27 & b29);
	      s[34] = b34 ^ (~b36 & b38);
	      s[35] = b35 ^ (~b37 & b39);
	      s[44] = b44 ^ (~b46 & b48);
	      s[45] = b45 ^ (~b47 & b49);
	      s[6] = b6 ^ (~b8 & b0);
	      s[7] = b7 ^ (~b9 & b1);
	      s[16] = b16 ^ (~b18 & b10);
	      s[17] = b17 ^ (~b19 & b11);
	      s[26] = b26 ^ (~b28 & b20);
	      s[27] = b27 ^ (~b29 & b21);
	      s[36] = b36 ^ (~b38 & b30);
	      s[37] = b37 ^ (~b39 & b31);
	      s[46] = b46 ^ (~b48 & b40);
	      s[47] = b47 ^ (~b49 & b41);
	      s[8] = b8 ^ (~b0 & b2);
	      s[9] = b9 ^ (~b1 & b3);
	      s[18] = b18 ^ (~b10 & b12);
	      s[19] = b19 ^ (~b11 & b13);
	      s[28] = b28 ^ (~b20 & b22);
	      s[29] = b29 ^ (~b21 & b23);
	      s[38] = b38 ^ (~b30 & b32);
	      s[39] = b39 ^ (~b31 & b33);
	      s[48] = b48 ^ (~b40 & b42);
	      s[49] = b49 ^ (~b41 & b43);

	      s[0] ^= RC[n];
	      s[1] ^= RC[n + 1];
	    }
	  };

	  if (COMMON_JS) {
	    module.exports = methods;
	  } else {
	    for (i = 0; i < methodNames.length; ++i) {
	      root[methodNames[i]] = methods[methodNames[i]];
	    }
	  }
	})();
	});

	var sha3$2 = sha3$1;

	function keccak256(data) {
	    return '0x' + sha3$2.keccak_256(arrayify(data));
	}

	const version$d = "rlp/5.7.0";

	const logger$j = new Logger(version$d);
	function arrayifyInteger(value) {
	    const result = [];
	    while (value) {
	        result.unshift(value & 0xff);
	        value >>= 8;
	    }
	    return result;
	}
	function unarrayifyInteger(data, offset, length) {
	    let result = 0;
	    for (let i = 0; i < length; i++) {
	        result = (result * 256) + data[offset + i];
	    }
	    return result;
	}
	function _encode(object) {
	    if (Array.isArray(object)) {
	        let payload = [];
	        object.forEach(function (child) {
	            payload = payload.concat(_encode(child));
	        });
	        if (payload.length <= 55) {
	            payload.unshift(0xc0 + payload.length);
	            return payload;
	        }
	        const length = arrayifyInteger(payload.length);
	        length.unshift(0xf7 + length.length);
	        return length.concat(payload);
	    }
	    if (!isBytesLike(object)) {
	        logger$j.throwArgumentError("RLP object must be BytesLike", "object", object);
	    }
	    const data = Array.prototype.slice.call(arrayify(object));
	    if (data.length === 1 && data[0] <= 0x7f) {
	        return data;
	    }
	    else if (data.length <= 55) {
	        data.unshift(0x80 + data.length);
	        return data;
	    }
	    const length = arrayifyInteger(data.length);
	    length.unshift(0xb7 + length.length);
	    return length.concat(data);
	}
	function encode$2(object) {
	    return hexlify(_encode(object));
	}
	function _decodeChildren(data, offset, childOffset, length) {
	    const result = [];
	    while (childOffset < offset + 1 + length) {
	        const decoded = _decode(data, childOffset);
	        result.push(decoded.result);
	        childOffset += decoded.consumed;
	        if (childOffset > offset + 1 + length) {
	            logger$j.throwError("child data too short", Logger.errors.BUFFER_OVERRUN, {});
	        }
	    }
	    return { consumed: (1 + length), result: result };
	}
	// returns { consumed: number, result: Object }
	function _decode(data, offset) {
	    if (data.length === 0) {
	        logger$j.throwError("data too short", Logger.errors.BUFFER_OVERRUN, {});
	    }
	    // Array with extra length prefix
	    if (data[offset] >= 0xf8) {
	        const lengthLength = data[offset] - 0xf7;
	        if (offset + 1 + lengthLength > data.length) {
	            logger$j.throwError("data short segment too short", Logger.errors.BUFFER_OVERRUN, {});
	        }
	        const length = unarrayifyInteger(data, offset + 1, lengthLength);
	        if (offset + 1 + lengthLength + length > data.length) {
	            logger$j.throwError("data long segment too short", Logger.errors.BUFFER_OVERRUN, {});
	        }
	        return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
	    }
	    else if (data[offset] >= 0xc0) {
	        const length = data[offset] - 0xc0;
	        if (offset + 1 + length > data.length) {
	            logger$j.throwError("data array too short", Logger.errors.BUFFER_OVERRUN, {});
	        }
	        return _decodeChildren(data, offset, offset + 1, length);
	    }
	    else if (data[offset] >= 0xb8) {
	        const lengthLength = data[offset] - 0xb7;
	        if (offset + 1 + lengthLength > data.length) {
	            logger$j.throwError("data array too short", Logger.errors.BUFFER_OVERRUN, {});
	        }
	        const length = unarrayifyInteger(data, offset + 1, lengthLength);
	        if (offset + 1 + lengthLength + length > data.length) {
	            logger$j.throwError("data array too short", Logger.errors.BUFFER_OVERRUN, {});
	        }
	        const result = hexlify(data.slice(offset + 1 + lengthLength, offset + 1 + lengthLength + length));
	        return { consumed: (1 + lengthLength + length), result: result };
	    }
	    else if (data[offset] >= 0x80) {
	        const length = data[offset] - 0x80;
	        if (offset + 1 + length > data.length) {
	            logger$j.throwError("data too short", Logger.errors.BUFFER_OVERRUN, {});
	        }
	        const result = hexlify(data.slice(offset + 1, offset + 1 + length));
	        return { consumed: (1 + length), result: result };
	    }
	    return { consumed: 1, result: hexlify(data[offset]) };
	}
	function decode$2(data) {
	    const bytes = arrayify(data);
	    const decoded = _decode(bytes, 0);
	    if (decoded.consumed !== bytes.length) {
	        logger$j.throwArgumentError("invalid rlp data", "data", data);
	    }
	    return decoded.result;
	}

	const version$c = "address/5.7.0";

	const logger$i = new Logger(version$c);
	function getChecksumAddress(address) {
	    if (!isHexString(address, 20)) {
	        logger$i.throwArgumentError("invalid address", "address", address);
	    }
	    address = address.toLowerCase();
	    const chars = address.substring(2).split("");
	    const expanded = new Uint8Array(40);
	    for (let i = 0; i < 40; i++) {
	        expanded[i] = chars[i].charCodeAt(0);
	    }
	    const hashed = arrayify(keccak256(expanded));
	    for (let i = 0; i < 40; i += 2) {
	        if ((hashed[i >> 1] >> 4) >= 8) {
	            chars[i] = chars[i].toUpperCase();
	        }
	        if ((hashed[i >> 1] & 0x0f) >= 8) {
	            chars[i + 1] = chars[i + 1].toUpperCase();
	        }
	    }
	    return "0x" + chars.join("");
	}
	// Shims for environments that are missing some required constants and functions
	const MAX_SAFE_INTEGER = 0x1fffffffffffff;
	function log10(x) {
	    if (Math.log10) {
	        return Math.log10(x);
	    }
	    return Math.log(x) / Math.LN10;
	}
	// See: https://en.wikipedia.org/wiki/International_Bank_Account_Number
	// Create lookup table
	const ibanLookup = {};
	for (let i = 0; i < 10; i++) {
	    ibanLookup[String(i)] = String(i);
	}
	for (let i = 0; i < 26; i++) {
	    ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
	}
	// How many decimal digits can we process? (for 64-bit float, this is 15)
	const safeDigits = Math.floor(log10(MAX_SAFE_INTEGER));
	function ibanChecksum(address) {
	    address = address.toUpperCase();
	    address = address.substring(4) + address.substring(0, 2) + "00";
	    let expanded = address.split("").map((c) => { return ibanLookup[c]; }).join("");
	    // Javascript can handle integers safely up to 15 (decimal) digits
	    while (expanded.length >= safeDigits) {
	        let block = expanded.substring(0, safeDigits);
	        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
	    }
	    let checksum = String(98 - (parseInt(expanded, 10) % 97));
	    while (checksum.length < 2) {
	        checksum = "0" + checksum;
	    }
	    return checksum;
	}
	function getAddress(address) {
	    let result = null;
	    if (typeof (address) !== "string") {
	        logger$i.throwArgumentError("invalid address", "address", address);
	    }
	    if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
	        // Missing the 0x prefix
	        if (address.substring(0, 2) !== "0x") {
	            address = "0x" + address;
	        }
	        result = getChecksumAddress(address);
	        // It is a checksummed address with a bad checksum
	        if (address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) && result !== address) {
	            logger$i.throwArgumentError("bad address checksum", "address", address);
	        }
	        // Maybe ICAP? (we only support direct mode)
	    }
	    else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
	        // It is an ICAP address with a bad checksum
	        if (address.substring(2, 4) !== ibanChecksum(address)) {
	            logger$i.throwArgumentError("bad icap checksum", "address", address);
	        }
	        result = _base36To16(address.substring(4));
	        while (result.length < 40) {
	            result = "0" + result;
	        }
	        result = getChecksumAddress("0x" + result);
	    }
	    else {
	        logger$i.throwArgumentError("invalid address", "address", address);
	    }
	    return result;
	}
	// http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
	function getContractAddress(transaction) {
	    let from = null;
	    try {
	        from = getAddress(transaction.from);
	    }
	    catch (error) {
	        logger$i.throwArgumentError("missing from address", "transaction", transaction);
	    }
	    const nonce = stripZeros(arrayify(BigNumber.from(transaction.nonce).toHexString()));
	    return getAddress(hexDataSlice(keccak256(encode$2([from, nonce])), 12));
	}

	class AddressCoder extends Coder {
	    constructor(localName) {
	        super("address", "address", localName, false);
	    }
	    defaultValue() {
	        return "0x0000000000000000000000000000000000000000";
	    }
	    encode(writer, value) {
	        try {
	            value = getAddress(value);
	        }
	        catch (error) {
	            this._throwError(error.message, value);
	        }
	        return writer.writeValue(value);
	    }
	    decode(reader) {
	        return getAddress(hexZeroPad(reader.readValue().toHexString(), 20));
	    }
	}

	// Clones the functionality of an existing Coder, but without a localName
	class AnonymousCoder extends Coder {
	    constructor(coder) {
	        super(coder.name, coder.type, undefined, coder.dynamic);
	        this.coder = coder;
	    }
	    defaultValue() {
	        return this.coder.defaultValue();
	    }
	    encode(writer, value) {
	        return this.coder.encode(writer, value);
	    }
	    decode(reader) {
	        return this.coder.decode(reader);
	    }
	}

	const logger$h = new Logger(version$e);
	function pack(writer, coders, values) {
	    let arrayValues = null;
	    if (Array.isArray(values)) {
	        arrayValues = values;
	    }
	    else if (values && typeof (values) === "object") {
	        let unique = {};
	        arrayValues = coders.map((coder) => {
	            const name = coder.localName;
	            if (!name) {
	                logger$h.throwError("cannot encode object for signature with missing names", Logger.errors.INVALID_ARGUMENT, {
	                    argument: "values",
	                    coder: coder,
	                    value: values
	                });
	            }
	            if (unique[name]) {
	                logger$h.throwError("cannot encode object for signature with duplicate names", Logger.errors.INVALID_ARGUMENT, {
	                    argument: "values",
	                    coder: coder,
	                    value: values
	                });
	            }
	            unique[name] = true;
	            return values[name];
	        });
	    }
	    else {
	        logger$h.throwArgumentError("invalid tuple value", "tuple", values);
	    }
	    if (coders.length !== arrayValues.length) {
	        logger$h.throwArgumentError("types/value length mismatch", "tuple", values);
	    }
	    let staticWriter = new Writer(writer.wordSize);
	    let dynamicWriter = new Writer(writer.wordSize);
	    let updateFuncs = [];
	    coders.forEach((coder, index) => {
	        let value = arrayValues[index];
	        if (coder.dynamic) {
	            // Get current dynamic offset (for the future pointer)
	            let dynamicOffset = dynamicWriter.length;
	            // Encode the dynamic value into the dynamicWriter
	            coder.encode(dynamicWriter, value);
	            // Prepare to populate the correct offset once we are done
	            let updateFunc = staticWriter.writeUpdatableValue();
	            updateFuncs.push((baseOffset) => {
	                updateFunc(baseOffset + dynamicOffset);
	            });
	        }
	        else {
	            coder.encode(staticWriter, value);
	        }
	    });
	    // Backfill all the dynamic offsets, now that we know the static length
	    updateFuncs.forEach((func) => { func(staticWriter.length); });
	    let length = writer.appendWriter(staticWriter);
	    length += writer.appendWriter(dynamicWriter);
	    return length;
	}
	function unpack(reader, coders) {
	    let values = [];
	    // A reader anchored to this base
	    let baseReader = reader.subReader(0);
	    coders.forEach((coder) => {
	        let value = null;
	        if (coder.dynamic) {
	            let offset = reader.readValue();
	            let offsetReader = baseReader.subReader(offset.toNumber());
	            try {
	                value = coder.decode(offsetReader);
	            }
	            catch (error) {
	                // Cannot recover from this
	                if (error.code === Logger.errors.BUFFER_OVERRUN) {
	                    throw error;
	                }
	                value = error;
	                value.baseType = coder.name;
	                value.name = coder.localName;
	                value.type = coder.type;
	            }
	        }
	        else {
	            try {
	                value = coder.decode(reader);
	            }
	            catch (error) {
	                // Cannot recover from this
	                if (error.code === Logger.errors.BUFFER_OVERRUN) {
	                    throw error;
	                }
	                value = error;
	                value.baseType = coder.name;
	                value.name = coder.localName;
	                value.type = coder.type;
	            }
	        }
	        if (value != undefined) {
	            values.push(value);
	        }
	    });
	    // We only output named properties for uniquely named coders
	    const uniqueNames = coders.reduce((accum, coder) => {
	        const name = coder.localName;
	        if (name) {
	            if (!accum[name]) {
	                accum[name] = 0;
	            }
	            accum[name]++;
	        }
	        return accum;
	    }, {});
	    // Add any named parameters (i.e. tuples)
	    coders.forEach((coder, index) => {
	        let name = coder.localName;
	        if (!name || uniqueNames[name] !== 1) {
	            return;
	        }
	        if (name === "length") {
	            name = "_length";
	        }
	        if (values[name] != null) {
	            return;
	        }
	        const value = values[index];
	        if (value instanceof Error) {
	            Object.defineProperty(values, name, {
	                enumerable: true,
	                get: () => { throw value; }
	            });
	        }
	        else {
	            values[name] = value;
	        }
	    });
	    for (let i = 0; i < values.length; i++) {
	        const value = values[i];
	        if (value instanceof Error) {
	            Object.defineProperty(values, i, {
	                enumerable: true,
	                get: () => { throw value; }
	            });
	        }
	    }
	    return Object.freeze(values);
	}
	class ArrayCoder extends Coder {
	    constructor(coder, length, localName) {
	        const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
	        const dynamic = (length === -1 || coder.dynamic);
	        super("array", type, localName, dynamic);
	        this.coder = coder;
	        this.length = length;
	    }
	    defaultValue() {
	        // Verifies the child coder is valid (even if the array is dynamic or 0-length)
	        const defaultChild = this.coder.defaultValue();
	        const result = [];
	        for (let i = 0; i < this.length; i++) {
	            result.push(defaultChild);
	        }
	        return result;
	    }
	    encode(writer, value) {
	        if (!Array.isArray(value)) {
	            this._throwError("expected array value", value);
	        }
	        let count = this.length;
	        if (count === -1) {
	            count = value.length;
	            writer.writeValue(value.length);
	        }
	        logger$h.checkArgumentCount(value.length, count, "coder array" + (this.localName ? (" " + this.localName) : ""));
	        let coders = [];
	        for (let i = 0; i < value.length; i++) {
	            coders.push(this.coder);
	        }
	        return pack(writer, coders, value);
	    }
	    decode(reader) {
	        let count = this.length;
	        if (count === -1) {
	            count = reader.readValue().toNumber();
	            // Check that there is *roughly* enough data to ensure
	            // stray random data is not being read as a length. Each
	            // slot requires at least 32 bytes for their value (or 32
	            // bytes as a link to the data). This could use a much
	            // tighter bound, but we are erroring on the side of safety.
	            if (count * 32 > reader._data.length) {
	                logger$h.throwError("insufficient data length", Logger.errors.BUFFER_OVERRUN, {
	                    length: reader._data.length,
	                    count: count
	                });
	            }
	        }
	        let coders = [];
	        for (let i = 0; i < count; i++) {
	            coders.push(new AnonymousCoder(this.coder));
	        }
	        return reader.coerce(this.name, unpack(reader, coders));
	    }
	}

	class BooleanCoder extends Coder {
	    constructor(localName) {
	        super("bool", "bool", localName, false);
	    }
	    defaultValue() {
	        return false;
	    }
	    encode(writer, value) {
	        return writer.writeValue(value ? 1 : 0);
	    }
	    decode(reader) {
	        return reader.coerce(this.type, !reader.readValue().isZero());
	    }
	}

	class DynamicBytesCoder extends Coder {
	    constructor(type, localName) {
	        super(type, type, localName, true);
	    }
	    defaultValue() {
	        return "0x";
	    }
	    encode(writer, value) {
	        value = arrayify(value);
	        let length = writer.writeValue(value.length);
	        length += writer.writeBytes(value);
	        return length;
	    }
	    decode(reader) {
	        return reader.readBytes(reader.readValue().toNumber(), true);
	    }
	}
	class BytesCoder extends DynamicBytesCoder {
	    constructor(localName) {
	        super("bytes", localName);
	    }
	    decode(reader) {
	        return reader.coerce(this.name, hexlify(super.decode(reader)));
	    }
	}

	// @TODO: Merge this with bytes
	class FixedBytesCoder extends Coder {
	    constructor(size, localName) {
	        let name = "bytes" + String(size);
	        super(name, name, localName, false);
	        this.size = size;
	    }
	    defaultValue() {
	        return ("0x0000000000000000000000000000000000000000000000000000000000000000").substring(0, 2 + this.size * 2);
	    }
	    encode(writer, value) {
	        let data = arrayify(value);
	        if (data.length !== this.size) {
	            this._throwError("incorrect data length", value);
	        }
	        return writer.writeBytes(data);
	    }
	    decode(reader) {
	        return reader.coerce(this.name, hexlify(reader.readBytes(this.size)));
	    }
	}

	class NullCoder extends Coder {
	    constructor(localName) {
	        super("null", "", localName, false);
	    }
	    defaultValue() {
	        return null;
	    }
	    encode(writer, value) {
	        if (value != null) {
	            this._throwError("not null", value);
	        }
	        return writer.writeBytes([]);
	    }
	    decode(reader) {
	        reader.readBytes(0);
	        return reader.coerce(this.name, null);
	    }
	}

	const AddressZero = "0x0000000000000000000000000000000000000000";

	const NegativeOne$1 = ( /*#__PURE__*/BigNumber.from(-1));
	const Zero$1 = ( /*#__PURE__*/BigNumber.from(0));
	const One$1 = ( /*#__PURE__*/BigNumber.from(1));
	const MaxUint256$1 = ( /*#__PURE__*/BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));

	const HashZero = "0x0000000000000000000000000000000000000000000000000000000000000000";

	class NumberCoder extends Coder {
	    constructor(size, signed, localName) {
	        const name = ((signed ? "int" : "uint") + (size * 8));
	        super(name, name, localName, false);
	        this.size = size;
	        this.signed = signed;
	    }
	    defaultValue() {
	        return 0;
	    }
	    encode(writer, value) {
	        let v = BigNumber.from(value);
	        // Check bounds are safe for encoding
	        let maxUintValue = MaxUint256$1.mask(writer.wordSize * 8);
	        if (this.signed) {
	            let bounds = maxUintValue.mask(this.size * 8 - 1);
	            if (v.gt(bounds) || v.lt(bounds.add(One$1).mul(NegativeOne$1))) {
	                this._throwError("value out-of-bounds", value);
	            }
	        }
	        else if (v.lt(Zero$1) || v.gt(maxUintValue.mask(this.size * 8))) {
	            this._throwError("value out-of-bounds", value);
	        }
	        v = v.toTwos(this.size * 8).mask(this.size * 8);
	        if (this.signed) {
	            v = v.fromTwos(this.size * 8).toTwos(8 * writer.wordSize);
	        }
	        return writer.writeValue(v);
	    }
	    decode(reader) {
	        let value = reader.readValue().mask(this.size * 8);
	        if (this.signed) {
	            value = value.fromTwos(this.size * 8);
	        }
	        return reader.coerce(this.name, value);
	    }
	}

	const version$b = "strings/5.7.0";

	const logger$g = new Logger(version$b);
	///////////////////////////////
	var UnicodeNormalizationForm;
	(function (UnicodeNormalizationForm) {
	    UnicodeNormalizationForm["current"] = "";
	    UnicodeNormalizationForm["NFC"] = "NFC";
	    UnicodeNormalizationForm["NFD"] = "NFD";
	    UnicodeNormalizationForm["NFKC"] = "NFKC";
	    UnicodeNormalizationForm["NFKD"] = "NFKD";
	})(UnicodeNormalizationForm || (UnicodeNormalizationForm = {}));
	var Utf8ErrorReason;
	(function (Utf8ErrorReason) {
	    // A continuation byte was present where there was nothing to continue
	    // - offset = the index the codepoint began in
	    Utf8ErrorReason["UNEXPECTED_CONTINUE"] = "unexpected continuation byte";
	    // An invalid (non-continuation) byte to start a UTF-8 codepoint was found
	    // - offset = the index the codepoint began in
	    Utf8ErrorReason["BAD_PREFIX"] = "bad codepoint prefix";
	    // The string is too short to process the expected codepoint
	    // - offset = the index the codepoint began in
	    Utf8ErrorReason["OVERRUN"] = "string overrun";
	    // A missing continuation byte was expected but not found
	    // - offset = the index the continuation byte was expected at
	    Utf8ErrorReason["MISSING_CONTINUE"] = "missing continuation byte";
	    // The computed code point is outside the range for UTF-8
	    // - offset       = start of this codepoint
	    // - badCodepoint = the computed codepoint; outside the UTF-8 range
	    Utf8ErrorReason["OUT_OF_RANGE"] = "out of UTF-8 range";
	    // UTF-8 strings may not contain UTF-16 surrogate pairs
	    // - offset       = start of this codepoint
	    // - badCodepoint = the computed codepoint; inside the UTF-16 surrogate range
	    Utf8ErrorReason["UTF16_SURROGATE"] = "UTF-16 surrogate";
	    // The string is an overlong representation
	    // - offset       = start of this codepoint
	    // - badCodepoint = the computed codepoint; already bounds checked
	    Utf8ErrorReason["OVERLONG"] = "overlong representation";
	})(Utf8ErrorReason || (Utf8ErrorReason = {}));
	function errorFunc(reason, offset, bytes, output, badCodepoint) {
	    return logger$g.throwArgumentError(`invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
	}
	function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
	    // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
	    if (reason === Utf8ErrorReason.BAD_PREFIX || reason === Utf8ErrorReason.UNEXPECTED_CONTINUE) {
	        let i = 0;
	        for (let o = offset + 1; o < bytes.length; o++) {
	            if (bytes[o] >> 6 !== 0x02) {
	                break;
	            }
	            i++;
	        }
	        return i;
	    }
	    // This byte runs us past the end of the string, so just jump to the end
	    // (but the first byte was read already read and therefore skipped)
	    if (reason === Utf8ErrorReason.OVERRUN) {
	        return bytes.length - offset - 1;
	    }
	    // Nothing to skip
	    return 0;
	}
	function replaceFunc(reason, offset, bytes, output, badCodepoint) {
	    // Overlong representations are otherwise "valid" code points; just non-deistingtished
	    if (reason === Utf8ErrorReason.OVERLONG) {
	        output.push(badCodepoint);
	        return 0;
	    }
	    // Put the replacement character into the output
	    output.push(0xfffd);
	    // Otherwise, process as if ignoring errors
	    return ignoreFunc(reason, offset, bytes);
	}
	// Common error handing strategies
	const Utf8ErrorFuncs = Object.freeze({
	    error: errorFunc,
	    ignore: ignoreFunc,
	    replace: replaceFunc
	});
	// http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
	function getUtf8CodePoints(bytes, onError) {
	    if (onError == null) {
	        onError = Utf8ErrorFuncs.error;
	    }
	    bytes = arrayify(bytes);
	    const result = [];
	    let i = 0;
	    // Invalid bytes are ignored
	    while (i < bytes.length) {
	        const c = bytes[i++];
	        // 0xxx xxxx
	        if (c >> 7 === 0) {
	            result.push(c);
	            continue;
	        }
	        // Multibyte; how many bytes left for this character?
	        let extraLength = null;
	        let overlongMask = null;
	        // 110x xxxx 10xx xxxx
	        if ((c & 0xe0) === 0xc0) {
	            extraLength = 1;
	            overlongMask = 0x7f;
	            // 1110 xxxx 10xx xxxx 10xx xxxx
	        }
	        else if ((c & 0xf0) === 0xe0) {
	            extraLength = 2;
	            overlongMask = 0x7ff;
	            // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
	        }
	        else if ((c & 0xf8) === 0xf0) {
	            extraLength = 3;
	            overlongMask = 0xffff;
	        }
	        else {
	            if ((c & 0xc0) === 0x80) {
	                i += onError(Utf8ErrorReason.UNEXPECTED_CONTINUE, i - 1, bytes, result);
	            }
	            else {
	                i += onError(Utf8ErrorReason.BAD_PREFIX, i - 1, bytes, result);
	            }
	            continue;
	        }
	        // Do we have enough bytes in our data?
	        if (i - 1 + extraLength >= bytes.length) {
	            i += onError(Utf8ErrorReason.OVERRUN, i - 1, bytes, result);
	            continue;
	        }
	        // Remove the length prefix from the char
	        let res = c & ((1 << (8 - extraLength - 1)) - 1);
	        for (let j = 0; j < extraLength; j++) {
	            let nextChar = bytes[i];
	            // Invalid continuation byte
	            if ((nextChar & 0xc0) != 0x80) {
	                i += onError(Utf8ErrorReason.MISSING_CONTINUE, i, bytes, result);
	                res = null;
	                break;
	            }
	            res = (res << 6) | (nextChar & 0x3f);
	            i++;
	        }
	        // See above loop for invalid continuation byte
	        if (res === null) {
	            continue;
	        }
	        // Maximum code point
	        if (res > 0x10ffff) {
	            i += onError(Utf8ErrorReason.OUT_OF_RANGE, i - 1 - extraLength, bytes, result, res);
	            continue;
	        }
	        // Reserved for UTF-16 surrogate halves
	        if (res >= 0xd800 && res <= 0xdfff) {
	            i += onError(Utf8ErrorReason.UTF16_SURROGATE, i - 1 - extraLength, bytes, result, res);
	            continue;
	        }
	        // Check for overlong sequences (more bytes than needed)
	        if (res <= overlongMask) {
	            i += onError(Utf8ErrorReason.OVERLONG, i - 1 - extraLength, bytes, result, res);
	            continue;
	        }
	        result.push(res);
	    }
	    return result;
	}
	// http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
	function toUtf8Bytes(str, form = UnicodeNormalizationForm.current) {
	    if (form != UnicodeNormalizationForm.current) {
	        logger$g.checkNormalize();
	        str = str.normalize(form);
	    }
	    let result = [];
	    for (let i = 0; i < str.length; i++) {
	        const c = str.charCodeAt(i);
	        if (c < 0x80) {
	            result.push(c);
	        }
	        else if (c < 0x800) {
	            result.push((c >> 6) | 0xc0);
	            result.push((c & 0x3f) | 0x80);
	        }
	        else if ((c & 0xfc00) == 0xd800) {
	            i++;
	            const c2 = str.charCodeAt(i);
	            if (i >= str.length || (c2 & 0xfc00) !== 0xdc00) {
	                throw new Error("invalid utf-8 string");
	            }
	            // Surrogate Pair
	            const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
	            result.push((pair >> 18) | 0xf0);
	            result.push(((pair >> 12) & 0x3f) | 0x80);
	            result.push(((pair >> 6) & 0x3f) | 0x80);
	            result.push((pair & 0x3f) | 0x80);
	        }
	        else {
	            result.push((c >> 12) | 0xe0);
	            result.push(((c >> 6) & 0x3f) | 0x80);
	            result.push((c & 0x3f) | 0x80);
	        }
	    }
	    return arrayify(result);
	}
	function _toUtf8String(codePoints) {
	    return codePoints.map((codePoint) => {
	        if (codePoint <= 0xffff) {
	            return String.fromCharCode(codePoint);
	        }
	        codePoint -= 0x10000;
	        return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
	    }).join("");
	}
	function toUtf8String(bytes, onError) {
	    return _toUtf8String(getUtf8CodePoints(bytes, onError));
	}
	function toUtf8CodePoints(str, form = UnicodeNormalizationForm.current) {
	    return getUtf8CodePoints(toUtf8Bytes(str, form));
	}

	class StringCoder extends DynamicBytesCoder {
	    constructor(localName) {
	        super("string", localName);
	    }
	    defaultValue() {
	        return "";
	    }
	    encode(writer, value) {
	        return super.encode(writer, toUtf8Bytes(value));
	    }
	    decode(reader) {
	        return toUtf8String(super.decode(reader));
	    }
	}

	class TupleCoder extends Coder {
	    constructor(coders, localName) {
	        let dynamic = false;
	        const types = [];
	        coders.forEach((coder) => {
	            if (coder.dynamic) {
	                dynamic = true;
	            }
	            types.push(coder.type);
	        });
	        const type = ("tuple(" + types.join(",") + ")");
	        super("tuple", type, localName, dynamic);
	        this.coders = coders;
	    }
	    defaultValue() {
	        const values = [];
	        this.coders.forEach((coder) => {
	            values.push(coder.defaultValue());
	        });
	        // We only output named properties for uniquely named coders
	        const uniqueNames = this.coders.reduce((accum, coder) => {
	            const name = coder.localName;
	            if (name) {
	                if (!accum[name]) {
	                    accum[name] = 0;
	                }
	                accum[name]++;
	            }
	            return accum;
	        }, {});
	        // Add named values
	        this.coders.forEach((coder, index) => {
	            let name = coder.localName;
	            if (!name || uniqueNames[name] !== 1) {
	                return;
	            }
	            if (name === "length") {
	                name = "_length";
	            }
	            if (values[name] != null) {
	                return;
	            }
	            values[name] = values[index];
	        });
	        return Object.freeze(values);
	    }
	    encode(writer, value) {
	        return pack(writer, this.coders, value);
	    }
	    decode(reader) {
	        return reader.coerce(this.name, unpack(reader, this.coders));
	    }
	}

	const logger$f = new Logger(version$e);
	const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
	const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
	class AbiCoder {
	    constructor(coerceFunc) {
	        defineReadOnly(this, "coerceFunc", coerceFunc || null);
	    }
	    _getCoder(param) {
	        switch (param.baseType) {
	            case "address":
	                return new AddressCoder(param.name);
	            case "bool":
	                return new BooleanCoder(param.name);
	            case "string":
	                return new StringCoder(param.name);
	            case "bytes":
	                return new BytesCoder(param.name);
	            case "array":
	                return new ArrayCoder(this._getCoder(param.arrayChildren), param.arrayLength, param.name);
	            case "tuple":
	                return new TupleCoder((param.components || []).map((component) => {
	                    return this._getCoder(component);
	                }), param.name);
	            case "":
	                return new NullCoder(param.name);
	        }
	        // u?int[0-9]*
	        let match = param.type.match(paramTypeNumber);
	        if (match) {
	            let size = parseInt(match[2] || "256");
	            if (size === 0 || size > 256 || (size % 8) !== 0) {
	                logger$f.throwArgumentError("invalid " + match[1] + " bit length", "param", param);
	            }
	            return new NumberCoder(size / 8, (match[1] === "int"), param.name);
	        }
	        // bytes[0-9]+
	        match = param.type.match(paramTypeBytes);
	        if (match) {
	            let size = parseInt(match[1]);
	            if (size === 0 || size > 32) {
	                logger$f.throwArgumentError("invalid bytes length", "param", param);
	            }
	            return new FixedBytesCoder(size, param.name);
	        }
	        return logger$f.throwArgumentError("invalid type", "type", param.type);
	    }
	    _getWordSize() { return 32; }
	    _getReader(data, allowLoose) {
	        return new Reader(data, this._getWordSize(), this.coerceFunc, allowLoose);
	    }
	    _getWriter() {
	        return new Writer(this._getWordSize());
	    }
	    getDefaultValue(types) {
	        const coders = types.map((type) => this._getCoder(ParamType.from(type)));
	        const coder = new TupleCoder(coders, "_");
	        return coder.defaultValue();
	    }
	    encode(types, values) {
	        if (types.length !== values.length) {
	            logger$f.throwError("types/values length mismatch", Logger.errors.INVALID_ARGUMENT, {
	                count: { types: types.length, values: values.length },
	                value: { types: types, values: values }
	            });
	        }
	        const coders = types.map((type) => this._getCoder(ParamType.from(type)));
	        const coder = (new TupleCoder(coders, "_"));
	        const writer = this._getWriter();
	        coder.encode(writer, values);
	        return writer.data;
	    }
	    decode(types, data, loose) {
	        const coders = types.map((type) => this._getCoder(ParamType.from(type)));
	        const coder = new TupleCoder(coders, "_");
	        return coder.decode(this._getReader(arrayify(data), loose));
	    }
	}
	const defaultAbiCoder = new AbiCoder();

	function id(text) {
	    return keccak256(toUtf8Bytes(text));
	}

	const version$a = "hash/5.7.0";

	function decode$1(textData) {
	    textData = atob(textData);
	    const data = [];
	    for (let i = 0; i < textData.length; i++) {
	        data.push(textData.charCodeAt(i));
	    }
	    return arrayify(data);
	}
	function encode$1(data) {
	    data = arrayify(data);
	    let textData = "";
	    for (let i = 0; i < data.length; i++) {
	        textData += String.fromCharCode(data[i]);
	    }
	    return btoa(textData);
	}

	/**
	 * MIT License
	 *
	 * Copyright (c) 2021 Andrew Raffensperger
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 *
	 * This is a near carbon-copy of the original source (link below) with the
	 * TypeScript typings added and a few tweaks to make it ES3-compatible.
	 *
	 * See: https://github.com/adraffy/ens-normalize.js
	 */
	// https://github.com/behnammodi/polyfill/blob/master/array.polyfill.js
	function flat(array, depth) {
	    if (depth == null) {
	        depth = 1;
	    }
	    const result = [];
	    const forEach = result.forEach;
	    const flatDeep = function (arr, depth) {
	        forEach.call(arr, function (val) {
	            if (depth > 0 && Array.isArray(val)) {
	                flatDeep(val, depth - 1);
	            }
	            else {
	                result.push(val);
	            }
	        });
	    };
	    flatDeep(array, depth);
	    return result;
	}
	function fromEntries(array) {
	    const result = {};
	    for (let i = 0; i < array.length; i++) {
	        const value = array[i];
	        result[value[0]] = value[1];
	    }
	    return result;
	}
	function decode_arithmetic(bytes) {
	    let pos = 0;
	    function u16() { return (bytes[pos++] << 8) | bytes[pos++]; }
	    // decode the frequency table
	    let symbol_count = u16();
	    let total = 1;
	    let acc = [0, 1]; // first symbol has frequency 1
	    for (let i = 1; i < symbol_count; i++) {
	        acc.push(total += u16());
	    }
	    // skip the sized-payload that the last 3 symbols index into
	    let skip = u16();
	    let pos_payload = pos;
	    pos += skip;
	    let read_width = 0;
	    let read_buffer = 0;
	    function read_bit() {
	        if (read_width == 0) {
	            // this will read beyond end of buffer
	            // but (undefined|0) => zero pad
	            read_buffer = (read_buffer << 8) | bytes[pos++];
	            read_width = 8;
	        }
	        return (read_buffer >> --read_width) & 1;
	    }
	    const N = 31;
	    const FULL = Math.pow(2, N);
	    const HALF = FULL >>> 1;
	    const QRTR = HALF >> 1;
	    const MASK = FULL - 1;
	    // fill register
	    let register = 0;
	    for (let i = 0; i < N; i++)
	        register = (register << 1) | read_bit();
	    let symbols = [];
	    let low = 0;
	    let range = FULL; // treat like a float
	    while (true) {
	        let value = Math.floor((((register - low + 1) * total) - 1) / range);
	        let start = 0;
	        let end = symbol_count;
	        while (end - start > 1) { // binary search
	            let mid = (start + end) >>> 1;
	            if (value < acc[mid]) {
	                end = mid;
	            }
	            else {
	                start = mid;
	            }
	        }
	        if (start == 0)
	            break; // first symbol is end mark
	        symbols.push(start);
	        let a = low + Math.floor(range * acc[start] / total);
	        let b = low + Math.floor(range * acc[start + 1] / total) - 1;
	        while (((a ^ b) & HALF) == 0) {
	            register = (register << 1) & MASK | read_bit();
	            a = (a << 1) & MASK;
	            b = (b << 1) & MASK | 1;
	        }
	        while (a & ~b & QRTR) {
	            register = (register & HALF) | ((register << 1) & (MASK >>> 1)) | read_bit();
	            a = (a << 1) ^ HALF;
	            b = ((b ^ HALF) << 1) | HALF | 1;
	        }
	        low = a;
	        range = 1 + b - a;
	    }
	    let offset = symbol_count - 4;
	    return symbols.map(x => {
	        switch (x - offset) {
	            case 3: return offset + 0x10100 + ((bytes[pos_payload++] << 16) | (bytes[pos_payload++] << 8) | bytes[pos_payload++]);
	            case 2: return offset + 0x100 + ((bytes[pos_payload++] << 8) | bytes[pos_payload++]);
	            case 1: return offset + bytes[pos_payload++];
	            default: return x - 1;
	        }
	    });
	}
	// returns an iterator which returns the next symbol
	function read_payload(v) {
	    let pos = 0;
	    return () => v[pos++];
	}
	function read_compressed_payload(bytes) {
	    return read_payload(decode_arithmetic(bytes));
	}
	// eg. [0,1,2,3...] => [0,-1,1,-2,...]
	function signed(i) {
	    return (i & 1) ? (~i >> 1) : (i >> 1);
	}
	function read_counts(n, next) {
	    let v = Array(n);
	    for (let i = 0; i < n; i++)
	        v[i] = 1 + next();
	    return v;
	}
	function read_ascending(n, next) {
	    let v = Array(n);
	    for (let i = 0, x = -1; i < n; i++)
	        v[i] = x += 1 + next();
	    return v;
	}
	function read_deltas(n, next) {
	    let v = Array(n);
	    for (let i = 0, x = 0; i < n; i++)
	        v[i] = x += signed(next());
	    return v;
	}
	function read_member_array(next, lookup) {
	    let v = read_ascending(next(), next);
	    let n = next();
	    let vX = read_ascending(n, next);
	    let vN = read_counts(n, next);
	    for (let i = 0; i < n; i++) {
	        for (let j = 0; j < vN[i]; j++) {
	            v.push(vX[i] + j);
	        }
	    }
	    return lookup ? v.map(x => lookup[x]) : v;
	}
	// returns array of 
	// [x, ys] => single replacement rule
	// [x, ys, n, dx, dx] => linear map
	function read_mapped_map(next) {
	    let ret = [];
	    while (true) {
	        let w = next();
	        if (w == 0)
	            break;
	        ret.push(read_linear_table(w, next));
	    }
	    while (true) {
	        let w = next() - 1;
	        if (w < 0)
	            break;
	        ret.push(read_replacement_table(w, next));
	    }
	    return fromEntries(flat(ret));
	}
	function read_zero_terminated_array(next) {
	    let v = [];
	    while (true) {
	        let i = next();
	        if (i == 0)
	            break;
	        v.push(i);
	    }
	    return v;
	}
	function read_transposed(n, w, next) {
	    let m = Array(n).fill(undefined).map(() => []);
	    for (let i = 0; i < w; i++) {
	        read_deltas(n, next).forEach((x, j) => m[j].push(x));
	    }
	    return m;
	}
	function read_linear_table(w, next) {
	    let dx = 1 + next();
	    let dy = next();
	    let vN = read_zero_terminated_array(next);
	    let m = read_transposed(vN.length, 1 + w, next);
	    return flat(m.map((v, i) => {
	        const x = v[0], ys = v.slice(1);
	        //let [x, ...ys] = v;
	        //return Array(vN[i]).fill().map((_, j) => {
	        return Array(vN[i]).fill(undefined).map((_, j) => {
	            let j_dy = j * dy;
	            return [x + j * dx, ys.map(y => y + j_dy)];
	        });
	    }));
	}
	function read_replacement_table(w, next) {
	    let n = 1 + next();
	    let m = read_transposed(n, 1 + w, next);
	    return m.map(v => [v[0], v.slice(1)]);
	}
	function read_emoji_trie(next) {
	    let sorted = read_member_array(next).sort((a, b) => a - b);
	    return read();
	    function read() {
	        let branches = [];
	        while (true) {
	            let keys = read_member_array(next, sorted);
	            if (keys.length == 0)
	                break;
	            branches.push({ set: new Set(keys), node: read() });
	        }
	        branches.sort((a, b) => b.set.size - a.set.size); // sort by likelihood
	        let temp = next();
	        let valid = temp % 3;
	        temp = (temp / 3) | 0;
	        let fe0f = !!(temp & 1);
	        temp >>= 1;
	        let save = temp == 1;
	        let check = temp == 2;
	        return { branches, valid, fe0f, save, check };
	    }
	}

	/**
	 * MIT License
	 *
	 * Copyright (c) 2021 Andrew Raffensperger
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 *
	 * This is a near carbon-copy of the original source (link below) with the
	 * TypeScript typings added and a few tweaks to make it ES3-compatible.
	 *
	 * See: https://github.com/adraffy/ens-normalize.js
	 */
	function getData() {
	    return read_compressed_payload(decode$1('AEQF2AO2DEsA2wIrAGsBRABxAN8AZwCcAEwAqgA0AGwAUgByADcATAAVAFYAIQAyACEAKAAYAFgAGwAjABQAMAAmADIAFAAfABQAKwATACoADgAbAA8AHQAYABoAGQAxADgALAAoADwAEwA9ABMAGgARAA4ADwAWABMAFgAIAA8AHgQXBYMA5BHJAS8JtAYoAe4AExozi0UAH21tAaMnBT8CrnIyhrMDhRgDygIBUAEHcoFHUPe8AXBjAewCjgDQR8IICIcEcQLwATXCDgzvHwBmBoHNAqsBdBcUAykgDhAMShskMgo8AY8jqAQfAUAfHw8BDw87MioGlCIPBwZCa4ELatMAAMspJVgsDl8AIhckSg8XAHdvTwBcIQEiDT4OPhUqbyECAEoAS34Aej8Ybx83JgT/Xw8gHxZ/7w8RICxPHA9vBw+Pfw8PHwAPFv+fAsAvCc8vEr8ivwD/EQ8Bol8OEBa/A78hrwAPCU8vESNvvwWfHwNfAVoDHr+ZAAED34YaAdJPAK7PLwSEgDLHAGo1Pz8Pvx9fUwMrpb8O/58VTzAPIBoXIyQJNF8hpwIVAT8YGAUADDNBaX3RAMomJCg9EhUeA29MABsZBTMNJipjOhc19gcIDR8bBwQHEggCWi6DIgLuAQYA+BAFCha3A5XiAEsqM7UFFgFLhAMjFTMYE1Klnw74nRVBG/ASCm0BYRN/BrsU3VoWy+S0vV8LQx+vN8gF2AC2AK5EAWwApgYDKmAAroQ0NDQ0AT+OCg7wAAIHRAbpNgVcBV0APTA5BfbPFgMLzcYL/QqqA82eBALKCjQCjqYCht0/k2+OAsXQAoP3ASTKDgDw6ACKAUYCMpIKJpRaAE4A5womABzZvs0REEKiACIQAd5QdAECAj4Ywg/wGqY2AVgAYADYvAoCGAEubA0gvAY2ALAAbpbvqpyEAGAEpgQAJgAG7gAgAEACmghUFwCqAMpAINQIwC4DthRAAPcycKgApoIdABwBfCisABoATwBqASIAvhnSBP8aH/ECeAKXAq40NjgDBTwFYQU6AXs3oABgAD4XNgmcCY1eCl5tIFZeUqGgyoNHABgAEQAaABNwWQAmABMATPMa3T34ADldyprmM1M2XociUQgLzvwAXT3xABgAEQAaABNwIGFAnADD8AAgAD4BBJWzaCcIAIEBFMAWwKoAAdq9BWAF5wLQpALEtQAKUSGkahR4GnJM+gsAwCgeFAiUAECQ0BQuL8AAIAAAADKeIheclvFqQAAETr4iAMxIARMgAMIoHhQIAn0E0pDQFC4HhznoAAAAIAI2C0/4lvFqQAAETgBJJwYCAy4ABgYAFAA8MBKYEH4eRhTkAjYeFcgACAYAeABsOqyQ5gRwDayqugEgaIIAtgoACgDmEABmBAWGme5OBJJA2m4cDeoAmITWAXwrMgOgAGwBCh6CBXYF1Tzg1wKAAFdiuABRAFwAXQBsAG8AdgBrAHYAbwCEAHEwfxQBVE5TEQADVFhTBwBDANILAqcCzgLTApQCrQL6vAAMAL8APLhNBKkE6glGKTAU4Dr4N2EYEwBCkABKk8rHAbYBmwIoAiU4Ajf/Aq4CowCAANIChzgaNBsCsTgeODcFXrgClQKdAqQBiQGYAqsCsjTsNHsfNPA0ixsAWTWiOAMFPDQSNCk2BDZHNow2TTZUNhk28Jk9VzI3QkEoAoICoQKwAqcAQAAxBV4FXbS9BW47YkIXP1ciUqs05DS/FwABUwJW11e6nHuYZmSh/RAYA8oMKvZ8KASoUAJYWAJ6ILAsAZSoqjpgA0ocBIhmDgDWAAawRDQoAAcuAj5iAHABZiR2AIgiHgCaAU68ACxuHAG0ygM8MiZIAlgBdF4GagJqAPZOHAMuBgoATkYAsABiAHgAMLoGDPj0HpKEBAAOJgAuALggTAHWAeAMEDbd20Uege0ADwAWADkAQgA9OHd+2MUQZBBhBgNNDkxxPxUQArEPqwvqERoM1irQ090ANK4H8ANYB/ADWANYB/AH8ANYB/ADWANYA1gDWBwP8B/YxRBkD00EcgWTBZAE2wiIJk4RhgctCNdUEnQjHEwDSgEBIypJITuYMxAlR0wRTQgIATZHbKx9PQNMMbBU+pCnA9AyVDlxBgMedhKlAC8PeCE1uk6DekxxpQpQT7NX9wBFBgASqwAS5gBJDSgAUCwGPQBI4zTYABNGAE2bAE3KAExdGABKaAbgAFBXAFCOAFBJABI2SWdObALDOq0//QomCZhvwHdTBkIQHCemEPgMNAG2ATwN7kvZBPIGPATKH34ZGg/OlZ0Ipi3eDO4m5C6igFsj9iqEBe5L9TzeC05RaQ9aC2YJ5DpkgU8DIgEOIowK3g06CG4Q9ArKbA3mEUYHOgPWSZsApgcCCxIdNhW2JhFirQsKOXgG/Br3C5AmsBMqev0F1BoiBk4BKhsAANAu6IWxWjJcHU9gBgQLJiPIFKlQIQ0mQLh4SRocBxYlqgKSQ3FKiFE3HpQh9zw+DWcuFFF9B/Y8BhlQC4I8n0asRQ8R0z6OPUkiSkwtBDaALDAnjAnQD4YMunxzAVoJIgmyDHITMhEYN8YIOgcaLpclJxYIIkaWYJsE+KAD9BPSAwwFQAlCBxQDthwuEy8VKgUOgSXYAvQ21i60ApBWgQEYBcwPJh/gEFFH4Q7qCJwCZgOEJewALhUiABginAhEZABgj9lTBi7MCMhqbSN1A2gU6GIRdAeSDlgHqBw0FcAc4nDJXgyGCSiksAlcAXYJmgFgBOQICjVcjKEgQmdUi1kYnCBiQUBd/QIyDGYVoES+h3kCjA9sEhwBNgF0BzoNAgJ4Ee4RbBCWCOyGBTW2M/k6JgRQIYQgEgooA1BszwsoJvoM+WoBpBJjAw00PnfvZ6xgtyUX/gcaMsZBYSHyC5NPzgydGsIYQ1QvGeUHwAP0GvQn60FYBgADpAQUOk4z7wS+C2oIjAlAAEoOpBgH2BhrCnKM0QEyjAG4mgNYkoQCcJAGOAcMAGgMiAV65gAeAqgIpAAGANADWAA6Aq4HngAaAIZCAT4DKDABIuYCkAOUCDLMAZYwAfQqBBzEDBYA+DhuSwLDsgKAa2ajBd5ZAo8CSjYBTiYEBk9IUgOwcuIA3ABMBhTgSAEWrEvMG+REAeBwLADIAPwABjYHBkIBzgH0bgC4AWALMgmjtLYBTuoqAIQAFmwB2AKKAN4ANgCA8gFUAE4FWvoF1AJQSgESMhksWGIBvAMgATQBDgB6BsyOpsoIIARuB9QCEBwV4gLvLwe2AgMi4BPOQsYCvd9WADIXUu5eZwqoCqdeaAC0YTQHMnM9UQAPH6k+yAdy/BZIiQImSwBQ5gBQQzSaNTFWSTYBpwGqKQK38AFtqwBI/wK37gK3rQK3sAK6280C0gK33AK3zxAAUEIAUD9SklKDArekArw5AEQAzAHCO147WTteO1k7XjtZO147WTteO1kDmChYI03AVU0oJqkKbV9GYewMpw3VRMk6ShPcYFJgMxPJLbgUwhXPJVcZPhq9JwYl5VUKDwUt1GYxCC00dhe9AEApaYNCY4ceMQpMHOhTklT5LRwAskujM7ANrRsWREEFSHXuYisWDwojAmSCAmJDXE6wXDchAqH4AmiZAmYKAp+FOBwMAmY8AmYnBG8EgAN/FAN+kzkHOXgYOYM6JCQCbB4CMjc4CwJtyAJtr/CLADRoRiwBaADfAOIASwYHmQyOAP8MwwAOtgJ3MAJ2o0ACeUxEAni7Hl3cRa9G9AJ8QAJ6yQJ9CgJ88UgBSH5kJQAsFklZSlwWGErNAtECAtDNSygDiFADh+dExpEzAvKiXQQDA69Lz0wuJgTQTU1NsAKLQAKK2cIcCB5EaAa4Ao44Ao5dQZiCAo7aAo5deVG1UzYLUtVUhgKT/AKTDQDqAB1VH1WwVdEHLBwplocy4nhnRTw6ApegAu+zWCKpAFomApaQApZ9nQCqWa1aCoJOADwClrYClk9cRVzSApnMApllXMtdCBoCnJw5wzqeApwXAp+cAp65iwAeEDIrEAKd8gKekwC2PmE1YfACntQCoG8BqgKeoCACnk+mY8lkKCYsAiewAiZ/AqD8AqBN2AKmMAKlzwKoAAB+AqfzaH1osgAESmodatICrOQCrK8CrWgCrQMCVx4CVd0CseLYAx9PbJgCsr4OArLpGGzhbWRtSWADJc4Ctl08QG6RAylGArhfArlIFgK5K3hwN3DiAr0aAy2zAzISAr6JcgMDM3ICvhtzI3NQAsPMAsMFc4N0TDZGdOEDPKgDPJsDPcACxX0CxkgCxhGKAshqUgLIRQLJUALJLwJkngLd03h6YniveSZL0QMYpGcDAmH1GfSVJXsMXpNevBICz2wCz20wTFTT9BSgAMeuAs90ASrrA04TfkwGAtwoAtuLAtJQA1JdA1NgAQIDVY2AikABzBfuYUZ2AILPg44C2sgC2d+EEYRKpz0DhqYAMANkD4ZyWvoAVgLfZgLeuXR4AuIw7RUB8zEoAfScAfLTiALr9ALpcXoAAur6AurlAPpIAboC7ooC652Wq5cEAu5AA4XhmHpw4XGiAvMEAGoDjheZlAL3FAORbwOSiAL3mQL52gL4Z5odmqy8OJsfA52EAv77ARwAOp8dn7QDBY4DpmsDptoA0sYDBmuhiaIGCgMMSgFgASACtgNGAJwEgLpoBgC8BGzAEowcggCEDC6kdjoAJAM0C5IKRoABZCgiAIzw3AYBLACkfng9ogigkgNmWAN6AEQCvrkEVqTGAwCsBRbAA+4iQkMCHR072jI2PTbUNsk2RjY5NvA23TZKNiU3EDcZN5I+RTxDRTBCJkK5VBYKFhZfwQCWygU3AJBRHpu+OytgNxa61A40GMsYjsn7BVwFXQVcBV0FaAVdBVwFXQVcBV0FXAVdBVwFXUsaCNyKAK4AAQUHBwKU7oICoW1e7jAEzgPxA+YDwgCkBFDAwADABKzAAOxFLhitA1UFTDeyPkM+bj51QkRCuwTQWWQ8X+0AWBYzsACNA8xwzAGm7EZ/QisoCTAbLDs6fnLfb8H2GccsbgFw13M1HAVkBW/Jxsm9CNRO8E8FDD0FBQw9FkcClOYCoMFegpDfADgcMiA2AJQACB8AsigKAIzIEAJKeBIApY5yPZQIAKQiHb4fvj5BKSRPQrZCOz0oXyxgOywfKAnGbgMClQaCAkILXgdeCD9IIGUgQj5fPoY+dT52Ao5CM0dAX9BTVG9SDzFwWTQAbxBzJF/lOEIQQglCCkKJIAls5AcClQICoKPMODEFxhi6KSAbiyfIRrMjtCgdWCAkPlFBIitCsEJRzAbMAV/OEyQzDg0OAQQEJ36i328/Mk9AybDJsQlq3tDRApUKAkFzXf1d/j9uALYP6hCoFgCTGD8kPsFKQiobrm0+zj0KSD8kPnVCRBwMDyJRTHFgMTJa5rwXQiQ2YfI/JD7BMEJEHGINTw4TOFlIRzwJO0icMQpyPyQ+wzJCRBv6DVgnKB01NgUKj2bwYzMqCoBkznBgEF+zYDIocwRIX+NgHj4HICNfh2C4CwdwFWpTG/lgUhYGAwRfv2Ts8mAaXzVgml/XYIJfuWC4HI1gUF9pYJZgMR6ilQHMAOwLAlDRefC0in4AXAEJA6PjCwc0IamOANMMCAECRQDFNRTZBgd+CwQlRA+r6+gLBDEFBnwUBXgKATIArwAGRAAHA3cDdAN2A3kDdwN9A3oDdQN7A30DfAN4A3oDfQAYEAAlAtYASwMAUAFsAHcKAHcAmgB3AHUAdQB2AHVu8UgAygDAAHcAdQB1AHYAdQALCgB3AAsAmgB3AAsCOwB3AAtu8UgAygDAAHgKAJoAdwB3AHUAdQB2AHUAeAB1AHUAdgB1bvFIAMoAwAALCgCaAHcACwB3AAsCOwB3AAtu8UgAygDAAH4ACwGgALcBpwC6AahdAu0COwLtbvFIAMoAwAALCgCaAu0ACwLtAAsCOwLtAAtu8UgAygDAA24ACwNvAAu0VsQAAzsAABCkjUIpAAsAUIusOggWcgMeBxVsGwL67U/2HlzmWOEeOgALASvuAAseAfpKUpnpGgYJDCIZM6YyARUE9ThqAD5iXQgnAJYJPnOzw0ZAEZxEKsIAkA4DhAHnTAIDxxUDK0lxCQlPYgIvIQVYJQBVqE1GakUAKGYiDToSBA1EtAYAXQJYAIF8GgMHRyAAIAjOe9YncekRAA0KACUrjwE7Ayc6AAYWAqaiKG4McEcqANoN3+Mg9TwCBhIkuCny+JwUQ29L008JluRxu3K+oAdqiHOqFH0AG5SUIfUJ5SxCGfxdipRzqTmT4V5Zb+r1Uo4Vm+NqSSEl2mNvR2JhIa8SpYO6ntdwFXHCWTCK8f2+Hxo7uiG3drDycAuKIMP5bhi06ACnqArH1rz4Rqg//lm6SgJGEVbF9xJHISaR6HxqxSnkw6shDnelHKNEfGUXSJRJ1GcsmtJw25xrZMDK9gXSm1/YMkdX4/6NKYOdtk/NQ3/NnDASjTc3fPjIjW/5sVfVObX2oTDWkr1dF9f3kxBsD3/3aQO8hPfRz+e0uEiJqt1161griu7gz8hDDwtpy+F+BWtefnKHZPAxcZoWbnznhJpy0e842j36bcNzGnIEusgGX0a8ZxsnjcSsPDZ09yZ36fCQbriHeQ72JRMILNl6ePPf2HWoVwgWAm1fb3V2sAY0+B6rAXqSwPBgseVmoqsBTSrm91+XasMYYySI8eeRxH3ZvHkMz3BQ5aJ3iUVbYPNM3/7emRtjlsMgv/9VyTsyt/mK+8fgWeT6SoFaclXqn42dAIsvAarF5vNNWHzKSkKQ/8Hfk5ZWK7r9yliOsooyBjRhfkHP4Q2DkWXQi6FG/9r/IwbmkV5T7JSopHKn1pJwm9tb5Ot0oyN1Z2mPpKXHTxx2nlK08fKk1hEYA8WgVVWL5lgx0iTv+KdojJeU23ZDjmiubXOxVXJKKi2Wjuh2HLZOFLiSC7Tls5SMh4f+Pj6xUSrNjFqLGehRNB8lC0QSLNmkJJx/wSG3MnjE9T1CkPwJI0wH2lfzwETIiVqUxg0dfu5q39Gt+hwdcxkhhNvQ4TyrBceof3Mhs/IxFci1HmHr4FMZgXEEczPiGCx0HRwzAqDq2j9AVm1kwN0mRVLWLylgtoPNapF5cY4Y1wJh/e0BBwZj44YgZrDNqvD/9Hv7GFYdUQeDJuQ3EWI4HaKqavU1XjC/n41kT4L79kqGq0kLhdTZvgP3TA3fS0ozVz+5piZsoOtIvBUFoMKbNcmBL6YxxaUAusHB38XrS8dQMnQwJfUUkpRoGr5AUeWicvBTzyK9g77+yCkf5PAysL7r/JjcZgrbvRpMW9iyaxZvKO6ceZN2EwIxKwVFPuvFuiEPGCoagbMo+SpydLrXqBzNCDGFCrO/rkcwa2xhokQZ5CdZ0AsU3JfSqJ6n5I14YA+P/uAgfhPU84Tlw7cEFfp7AEE8ey4sP12PTt4Cods1GRgDOB5xvyiR5m+Bx8O5nBCNctU8BevfV5A08x6RHd5jcwPTMDSZJOedIZ1cGQ704lxbAzqZOP05ZxaOghzSdvFBHYqomATARyAADK4elP8Ly3IrUZKfWh23Xy20uBUmLS4Pfagu9+oyVa2iPgqRP3F2CTUsvJ7+RYnN8fFZbU/HVvxvcFFDKkiTqV5UBZ3Gz54JAKByi9hkKMZJvuGgcSYXFmw08UyoQyVdfTD1/dMkCHXcTGAKeROgArsvmRrQTLUOXioOHGK2QkjHuoYFgXciZoTJd6Fs5q1QX1G+p/e26hYsEf7QZD1nnIyl/SFkNtYYmmBhpBrxl9WbY0YpHWRuw2Ll/tj9mD8P4snVzJl4F9J+1arVeTb9E5r2ILH04qStjxQNwn3m4YNqxmaNbLAqW2TN6LidwuJRqS+NXbtqxoeDXpxeGWmxzSkWxjkyCkX4NQRme6q5SAcC+M7+9ETfA/EwrzQajKakCwYyeunP6ZFlxU2oMEn1Pz31zeStW74G406ZJFCl1wAXIoUKkWotYEpOuXB1uVNxJ63dpJEqfxBeptwIHNrPz8BllZoIcBoXwgfJ+8VAUnVPvRvexnw0Ma/WiGYuJO5y8QTvEYBigFmhUxY5RqzE8OcywN/8m4UYrlaniJO75XQ6KSo9+tWHlu+hMi0UVdiKQp7NelnoZUzNaIyBPVeOwK6GNp+FfHuPOoyhaWuNvTYFkvxscMQWDh+zeFCFkgwbXftiV23ywJ4+uwRqmg9k3KzwIQpzppt8DBBOMbrqwQM5Gb05sEwdKzMiAqOloaA/lr0KA+1pr0/+HiWoiIjHA/wir2nIuS3PeU/ji3O6ZwoxcR1SZ9FhtLC5S0FIzFhbBWcGVP/KpxOPSiUoAdWUpqKH++6Scz507iCcxYI6rdMBICPJZea7OcmeFw5mObJSiqpjg2UoWNIs+cFhyDSt6geV5qgi3FunmwwDoGSMgerFOZGX1m0dMCYo5XOruxO063dwENK9DbnVM9wYFREzh4vyU1WYYJ/LRRp6oxgjqP/X5a8/4Af6p6NWkQferzBmXme0zY/4nwMJm/wd1tIqSwGz+E3xPEAOoZlJit3XddD7/BT1pllzOx+8bmQtANQ/S6fZexc6qi3W+Q2xcmXTUhuS5mpHQRvcxZUN0S5+PL9lXWUAaRZhEH8hTdAcuNMMCuVNKTEGtSUKNi3O6KhSaTzck8csZ2vWRZ+d7mW8c4IKwXIYd25S/zIftPkwPzufjEvOHWVD1m+FjpDVUTV0DGDuHj6QnaEwLu/dEgdLQOg9E1Sro9XHJ8ykLAwtPu+pxqKDuFexqON1sKQm7rwbE1E68UCfA/erovrTCG+DBSNg0l4goDQvZN6uNlbyLpcZAwj2UclycvLpIZMgv4yRlpb3YuMftozorbcGVHt/VeDV3+Fdf1TP0iuaCsPi2G4XeGhsyF1ubVDxkoJhmniQ0/jSg/eYML9KLfnCFgISWkp91eauR3IQvED0nAPXK+6hPCYs+n3+hCZbiskmVMG2da+0EsZPonUeIY8EbfusQXjsK/eFDaosbPjEfQS0RKG7yj5GG69M7MeO1HmiUYocgygJHL6M1qzUDDwUSmr99V7Sdr2F3JjQAJY+F0yH33Iv3+C9M38eML7gTgmNu/r2bUMiPvpYbZ6v1/IaESirBHNa7mPKn4dEmYg7v/+HQgPN1G79jBQ1+soydfDC2r+h2Bl/KIc5KjMK7OH6nb1jLsNf0EHVe2KBiE51ox636uyG6Lho0t3J34L5QY/ilE3mikaF4HKXG1mG1rCevT1Vv6GavltxoQe/bMrpZvRggnBxSEPEeEzkEdOxTnPXHVjUYdw8JYvjB/o7Eegc3Ma+NUxLLnsK0kJlinPmUHzHGtrk5+CAbVzFOBqpyy3QVUnzTDfC/0XD94/okH+OB+i7g9lolhWIjSnfIb+Eq43ZXOWmwvjyV/qqD+t0e+7mTEM74qP/Ozt8nmC7mRpyu63OB4KnUzFc074SqoyPUAgM+/TJGFo6T44EHnQU4X4z6qannVqgw/U7zCpwcmXV1AubIrvOmkKHazJAR55ePjp5tLBsN8vAqs3NAHdcEHOR2xQ0lsNAFzSUuxFQCFYvXLZJdOj9p4fNq6p0HBGUik2YzaI4xySy91KzhQ0+q1hjxvImRwPRf76tChlRkhRCi74NXZ9qUNeIwP+s5p+3m5nwPdNOHgSLD79n7O9m1n1uDHiMntq4nkYwV5OZ1ENbXxFd4PgrlvavZsyUO4MqYlqqn1O8W/I1dEZq5dXhrbETLaZIbC2Kj/Aa/QM+fqUOHdf0tXAQ1huZ3cmWECWSXy/43j35+Mvq9xws7JKseriZ1pEWKc8qlzNrGPUGcVgOa9cPJYIJsGnJTAUsEcDOEVULO5x0rXBijc1lgXEzQQKhROf8zIV82w8eswc78YX11KYLWQRcgHNJElBxfXr72lS2RBSl07qTKorO2uUDZr3sFhYsvnhLZn0A94KRzJ/7DEGIAhW5ZWFpL8gEwu1aLA9MuWZzNwl8Oze9Y+bX+v9gywRVnoB5I/8kXTXU3141yRLYrIOOz6SOnyHNy4SieqzkBXharjfjqq1q6tklaEbA8Qfm2DaIPs7OTq/nvJBjKfO2H9bH2cCMh1+5gspfycu8f/cuuRmtDjyqZ7uCIMyjdV3a+p3fqmXsRx4C8lujezIFHnQiVTXLXuI1XrwN3+siYYj2HHTvESUx8DlOTXpak9qFRK+L3mgJ1WsD7F4cu1aJoFoYQnu+wGDMOjJM3kiBQWHCcvhJ/HRdxodOQp45YZaOTA22Nb4XKCVxqkbwMYFhzYQYIAnCW8FW14uf98jhUG2zrKhQQ0q0CEq0t5nXyvUyvR8DvD69LU+g3i+HFWQMQ8PqZuHD+sNKAV0+M6EJC0szq7rEr7B5bQ8BcNHzvDMc9eqB5ZCQdTf80Obn4uzjwpYU7SISdtV0QGa9D3Wrh2BDQtpBKxaNFV+/Cy2P/Sv+8s7Ud0Fd74X4+o/TNztWgETUapy+majNQ68Lq3ee0ZO48VEbTZYiH1Co4OlfWef82RWeyUXo7woM03PyapGfikTnQinoNq5z5veLpeMV3HCAMTaZmA1oGLAn7XS3XYsz+XK7VMQsc4XKrmDXOLU/pSXVNUq8dIqTba///3x6LiLS6xs1xuCAYSfcQ3+rQgmu7uvf3THKt5Ooo97TqcbRqxx7EASizaQCBQllG/rYxVapMLgtLbZS64w1MDBMXX+PQpBKNwqUKOf2DDRDUXQf9EhOS0Qj4nTmlA8dzSLz/G1d+Ud8MTy/6ghhdiLpeerGY/UlDOfiuqFsMUU5/UYlP+BAmgRLuNpvrUaLlVkrqDievNVEAwF+4CoM1MZTmjxjJMsKJq+u8Zd7tNCUFy6LiyYXRJQ4VyvEQFFaCGKsxIwQkk7EzZ6LTJq2hUuPhvAW+gQnSG6J+MszC+7QCRHcnqDdyNRJ6T9xyS87A6MDutbzKGvGktpbXqtzWtXb9HsfK2cBMomjN9a4y+TaJLnXxAeX/HWzmf4cR4vALt/P4w4qgKY04ml4ZdLOinFYS6cup3G/1ie4+t1eOnpBNlqGqs75ilzkT4+DsZQxNvaSKJ//6zIbbk/M7LOhFmRc/1R+kBtz7JFGdZm/COotIdvQoXpTqP/1uqEUmCb/QWoGLMwO5ANcHzxdY48IGP5+J+zKOTBFZ4Pid+GTM+Wq12MV/H86xEJptBa6T+p3kgpwLedManBHC2GgNrFpoN2xnrMz9WFWX/8/ygSBkavq2Uv7FdCsLEYLu9LLIvAU0bNRDtzYl+/vXmjpIvuJFYjmI0im6QEYqnIeMsNjXG4vIutIGHijeAG/9EDBozKV5cldkHbLxHh25vT+ZEzbhXlqvpzKJwcEgfNwLAKFeo0/pvEE10XDB+EXRTXtSzJozQKFFAJhMxYkVaCW+E9AL7tMeU8acxidHqzb6lX4691UsDpy/LLRmT+epgW56+5Cw8tB4kMUv6s9lh3eRKbyGs+H/4mQMaYzPTf2OOdokEn+zzgvoD3FqNKk8QqGAXVsqcGdXrT62fSPkR2vROFi68A6se86UxRUk4cajfPyCC4G5wDhD+zNq4jodQ4u4n/m37Lr36n4LIAAsVr02dFi9AiwA81MYs2rm4eDlDNmdMRvEKRHfBwW5DdMNp0jPFZMeARqF/wL4XBfd+EMLBfMzpH5GH6NaW+1vrvMdg+VxDzatk3MXgO3ro3P/DpcC6+Mo4MySJhKJhSR01SGGGp5hPWmrrUgrv3lDnP+HhcI3nt3YqBoVAVTBAQT5iuhTg8nvPtd8ZeYj6w1x6RqGUBrSku7+N1+BaasZvjTk64RoIDlL8brpEcJx3OmY7jLoZsswdtmhfC/G21llXhITOwmvRDDeTTPbyASOa16cF5/A1fZAidJpqju3wYAy9avPR1ya6eNp9K8XYrrtuxlqi+bDKwlfrYdR0RRiKRVTLOH85+ZY7XSmzRpfZBJjaTa81VDcJHpZnZnSQLASGYW9l51ZV/h7eVzTi3Hv6hUsgc/51AqJRTkpbFVLXXszoBL8nBX0u/0jBLT8nH+fJePbrwURT58OY+UieRjd1vs04w0VG5VN2U6MoGZkQzKN/ptz0Q366dxoTGmj7i1NQGHi9GgnquXFYdrCfZBmeb7s0T6yrdlZH5cZuwHFyIJ/kAtGsTg0xH5taAAq44BAk1CPk9KVVbqQzrCUiFdF/6gtlPQ8bHHc1G1W92MXGZ5HEHftyLYs8mbD/9xYRUWkHmlM0zC2ilJlnNgV4bfALpQghxOUoZL7VTqtCHIaQSXm+YUMnpkXybnV+A6xlm2CVy8fn0Xlm2XRa0+zzOa21JWWmixfiPMSCZ7qA4rS93VN3pkpF1s5TonQjisHf7iU9ZGvUPOAKZcR1pbeVf/Ul7OhepGCaId9wOtqo7pJ7yLcBZ0pFkOF28y4zEI/kcUNmutBHaQpBdNM8vjCS6HZRokkeo88TBAjGyG7SR+6vUgTcyK9Imalj0kuxz0wmK+byQU11AiJFk/ya5dNduRClcnU64yGu/ieWSeOos1t3ep+RPIWQ2pyTYVbZltTbsb7NiwSi3AV+8KLWk7LxCnfZUetEM8ThnsSoGH38/nyAwFguJp8FjvlHtcWZuU4hPva0rHfr0UhOOJ/F6vS62FW7KzkmRll2HEc7oUq4fyi5T70Vl7YVIfsPHUCdHesf9Lk7WNVWO75JDkYbMI8TOW8JKVtLY9d6UJRITO8oKo0xS+o99Yy04iniGHAaGj88kEWgwv0OrHdY/nr76DOGNS59hXCGXzTKUvDl9iKpLSWYN1lxIeyywdNpTkhay74w2jFT6NS8qkjo5CxA1yfSYwp6AJIZNKIeEK5PJAW7ORgWgwp0VgzYpqovMrWxbu+DGZ6Lhie1RAqpzm8VUzKJOH3mCzWuTOLsN3VT/dv2eeYe9UjbR8YTBsLz7q60VN1sU51k+um1f8JxD5pPhbhSC8rRaB454tmh6YUWrJI3+GWY0qeWioj/tbkYITOkJaeuGt4JrJvHA+l0Gu7kY7XOaa05alMnRWVCXqFgLIwSY4uF59Ue5SU4QKuc/HamDxbr0x6csCetXGoP7Qn1Bk/J9DsynO/UD6iZ1Hyrz+jit0hDCwi/E9OjgKTbB3ZQKQ/0ZOvevfNHG0NK4Aj3Cp7NpRk07RT1i/S0EL93Ag8GRgKI9CfpajKyK6+Jj/PI1KO5/85VAwz2AwzP8FTBb075IxCXv6T9RVvWT2tUaqxDS92zrGUbWzUYk9mSs82pECH+fkqsDt93VW++4YsR/dHCYcQSYTO/KaBMDj9LSD/J/+z20Kq8XvZUAIHtm9hRPP3ItbuAu2Hm5lkPs92pd7kCxgRs0xOVBnZ13ccdA0aunrwv9SdqElJRC3g+oCu+nXyCgmXUs9yMjTMAIHfxZV+aPKcZeUBWt057Xo85Ks1Ir5gzEHCWqZEhrLZMuF11ziGtFQUds/EESajhagzcKsxamcSZxGth4UII+adPhQkUnx2WyN+4YWR+r3f8MnkyGFuR4zjzxJS8WsQYR5PTyRaD9ixa6Mh741nBHbzfjXHskGDq179xaRNrCIB1z1xRfWfjqw2pHc1zk9xlPpL8sQWAIuETZZhbnmL54rceXVNRvUiKrrqIkeogsl0XXb17ylNb0f4GA9Wd44vffEG8FSZGHEL2fbaTGRcSiCeA8PmA/f6Hz8HCS76fXUHwgwkzSwlI71ekZ7Fapmlk/KC+Hs8hUcw3N2LN5LhkVYyizYFl/uPeVP5lsoJHhhfWvvSWruCUW1ZcJOeuTbrDgywJ/qG07gZJplnTvLcYdNaH0KMYOYMGX+rB4NGPFmQsNaIwlWrfCezxre8zXBrsMT+edVLbLqN1BqB76JH4BvZTqUIMfGwPGEn+EnmTV86fPBaYbFL3DFEhjB45CewkXEAtJxk4/Ms2pPXnaRqdky0HOYdcUcE2zcXq4vaIvW2/v0nHFJH2XXe22ueDmq/18XGtELSq85j9X8q0tcNSSKJIX8FTuJF/Pf8j5PhqG2u+osvsLxYrvvfeVJL+4tkcXcr9JV7v0ERmj/X6fM3NC4j6dS1+9Umr2oPavqiAydTZPLMNRGY23LO9zAVDly7jD+70G5TPPLdhRIl4WxcYjLnM+SNcJ26FOrkrISUtPObIz5Zb3AG612krnpy15RMW+1cQjlnWFI6538qky9axd2oJmHIHP08KyP0ubGO+TQNOYuv2uh17yCIvR8VcStw7o1g0NM60sk+8Tq7YfIBJrtp53GkvzXH7OA0p8/n/u1satf/VJhtR1l8Wa6Gmaug7haSpaCaYQax6ta0mkutlb+eAOSG1aobM81D9A4iS1RRlzBBoVX6tU1S6WE2N9ORY6DfeLRC4l9Rvr5h95XDWB2mR1d4WFudpsgVYwiTwT31ljskD8ZyDOlm5DkGh9N/UB/0AI5Xvb8ZBmai2hQ4BWMqFwYnzxwB26YHSOv9WgY3JXnvoN+2R4rqGVh/LLDMtpFP+SpMGJNWvbIl5SOodbCczW2RKleksPoUeGEzrjtKHVdtZA+kfqO+rVx/iclCqwoopepvJpSTDjT+b9GWylGRF8EDbGlw6eUzmJM95Ovoz+kwLX3c2fTjFeYEsE7vUZm3mqdGJuKh2w9/QGSaqRHs99aScGOdDqkFcACoqdbBoQqqjamhH6Q9ng39JCg3lrGJwd50Qk9ovnqBTr8MME7Ps2wiVfygUmPoUBJJfJWX5Nda0nuncbFkA=='));
	}

	/**
	 * MIT License
	 *
	 * Copyright (c) 2021 Andrew Raffensperger
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 *
	 * This is a near carbon-copy of the original source (link below) with the
	 * TypeScript typings added and a few tweaks to make it ES3-compatible.
	 *
	 * See: https://github.com/adraffy/ens-normalize.js
	 */
	const r$1 = getData();
	// @TODO: This should be lazily loaded
	const VALID = new Set(read_member_array(r$1));
	const IGNORED = new Set(read_member_array(r$1));
	const MAPPED = read_mapped_map(r$1);
	const EMOJI_ROOT = read_emoji_trie(r$1);
	//const NFC_CHECK = new Set(read_member_array(r, Array.from(VALID.values()).sort((a, b) => a - b)));
	//const STOP = 0x2E;
	const HYPHEN = 0x2D;
	const UNDERSCORE = 0x5F;
	function explode_cp(name) {
	    return toUtf8CodePoints(name);
	}
	function filter_fe0f(cps) {
	    return cps.filter(cp => cp != 0xFE0F);
	}
	function ens_normalize_post_check(name) {
	    for (let label of name.split('.')) {
	        let cps = explode_cp(label);
	        try {
	            for (let i = cps.lastIndexOf(UNDERSCORE) - 1; i >= 0; i--) {
	                if (cps[i] !== UNDERSCORE) {
	                    throw new Error(`underscore only allowed at start`);
	                }
	            }
	            if (cps.length >= 4 && cps.every(cp => cp < 0x80) && cps[2] === HYPHEN && cps[3] === HYPHEN) {
	                throw new Error(`invalid label extension`);
	            }
	        }
	        catch (err) {
	            throw new Error(`Invalid label "${label}": ${err.message}`);
	        }
	    }
	    return name;
	}
	function ens_normalize(name) {
	    return ens_normalize_post_check(normalize(name, filter_fe0f));
	}
	function normalize(name, emoji_filter) {
	    let input = explode_cp(name).reverse(); // flip for pop
	    let output = [];
	    while (input.length) {
	        let emoji = consume_emoji_reversed(input);
	        if (emoji) {
	            output.push(...emoji_filter(emoji));
	            continue;
	        }
	        let cp = input.pop();
	        if (VALID.has(cp)) {
	            output.push(cp);
	            continue;
	        }
	        if (IGNORED.has(cp)) {
	            continue;
	        }
	        let cps = MAPPED[cp];
	        if (cps) {
	            output.push(...cps);
	            continue;
	        }
	        throw new Error(`Disallowed codepoint: 0x${cp.toString(16).toUpperCase()}`);
	    }
	    return ens_normalize_post_check(nfc(String.fromCodePoint(...output)));
	}
	function nfc(s) {
	    return s.normalize('NFC');
	}
	function consume_emoji_reversed(cps, eaten) {
	    var _a;
	    let node = EMOJI_ROOT;
	    let emoji;
	    let saved;
	    let stack = [];
	    let pos = cps.length;
	    if (eaten)
	        eaten.length = 0; // clear input buffer (if needed)
	    while (pos) {
	        let cp = cps[--pos];
	        node = (_a = node.branches.find(x => x.set.has(cp))) === null || _a === void 0 ? void 0 : _a.node;
	        if (!node)
	            break;
	        if (node.save) { // remember
	            saved = cp;
	        }
	        else if (node.check) { // check exclusion
	            if (cp === saved)
	                break;
	        }
	        stack.push(cp);
	        if (node.fe0f) {
	            stack.push(0xFE0F);
	            if (pos > 0 && cps[pos - 1] == 0xFE0F)
	                pos--; // consume optional FE0F
	        }
	        if (node.valid) { // this is a valid emoji (so far)
	            emoji = stack.slice(); // copy stack
	            if (node.valid == 2)
	                emoji.splice(1, 1); // delete FE0F at position 1 (RGI ZWJ don't follow spec!)
	            if (eaten)
	                eaten.push(...cps.slice(pos).reverse()); // copy input (if needed)
	            cps.length = pos; // truncate
	        }
	    }
	    return emoji;
	}

	const logger$e = new Logger(version$a);
	const Zeros = new Uint8Array(32);
	Zeros.fill(0);
	function checkComponent(comp) {
	    if (comp.length === 0) {
	        throw new Error("invalid ENS name; empty component");
	    }
	    return comp;
	}
	function ensNameSplit(name) {
	    const bytes = toUtf8Bytes(ens_normalize(name));
	    const comps = [];
	    if (name.length === 0) {
	        return comps;
	    }
	    let last = 0;
	    for (let i = 0; i < bytes.length; i++) {
	        const d = bytes[i];
	        // A separator (i.e. "."); copy this component
	        if (d === 0x2e) {
	            comps.push(checkComponent(bytes.slice(last, i)));
	            last = i + 1;
	        }
	    }
	    // There was a stray separator at the end of the name
	    if (last >= bytes.length) {
	        throw new Error("invalid ENS name; empty component");
	    }
	    comps.push(checkComponent(bytes.slice(last)));
	    return comps;
	}
	function namehash(name) {
	    /* istanbul ignore if */
	    if (typeof (name) !== "string") {
	        logger$e.throwArgumentError("invalid ENS name; not a string", "name", name);
	    }
	    let result = Zeros;
	    const comps = ensNameSplit(name);
	    while (comps.length) {
	        result = keccak256(concat([result, keccak256(comps.pop())]));
	    }
	    return hexlify(result);
	}
	function dnsEncode(name) {
	    return hexlify(concat(ensNameSplit(name).map((comp) => {
	        // DNS does not allow components over 63 bytes in length
	        if (comp.length > 63) {
	            throw new Error("invalid DNS encoded entry; length exceeds 63 bytes");
	        }
	        const bytes = new Uint8Array(comp.length + 1);
	        bytes.set(comp, 1);
	        bytes[0] = bytes.length - 1;
	        return bytes;
	    }))) + "00";
	}

	var __awaiter$7 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$d = new Logger(version$a);
	const padding = new Uint8Array(32);
	padding.fill(0);
	const NegativeOne = BigNumber.from(-1);
	const Zero = BigNumber.from(0);
	const One = BigNumber.from(1);
	const MaxUint256 = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
	function hexPadRight(value) {
	    const bytes = arrayify(value);
	    const padOffset = bytes.length % 32;
	    if (padOffset) {
	        return hexConcat([bytes, padding.slice(padOffset)]);
	    }
	    return hexlify(bytes);
	}
	const hexTrue = hexZeroPad(One.toHexString(), 32);
	const hexFalse = hexZeroPad(Zero.toHexString(), 32);
	const domainFieldTypes = {
	    name: "string",
	    version: "string",
	    chainId: "uint256",
	    verifyingContract: "address",
	    salt: "bytes32"
	};
	const domainFieldNames = [
	    "name", "version", "chainId", "verifyingContract", "salt"
	];
	function checkString(key) {
	    return function (value) {
	        if (typeof (value) !== "string") {
	            logger$d.throwArgumentError(`invalid domain value for ${JSON.stringify(key)}`, `domain.${key}`, value);
	        }
	        return value;
	    };
	}
	const domainChecks = {
	    name: checkString("name"),
	    version: checkString("version"),
	    chainId: function (value) {
	        try {
	            return BigNumber.from(value).toString();
	        }
	        catch (error) { }
	        return logger$d.throwArgumentError(`invalid domain value for "chainId"`, "domain.chainId", value);
	    },
	    verifyingContract: function (value) {
	        try {
	            return getAddress(value).toLowerCase();
	        }
	        catch (error) { }
	        return logger$d.throwArgumentError(`invalid domain value "verifyingContract"`, "domain.verifyingContract", value);
	    },
	    salt: function (value) {
	        try {
	            const bytes = arrayify(value);
	            if (bytes.length !== 32) {
	                throw new Error("bad length");
	            }
	            return hexlify(bytes);
	        }
	        catch (error) { }
	        return logger$d.throwArgumentError(`invalid domain value "salt"`, "domain.salt", value);
	    }
	};
	function getBaseEncoder(type) {
	    // intXX and uintXX
	    {
	        const match = type.match(/^(u?)int(\d*)$/);
	        if (match) {
	            const signed = (match[1] === "");
	            const width = parseInt(match[2] || "256");
	            if (width % 8 !== 0 || width > 256 || (match[2] && match[2] !== String(width))) {
	                logger$d.throwArgumentError("invalid numeric width", "type", type);
	            }
	            const boundsUpper = MaxUint256.mask(signed ? (width - 1) : width);
	            const boundsLower = signed ? boundsUpper.add(One).mul(NegativeOne) : Zero;
	            return function (value) {
	                const v = BigNumber.from(value);
	                if (v.lt(boundsLower) || v.gt(boundsUpper)) {
	                    logger$d.throwArgumentError(`value out-of-bounds for ${type}`, "value", value);
	                }
	                return hexZeroPad(v.toTwos(256).toHexString(), 32);
	            };
	        }
	    }
	    // bytesXX
	    {
	        const match = type.match(/^bytes(\d+)$/);
	        if (match) {
	            const width = parseInt(match[1]);
	            if (width === 0 || width > 32 || match[1] !== String(width)) {
	                logger$d.throwArgumentError("invalid bytes width", "type", type);
	            }
	            return function (value) {
	                const bytes = arrayify(value);
	                if (bytes.length !== width) {
	                    logger$d.throwArgumentError(`invalid length for ${type}`, "value", value);
	                }
	                return hexPadRight(value);
	            };
	        }
	    }
	    switch (type) {
	        case "address": return function (value) {
	            return hexZeroPad(getAddress(value), 32);
	        };
	        case "bool": return function (value) {
	            return ((!value) ? hexFalse : hexTrue);
	        };
	        case "bytes": return function (value) {
	            return keccak256(value);
	        };
	        case "string": return function (value) {
	            return id(value);
	        };
	    }
	    return null;
	}
	function encodeType(name, fields) {
	    return `${name}(${fields.map(({ name, type }) => (type + " " + name)).join(",")})`;
	}
	class TypedDataEncoder {
	    constructor(types) {
	        defineReadOnly(this, "types", Object.freeze(deepCopy(types)));
	        defineReadOnly(this, "_encoderCache", {});
	        defineReadOnly(this, "_types", {});
	        // Link struct types to their direct child structs
	        const links = {};
	        // Link structs to structs which contain them as a child
	        const parents = {};
	        // Link all subtypes within a given struct
	        const subtypes = {};
	        Object.keys(types).forEach((type) => {
	            links[type] = {};
	            parents[type] = [];
	            subtypes[type] = {};
	        });
	        for (const name in types) {
	            const uniqueNames = {};
	            types[name].forEach((field) => {
	                // Check each field has a unique name
	                if (uniqueNames[field.name]) {
	                    logger$d.throwArgumentError(`duplicate variable name ${JSON.stringify(field.name)} in ${JSON.stringify(name)}`, "types", types);
	                }
	                uniqueNames[field.name] = true;
	                // Get the base type (drop any array specifiers)
	                const baseType = field.type.match(/^([^\x5b]*)(\x5b|$)/)[1];
	                if (baseType === name) {
	                    logger$d.throwArgumentError(`circular type reference to ${JSON.stringify(baseType)}`, "types", types);
	                }
	                // Is this a base encoding type?
	                const encoder = getBaseEncoder(baseType);
	                if (encoder) {
	                    return;
	                }
	                if (!parents[baseType]) {
	                    logger$d.throwArgumentError(`unknown type ${JSON.stringify(baseType)}`, "types", types);
	                }
	                // Add linkage
	                parents[baseType].push(name);
	                links[name][baseType] = true;
	            });
	        }
	        // Deduce the primary type
	        const primaryTypes = Object.keys(parents).filter((n) => (parents[n].length === 0));
	        if (primaryTypes.length === 0) {
	            logger$d.throwArgumentError("missing primary type", "types", types);
	        }
	        else if (primaryTypes.length > 1) {
	            logger$d.throwArgumentError(`ambiguous primary types or unused types: ${primaryTypes.map((t) => (JSON.stringify(t))).join(", ")}`, "types", types);
	        }
	        defineReadOnly(this, "primaryType", primaryTypes[0]);
	        // Check for circular type references
	        function checkCircular(type, found) {
	            if (found[type]) {
	                logger$d.throwArgumentError(`circular type reference to ${JSON.stringify(type)}`, "types", types);
	            }
	            found[type] = true;
	            Object.keys(links[type]).forEach((child) => {
	                if (!parents[child]) {
	                    return;
	                }
	                // Recursively check children
	                checkCircular(child, found);
	                // Mark all ancestors as having this decendant
	                Object.keys(found).forEach((subtype) => {
	                    subtypes[subtype][child] = true;
	                });
	            });
	            delete found[type];
	        }
	        checkCircular(this.primaryType, {});
	        // Compute each fully describe type
	        for (const name in subtypes) {
	            const st = Object.keys(subtypes[name]);
	            st.sort();
	            this._types[name] = encodeType(name, types[name]) + st.map((t) => encodeType(t, types[t])).join("");
	        }
	    }
	    getEncoder(type) {
	        let encoder = this._encoderCache[type];
	        if (!encoder) {
	            encoder = this._encoderCache[type] = this._getEncoder(type);
	        }
	        return encoder;
	    }
	    _getEncoder(type) {
	        // Basic encoder type (address, bool, uint256, etc)
	        {
	            const encoder = getBaseEncoder(type);
	            if (encoder) {
	                return encoder;
	            }
	        }
	        // Array
	        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
	        if (match) {
	            const subtype = match[1];
	            const subEncoder = this.getEncoder(subtype);
	            const length = parseInt(match[3]);
	            return (value) => {
	                if (length >= 0 && value.length !== length) {
	                    logger$d.throwArgumentError("array length mismatch; expected length ${ arrayLength }", "value", value);
	                }
	                let result = value.map(subEncoder);
	                if (this._types[subtype]) {
	                    result = result.map(keccak256);
	                }
	                return keccak256(hexConcat(result));
	            };
	        }
	        // Struct
	        const fields = this.types[type];
	        if (fields) {
	            const encodedType = id(this._types[type]);
	            return (value) => {
	                const values = fields.map(({ name, type }) => {
	                    const result = this.getEncoder(type)(value[name]);
	                    if (this._types[type]) {
	                        return keccak256(result);
	                    }
	                    return result;
	                });
	                values.unshift(encodedType);
	                return hexConcat(values);
	            };
	        }
	        return logger$d.throwArgumentError(`unknown type: ${type}`, "type", type);
	    }
	    encodeType(name) {
	        const result = this._types[name];
	        if (!result) {
	            logger$d.throwArgumentError(`unknown type: ${JSON.stringify(name)}`, "name", name);
	        }
	        return result;
	    }
	    encodeData(type, value) {
	        return this.getEncoder(type)(value);
	    }
	    hashStruct(name, value) {
	        return keccak256(this.encodeData(name, value));
	    }
	    encode(value) {
	        return this.encodeData(this.primaryType, value);
	    }
	    hash(value) {
	        return this.hashStruct(this.primaryType, value);
	    }
	    _visit(type, value, callback) {
	        // Basic encoder type (address, bool, uint256, etc)
	        {
	            const encoder = getBaseEncoder(type);
	            if (encoder) {
	                return callback(type, value);
	            }
	        }
	        // Array
	        const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
	        if (match) {
	            const subtype = match[1];
	            const length = parseInt(match[3]);
	            if (length >= 0 && value.length !== length) {
	                logger$d.throwArgumentError("array length mismatch; expected length ${ arrayLength }", "value", value);
	            }
	            return value.map((v) => this._visit(subtype, v, callback));
	        }
	        // Struct
	        const fields = this.types[type];
	        if (fields) {
	            return fields.reduce((accum, { name, type }) => {
	                accum[name] = this._visit(type, value[name], callback);
	                return accum;
	            }, {});
	        }
	        return logger$d.throwArgumentError(`unknown type: ${type}`, "type", type);
	    }
	    visit(value, callback) {
	        return this._visit(this.primaryType, value, callback);
	    }
	    static from(types) {
	        return new TypedDataEncoder(types);
	    }
	    static getPrimaryType(types) {
	        return TypedDataEncoder.from(types).primaryType;
	    }
	    static hashStruct(name, types, value) {
	        return TypedDataEncoder.from(types).hashStruct(name, value);
	    }
	    static hashDomain(domain) {
	        const domainFields = [];
	        for (const name in domain) {
	            const type = domainFieldTypes[name];
	            if (!type) {
	                logger$d.throwArgumentError(`invalid typed-data domain key: ${JSON.stringify(name)}`, "domain", domain);
	            }
	            domainFields.push({ name, type });
	        }
	        domainFields.sort((a, b) => {
	            return domainFieldNames.indexOf(a.name) - domainFieldNames.indexOf(b.name);
	        });
	        return TypedDataEncoder.hashStruct("EIP712Domain", { EIP712Domain: domainFields }, domain);
	    }
	    static encode(domain, types, value) {
	        return hexConcat([
	            "0x1901",
	            TypedDataEncoder.hashDomain(domain),
	            TypedDataEncoder.from(types).hash(value)
	        ]);
	    }
	    static hash(domain, types, value) {
	        return keccak256(TypedDataEncoder.encode(domain, types, value));
	    }
	    // Replaces all address types with ENS names with their looked up address
	    static resolveNames(domain, types, value, resolveName) {
	        return __awaiter$7(this, void 0, void 0, function* () {
	            // Make a copy to isolate it from the object passed in
	            domain = shallowCopy(domain);
	            // Look up all ENS names
	            const ensCache = {};
	            // Do we need to look up the domain's verifyingContract?
	            if (domain.verifyingContract && !isHexString(domain.verifyingContract, 20)) {
	                ensCache[domain.verifyingContract] = "0x";
	            }
	            // We are going to use the encoder to visit all the base values
	            const encoder = TypedDataEncoder.from(types);
	            // Get a list of all the addresses
	            encoder.visit(value, (type, value) => {
	                if (type === "address" && !isHexString(value, 20)) {
	                    ensCache[value] = "0x";
	                }
	                return value;
	            });
	            // Lookup each name
	            for (const name in ensCache) {
	                ensCache[name] = yield resolveName(name);
	            }
	            // Replace the domain verifyingContract if needed
	            if (domain.verifyingContract && ensCache[domain.verifyingContract]) {
	                domain.verifyingContract = ensCache[domain.verifyingContract];
	            }
	            // Replace all ENS names with their address
	            value = encoder.visit(value, (type, value) => {
	                if (type === "address" && ensCache[value]) {
	                    return ensCache[value];
	                }
	                return value;
	            });
	            return { domain, value };
	        });
	    }
	    static getPayload(domain, types, value) {
	        // Validate the domain fields
	        TypedDataEncoder.hashDomain(domain);
	        // Derive the EIP712Domain Struct reference type
	        const domainValues = {};
	        const domainTypes = [];
	        domainFieldNames.forEach((name) => {
	            const value = domain[name];
	            if (value == null) {
	                return;
	            }
	            domainValues[name] = domainChecks[name](value);
	            domainTypes.push({ name, type: domainFieldTypes[name] });
	        });
	        const encoder = TypedDataEncoder.from(types);
	        const typesWithDomain = shallowCopy(types);
	        if (typesWithDomain.EIP712Domain) {
	            logger$d.throwArgumentError("types must not contain EIP712Domain type", "types.EIP712Domain", types);
	        }
	        else {
	            typesWithDomain.EIP712Domain = domainTypes;
	        }
	        // Validate the data structures and types
	        encoder.encode(value);
	        return {
	            types: typesWithDomain,
	            domain: domainValues,
	            primaryType: encoder.primaryType,
	            message: encoder.visit(value, (type, value) => {
	                // bytes
	                if (type.match(/^bytes(\d*)/)) {
	                    return hexlify(arrayify(value));
	                }
	                // uint or int
	                if (type.match(/^u?int/)) {
	                    return BigNumber.from(value).toString();
	                }
	                switch (type) {
	                    case "address":
	                        return value.toLowerCase();
	                    case "bool":
	                        return !!value;
	                    case "string":
	                        if (typeof (value) !== "string") {
	                            logger$d.throwArgumentError(`invalid string`, "value", value);
	                        }
	                        return value;
	                }
	                return logger$d.throwArgumentError("unsupported type", "type", type);
	            })
	        };
	    }
	}

	const logger$c = new Logger(version$e);
	class LogDescription extends Description {
	}
	class TransactionDescription extends Description {
	}
	class ErrorDescription extends Description {
	}
	class Indexed extends Description {
	    static isIndexed(value) {
	        return !!(value && value._isIndexed);
	    }
	}
	const BuiltinErrors = {
	    "0x08c379a0": { signature: "Error(string)", name: "Error", inputs: ["string"], reason: true },
	    "0x4e487b71": { signature: "Panic(uint256)", name: "Panic", inputs: ["uint256"] }
	};
	function wrapAccessError(property, error) {
	    const wrap = new Error(`deferred error during ABI decoding triggered accessing ${property}`);
	    wrap.error = error;
	    return wrap;
	}
	/*
	function checkNames(fragment: Fragment, type: "input" | "output", params: Array<ParamType>): void {
	    params.reduce((accum, param) => {
	        if (param.name) {
	            if (accum[param.name]) {
	                logger.throwArgumentError(`duplicate ${ type } parameter ${ JSON.stringify(param.name) } in ${ fragment.format("full") }`, "fragment", fragment);
	            }
	            accum[param.name] = true;
	        }
	        return accum;
	    }, <{ [ name: string ]: boolean }>{ });
	}
	*/
	class Interface {
	    constructor(fragments) {
	        let abi = [];
	        if (typeof (fragments) === "string") {
	            abi = JSON.parse(fragments);
	        }
	        else {
	            abi = fragments;
	        }
	        defineReadOnly(this, "fragments", abi.map((fragment) => {
	            return Fragment.from(fragment);
	        }).filter((fragment) => (fragment != null)));
	        defineReadOnly(this, "_abiCoder", getStatic(new.target, "getAbiCoder")());
	        defineReadOnly(this, "functions", {});
	        defineReadOnly(this, "errors", {});
	        defineReadOnly(this, "events", {});
	        defineReadOnly(this, "structs", {});
	        // Add all fragments by their signature
	        this.fragments.forEach((fragment) => {
	            let bucket = null;
	            switch (fragment.type) {
	                case "constructor":
	                    if (this.deploy) {
	                        logger$c.warn("duplicate definition - constructor");
	                        return;
	                    }
	                    //checkNames(fragment, "input", fragment.inputs);
	                    defineReadOnly(this, "deploy", fragment);
	                    return;
	                case "function":
	                    //checkNames(fragment, "input", fragment.inputs);
	                    //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
	                    bucket = this.functions;
	                    break;
	                case "event":
	                    //checkNames(fragment, "input", fragment.inputs);
	                    bucket = this.events;
	                    break;
	                case "error":
	                    bucket = this.errors;
	                    break;
	                default:
	                    return;
	            }
	            let signature = fragment.format();
	            if (bucket[signature]) {
	                logger$c.warn("duplicate definition - " + signature);
	                return;
	            }
	            bucket[signature] = fragment;
	        });
	        // If we do not have a constructor add a default
	        if (!this.deploy) {
	            defineReadOnly(this, "deploy", ConstructorFragment.from({
	                payable: false,
	                type: "constructor"
	            }));
	        }
	        defineReadOnly(this, "_isInterface", true);
	    }
	    format(format) {
	        if (!format) {
	            format = FormatTypes.full;
	        }
	        if (format === FormatTypes.sighash) {
	            logger$c.throwArgumentError("interface does not support formatting sighash", "format", format);
	        }
	        const abi = this.fragments.map((fragment) => fragment.format(format));
	        // We need to re-bundle the JSON fragments a bit
	        if (format === FormatTypes.json) {
	            return JSON.stringify(abi.map((j) => JSON.parse(j)));
	        }
	        return abi;
	    }
	    // Sub-classes can override these to handle other blockchains
	    static getAbiCoder() {
	        return defaultAbiCoder;
	    }
	    static getAddress(address) {
	        return getAddress(address);
	    }
	    static getSighash(fragment) {
	        return hexDataSlice(id(fragment.format()), 0, 4);
	    }
	    static getEventTopic(eventFragment) {
	        return id(eventFragment.format());
	    }
	    // Find a function definition by any means necessary (unless it is ambiguous)
	    getFunction(nameOrSignatureOrSighash) {
	        if (isHexString(nameOrSignatureOrSighash)) {
	            for (const name in this.functions) {
	                if (nameOrSignatureOrSighash === this.getSighash(name)) {
	                    return this.functions[name];
	                }
	            }
	            logger$c.throwArgumentError("no matching function", "sighash", nameOrSignatureOrSighash);
	        }
	        // It is a bare name, look up the function (will return null if ambiguous)
	        if (nameOrSignatureOrSighash.indexOf("(") === -1) {
	            const name = nameOrSignatureOrSighash.trim();
	            const matching = Object.keys(this.functions).filter((f) => (f.split("(" /* fix:) */)[0] === name));
	            if (matching.length === 0) {
	                logger$c.throwArgumentError("no matching function", "name", name);
	            }
	            else if (matching.length > 1) {
	                logger$c.throwArgumentError("multiple matching functions", "name", name);
	            }
	            return this.functions[matching[0]];
	        }
	        // Normalize the signature and lookup the function
	        const result = this.functions[FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
	        if (!result) {
	            logger$c.throwArgumentError("no matching function", "signature", nameOrSignatureOrSighash);
	        }
	        return result;
	    }
	    // Find an event definition by any means necessary (unless it is ambiguous)
	    getEvent(nameOrSignatureOrTopic) {
	        if (isHexString(nameOrSignatureOrTopic)) {
	            const topichash = nameOrSignatureOrTopic.toLowerCase();
	            for (const name in this.events) {
	                if (topichash === this.getEventTopic(name)) {
	                    return this.events[name];
	                }
	            }
	            logger$c.throwArgumentError("no matching event", "topichash", topichash);
	        }
	        // It is a bare name, look up the function (will return null if ambiguous)
	        if (nameOrSignatureOrTopic.indexOf("(") === -1) {
	            const name = nameOrSignatureOrTopic.trim();
	            const matching = Object.keys(this.events).filter((f) => (f.split("(" /* fix:) */)[0] === name));
	            if (matching.length === 0) {
	                logger$c.throwArgumentError("no matching event", "name", name);
	            }
	            else if (matching.length > 1) {
	                logger$c.throwArgumentError("multiple matching events", "name", name);
	            }
	            return this.events[matching[0]];
	        }
	        // Normalize the signature and lookup the function
	        const result = this.events[EventFragment.fromString(nameOrSignatureOrTopic).format()];
	        if (!result) {
	            logger$c.throwArgumentError("no matching event", "signature", nameOrSignatureOrTopic);
	        }
	        return result;
	    }
	    // Find a function definition by any means necessary (unless it is ambiguous)
	    getError(nameOrSignatureOrSighash) {
	        if (isHexString(nameOrSignatureOrSighash)) {
	            const getSighash = getStatic(this.constructor, "getSighash");
	            for (const name in this.errors) {
	                const error = this.errors[name];
	                if (nameOrSignatureOrSighash === getSighash(error)) {
	                    return this.errors[name];
	                }
	            }
	            logger$c.throwArgumentError("no matching error", "sighash", nameOrSignatureOrSighash);
	        }
	        // It is a bare name, look up the function (will return null if ambiguous)
	        if (nameOrSignatureOrSighash.indexOf("(") === -1) {
	            const name = nameOrSignatureOrSighash.trim();
	            const matching = Object.keys(this.errors).filter((f) => (f.split("(" /* fix:) */)[0] === name));
	            if (matching.length === 0) {
	                logger$c.throwArgumentError("no matching error", "name", name);
	            }
	            else if (matching.length > 1) {
	                logger$c.throwArgumentError("multiple matching errors", "name", name);
	            }
	            return this.errors[matching[0]];
	        }
	        // Normalize the signature and lookup the function
	        const result = this.errors[FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
	        if (!result) {
	            logger$c.throwArgumentError("no matching error", "signature", nameOrSignatureOrSighash);
	        }
	        return result;
	    }
	    // Get the sighash (the bytes4 selector) used by Solidity to identify a function
	    getSighash(fragment) {
	        if (typeof (fragment) === "string") {
	            try {
	                fragment = this.getFunction(fragment);
	            }
	            catch (error) {
	                try {
	                    fragment = this.getError(fragment);
	                }
	                catch (_) {
	                    throw error;
	                }
	            }
	        }
	        return getStatic(this.constructor, "getSighash")(fragment);
	    }
	    // Get the topic (the bytes32 hash) used by Solidity to identify an event
	    getEventTopic(eventFragment) {
	        if (typeof (eventFragment) === "string") {
	            eventFragment = this.getEvent(eventFragment);
	        }
	        return getStatic(this.constructor, "getEventTopic")(eventFragment);
	    }
	    _decodeParams(params, data) {
	        return this._abiCoder.decode(params, data);
	    }
	    _encodeParams(params, values) {
	        return this._abiCoder.encode(params, values);
	    }
	    encodeDeploy(values) {
	        return this._encodeParams(this.deploy.inputs, values || []);
	    }
	    decodeErrorResult(fragment, data) {
	        if (typeof (fragment) === "string") {
	            fragment = this.getError(fragment);
	        }
	        const bytes = arrayify(data);
	        if (hexlify(bytes.slice(0, 4)) !== this.getSighash(fragment)) {
	            logger$c.throwArgumentError(`data signature does not match error ${fragment.name}.`, "data", hexlify(bytes));
	        }
	        return this._decodeParams(fragment.inputs, bytes.slice(4));
	    }
	    encodeErrorResult(fragment, values) {
	        if (typeof (fragment) === "string") {
	            fragment = this.getError(fragment);
	        }
	        return hexlify(concat([
	            this.getSighash(fragment),
	            this._encodeParams(fragment.inputs, values || [])
	        ]));
	    }
	    // Decode the data for a function call (e.g. tx.data)
	    decodeFunctionData(functionFragment, data) {
	        if (typeof (functionFragment) === "string") {
	            functionFragment = this.getFunction(functionFragment);
	        }
	        const bytes = arrayify(data);
	        if (hexlify(bytes.slice(0, 4)) !== this.getSighash(functionFragment)) {
	            logger$c.throwArgumentError(`data signature does not match function ${functionFragment.name}.`, "data", hexlify(bytes));
	        }
	        return this._decodeParams(functionFragment.inputs, bytes.slice(4));
	    }
	    // Encode the data for a function call (e.g. tx.data)
	    encodeFunctionData(functionFragment, values) {
	        if (typeof (functionFragment) === "string") {
	            functionFragment = this.getFunction(functionFragment);
	        }
	        return hexlify(concat([
	            this.getSighash(functionFragment),
	            this._encodeParams(functionFragment.inputs, values || [])
	        ]));
	    }
	    // Decode the result from a function call (e.g. from eth_call)
	    decodeFunctionResult(functionFragment, data) {
	        if (typeof (functionFragment) === "string") {
	            functionFragment = this.getFunction(functionFragment);
	        }
	        let bytes = arrayify(data);
	        let reason = null;
	        let message = "";
	        let errorArgs = null;
	        let errorName = null;
	        let errorSignature = null;
	        switch (bytes.length % this._abiCoder._getWordSize()) {
	            case 0:
	                try {
	                    return this._abiCoder.decode(functionFragment.outputs, bytes);
	                }
	                catch (error) { }
	                break;
	            case 4: {
	                const selector = hexlify(bytes.slice(0, 4));
	                const builtin = BuiltinErrors[selector];
	                if (builtin) {
	                    errorArgs = this._abiCoder.decode(builtin.inputs, bytes.slice(4));
	                    errorName = builtin.name;
	                    errorSignature = builtin.signature;
	                    if (builtin.reason) {
	                        reason = errorArgs[0];
	                    }
	                    if (errorName === "Error") {
	                        message = `; VM Exception while processing transaction: reverted with reason string ${JSON.stringify(errorArgs[0])}`;
	                    }
	                    else if (errorName === "Panic") {
	                        message = `; VM Exception while processing transaction: reverted with panic code ${errorArgs[0]}`;
	                    }
	                }
	                else {
	                    try {
	                        const error = this.getError(selector);
	                        errorArgs = this._abiCoder.decode(error.inputs, bytes.slice(4));
	                        errorName = error.name;
	                        errorSignature = error.format();
	                    }
	                    catch (error) { }
	                }
	                break;
	            }
	        }
	        return logger$c.throwError("call revert exception" + message, Logger.errors.CALL_EXCEPTION, {
	            method: functionFragment.format(),
	            data: hexlify(data), errorArgs, errorName, errorSignature, reason
	        });
	    }
	    // Encode the result for a function call (e.g. for eth_call)
	    encodeFunctionResult(functionFragment, values) {
	        if (typeof (functionFragment) === "string") {
	            functionFragment = this.getFunction(functionFragment);
	        }
	        return hexlify(this._abiCoder.encode(functionFragment.outputs, values || []));
	    }
	    // Create the filter for the event with search criteria (e.g. for eth_filterLog)
	    encodeFilterTopics(eventFragment, values) {
	        if (typeof (eventFragment) === "string") {
	            eventFragment = this.getEvent(eventFragment);
	        }
	        if (values.length > eventFragment.inputs.length) {
	            logger$c.throwError("too many arguments for " + eventFragment.format(), Logger.errors.UNEXPECTED_ARGUMENT, {
	                argument: "values",
	                value: values
	            });
	        }
	        let topics = [];
	        if (!eventFragment.anonymous) {
	            topics.push(this.getEventTopic(eventFragment));
	        }
	        const encodeTopic = (param, value) => {
	            if (param.type === "string") {
	                return id(value);
	            }
	            else if (param.type === "bytes") {
	                return keccak256(hexlify(value));
	            }
	            if (param.type === "bool" && typeof (value) === "boolean") {
	                value = (value ? "0x01" : "0x00");
	            }
	            if (param.type.match(/^u?int/)) {
	                value = BigNumber.from(value).toHexString();
	            }
	            // Check addresses are valid
	            if (param.type === "address") {
	                this._abiCoder.encode(["address"], [value]);
	            }
	            return hexZeroPad(hexlify(value), 32);
	        };
	        values.forEach((value, index) => {
	            let param = eventFragment.inputs[index];
	            if (!param.indexed) {
	                if (value != null) {
	                    logger$c.throwArgumentError("cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
	                }
	                return;
	            }
	            if (value == null) {
	                topics.push(null);
	            }
	            else if (param.baseType === "array" || param.baseType === "tuple") {
	                logger$c.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
	            }
	            else if (Array.isArray(value)) {
	                topics.push(value.map((value) => encodeTopic(param, value)));
	            }
	            else {
	                topics.push(encodeTopic(param, value));
	            }
	        });
	        // Trim off trailing nulls
	        while (topics.length && topics[topics.length - 1] === null) {
	            topics.pop();
	        }
	        return topics;
	    }
	    encodeEventLog(eventFragment, values) {
	        if (typeof (eventFragment) === "string") {
	            eventFragment = this.getEvent(eventFragment);
	        }
	        const topics = [];
	        const dataTypes = [];
	        const dataValues = [];
	        if (!eventFragment.anonymous) {
	            topics.push(this.getEventTopic(eventFragment));
	        }
	        if (values.length !== eventFragment.inputs.length) {
	            logger$c.throwArgumentError("event arguments/values mismatch", "values", values);
	        }
	        eventFragment.inputs.forEach((param, index) => {
	            const value = values[index];
	            if (param.indexed) {
	                if (param.type === "string") {
	                    topics.push(id(value));
	                }
	                else if (param.type === "bytes") {
	                    topics.push(keccak256(value));
	                }
	                else if (param.baseType === "tuple" || param.baseType === "array") {
	                    // @TODO
	                    throw new Error("not implemented");
	                }
	                else {
	                    topics.push(this._abiCoder.encode([param.type], [value]));
	                }
	            }
	            else {
	                dataTypes.push(param);
	                dataValues.push(value);
	            }
	        });
	        return {
	            data: this._abiCoder.encode(dataTypes, dataValues),
	            topics: topics
	        };
	    }
	    // Decode a filter for the event and the search criteria
	    decodeEventLog(eventFragment, data, topics) {
	        if (typeof (eventFragment) === "string") {
	            eventFragment = this.getEvent(eventFragment);
	        }
	        if (topics != null && !eventFragment.anonymous) {
	            let topicHash = this.getEventTopic(eventFragment);
	            if (!isHexString(topics[0], 32) || topics[0].toLowerCase() !== topicHash) {
	                logger$c.throwError("fragment/topic mismatch", Logger.errors.INVALID_ARGUMENT, { argument: "topics[0]", expected: topicHash, value: topics[0] });
	            }
	            topics = topics.slice(1);
	        }
	        let indexed = [];
	        let nonIndexed = [];
	        let dynamic = [];
	        eventFragment.inputs.forEach((param, index) => {
	            if (param.indexed) {
	                if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
	                    indexed.push(ParamType.fromObject({ type: "bytes32", name: param.name }));
	                    dynamic.push(true);
	                }
	                else {
	                    indexed.push(param);
	                    dynamic.push(false);
	                }
	            }
	            else {
	                nonIndexed.push(param);
	                dynamic.push(false);
	            }
	        });
	        let resultIndexed = (topics != null) ? this._abiCoder.decode(indexed, concat(topics)) : null;
	        let resultNonIndexed = this._abiCoder.decode(nonIndexed, data, true);
	        let result = [];
	        let nonIndexedIndex = 0, indexedIndex = 0;
	        eventFragment.inputs.forEach((param, index) => {
	            if (param.indexed) {
	                if (resultIndexed == null) {
	                    result[index] = new Indexed({ _isIndexed: true, hash: null });
	                }
	                else if (dynamic[index]) {
	                    result[index] = new Indexed({ _isIndexed: true, hash: resultIndexed[indexedIndex++] });
	                }
	                else {
	                    try {
	                        result[index] = resultIndexed[indexedIndex++];
	                    }
	                    catch (error) {
	                        result[index] = error;
	                    }
	                }
	            }
	            else {
	                try {
	                    result[index] = resultNonIndexed[nonIndexedIndex++];
	                }
	                catch (error) {
	                    result[index] = error;
	                }
	            }
	            // Add the keyword argument if named and safe
	            if (param.name && result[param.name] == null) {
	                const value = result[index];
	                // Make error named values throw on access
	                if (value instanceof Error) {
	                    Object.defineProperty(result, param.name, {
	                        enumerable: true,
	                        get: () => { throw wrapAccessError(`property ${JSON.stringify(param.name)}`, value); }
	                    });
	                }
	                else {
	                    result[param.name] = value;
	                }
	            }
	        });
	        // Make all error indexed values throw on access
	        for (let i = 0; i < result.length; i++) {
	            const value = result[i];
	            if (value instanceof Error) {
	                Object.defineProperty(result, i, {
	                    enumerable: true,
	                    get: () => { throw wrapAccessError(`index ${i}`, value); }
	                });
	            }
	        }
	        return Object.freeze(result);
	    }
	    // Given a transaction, find the matching function fragment (if any) and
	    // determine all its properties and call parameters
	    parseTransaction(tx) {
	        let fragment = this.getFunction(tx.data.substring(0, 10).toLowerCase());
	        if (!fragment) {
	            return null;
	        }
	        return new TransactionDescription({
	            args: this._abiCoder.decode(fragment.inputs, "0x" + tx.data.substring(10)),
	            functionFragment: fragment,
	            name: fragment.name,
	            signature: fragment.format(),
	            sighash: this.getSighash(fragment),
	            value: BigNumber.from(tx.value || "0"),
	        });
	    }
	    // @TODO
	    //parseCallResult(data: BytesLike): ??
	    // Given an event log, find the matching event fragment (if any) and
	    // determine all its properties and values
	    parseLog(log) {
	        let fragment = this.getEvent(log.topics[0]);
	        if (!fragment || fragment.anonymous) {
	            return null;
	        }
	        // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
	        //        Probably not, because just because it is the only event in the ABI does
	        //        not mean we have the full ABI; maybe just a fragment?
	        return new LogDescription({
	            eventFragment: fragment,
	            name: fragment.name,
	            signature: fragment.format(),
	            topic: this.getEventTopic(fragment),
	            args: this.decodeEventLog(fragment, log.data, log.topics)
	        });
	    }
	    parseError(data) {
	        const hexData = hexlify(data);
	        let fragment = this.getError(hexData.substring(0, 10).toLowerCase());
	        if (!fragment) {
	            return null;
	        }
	        return new ErrorDescription({
	            args: this._abiCoder.decode(fragment.inputs, "0x" + hexData.substring(10)),
	            errorFragment: fragment,
	            name: fragment.name,
	            signature: fragment.format(),
	            sighash: this.getSighash(fragment),
	        });
	    }
	    /*
	    static from(value: Array<Fragment | string | JsonAbi> | string | Interface) {
	        if (Interface.isInterface(value)) {
	            return value;
	        }
	        if (typeof(value) === "string") {
	            return new Interface(JSON.parse(value));
	        }
	        return new Interface(value);
	    }
	    */
	    static isInterface(value) {
	        return !!(value && value._isInterface);
	    }
	}

	const version$9 = "abstract-provider/5.7.0";

	var __awaiter$6 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$b = new Logger(version$9);
	//export type CallTransactionable = {
	//    call(transaction: TransactionRequest): Promise<TransactionResponse>;
	//};
	class ForkEvent extends Description {
	    static isForkEvent(value) {
	        return !!(value && value._isForkEvent);
	    }
	}
	///////////////////////////////
	// Exported Abstracts
	class Provider {
	    constructor() {
	        logger$b.checkAbstract(new.target, Provider);
	        defineReadOnly(this, "_isProvider", true);
	    }
	    getFeeData() {
	        return __awaiter$6(this, void 0, void 0, function* () {
	            const { block, gasPrice } = yield resolveProperties({
	                block: this.getBlock("latest"),
	                gasPrice: this.getGasPrice().catch((error) => {
	                    // @TODO: Why is this now failing on Calaveras?
	                    //console.log(error);
	                    return null;
	                })
	            });
	            let lastBaseFeePerGas = null, maxFeePerGas = null, maxPriorityFeePerGas = null;
	            if (block && block.baseFeePerGas) {
	                // We may want to compute this more accurately in the future,
	                // using the formula "check if the base fee is correct".
	                // See: https://eips.ethereum.org/EIPS/eip-1559
	                lastBaseFeePerGas = block.baseFeePerGas;
	                maxPriorityFeePerGas = BigNumber.from("1500000000");
	                maxFeePerGas = block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas);
	            }
	            return { lastBaseFeePerGas, maxFeePerGas, maxPriorityFeePerGas, gasPrice };
	        });
	    }
	    // Alias for "on"
	    addListener(eventName, listener) {
	        return this.on(eventName, listener);
	    }
	    // Alias for "off"
	    removeListener(eventName, listener) {
	        return this.off(eventName, listener);
	    }
	    static isProvider(value) {
	        return !!(value && value._isProvider);
	    }
	}

	const version$8 = "abstract-signer/5.7.0";

	var __awaiter$5 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$a = new Logger(version$8);
	const allowedTransactionKeys$1 = [
	    "accessList", "ccipReadEnabled", "chainId", "customData", "data", "from", "gasLimit", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "to", "type", "value"
	];
	const forwardErrors = [
	    Logger.errors.INSUFFICIENT_FUNDS,
	    Logger.errors.NONCE_EXPIRED,
	    Logger.errors.REPLACEMENT_UNDERPRICED,
	];
	class Signer {
	    ///////////////////
	    // Sub-classes MUST call super
	    constructor() {
	        logger$a.checkAbstract(new.target, Signer);
	        defineReadOnly(this, "_isSigner", true);
	    }
	    ///////////////////
	    // Sub-classes MAY override these
	    getBalance(blockTag) {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("getBalance");
	            return yield this.provider.getBalance(this.getAddress(), blockTag);
	        });
	    }
	    getTransactionCount(blockTag) {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("getTransactionCount");
	            return yield this.provider.getTransactionCount(this.getAddress(), blockTag);
	        });
	    }
	    // Populates "from" if unspecified, and estimates the gas for the transaction
	    estimateGas(transaction) {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("estimateGas");
	            const tx = yield resolveProperties(this.checkTransaction(transaction));
	            return yield this.provider.estimateGas(tx);
	        });
	    }
	    // Populates "from" if unspecified, and calls with the transaction
	    call(transaction, blockTag) {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("call");
	            const tx = yield resolveProperties(this.checkTransaction(transaction));
	            return yield this.provider.call(tx, blockTag);
	        });
	    }
	    // Populates all fields in a transaction, signs it and sends it to the network
	    sendTransaction(transaction) {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("sendTransaction");
	            const tx = yield this.populateTransaction(transaction);
	            const signedTx = yield this.signTransaction(tx);
	            return yield this.provider.sendTransaction(signedTx);
	        });
	    }
	    getChainId() {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("getChainId");
	            const network = yield this.provider.getNetwork();
	            return network.chainId;
	        });
	    }
	    getGasPrice() {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("getGasPrice");
	            return yield this.provider.getGasPrice();
	        });
	    }
	    getFeeData() {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("getFeeData");
	            return yield this.provider.getFeeData();
	        });
	    }
	    resolveName(name) {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            this._checkProvider("resolveName");
	            return yield this.provider.resolveName(name);
	        });
	    }
	    // Checks a transaction does not contain invalid keys and if
	    // no "from" is provided, populates it.
	    // - does NOT require a provider
	    // - adds "from" is not present
	    // - returns a COPY (safe to mutate the result)
	    // By default called from: (overriding these prevents it)
	    //   - call
	    //   - estimateGas
	    //   - populateTransaction (and therefor sendTransaction)
	    checkTransaction(transaction) {
	        for (const key in transaction) {
	            if (allowedTransactionKeys$1.indexOf(key) === -1) {
	                logger$a.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
	            }
	        }
	        const tx = shallowCopy(transaction);
	        if (tx.from == null) {
	            tx.from = this.getAddress();
	        }
	        else {
	            // Make sure any provided address matches this signer
	            tx.from = Promise.all([
	                Promise.resolve(tx.from),
	                this.getAddress()
	            ]).then((result) => {
	                if (result[0].toLowerCase() !== result[1].toLowerCase()) {
	                    logger$a.throwArgumentError("from address mismatch", "transaction", transaction);
	                }
	                return result[0];
	            });
	        }
	        return tx;
	    }
	    // Populates ALL keys for a transaction and checks that "from" matches
	    // this Signer. Should be used by sendTransaction but NOT by signTransaction.
	    // By default called from: (overriding these prevents it)
	    //   - sendTransaction
	    //
	    // Notes:
	    //  - We allow gasPrice for EIP-1559 as long as it matches maxFeePerGas
	    populateTransaction(transaction) {
	        return __awaiter$5(this, void 0, void 0, function* () {
	            const tx = yield resolveProperties(this.checkTransaction(transaction));
	            if (tx.to != null) {
	                tx.to = Promise.resolve(tx.to).then((to) => __awaiter$5(this, void 0, void 0, function* () {
	                    if (to == null) {
	                        return null;
	                    }
	                    const address = yield this.resolveName(to);
	                    if (address == null) {
	                        logger$a.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
	                    }
	                    return address;
	                }));
	                // Prevent this error from causing an UnhandledPromiseException
	                tx.to.catch((error) => { });
	            }
	            // Do not allow mixing pre-eip-1559 and eip-1559 properties
	            const hasEip1559 = (tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null);
	            if (tx.gasPrice != null && (tx.type === 2 || hasEip1559)) {
	                logger$a.throwArgumentError("eip-1559 transaction do not support gasPrice", "transaction", transaction);
	            }
	            else if ((tx.type === 0 || tx.type === 1) && hasEip1559) {
	                logger$a.throwArgumentError("pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "transaction", transaction);
	            }
	            if ((tx.type === 2 || tx.type == null) && (tx.maxFeePerGas != null && tx.maxPriorityFeePerGas != null)) {
	                // Fully-formed EIP-1559 transaction (skip getFeeData)
	                tx.type = 2;
	            }
	            else if (tx.type === 0 || tx.type === 1) {
	                // Explicit Legacy or EIP-2930 transaction
	                // Populate missing gasPrice
	                if (tx.gasPrice == null) {
	                    tx.gasPrice = this.getGasPrice();
	                }
	            }
	            else {
	                // We need to get fee data to determine things
	                const feeData = yield this.getFeeData();
	                if (tx.type == null) {
	                    // We need to auto-detect the intended type of this transaction...
	                    if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
	                        // The network supports EIP-1559!
	                        // Upgrade transaction from null to eip-1559
	                        tx.type = 2;
	                        if (tx.gasPrice != null) {
	                            // Using legacy gasPrice property on an eip-1559 network,
	                            // so use gasPrice as both fee properties
	                            const gasPrice = tx.gasPrice;
	                            delete tx.gasPrice;
	                            tx.maxFeePerGas = gasPrice;
	                            tx.maxPriorityFeePerGas = gasPrice;
	                        }
	                        else {
	                            // Populate missing fee data
	                            if (tx.maxFeePerGas == null) {
	                                tx.maxFeePerGas = feeData.maxFeePerGas;
	                            }
	                            if (tx.maxPriorityFeePerGas == null) {
	                                tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
	                            }
	                        }
	                    }
	                    else if (feeData.gasPrice != null) {
	                        // Network doesn't support EIP-1559...
	                        // ...but they are trying to use EIP-1559 properties
	                        if (hasEip1559) {
	                            logger$a.throwError("network does not support EIP-1559", Logger.errors.UNSUPPORTED_OPERATION, {
	                                operation: "populateTransaction"
	                            });
	                        }
	                        // Populate missing fee data
	                        if (tx.gasPrice == null) {
	                            tx.gasPrice = feeData.gasPrice;
	                        }
	                        // Explicitly set untyped transaction to legacy
	                        tx.type = 0;
	                    }
	                    else {
	                        // getFeeData has failed us.
	                        logger$a.throwError("failed to get consistent fee data", Logger.errors.UNSUPPORTED_OPERATION, {
	                            operation: "signer.getFeeData"
	                        });
	                    }
	                }
	                else if (tx.type === 2) {
	                    // Explicitly using EIP-1559
	                    // Populate missing fee data
	                    if (tx.maxFeePerGas == null) {
	                        tx.maxFeePerGas = feeData.maxFeePerGas;
	                    }
	                    if (tx.maxPriorityFeePerGas == null) {
	                        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
	                    }
	                }
	            }
	            if (tx.nonce == null) {
	                tx.nonce = this.getTransactionCount("pending");
	            }
	            if (tx.gasLimit == null) {
	                tx.gasLimit = this.estimateGas(tx).catch((error) => {
	                    if (forwardErrors.indexOf(error.code) >= 0) {
	                        throw error;
	                    }
	                    return logger$a.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
	                        error: error,
	                        tx: tx
	                    });
	                });
	            }
	            if (tx.chainId == null) {
	                tx.chainId = this.getChainId();
	            }
	            else {
	                tx.chainId = Promise.all([
	                    Promise.resolve(tx.chainId),
	                    this.getChainId()
	                ]).then((results) => {
	                    if (results[1] !== 0 && results[0] !== results[1]) {
	                        logger$a.throwArgumentError("chainId address mismatch", "transaction", transaction);
	                    }
	                    return results[0];
	                });
	            }
	            return yield resolveProperties(tx);
	        });
	    }
	    ///////////////////
	    // Sub-classes SHOULD leave these alone
	    _checkProvider(operation) {
	        if (!this.provider) {
	            logger$a.throwError("missing provider", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: (operation || "_checkProvider")
	            });
	        }
	    }
	    static isSigner(value) {
	        return !!(value && value._isSigner);
	    }
	}
	class VoidSigner extends Signer {
	    constructor(address, provider) {
	        super();
	        defineReadOnly(this, "address", address);
	        defineReadOnly(this, "provider", provider || null);
	    }
	    getAddress() {
	        return Promise.resolve(this.address);
	    }
	    _fail(message, operation) {
	        return Promise.resolve().then(() => {
	            logger$a.throwError(message, Logger.errors.UNSUPPORTED_OPERATION, { operation: operation });
	        });
	    }
	    signMessage(message) {
	        return this._fail("VoidSigner cannot sign messages", "signMessage");
	    }
	    signTransaction(transaction) {
	        return this._fail("VoidSigner cannot sign transactions", "signTransaction");
	    }
	    _signTypedData(domain, types, value) {
	        return this._fail("VoidSigner cannot sign typed data", "signTypedData");
	    }
	    connect(provider) {
	        return new VoidSigner(this.address, provider);
	    }
	}

	var bn = createCommonjsModule$1(function (module) {
	(function (module, exports) {

	  // Utils
	  function assert (val, msg) {
	    if (!val) throw new Error(msg || 'Assertion failed');
	  }

	  // Could use `inherits` module, but don't want to move from single file
	  // architecture yet.
	  function inherits (ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function () {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  }

	  // BN

	  function BN (number, base, endian) {
	    if (BN.isBN(number)) {
	      return number;
	    }

	    this.negative = 0;
	    this.words = null;
	    this.length = 0;

	    // Reduction context
	    this.red = null;

	    if (number !== null) {
	      if (base === 'le' || base === 'be') {
	        endian = base;
	        base = 10;
	      }

	      this._init(number || 0, base || 10, endian || 'be');
	    }
	  }
	  if (typeof module === 'object') {
	    module.exports = BN;
	  } else {
	    exports.BN = BN;
	  }

	  BN.BN = BN;
	  BN.wordSize = 26;

	  var Buffer;
	  try {
	    if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
	      Buffer = window.Buffer;
	    } else {
	      Buffer = buffer.Buffer;
	    }
	  } catch (e) {
	  }

	  BN.isBN = function isBN (num) {
	    if (num instanceof BN) {
	      return true;
	    }

	    return num !== null && typeof num === 'object' &&
	      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
	  };

	  BN.max = function max (left, right) {
	    if (left.cmp(right) > 0) return left;
	    return right;
	  };

	  BN.min = function min (left, right) {
	    if (left.cmp(right) < 0) return left;
	    return right;
	  };

	  BN.prototype._init = function init (number, base, endian) {
	    if (typeof number === 'number') {
	      return this._initNumber(number, base, endian);
	    }

	    if (typeof number === 'object') {
	      return this._initArray(number, base, endian);
	    }

	    if (base === 'hex') {
	      base = 16;
	    }
	    assert(base === (base | 0) && base >= 2 && base <= 36);

	    number = number.toString().replace(/\s+/g, '');
	    var start = 0;
	    if (number[0] === '-') {
	      start++;
	      this.negative = 1;
	    }

	    if (start < number.length) {
	      if (base === 16) {
	        this._parseHex(number, start, endian);
	      } else {
	        this._parseBase(number, base, start);
	        if (endian === 'le') {
	          this._initArray(this.toArray(), base, endian);
	        }
	      }
	    }
	  };

	  BN.prototype._initNumber = function _initNumber (number, base, endian) {
	    if (number < 0) {
	      this.negative = 1;
	      number = -number;
	    }
	    if (number < 0x4000000) {
	      this.words = [number & 0x3ffffff];
	      this.length = 1;
	    } else if (number < 0x10000000000000) {
	      this.words = [
	        number & 0x3ffffff,
	        (number / 0x4000000) & 0x3ffffff
	      ];
	      this.length = 2;
	    } else {
	      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
	      this.words = [
	        number & 0x3ffffff,
	        (number / 0x4000000) & 0x3ffffff,
	        1
	      ];
	      this.length = 3;
	    }

	    if (endian !== 'le') return;

	    // Reverse the bytes
	    this._initArray(this.toArray(), base, endian);
	  };

	  BN.prototype._initArray = function _initArray (number, base, endian) {
	    // Perhaps a Uint8Array
	    assert(typeof number.length === 'number');
	    if (number.length <= 0) {
	      this.words = [0];
	      this.length = 1;
	      return this;
	    }

	    this.length = Math.ceil(number.length / 3);
	    this.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      this.words[i] = 0;
	    }

	    var j, w;
	    var off = 0;
	    if (endian === 'be') {
	      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
	        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
	        this.words[j] |= (w << off) & 0x3ffffff;
	        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
	        off += 24;
	        if (off >= 26) {
	          off -= 26;
	          j++;
	        }
	      }
	    } else if (endian === 'le') {
	      for (i = 0, j = 0; i < number.length; i += 3) {
	        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
	        this.words[j] |= (w << off) & 0x3ffffff;
	        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
	        off += 24;
	        if (off >= 26) {
	          off -= 26;
	          j++;
	        }
	      }
	    }
	    return this._strip();
	  };

	  function parseHex4Bits (string, index) {
	    var c = string.charCodeAt(index);
	    // '0' - '9'
	    if (c >= 48 && c <= 57) {
	      return c - 48;
	    // 'A' - 'F'
	    } else if (c >= 65 && c <= 70) {
	      return c - 55;
	    // 'a' - 'f'
	    } else if (c >= 97 && c <= 102) {
	      return c - 87;
	    } else {
	      assert(false, 'Invalid character in ' + string);
	    }
	  }

	  function parseHexByte (string, lowerBound, index) {
	    var r = parseHex4Bits(string, index);
	    if (index - 1 >= lowerBound) {
	      r |= parseHex4Bits(string, index - 1) << 4;
	    }
	    return r;
	  }

	  BN.prototype._parseHex = function _parseHex (number, start, endian) {
	    // Create possibly bigger array to ensure that it fits the number
	    this.length = Math.ceil((number.length - start) / 6);
	    this.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      this.words[i] = 0;
	    }

	    // 24-bits chunks
	    var off = 0;
	    var j = 0;

	    var w;
	    if (endian === 'be') {
	      for (i = number.length - 1; i >= start; i -= 2) {
	        w = parseHexByte(number, start, i) << off;
	        this.words[j] |= w & 0x3ffffff;
	        if (off >= 18) {
	          off -= 18;
	          j += 1;
	          this.words[j] |= w >>> 26;
	        } else {
	          off += 8;
	        }
	      }
	    } else {
	      var parseLength = number.length - start;
	      for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
	        w = parseHexByte(number, start, i) << off;
	        this.words[j] |= w & 0x3ffffff;
	        if (off >= 18) {
	          off -= 18;
	          j += 1;
	          this.words[j] |= w >>> 26;
	        } else {
	          off += 8;
	        }
	      }
	    }

	    this._strip();
	  };

	  function parseBase (str, start, end, mul) {
	    var r = 0;
	    var b = 0;
	    var len = Math.min(str.length, end);
	    for (var i = start; i < len; i++) {
	      var c = str.charCodeAt(i) - 48;

	      r *= mul;

	      // 'a'
	      if (c >= 49) {
	        b = c - 49 + 0xa;

	      // 'A'
	      } else if (c >= 17) {
	        b = c - 17 + 0xa;

	      // '0' - '9'
	      } else {
	        b = c;
	      }
	      assert(c >= 0 && b < mul, 'Invalid character');
	      r += b;
	    }
	    return r;
	  }

	  BN.prototype._parseBase = function _parseBase (number, base, start) {
	    // Initialize as zero
	    this.words = [0];
	    this.length = 1;

	    // Find length of limb in base
	    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
	      limbLen++;
	    }
	    limbLen--;
	    limbPow = (limbPow / base) | 0;

	    var total = number.length - start;
	    var mod = total % limbLen;
	    var end = Math.min(total, total - mod) + start;

	    var word = 0;
	    for (var i = start; i < end; i += limbLen) {
	      word = parseBase(number, i, i + limbLen, base);

	      this.imuln(limbPow);
	      if (this.words[0] + word < 0x4000000) {
	        this.words[0] += word;
	      } else {
	        this._iaddn(word);
	      }
	    }

	    if (mod !== 0) {
	      var pow = 1;
	      word = parseBase(number, i, number.length, base);

	      for (i = 0; i < mod; i++) {
	        pow *= base;
	      }

	      this.imuln(pow);
	      if (this.words[0] + word < 0x4000000) {
	        this.words[0] += word;
	      } else {
	        this._iaddn(word);
	      }
	    }

	    this._strip();
	  };

	  BN.prototype.copy = function copy (dest) {
	    dest.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      dest.words[i] = this.words[i];
	    }
	    dest.length = this.length;
	    dest.negative = this.negative;
	    dest.red = this.red;
	  };

	  function move (dest, src) {
	    dest.words = src.words;
	    dest.length = src.length;
	    dest.negative = src.negative;
	    dest.red = src.red;
	  }

	  BN.prototype._move = function _move (dest) {
	    move(dest, this);
	  };

	  BN.prototype.clone = function clone () {
	    var r = new BN(null);
	    this.copy(r);
	    return r;
	  };

	  BN.prototype._expand = function _expand (size) {
	    while (this.length < size) {
	      this.words[this.length++] = 0;
	    }
	    return this;
	  };

	  // Remove leading `0` from `this`
	  BN.prototype._strip = function strip () {
	    while (this.length > 1 && this.words[this.length - 1] === 0) {
	      this.length--;
	    }
	    return this._normSign();
	  };

	  BN.prototype._normSign = function _normSign () {
	    // -0 = 0
	    if (this.length === 1 && this.words[0] === 0) {
	      this.negative = 0;
	    }
	    return this;
	  };

	  // Check Symbol.for because not everywhere where Symbol defined
	  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
	  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
	    try {
	      BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
	    } catch (e) {
	      BN.prototype.inspect = inspect;
	    }
	  } else {
	    BN.prototype.inspect = inspect;
	  }

	  function inspect () {
	    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
	  }

	  /*

	  var zeros = [];
	  var groupSizes = [];
	  var groupBases = [];

	  var s = '';
	  var i = -1;
	  while (++i < BN.wordSize) {
	    zeros[i] = s;
	    s += '0';
	  }
	  groupSizes[0] = 0;
	  groupSizes[1] = 0;
	  groupBases[0] = 0;
	  groupBases[1] = 0;
	  var base = 2 - 1;
	  while (++base < 36 + 1) {
	    var groupSize = 0;
	    var groupBase = 1;
	    while (groupBase < (1 << BN.wordSize) / base) {
	      groupBase *= base;
	      groupSize += 1;
	    }
	    groupSizes[base] = groupSize;
	    groupBases[base] = groupBase;
	  }

	  */

	  var zeros = [
	    '',
	    '0',
	    '00',
	    '000',
	    '0000',
	    '00000',
	    '000000',
	    '0000000',
	    '00000000',
	    '000000000',
	    '0000000000',
	    '00000000000',
	    '000000000000',
	    '0000000000000',
	    '00000000000000',
	    '000000000000000',
	    '0000000000000000',
	    '00000000000000000',
	    '000000000000000000',
	    '0000000000000000000',
	    '00000000000000000000',
	    '000000000000000000000',
	    '0000000000000000000000',
	    '00000000000000000000000',
	    '000000000000000000000000',
	    '0000000000000000000000000'
	  ];

	  var groupSizes = [
	    0, 0,
	    25, 16, 12, 11, 10, 9, 8,
	    8, 7, 7, 7, 7, 6, 6,
	    6, 6, 6, 6, 6, 5, 5,
	    5, 5, 5, 5, 5, 5, 5,
	    5, 5, 5, 5, 5, 5, 5
	  ];

	  var groupBases = [
	    0, 0,
	    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
	    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
	    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
	    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
	    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
	  ];

	  BN.prototype.toString = function toString (base, padding) {
	    base = base || 10;
	    padding = padding | 0 || 1;

	    var out;
	    if (base === 16 || base === 'hex') {
	      out = '';
	      var off = 0;
	      var carry = 0;
	      for (var i = 0; i < this.length; i++) {
	        var w = this.words[i];
	        var word = (((w << off) | carry) & 0xffffff).toString(16);
	        carry = (w >>> (24 - off)) & 0xffffff;
	        off += 2;
	        if (off >= 26) {
	          off -= 26;
	          i--;
	        }
	        if (carry !== 0 || i !== this.length - 1) {
	          out = zeros[6 - word.length] + word + out;
	        } else {
	          out = word + out;
	        }
	      }
	      if (carry !== 0) {
	        out = carry.toString(16) + out;
	      }
	      while (out.length % padding !== 0) {
	        out = '0' + out;
	      }
	      if (this.negative !== 0) {
	        out = '-' + out;
	      }
	      return out;
	    }

	    if (base === (base | 0) && base >= 2 && base <= 36) {
	      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
	      var groupSize = groupSizes[base];
	      // var groupBase = Math.pow(base, groupSize);
	      var groupBase = groupBases[base];
	      out = '';
	      var c = this.clone();
	      c.negative = 0;
	      while (!c.isZero()) {
	        var r = c.modrn(groupBase).toString(base);
	        c = c.idivn(groupBase);

	        if (!c.isZero()) {
	          out = zeros[groupSize - r.length] + r + out;
	        } else {
	          out = r + out;
	        }
	      }
	      if (this.isZero()) {
	        out = '0' + out;
	      }
	      while (out.length % padding !== 0) {
	        out = '0' + out;
	      }
	      if (this.negative !== 0) {
	        out = '-' + out;
	      }
	      return out;
	    }

	    assert(false, 'Base should be between 2 and 36');
	  };

	  BN.prototype.toNumber = function toNumber () {
	    var ret = this.words[0];
	    if (this.length === 2) {
	      ret += this.words[1] * 0x4000000;
	    } else if (this.length === 3 && this.words[2] === 0x01) {
	      // NOTE: at this stage it is known that the top bit is set
	      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
	    } else if (this.length > 2) {
	      assert(false, 'Number can only safely store up to 53 bits');
	    }
	    return (this.negative !== 0) ? -ret : ret;
	  };

	  BN.prototype.toJSON = function toJSON () {
	    return this.toString(16, 2);
	  };

	  if (Buffer) {
	    BN.prototype.toBuffer = function toBuffer (endian, length) {
	      return this.toArrayLike(Buffer, endian, length);
	    };
	  }

	  BN.prototype.toArray = function toArray (endian, length) {
	    return this.toArrayLike(Array, endian, length);
	  };

	  var allocate = function allocate (ArrayType, size) {
	    if (ArrayType.allocUnsafe) {
	      return ArrayType.allocUnsafe(size);
	    }
	    return new ArrayType(size);
	  };

	  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
	    this._strip();

	    var byteLength = this.byteLength();
	    var reqLength = length || Math.max(1, byteLength);
	    assert(byteLength <= reqLength, 'byte array longer than desired length');
	    assert(reqLength > 0, 'Requested array length <= 0');

	    var res = allocate(ArrayType, reqLength);
	    var postfix = endian === 'le' ? 'LE' : 'BE';
	    this['_toArrayLike' + postfix](res, byteLength);
	    return res;
	  };

	  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
	    var position = 0;
	    var carry = 0;

	    for (var i = 0, shift = 0; i < this.length; i++) {
	      var word = (this.words[i] << shift) | carry;

	      res[position++] = word & 0xff;
	      if (position < res.length) {
	        res[position++] = (word >> 8) & 0xff;
	      }
	      if (position < res.length) {
	        res[position++] = (word >> 16) & 0xff;
	      }

	      if (shift === 6) {
	        if (position < res.length) {
	          res[position++] = (word >> 24) & 0xff;
	        }
	        carry = 0;
	        shift = 0;
	      } else {
	        carry = word >>> 24;
	        shift += 2;
	      }
	    }

	    if (position < res.length) {
	      res[position++] = carry;

	      while (position < res.length) {
	        res[position++] = 0;
	      }
	    }
	  };

	  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
	    var position = res.length - 1;
	    var carry = 0;

	    for (var i = 0, shift = 0; i < this.length; i++) {
	      var word = (this.words[i] << shift) | carry;

	      res[position--] = word & 0xff;
	      if (position >= 0) {
	        res[position--] = (word >> 8) & 0xff;
	      }
	      if (position >= 0) {
	        res[position--] = (word >> 16) & 0xff;
	      }

	      if (shift === 6) {
	        if (position >= 0) {
	          res[position--] = (word >> 24) & 0xff;
	        }
	        carry = 0;
	        shift = 0;
	      } else {
	        carry = word >>> 24;
	        shift += 2;
	      }
	    }

	    if (position >= 0) {
	      res[position--] = carry;

	      while (position >= 0) {
	        res[position--] = 0;
	      }
	    }
	  };

	  if (Math.clz32) {
	    BN.prototype._countBits = function _countBits (w) {
	      return 32 - Math.clz32(w);
	    };
	  } else {
	    BN.prototype._countBits = function _countBits (w) {
	      var t = w;
	      var r = 0;
	      if (t >= 0x1000) {
	        r += 13;
	        t >>>= 13;
	      }
	      if (t >= 0x40) {
	        r += 7;
	        t >>>= 7;
	      }
	      if (t >= 0x8) {
	        r += 4;
	        t >>>= 4;
	      }
	      if (t >= 0x02) {
	        r += 2;
	        t >>>= 2;
	      }
	      return r + t;
	    };
	  }

	  BN.prototype._zeroBits = function _zeroBits (w) {
	    // Short-cut
	    if (w === 0) return 26;

	    var t = w;
	    var r = 0;
	    if ((t & 0x1fff) === 0) {
	      r += 13;
	      t >>>= 13;
	    }
	    if ((t & 0x7f) === 0) {
	      r += 7;
	      t >>>= 7;
	    }
	    if ((t & 0xf) === 0) {
	      r += 4;
	      t >>>= 4;
	    }
	    if ((t & 0x3) === 0) {
	      r += 2;
	      t >>>= 2;
	    }
	    if ((t & 0x1) === 0) {
	      r++;
	    }
	    return r;
	  };

	  // Return number of used bits in a BN
	  BN.prototype.bitLength = function bitLength () {
	    var w = this.words[this.length - 1];
	    var hi = this._countBits(w);
	    return (this.length - 1) * 26 + hi;
	  };

	  function toBitArray (num) {
	    var w = new Array(num.bitLength());

	    for (var bit = 0; bit < w.length; bit++) {
	      var off = (bit / 26) | 0;
	      var wbit = bit % 26;

	      w[bit] = (num.words[off] >>> wbit) & 0x01;
	    }

	    return w;
	  }

	  // Number of trailing zero bits
	  BN.prototype.zeroBits = function zeroBits () {
	    if (this.isZero()) return 0;

	    var r = 0;
	    for (var i = 0; i < this.length; i++) {
	      var b = this._zeroBits(this.words[i]);
	      r += b;
	      if (b !== 26) break;
	    }
	    return r;
	  };

	  BN.prototype.byteLength = function byteLength () {
	    return Math.ceil(this.bitLength() / 8);
	  };

	  BN.prototype.toTwos = function toTwos (width) {
	    if (this.negative !== 0) {
	      return this.abs().inotn(width).iaddn(1);
	    }
	    return this.clone();
	  };

	  BN.prototype.fromTwos = function fromTwos (width) {
	    if (this.testn(width - 1)) {
	      return this.notn(width).iaddn(1).ineg();
	    }
	    return this.clone();
	  };

	  BN.prototype.isNeg = function isNeg () {
	    return this.negative !== 0;
	  };

	  // Return negative clone of `this`
	  BN.prototype.neg = function neg () {
	    return this.clone().ineg();
	  };

	  BN.prototype.ineg = function ineg () {
	    if (!this.isZero()) {
	      this.negative ^= 1;
	    }

	    return this;
	  };

	  // Or `num` with `this` in-place
	  BN.prototype.iuor = function iuor (num) {
	    while (this.length < num.length) {
	      this.words[this.length++] = 0;
	    }

	    for (var i = 0; i < num.length; i++) {
	      this.words[i] = this.words[i] | num.words[i];
	    }

	    return this._strip();
	  };

	  BN.prototype.ior = function ior (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuor(num);
	  };

	  // Or `num` with `this`
	  BN.prototype.or = function or (num) {
	    if (this.length > num.length) return this.clone().ior(num);
	    return num.clone().ior(this);
	  };

	  BN.prototype.uor = function uor (num) {
	    if (this.length > num.length) return this.clone().iuor(num);
	    return num.clone().iuor(this);
	  };

	  // And `num` with `this` in-place
	  BN.prototype.iuand = function iuand (num) {
	    // b = min-length(num, this)
	    var b;
	    if (this.length > num.length) {
	      b = num;
	    } else {
	      b = this;
	    }

	    for (var i = 0; i < b.length; i++) {
	      this.words[i] = this.words[i] & num.words[i];
	    }

	    this.length = b.length;

	    return this._strip();
	  };

	  BN.prototype.iand = function iand (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuand(num);
	  };

	  // And `num` with `this`
	  BN.prototype.and = function and (num) {
	    if (this.length > num.length) return this.clone().iand(num);
	    return num.clone().iand(this);
	  };

	  BN.prototype.uand = function uand (num) {
	    if (this.length > num.length) return this.clone().iuand(num);
	    return num.clone().iuand(this);
	  };

	  // Xor `num` with `this` in-place
	  BN.prototype.iuxor = function iuxor (num) {
	    // a.length > b.length
	    var a;
	    var b;
	    if (this.length > num.length) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    for (var i = 0; i < b.length; i++) {
	      this.words[i] = a.words[i] ^ b.words[i];
	    }

	    if (this !== a) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    this.length = a.length;

	    return this._strip();
	  };

	  BN.prototype.ixor = function ixor (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuxor(num);
	  };

	  // Xor `num` with `this`
	  BN.prototype.xor = function xor (num) {
	    if (this.length > num.length) return this.clone().ixor(num);
	    return num.clone().ixor(this);
	  };

	  BN.prototype.uxor = function uxor (num) {
	    if (this.length > num.length) return this.clone().iuxor(num);
	    return num.clone().iuxor(this);
	  };

	  // Not ``this`` with ``width`` bitwidth
	  BN.prototype.inotn = function inotn (width) {
	    assert(typeof width === 'number' && width >= 0);

	    var bytesNeeded = Math.ceil(width / 26) | 0;
	    var bitsLeft = width % 26;

	    // Extend the buffer with leading zeroes
	    this._expand(bytesNeeded);

	    if (bitsLeft > 0) {
	      bytesNeeded--;
	    }

	    // Handle complete words
	    for (var i = 0; i < bytesNeeded; i++) {
	      this.words[i] = ~this.words[i] & 0x3ffffff;
	    }

	    // Handle the residue
	    if (bitsLeft > 0) {
	      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
	    }

	    // And remove leading zeroes
	    return this._strip();
	  };

	  BN.prototype.notn = function notn (width) {
	    return this.clone().inotn(width);
	  };

	  // Set `bit` of `this`
	  BN.prototype.setn = function setn (bit, val) {
	    assert(typeof bit === 'number' && bit >= 0);

	    var off = (bit / 26) | 0;
	    var wbit = bit % 26;

	    this._expand(off + 1);

	    if (val) {
	      this.words[off] = this.words[off] | (1 << wbit);
	    } else {
	      this.words[off] = this.words[off] & ~(1 << wbit);
	    }

	    return this._strip();
	  };

	  // Add `num` to `this` in-place
	  BN.prototype.iadd = function iadd (num) {
	    var r;

	    // negative + positive
	    if (this.negative !== 0 && num.negative === 0) {
	      this.negative = 0;
	      r = this.isub(num);
	      this.negative ^= 1;
	      return this._normSign();

	    // positive + negative
	    } else if (this.negative === 0 && num.negative !== 0) {
	      num.negative = 0;
	      r = this.isub(num);
	      num.negative = 1;
	      return r._normSign();
	    }

	    // a.length > b.length
	    var a, b;
	    if (this.length > num.length) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    var carry = 0;
	    for (var i = 0; i < b.length; i++) {
	      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
	      this.words[i] = r & 0x3ffffff;
	      carry = r >>> 26;
	    }
	    for (; carry !== 0 && i < a.length; i++) {
	      r = (a.words[i] | 0) + carry;
	      this.words[i] = r & 0x3ffffff;
	      carry = r >>> 26;
	    }

	    this.length = a.length;
	    if (carry !== 0) {
	      this.words[this.length] = carry;
	      this.length++;
	    // Copy the rest of the words
	    } else if (a !== this) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    return this;
	  };

	  // Add `num` to `this`
	  BN.prototype.add = function add (num) {
	    var res;
	    if (num.negative !== 0 && this.negative === 0) {
	      num.negative = 0;
	      res = this.sub(num);
	      num.negative ^= 1;
	      return res;
	    } else if (num.negative === 0 && this.negative !== 0) {
	      this.negative = 0;
	      res = num.sub(this);
	      this.negative = 1;
	      return res;
	    }

	    if (this.length > num.length) return this.clone().iadd(num);

	    return num.clone().iadd(this);
	  };

	  // Subtract `num` from `this` in-place
	  BN.prototype.isub = function isub (num) {
	    // this - (-num) = this + num
	    if (num.negative !== 0) {
	      num.negative = 0;
	      var r = this.iadd(num);
	      num.negative = 1;
	      return r._normSign();

	    // -this - num = -(this + num)
	    } else if (this.negative !== 0) {
	      this.negative = 0;
	      this.iadd(num);
	      this.negative = 1;
	      return this._normSign();
	    }

	    // At this point both numbers are positive
	    var cmp = this.cmp(num);

	    // Optimization - zeroify
	    if (cmp === 0) {
	      this.negative = 0;
	      this.length = 1;
	      this.words[0] = 0;
	      return this;
	    }

	    // a > b
	    var a, b;
	    if (cmp > 0) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    var carry = 0;
	    for (var i = 0; i < b.length; i++) {
	      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
	      carry = r >> 26;
	      this.words[i] = r & 0x3ffffff;
	    }
	    for (; carry !== 0 && i < a.length; i++) {
	      r = (a.words[i] | 0) + carry;
	      carry = r >> 26;
	      this.words[i] = r & 0x3ffffff;
	    }

	    // Copy rest of the words
	    if (carry === 0 && i < a.length && a !== this) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    this.length = Math.max(this.length, i);

	    if (a !== this) {
	      this.negative = 1;
	    }

	    return this._strip();
	  };

	  // Subtract `num` from `this`
	  BN.prototype.sub = function sub (num) {
	    return this.clone().isub(num);
	  };

	  function smallMulTo (self, num, out) {
	    out.negative = num.negative ^ self.negative;
	    var len = (self.length + num.length) | 0;
	    out.length = len;
	    len = (len - 1) | 0;

	    // Peel one iteration (compiler can't do it, because of code complexity)
	    var a = self.words[0] | 0;
	    var b = num.words[0] | 0;
	    var r = a * b;

	    var lo = r & 0x3ffffff;
	    var carry = (r / 0x4000000) | 0;
	    out.words[0] = lo;

	    for (var k = 1; k < len; k++) {
	      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
	      // note that ncarry could be >= 0x3ffffff
	      var ncarry = carry >>> 26;
	      var rword = carry & 0x3ffffff;
	      var maxJ = Math.min(k, num.length - 1);
	      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
	        var i = (k - j) | 0;
	        a = self.words[i] | 0;
	        b = num.words[j] | 0;
	        r = a * b + rword;
	        ncarry += (r / 0x4000000) | 0;
	        rword = r & 0x3ffffff;
	      }
	      out.words[k] = rword | 0;
	      carry = ncarry | 0;
	    }
	    if (carry !== 0) {
	      out.words[k] = carry | 0;
	    } else {
	      out.length--;
	    }

	    return out._strip();
	  }

	  // TODO(indutny): it may be reasonable to omit it for users who don't need
	  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
	  // multiplication (like elliptic secp256k1).
	  var comb10MulTo = function comb10MulTo (self, num, out) {
	    var a = self.words;
	    var b = num.words;
	    var o = out.words;
	    var c = 0;
	    var lo;
	    var mid;
	    var hi;
	    var a0 = a[0] | 0;
	    var al0 = a0 & 0x1fff;
	    var ah0 = a0 >>> 13;
	    var a1 = a[1] | 0;
	    var al1 = a1 & 0x1fff;
	    var ah1 = a1 >>> 13;
	    var a2 = a[2] | 0;
	    var al2 = a2 & 0x1fff;
	    var ah2 = a2 >>> 13;
	    var a3 = a[3] | 0;
	    var al3 = a3 & 0x1fff;
	    var ah3 = a3 >>> 13;
	    var a4 = a[4] | 0;
	    var al4 = a4 & 0x1fff;
	    var ah4 = a4 >>> 13;
	    var a5 = a[5] | 0;
	    var al5 = a5 & 0x1fff;
	    var ah5 = a5 >>> 13;
	    var a6 = a[6] | 0;
	    var al6 = a6 & 0x1fff;
	    var ah6 = a6 >>> 13;
	    var a7 = a[7] | 0;
	    var al7 = a7 & 0x1fff;
	    var ah7 = a7 >>> 13;
	    var a8 = a[8] | 0;
	    var al8 = a8 & 0x1fff;
	    var ah8 = a8 >>> 13;
	    var a9 = a[9] | 0;
	    var al9 = a9 & 0x1fff;
	    var ah9 = a9 >>> 13;
	    var b0 = b[0] | 0;
	    var bl0 = b0 & 0x1fff;
	    var bh0 = b0 >>> 13;
	    var b1 = b[1] | 0;
	    var bl1 = b1 & 0x1fff;
	    var bh1 = b1 >>> 13;
	    var b2 = b[2] | 0;
	    var bl2 = b2 & 0x1fff;
	    var bh2 = b2 >>> 13;
	    var b3 = b[3] | 0;
	    var bl3 = b3 & 0x1fff;
	    var bh3 = b3 >>> 13;
	    var b4 = b[4] | 0;
	    var bl4 = b4 & 0x1fff;
	    var bh4 = b4 >>> 13;
	    var b5 = b[5] | 0;
	    var bl5 = b5 & 0x1fff;
	    var bh5 = b5 >>> 13;
	    var b6 = b[6] | 0;
	    var bl6 = b6 & 0x1fff;
	    var bh6 = b6 >>> 13;
	    var b7 = b[7] | 0;
	    var bl7 = b7 & 0x1fff;
	    var bh7 = b7 >>> 13;
	    var b8 = b[8] | 0;
	    var bl8 = b8 & 0x1fff;
	    var bh8 = b8 >>> 13;
	    var b9 = b[9] | 0;
	    var bl9 = b9 & 0x1fff;
	    var bh9 = b9 >>> 13;

	    out.negative = self.negative ^ num.negative;
	    out.length = 19;
	    /* k = 0 */
	    lo = Math.imul(al0, bl0);
	    mid = Math.imul(al0, bh0);
	    mid = (mid + Math.imul(ah0, bl0)) | 0;
	    hi = Math.imul(ah0, bh0);
	    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
	    w0 &= 0x3ffffff;
	    /* k = 1 */
	    lo = Math.imul(al1, bl0);
	    mid = Math.imul(al1, bh0);
	    mid = (mid + Math.imul(ah1, bl0)) | 0;
	    hi = Math.imul(ah1, bh0);
	    lo = (lo + Math.imul(al0, bl1)) | 0;
	    mid = (mid + Math.imul(al0, bh1)) | 0;
	    mid = (mid + Math.imul(ah0, bl1)) | 0;
	    hi = (hi + Math.imul(ah0, bh1)) | 0;
	    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
	    w1 &= 0x3ffffff;
	    /* k = 2 */
	    lo = Math.imul(al2, bl0);
	    mid = Math.imul(al2, bh0);
	    mid = (mid + Math.imul(ah2, bl0)) | 0;
	    hi = Math.imul(ah2, bh0);
	    lo = (lo + Math.imul(al1, bl1)) | 0;
	    mid = (mid + Math.imul(al1, bh1)) | 0;
	    mid = (mid + Math.imul(ah1, bl1)) | 0;
	    hi = (hi + Math.imul(ah1, bh1)) | 0;
	    lo = (lo + Math.imul(al0, bl2)) | 0;
	    mid = (mid + Math.imul(al0, bh2)) | 0;
	    mid = (mid + Math.imul(ah0, bl2)) | 0;
	    hi = (hi + Math.imul(ah0, bh2)) | 0;
	    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
	    w2 &= 0x3ffffff;
	    /* k = 3 */
	    lo = Math.imul(al3, bl0);
	    mid = Math.imul(al3, bh0);
	    mid = (mid + Math.imul(ah3, bl0)) | 0;
	    hi = Math.imul(ah3, bh0);
	    lo = (lo + Math.imul(al2, bl1)) | 0;
	    mid = (mid + Math.imul(al2, bh1)) | 0;
	    mid = (mid + Math.imul(ah2, bl1)) | 0;
	    hi = (hi + Math.imul(ah2, bh1)) | 0;
	    lo = (lo + Math.imul(al1, bl2)) | 0;
	    mid = (mid + Math.imul(al1, bh2)) | 0;
	    mid = (mid + Math.imul(ah1, bl2)) | 0;
	    hi = (hi + Math.imul(ah1, bh2)) | 0;
	    lo = (lo + Math.imul(al0, bl3)) | 0;
	    mid = (mid + Math.imul(al0, bh3)) | 0;
	    mid = (mid + Math.imul(ah0, bl3)) | 0;
	    hi = (hi + Math.imul(ah0, bh3)) | 0;
	    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
	    w3 &= 0x3ffffff;
	    /* k = 4 */
	    lo = Math.imul(al4, bl0);
	    mid = Math.imul(al4, bh0);
	    mid = (mid + Math.imul(ah4, bl0)) | 0;
	    hi = Math.imul(ah4, bh0);
	    lo = (lo + Math.imul(al3, bl1)) | 0;
	    mid = (mid + Math.imul(al3, bh1)) | 0;
	    mid = (mid + Math.imul(ah3, bl1)) | 0;
	    hi = (hi + Math.imul(ah3, bh1)) | 0;
	    lo = (lo + Math.imul(al2, bl2)) | 0;
	    mid = (mid + Math.imul(al2, bh2)) | 0;
	    mid = (mid + Math.imul(ah2, bl2)) | 0;
	    hi = (hi + Math.imul(ah2, bh2)) | 0;
	    lo = (lo + Math.imul(al1, bl3)) | 0;
	    mid = (mid + Math.imul(al1, bh3)) | 0;
	    mid = (mid + Math.imul(ah1, bl3)) | 0;
	    hi = (hi + Math.imul(ah1, bh3)) | 0;
	    lo = (lo + Math.imul(al0, bl4)) | 0;
	    mid = (mid + Math.imul(al0, bh4)) | 0;
	    mid = (mid + Math.imul(ah0, bl4)) | 0;
	    hi = (hi + Math.imul(ah0, bh4)) | 0;
	    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
	    w4 &= 0x3ffffff;
	    /* k = 5 */
	    lo = Math.imul(al5, bl0);
	    mid = Math.imul(al5, bh0);
	    mid = (mid + Math.imul(ah5, bl0)) | 0;
	    hi = Math.imul(ah5, bh0);
	    lo = (lo + Math.imul(al4, bl1)) | 0;
	    mid = (mid + Math.imul(al4, bh1)) | 0;
	    mid = (mid + Math.imul(ah4, bl1)) | 0;
	    hi = (hi + Math.imul(ah4, bh1)) | 0;
	    lo = (lo + Math.imul(al3, bl2)) | 0;
	    mid = (mid + Math.imul(al3, bh2)) | 0;
	    mid = (mid + Math.imul(ah3, bl2)) | 0;
	    hi = (hi + Math.imul(ah3, bh2)) | 0;
	    lo = (lo + Math.imul(al2, bl3)) | 0;
	    mid = (mid + Math.imul(al2, bh3)) | 0;
	    mid = (mid + Math.imul(ah2, bl3)) | 0;
	    hi = (hi + Math.imul(ah2, bh3)) | 0;
	    lo = (lo + Math.imul(al1, bl4)) | 0;
	    mid = (mid + Math.imul(al1, bh4)) | 0;
	    mid = (mid + Math.imul(ah1, bl4)) | 0;
	    hi = (hi + Math.imul(ah1, bh4)) | 0;
	    lo = (lo + Math.imul(al0, bl5)) | 0;
	    mid = (mid + Math.imul(al0, bh5)) | 0;
	    mid = (mid + Math.imul(ah0, bl5)) | 0;
	    hi = (hi + Math.imul(ah0, bh5)) | 0;
	    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
	    w5 &= 0x3ffffff;
	    /* k = 6 */
	    lo = Math.imul(al6, bl0);
	    mid = Math.imul(al6, bh0);
	    mid = (mid + Math.imul(ah6, bl0)) | 0;
	    hi = Math.imul(ah6, bh0);
	    lo = (lo + Math.imul(al5, bl1)) | 0;
	    mid = (mid + Math.imul(al5, bh1)) | 0;
	    mid = (mid + Math.imul(ah5, bl1)) | 0;
	    hi = (hi + Math.imul(ah5, bh1)) | 0;
	    lo = (lo + Math.imul(al4, bl2)) | 0;
	    mid = (mid + Math.imul(al4, bh2)) | 0;
	    mid = (mid + Math.imul(ah4, bl2)) | 0;
	    hi = (hi + Math.imul(ah4, bh2)) | 0;
	    lo = (lo + Math.imul(al3, bl3)) | 0;
	    mid = (mid + Math.imul(al3, bh3)) | 0;
	    mid = (mid + Math.imul(ah3, bl3)) | 0;
	    hi = (hi + Math.imul(ah3, bh3)) | 0;
	    lo = (lo + Math.imul(al2, bl4)) | 0;
	    mid = (mid + Math.imul(al2, bh4)) | 0;
	    mid = (mid + Math.imul(ah2, bl4)) | 0;
	    hi = (hi + Math.imul(ah2, bh4)) | 0;
	    lo = (lo + Math.imul(al1, bl5)) | 0;
	    mid = (mid + Math.imul(al1, bh5)) | 0;
	    mid = (mid + Math.imul(ah1, bl5)) | 0;
	    hi = (hi + Math.imul(ah1, bh5)) | 0;
	    lo = (lo + Math.imul(al0, bl6)) | 0;
	    mid = (mid + Math.imul(al0, bh6)) | 0;
	    mid = (mid + Math.imul(ah0, bl6)) | 0;
	    hi = (hi + Math.imul(ah0, bh6)) | 0;
	    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
	    w6 &= 0x3ffffff;
	    /* k = 7 */
	    lo = Math.imul(al7, bl0);
	    mid = Math.imul(al7, bh0);
	    mid = (mid + Math.imul(ah7, bl0)) | 0;
	    hi = Math.imul(ah7, bh0);
	    lo = (lo + Math.imul(al6, bl1)) | 0;
	    mid = (mid + Math.imul(al6, bh1)) | 0;
	    mid = (mid + Math.imul(ah6, bl1)) | 0;
	    hi = (hi + Math.imul(ah6, bh1)) | 0;
	    lo = (lo + Math.imul(al5, bl2)) | 0;
	    mid = (mid + Math.imul(al5, bh2)) | 0;
	    mid = (mid + Math.imul(ah5, bl2)) | 0;
	    hi = (hi + Math.imul(ah5, bh2)) | 0;
	    lo = (lo + Math.imul(al4, bl3)) | 0;
	    mid = (mid + Math.imul(al4, bh3)) | 0;
	    mid = (mid + Math.imul(ah4, bl3)) | 0;
	    hi = (hi + Math.imul(ah4, bh3)) | 0;
	    lo = (lo + Math.imul(al3, bl4)) | 0;
	    mid = (mid + Math.imul(al3, bh4)) | 0;
	    mid = (mid + Math.imul(ah3, bl4)) | 0;
	    hi = (hi + Math.imul(ah3, bh4)) | 0;
	    lo = (lo + Math.imul(al2, bl5)) | 0;
	    mid = (mid + Math.imul(al2, bh5)) | 0;
	    mid = (mid + Math.imul(ah2, bl5)) | 0;
	    hi = (hi + Math.imul(ah2, bh5)) | 0;
	    lo = (lo + Math.imul(al1, bl6)) | 0;
	    mid = (mid + Math.imul(al1, bh6)) | 0;
	    mid = (mid + Math.imul(ah1, bl6)) | 0;
	    hi = (hi + Math.imul(ah1, bh6)) | 0;
	    lo = (lo + Math.imul(al0, bl7)) | 0;
	    mid = (mid + Math.imul(al0, bh7)) | 0;
	    mid = (mid + Math.imul(ah0, bl7)) | 0;
	    hi = (hi + Math.imul(ah0, bh7)) | 0;
	    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
	    w7 &= 0x3ffffff;
	    /* k = 8 */
	    lo = Math.imul(al8, bl0);
	    mid = Math.imul(al8, bh0);
	    mid = (mid + Math.imul(ah8, bl0)) | 0;
	    hi = Math.imul(ah8, bh0);
	    lo = (lo + Math.imul(al7, bl1)) | 0;
	    mid = (mid + Math.imul(al7, bh1)) | 0;
	    mid = (mid + Math.imul(ah7, bl1)) | 0;
	    hi = (hi + Math.imul(ah7, bh1)) | 0;
	    lo = (lo + Math.imul(al6, bl2)) | 0;
	    mid = (mid + Math.imul(al6, bh2)) | 0;
	    mid = (mid + Math.imul(ah6, bl2)) | 0;
	    hi = (hi + Math.imul(ah6, bh2)) | 0;
	    lo = (lo + Math.imul(al5, bl3)) | 0;
	    mid = (mid + Math.imul(al5, bh3)) | 0;
	    mid = (mid + Math.imul(ah5, bl3)) | 0;
	    hi = (hi + Math.imul(ah5, bh3)) | 0;
	    lo = (lo + Math.imul(al4, bl4)) | 0;
	    mid = (mid + Math.imul(al4, bh4)) | 0;
	    mid = (mid + Math.imul(ah4, bl4)) | 0;
	    hi = (hi + Math.imul(ah4, bh4)) | 0;
	    lo = (lo + Math.imul(al3, bl5)) | 0;
	    mid = (mid + Math.imul(al3, bh5)) | 0;
	    mid = (mid + Math.imul(ah3, bl5)) | 0;
	    hi = (hi + Math.imul(ah3, bh5)) | 0;
	    lo = (lo + Math.imul(al2, bl6)) | 0;
	    mid = (mid + Math.imul(al2, bh6)) | 0;
	    mid = (mid + Math.imul(ah2, bl6)) | 0;
	    hi = (hi + Math.imul(ah2, bh6)) | 0;
	    lo = (lo + Math.imul(al1, bl7)) | 0;
	    mid = (mid + Math.imul(al1, bh7)) | 0;
	    mid = (mid + Math.imul(ah1, bl7)) | 0;
	    hi = (hi + Math.imul(ah1, bh7)) | 0;
	    lo = (lo + Math.imul(al0, bl8)) | 0;
	    mid = (mid + Math.imul(al0, bh8)) | 0;
	    mid = (mid + Math.imul(ah0, bl8)) | 0;
	    hi = (hi + Math.imul(ah0, bh8)) | 0;
	    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
	    w8 &= 0x3ffffff;
	    /* k = 9 */
	    lo = Math.imul(al9, bl0);
	    mid = Math.imul(al9, bh0);
	    mid = (mid + Math.imul(ah9, bl0)) | 0;
	    hi = Math.imul(ah9, bh0);
	    lo = (lo + Math.imul(al8, bl1)) | 0;
	    mid = (mid + Math.imul(al8, bh1)) | 0;
	    mid = (mid + Math.imul(ah8, bl1)) | 0;
	    hi = (hi + Math.imul(ah8, bh1)) | 0;
	    lo = (lo + Math.imul(al7, bl2)) | 0;
	    mid = (mid + Math.imul(al7, bh2)) | 0;
	    mid = (mid + Math.imul(ah7, bl2)) | 0;
	    hi = (hi + Math.imul(ah7, bh2)) | 0;
	    lo = (lo + Math.imul(al6, bl3)) | 0;
	    mid = (mid + Math.imul(al6, bh3)) | 0;
	    mid = (mid + Math.imul(ah6, bl3)) | 0;
	    hi = (hi + Math.imul(ah6, bh3)) | 0;
	    lo = (lo + Math.imul(al5, bl4)) | 0;
	    mid = (mid + Math.imul(al5, bh4)) | 0;
	    mid = (mid + Math.imul(ah5, bl4)) | 0;
	    hi = (hi + Math.imul(ah5, bh4)) | 0;
	    lo = (lo + Math.imul(al4, bl5)) | 0;
	    mid = (mid + Math.imul(al4, bh5)) | 0;
	    mid = (mid + Math.imul(ah4, bl5)) | 0;
	    hi = (hi + Math.imul(ah4, bh5)) | 0;
	    lo = (lo + Math.imul(al3, bl6)) | 0;
	    mid = (mid + Math.imul(al3, bh6)) | 0;
	    mid = (mid + Math.imul(ah3, bl6)) | 0;
	    hi = (hi + Math.imul(ah3, bh6)) | 0;
	    lo = (lo + Math.imul(al2, bl7)) | 0;
	    mid = (mid + Math.imul(al2, bh7)) | 0;
	    mid = (mid + Math.imul(ah2, bl7)) | 0;
	    hi = (hi + Math.imul(ah2, bh7)) | 0;
	    lo = (lo + Math.imul(al1, bl8)) | 0;
	    mid = (mid + Math.imul(al1, bh8)) | 0;
	    mid = (mid + Math.imul(ah1, bl8)) | 0;
	    hi = (hi + Math.imul(ah1, bh8)) | 0;
	    lo = (lo + Math.imul(al0, bl9)) | 0;
	    mid = (mid + Math.imul(al0, bh9)) | 0;
	    mid = (mid + Math.imul(ah0, bl9)) | 0;
	    hi = (hi + Math.imul(ah0, bh9)) | 0;
	    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
	    w9 &= 0x3ffffff;
	    /* k = 10 */
	    lo = Math.imul(al9, bl1);
	    mid = Math.imul(al9, bh1);
	    mid = (mid + Math.imul(ah9, bl1)) | 0;
	    hi = Math.imul(ah9, bh1);
	    lo = (lo + Math.imul(al8, bl2)) | 0;
	    mid = (mid + Math.imul(al8, bh2)) | 0;
	    mid = (mid + Math.imul(ah8, bl2)) | 0;
	    hi = (hi + Math.imul(ah8, bh2)) | 0;
	    lo = (lo + Math.imul(al7, bl3)) | 0;
	    mid = (mid + Math.imul(al7, bh3)) | 0;
	    mid = (mid + Math.imul(ah7, bl3)) | 0;
	    hi = (hi + Math.imul(ah7, bh3)) | 0;
	    lo = (lo + Math.imul(al6, bl4)) | 0;
	    mid = (mid + Math.imul(al6, bh4)) | 0;
	    mid = (mid + Math.imul(ah6, bl4)) | 0;
	    hi = (hi + Math.imul(ah6, bh4)) | 0;
	    lo = (lo + Math.imul(al5, bl5)) | 0;
	    mid = (mid + Math.imul(al5, bh5)) | 0;
	    mid = (mid + Math.imul(ah5, bl5)) | 0;
	    hi = (hi + Math.imul(ah5, bh5)) | 0;
	    lo = (lo + Math.imul(al4, bl6)) | 0;
	    mid = (mid + Math.imul(al4, bh6)) | 0;
	    mid = (mid + Math.imul(ah4, bl6)) | 0;
	    hi = (hi + Math.imul(ah4, bh6)) | 0;
	    lo = (lo + Math.imul(al3, bl7)) | 0;
	    mid = (mid + Math.imul(al3, bh7)) | 0;
	    mid = (mid + Math.imul(ah3, bl7)) | 0;
	    hi = (hi + Math.imul(ah3, bh7)) | 0;
	    lo = (lo + Math.imul(al2, bl8)) | 0;
	    mid = (mid + Math.imul(al2, bh8)) | 0;
	    mid = (mid + Math.imul(ah2, bl8)) | 0;
	    hi = (hi + Math.imul(ah2, bh8)) | 0;
	    lo = (lo + Math.imul(al1, bl9)) | 0;
	    mid = (mid + Math.imul(al1, bh9)) | 0;
	    mid = (mid + Math.imul(ah1, bl9)) | 0;
	    hi = (hi + Math.imul(ah1, bh9)) | 0;
	    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
	    w10 &= 0x3ffffff;
	    /* k = 11 */
	    lo = Math.imul(al9, bl2);
	    mid = Math.imul(al9, bh2);
	    mid = (mid + Math.imul(ah9, bl2)) | 0;
	    hi = Math.imul(ah9, bh2);
	    lo = (lo + Math.imul(al8, bl3)) | 0;
	    mid = (mid + Math.imul(al8, bh3)) | 0;
	    mid = (mid + Math.imul(ah8, bl3)) | 0;
	    hi = (hi + Math.imul(ah8, bh3)) | 0;
	    lo = (lo + Math.imul(al7, bl4)) | 0;
	    mid = (mid + Math.imul(al7, bh4)) | 0;
	    mid = (mid + Math.imul(ah7, bl4)) | 0;
	    hi = (hi + Math.imul(ah7, bh4)) | 0;
	    lo = (lo + Math.imul(al6, bl5)) | 0;
	    mid = (mid + Math.imul(al6, bh5)) | 0;
	    mid = (mid + Math.imul(ah6, bl5)) | 0;
	    hi = (hi + Math.imul(ah6, bh5)) | 0;
	    lo = (lo + Math.imul(al5, bl6)) | 0;
	    mid = (mid + Math.imul(al5, bh6)) | 0;
	    mid = (mid + Math.imul(ah5, bl6)) | 0;
	    hi = (hi + Math.imul(ah5, bh6)) | 0;
	    lo = (lo + Math.imul(al4, bl7)) | 0;
	    mid = (mid + Math.imul(al4, bh7)) | 0;
	    mid = (mid + Math.imul(ah4, bl7)) | 0;
	    hi = (hi + Math.imul(ah4, bh7)) | 0;
	    lo = (lo + Math.imul(al3, bl8)) | 0;
	    mid = (mid + Math.imul(al3, bh8)) | 0;
	    mid = (mid + Math.imul(ah3, bl8)) | 0;
	    hi = (hi + Math.imul(ah3, bh8)) | 0;
	    lo = (lo + Math.imul(al2, bl9)) | 0;
	    mid = (mid + Math.imul(al2, bh9)) | 0;
	    mid = (mid + Math.imul(ah2, bl9)) | 0;
	    hi = (hi + Math.imul(ah2, bh9)) | 0;
	    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
	    w11 &= 0x3ffffff;
	    /* k = 12 */
	    lo = Math.imul(al9, bl3);
	    mid = Math.imul(al9, bh3);
	    mid = (mid + Math.imul(ah9, bl3)) | 0;
	    hi = Math.imul(ah9, bh3);
	    lo = (lo + Math.imul(al8, bl4)) | 0;
	    mid = (mid + Math.imul(al8, bh4)) | 0;
	    mid = (mid + Math.imul(ah8, bl4)) | 0;
	    hi = (hi + Math.imul(ah8, bh4)) | 0;
	    lo = (lo + Math.imul(al7, bl5)) | 0;
	    mid = (mid + Math.imul(al7, bh5)) | 0;
	    mid = (mid + Math.imul(ah7, bl5)) | 0;
	    hi = (hi + Math.imul(ah7, bh5)) | 0;
	    lo = (lo + Math.imul(al6, bl6)) | 0;
	    mid = (mid + Math.imul(al6, bh6)) | 0;
	    mid = (mid + Math.imul(ah6, bl6)) | 0;
	    hi = (hi + Math.imul(ah6, bh6)) | 0;
	    lo = (lo + Math.imul(al5, bl7)) | 0;
	    mid = (mid + Math.imul(al5, bh7)) | 0;
	    mid = (mid + Math.imul(ah5, bl7)) | 0;
	    hi = (hi + Math.imul(ah5, bh7)) | 0;
	    lo = (lo + Math.imul(al4, bl8)) | 0;
	    mid = (mid + Math.imul(al4, bh8)) | 0;
	    mid = (mid + Math.imul(ah4, bl8)) | 0;
	    hi = (hi + Math.imul(ah4, bh8)) | 0;
	    lo = (lo + Math.imul(al3, bl9)) | 0;
	    mid = (mid + Math.imul(al3, bh9)) | 0;
	    mid = (mid + Math.imul(ah3, bl9)) | 0;
	    hi = (hi + Math.imul(ah3, bh9)) | 0;
	    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
	    w12 &= 0x3ffffff;
	    /* k = 13 */
	    lo = Math.imul(al9, bl4);
	    mid = Math.imul(al9, bh4);
	    mid = (mid + Math.imul(ah9, bl4)) | 0;
	    hi = Math.imul(ah9, bh4);
	    lo = (lo + Math.imul(al8, bl5)) | 0;
	    mid = (mid + Math.imul(al8, bh5)) | 0;
	    mid = (mid + Math.imul(ah8, bl5)) | 0;
	    hi = (hi + Math.imul(ah8, bh5)) | 0;
	    lo = (lo + Math.imul(al7, bl6)) | 0;
	    mid = (mid + Math.imul(al7, bh6)) | 0;
	    mid = (mid + Math.imul(ah7, bl6)) | 0;
	    hi = (hi + Math.imul(ah7, bh6)) | 0;
	    lo = (lo + Math.imul(al6, bl7)) | 0;
	    mid = (mid + Math.imul(al6, bh7)) | 0;
	    mid = (mid + Math.imul(ah6, bl7)) | 0;
	    hi = (hi + Math.imul(ah6, bh7)) | 0;
	    lo = (lo + Math.imul(al5, bl8)) | 0;
	    mid = (mid + Math.imul(al5, bh8)) | 0;
	    mid = (mid + Math.imul(ah5, bl8)) | 0;
	    hi = (hi + Math.imul(ah5, bh8)) | 0;
	    lo = (lo + Math.imul(al4, bl9)) | 0;
	    mid = (mid + Math.imul(al4, bh9)) | 0;
	    mid = (mid + Math.imul(ah4, bl9)) | 0;
	    hi = (hi + Math.imul(ah4, bh9)) | 0;
	    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
	    w13 &= 0x3ffffff;
	    /* k = 14 */
	    lo = Math.imul(al9, bl5);
	    mid = Math.imul(al9, bh5);
	    mid = (mid + Math.imul(ah9, bl5)) | 0;
	    hi = Math.imul(ah9, bh5);
	    lo = (lo + Math.imul(al8, bl6)) | 0;
	    mid = (mid + Math.imul(al8, bh6)) | 0;
	    mid = (mid + Math.imul(ah8, bl6)) | 0;
	    hi = (hi + Math.imul(ah8, bh6)) | 0;
	    lo = (lo + Math.imul(al7, bl7)) | 0;
	    mid = (mid + Math.imul(al7, bh7)) | 0;
	    mid = (mid + Math.imul(ah7, bl7)) | 0;
	    hi = (hi + Math.imul(ah7, bh7)) | 0;
	    lo = (lo + Math.imul(al6, bl8)) | 0;
	    mid = (mid + Math.imul(al6, bh8)) | 0;
	    mid = (mid + Math.imul(ah6, bl8)) | 0;
	    hi = (hi + Math.imul(ah6, bh8)) | 0;
	    lo = (lo + Math.imul(al5, bl9)) | 0;
	    mid = (mid + Math.imul(al5, bh9)) | 0;
	    mid = (mid + Math.imul(ah5, bl9)) | 0;
	    hi = (hi + Math.imul(ah5, bh9)) | 0;
	    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
	    w14 &= 0x3ffffff;
	    /* k = 15 */
	    lo = Math.imul(al9, bl6);
	    mid = Math.imul(al9, bh6);
	    mid = (mid + Math.imul(ah9, bl6)) | 0;
	    hi = Math.imul(ah9, bh6);
	    lo = (lo + Math.imul(al8, bl7)) | 0;
	    mid = (mid + Math.imul(al8, bh7)) | 0;
	    mid = (mid + Math.imul(ah8, bl7)) | 0;
	    hi = (hi + Math.imul(ah8, bh7)) | 0;
	    lo = (lo + Math.imul(al7, bl8)) | 0;
	    mid = (mid + Math.imul(al7, bh8)) | 0;
	    mid = (mid + Math.imul(ah7, bl8)) | 0;
	    hi = (hi + Math.imul(ah7, bh8)) | 0;
	    lo = (lo + Math.imul(al6, bl9)) | 0;
	    mid = (mid + Math.imul(al6, bh9)) | 0;
	    mid = (mid + Math.imul(ah6, bl9)) | 0;
	    hi = (hi + Math.imul(ah6, bh9)) | 0;
	    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
	    w15 &= 0x3ffffff;
	    /* k = 16 */
	    lo = Math.imul(al9, bl7);
	    mid = Math.imul(al9, bh7);
	    mid = (mid + Math.imul(ah9, bl7)) | 0;
	    hi = Math.imul(ah9, bh7);
	    lo = (lo + Math.imul(al8, bl8)) | 0;
	    mid = (mid + Math.imul(al8, bh8)) | 0;
	    mid = (mid + Math.imul(ah8, bl8)) | 0;
	    hi = (hi + Math.imul(ah8, bh8)) | 0;
	    lo = (lo + Math.imul(al7, bl9)) | 0;
	    mid = (mid + Math.imul(al7, bh9)) | 0;
	    mid = (mid + Math.imul(ah7, bl9)) | 0;
	    hi = (hi + Math.imul(ah7, bh9)) | 0;
	    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
	    w16 &= 0x3ffffff;
	    /* k = 17 */
	    lo = Math.imul(al9, bl8);
	    mid = Math.imul(al9, bh8);
	    mid = (mid + Math.imul(ah9, bl8)) | 0;
	    hi = Math.imul(ah9, bh8);
	    lo = (lo + Math.imul(al8, bl9)) | 0;
	    mid = (mid + Math.imul(al8, bh9)) | 0;
	    mid = (mid + Math.imul(ah8, bl9)) | 0;
	    hi = (hi + Math.imul(ah8, bh9)) | 0;
	    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
	    w17 &= 0x3ffffff;
	    /* k = 18 */
	    lo = Math.imul(al9, bl9);
	    mid = Math.imul(al9, bh9);
	    mid = (mid + Math.imul(ah9, bl9)) | 0;
	    hi = Math.imul(ah9, bh9);
	    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
	    w18 &= 0x3ffffff;
	    o[0] = w0;
	    o[1] = w1;
	    o[2] = w2;
	    o[3] = w3;
	    o[4] = w4;
	    o[5] = w5;
	    o[6] = w6;
	    o[7] = w7;
	    o[8] = w8;
	    o[9] = w9;
	    o[10] = w10;
	    o[11] = w11;
	    o[12] = w12;
	    o[13] = w13;
	    o[14] = w14;
	    o[15] = w15;
	    o[16] = w16;
	    o[17] = w17;
	    o[18] = w18;
	    if (c !== 0) {
	      o[19] = c;
	      out.length++;
	    }
	    return out;
	  };

	  // Polyfill comb
	  if (!Math.imul) {
	    comb10MulTo = smallMulTo;
	  }

	  function bigMulTo (self, num, out) {
	    out.negative = num.negative ^ self.negative;
	    out.length = self.length + num.length;

	    var carry = 0;
	    var hncarry = 0;
	    for (var k = 0; k < out.length - 1; k++) {
	      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
	      // note that ncarry could be >= 0x3ffffff
	      var ncarry = hncarry;
	      hncarry = 0;
	      var rword = carry & 0x3ffffff;
	      var maxJ = Math.min(k, num.length - 1);
	      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
	        var i = k - j;
	        var a = self.words[i] | 0;
	        var b = num.words[j] | 0;
	        var r = a * b;

	        var lo = r & 0x3ffffff;
	        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
	        lo = (lo + rword) | 0;
	        rword = lo & 0x3ffffff;
	        ncarry = (ncarry + (lo >>> 26)) | 0;

	        hncarry += ncarry >>> 26;
	        ncarry &= 0x3ffffff;
	      }
	      out.words[k] = rword;
	      carry = ncarry;
	      ncarry = hncarry;
	    }
	    if (carry !== 0) {
	      out.words[k] = carry;
	    } else {
	      out.length--;
	    }

	    return out._strip();
	  }

	  function jumboMulTo (self, num, out) {
	    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
	    // var fftm = new FFTM();
	    // return fftm.mulp(self, num, out);
	    return bigMulTo(self, num, out);
	  }

	  BN.prototype.mulTo = function mulTo (num, out) {
	    var res;
	    var len = this.length + num.length;
	    if (this.length === 10 && num.length === 10) {
	      res = comb10MulTo(this, num, out);
	    } else if (len < 63) {
	      res = smallMulTo(this, num, out);
	    } else if (len < 1024) {
	      res = bigMulTo(this, num, out);
	    } else {
	      res = jumboMulTo(this, num, out);
	    }

	    return res;
	  };

	  // Multiply `this` by `num`
	  BN.prototype.mul = function mul (num) {
	    var out = new BN(null);
	    out.words = new Array(this.length + num.length);
	    return this.mulTo(num, out);
	  };

	  // Multiply employing FFT
	  BN.prototype.mulf = function mulf (num) {
	    var out = new BN(null);
	    out.words = new Array(this.length + num.length);
	    return jumboMulTo(this, num, out);
	  };

	  // In-place Multiplication
	  BN.prototype.imul = function imul (num) {
	    return this.clone().mulTo(num, this);
	  };

	  BN.prototype.imuln = function imuln (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(typeof num === 'number');
	    assert(num < 0x4000000);

	    // Carry
	    var carry = 0;
	    for (var i = 0; i < this.length; i++) {
	      var w = (this.words[i] | 0) * num;
	      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
	      carry >>= 26;
	      carry += (w / 0x4000000) | 0;
	      // NOTE: lo is 27bit maximum
	      carry += lo >>> 26;
	      this.words[i] = lo & 0x3ffffff;
	    }

	    if (carry !== 0) {
	      this.words[i] = carry;
	      this.length++;
	    }

	    return isNegNum ? this.ineg() : this;
	  };

	  BN.prototype.muln = function muln (num) {
	    return this.clone().imuln(num);
	  };

	  // `this` * `this`
	  BN.prototype.sqr = function sqr () {
	    return this.mul(this);
	  };

	  // `this` * `this` in-place
	  BN.prototype.isqr = function isqr () {
	    return this.imul(this.clone());
	  };

	  // Math.pow(`this`, `num`)
	  BN.prototype.pow = function pow (num) {
	    var w = toBitArray(num);
	    if (w.length === 0) return new BN(1);

	    // Skip leading zeroes
	    var res = this;
	    for (var i = 0; i < w.length; i++, res = res.sqr()) {
	      if (w[i] !== 0) break;
	    }

	    if (++i < w.length) {
	      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
	        if (w[i] === 0) continue;

	        res = res.mul(q);
	      }
	    }

	    return res;
	  };

	  // Shift-left in-place
	  BN.prototype.iushln = function iushln (bits) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var r = bits % 26;
	    var s = (bits - r) / 26;
	    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
	    var i;

	    if (r !== 0) {
	      var carry = 0;

	      for (i = 0; i < this.length; i++) {
	        var newCarry = this.words[i] & carryMask;
	        var c = ((this.words[i] | 0) - newCarry) << r;
	        this.words[i] = c | carry;
	        carry = newCarry >>> (26 - r);
	      }

	      if (carry) {
	        this.words[i] = carry;
	        this.length++;
	      }
	    }

	    if (s !== 0) {
	      for (i = this.length - 1; i >= 0; i--) {
	        this.words[i + s] = this.words[i];
	      }

	      for (i = 0; i < s; i++) {
	        this.words[i] = 0;
	      }

	      this.length += s;
	    }

	    return this._strip();
	  };

	  BN.prototype.ishln = function ishln (bits) {
	    // TODO(indutny): implement me
	    assert(this.negative === 0);
	    return this.iushln(bits);
	  };

	  // Shift-right in-place
	  // NOTE: `hint` is a lowest bit before trailing zeroes
	  // NOTE: if `extended` is present - it will be filled with destroyed bits
	  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var h;
	    if (hint) {
	      h = (hint - (hint % 26)) / 26;
	    } else {
	      h = 0;
	    }

	    var r = bits % 26;
	    var s = Math.min((bits - r) / 26, this.length);
	    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
	    var maskedWords = extended;

	    h -= s;
	    h = Math.max(0, h);

	    // Extended mode, copy masked part
	    if (maskedWords) {
	      for (var i = 0; i < s; i++) {
	        maskedWords.words[i] = this.words[i];
	      }
	      maskedWords.length = s;
	    }

	    if (s === 0) ; else if (this.length > s) {
	      this.length -= s;
	      for (i = 0; i < this.length; i++) {
	        this.words[i] = this.words[i + s];
	      }
	    } else {
	      this.words[0] = 0;
	      this.length = 1;
	    }

	    var carry = 0;
	    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
	      var word = this.words[i] | 0;
	      this.words[i] = (carry << (26 - r)) | (word >>> r);
	      carry = word & mask;
	    }

	    // Push carried bits as a mask
	    if (maskedWords && carry !== 0) {
	      maskedWords.words[maskedWords.length++] = carry;
	    }

	    if (this.length === 0) {
	      this.words[0] = 0;
	      this.length = 1;
	    }

	    return this._strip();
	  };

	  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
	    // TODO(indutny): implement me
	    assert(this.negative === 0);
	    return this.iushrn(bits, hint, extended);
	  };

	  // Shift-left
	  BN.prototype.shln = function shln (bits) {
	    return this.clone().ishln(bits);
	  };

	  BN.prototype.ushln = function ushln (bits) {
	    return this.clone().iushln(bits);
	  };

	  // Shift-right
	  BN.prototype.shrn = function shrn (bits) {
	    return this.clone().ishrn(bits);
	  };

	  BN.prototype.ushrn = function ushrn (bits) {
	    return this.clone().iushrn(bits);
	  };

	  // Test if n bit is set
	  BN.prototype.testn = function testn (bit) {
	    assert(typeof bit === 'number' && bit >= 0);
	    var r = bit % 26;
	    var s = (bit - r) / 26;
	    var q = 1 << r;

	    // Fast case: bit is much higher than all existing words
	    if (this.length <= s) return false;

	    // Check bit and return
	    var w = this.words[s];

	    return !!(w & q);
	  };

	  // Return only lowers bits of number (in-place)
	  BN.prototype.imaskn = function imaskn (bits) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var r = bits % 26;
	    var s = (bits - r) / 26;

	    assert(this.negative === 0, 'imaskn works only with positive numbers');

	    if (this.length <= s) {
	      return this;
	    }

	    if (r !== 0) {
	      s++;
	    }
	    this.length = Math.min(s, this.length);

	    if (r !== 0) {
	      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
	      this.words[this.length - 1] &= mask;
	    }

	    return this._strip();
	  };

	  // Return only lowers bits of number
	  BN.prototype.maskn = function maskn (bits) {
	    return this.clone().imaskn(bits);
	  };

	  // Add plain number `num` to `this`
	  BN.prototype.iaddn = function iaddn (num) {
	    assert(typeof num === 'number');
	    assert(num < 0x4000000);
	    if (num < 0) return this.isubn(-num);

	    // Possible sign change
	    if (this.negative !== 0) {
	      if (this.length === 1 && (this.words[0] | 0) <= num) {
	        this.words[0] = num - (this.words[0] | 0);
	        this.negative = 0;
	        return this;
	      }

	      this.negative = 0;
	      this.isubn(num);
	      this.negative = 1;
	      return this;
	    }

	    // Add without checks
	    return this._iaddn(num);
	  };

	  BN.prototype._iaddn = function _iaddn (num) {
	    this.words[0] += num;

	    // Carry
	    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
	      this.words[i] -= 0x4000000;
	      if (i === this.length - 1) {
	        this.words[i + 1] = 1;
	      } else {
	        this.words[i + 1]++;
	      }
	    }
	    this.length = Math.max(this.length, i + 1);

	    return this;
	  };

	  // Subtract plain number `num` from `this`
	  BN.prototype.isubn = function isubn (num) {
	    assert(typeof num === 'number');
	    assert(num < 0x4000000);
	    if (num < 0) return this.iaddn(-num);

	    if (this.negative !== 0) {
	      this.negative = 0;
	      this.iaddn(num);
	      this.negative = 1;
	      return this;
	    }

	    this.words[0] -= num;

	    if (this.length === 1 && this.words[0] < 0) {
	      this.words[0] = -this.words[0];
	      this.negative = 1;
	    } else {
	      // Carry
	      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
	        this.words[i] += 0x4000000;
	        this.words[i + 1] -= 1;
	      }
	    }

	    return this._strip();
	  };

	  BN.prototype.addn = function addn (num) {
	    return this.clone().iaddn(num);
	  };

	  BN.prototype.subn = function subn (num) {
	    return this.clone().isubn(num);
	  };

	  BN.prototype.iabs = function iabs () {
	    this.negative = 0;

	    return this;
	  };

	  BN.prototype.abs = function abs () {
	    return this.clone().iabs();
	  };

	  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
	    var len = num.length + shift;
	    var i;

	    this._expand(len);

	    var w;
	    var carry = 0;
	    for (i = 0; i < num.length; i++) {
	      w = (this.words[i + shift] | 0) + carry;
	      var right = (num.words[i] | 0) * mul;
	      w -= right & 0x3ffffff;
	      carry = (w >> 26) - ((right / 0x4000000) | 0);
	      this.words[i + shift] = w & 0x3ffffff;
	    }
	    for (; i < this.length - shift; i++) {
	      w = (this.words[i + shift] | 0) + carry;
	      carry = w >> 26;
	      this.words[i + shift] = w & 0x3ffffff;
	    }

	    if (carry === 0) return this._strip();

	    // Subtraction overflow
	    assert(carry === -1);
	    carry = 0;
	    for (i = 0; i < this.length; i++) {
	      w = -(this.words[i] | 0) + carry;
	      carry = w >> 26;
	      this.words[i] = w & 0x3ffffff;
	    }
	    this.negative = 1;

	    return this._strip();
	  };

	  BN.prototype._wordDiv = function _wordDiv (num, mode) {
	    var shift = this.length - num.length;

	    var a = this.clone();
	    var b = num;

	    // Normalize
	    var bhi = b.words[b.length - 1] | 0;
	    var bhiBits = this._countBits(bhi);
	    shift = 26 - bhiBits;
	    if (shift !== 0) {
	      b = b.ushln(shift);
	      a.iushln(shift);
	      bhi = b.words[b.length - 1] | 0;
	    }

	    // Initialize quotient
	    var m = a.length - b.length;
	    var q;

	    if (mode !== 'mod') {
	      q = new BN(null);
	      q.length = m + 1;
	      q.words = new Array(q.length);
	      for (var i = 0; i < q.length; i++) {
	        q.words[i] = 0;
	      }
	    }

	    var diff = a.clone()._ishlnsubmul(b, 1, m);
	    if (diff.negative === 0) {
	      a = diff;
	      if (q) {
	        q.words[m] = 1;
	      }
	    }

	    for (var j = m - 1; j >= 0; j--) {
	      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
	        (a.words[b.length + j - 1] | 0);

	      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
	      // (0x7ffffff)
	      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

	      a._ishlnsubmul(b, qj, j);
	      while (a.negative !== 0) {
	        qj--;
	        a.negative = 0;
	        a._ishlnsubmul(b, 1, j);
	        if (!a.isZero()) {
	          a.negative ^= 1;
	        }
	      }
	      if (q) {
	        q.words[j] = qj;
	      }
	    }
	    if (q) {
	      q._strip();
	    }
	    a._strip();

	    // Denormalize
	    if (mode !== 'div' && shift !== 0) {
	      a.iushrn(shift);
	    }

	    return {
	      div: q || null,
	      mod: a
	    };
	  };

	  // NOTE: 1) `mode` can be set to `mod` to request mod only,
	  //       to `div` to request div only, or be absent to
	  //       request both div & mod
	  //       2) `positive` is true if unsigned mod is requested
	  BN.prototype.divmod = function divmod (num, mode, positive) {
	    assert(!num.isZero());

	    if (this.isZero()) {
	      return {
	        div: new BN(0),
	        mod: new BN(0)
	      };
	    }

	    var div, mod, res;
	    if (this.negative !== 0 && num.negative === 0) {
	      res = this.neg().divmod(num, mode);

	      if (mode !== 'mod') {
	        div = res.div.neg();
	      }

	      if (mode !== 'div') {
	        mod = res.mod.neg();
	        if (positive && mod.negative !== 0) {
	          mod.iadd(num);
	        }
	      }

	      return {
	        div: div,
	        mod: mod
	      };
	    }

	    if (this.negative === 0 && num.negative !== 0) {
	      res = this.divmod(num.neg(), mode);

	      if (mode !== 'mod') {
	        div = res.div.neg();
	      }

	      return {
	        div: div,
	        mod: res.mod
	      };
	    }

	    if ((this.negative & num.negative) !== 0) {
	      res = this.neg().divmod(num.neg(), mode);

	      if (mode !== 'div') {
	        mod = res.mod.neg();
	        if (positive && mod.negative !== 0) {
	          mod.isub(num);
	        }
	      }

	      return {
	        div: res.div,
	        mod: mod
	      };
	    }

	    // Both numbers are positive at this point

	    // Strip both numbers to approximate shift value
	    if (num.length > this.length || this.cmp(num) < 0) {
	      return {
	        div: new BN(0),
	        mod: this
	      };
	    }

	    // Very short reduction
	    if (num.length === 1) {
	      if (mode === 'div') {
	        return {
	          div: this.divn(num.words[0]),
	          mod: null
	        };
	      }

	      if (mode === 'mod') {
	        return {
	          div: null,
	          mod: new BN(this.modrn(num.words[0]))
	        };
	      }

	      return {
	        div: this.divn(num.words[0]),
	        mod: new BN(this.modrn(num.words[0]))
	      };
	    }

	    return this._wordDiv(num, mode);
	  };

	  // Find `this` / `num`
	  BN.prototype.div = function div (num) {
	    return this.divmod(num, 'div', false).div;
	  };

	  // Find `this` % `num`
	  BN.prototype.mod = function mod (num) {
	    return this.divmod(num, 'mod', false).mod;
	  };

	  BN.prototype.umod = function umod (num) {
	    return this.divmod(num, 'mod', true).mod;
	  };

	  // Find Round(`this` / `num`)
	  BN.prototype.divRound = function divRound (num) {
	    var dm = this.divmod(num);

	    // Fast case - exact division
	    if (dm.mod.isZero()) return dm.div;

	    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

	    var half = num.ushrn(1);
	    var r2 = num.andln(1);
	    var cmp = mod.cmp(half);

	    // Round down
	    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

	    // Round up
	    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
	  };

	  BN.prototype.modrn = function modrn (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(num <= 0x3ffffff);
	    var p = (1 << 26) % num;

	    var acc = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      acc = (p * acc + (this.words[i] | 0)) % num;
	    }

	    return isNegNum ? -acc : acc;
	  };

	  // WARNING: DEPRECATED
	  BN.prototype.modn = function modn (num) {
	    return this.modrn(num);
	  };

	  // In-place division by number
	  BN.prototype.idivn = function idivn (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(num <= 0x3ffffff);

	    var carry = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      var w = (this.words[i] | 0) + carry * 0x4000000;
	      this.words[i] = (w / num) | 0;
	      carry = w % num;
	    }

	    this._strip();
	    return isNegNum ? this.ineg() : this;
	  };

	  BN.prototype.divn = function divn (num) {
	    return this.clone().idivn(num);
	  };

	  BN.prototype.egcd = function egcd (p) {
	    assert(p.negative === 0);
	    assert(!p.isZero());

	    var x = this;
	    var y = p.clone();

	    if (x.negative !== 0) {
	      x = x.umod(p);
	    } else {
	      x = x.clone();
	    }

	    // A * x + B * y = x
	    var A = new BN(1);
	    var B = new BN(0);

	    // C * x + D * y = y
	    var C = new BN(0);
	    var D = new BN(1);

	    var g = 0;

	    while (x.isEven() && y.isEven()) {
	      x.iushrn(1);
	      y.iushrn(1);
	      ++g;
	    }

	    var yp = y.clone();
	    var xp = x.clone();

	    while (!x.isZero()) {
	      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
	      if (i > 0) {
	        x.iushrn(i);
	        while (i-- > 0) {
	          if (A.isOdd() || B.isOdd()) {
	            A.iadd(yp);
	            B.isub(xp);
	          }

	          A.iushrn(1);
	          B.iushrn(1);
	        }
	      }

	      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
	      if (j > 0) {
	        y.iushrn(j);
	        while (j-- > 0) {
	          if (C.isOdd() || D.isOdd()) {
	            C.iadd(yp);
	            D.isub(xp);
	          }

	          C.iushrn(1);
	          D.iushrn(1);
	        }
	      }

	      if (x.cmp(y) >= 0) {
	        x.isub(y);
	        A.isub(C);
	        B.isub(D);
	      } else {
	        y.isub(x);
	        C.isub(A);
	        D.isub(B);
	      }
	    }

	    return {
	      a: C,
	      b: D,
	      gcd: y.iushln(g)
	    };
	  };

	  // This is reduced incarnation of the binary EEA
	  // above, designated to invert members of the
	  // _prime_ fields F(p) at a maximal speed
	  BN.prototype._invmp = function _invmp (p) {
	    assert(p.negative === 0);
	    assert(!p.isZero());

	    var a = this;
	    var b = p.clone();

	    if (a.negative !== 0) {
	      a = a.umod(p);
	    } else {
	      a = a.clone();
	    }

	    var x1 = new BN(1);
	    var x2 = new BN(0);

	    var delta = b.clone();

	    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
	      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
	      if (i > 0) {
	        a.iushrn(i);
	        while (i-- > 0) {
	          if (x1.isOdd()) {
	            x1.iadd(delta);
	          }

	          x1.iushrn(1);
	        }
	      }

	      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
	      if (j > 0) {
	        b.iushrn(j);
	        while (j-- > 0) {
	          if (x2.isOdd()) {
	            x2.iadd(delta);
	          }

	          x2.iushrn(1);
	        }
	      }

	      if (a.cmp(b) >= 0) {
	        a.isub(b);
	        x1.isub(x2);
	      } else {
	        b.isub(a);
	        x2.isub(x1);
	      }
	    }

	    var res;
	    if (a.cmpn(1) === 0) {
	      res = x1;
	    } else {
	      res = x2;
	    }

	    if (res.cmpn(0) < 0) {
	      res.iadd(p);
	    }

	    return res;
	  };

	  BN.prototype.gcd = function gcd (num) {
	    if (this.isZero()) return num.abs();
	    if (num.isZero()) return this.abs();

	    var a = this.clone();
	    var b = num.clone();
	    a.negative = 0;
	    b.negative = 0;

	    // Remove common factor of two
	    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
	      a.iushrn(1);
	      b.iushrn(1);
	    }

	    do {
	      while (a.isEven()) {
	        a.iushrn(1);
	      }
	      while (b.isEven()) {
	        b.iushrn(1);
	      }

	      var r = a.cmp(b);
	      if (r < 0) {
	        // Swap `a` and `b` to make `a` always bigger than `b`
	        var t = a;
	        a = b;
	        b = t;
	      } else if (r === 0 || b.cmpn(1) === 0) {
	        break;
	      }

	      a.isub(b);
	    } while (true);

	    return b.iushln(shift);
	  };

	  // Invert number in the field F(num)
	  BN.prototype.invm = function invm (num) {
	    return this.egcd(num).a.umod(num);
	  };

	  BN.prototype.isEven = function isEven () {
	    return (this.words[0] & 1) === 0;
	  };

	  BN.prototype.isOdd = function isOdd () {
	    return (this.words[0] & 1) === 1;
	  };

	  // And first word and num
	  BN.prototype.andln = function andln (num) {
	    return this.words[0] & num;
	  };

	  // Increment at the bit position in-line
	  BN.prototype.bincn = function bincn (bit) {
	    assert(typeof bit === 'number');
	    var r = bit % 26;
	    var s = (bit - r) / 26;
	    var q = 1 << r;

	    // Fast case: bit is much higher than all existing words
	    if (this.length <= s) {
	      this._expand(s + 1);
	      this.words[s] |= q;
	      return this;
	    }

	    // Add bit and propagate, if needed
	    var carry = q;
	    for (var i = s; carry !== 0 && i < this.length; i++) {
	      var w = this.words[i] | 0;
	      w += carry;
	      carry = w >>> 26;
	      w &= 0x3ffffff;
	      this.words[i] = w;
	    }
	    if (carry !== 0) {
	      this.words[i] = carry;
	      this.length++;
	    }
	    return this;
	  };

	  BN.prototype.isZero = function isZero () {
	    return this.length === 1 && this.words[0] === 0;
	  };

	  BN.prototype.cmpn = function cmpn (num) {
	    var negative = num < 0;

	    if (this.negative !== 0 && !negative) return -1;
	    if (this.negative === 0 && negative) return 1;

	    this._strip();

	    var res;
	    if (this.length > 1) {
	      res = 1;
	    } else {
	      if (negative) {
	        num = -num;
	      }

	      assert(num <= 0x3ffffff, 'Number is too big');

	      var w = this.words[0] | 0;
	      res = w === num ? 0 : w < num ? -1 : 1;
	    }
	    if (this.negative !== 0) return -res | 0;
	    return res;
	  };

	  // Compare two numbers and return:
	  // 1 - if `this` > `num`
	  // 0 - if `this` == `num`
	  // -1 - if `this` < `num`
	  BN.prototype.cmp = function cmp (num) {
	    if (this.negative !== 0 && num.negative === 0) return -1;
	    if (this.negative === 0 && num.negative !== 0) return 1;

	    var res = this.ucmp(num);
	    if (this.negative !== 0) return -res | 0;
	    return res;
	  };

	  // Unsigned comparison
	  BN.prototype.ucmp = function ucmp (num) {
	    // At this point both numbers have the same sign
	    if (this.length > num.length) return 1;
	    if (this.length < num.length) return -1;

	    var res = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      var a = this.words[i] | 0;
	      var b = num.words[i] | 0;

	      if (a === b) continue;
	      if (a < b) {
	        res = -1;
	      } else if (a > b) {
	        res = 1;
	      }
	      break;
	    }
	    return res;
	  };

	  BN.prototype.gtn = function gtn (num) {
	    return this.cmpn(num) === 1;
	  };

	  BN.prototype.gt = function gt (num) {
	    return this.cmp(num) === 1;
	  };

	  BN.prototype.gten = function gten (num) {
	    return this.cmpn(num) >= 0;
	  };

	  BN.prototype.gte = function gte (num) {
	    return this.cmp(num) >= 0;
	  };

	  BN.prototype.ltn = function ltn (num) {
	    return this.cmpn(num) === -1;
	  };

	  BN.prototype.lt = function lt (num) {
	    return this.cmp(num) === -1;
	  };

	  BN.prototype.lten = function lten (num) {
	    return this.cmpn(num) <= 0;
	  };

	  BN.prototype.lte = function lte (num) {
	    return this.cmp(num) <= 0;
	  };

	  BN.prototype.eqn = function eqn (num) {
	    return this.cmpn(num) === 0;
	  };

	  BN.prototype.eq = function eq (num) {
	    return this.cmp(num) === 0;
	  };

	  //
	  // A reduce context, could be using montgomery or something better, depending
	  // on the `m` itself.
	  //
	  BN.red = function red (num) {
	    return new Red(num);
	  };

	  BN.prototype.toRed = function toRed (ctx) {
	    assert(!this.red, 'Already a number in reduction context');
	    assert(this.negative === 0, 'red works only with positives');
	    return ctx.convertTo(this)._forceRed(ctx);
	  };

	  BN.prototype.fromRed = function fromRed () {
	    assert(this.red, 'fromRed works only with numbers in reduction context');
	    return this.red.convertFrom(this);
	  };

	  BN.prototype._forceRed = function _forceRed (ctx) {
	    this.red = ctx;
	    return this;
	  };

	  BN.prototype.forceRed = function forceRed (ctx) {
	    assert(!this.red, 'Already a number in reduction context');
	    return this._forceRed(ctx);
	  };

	  BN.prototype.redAdd = function redAdd (num) {
	    assert(this.red, 'redAdd works only with red numbers');
	    return this.red.add(this, num);
	  };

	  BN.prototype.redIAdd = function redIAdd (num) {
	    assert(this.red, 'redIAdd works only with red numbers');
	    return this.red.iadd(this, num);
	  };

	  BN.prototype.redSub = function redSub (num) {
	    assert(this.red, 'redSub works only with red numbers');
	    return this.red.sub(this, num);
	  };

	  BN.prototype.redISub = function redISub (num) {
	    assert(this.red, 'redISub works only with red numbers');
	    return this.red.isub(this, num);
	  };

	  BN.prototype.redShl = function redShl (num) {
	    assert(this.red, 'redShl works only with red numbers');
	    return this.red.shl(this, num);
	  };

	  BN.prototype.redMul = function redMul (num) {
	    assert(this.red, 'redMul works only with red numbers');
	    this.red._verify2(this, num);
	    return this.red.mul(this, num);
	  };

	  BN.prototype.redIMul = function redIMul (num) {
	    assert(this.red, 'redMul works only with red numbers');
	    this.red._verify2(this, num);
	    return this.red.imul(this, num);
	  };

	  BN.prototype.redSqr = function redSqr () {
	    assert(this.red, 'redSqr works only with red numbers');
	    this.red._verify1(this);
	    return this.red.sqr(this);
	  };

	  BN.prototype.redISqr = function redISqr () {
	    assert(this.red, 'redISqr works only with red numbers');
	    this.red._verify1(this);
	    return this.red.isqr(this);
	  };

	  // Square root over p
	  BN.prototype.redSqrt = function redSqrt () {
	    assert(this.red, 'redSqrt works only with red numbers');
	    this.red._verify1(this);
	    return this.red.sqrt(this);
	  };

	  BN.prototype.redInvm = function redInvm () {
	    assert(this.red, 'redInvm works only with red numbers');
	    this.red._verify1(this);
	    return this.red.invm(this);
	  };

	  // Return negative clone of `this` % `red modulo`
	  BN.prototype.redNeg = function redNeg () {
	    assert(this.red, 'redNeg works only with red numbers');
	    this.red._verify1(this);
	    return this.red.neg(this);
	  };

	  BN.prototype.redPow = function redPow (num) {
	    assert(this.red && !num.red, 'redPow(normalNum)');
	    this.red._verify1(this);
	    return this.red.pow(this, num);
	  };

	  // Prime numbers with efficient reduction
	  var primes = {
	    k256: null,
	    p224: null,
	    p192: null,
	    p25519: null
	  };

	  // Pseudo-Mersenne prime
	  function MPrime (name, p) {
	    // P = 2 ^ N - K
	    this.name = name;
	    this.p = new BN(p, 16);
	    this.n = this.p.bitLength();
	    this.k = new BN(1).iushln(this.n).isub(this.p);

	    this.tmp = this._tmp();
	  }

	  MPrime.prototype._tmp = function _tmp () {
	    var tmp = new BN(null);
	    tmp.words = new Array(Math.ceil(this.n / 13));
	    return tmp;
	  };

	  MPrime.prototype.ireduce = function ireduce (num) {
	    // Assumes that `num` is less than `P^2`
	    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
	    var r = num;
	    var rlen;

	    do {
	      this.split(r, this.tmp);
	      r = this.imulK(r);
	      r = r.iadd(this.tmp);
	      rlen = r.bitLength();
	    } while (rlen > this.n);

	    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
	    if (cmp === 0) {
	      r.words[0] = 0;
	      r.length = 1;
	    } else if (cmp > 0) {
	      r.isub(this.p);
	    } else {
	      if (r.strip !== undefined) {
	        // r is a BN v4 instance
	        r.strip();
	      } else {
	        // r is a BN v5 instance
	        r._strip();
	      }
	    }

	    return r;
	  };

	  MPrime.prototype.split = function split (input, out) {
	    input.iushrn(this.n, 0, out);
	  };

	  MPrime.prototype.imulK = function imulK (num) {
	    return num.imul(this.k);
	  };

	  function K256 () {
	    MPrime.call(
	      this,
	      'k256',
	      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
	  }
	  inherits(K256, MPrime);

	  K256.prototype.split = function split (input, output) {
	    // 256 = 9 * 26 + 22
	    var mask = 0x3fffff;

	    var outLen = Math.min(input.length, 9);
	    for (var i = 0; i < outLen; i++) {
	      output.words[i] = input.words[i];
	    }
	    output.length = outLen;

	    if (input.length <= 9) {
	      input.words[0] = 0;
	      input.length = 1;
	      return;
	    }

	    // Shift by 9 limbs
	    var prev = input.words[9];
	    output.words[output.length++] = prev & mask;

	    for (i = 10; i < input.length; i++) {
	      var next = input.words[i] | 0;
	      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
	      prev = next;
	    }
	    prev >>>= 22;
	    input.words[i - 10] = prev;
	    if (prev === 0 && input.length > 10) {
	      input.length -= 10;
	    } else {
	      input.length -= 9;
	    }
	  };

	  K256.prototype.imulK = function imulK (num) {
	    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
	    num.words[num.length] = 0;
	    num.words[num.length + 1] = 0;
	    num.length += 2;

	    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
	    var lo = 0;
	    for (var i = 0; i < num.length; i++) {
	      var w = num.words[i] | 0;
	      lo += w * 0x3d1;
	      num.words[i] = lo & 0x3ffffff;
	      lo = w * 0x40 + ((lo / 0x4000000) | 0);
	    }

	    // Fast length reduction
	    if (num.words[num.length - 1] === 0) {
	      num.length--;
	      if (num.words[num.length - 1] === 0) {
	        num.length--;
	      }
	    }
	    return num;
	  };

	  function P224 () {
	    MPrime.call(
	      this,
	      'p224',
	      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
	  }
	  inherits(P224, MPrime);

	  function P192 () {
	    MPrime.call(
	      this,
	      'p192',
	      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
	  }
	  inherits(P192, MPrime);

	  function P25519 () {
	    // 2 ^ 255 - 19
	    MPrime.call(
	      this,
	      '25519',
	      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
	  }
	  inherits(P25519, MPrime);

	  P25519.prototype.imulK = function imulK (num) {
	    // K = 0x13
	    var carry = 0;
	    for (var i = 0; i < num.length; i++) {
	      var hi = (num.words[i] | 0) * 0x13 + carry;
	      var lo = hi & 0x3ffffff;
	      hi >>>= 26;

	      num.words[i] = lo;
	      carry = hi;
	    }
	    if (carry !== 0) {
	      num.words[num.length++] = carry;
	    }
	    return num;
	  };

	  // Exported mostly for testing purposes, use plain name instead
	  BN._prime = function prime (name) {
	    // Cached version of prime
	    if (primes[name]) return primes[name];

	    var prime;
	    if (name === 'k256') {
	      prime = new K256();
	    } else if (name === 'p224') {
	      prime = new P224();
	    } else if (name === 'p192') {
	      prime = new P192();
	    } else if (name === 'p25519') {
	      prime = new P25519();
	    } else {
	      throw new Error('Unknown prime ' + name);
	    }
	    primes[name] = prime;

	    return prime;
	  };

	  //
	  // Base reduction engine
	  //
	  function Red (m) {
	    if (typeof m === 'string') {
	      var prime = BN._prime(m);
	      this.m = prime.p;
	      this.prime = prime;
	    } else {
	      assert(m.gtn(1), 'modulus must be greater than 1');
	      this.m = m;
	      this.prime = null;
	    }
	  }

	  Red.prototype._verify1 = function _verify1 (a) {
	    assert(a.negative === 0, 'red works only with positives');
	    assert(a.red, 'red works only with red numbers');
	  };

	  Red.prototype._verify2 = function _verify2 (a, b) {
	    assert((a.negative | b.negative) === 0, 'red works only with positives');
	    assert(a.red && a.red === b.red,
	      'red works only with red numbers');
	  };

	  Red.prototype.imod = function imod (a) {
	    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

	    move(a, a.umod(this.m)._forceRed(this));
	    return a;
	  };

	  Red.prototype.neg = function neg (a) {
	    if (a.isZero()) {
	      return a.clone();
	    }

	    return this.m.sub(a)._forceRed(this);
	  };

	  Red.prototype.add = function add (a, b) {
	    this._verify2(a, b);

	    var res = a.add(b);
	    if (res.cmp(this.m) >= 0) {
	      res.isub(this.m);
	    }
	    return res._forceRed(this);
	  };

	  Red.prototype.iadd = function iadd (a, b) {
	    this._verify2(a, b);

	    var res = a.iadd(b);
	    if (res.cmp(this.m) >= 0) {
	      res.isub(this.m);
	    }
	    return res;
	  };

	  Red.prototype.sub = function sub (a, b) {
	    this._verify2(a, b);

	    var res = a.sub(b);
	    if (res.cmpn(0) < 0) {
	      res.iadd(this.m);
	    }
	    return res._forceRed(this);
	  };

	  Red.prototype.isub = function isub (a, b) {
	    this._verify2(a, b);

	    var res = a.isub(b);
	    if (res.cmpn(0) < 0) {
	      res.iadd(this.m);
	    }
	    return res;
	  };

	  Red.prototype.shl = function shl (a, num) {
	    this._verify1(a);
	    return this.imod(a.ushln(num));
	  };

	  Red.prototype.imul = function imul (a, b) {
	    this._verify2(a, b);
	    return this.imod(a.imul(b));
	  };

	  Red.prototype.mul = function mul (a, b) {
	    this._verify2(a, b);
	    return this.imod(a.mul(b));
	  };

	  Red.prototype.isqr = function isqr (a) {
	    return this.imul(a, a.clone());
	  };

	  Red.prototype.sqr = function sqr (a) {
	    return this.mul(a, a);
	  };

	  Red.prototype.sqrt = function sqrt (a) {
	    if (a.isZero()) return a.clone();

	    var mod3 = this.m.andln(3);
	    assert(mod3 % 2 === 1);

	    // Fast case
	    if (mod3 === 3) {
	      var pow = this.m.add(new BN(1)).iushrn(2);
	      return this.pow(a, pow);
	    }

	    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
	    //
	    // Find Q and S, that Q * 2 ^ S = (P - 1)
	    var q = this.m.subn(1);
	    var s = 0;
	    while (!q.isZero() && q.andln(1) === 0) {
	      s++;
	      q.iushrn(1);
	    }
	    assert(!q.isZero());

	    var one = new BN(1).toRed(this);
	    var nOne = one.redNeg();

	    // Find quadratic non-residue
	    // NOTE: Max is such because of generalized Riemann hypothesis.
	    var lpow = this.m.subn(1).iushrn(1);
	    var z = this.m.bitLength();
	    z = new BN(2 * z * z).toRed(this);

	    while (this.pow(z, lpow).cmp(nOne) !== 0) {
	      z.redIAdd(nOne);
	    }

	    var c = this.pow(z, q);
	    var r = this.pow(a, q.addn(1).iushrn(1));
	    var t = this.pow(a, q);
	    var m = s;
	    while (t.cmp(one) !== 0) {
	      var tmp = t;
	      for (var i = 0; tmp.cmp(one) !== 0; i++) {
	        tmp = tmp.redSqr();
	      }
	      assert(i < m);
	      var b = this.pow(c, new BN(1).iushln(m - i - 1));

	      r = r.redMul(b);
	      c = b.redSqr();
	      t = t.redMul(c);
	      m = i;
	    }

	    return r;
	  };

	  Red.prototype.invm = function invm (a) {
	    var inv = a._invmp(this.m);
	    if (inv.negative !== 0) {
	      inv.negative = 0;
	      return this.imod(inv).redNeg();
	    } else {
	      return this.imod(inv);
	    }
	  };

	  Red.prototype.pow = function pow (a, num) {
	    if (num.isZero()) return new BN(1).toRed(this);
	    if (num.cmpn(1) === 0) return a.clone();

	    var windowSize = 4;
	    var wnd = new Array(1 << windowSize);
	    wnd[0] = new BN(1).toRed(this);
	    wnd[1] = a;
	    for (var i = 2; i < wnd.length; i++) {
	      wnd[i] = this.mul(wnd[i - 1], a);
	    }

	    var res = wnd[0];
	    var current = 0;
	    var currentLen = 0;
	    var start = num.bitLength() % 26;
	    if (start === 0) {
	      start = 26;
	    }

	    for (i = num.length - 1; i >= 0; i--) {
	      var word = num.words[i];
	      for (var j = start - 1; j >= 0; j--) {
	        var bit = (word >> j) & 1;
	        if (res !== wnd[0]) {
	          res = this.sqr(res);
	        }

	        if (bit === 0 && current === 0) {
	          currentLen = 0;
	          continue;
	        }

	        current <<= 1;
	        current |= bit;
	        currentLen++;
	        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

	        res = this.mul(res, wnd[current]);
	        currentLen = 0;
	        current = 0;
	      }
	      start = 26;
	    }

	    return res;
	  };

	  Red.prototype.convertTo = function convertTo (num) {
	    var r = num.umod(this.m);

	    return r === num ? r.clone() : r;
	  };

	  Red.prototype.convertFrom = function convertFrom (num) {
	    var res = num.clone();
	    res.red = null;
	    return res;
	  };

	  //
	  // Montgomery method engine
	  //

	  BN.mont = function mont (num) {
	    return new Mont(num);
	  };

	  function Mont (m) {
	    Red.call(this, m);

	    this.shift = this.m.bitLength();
	    if (this.shift % 26 !== 0) {
	      this.shift += 26 - (this.shift % 26);
	    }

	    this.r = new BN(1).iushln(this.shift);
	    this.r2 = this.imod(this.r.sqr());
	    this.rinv = this.r._invmp(this.m);

	    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
	    this.minv = this.minv.umod(this.r);
	    this.minv = this.r.sub(this.minv);
	  }
	  inherits(Mont, Red);

	  Mont.prototype.convertTo = function convertTo (num) {
	    return this.imod(num.ushln(this.shift));
	  };

	  Mont.prototype.convertFrom = function convertFrom (num) {
	    var r = this.imod(num.mul(this.rinv));
	    r.red = null;
	    return r;
	  };

	  Mont.prototype.imul = function imul (a, b) {
	    if (a.isZero() || b.isZero()) {
	      a.words[0] = 0;
	      a.length = 1;
	      return a;
	    }

	    var t = a.imul(b);
	    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
	    var u = t.isub(c).iushrn(this.shift);
	    var res = u;

	    if (u.cmp(this.m) >= 0) {
	      res = u.isub(this.m);
	    } else if (u.cmpn(0) < 0) {
	      res = u.iadd(this.m);
	    }

	    return res._forceRed(this);
	  };

	  Mont.prototype.mul = function mul (a, b) {
	    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

	    var t = a.mul(b);
	    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
	    var u = t.isub(c).iushrn(this.shift);
	    var res = u;
	    if (u.cmp(this.m) >= 0) {
	      res = u.isub(this.m);
	    } else if (u.cmpn(0) < 0) {
	      res = u.iadd(this.m);
	    }

	    return res._forceRed(this);
	  };

	  Mont.prototype.invm = function invm (a) {
	    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
	    var res = this.imod(a._invmp(this.m).mul(this.r2));
	    return res._forceRed(this);
	  };
	})(module, commonjsGlobal);
	});

	var minimalisticAssert$1 = assert$6;

	function assert$6(val, msg) {
	  if (!val)
	    throw new Error(msg || 'Assertion failed');
	}

	assert$6.equal = function assertEqual(l, r, msg) {
	  if (l != r)
	    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
	};

	var isBuffer = function isBuffer(arg) {
	  return arg instanceof Buffer;
	};

	var inherits_browser$2 = createCommonjsModule$1(function (module) {
	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function () {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  };
	}
	});

	var require$$0 = util;

	var inherits$1 = createCommonjsModule$1(function (module) {
	try {
	  var util = require$$0;
	  if (typeof util.inherits !== 'function') throw '';
	  module.exports = util.inherits;
	} catch (e) {
	  module.exports = inherits_browser$2;
	}
	});

	var util = createCommonjsModule$1(function (module, exports) {
	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
	  function getOwnPropertyDescriptors(obj) {
	    var keys = Object.keys(obj);
	    var descriptors = {};
	    for (var i = 0; i < keys.length; i++) {
	      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
	    }
	    return descriptors;
	  };

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  if (typeof process !== 'undefined' && process.noDeprecation === true) {
	    return fn;
	  }

	  // Allow for deprecating things in the process of starting up.
	  if (typeof process === 'undefined') {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var length = output.reduce(function(prev, cur) {
	    if (cur.indexOf('\n') >= 0) ;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = isBuffer;

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = inherits$1;

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

	exports.promisify = function promisify(original) {
	  if (typeof original !== 'function')
	    throw new TypeError('The "original" argument must be of type Function');

	  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
	    var fn = original[kCustomPromisifiedSymbol];
	    if (typeof fn !== 'function') {
	      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
	    }
	    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
	      value: fn, enumerable: false, writable: false, configurable: true
	    });
	    return fn;
	  }

	  function fn() {
	    var promiseResolve, promiseReject;
	    var promise = new Promise(function (resolve, reject) {
	      promiseResolve = resolve;
	      promiseReject = reject;
	    });

	    var args = [];
	    for (var i = 0; i < arguments.length; i++) {
	      args.push(arguments[i]);
	    }
	    args.push(function (err, value) {
	      if (err) {
	        promiseReject(err);
	      } else {
	        promiseResolve(value);
	      }
	    });

	    try {
	      original.apply(this, args);
	    } catch (err) {
	      promiseReject(err);
	    }

	    return promise;
	  }

	  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

	  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
	    value: fn, enumerable: false, writable: false, configurable: true
	  });
	  return Object.defineProperties(
	    fn,
	    getOwnPropertyDescriptors(original)
	  );
	};

	exports.promisify.custom = kCustomPromisifiedSymbol;

	function callbackifyOnRejected(reason, cb) {
	  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
	  // Because `null` is a special error value in callbacks which means "no error
	  // occurred", we error-wrap so the callback consumer can distinguish between
	  // "the promise rejected with null" or "the promise fulfilled with undefined".
	  if (!reason) {
	    var newReason = new Error('Promise was rejected with a falsy value');
	    newReason.reason = reason;
	    reason = newReason;
	  }
	  return cb(reason);
	}

	function callbackify(original) {
	  if (typeof original !== 'function') {
	    throw new TypeError('The "original" argument must be of type Function');
	  }

	  // We DO NOT return the promise as it gives the user a false sense that
	  // the promise is actually somehow related to the callback's execution
	  // and that the callback throwing will reject the promise.
	  function callbackified() {
	    var args = [];
	    for (var i = 0; i < arguments.length; i++) {
	      args.push(arguments[i]);
	    }

	    var maybeCb = args.pop();
	    if (typeof maybeCb !== 'function') {
	      throw new TypeError('The last argument must be of type Function');
	    }
	    var self = this;
	    var cb = function() {
	      return maybeCb.apply(self, arguments);
	    };
	    // In true node style we process the callback on `nextTick` with all the
	    // implications (stack, `uncaughtException`, `async_hooks`)
	    original.apply(this, args)
	      .then(function(ret) { process.nextTick(cb, null, ret); },
	            function(rej) { process.nextTick(callbackifyOnRejected, rej, cb); });
	  }

	  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
	  Object.defineProperties(callbackified,
	                          getOwnPropertyDescriptors(original));
	  return callbackified;
	}
	exports.callbackify = callbackify;
	});

	var inherits_browser$1 = createCommonjsModule$1(function (module) {
	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      ctor.prototype = Object.create(superCtor.prototype, {
	        constructor: {
	          value: ctor,
	          enumerable: false,
	          writable: true,
	          configurable: true
	        }
	      });
	    }
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      var TempCtor = function () {};
	      TempCtor.prototype = superCtor.prototype;
	      ctor.prototype = new TempCtor();
	      ctor.prototype.constructor = ctor;
	    }
	  };
	}
	});

	var inherits = createCommonjsModule$1(function (module) {
	try {
	  var util = require$$0;
	  /* istanbul ignore next */
	  if (typeof util.inherits !== 'function') throw '';
	  module.exports = util.inherits;
	} catch (e) {
	  /* istanbul ignore next */
	  module.exports = inherits_browser$1;
	}
	});

	var inherits_1 = inherits;

	function isSurrogatePair(msg, i) {
	  if ((msg.charCodeAt(i) & 0xFC00) !== 0xD800) {
	    return false;
	  }
	  if (i < 0 || i + 1 >= msg.length) {
	    return false;
	  }
	  return (msg.charCodeAt(i + 1) & 0xFC00) === 0xDC00;
	}

	function toArray(msg, enc) {
	  if (Array.isArray(msg))
	    return msg.slice();
	  if (!msg)
	    return [];
	  var res = [];
	  if (typeof msg === 'string') {
	    if (!enc) {
	      // Inspired by stringToUtf8ByteArray() in closure-library by Google
	      // https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
	      // Apache License 2.0
	      // https://github.com/google/closure-library/blob/master/LICENSE
	      var p = 0;
	      for (var i = 0; i < msg.length; i++) {
	        var c = msg.charCodeAt(i);
	        if (c < 128) {
	          res[p++] = c;
	        } else if (c < 2048) {
	          res[p++] = (c >> 6) | 192;
	          res[p++] = (c & 63) | 128;
	        } else if (isSurrogatePair(msg, i)) {
	          c = 0x10000 + ((c & 0x03FF) << 10) + (msg.charCodeAt(++i) & 0x03FF);
	          res[p++] = (c >> 18) | 240;
	          res[p++] = ((c >> 12) & 63) | 128;
	          res[p++] = ((c >> 6) & 63) | 128;
	          res[p++] = (c & 63) | 128;
	        } else {
	          res[p++] = (c >> 12) | 224;
	          res[p++] = ((c >> 6) & 63) | 128;
	          res[p++] = (c & 63) | 128;
	        }
	      }
	    } else if (enc === 'hex') {
	      msg = msg.replace(/[^a-z0-9]+/ig, '');
	      if (msg.length % 2 !== 0)
	        msg = '0' + msg;
	      for (i = 0; i < msg.length; i += 2)
	        res.push(parseInt(msg[i] + msg[i + 1], 16));
	    }
	  } else {
	    for (i = 0; i < msg.length; i++)
	      res[i] = msg[i] | 0;
	  }
	  return res;
	}
	var toArray_1 = toArray;

	function toHex(msg) {
	  var res = '';
	  for (var i = 0; i < msg.length; i++)
	    res += zero2(msg[i].toString(16));
	  return res;
	}
	var toHex_1 = toHex;

	function htonl(w) {
	  var res = (w >>> 24) |
	            ((w >>> 8) & 0xff00) |
	            ((w << 8) & 0xff0000) |
	            ((w & 0xff) << 24);
	  return res >>> 0;
	}
	var htonl_1 = htonl;

	function toHex32(msg, endian) {
	  var res = '';
	  for (var i = 0; i < msg.length; i++) {
	    var w = msg[i];
	    if (endian === 'little')
	      w = htonl(w);
	    res += zero8(w.toString(16));
	  }
	  return res;
	}
	var toHex32_1 = toHex32;

	function zero2(word) {
	  if (word.length === 1)
	    return '0' + word;
	  else
	    return word;
	}
	var zero2_1 = zero2;

	function zero8(word) {
	  if (word.length === 7)
	    return '0' + word;
	  else if (word.length === 6)
	    return '00' + word;
	  else if (word.length === 5)
	    return '000' + word;
	  else if (word.length === 4)
	    return '0000' + word;
	  else if (word.length === 3)
	    return '00000' + word;
	  else if (word.length === 2)
	    return '000000' + word;
	  else if (word.length === 1)
	    return '0000000' + word;
	  else
	    return word;
	}
	var zero8_1 = zero8;

	function join32(msg, start, end, endian) {
	  var len = end - start;
	  minimalisticAssert$1(len % 4 === 0);
	  var res = new Array(len / 4);
	  for (var i = 0, k = start; i < res.length; i++, k += 4) {
	    var w;
	    if (endian === 'big')
	      w = (msg[k] << 24) | (msg[k + 1] << 16) | (msg[k + 2] << 8) | msg[k + 3];
	    else
	      w = (msg[k + 3] << 24) | (msg[k + 2] << 16) | (msg[k + 1] << 8) | msg[k];
	    res[i] = w >>> 0;
	  }
	  return res;
	}
	var join32_1 = join32;

	function split32(msg, endian) {
	  var res = new Array(msg.length * 4);
	  for (var i = 0, k = 0; i < msg.length; i++, k += 4) {
	    var m = msg[i];
	    if (endian === 'big') {
	      res[k] = m >>> 24;
	      res[k + 1] = (m >>> 16) & 0xff;
	      res[k + 2] = (m >>> 8) & 0xff;
	      res[k + 3] = m & 0xff;
	    } else {
	      res[k + 3] = m >>> 24;
	      res[k + 2] = (m >>> 16) & 0xff;
	      res[k + 1] = (m >>> 8) & 0xff;
	      res[k] = m & 0xff;
	    }
	  }
	  return res;
	}
	var split32_1 = split32;

	function rotr32$1(w, b) {
	  return (w >>> b) | (w << (32 - b));
	}
	var rotr32_1 = rotr32$1;

	function rotl32$2(w, b) {
	  return (w << b) | (w >>> (32 - b));
	}
	var rotl32_1 = rotl32$2;

	function sum32$3(a, b) {
	  return (a + b) >>> 0;
	}
	var sum32_1 = sum32$3;

	function sum32_3$1(a, b, c) {
	  return (a + b + c) >>> 0;
	}
	var sum32_3_1 = sum32_3$1;

	function sum32_4$2(a, b, c, d) {
	  return (a + b + c + d) >>> 0;
	}
	var sum32_4_1 = sum32_4$2;

	function sum32_5$2(a, b, c, d, e) {
	  return (a + b + c + d + e) >>> 0;
	}
	var sum32_5_1 = sum32_5$2;

	function sum64$1(buf, pos, ah, al) {
	  var bh = buf[pos];
	  var bl = buf[pos + 1];

	  var lo = (al + bl) >>> 0;
	  var hi = (lo < al ? 1 : 0) + ah + bh;
	  buf[pos] = hi >>> 0;
	  buf[pos + 1] = lo;
	}
	var sum64_1 = sum64$1;

	function sum64_hi$1(ah, al, bh, bl) {
	  var lo = (al + bl) >>> 0;
	  var hi = (lo < al ? 1 : 0) + ah + bh;
	  return hi >>> 0;
	}
	var sum64_hi_1 = sum64_hi$1;

	function sum64_lo$1(ah, al, bh, bl) {
	  var lo = al + bl;
	  return lo >>> 0;
	}
	var sum64_lo_1 = sum64_lo$1;

	function sum64_4_hi$1(ah, al, bh, bl, ch, cl, dh, dl) {
	  var carry = 0;
	  var lo = al;
	  lo = (lo + bl) >>> 0;
	  carry += lo < al ? 1 : 0;
	  lo = (lo + cl) >>> 0;
	  carry += lo < cl ? 1 : 0;
	  lo = (lo + dl) >>> 0;
	  carry += lo < dl ? 1 : 0;

	  var hi = ah + bh + ch + dh + carry;
	  return hi >>> 0;
	}
	var sum64_4_hi_1 = sum64_4_hi$1;

	function sum64_4_lo$1(ah, al, bh, bl, ch, cl, dh, dl) {
	  var lo = al + bl + cl + dl;
	  return lo >>> 0;
	}
	var sum64_4_lo_1 = sum64_4_lo$1;

	function sum64_5_hi$1(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
	  var carry = 0;
	  var lo = al;
	  lo = (lo + bl) >>> 0;
	  carry += lo < al ? 1 : 0;
	  lo = (lo + cl) >>> 0;
	  carry += lo < cl ? 1 : 0;
	  lo = (lo + dl) >>> 0;
	  carry += lo < dl ? 1 : 0;
	  lo = (lo + el) >>> 0;
	  carry += lo < el ? 1 : 0;

	  var hi = ah + bh + ch + dh + eh + carry;
	  return hi >>> 0;
	}
	var sum64_5_hi_1 = sum64_5_hi$1;

	function sum64_5_lo$1(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
	  var lo = al + bl + cl + dl + el;

	  return lo >>> 0;
	}
	var sum64_5_lo_1 = sum64_5_lo$1;

	function rotr64_hi$1(ah, al, num) {
	  var r = (al << (32 - num)) | (ah >>> num);
	  return r >>> 0;
	}
	var rotr64_hi_1 = rotr64_hi$1;

	function rotr64_lo$1(ah, al, num) {
	  var r = (ah << (32 - num)) | (al >>> num);
	  return r >>> 0;
	}
	var rotr64_lo_1 = rotr64_lo$1;

	function shr64_hi$1(ah, al, num) {
	  return ah >>> num;
	}
	var shr64_hi_1 = shr64_hi$1;

	function shr64_lo$1(ah, al, num) {
	  var r = (ah << (32 - num)) | (al >>> num);
	  return r >>> 0;
	}
	var shr64_lo_1 = shr64_lo$1;

	var utils = {
		inherits: inherits_1,
		toArray: toArray_1,
		toHex: toHex_1,
		htonl: htonl_1,
		toHex32: toHex32_1,
		zero2: zero2_1,
		zero8: zero8_1,
		join32: join32_1,
		split32: split32_1,
		rotr32: rotr32_1,
		rotl32: rotl32_1,
		sum32: sum32_1,
		sum32_3: sum32_3_1,
		sum32_4: sum32_4_1,
		sum32_5: sum32_5_1,
		sum64: sum64_1,
		sum64_hi: sum64_hi_1,
		sum64_lo: sum64_lo_1,
		sum64_4_hi: sum64_4_hi_1,
		sum64_4_lo: sum64_4_lo_1,
		sum64_5_hi: sum64_5_hi_1,
		sum64_5_lo: sum64_5_lo_1,
		rotr64_hi: rotr64_hi_1,
		rotr64_lo: rotr64_lo_1,
		shr64_hi: shr64_hi_1,
		shr64_lo: shr64_lo_1
	};

	function BlockHash$4() {
	  this.pending = null;
	  this.pendingTotal = 0;
	  this.blockSize = this.constructor.blockSize;
	  this.outSize = this.constructor.outSize;
	  this.hmacStrength = this.constructor.hmacStrength;
	  this.padLength = this.constructor.padLength / 8;
	  this.endian = 'big';

	  this._delta8 = this.blockSize / 8;
	  this._delta32 = this.blockSize / 32;
	}
	var BlockHash_1 = BlockHash$4;

	BlockHash$4.prototype.update = function update(msg, enc) {
	  // Convert message to array, pad it, and join into 32bit blocks
	  msg = utils.toArray(msg, enc);
	  if (!this.pending)
	    this.pending = msg;
	  else
	    this.pending = this.pending.concat(msg);
	  this.pendingTotal += msg.length;

	  // Enough data, try updating
	  if (this.pending.length >= this._delta8) {
	    msg = this.pending;

	    // Process pending data in blocks
	    var r = msg.length % this._delta8;
	    this.pending = msg.slice(msg.length - r, msg.length);
	    if (this.pending.length === 0)
	      this.pending = null;

	    msg = utils.join32(msg, 0, msg.length - r, this.endian);
	    for (var i = 0; i < msg.length; i += this._delta32)
	      this._update(msg, i, i + this._delta32);
	  }

	  return this;
	};

	BlockHash$4.prototype.digest = function digest(enc) {
	  this.update(this._pad());
	  minimalisticAssert$1(this.pending === null);

	  return this._digest(enc);
	};

	BlockHash$4.prototype._pad = function pad() {
	  var len = this.pendingTotal;
	  var bytes = this._delta8;
	  var k = bytes - ((len + this.padLength) % bytes);
	  var res = new Array(k + this.padLength);
	  res[0] = 0x80;
	  for (var i = 1; i < k; i++)
	    res[i] = 0;

	  // Append length
	  len <<= 3;
	  if (this.endian === 'big') {
	    for (var t = 8; t < this.padLength; t++)
	      res[i++] = 0;

	    res[i++] = 0;
	    res[i++] = 0;
	    res[i++] = 0;
	    res[i++] = 0;
	    res[i++] = (len >>> 24) & 0xff;
	    res[i++] = (len >>> 16) & 0xff;
	    res[i++] = (len >>> 8) & 0xff;
	    res[i++] = len & 0xff;
	  } else {
	    res[i++] = len & 0xff;
	    res[i++] = (len >>> 8) & 0xff;
	    res[i++] = (len >>> 16) & 0xff;
	    res[i++] = (len >>> 24) & 0xff;
	    res[i++] = 0;
	    res[i++] = 0;
	    res[i++] = 0;
	    res[i++] = 0;

	    for (t = 8; t < this.padLength; t++)
	      res[i++] = 0;
	  }

	  return res;
	};

	var common$1 = {
		BlockHash: BlockHash_1
	};

	var rotr32 = utils.rotr32;

	function ft_1$1(s, x, y, z) {
	  if (s === 0)
	    return ch32$1(x, y, z);
	  if (s === 1 || s === 3)
	    return p32(x, y, z);
	  if (s === 2)
	    return maj32$1(x, y, z);
	}
	var ft_1_1 = ft_1$1;

	function ch32$1(x, y, z) {
	  return (x & y) ^ ((~x) & z);
	}
	var ch32_1 = ch32$1;

	function maj32$1(x, y, z) {
	  return (x & y) ^ (x & z) ^ (y & z);
	}
	var maj32_1 = maj32$1;

	function p32(x, y, z) {
	  return x ^ y ^ z;
	}
	var p32_1 = p32;

	function s0_256$1(x) {
	  return rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22);
	}
	var s0_256_1 = s0_256$1;

	function s1_256$1(x) {
	  return rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25);
	}
	var s1_256_1 = s1_256$1;

	function g0_256$1(x) {
	  return rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
	}
	var g0_256_1 = g0_256$1;

	function g1_256$1(x) {
	  return rotr32(x, 17) ^ rotr32(x, 19) ^ (x >>> 10);
	}
	var g1_256_1 = g1_256$1;

	var common = {
		ft_1: ft_1_1,
		ch32: ch32_1,
		maj32: maj32_1,
		p32: p32_1,
		s0_256: s0_256_1,
		s1_256: s1_256_1,
		g0_256: g0_256_1,
		g1_256: g1_256_1
	};

	var rotl32$1 = utils.rotl32;
	var sum32$2 = utils.sum32;
	var sum32_5$1 = utils.sum32_5;
	var ft_1 = common.ft_1;
	var BlockHash$3 = common$1.BlockHash;

	var sha1_K = [
	  0x5A827999, 0x6ED9EBA1,
	  0x8F1BBCDC, 0xCA62C1D6
	];

	function SHA1() {
	  if (!(this instanceof SHA1))
	    return new SHA1();

	  BlockHash$3.call(this);
	  this.h = [
	    0x67452301, 0xefcdab89, 0x98badcfe,
	    0x10325476, 0xc3d2e1f0 ];
	  this.W = new Array(80);
	}

	utils.inherits(SHA1, BlockHash$3);
	var _1 = SHA1;

	SHA1.blockSize = 512;
	SHA1.outSize = 160;
	SHA1.hmacStrength = 80;
	SHA1.padLength = 64;

	SHA1.prototype._update = function _update(msg, start) {
	  var W = this.W;

	  for (var i = 0; i < 16; i++)
	    W[i] = msg[start + i];

	  for(; i < W.length; i++)
	    W[i] = rotl32$1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

	  var a = this.h[0];
	  var b = this.h[1];
	  var c = this.h[2];
	  var d = this.h[3];
	  var e = this.h[4];

	  for (i = 0; i < W.length; i++) {
	    var s = ~~(i / 20);
	    var t = sum32_5$1(rotl32$1(a, 5), ft_1(s, b, c, d), e, W[i], sha1_K[s]);
	    e = d;
	    d = c;
	    c = rotl32$1(b, 30);
	    b = a;
	    a = t;
	  }

	  this.h[0] = sum32$2(this.h[0], a);
	  this.h[1] = sum32$2(this.h[1], b);
	  this.h[2] = sum32$2(this.h[2], c);
	  this.h[3] = sum32$2(this.h[3], d);
	  this.h[4] = sum32$2(this.h[4], e);
	};

	SHA1.prototype._digest = function digest(enc) {
	  if (enc === 'hex')
	    return utils.toHex32(this.h, 'big');
	  else
	    return utils.split32(this.h, 'big');
	};

	var sum32$1 = utils.sum32;
	var sum32_4$1 = utils.sum32_4;
	var sum32_5 = utils.sum32_5;
	var ch32 = common.ch32;
	var maj32 = common.maj32;
	var s0_256 = common.s0_256;
	var s1_256 = common.s1_256;
	var g0_256 = common.g0_256;
	var g1_256 = common.g1_256;

	var BlockHash$2 = common$1.BlockHash;

	var sha256_K = [
	  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
	  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
	  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
	  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
	  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
	  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
	  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
	  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
	  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
	];

	function SHA256() {
	  if (!(this instanceof SHA256))
	    return new SHA256();

	  BlockHash$2.call(this);
	  this.h = [
	    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
	    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
	  ];
	  this.k = sha256_K;
	  this.W = new Array(64);
	}
	utils.inherits(SHA256, BlockHash$2);
	var _256 = SHA256;

	SHA256.blockSize = 512;
	SHA256.outSize = 256;
	SHA256.hmacStrength = 192;
	SHA256.padLength = 64;

	SHA256.prototype._update = function _update(msg, start) {
	  var W = this.W;

	  for (var i = 0; i < 16; i++)
	    W[i] = msg[start + i];
	  for (; i < W.length; i++)
	    W[i] = sum32_4$1(g1_256(W[i - 2]), W[i - 7], g0_256(W[i - 15]), W[i - 16]);

	  var a = this.h[0];
	  var b = this.h[1];
	  var c = this.h[2];
	  var d = this.h[3];
	  var e = this.h[4];
	  var f = this.h[5];
	  var g = this.h[6];
	  var h = this.h[7];

	  minimalisticAssert$1(this.k.length === W.length);
	  for (i = 0; i < W.length; i++) {
	    var T1 = sum32_5(h, s1_256(e), ch32(e, f, g), this.k[i], W[i]);
	    var T2 = sum32$1(s0_256(a), maj32(a, b, c));
	    h = g;
	    g = f;
	    f = e;
	    e = sum32$1(d, T1);
	    d = c;
	    c = b;
	    b = a;
	    a = sum32$1(T1, T2);
	  }

	  this.h[0] = sum32$1(this.h[0], a);
	  this.h[1] = sum32$1(this.h[1], b);
	  this.h[2] = sum32$1(this.h[2], c);
	  this.h[3] = sum32$1(this.h[3], d);
	  this.h[4] = sum32$1(this.h[4], e);
	  this.h[5] = sum32$1(this.h[5], f);
	  this.h[6] = sum32$1(this.h[6], g);
	  this.h[7] = sum32$1(this.h[7], h);
	};

	SHA256.prototype._digest = function digest(enc) {
	  if (enc === 'hex')
	    return utils.toHex32(this.h, 'big');
	  else
	    return utils.split32(this.h, 'big');
	};

	function SHA224() {
	  if (!(this instanceof SHA224))
	    return new SHA224();

	  _256.call(this);
	  this.h = [
	    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
	    0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4 ];
	}
	utils.inherits(SHA224, _256);
	var _224 = SHA224;

	SHA224.blockSize = 512;
	SHA224.outSize = 224;
	SHA224.hmacStrength = 192;
	SHA224.padLength = 64;

	SHA224.prototype._digest = function digest(enc) {
	  // Just truncate output
	  if (enc === 'hex')
	    return utils.toHex32(this.h.slice(0, 7), 'big');
	  else
	    return utils.split32(this.h.slice(0, 7), 'big');
	};

	var rotr64_hi = utils.rotr64_hi;
	var rotr64_lo = utils.rotr64_lo;
	var shr64_hi = utils.shr64_hi;
	var shr64_lo = utils.shr64_lo;
	var sum64 = utils.sum64;
	var sum64_hi = utils.sum64_hi;
	var sum64_lo = utils.sum64_lo;
	var sum64_4_hi = utils.sum64_4_hi;
	var sum64_4_lo = utils.sum64_4_lo;
	var sum64_5_hi = utils.sum64_5_hi;
	var sum64_5_lo = utils.sum64_5_lo;

	var BlockHash$1 = common$1.BlockHash;

	var sha512_K = [
	  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
	  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
	  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
	  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
	  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
	  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
	  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
	  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
	  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
	  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
	  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
	  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
	  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
	  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
	  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
	  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
	  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
	  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
	  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
	  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
	  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
	  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
	  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
	  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
	  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
	  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
	  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
	  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
	  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
	  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
	  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
	  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
	  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
	  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
	  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
	  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
	  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
	  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
	  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
	  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
	];

	function SHA512() {
	  if (!(this instanceof SHA512))
	    return new SHA512();

	  BlockHash$1.call(this);
	  this.h = [
	    0x6a09e667, 0xf3bcc908,
	    0xbb67ae85, 0x84caa73b,
	    0x3c6ef372, 0xfe94f82b,
	    0xa54ff53a, 0x5f1d36f1,
	    0x510e527f, 0xade682d1,
	    0x9b05688c, 0x2b3e6c1f,
	    0x1f83d9ab, 0xfb41bd6b,
	    0x5be0cd19, 0x137e2179 ];
	  this.k = sha512_K;
	  this.W = new Array(160);
	}
	utils.inherits(SHA512, BlockHash$1);
	var _512 = SHA512;

	SHA512.blockSize = 1024;
	SHA512.outSize = 512;
	SHA512.hmacStrength = 192;
	SHA512.padLength = 128;

	SHA512.prototype._prepareBlock = function _prepareBlock(msg, start) {
	  var W = this.W;

	  // 32 x 32bit words
	  for (var i = 0; i < 32; i++)
	    W[i] = msg[start + i];
	  for (; i < W.length; i += 2) {
	    var c0_hi = g1_512_hi(W[i - 4], W[i - 3]);  // i - 2
	    var c0_lo = g1_512_lo(W[i - 4], W[i - 3]);
	    var c1_hi = W[i - 14];  // i - 7
	    var c1_lo = W[i - 13];
	    var c2_hi = g0_512_hi(W[i - 30], W[i - 29]);  // i - 15
	    var c2_lo = g0_512_lo(W[i - 30], W[i - 29]);
	    var c3_hi = W[i - 32];  // i - 16
	    var c3_lo = W[i - 31];

	    W[i] = sum64_4_hi(
	      c0_hi, c0_lo,
	      c1_hi, c1_lo,
	      c2_hi, c2_lo,
	      c3_hi, c3_lo);
	    W[i + 1] = sum64_4_lo(
	      c0_hi, c0_lo,
	      c1_hi, c1_lo,
	      c2_hi, c2_lo,
	      c3_hi, c3_lo);
	  }
	};

	SHA512.prototype._update = function _update(msg, start) {
	  this._prepareBlock(msg, start);

	  var W = this.W;

	  var ah = this.h[0];
	  var al = this.h[1];
	  var bh = this.h[2];
	  var bl = this.h[3];
	  var ch = this.h[4];
	  var cl = this.h[5];
	  var dh = this.h[6];
	  var dl = this.h[7];
	  var eh = this.h[8];
	  var el = this.h[9];
	  var fh = this.h[10];
	  var fl = this.h[11];
	  var gh = this.h[12];
	  var gl = this.h[13];
	  var hh = this.h[14];
	  var hl = this.h[15];

	  minimalisticAssert$1(this.k.length === W.length);
	  for (var i = 0; i < W.length; i += 2) {
	    var c0_hi = hh;
	    var c0_lo = hl;
	    var c1_hi = s1_512_hi(eh, el);
	    var c1_lo = s1_512_lo(eh, el);
	    var c2_hi = ch64_hi(eh, el, fh, fl, gh);
	    var c2_lo = ch64_lo(eh, el, fh, fl, gh, gl);
	    var c3_hi = this.k[i];
	    var c3_lo = this.k[i + 1];
	    var c4_hi = W[i];
	    var c4_lo = W[i + 1];

	    var T1_hi = sum64_5_hi(
	      c0_hi, c0_lo,
	      c1_hi, c1_lo,
	      c2_hi, c2_lo,
	      c3_hi, c3_lo,
	      c4_hi, c4_lo);
	    var T1_lo = sum64_5_lo(
	      c0_hi, c0_lo,
	      c1_hi, c1_lo,
	      c2_hi, c2_lo,
	      c3_hi, c3_lo,
	      c4_hi, c4_lo);

	    c0_hi = s0_512_hi(ah, al);
	    c0_lo = s0_512_lo(ah, al);
	    c1_hi = maj64_hi(ah, al, bh, bl, ch);
	    c1_lo = maj64_lo(ah, al, bh, bl, ch, cl);

	    var T2_hi = sum64_hi(c0_hi, c0_lo, c1_hi, c1_lo);
	    var T2_lo = sum64_lo(c0_hi, c0_lo, c1_hi, c1_lo);

	    hh = gh;
	    hl = gl;

	    gh = fh;
	    gl = fl;

	    fh = eh;
	    fl = el;

	    eh = sum64_hi(dh, dl, T1_hi, T1_lo);
	    el = sum64_lo(dl, dl, T1_hi, T1_lo);

	    dh = ch;
	    dl = cl;

	    ch = bh;
	    cl = bl;

	    bh = ah;
	    bl = al;

	    ah = sum64_hi(T1_hi, T1_lo, T2_hi, T2_lo);
	    al = sum64_lo(T1_hi, T1_lo, T2_hi, T2_lo);
	  }

	  sum64(this.h, 0, ah, al);
	  sum64(this.h, 2, bh, bl);
	  sum64(this.h, 4, ch, cl);
	  sum64(this.h, 6, dh, dl);
	  sum64(this.h, 8, eh, el);
	  sum64(this.h, 10, fh, fl);
	  sum64(this.h, 12, gh, gl);
	  sum64(this.h, 14, hh, hl);
	};

	SHA512.prototype._digest = function digest(enc) {
	  if (enc === 'hex')
	    return utils.toHex32(this.h, 'big');
	  else
	    return utils.split32(this.h, 'big');
	};

	function ch64_hi(xh, xl, yh, yl, zh) {
	  var r = (xh & yh) ^ ((~xh) & zh);
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function ch64_lo(xh, xl, yh, yl, zh, zl) {
	  var r = (xl & yl) ^ ((~xl) & zl);
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function maj64_hi(xh, xl, yh, yl, zh) {
	  var r = (xh & yh) ^ (xh & zh) ^ (yh & zh);
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function maj64_lo(xh, xl, yh, yl, zh, zl) {
	  var r = (xl & yl) ^ (xl & zl) ^ (yl & zl);
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function s0_512_hi(xh, xl) {
	  var c0_hi = rotr64_hi(xh, xl, 28);
	  var c1_hi = rotr64_hi(xl, xh, 2);  // 34
	  var c2_hi = rotr64_hi(xl, xh, 7);  // 39

	  var r = c0_hi ^ c1_hi ^ c2_hi;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function s0_512_lo(xh, xl) {
	  var c0_lo = rotr64_lo(xh, xl, 28);
	  var c1_lo = rotr64_lo(xl, xh, 2);  // 34
	  var c2_lo = rotr64_lo(xl, xh, 7);  // 39

	  var r = c0_lo ^ c1_lo ^ c2_lo;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function s1_512_hi(xh, xl) {
	  var c0_hi = rotr64_hi(xh, xl, 14);
	  var c1_hi = rotr64_hi(xh, xl, 18);
	  var c2_hi = rotr64_hi(xl, xh, 9);  // 41

	  var r = c0_hi ^ c1_hi ^ c2_hi;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function s1_512_lo(xh, xl) {
	  var c0_lo = rotr64_lo(xh, xl, 14);
	  var c1_lo = rotr64_lo(xh, xl, 18);
	  var c2_lo = rotr64_lo(xl, xh, 9);  // 41

	  var r = c0_lo ^ c1_lo ^ c2_lo;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function g0_512_hi(xh, xl) {
	  var c0_hi = rotr64_hi(xh, xl, 1);
	  var c1_hi = rotr64_hi(xh, xl, 8);
	  var c2_hi = shr64_hi(xh, xl, 7);

	  var r = c0_hi ^ c1_hi ^ c2_hi;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function g0_512_lo(xh, xl) {
	  var c0_lo = rotr64_lo(xh, xl, 1);
	  var c1_lo = rotr64_lo(xh, xl, 8);
	  var c2_lo = shr64_lo(xh, xl, 7);

	  var r = c0_lo ^ c1_lo ^ c2_lo;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function g1_512_hi(xh, xl) {
	  var c0_hi = rotr64_hi(xh, xl, 19);
	  var c1_hi = rotr64_hi(xl, xh, 29);  // 61
	  var c2_hi = shr64_hi(xh, xl, 6);

	  var r = c0_hi ^ c1_hi ^ c2_hi;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function g1_512_lo(xh, xl) {
	  var c0_lo = rotr64_lo(xh, xl, 19);
	  var c1_lo = rotr64_lo(xl, xh, 29);  // 61
	  var c2_lo = shr64_lo(xh, xl, 6);

	  var r = c0_lo ^ c1_lo ^ c2_lo;
	  if (r < 0)
	    r += 0x100000000;
	  return r;
	}

	function SHA384() {
	  if (!(this instanceof SHA384))
	    return new SHA384();

	  _512.call(this);
	  this.h = [
	    0xcbbb9d5d, 0xc1059ed8,
	    0x629a292a, 0x367cd507,
	    0x9159015a, 0x3070dd17,
	    0x152fecd8, 0xf70e5939,
	    0x67332667, 0xffc00b31,
	    0x8eb44a87, 0x68581511,
	    0xdb0c2e0d, 0x64f98fa7,
	    0x47b5481d, 0xbefa4fa4 ];
	}
	utils.inherits(SHA384, _512);
	var _384 = SHA384;

	SHA384.blockSize = 1024;
	SHA384.outSize = 384;
	SHA384.hmacStrength = 192;
	SHA384.padLength = 128;

	SHA384.prototype._digest = function digest(enc) {
	  if (enc === 'hex')
	    return utils.toHex32(this.h.slice(0, 12), 'big');
	  else
	    return utils.split32(this.h.slice(0, 12), 'big');
	};

	var sha1 = _1;
	var sha224 = _224;
	var sha256$1 = _256;
	var sha384 = _384;
	var sha512 = _512;

	var sha = {
		sha1: sha1,
		sha224: sha224,
		sha256: sha256$1,
		sha384: sha384,
		sha512: sha512
	};

	var rotl32 = utils.rotl32;
	var sum32 = utils.sum32;
	var sum32_3 = utils.sum32_3;
	var sum32_4 = utils.sum32_4;
	var BlockHash = common$1.BlockHash;

	function RIPEMD160() {
	  if (!(this instanceof RIPEMD160))
	    return new RIPEMD160();

	  BlockHash.call(this);

	  this.h = [ 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0 ];
	  this.endian = 'little';
	}
	utils.inherits(RIPEMD160, BlockHash);
	var ripemd160 = RIPEMD160;

	RIPEMD160.blockSize = 512;
	RIPEMD160.outSize = 160;
	RIPEMD160.hmacStrength = 192;
	RIPEMD160.padLength = 64;

	RIPEMD160.prototype._update = function update(msg, start) {
	  var A = this.h[0];
	  var B = this.h[1];
	  var C = this.h[2];
	  var D = this.h[3];
	  var E = this.h[4];
	  var Ah = A;
	  var Bh = B;
	  var Ch = C;
	  var Dh = D;
	  var Eh = E;
	  for (var j = 0; j < 80; j++) {
	    var T = sum32(
	      rotl32(
	        sum32_4(A, f(j, B, C, D), msg[r[j] + start], K(j)),
	        s[j]),
	      E);
	    A = E;
	    E = D;
	    D = rotl32(C, 10);
	    C = B;
	    B = T;
	    T = sum32(
	      rotl32(
	        sum32_4(Ah, f(79 - j, Bh, Ch, Dh), msg[rh[j] + start], Kh(j)),
	        sh[j]),
	      Eh);
	    Ah = Eh;
	    Eh = Dh;
	    Dh = rotl32(Ch, 10);
	    Ch = Bh;
	    Bh = T;
	  }
	  T = sum32_3(this.h[1], C, Dh);
	  this.h[1] = sum32_3(this.h[2], D, Eh);
	  this.h[2] = sum32_3(this.h[3], E, Ah);
	  this.h[3] = sum32_3(this.h[4], A, Bh);
	  this.h[4] = sum32_3(this.h[0], B, Ch);
	  this.h[0] = T;
	};

	RIPEMD160.prototype._digest = function digest(enc) {
	  if (enc === 'hex')
	    return utils.toHex32(this.h, 'little');
	  else
	    return utils.split32(this.h, 'little');
	};

	function f(j, x, y, z) {
	  if (j <= 15)
	    return x ^ y ^ z;
	  else if (j <= 31)
	    return (x & y) | ((~x) & z);
	  else if (j <= 47)
	    return (x | (~y)) ^ z;
	  else if (j <= 63)
	    return (x & z) | (y & (~z));
	  else
	    return x ^ (y | (~z));
	}

	function K(j) {
	  if (j <= 15)
	    return 0x00000000;
	  else if (j <= 31)
	    return 0x5a827999;
	  else if (j <= 47)
	    return 0x6ed9eba1;
	  else if (j <= 63)
	    return 0x8f1bbcdc;
	  else
	    return 0xa953fd4e;
	}

	function Kh(j) {
	  if (j <= 15)
	    return 0x50a28be6;
	  else if (j <= 31)
	    return 0x5c4dd124;
	  else if (j <= 47)
	    return 0x6d703ef3;
	  else if (j <= 63)
	    return 0x7a6d76e9;
	  else
	    return 0x00000000;
	}

	var r = [
	  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
	  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
	  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
	  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
	  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
	];

	var rh = [
	  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
	  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
	  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
	  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
	  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
	];

	var s = [
	  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
	  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
	  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
	  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
	  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
	];

	var sh = [
	  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
	  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
	  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
	  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
	  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
	];

	var ripemd = {
		ripemd160: ripemd160
	};

	function Hmac(hash, key, enc) {
	  if (!(this instanceof Hmac))
	    return new Hmac(hash, key, enc);
	  this.Hash = hash;
	  this.blockSize = hash.blockSize / 8;
	  this.outSize = hash.outSize / 8;
	  this.inner = null;
	  this.outer = null;

	  this._init(utils.toArray(key, enc));
	}
	var hmac = Hmac;

	Hmac.prototype._init = function init(key) {
	  // Shorten key, if needed
	  if (key.length > this.blockSize)
	    key = new this.Hash().update(key).digest();
	  minimalisticAssert$1(key.length <= this.blockSize);

	  // Add padding to key
	  for (var i = key.length; i < this.blockSize; i++)
	    key.push(0);

	  for (i = 0; i < key.length; i++)
	    key[i] ^= 0x36;
	  this.inner = new this.Hash().update(key);

	  // 0x36 ^ 0x5c = 0x6a
	  for (i = 0; i < key.length; i++)
	    key[i] ^= 0x6a;
	  this.outer = new this.Hash().update(key);
	};

	Hmac.prototype.update = function update(msg, enc) {
	  this.inner.update(msg, enc);
	  return this;
	};

	Hmac.prototype.digest = function digest(enc) {
	  this.outer.update(this.inner.digest());
	  return this.outer.digest(enc);
	};

	var hash_1 = createCommonjsModule$1(function (module, exports) {
	var hash = exports;

	hash.utils = utils;
	hash.common = common$1;
	hash.sha = sha;
	hash.ripemd = ripemd;
	hash.hmac = hmac;

	// Proxy hash functions to the main object
	hash.sha1 = hash.sha.sha1;
	hash.sha256 = hash.sha.sha256;
	hash.sha224 = hash.sha.sha224;
	hash.sha384 = hash.sha.sha384;
	hash.sha512 = hash.sha.sha512;
	hash.ripemd160 = hash.ripemd.ripemd160;
	});

	var hash = hash_1;

	function createCommonjsModule(fn, basedir, module) {
		return module = {
			path: basedir,
			exports: {},
			require: function (path, base) {
				return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
			}
		}, fn(module, module.exports), module.exports;
	}

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
	}

	var minimalisticAssert = assert;

	function assert(val, msg) {
	  if (!val)
	    throw new Error(msg || 'Assertion failed');
	}

	assert.equal = function assertEqual(l, r, msg) {
	  if (l != r)
	    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
	};

	var utils_1 = createCommonjsModule(function (module, exports) {

	var utils = exports;

	function toArray(msg, enc) {
	  if (Array.isArray(msg))
	    return msg.slice();
	  if (!msg)
	    return [];
	  var res = [];
	  if (typeof msg !== 'string') {
	    for (var i = 0; i < msg.length; i++)
	      res[i] = msg[i] | 0;
	    return res;
	  }
	  if (enc === 'hex') {
	    msg = msg.replace(/[^a-z0-9]+/ig, '');
	    if (msg.length % 2 !== 0)
	      msg = '0' + msg;
	    for (var i = 0; i < msg.length; i += 2)
	      res.push(parseInt(msg[i] + msg[i + 1], 16));
	  } else {
	    for (var i = 0; i < msg.length; i++) {
	      var c = msg.charCodeAt(i);
	      var hi = c >> 8;
	      var lo = c & 0xff;
	      if (hi)
	        res.push(hi, lo);
	      else
	        res.push(lo);
	    }
	  }
	  return res;
	}
	utils.toArray = toArray;

	function zero2(word) {
	  if (word.length === 1)
	    return '0' + word;
	  else
	    return word;
	}
	utils.zero2 = zero2;

	function toHex(msg) {
	  var res = '';
	  for (var i = 0; i < msg.length; i++)
	    res += zero2(msg[i].toString(16));
	  return res;
	}
	utils.toHex = toHex;

	utils.encode = function encode(arr, enc) {
	  if (enc === 'hex')
	    return toHex(arr);
	  else
	    return arr;
	};
	});

	var utils_1$1 = createCommonjsModule(function (module, exports) {

	var utils = exports;




	utils.assert = minimalisticAssert;
	utils.toArray = utils_1.toArray;
	utils.zero2 = utils_1.zero2;
	utils.toHex = utils_1.toHex;
	utils.encode = utils_1.encode;

	// Represent num in a w-NAF form
	function getNAF(num, w, bits) {
	  var naf = new Array(Math.max(num.bitLength(), bits) + 1);
	  naf.fill(0);

	  var ws = 1 << (w + 1);
	  var k = num.clone();

	  for (var i = 0; i < naf.length; i++) {
	    var z;
	    var mod = k.andln(ws - 1);
	    if (k.isOdd()) {
	      if (mod > (ws >> 1) - 1)
	        z = (ws >> 1) - mod;
	      else
	        z = mod;
	      k.isubn(z);
	    } else {
	      z = 0;
	    }

	    naf[i] = z;
	    k.iushrn(1);
	  }

	  return naf;
	}
	utils.getNAF = getNAF;

	// Represent k1, k2 in a Joint Sparse Form
	function getJSF(k1, k2) {
	  var jsf = [
	    [],
	    [],
	  ];

	  k1 = k1.clone();
	  k2 = k2.clone();
	  var d1 = 0;
	  var d2 = 0;
	  var m8;
	  while (k1.cmpn(-d1) > 0 || k2.cmpn(-d2) > 0) {
	    // First phase
	    var m14 = (k1.andln(3) + d1) & 3;
	    var m24 = (k2.andln(3) + d2) & 3;
	    if (m14 === 3)
	      m14 = -1;
	    if (m24 === 3)
	      m24 = -1;
	    var u1;
	    if ((m14 & 1) === 0) {
	      u1 = 0;
	    } else {
	      m8 = (k1.andln(7) + d1) & 7;
	      if ((m8 === 3 || m8 === 5) && m24 === 2)
	        u1 = -m14;
	      else
	        u1 = m14;
	    }
	    jsf[0].push(u1);

	    var u2;
	    if ((m24 & 1) === 0) {
	      u2 = 0;
	    } else {
	      m8 = (k2.andln(7) + d2) & 7;
	      if ((m8 === 3 || m8 === 5) && m14 === 2)
	        u2 = -m24;
	      else
	        u2 = m24;
	    }
	    jsf[1].push(u2);

	    // Second phase
	    if (2 * d1 === u1 + 1)
	      d1 = 1 - d1;
	    if (2 * d2 === u2 + 1)
	      d2 = 1 - d2;
	    k1.iushrn(1);
	    k2.iushrn(1);
	  }

	  return jsf;
	}
	utils.getJSF = getJSF;

	function cachedProperty(obj, name, computer) {
	  var key = '_' + name;
	  obj.prototype[name] = function cachedProperty() {
	    return this[key] !== undefined ? this[key] :
	      this[key] = computer.call(this);
	  };
	}
	utils.cachedProperty = cachedProperty;

	function parseBytes(bytes) {
	  return typeof bytes === 'string' ? utils.toArray(bytes, 'hex') :
	    bytes;
	}
	utils.parseBytes = parseBytes;

	function intFromLE(bytes) {
	  return new bn(bytes, 'hex', 'le');
	}
	utils.intFromLE = intFromLE;
	});



	var getNAF = utils_1$1.getNAF;
	var getJSF = utils_1$1.getJSF;
	var assert$1 = utils_1$1.assert;

	function BaseCurve(type, conf) {
	  this.type = type;
	  this.p = new bn(conf.p, 16);

	  // Use Montgomery, when there is no fast reduction for the prime
	  this.red = conf.prime ? bn.red(conf.prime) : bn.mont(this.p);

	  // Useful for many curves
	  this.zero = new bn(0).toRed(this.red);
	  this.one = new bn(1).toRed(this.red);
	  this.two = new bn(2).toRed(this.red);

	  // Curve configuration, optional
	  this.n = conf.n && new bn(conf.n, 16);
	  this.g = conf.g && this.pointFromJSON(conf.g, conf.gRed);

	  // Temporary arrays
	  this._wnafT1 = new Array(4);
	  this._wnafT2 = new Array(4);
	  this._wnafT3 = new Array(4);
	  this._wnafT4 = new Array(4);

	  this._bitLength = this.n ? this.n.bitLength() : 0;

	  // Generalized Greg Maxwell's trick
	  var adjustCount = this.n && this.p.div(this.n);
	  if (!adjustCount || adjustCount.cmpn(100) > 0) {
	    this.redN = null;
	  } else {
	    this._maxwellTrick = true;
	    this.redN = this.n.toRed(this.red);
	  }
	}
	var base = BaseCurve;

	BaseCurve.prototype.point = function point() {
	  throw new Error('Not implemented');
	};

	BaseCurve.prototype.validate = function validate() {
	  throw new Error('Not implemented');
	};

	BaseCurve.prototype._fixedNafMul = function _fixedNafMul(p, k) {
	  assert$1(p.precomputed);
	  var doubles = p._getDoubles();

	  var naf = getNAF(k, 1, this._bitLength);
	  var I = (1 << (doubles.step + 1)) - (doubles.step % 2 === 0 ? 2 : 1);
	  I /= 3;

	  // Translate into more windowed form
	  var repr = [];
	  var j;
	  var nafW;
	  for (j = 0; j < naf.length; j += doubles.step) {
	    nafW = 0;
	    for (var l = j + doubles.step - 1; l >= j; l--)
	      nafW = (nafW << 1) + naf[l];
	    repr.push(nafW);
	  }

	  var a = this.jpoint(null, null, null);
	  var b = this.jpoint(null, null, null);
	  for (var i = I; i > 0; i--) {
	    for (j = 0; j < repr.length; j++) {
	      nafW = repr[j];
	      if (nafW === i)
	        b = b.mixedAdd(doubles.points[j]);
	      else if (nafW === -i)
	        b = b.mixedAdd(doubles.points[j].neg());
	    }
	    a = a.add(b);
	  }
	  return a.toP();
	};

	BaseCurve.prototype._wnafMul = function _wnafMul(p, k) {
	  var w = 4;

	  // Precompute window
	  var nafPoints = p._getNAFPoints(w);
	  w = nafPoints.wnd;
	  var wnd = nafPoints.points;

	  // Get NAF form
	  var naf = getNAF(k, w, this._bitLength);

	  // Add `this`*(N+1) for every w-NAF index
	  var acc = this.jpoint(null, null, null);
	  for (var i = naf.length - 1; i >= 0; i--) {
	    // Count zeroes
	    for (var l = 0; i >= 0 && naf[i] === 0; i--)
	      l++;
	    if (i >= 0)
	      l++;
	    acc = acc.dblp(l);

	    if (i < 0)
	      break;
	    var z = naf[i];
	    assert$1(z !== 0);
	    if (p.type === 'affine') {
	      // J +- P
	      if (z > 0)
	        acc = acc.mixedAdd(wnd[(z - 1) >> 1]);
	      else
	        acc = acc.mixedAdd(wnd[(-z - 1) >> 1].neg());
	    } else {
	      // J +- J
	      if (z > 0)
	        acc = acc.add(wnd[(z - 1) >> 1]);
	      else
	        acc = acc.add(wnd[(-z - 1) >> 1].neg());
	    }
	  }
	  return p.type === 'affine' ? acc.toP() : acc;
	};

	BaseCurve.prototype._wnafMulAdd = function _wnafMulAdd(defW,
	  points,
	  coeffs,
	  len,
	  jacobianResult) {
	  var wndWidth = this._wnafT1;
	  var wnd = this._wnafT2;
	  var naf = this._wnafT3;

	  // Fill all arrays
	  var max = 0;
	  var i;
	  var j;
	  var p;
	  for (i = 0; i < len; i++) {
	    p = points[i];
	    var nafPoints = p._getNAFPoints(defW);
	    wndWidth[i] = nafPoints.wnd;
	    wnd[i] = nafPoints.points;
	  }

	  // Comb small window NAFs
	  for (i = len - 1; i >= 1; i -= 2) {
	    var a = i - 1;
	    var b = i;
	    if (wndWidth[a] !== 1 || wndWidth[b] !== 1) {
	      naf[a] = getNAF(coeffs[a], wndWidth[a], this._bitLength);
	      naf[b] = getNAF(coeffs[b], wndWidth[b], this._bitLength);
	      max = Math.max(naf[a].length, max);
	      max = Math.max(naf[b].length, max);
	      continue;
	    }

	    var comb = [
	      points[a], /* 1 */
	      null, /* 3 */
	      null, /* 5 */
	      points[b], /* 7 */
	    ];

	    // Try to avoid Projective points, if possible
	    if (points[a].y.cmp(points[b].y) === 0) {
	      comb[1] = points[a].add(points[b]);
	      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
	    } else if (points[a].y.cmp(points[b].y.redNeg()) === 0) {
	      comb[1] = points[a].toJ().mixedAdd(points[b]);
	      comb[2] = points[a].add(points[b].neg());
	    } else {
	      comb[1] = points[a].toJ().mixedAdd(points[b]);
	      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
	    }

	    var index = [
	      -3, /* -1 -1 */
	      -1, /* -1 0 */
	      -5, /* -1 1 */
	      -7, /* 0 -1 */
	      0, /* 0 0 */
	      7, /* 0 1 */
	      5, /* 1 -1 */
	      1, /* 1 0 */
	      3,  /* 1 1 */
	    ];

	    var jsf = getJSF(coeffs[a], coeffs[b]);
	    max = Math.max(jsf[0].length, max);
	    naf[a] = new Array(max);
	    naf[b] = new Array(max);
	    for (j = 0; j < max; j++) {
	      var ja = jsf[0][j] | 0;
	      var jb = jsf[1][j] | 0;

	      naf[a][j] = index[(ja + 1) * 3 + (jb + 1)];
	      naf[b][j] = 0;
	      wnd[a] = comb;
	    }
	  }

	  var acc = this.jpoint(null, null, null);
	  var tmp = this._wnafT4;
	  for (i = max; i >= 0; i--) {
	    var k = 0;

	    while (i >= 0) {
	      var zero = true;
	      for (j = 0; j < len; j++) {
	        tmp[j] = naf[j][i] | 0;
	        if (tmp[j] !== 0)
	          zero = false;
	      }
	      if (!zero)
	        break;
	      k++;
	      i--;
	    }
	    if (i >= 0)
	      k++;
	    acc = acc.dblp(k);
	    if (i < 0)
	      break;

	    for (j = 0; j < len; j++) {
	      var z = tmp[j];
	      if (z === 0)
	        continue;
	      else if (z > 0)
	        p = wnd[j][(z - 1) >> 1];
	      else if (z < 0)
	        p = wnd[j][(-z - 1) >> 1].neg();

	      if (p.type === 'affine')
	        acc = acc.mixedAdd(p);
	      else
	        acc = acc.add(p);
	    }
	  }
	  // Zeroify references
	  for (i = 0; i < len; i++)
	    wnd[i] = null;

	  if (jacobianResult)
	    return acc;
	  else
	    return acc.toP();
	};

	function BasePoint(curve, type) {
	  this.curve = curve;
	  this.type = type;
	  this.precomputed = null;
	}
	BaseCurve.BasePoint = BasePoint;

	BasePoint.prototype.eq = function eq(/*other*/) {
	  throw new Error('Not implemented');
	};

	BasePoint.prototype.validate = function validate() {
	  return this.curve.validate(this);
	};

	BaseCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
	  bytes = utils_1$1.toArray(bytes, enc);

	  var len = this.p.byteLength();

	  // uncompressed, hybrid-odd, hybrid-even
	  if ((bytes[0] === 0x04 || bytes[0] === 0x06 || bytes[0] === 0x07) &&
	      bytes.length - 1 === 2 * len) {
	    if (bytes[0] === 0x06)
	      assert$1(bytes[bytes.length - 1] % 2 === 0);
	    else if (bytes[0] === 0x07)
	      assert$1(bytes[bytes.length - 1] % 2 === 1);

	    var res =  this.point(bytes.slice(1, 1 + len),
	      bytes.slice(1 + len, 1 + 2 * len));

	    return res;
	  } else if ((bytes[0] === 0x02 || bytes[0] === 0x03) &&
	              bytes.length - 1 === len) {
	    return this.pointFromX(bytes.slice(1, 1 + len), bytes[0] === 0x03);
	  }
	  throw new Error('Unknown point format');
	};

	BasePoint.prototype.encodeCompressed = function encodeCompressed(enc) {
	  return this.encode(enc, true);
	};

	BasePoint.prototype._encode = function _encode(compact) {
	  var len = this.curve.p.byteLength();
	  var x = this.getX().toArray('be', len);

	  if (compact)
	    return [ this.getY().isEven() ? 0x02 : 0x03 ].concat(x);

	  return [ 0x04 ].concat(x, this.getY().toArray('be', len));
	};

	BasePoint.prototype.encode = function encode(enc, compact) {
	  return utils_1$1.encode(this._encode(compact), enc);
	};

	BasePoint.prototype.precompute = function precompute(power) {
	  if (this.precomputed)
	    return this;

	  var precomputed = {
	    doubles: null,
	    naf: null,
	    beta: null,
	  };
	  precomputed.naf = this._getNAFPoints(8);
	  precomputed.doubles = this._getDoubles(4, power);
	  precomputed.beta = this._getBeta();
	  this.precomputed = precomputed;

	  return this;
	};

	BasePoint.prototype._hasDoubles = function _hasDoubles(k) {
	  if (!this.precomputed)
	    return false;

	  var doubles = this.precomputed.doubles;
	  if (!doubles)
	    return false;

	  return doubles.points.length >= Math.ceil((k.bitLength() + 1) / doubles.step);
	};

	BasePoint.prototype._getDoubles = function _getDoubles(step, power) {
	  if (this.precomputed && this.precomputed.doubles)
	    return this.precomputed.doubles;

	  var doubles = [ this ];
	  var acc = this;
	  for (var i = 0; i < power; i += step) {
	    for (var j = 0; j < step; j++)
	      acc = acc.dbl();
	    doubles.push(acc);
	  }
	  return {
	    step: step,
	    points: doubles,
	  };
	};

	BasePoint.prototype._getNAFPoints = function _getNAFPoints(wnd) {
	  if (this.precomputed && this.precomputed.naf)
	    return this.precomputed.naf;

	  var res = [ this ];
	  var max = (1 << wnd) - 1;
	  var dbl = max === 1 ? null : this.dbl();
	  for (var i = 1; i < max; i++)
	    res[i] = res[i - 1].add(dbl);
	  return {
	    wnd: wnd,
	    points: res,
	  };
	};

	BasePoint.prototype._getBeta = function _getBeta() {
	  return null;
	};

	BasePoint.prototype.dblp = function dblp(k) {
	  var r = this;
	  for (var i = 0; i < k; i++)
	    r = r.dbl();
	  return r;
	};

	var inherits_browser = createCommonjsModule(function (module) {
	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      ctor.prototype = Object.create(superCtor.prototype, {
	        constructor: {
	          value: ctor,
	          enumerable: false,
	          writable: true,
	          configurable: true
	        }
	      });
	    }
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      var TempCtor = function () {};
	      TempCtor.prototype = superCtor.prototype;
	      ctor.prototype = new TempCtor();
	      ctor.prototype.constructor = ctor;
	    }
	  };
	}
	});






	var assert$2 = utils_1$1.assert;

	function ShortCurve(conf) {
	  base.call(this, 'short', conf);

	  this.a = new bn(conf.a, 16).toRed(this.red);
	  this.b = new bn(conf.b, 16).toRed(this.red);
	  this.tinv = this.two.redInvm();

	  this.zeroA = this.a.fromRed().cmpn(0) === 0;
	  this.threeA = this.a.fromRed().sub(this.p).cmpn(-3) === 0;

	  // If the curve is endomorphic, precalculate beta and lambda
	  this.endo = this._getEndomorphism(conf);
	  this._endoWnafT1 = new Array(4);
	  this._endoWnafT2 = new Array(4);
	}
	inherits_browser(ShortCurve, base);
	var short_1 = ShortCurve;

	ShortCurve.prototype._getEndomorphism = function _getEndomorphism(conf) {
	  // No efficient endomorphism
	  if (!this.zeroA || !this.g || !this.n || this.p.modn(3) !== 1)
	    return;

	  // Compute beta and lambda, that lambda * P = (beta * Px; Py)
	  var beta;
	  var lambda;
	  if (conf.beta) {
	    beta = new bn(conf.beta, 16).toRed(this.red);
	  } else {
	    var betas = this._getEndoRoots(this.p);
	    // Choose the smallest beta
	    beta = betas[0].cmp(betas[1]) < 0 ? betas[0] : betas[1];
	    beta = beta.toRed(this.red);
	  }
	  if (conf.lambda) {
	    lambda = new bn(conf.lambda, 16);
	  } else {
	    // Choose the lambda that is matching selected beta
	    var lambdas = this._getEndoRoots(this.n);
	    if (this.g.mul(lambdas[0]).x.cmp(this.g.x.redMul(beta)) === 0) {
	      lambda = lambdas[0];
	    } else {
	      lambda = lambdas[1];
	      assert$2(this.g.mul(lambda).x.cmp(this.g.x.redMul(beta)) === 0);
	    }
	  }

	  // Get basis vectors, used for balanced length-two representation
	  var basis;
	  if (conf.basis) {
	    basis = conf.basis.map(function(vec) {
	      return {
	        a: new bn(vec.a, 16),
	        b: new bn(vec.b, 16),
	      };
	    });
	  } else {
	    basis = this._getEndoBasis(lambda);
	  }

	  return {
	    beta: beta,
	    lambda: lambda,
	    basis: basis,
	  };
	};

	ShortCurve.prototype._getEndoRoots = function _getEndoRoots(num) {
	  // Find roots of for x^2 + x + 1 in F
	  // Root = (-1 +- Sqrt(-3)) / 2
	  //
	  var red = num === this.p ? this.red : bn.mont(num);
	  var tinv = new bn(2).toRed(red).redInvm();
	  var ntinv = tinv.redNeg();

	  var s = new bn(3).toRed(red).redNeg().redSqrt().redMul(tinv);

	  var l1 = ntinv.redAdd(s).fromRed();
	  var l2 = ntinv.redSub(s).fromRed();
	  return [ l1, l2 ];
	};

	ShortCurve.prototype._getEndoBasis = function _getEndoBasis(lambda) {
	  // aprxSqrt >= sqrt(this.n)
	  var aprxSqrt = this.n.ushrn(Math.floor(this.n.bitLength() / 2));

	  // 3.74
	  // Run EGCD, until r(L + 1) < aprxSqrt
	  var u = lambda;
	  var v = this.n.clone();
	  var x1 = new bn(1);
	  var y1 = new bn(0);
	  var x2 = new bn(0);
	  var y2 = new bn(1);

	  // NOTE: all vectors are roots of: a + b * lambda = 0 (mod n)
	  var a0;
	  var b0;
	  // First vector
	  var a1;
	  var b1;
	  // Second vector
	  var a2;
	  var b2;

	  var prevR;
	  var i = 0;
	  var r;
	  var x;
	  while (u.cmpn(0) !== 0) {
	    var q = v.div(u);
	    r = v.sub(q.mul(u));
	    x = x2.sub(q.mul(x1));
	    var y = y2.sub(q.mul(y1));

	    if (!a1 && r.cmp(aprxSqrt) < 0) {
	      a0 = prevR.neg();
	      b0 = x1;
	      a1 = r.neg();
	      b1 = x;
	    } else if (a1 && ++i === 2) {
	      break;
	    }
	    prevR = r;

	    v = u;
	    u = r;
	    x2 = x1;
	    x1 = x;
	    y2 = y1;
	    y1 = y;
	  }
	  a2 = r.neg();
	  b2 = x;

	  var len1 = a1.sqr().add(b1.sqr());
	  var len2 = a2.sqr().add(b2.sqr());
	  if (len2.cmp(len1) >= 0) {
	    a2 = a0;
	    b2 = b0;
	  }

	  // Normalize signs
	  if (a1.negative) {
	    a1 = a1.neg();
	    b1 = b1.neg();
	  }
	  if (a2.negative) {
	    a2 = a2.neg();
	    b2 = b2.neg();
	  }

	  return [
	    { a: a1, b: b1 },
	    { a: a2, b: b2 },
	  ];
	};

	ShortCurve.prototype._endoSplit = function _endoSplit(k) {
	  var basis = this.endo.basis;
	  var v1 = basis[0];
	  var v2 = basis[1];

	  var c1 = v2.b.mul(k).divRound(this.n);
	  var c2 = v1.b.neg().mul(k).divRound(this.n);

	  var p1 = c1.mul(v1.a);
	  var p2 = c2.mul(v2.a);
	  var q1 = c1.mul(v1.b);
	  var q2 = c2.mul(v2.b);

	  // Calculate answer
	  var k1 = k.sub(p1).sub(p2);
	  var k2 = q1.add(q2).neg();
	  return { k1: k1, k2: k2 };
	};

	ShortCurve.prototype.pointFromX = function pointFromX(x, odd) {
	  x = new bn(x, 16);
	  if (!x.red)
	    x = x.toRed(this.red);

	  var y2 = x.redSqr().redMul(x).redIAdd(x.redMul(this.a)).redIAdd(this.b);
	  var y = y2.redSqrt();
	  if (y.redSqr().redSub(y2).cmp(this.zero) !== 0)
	    throw new Error('invalid point');

	  // XXX Is there any way to tell if the number is odd without converting it
	  // to non-red form?
	  var isOdd = y.fromRed().isOdd();
	  if (odd && !isOdd || !odd && isOdd)
	    y = y.redNeg();

	  return this.point(x, y);
	};

	ShortCurve.prototype.validate = function validate(point) {
	  if (point.inf)
	    return true;

	  var x = point.x;
	  var y = point.y;

	  var ax = this.a.redMul(x);
	  var rhs = x.redSqr().redMul(x).redIAdd(ax).redIAdd(this.b);
	  return y.redSqr().redISub(rhs).cmpn(0) === 0;
	};

	ShortCurve.prototype._endoWnafMulAdd =
	    function _endoWnafMulAdd(points, coeffs, jacobianResult) {
	      var npoints = this._endoWnafT1;
	      var ncoeffs = this._endoWnafT2;
	      for (var i = 0; i < points.length; i++) {
	        var split = this._endoSplit(coeffs[i]);
	        var p = points[i];
	        var beta = p._getBeta();

	        if (split.k1.negative) {
	          split.k1.ineg();
	          p = p.neg(true);
	        }
	        if (split.k2.negative) {
	          split.k2.ineg();
	          beta = beta.neg(true);
	        }

	        npoints[i * 2] = p;
	        npoints[i * 2 + 1] = beta;
	        ncoeffs[i * 2] = split.k1;
	        ncoeffs[i * 2 + 1] = split.k2;
	      }
	      var res = this._wnafMulAdd(1, npoints, ncoeffs, i * 2, jacobianResult);

	      // Clean-up references to points and coefficients
	      for (var j = 0; j < i * 2; j++) {
	        npoints[j] = null;
	        ncoeffs[j] = null;
	      }
	      return res;
	    };

	function Point(curve, x, y, isRed) {
	  base.BasePoint.call(this, curve, 'affine');
	  if (x === null && y === null) {
	    this.x = null;
	    this.y = null;
	    this.inf = true;
	  } else {
	    this.x = new bn(x, 16);
	    this.y = new bn(y, 16);
	    // Force redgomery representation when loading from JSON
	    if (isRed) {
	      this.x.forceRed(this.curve.red);
	      this.y.forceRed(this.curve.red);
	    }
	    if (!this.x.red)
	      this.x = this.x.toRed(this.curve.red);
	    if (!this.y.red)
	      this.y = this.y.toRed(this.curve.red);
	    this.inf = false;
	  }
	}
	inherits_browser(Point, base.BasePoint);

	ShortCurve.prototype.point = function point(x, y, isRed) {
	  return new Point(this, x, y, isRed);
	};

	ShortCurve.prototype.pointFromJSON = function pointFromJSON(obj, red) {
	  return Point.fromJSON(this, obj, red);
	};

	Point.prototype._getBeta = function _getBeta() {
	  if (!this.curve.endo)
	    return;

	  var pre = this.precomputed;
	  if (pre && pre.beta)
	    return pre.beta;

	  var beta = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y);
	  if (pre) {
	    var curve = this.curve;
	    var endoMul = function(p) {
	      return curve.point(p.x.redMul(curve.endo.beta), p.y);
	    };
	    pre.beta = beta;
	    beta.precomputed = {
	      beta: null,
	      naf: pre.naf && {
	        wnd: pre.naf.wnd,
	        points: pre.naf.points.map(endoMul),
	      },
	      doubles: pre.doubles && {
	        step: pre.doubles.step,
	        points: pre.doubles.points.map(endoMul),
	      },
	    };
	  }
	  return beta;
	};

	Point.prototype.toJSON = function toJSON() {
	  if (!this.precomputed)
	    return [ this.x, this.y ];

	  return [ this.x, this.y, this.precomputed && {
	    doubles: this.precomputed.doubles && {
	      step: this.precomputed.doubles.step,
	      points: this.precomputed.doubles.points.slice(1),
	    },
	    naf: this.precomputed.naf && {
	      wnd: this.precomputed.naf.wnd,
	      points: this.precomputed.naf.points.slice(1),
	    },
	  } ];
	};

	Point.fromJSON = function fromJSON(curve, obj, red) {
	  if (typeof obj === 'string')
	    obj = JSON.parse(obj);
	  var res = curve.point(obj[0], obj[1], red);
	  if (!obj[2])
	    return res;

	  function obj2point(obj) {
	    return curve.point(obj[0], obj[1], red);
	  }

	  var pre = obj[2];
	  res.precomputed = {
	    beta: null,
	    doubles: pre.doubles && {
	      step: pre.doubles.step,
	      points: [ res ].concat(pre.doubles.points.map(obj2point)),
	    },
	    naf: pre.naf && {
	      wnd: pre.naf.wnd,
	      points: [ res ].concat(pre.naf.points.map(obj2point)),
	    },
	  };
	  return res;
	};

	Point.prototype.inspect = function inspect() {
	  if (this.isInfinity())
	    return '<EC Point Infinity>';
	  return '<EC Point x: ' + this.x.fromRed().toString(16, 2) +
	      ' y: ' + this.y.fromRed().toString(16, 2) + '>';
	};

	Point.prototype.isInfinity = function isInfinity() {
	  return this.inf;
	};

	Point.prototype.add = function add(p) {
	  // O + P = P
	  if (this.inf)
	    return p;

	  // P + O = P
	  if (p.inf)
	    return this;

	  // P + P = 2P
	  if (this.eq(p))
	    return this.dbl();

	  // P + (-P) = O
	  if (this.neg().eq(p))
	    return this.curve.point(null, null);

	  // P + Q = O
	  if (this.x.cmp(p.x) === 0)
	    return this.curve.point(null, null);

	  var c = this.y.redSub(p.y);
	  if (c.cmpn(0) !== 0)
	    c = c.redMul(this.x.redSub(p.x).redInvm());
	  var nx = c.redSqr().redISub(this.x).redISub(p.x);
	  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
	  return this.curve.point(nx, ny);
	};

	Point.prototype.dbl = function dbl() {
	  if (this.inf)
	    return this;

	  // 2P = O
	  var ys1 = this.y.redAdd(this.y);
	  if (ys1.cmpn(0) === 0)
	    return this.curve.point(null, null);

	  var a = this.curve.a;

	  var x2 = this.x.redSqr();
	  var dyinv = ys1.redInvm();
	  var c = x2.redAdd(x2).redIAdd(x2).redIAdd(a).redMul(dyinv);

	  var nx = c.redSqr().redISub(this.x.redAdd(this.x));
	  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
	  return this.curve.point(nx, ny);
	};

	Point.prototype.getX = function getX() {
	  return this.x.fromRed();
	};

	Point.prototype.getY = function getY() {
	  return this.y.fromRed();
	};

	Point.prototype.mul = function mul(k) {
	  k = new bn(k, 16);
	  if (this.isInfinity())
	    return this;
	  else if (this._hasDoubles(k))
	    return this.curve._fixedNafMul(this, k);
	  else if (this.curve.endo)
	    return this.curve._endoWnafMulAdd([ this ], [ k ]);
	  else
	    return this.curve._wnafMul(this, k);
	};

	Point.prototype.mulAdd = function mulAdd(k1, p2, k2) {
	  var points = [ this, p2 ];
	  var coeffs = [ k1, k2 ];
	  if (this.curve.endo)
	    return this.curve._endoWnafMulAdd(points, coeffs);
	  else
	    return this.curve._wnafMulAdd(1, points, coeffs, 2);
	};

	Point.prototype.jmulAdd = function jmulAdd(k1, p2, k2) {
	  var points = [ this, p2 ];
	  var coeffs = [ k1, k2 ];
	  if (this.curve.endo)
	    return this.curve._endoWnafMulAdd(points, coeffs, true);
	  else
	    return this.curve._wnafMulAdd(1, points, coeffs, 2, true);
	};

	Point.prototype.eq = function eq(p) {
	  return this === p ||
	         this.inf === p.inf &&
	             (this.inf || this.x.cmp(p.x) === 0 && this.y.cmp(p.y) === 0);
	};

	Point.prototype.neg = function neg(_precompute) {
	  if (this.inf)
	    return this;

	  var res = this.curve.point(this.x, this.y.redNeg());
	  if (_precompute && this.precomputed) {
	    var pre = this.precomputed;
	    var negate = function(p) {
	      return p.neg();
	    };
	    res.precomputed = {
	      naf: pre.naf && {
	        wnd: pre.naf.wnd,
	        points: pre.naf.points.map(negate),
	      },
	      doubles: pre.doubles && {
	        step: pre.doubles.step,
	        points: pre.doubles.points.map(negate),
	      },
	    };
	  }
	  return res;
	};

	Point.prototype.toJ = function toJ() {
	  if (this.inf)
	    return this.curve.jpoint(null, null, null);

	  var res = this.curve.jpoint(this.x, this.y, this.curve.one);
	  return res;
	};

	function JPoint(curve, x, y, z) {
	  base.BasePoint.call(this, curve, 'jacobian');
	  if (x === null && y === null && z === null) {
	    this.x = this.curve.one;
	    this.y = this.curve.one;
	    this.z = new bn(0);
	  } else {
	    this.x = new bn(x, 16);
	    this.y = new bn(y, 16);
	    this.z = new bn(z, 16);
	  }
	  if (!this.x.red)
	    this.x = this.x.toRed(this.curve.red);
	  if (!this.y.red)
	    this.y = this.y.toRed(this.curve.red);
	  if (!this.z.red)
	    this.z = this.z.toRed(this.curve.red);

	  this.zOne = this.z === this.curve.one;
	}
	inherits_browser(JPoint, base.BasePoint);

	ShortCurve.prototype.jpoint = function jpoint(x, y, z) {
	  return new JPoint(this, x, y, z);
	};

	JPoint.prototype.toP = function toP() {
	  if (this.isInfinity())
	    return this.curve.point(null, null);

	  var zinv = this.z.redInvm();
	  var zinv2 = zinv.redSqr();
	  var ax = this.x.redMul(zinv2);
	  var ay = this.y.redMul(zinv2).redMul(zinv);

	  return this.curve.point(ax, ay);
	};

	JPoint.prototype.neg = function neg() {
	  return this.curve.jpoint(this.x, this.y.redNeg(), this.z);
	};

	JPoint.prototype.add = function add(p) {
	  // O + P = P
	  if (this.isInfinity())
	    return p;

	  // P + O = P
	  if (p.isInfinity())
	    return this;

	  // 12M + 4S + 7A
	  var pz2 = p.z.redSqr();
	  var z2 = this.z.redSqr();
	  var u1 = this.x.redMul(pz2);
	  var u2 = p.x.redMul(z2);
	  var s1 = this.y.redMul(pz2.redMul(p.z));
	  var s2 = p.y.redMul(z2.redMul(this.z));

	  var h = u1.redSub(u2);
	  var r = s1.redSub(s2);
	  if (h.cmpn(0) === 0) {
	    if (r.cmpn(0) !== 0)
	      return this.curve.jpoint(null, null, null);
	    else
	      return this.dbl();
	  }

	  var h2 = h.redSqr();
	  var h3 = h2.redMul(h);
	  var v = u1.redMul(h2);

	  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
	  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
	  var nz = this.z.redMul(p.z).redMul(h);

	  return this.curve.jpoint(nx, ny, nz);
	};

	JPoint.prototype.mixedAdd = function mixedAdd(p) {
	  // O + P = P
	  if (this.isInfinity())
	    return p.toJ();

	  // P + O = P
	  if (p.isInfinity())
	    return this;

	  // 8M + 3S + 7A
	  var z2 = this.z.redSqr();
	  var u1 = this.x;
	  var u2 = p.x.redMul(z2);
	  var s1 = this.y;
	  var s2 = p.y.redMul(z2).redMul(this.z);

	  var h = u1.redSub(u2);
	  var r = s1.redSub(s2);
	  if (h.cmpn(0) === 0) {
	    if (r.cmpn(0) !== 0)
	      return this.curve.jpoint(null, null, null);
	    else
	      return this.dbl();
	  }

	  var h2 = h.redSqr();
	  var h3 = h2.redMul(h);
	  var v = u1.redMul(h2);

	  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
	  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
	  var nz = this.z.redMul(h);

	  return this.curve.jpoint(nx, ny, nz);
	};

	JPoint.prototype.dblp = function dblp(pow) {
	  if (pow === 0)
	    return this;
	  if (this.isInfinity())
	    return this;
	  if (!pow)
	    return this.dbl();

	  var i;
	  if (this.curve.zeroA || this.curve.threeA) {
	    var r = this;
	    for (i = 0; i < pow; i++)
	      r = r.dbl();
	    return r;
	  }

	  // 1M + 2S + 1A + N * (4S + 5M + 8A)
	  // N = 1 => 6M + 6S + 9A
	  var a = this.curve.a;
	  var tinv = this.curve.tinv;

	  var jx = this.x;
	  var jy = this.y;
	  var jz = this.z;
	  var jz4 = jz.redSqr().redSqr();

	  // Reuse results
	  var jyd = jy.redAdd(jy);
	  for (i = 0; i < pow; i++) {
	    var jx2 = jx.redSqr();
	    var jyd2 = jyd.redSqr();
	    var jyd4 = jyd2.redSqr();
	    var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

	    var t1 = jx.redMul(jyd2);
	    var nx = c.redSqr().redISub(t1.redAdd(t1));
	    var t2 = t1.redISub(nx);
	    var dny = c.redMul(t2);
	    dny = dny.redIAdd(dny).redISub(jyd4);
	    var nz = jyd.redMul(jz);
	    if (i + 1 < pow)
	      jz4 = jz4.redMul(jyd4);

	    jx = nx;
	    jz = nz;
	    jyd = dny;
	  }

	  return this.curve.jpoint(jx, jyd.redMul(tinv), jz);
	};

	JPoint.prototype.dbl = function dbl() {
	  if (this.isInfinity())
	    return this;

	  if (this.curve.zeroA)
	    return this._zeroDbl();
	  else if (this.curve.threeA)
	    return this._threeDbl();
	  else
	    return this._dbl();
	};

	JPoint.prototype._zeroDbl = function _zeroDbl() {
	  var nx;
	  var ny;
	  var nz;
	  // Z = 1
	  if (this.zOne) {
	    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
	    //     #doubling-mdbl-2007-bl
	    // 1M + 5S + 14A

	    // XX = X1^2
	    var xx = this.x.redSqr();
	    // YY = Y1^2
	    var yy = this.y.redSqr();
	    // YYYY = YY^2
	    var yyyy = yy.redSqr();
	    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
	    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
	    s = s.redIAdd(s);
	    // M = 3 * XX + a; a = 0
	    var m = xx.redAdd(xx).redIAdd(xx);
	    // T = M ^ 2 - 2*S
	    var t = m.redSqr().redISub(s).redISub(s);

	    // 8 * YYYY
	    var yyyy8 = yyyy.redIAdd(yyyy);
	    yyyy8 = yyyy8.redIAdd(yyyy8);
	    yyyy8 = yyyy8.redIAdd(yyyy8);

	    // X3 = T
	    nx = t;
	    // Y3 = M * (S - T) - 8 * YYYY
	    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
	    // Z3 = 2*Y1
	    nz = this.y.redAdd(this.y);
	  } else {
	    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
	    //     #doubling-dbl-2009-l
	    // 2M + 5S + 13A

	    // A = X1^2
	    var a = this.x.redSqr();
	    // B = Y1^2
	    var b = this.y.redSqr();
	    // C = B^2
	    var c = b.redSqr();
	    // D = 2 * ((X1 + B)^2 - A - C)
	    var d = this.x.redAdd(b).redSqr().redISub(a).redISub(c);
	    d = d.redIAdd(d);
	    // E = 3 * A
	    var e = a.redAdd(a).redIAdd(a);
	    // F = E^2
	    var f = e.redSqr();

	    // 8 * C
	    var c8 = c.redIAdd(c);
	    c8 = c8.redIAdd(c8);
	    c8 = c8.redIAdd(c8);

	    // X3 = F - 2 * D
	    nx = f.redISub(d).redISub(d);
	    // Y3 = E * (D - X3) - 8 * C
	    ny = e.redMul(d.redISub(nx)).redISub(c8);
	    // Z3 = 2 * Y1 * Z1
	    nz = this.y.redMul(this.z);
	    nz = nz.redIAdd(nz);
	  }

	  return this.curve.jpoint(nx, ny, nz);
	};

	JPoint.prototype._threeDbl = function _threeDbl() {
	  var nx;
	  var ny;
	  var nz;
	  // Z = 1
	  if (this.zOne) {
	    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html
	    //     #doubling-mdbl-2007-bl
	    // 1M + 5S + 15A

	    // XX = X1^2
	    var xx = this.x.redSqr();
	    // YY = Y1^2
	    var yy = this.y.redSqr();
	    // YYYY = YY^2
	    var yyyy = yy.redSqr();
	    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
	    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
	    s = s.redIAdd(s);
	    // M = 3 * XX + a
	    var m = xx.redAdd(xx).redIAdd(xx).redIAdd(this.curve.a);
	    // T = M^2 - 2 * S
	    var t = m.redSqr().redISub(s).redISub(s);
	    // X3 = T
	    nx = t;
	    // Y3 = M * (S - T) - 8 * YYYY
	    var yyyy8 = yyyy.redIAdd(yyyy);
	    yyyy8 = yyyy8.redIAdd(yyyy8);
	    yyyy8 = yyyy8.redIAdd(yyyy8);
	    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
	    // Z3 = 2 * Y1
	    nz = this.y.redAdd(this.y);
	  } else {
	    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#doubling-dbl-2001-b
	    // 3M + 5S

	    // delta = Z1^2
	    var delta = this.z.redSqr();
	    // gamma = Y1^2
	    var gamma = this.y.redSqr();
	    // beta = X1 * gamma
	    var beta = this.x.redMul(gamma);
	    // alpha = 3 * (X1 - delta) * (X1 + delta)
	    var alpha = this.x.redSub(delta).redMul(this.x.redAdd(delta));
	    alpha = alpha.redAdd(alpha).redIAdd(alpha);
	    // X3 = alpha^2 - 8 * beta
	    var beta4 = beta.redIAdd(beta);
	    beta4 = beta4.redIAdd(beta4);
	    var beta8 = beta4.redAdd(beta4);
	    nx = alpha.redSqr().redISub(beta8);
	    // Z3 = (Y1 + Z1)^2 - gamma - delta
	    nz = this.y.redAdd(this.z).redSqr().redISub(gamma).redISub(delta);
	    // Y3 = alpha * (4 * beta - X3) - 8 * gamma^2
	    var ggamma8 = gamma.redSqr();
	    ggamma8 = ggamma8.redIAdd(ggamma8);
	    ggamma8 = ggamma8.redIAdd(ggamma8);
	    ggamma8 = ggamma8.redIAdd(ggamma8);
	    ny = alpha.redMul(beta4.redISub(nx)).redISub(ggamma8);
	  }

	  return this.curve.jpoint(nx, ny, nz);
	};

	JPoint.prototype._dbl = function _dbl() {
	  var a = this.curve.a;

	  // 4M + 6S + 10A
	  var jx = this.x;
	  var jy = this.y;
	  var jz = this.z;
	  var jz4 = jz.redSqr().redSqr();

	  var jx2 = jx.redSqr();
	  var jy2 = jy.redSqr();

	  var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

	  var jxd4 = jx.redAdd(jx);
	  jxd4 = jxd4.redIAdd(jxd4);
	  var t1 = jxd4.redMul(jy2);
	  var nx = c.redSqr().redISub(t1.redAdd(t1));
	  var t2 = t1.redISub(nx);

	  var jyd8 = jy2.redSqr();
	  jyd8 = jyd8.redIAdd(jyd8);
	  jyd8 = jyd8.redIAdd(jyd8);
	  jyd8 = jyd8.redIAdd(jyd8);
	  var ny = c.redMul(t2).redISub(jyd8);
	  var nz = jy.redAdd(jy).redMul(jz);

	  return this.curve.jpoint(nx, ny, nz);
	};

	JPoint.prototype.trpl = function trpl() {
	  if (!this.curve.zeroA)
	    return this.dbl().add(this);

	  // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#tripling-tpl-2007-bl
	  // 5M + 10S + ...

	  // XX = X1^2
	  var xx = this.x.redSqr();
	  // YY = Y1^2
	  var yy = this.y.redSqr();
	  // ZZ = Z1^2
	  var zz = this.z.redSqr();
	  // YYYY = YY^2
	  var yyyy = yy.redSqr();
	  // M = 3 * XX + a * ZZ2; a = 0
	  var m = xx.redAdd(xx).redIAdd(xx);
	  // MM = M^2
	  var mm = m.redSqr();
	  // E = 6 * ((X1 + YY)^2 - XX - YYYY) - MM
	  var e = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
	  e = e.redIAdd(e);
	  e = e.redAdd(e).redIAdd(e);
	  e = e.redISub(mm);
	  // EE = E^2
	  var ee = e.redSqr();
	  // T = 16*YYYY
	  var t = yyyy.redIAdd(yyyy);
	  t = t.redIAdd(t);
	  t = t.redIAdd(t);
	  t = t.redIAdd(t);
	  // U = (M + E)^2 - MM - EE - T
	  var u = m.redIAdd(e).redSqr().redISub(mm).redISub(ee).redISub(t);
	  // X3 = 4 * (X1 * EE - 4 * YY * U)
	  var yyu4 = yy.redMul(u);
	  yyu4 = yyu4.redIAdd(yyu4);
	  yyu4 = yyu4.redIAdd(yyu4);
	  var nx = this.x.redMul(ee).redISub(yyu4);
	  nx = nx.redIAdd(nx);
	  nx = nx.redIAdd(nx);
	  // Y3 = 8 * Y1 * (U * (T - U) - E * EE)
	  var ny = this.y.redMul(u.redMul(t.redISub(u)).redISub(e.redMul(ee)));
	  ny = ny.redIAdd(ny);
	  ny = ny.redIAdd(ny);
	  ny = ny.redIAdd(ny);
	  // Z3 = (Z1 + E)^2 - ZZ - EE
	  var nz = this.z.redAdd(e).redSqr().redISub(zz).redISub(ee);

	  return this.curve.jpoint(nx, ny, nz);
	};

	JPoint.prototype.mul = function mul(k, kbase) {
	  k = new bn(k, kbase);

	  return this.curve._wnafMul(this, k);
	};

	JPoint.prototype.eq = function eq(p) {
	  if (p.type === 'affine')
	    return this.eq(p.toJ());

	  if (this === p)
	    return true;

	  // x1 * z2^2 == x2 * z1^2
	  var z2 = this.z.redSqr();
	  var pz2 = p.z.redSqr();
	  if (this.x.redMul(pz2).redISub(p.x.redMul(z2)).cmpn(0) !== 0)
	    return false;

	  // y1 * z2^3 == y2 * z1^3
	  var z3 = z2.redMul(this.z);
	  var pz3 = pz2.redMul(p.z);
	  return this.y.redMul(pz3).redISub(p.y.redMul(z3)).cmpn(0) === 0;
	};

	JPoint.prototype.eqXToP = function eqXToP(x) {
	  var zs = this.z.redSqr();
	  var rx = x.toRed(this.curve.red).redMul(zs);
	  if (this.x.cmp(rx) === 0)
	    return true;

	  var xc = x.clone();
	  var t = this.curve.redN.redMul(zs);
	  for (;;) {
	    xc.iadd(this.curve.n);
	    if (xc.cmp(this.curve.p) >= 0)
	      return false;

	    rx.redIAdd(t);
	    if (this.x.cmp(rx) === 0)
	      return true;
	  }
	};

	JPoint.prototype.inspect = function inspect() {
	  if (this.isInfinity())
	    return '<EC JPoint Infinity>';
	  return '<EC JPoint x: ' + this.x.toString(16, 2) +
	      ' y: ' + this.y.toString(16, 2) +
	      ' z: ' + this.z.toString(16, 2) + '>';
	};

	JPoint.prototype.isInfinity = function isInfinity() {
	  // XXX This code assumes that zero is always zero in red
	  return this.z.cmpn(0) === 0;
	};

	var curve_1 = createCommonjsModule(function (module, exports) {

	var curve = exports;

	curve.base = base;
	curve.short = short_1;
	curve.mont = /*RicMoo:ethers:require(./mont)*/(null);
	curve.edwards = /*RicMoo:ethers:require(./edwards)*/(null);
	});

	var curves_1 = createCommonjsModule(function (module, exports) {

	var curves = exports;





	var assert = utils_1$1.assert;

	function PresetCurve(options) {
	  if (options.type === 'short')
	    this.curve = new curve_1.short(options);
	  else if (options.type === 'edwards')
	    this.curve = new curve_1.edwards(options);
	  else
	    this.curve = new curve_1.mont(options);
	  this.g = this.curve.g;
	  this.n = this.curve.n;
	  this.hash = options.hash;

	  assert(this.g.validate(), 'Invalid curve');
	  assert(this.g.mul(this.n).isInfinity(), 'Invalid curve, G*N != O');
	}
	curves.PresetCurve = PresetCurve;

	function defineCurve(name, options) {
	  Object.defineProperty(curves, name, {
	    configurable: true,
	    enumerable: true,
	    get: function() {
	      var curve = new PresetCurve(options);
	      Object.defineProperty(curves, name, {
	        configurable: true,
	        enumerable: true,
	        value: curve,
	      });
	      return curve;
	    },
	  });
	}

	defineCurve('p192', {
	  type: 'short',
	  prime: 'p192',
	  p: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff',
	  a: 'ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc',
	  b: '64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1',
	  n: 'ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831',
	  hash: hash.sha256,
	  gRed: false,
	  g: [
	    '188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012',
	    '07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811',
	  ],
	});

	defineCurve('p224', {
	  type: 'short',
	  prime: 'p224',
	  p: 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001',
	  a: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe',
	  b: 'b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4',
	  n: 'ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d',
	  hash: hash.sha256,
	  gRed: false,
	  g: [
	    'b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21',
	    'bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34',
	  ],
	});

	defineCurve('p256', {
	  type: 'short',
	  prime: null,
	  p: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff',
	  a: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc',
	  b: '5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b',
	  n: 'ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551',
	  hash: hash.sha256,
	  gRed: false,
	  g: [
	    '6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296',
	    '4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5',
	  ],
	});

	defineCurve('p384', {
	  type: 'short',
	  prime: null,
	  p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
	     'fffffffe ffffffff 00000000 00000000 ffffffff',
	  a: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
	     'fffffffe ffffffff 00000000 00000000 fffffffc',
	  b: 'b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f ' +
	     '5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef',
	  n: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 ' +
	     'f4372ddf 581a0db2 48b0a77a ecec196a ccc52973',
	  hash: hash.sha384,
	  gRed: false,
	  g: [
	    'aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 ' +
	    '5502f25d bf55296c 3a545e38 72760ab7',
	    '3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 ' +
	    '0a60b1ce 1d7e819d 7a431d7c 90ea0e5f',
	  ],
	});

	defineCurve('p521', {
	  type: 'short',
	  prime: null,
	  p: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
	     'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
	     'ffffffff ffffffff ffffffff ffffffff ffffffff',
	  a: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
	     'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
	     'ffffffff ffffffff ffffffff ffffffff fffffffc',
	  b: '00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b ' +
	     '99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd ' +
	     '3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00',
	  n: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
	     'ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 ' +
	     'f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409',
	  hash: hash.sha512,
	  gRed: false,
	  g: [
	    '000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 ' +
	    '053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 ' +
	    'a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66',
	    '00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 ' +
	    '579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 ' +
	    '3fad0761 353c7086 a272c240 88be9476 9fd16650',
	  ],
	});

	defineCurve('curve25519', {
	  type: 'mont',
	  prime: 'p25519',
	  p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
	  a: '76d06',
	  b: '1',
	  n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
	  hash: hash.sha256,
	  gRed: false,
	  g: [
	    '9',
	  ],
	});

	defineCurve('ed25519', {
	  type: 'edwards',
	  prime: 'p25519',
	  p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
	  a: '-1',
	  c: '1',
	  // -121665 * (121666^(-1)) (mod P)
	  d: '52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3',
	  n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
	  hash: hash.sha256,
	  gRed: false,
	  g: [
	    '216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a',

	    // 4/5
	    '6666666666666666666666666666666666666666666666666666666666666658',
	  ],
	});

	var pre;
	try {
	  pre = /*RicMoo:ethers:require(./precomputed/secp256k1)*/(null).crash();
	} catch (e) {
	  pre = undefined;
	}

	defineCurve('secp256k1', {
	  type: 'short',
	  prime: 'k256',
	  p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f',
	  a: '0',
	  b: '7',
	  n: 'ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141',
	  h: '1',
	  hash: hash.sha256,

	  // Precomputed endomorphism
	  beta: '7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee',
	  lambda: '5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72',
	  basis: [
	    {
	      a: '3086d221a7d46bcde86c90e49284eb15',
	      b: '-e4437ed6010e88286f547fa90abfe4c3',
	    },
	    {
	      a: '114ca50f7a8e2f3f657c1108d9d44cfd8',
	      b: '3086d221a7d46bcde86c90e49284eb15',
	    },
	  ],

	  gRed: false,
	  g: [
	    '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
	    '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
	    pre,
	  ],
	});
	});





	function HmacDRBG(options) {
	  if (!(this instanceof HmacDRBG))
	    return new HmacDRBG(options);
	  this.hash = options.hash;
	  this.predResist = !!options.predResist;

	  this.outLen = this.hash.outSize;
	  this.minEntropy = options.minEntropy || this.hash.hmacStrength;

	  this._reseed = null;
	  this.reseedInterval = null;
	  this.K = null;
	  this.V = null;

	  var entropy = utils_1.toArray(options.entropy, options.entropyEnc || 'hex');
	  var nonce = utils_1.toArray(options.nonce, options.nonceEnc || 'hex');
	  var pers = utils_1.toArray(options.pers, options.persEnc || 'hex');
	  minimalisticAssert(entropy.length >= (this.minEntropy / 8),
	         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');
	  this._init(entropy, nonce, pers);
	}
	var hmacDrbg = HmacDRBG;

	HmacDRBG.prototype._init = function init(entropy, nonce, pers) {
	  var seed = entropy.concat(nonce).concat(pers);

	  this.K = new Array(this.outLen / 8);
	  this.V = new Array(this.outLen / 8);
	  for (var i = 0; i < this.V.length; i++) {
	    this.K[i] = 0x00;
	    this.V[i] = 0x01;
	  }

	  this._update(seed);
	  this._reseed = 1;
	  this.reseedInterval = 0x1000000000000;  // 2^48
	};

	HmacDRBG.prototype._hmac = function hmac() {
	  return new hash.hmac(this.hash, this.K);
	};

	HmacDRBG.prototype._update = function update(seed) {
	  var kmac = this._hmac()
	                 .update(this.V)
	                 .update([ 0x00 ]);
	  if (seed)
	    kmac = kmac.update(seed);
	  this.K = kmac.digest();
	  this.V = this._hmac().update(this.V).digest();
	  if (!seed)
	    return;

	  this.K = this._hmac()
	               .update(this.V)
	               .update([ 0x01 ])
	               .update(seed)
	               .digest();
	  this.V = this._hmac().update(this.V).digest();
	};

	HmacDRBG.prototype.reseed = function reseed(entropy, entropyEnc, add, addEnc) {
	  // Optional entropy enc
	  if (typeof entropyEnc !== 'string') {
	    addEnc = add;
	    add = entropyEnc;
	    entropyEnc = null;
	  }

	  entropy = utils_1.toArray(entropy, entropyEnc);
	  add = utils_1.toArray(add, addEnc);

	  minimalisticAssert(entropy.length >= (this.minEntropy / 8),
	         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');

	  this._update(entropy.concat(add || []));
	  this._reseed = 1;
	};

	HmacDRBG.prototype.generate = function generate(len, enc, add, addEnc) {
	  if (this._reseed > this.reseedInterval)
	    throw new Error('Reseed is required');

	  // Optional encoding
	  if (typeof enc !== 'string') {
	    addEnc = add;
	    add = enc;
	    enc = null;
	  }

	  // Optional additional data
	  if (add) {
	    add = utils_1.toArray(add, addEnc || 'hex');
	    this._update(add);
	  }

	  var temp = [];
	  while (temp.length < len) {
	    this.V = this._hmac().update(this.V).digest();
	    temp = temp.concat(this.V);
	  }

	  var res = temp.slice(0, len);
	  this._update(add);
	  this._reseed++;
	  return utils_1.encode(res, enc);
	};



	var assert$3 = utils_1$1.assert;

	function KeyPair(ec, options) {
	  this.ec = ec;
	  this.priv = null;
	  this.pub = null;

	  // KeyPair(ec, { priv: ..., pub: ... })
	  if (options.priv)
	    this._importPrivate(options.priv, options.privEnc);
	  if (options.pub)
	    this._importPublic(options.pub, options.pubEnc);
	}
	var key = KeyPair;

	KeyPair.fromPublic = function fromPublic(ec, pub, enc) {
	  if (pub instanceof KeyPair)
	    return pub;

	  return new KeyPair(ec, {
	    pub: pub,
	    pubEnc: enc,
	  });
	};

	KeyPair.fromPrivate = function fromPrivate(ec, priv, enc) {
	  if (priv instanceof KeyPair)
	    return priv;

	  return new KeyPair(ec, {
	    priv: priv,
	    privEnc: enc,
	  });
	};

	KeyPair.prototype.validate = function validate() {
	  var pub = this.getPublic();

	  if (pub.isInfinity())
	    return { result: false, reason: 'Invalid public key' };
	  if (!pub.validate())
	    return { result: false, reason: 'Public key is not a point' };
	  if (!pub.mul(this.ec.curve.n).isInfinity())
	    return { result: false, reason: 'Public key * N != O' };

	  return { result: true, reason: null };
	};

	KeyPair.prototype.getPublic = function getPublic(compact, enc) {
	  // compact is optional argument
	  if (typeof compact === 'string') {
	    enc = compact;
	    compact = null;
	  }

	  if (!this.pub)
	    this.pub = this.ec.g.mul(this.priv);

	  if (!enc)
	    return this.pub;

	  return this.pub.encode(enc, compact);
	};

	KeyPair.prototype.getPrivate = function getPrivate(enc) {
	  if (enc === 'hex')
	    return this.priv.toString(16, 2);
	  else
	    return this.priv;
	};

	KeyPair.prototype._importPrivate = function _importPrivate(key, enc) {
	  this.priv = new bn(key, enc || 16);

	  // Ensure that the priv won't be bigger than n, otherwise we may fail
	  // in fixed multiplication method
	  this.priv = this.priv.umod(this.ec.curve.n);
	};

	KeyPair.prototype._importPublic = function _importPublic(key, enc) {
	  if (key.x || key.y) {
	    // Montgomery points only have an `x` coordinate.
	    // Weierstrass/Edwards points on the other hand have both `x` and
	    // `y` coordinates.
	    if (this.ec.curve.type === 'mont') {
	      assert$3(key.x, 'Need x coordinate');
	    } else if (this.ec.curve.type === 'short' ||
	               this.ec.curve.type === 'edwards') {
	      assert$3(key.x && key.y, 'Need both x and y coordinate');
	    }
	    this.pub = this.ec.curve.point(key.x, key.y);
	    return;
	  }
	  this.pub = this.ec.curve.decodePoint(key, enc);
	};

	// ECDH
	KeyPair.prototype.derive = function derive(pub) {
	  if(!pub.validate()) {
	    assert$3(pub.validate(), 'public point not validated');
	  }
	  return pub.mul(this.priv).getX();
	};

	// ECDSA
	KeyPair.prototype.sign = function sign(msg, enc, options) {
	  return this.ec.sign(msg, this, enc, options);
	};

	KeyPair.prototype.verify = function verify(msg, signature) {
	  return this.ec.verify(msg, signature, this);
	};

	KeyPair.prototype.inspect = function inspect() {
	  return '<Key priv: ' + (this.priv && this.priv.toString(16, 2)) +
	         ' pub: ' + (this.pub && this.pub.inspect()) + ' >';
	};




	var assert$4 = utils_1$1.assert;

	function Signature(options, enc) {
	  if (options instanceof Signature)
	    return options;

	  if (this._importDER(options, enc))
	    return;

	  assert$4(options.r && options.s, 'Signature without r or s');
	  this.r = new bn(options.r, 16);
	  this.s = new bn(options.s, 16);
	  if (options.recoveryParam === undefined)
	    this.recoveryParam = null;
	  else
	    this.recoveryParam = options.recoveryParam;
	}
	var signature = Signature;

	function Position() {
	  this.place = 0;
	}

	function getLength(buf, p) {
	  var initial = buf[p.place++];
	  if (!(initial & 0x80)) {
	    return initial;
	  }
	  var octetLen = initial & 0xf;

	  // Indefinite length or overflow
	  if (octetLen === 0 || octetLen > 4) {
	    return false;
	  }

	  var val = 0;
	  for (var i = 0, off = p.place; i < octetLen; i++, off++) {
	    val <<= 8;
	    val |= buf[off];
	    val >>>= 0;
	  }

	  // Leading zeroes
	  if (val <= 0x7f) {
	    return false;
	  }

	  p.place = off;
	  return val;
	}

	function rmPadding(buf) {
	  var i = 0;
	  var len = buf.length - 1;
	  while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
	    i++;
	  }
	  if (i === 0) {
	    return buf;
	  }
	  return buf.slice(i);
	}

	Signature.prototype._importDER = function _importDER(data, enc) {
	  data = utils_1$1.toArray(data, enc);
	  var p = new Position();
	  if (data[p.place++] !== 0x30) {
	    return false;
	  }
	  var len = getLength(data, p);
	  if (len === false) {
	    return false;
	  }
	  if ((len + p.place) !== data.length) {
	    return false;
	  }
	  if (data[p.place++] !== 0x02) {
	    return false;
	  }
	  var rlen = getLength(data, p);
	  if (rlen === false) {
	    return false;
	  }
	  var r = data.slice(p.place, rlen + p.place);
	  p.place += rlen;
	  if (data[p.place++] !== 0x02) {
	    return false;
	  }
	  var slen = getLength(data, p);
	  if (slen === false) {
	    return false;
	  }
	  if (data.length !== slen + p.place) {
	    return false;
	  }
	  var s = data.slice(p.place, slen + p.place);
	  if (r[0] === 0) {
	    if (r[1] & 0x80) {
	      r = r.slice(1);
	    } else {
	      // Leading zeroes
	      return false;
	    }
	  }
	  if (s[0] === 0) {
	    if (s[1] & 0x80) {
	      s = s.slice(1);
	    } else {
	      // Leading zeroes
	      return false;
	    }
	  }

	  this.r = new bn(r);
	  this.s = new bn(s);
	  this.recoveryParam = null;

	  return true;
	};

	function constructLength(arr, len) {
	  if (len < 0x80) {
	    arr.push(len);
	    return;
	  }
	  var octets = 1 + (Math.log(len) / Math.LN2 >>> 3);
	  arr.push(octets | 0x80);
	  while (--octets) {
	    arr.push((len >>> (octets << 3)) & 0xff);
	  }
	  arr.push(len);
	}

	Signature.prototype.toDER = function toDER(enc) {
	  var r = this.r.toArray();
	  var s = this.s.toArray();

	  // Pad values
	  if (r[0] & 0x80)
	    r = [ 0 ].concat(r);
	  // Pad values
	  if (s[0] & 0x80)
	    s = [ 0 ].concat(s);

	  r = rmPadding(r);
	  s = rmPadding(s);

	  while (!s[0] && !(s[1] & 0x80)) {
	    s = s.slice(1);
	  }
	  var arr = [ 0x02 ];
	  constructLength(arr, r.length);
	  arr = arr.concat(r);
	  arr.push(0x02);
	  constructLength(arr, s.length);
	  var backHalf = arr.concat(s);
	  var res = [ 0x30 ];
	  constructLength(res, backHalf.length);
	  res = res.concat(backHalf);
	  return utils_1$1.encode(res, enc);
	};





	var rand = /*RicMoo:ethers:require(brorand)*/(function() { throw new Error('unsupported'); });
	var assert$5 = utils_1$1.assert;




	function EC(options) {
	  if (!(this instanceof EC))
	    return new EC(options);

	  // Shortcut `elliptic.ec(curve-name)`
	  if (typeof options === 'string') {
	    assert$5(Object.prototype.hasOwnProperty.call(curves_1, options),
	      'Unknown curve ' + options);

	    options = curves_1[options];
	  }

	  // Shortcut for `elliptic.ec(elliptic.curves.curveName)`
	  if (options instanceof curves_1.PresetCurve)
	    options = { curve: options };

	  this.curve = options.curve.curve;
	  this.n = this.curve.n;
	  this.nh = this.n.ushrn(1);
	  this.g = this.curve.g;

	  // Point on curve
	  this.g = options.curve.g;
	  this.g.precompute(options.curve.n.bitLength() + 1);

	  // Hash for function for DRBG
	  this.hash = options.hash || options.curve.hash;
	}
	var ec = EC;

	EC.prototype.keyPair = function keyPair(options) {
	  return new key(this, options);
	};

	EC.prototype.keyFromPrivate = function keyFromPrivate(priv, enc) {
	  return key.fromPrivate(this, priv, enc);
	};

	EC.prototype.keyFromPublic = function keyFromPublic(pub, enc) {
	  return key.fromPublic(this, pub, enc);
	};

	EC.prototype.genKeyPair = function genKeyPair(options) {
	  if (!options)
	    options = {};

	  // Instantiate Hmac_DRBG
	  var drbg = new hmacDrbg({
	    hash: this.hash,
	    pers: options.pers,
	    persEnc: options.persEnc || 'utf8',
	    entropy: options.entropy || rand(this.hash.hmacStrength),
	    entropyEnc: options.entropy && options.entropyEnc || 'utf8',
	    nonce: this.n.toArray(),
	  });

	  var bytes = this.n.byteLength();
	  var ns2 = this.n.sub(new bn(2));
	  for (;;) {
	    var priv = new bn(drbg.generate(bytes));
	    if (priv.cmp(ns2) > 0)
	      continue;

	    priv.iaddn(1);
	    return this.keyFromPrivate(priv);
	  }
	};

	EC.prototype._truncateToN = function _truncateToN(msg, truncOnly) {
	  var delta = msg.byteLength() * 8 - this.n.bitLength();
	  if (delta > 0)
	    msg = msg.ushrn(delta);
	  if (!truncOnly && msg.cmp(this.n) >= 0)
	    return msg.sub(this.n);
	  else
	    return msg;
	};

	EC.prototype.sign = function sign(msg, key, enc, options) {
	  if (typeof enc === 'object') {
	    options = enc;
	    enc = null;
	  }
	  if (!options)
	    options = {};

	  key = this.keyFromPrivate(key, enc);
	  msg = this._truncateToN(new bn(msg, 16));

	  // Zero-extend key to provide enough entropy
	  var bytes = this.n.byteLength();
	  var bkey = key.getPrivate().toArray('be', bytes);

	  // Zero-extend nonce to have the same byte size as N
	  var nonce = msg.toArray('be', bytes);

	  // Instantiate Hmac_DRBG
	  var drbg = new hmacDrbg({
	    hash: this.hash,
	    entropy: bkey,
	    nonce: nonce,
	    pers: options.pers,
	    persEnc: options.persEnc || 'utf8',
	  });

	  // Number of bytes to generate
	  var ns1 = this.n.sub(new bn(1));

	  for (var iter = 0; ; iter++) {
	    var k = options.k ?
	      options.k(iter) :
	      new bn(drbg.generate(this.n.byteLength()));
	    k = this._truncateToN(k, true);
	    if (k.cmpn(1) <= 0 || k.cmp(ns1) >= 0)
	      continue;

	    var kp = this.g.mul(k);
	    if (kp.isInfinity())
	      continue;

	    var kpX = kp.getX();
	    var r = kpX.umod(this.n);
	    if (r.cmpn(0) === 0)
	      continue;

	    var s = k.invm(this.n).mul(r.mul(key.getPrivate()).iadd(msg));
	    s = s.umod(this.n);
	    if (s.cmpn(0) === 0)
	      continue;

	    var recoveryParam = (kp.getY().isOdd() ? 1 : 0) |
	                        (kpX.cmp(r) !== 0 ? 2 : 0);

	    // Use complement of `s`, if it is > `n / 2`
	    if (options.canonical && s.cmp(this.nh) > 0) {
	      s = this.n.sub(s);
	      recoveryParam ^= 1;
	    }

	    return new signature({ r: r, s: s, recoveryParam: recoveryParam });
	  }
	};

	EC.prototype.verify = function verify(msg, signature$1, key, enc) {
	  msg = this._truncateToN(new bn(msg, 16));
	  key = this.keyFromPublic(key, enc);
	  signature$1 = new signature(signature$1, 'hex');

	  // Perform primitive values validation
	  var r = signature$1.r;
	  var s = signature$1.s;
	  if (r.cmpn(1) < 0 || r.cmp(this.n) >= 0)
	    return false;
	  if (s.cmpn(1) < 0 || s.cmp(this.n) >= 0)
	    return false;

	  // Validate signature
	  var sinv = s.invm(this.n);
	  var u1 = sinv.mul(msg).umod(this.n);
	  var u2 = sinv.mul(r).umod(this.n);
	  var p;

	  if (!this.curve._maxwellTrick) {
	    p = this.g.mulAdd(u1, key.getPublic(), u2);
	    if (p.isInfinity())
	      return false;

	    return p.getX().umod(this.n).cmp(r) === 0;
	  }

	  // NOTE: Greg Maxwell's trick, inspired by:
	  // https://git.io/vad3K

	  p = this.g.jmulAdd(u1, key.getPublic(), u2);
	  if (p.isInfinity())
	    return false;

	  // Compare `p.x` of Jacobian point with `r`,
	  // this will do `p.x == r * p.z^2` instead of multiplying `p.x` by the
	  // inverse of `p.z^2`
	  return p.eqXToP(r);
	};

	EC.prototype.recoverPubKey = function(msg, signature$1, j, enc) {
	  assert$5((3 & j) === j, 'The recovery param is more than two bits');
	  signature$1 = new signature(signature$1, enc);

	  var n = this.n;
	  var e = new bn(msg);
	  var r = signature$1.r;
	  var s = signature$1.s;

	  // A set LSB signifies that the y-coordinate is odd
	  var isYOdd = j & 1;
	  var isSecondKey = j >> 1;
	  if (r.cmp(this.curve.p.umod(this.curve.n)) >= 0 && isSecondKey)
	    throw new Error('Unable to find sencond key candinate');

	  // 1.1. Let x = r + jn.
	  if (isSecondKey)
	    r = this.curve.pointFromX(r.add(this.curve.n), isYOdd);
	  else
	    r = this.curve.pointFromX(r, isYOdd);

	  var rInv = signature$1.r.invm(n);
	  var s1 = n.sub(e).mul(rInv).umod(n);
	  var s2 = s.mul(rInv).umod(n);

	  // 1.6.1 Compute Q = r^-1 (sR -  eG)
	  //               Q = r^-1 (sR + -eG)
	  return this.g.mulAdd(s1, r, s2);
	};

	EC.prototype.getKeyRecoveryParam = function(e, signature$1, Q, enc) {
	  signature$1 = new signature(signature$1, enc);
	  if (signature$1.recoveryParam !== null)
	    return signature$1.recoveryParam;

	  for (var i = 0; i < 4; i++) {
	    var Qprime;
	    try {
	      Qprime = this.recoverPubKey(e, signature$1, i);
	    } catch (e) {
	      continue;
	    }

	    if (Qprime.eq(Q))
	      return i;
	  }
	  throw new Error('Unable to find valid recovery factor');
	};

	var elliptic_1 = createCommonjsModule(function (module, exports) {

	var elliptic = exports;

	elliptic.version = /*RicMoo:ethers*/{ version: "6.5.4" }.version;
	elliptic.utils = utils_1$1;
	elliptic.rand = /*RicMoo:ethers:require(brorand)*/(function() { throw new Error('unsupported'); });
	elliptic.curve = curve_1;
	elliptic.curves = curves_1;

	// Protocols
	elliptic.ec = ec;
	elliptic.eddsa = /*RicMoo:ethers:require(./elliptic/eddsa)*/(null);
	});

	var EC$1 = elliptic_1.ec;

	const version$7 = "signing-key/5.7.0";

	const logger$9 = new Logger(version$7);
	let _curve = null;
	function getCurve() {
	    if (!_curve) {
	        _curve = new EC$1("secp256k1");
	    }
	    return _curve;
	}
	class SigningKey {
	    constructor(privateKey) {
	        defineReadOnly(this, "curve", "secp256k1");
	        defineReadOnly(this, "privateKey", hexlify(privateKey));
	        if (hexDataLength(this.privateKey) !== 32) {
	            logger$9.throwArgumentError("invalid private key", "privateKey", "[[ REDACTED ]]");
	        }
	        const keyPair = getCurve().keyFromPrivate(arrayify(this.privateKey));
	        defineReadOnly(this, "publicKey", "0x" + keyPair.getPublic(false, "hex"));
	        defineReadOnly(this, "compressedPublicKey", "0x" + keyPair.getPublic(true, "hex"));
	        defineReadOnly(this, "_isSigningKey", true);
	    }
	    _addPoint(other) {
	        const p0 = getCurve().keyFromPublic(arrayify(this.publicKey));
	        const p1 = getCurve().keyFromPublic(arrayify(other));
	        return "0x" + p0.pub.add(p1.pub).encodeCompressed("hex");
	    }
	    signDigest(digest) {
	        const keyPair = getCurve().keyFromPrivate(arrayify(this.privateKey));
	        const digestBytes = arrayify(digest);
	        if (digestBytes.length !== 32) {
	            logger$9.throwArgumentError("bad digest length", "digest", digest);
	        }
	        const signature = keyPair.sign(digestBytes, { canonical: true });
	        return splitSignature({
	            recoveryParam: signature.recoveryParam,
	            r: hexZeroPad("0x" + signature.r.toString(16), 32),
	            s: hexZeroPad("0x" + signature.s.toString(16), 32),
	        });
	    }
	    computeSharedSecret(otherKey) {
	        const keyPair = getCurve().keyFromPrivate(arrayify(this.privateKey));
	        const otherKeyPair = getCurve().keyFromPublic(arrayify(computePublicKey(otherKey)));
	        return hexZeroPad("0x" + keyPair.derive(otherKeyPair.getPublic()).toString(16), 32);
	    }
	    static isSigningKey(value) {
	        return !!(value && value._isSigningKey);
	    }
	}
	function recoverPublicKey(digest, signature) {
	    const sig = splitSignature(signature);
	    const rs = { r: arrayify(sig.r), s: arrayify(sig.s) };
	    return "0x" + getCurve().recoverPubKey(arrayify(digest), rs, sig.recoveryParam).encode("hex", false);
	}
	function computePublicKey(key, compressed) {
	    const bytes = arrayify(key);
	    if (bytes.length === 32) {
	        const signingKey = new SigningKey(bytes);
	        if (compressed) {
	            return "0x" + getCurve().keyFromPrivate(bytes).getPublic(true, "hex");
	        }
	        return signingKey.publicKey;
	    }
	    else if (bytes.length === 33) {
	        if (compressed) {
	            return hexlify(bytes);
	        }
	        return "0x" + getCurve().keyFromPublic(bytes).getPublic(false, "hex");
	    }
	    else if (bytes.length === 65) {
	        if (!compressed) {
	            return hexlify(bytes);
	        }
	        return "0x" + getCurve().keyFromPublic(bytes).getPublic(true, "hex");
	    }
	    return logger$9.throwArgumentError("invalid public or private key", "key", "[REDACTED]");
	}

	const version$6 = "transactions/5.7.0";

	const logger$8 = new Logger(version$6);
	var TransactionTypes;
	(function (TransactionTypes) {
	    TransactionTypes[TransactionTypes["legacy"] = 0] = "legacy";
	    TransactionTypes[TransactionTypes["eip2930"] = 1] = "eip2930";
	    TransactionTypes[TransactionTypes["eip1559"] = 2] = "eip1559";
	})(TransactionTypes || (TransactionTypes = {}));
	///////////////////////////////
	function handleAddress(value) {
	    if (value === "0x") {
	        return null;
	    }
	    return getAddress(value);
	}
	function handleNumber(value) {
	    if (value === "0x") {
	        return Zero$1;
	    }
	    return BigNumber.from(value);
	}
	function computeAddress(key) {
	    const publicKey = computePublicKey(key);
	    return getAddress(hexDataSlice(keccak256(hexDataSlice(publicKey, 1)), 12));
	}
	function recoverAddress(digest, signature) {
	    return computeAddress(recoverPublicKey(arrayify(digest), signature));
	}
	function formatNumber(value, name) {
	    const result = stripZeros(BigNumber.from(value).toHexString());
	    if (result.length > 32) {
	        logger$8.throwArgumentError("invalid length for " + name, ("transaction:" + name), value);
	    }
	    return result;
	}
	function accessSetify(addr, storageKeys) {
	    return {
	        address: getAddress(addr),
	        storageKeys: (storageKeys || []).map((storageKey, index) => {
	            if (hexDataLength(storageKey) !== 32) {
	                logger$8.throwArgumentError("invalid access list storageKey", `accessList[${addr}:${index}]`, storageKey);
	            }
	            return storageKey.toLowerCase();
	        })
	    };
	}
	function accessListify(value) {
	    if (Array.isArray(value)) {
	        return value.map((set, index) => {
	            if (Array.isArray(set)) {
	                if (set.length > 2) {
	                    logger$8.throwArgumentError("access list expected to be [ address, storageKeys[] ]", `value[${index}]`, set);
	                }
	                return accessSetify(set[0], set[1]);
	            }
	            return accessSetify(set.address, set.storageKeys);
	        });
	    }
	    const result = Object.keys(value).map((addr) => {
	        const storageKeys = value[addr].reduce((accum, storageKey) => {
	            accum[storageKey] = true;
	            return accum;
	        }, {});
	        return accessSetify(addr, Object.keys(storageKeys).sort());
	    });
	    result.sort((a, b) => (a.address.localeCompare(b.address)));
	    return result;
	}
	function formatAccessList(value) {
	    return accessListify(value).map((set) => [set.address, set.storageKeys]);
	}
	function _serializeEip1559(transaction, signature) {
	    // If there is an explicit gasPrice, make sure it matches the
	    // EIP-1559 fees; otherwise they may not understand what they
	    // think they are setting in terms of fee.
	    if (transaction.gasPrice != null) {
	        const gasPrice = BigNumber.from(transaction.gasPrice);
	        const maxFeePerGas = BigNumber.from(transaction.maxFeePerGas || 0);
	        if (!gasPrice.eq(maxFeePerGas)) {
	            logger$8.throwArgumentError("mismatch EIP-1559 gasPrice != maxFeePerGas", "tx", {
	                gasPrice, maxFeePerGas
	            });
	        }
	    }
	    const fields = [
	        formatNumber(transaction.chainId || 0, "chainId"),
	        formatNumber(transaction.nonce || 0, "nonce"),
	        formatNumber(transaction.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
	        formatNumber(transaction.maxFeePerGas || 0, "maxFeePerGas"),
	        formatNumber(transaction.gasLimit || 0, "gasLimit"),
	        ((transaction.to != null) ? getAddress(transaction.to) : "0x"),
	        formatNumber(transaction.value || 0, "value"),
	        (transaction.data || "0x"),
	        (formatAccessList(transaction.accessList || []))
	    ];
	    if (signature) {
	        const sig = splitSignature(signature);
	        fields.push(formatNumber(sig.recoveryParam, "recoveryParam"));
	        fields.push(stripZeros(sig.r));
	        fields.push(stripZeros(sig.s));
	    }
	    return hexConcat(["0x02", encode$2(fields)]);
	}
	function _serializeEip2930(transaction, signature) {
	    const fields = [
	        formatNumber(transaction.chainId || 0, "chainId"),
	        formatNumber(transaction.nonce || 0, "nonce"),
	        formatNumber(transaction.gasPrice || 0, "gasPrice"),
	        formatNumber(transaction.gasLimit || 0, "gasLimit"),
	        ((transaction.to != null) ? getAddress(transaction.to) : "0x"),
	        formatNumber(transaction.value || 0, "value"),
	        (transaction.data || "0x"),
	        (formatAccessList(transaction.accessList || []))
	    ];
	    if (signature) {
	        const sig = splitSignature(signature);
	        fields.push(formatNumber(sig.recoveryParam, "recoveryParam"));
	        fields.push(stripZeros(sig.r));
	        fields.push(stripZeros(sig.s));
	    }
	    return hexConcat(["0x01", encode$2(fields)]);
	}
	function _parseEipSignature(tx, fields, serialize) {
	    try {
	        const recid = handleNumber(fields[0]).toNumber();
	        if (recid !== 0 && recid !== 1) {
	            throw new Error("bad recid");
	        }
	        tx.v = recid;
	    }
	    catch (error) {
	        logger$8.throwArgumentError("invalid v for transaction type: 1", "v", fields[0]);
	    }
	    tx.r = hexZeroPad(fields[1], 32);
	    tx.s = hexZeroPad(fields[2], 32);
	    try {
	        const digest = keccak256(serialize(tx));
	        tx.from = recoverAddress(digest, { r: tx.r, s: tx.s, recoveryParam: tx.v });
	    }
	    catch (error) { }
	}
	function _parseEip1559(payload) {
	    const transaction = decode$2(payload.slice(1));
	    if (transaction.length !== 9 && transaction.length !== 12) {
	        logger$8.throwArgumentError("invalid component count for transaction type: 2", "payload", hexlify(payload));
	    }
	    const maxPriorityFeePerGas = handleNumber(transaction[2]);
	    const maxFeePerGas = handleNumber(transaction[3]);
	    const tx = {
	        type: 2,
	        chainId: handleNumber(transaction[0]).toNumber(),
	        nonce: handleNumber(transaction[1]).toNumber(),
	        maxPriorityFeePerGas: maxPriorityFeePerGas,
	        maxFeePerGas: maxFeePerGas,
	        gasPrice: null,
	        gasLimit: handleNumber(transaction[4]),
	        to: handleAddress(transaction[5]),
	        value: handleNumber(transaction[6]),
	        data: transaction[7],
	        accessList: accessListify(transaction[8]),
	    };
	    // Unsigned EIP-1559 Transaction
	    if (transaction.length === 9) {
	        return tx;
	    }
	    tx.hash = keccak256(payload);
	    _parseEipSignature(tx, transaction.slice(9), _serializeEip1559);
	    return tx;
	}
	function _parseEip2930(payload) {
	    const transaction = decode$2(payload.slice(1));
	    if (transaction.length !== 8 && transaction.length !== 11) {
	        logger$8.throwArgumentError("invalid component count for transaction type: 1", "payload", hexlify(payload));
	    }
	    const tx = {
	        type: 1,
	        chainId: handleNumber(transaction[0]).toNumber(),
	        nonce: handleNumber(transaction[1]).toNumber(),
	        gasPrice: handleNumber(transaction[2]),
	        gasLimit: handleNumber(transaction[3]),
	        to: handleAddress(transaction[4]),
	        value: handleNumber(transaction[5]),
	        data: transaction[6],
	        accessList: accessListify(transaction[7])
	    };
	    // Unsigned EIP-2930 Transaction
	    if (transaction.length === 8) {
	        return tx;
	    }
	    tx.hash = keccak256(payload);
	    _parseEipSignature(tx, transaction.slice(8), _serializeEip2930);
	    return tx;
	}
	// Legacy Transactions and EIP-155
	function _parse(rawTransaction) {
	    const transaction = decode$2(rawTransaction);
	    if (transaction.length !== 9 && transaction.length !== 6) {
	        logger$8.throwArgumentError("invalid raw transaction", "rawTransaction", rawTransaction);
	    }
	    const tx = {
	        nonce: handleNumber(transaction[0]).toNumber(),
	        gasPrice: handleNumber(transaction[1]),
	        gasLimit: handleNumber(transaction[2]),
	        to: handleAddress(transaction[3]),
	        value: handleNumber(transaction[4]),
	        data: transaction[5],
	        chainId: 0
	    };
	    // Legacy unsigned transaction
	    if (transaction.length === 6) {
	        return tx;
	    }
	    try {
	        tx.v = BigNumber.from(transaction[6]).toNumber();
	    }
	    catch (error) {
	        // @TODO: What makes snese to do? The v is too big
	        return tx;
	    }
	    tx.r = hexZeroPad(transaction[7], 32);
	    tx.s = hexZeroPad(transaction[8], 32);
	    if (BigNumber.from(tx.r).isZero() && BigNumber.from(tx.s).isZero()) {
	        // EIP-155 unsigned transaction
	        tx.chainId = tx.v;
	        tx.v = 0;
	    }
	    else {
	        // Signed Transaction
	        tx.chainId = Math.floor((tx.v - 35) / 2);
	        if (tx.chainId < 0) {
	            tx.chainId = 0;
	        }
	        let recoveryParam = tx.v - 27;
	        const raw = transaction.slice(0, 6);
	        if (tx.chainId !== 0) {
	            raw.push(hexlify(tx.chainId));
	            raw.push("0x");
	            raw.push("0x");
	            recoveryParam -= tx.chainId * 2 + 8;
	        }
	        const digest = keccak256(encode$2(raw));
	        try {
	            tx.from = recoverAddress(digest, { r: hexlify(tx.r), s: hexlify(tx.s), recoveryParam: recoveryParam });
	        }
	        catch (error) { }
	        tx.hash = keccak256(rawTransaction);
	    }
	    tx.type = null;
	    return tx;
	}
	function parse(rawTransaction) {
	    const payload = arrayify(rawTransaction);
	    // Legacy and EIP-155 Transactions
	    if (payload[0] > 0x7f) {
	        return _parse(payload);
	    }
	    // Typed Transaction (EIP-2718)
	    switch (payload[0]) {
	        case 1:
	            return _parseEip2930(payload);
	        case 2:
	            return _parseEip1559(payload);
	    }
	    return logger$8.throwError(`unsupported transaction type: ${payload[0]}`, Logger.errors.UNSUPPORTED_OPERATION, {
	        operation: "parseTransaction",
	        transactionType: payload[0]
	    });
	}

	const version$5 = "contracts/5.7.0";

	var __awaiter$4 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$7 = new Logger(version$5);
	function resolveName(resolver, nameOrPromise) {
	    return __awaiter$4(this, void 0, void 0, function* () {
	        const name = yield nameOrPromise;
	        if (typeof (name) !== "string") {
	            logger$7.throwArgumentError("invalid address or ENS name", "name", name);
	        }
	        // If it is already an address, just use it (after adding checksum)
	        try {
	            return getAddress(name);
	        }
	        catch (error) { }
	        if (!resolver) {
	            logger$7.throwError("a provider or signer is needed to resolve ENS names", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "resolveName"
	            });
	        }
	        const address = yield resolver.resolveName(name);
	        if (address == null) {
	            logger$7.throwArgumentError("resolver or addr is not configured for ENS name", "name", name);
	        }
	        return address;
	    });
	}
	// Recursively replaces ENS names with promises to resolve the name and resolves all properties
	function resolveAddresses(resolver, value, paramType) {
	    return __awaiter$4(this, void 0, void 0, function* () {
	        if (Array.isArray(paramType)) {
	            return yield Promise.all(paramType.map((paramType, index) => {
	                return resolveAddresses(resolver, ((Array.isArray(value)) ? value[index] : value[paramType.name]), paramType);
	            }));
	        }
	        if (paramType.type === "address") {
	            return yield resolveName(resolver, value);
	        }
	        if (paramType.type === "tuple") {
	            return yield resolveAddresses(resolver, value, paramType.components);
	        }
	        if (paramType.baseType === "array") {
	            if (!Array.isArray(value)) {
	                return Promise.reject(logger$7.makeError("invalid value for array", Logger.errors.INVALID_ARGUMENT, {
	                    argument: "value",
	                    value
	                }));
	            }
	            return yield Promise.all(value.map((v) => resolveAddresses(resolver, v, paramType.arrayChildren)));
	        }
	        return value;
	    });
	}
	function populateTransaction(contract, fragment, args) {
	    return __awaiter$4(this, void 0, void 0, function* () {
	        // If an extra argument is given, it is overrides
	        let overrides = {};
	        if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
	            overrides = shallowCopy(args.pop());
	        }
	        // Make sure the parameter count matches
	        logger$7.checkArgumentCount(args.length, fragment.inputs.length, "passed to contract");
	        // Populate "from" override (allow promises)
	        if (contract.signer) {
	            if (overrides.from) {
	                // Contracts with a Signer are from the Signer's frame-of-reference;
	                // but we allow overriding "from" if it matches the signer
	                overrides.from = resolveProperties({
	                    override: resolveName(contract.signer, overrides.from),
	                    signer: contract.signer.getAddress()
	                }).then((check) => __awaiter$4(this, void 0, void 0, function* () {
	                    if (getAddress(check.signer) !== check.override) {
	                        logger$7.throwError("Contract with a Signer cannot override from", Logger.errors.UNSUPPORTED_OPERATION, {
	                            operation: "overrides.from"
	                        });
	                    }
	                    return check.override;
	                }));
	            }
	            else {
	                overrides.from = contract.signer.getAddress();
	            }
	        }
	        else if (overrides.from) {
	            overrides.from = resolveName(contract.provider, overrides.from);
	            //} else {
	            // Contracts without a signer can override "from", and if
	            // unspecified the zero address is used
	            //overrides.from = AddressZero;
	        }
	        // Wait for all dependencies to be resolved (prefer the signer over the provider)
	        const resolved = yield resolveProperties({
	            args: resolveAddresses(contract.signer || contract.provider, args, fragment.inputs),
	            address: contract.resolvedAddress,
	            overrides: (resolveProperties(overrides) || {})
	        });
	        // The ABI coded transaction
	        const data = contract.interface.encodeFunctionData(fragment, resolved.args);
	        const tx = {
	            data: data,
	            to: resolved.address
	        };
	        // Resolved Overrides
	        const ro = resolved.overrides;
	        // Populate simple overrides
	        if (ro.nonce != null) {
	            tx.nonce = BigNumber.from(ro.nonce).toNumber();
	        }
	        if (ro.gasLimit != null) {
	            tx.gasLimit = BigNumber.from(ro.gasLimit);
	        }
	        if (ro.gasPrice != null) {
	            tx.gasPrice = BigNumber.from(ro.gasPrice);
	        }
	        if (ro.maxFeePerGas != null) {
	            tx.maxFeePerGas = BigNumber.from(ro.maxFeePerGas);
	        }
	        if (ro.maxPriorityFeePerGas != null) {
	            tx.maxPriorityFeePerGas = BigNumber.from(ro.maxPriorityFeePerGas);
	        }
	        if (ro.from != null) {
	            tx.from = ro.from;
	        }
	        if (ro.type != null) {
	            tx.type = ro.type;
	        }
	        if (ro.accessList != null) {
	            tx.accessList = accessListify(ro.accessList);
	        }
	        // If there was no "gasLimit" override, but the ABI specifies a default, use it
	        if (tx.gasLimit == null && fragment.gas != null) {
	            // Compute the intrinsic gas cost for this transaction
	            // @TODO: This is based on the yellow paper as of Petersburg; this is something
	            // we may wish to parameterize in v6 as part of the Network object. Since this
	            // is always a non-nil to address, we can ignore G_create, but may wish to add
	            // similar logic to the ContractFactory.
	            let intrinsic = 21000;
	            const bytes = arrayify(data);
	            for (let i = 0; i < bytes.length; i++) {
	                intrinsic += 4;
	                if (bytes[i]) {
	                    intrinsic += 64;
	                }
	            }
	            tx.gasLimit = BigNumber.from(fragment.gas).add(intrinsic);
	        }
	        // Populate "value" override
	        if (ro.value) {
	            const roValue = BigNumber.from(ro.value);
	            if (!roValue.isZero() && !fragment.payable) {
	                logger$7.throwError("non-payable method cannot override value", Logger.errors.UNSUPPORTED_OPERATION, {
	                    operation: "overrides.value",
	                    value: overrides.value
	                });
	            }
	            tx.value = roValue;
	        }
	        if (ro.customData) {
	            tx.customData = shallowCopy(ro.customData);
	        }
	        if (ro.ccipReadEnabled) {
	            tx.ccipReadEnabled = !!ro.ccipReadEnabled;
	        }
	        // Remove the overrides
	        delete overrides.nonce;
	        delete overrides.gasLimit;
	        delete overrides.gasPrice;
	        delete overrides.from;
	        delete overrides.value;
	        delete overrides.type;
	        delete overrides.accessList;
	        delete overrides.maxFeePerGas;
	        delete overrides.maxPriorityFeePerGas;
	        delete overrides.customData;
	        delete overrides.ccipReadEnabled;
	        // Make sure there are no stray overrides, which may indicate a
	        // typo or using an unsupported key.
	        const leftovers = Object.keys(overrides).filter((key) => (overrides[key] != null));
	        if (leftovers.length) {
	            logger$7.throwError(`cannot override ${leftovers.map((l) => JSON.stringify(l)).join(",")}`, Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "overrides",
	                overrides: leftovers
	            });
	        }
	        return tx;
	    });
	}
	function buildPopulate(contract, fragment) {
	    return function (...args) {
	        return populateTransaction(contract, fragment, args);
	    };
	}
	function buildEstimate(contract, fragment) {
	    const signerOrProvider = (contract.signer || contract.provider);
	    return function (...args) {
	        return __awaiter$4(this, void 0, void 0, function* () {
	            if (!signerOrProvider) {
	                logger$7.throwError("estimate require a provider or signer", Logger.errors.UNSUPPORTED_OPERATION, {
	                    operation: "estimateGas"
	                });
	            }
	            const tx = yield populateTransaction(contract, fragment, args);
	            return yield signerOrProvider.estimateGas(tx);
	        });
	    };
	}
	function addContractWait(contract, tx) {
	    const wait = tx.wait.bind(tx);
	    tx.wait = (confirmations) => {
	        return wait(confirmations).then((receipt) => {
	            receipt.events = receipt.logs.map((log) => {
	                let event = deepCopy(log);
	                let parsed = null;
	                try {
	                    parsed = contract.interface.parseLog(log);
	                }
	                catch (e) { }
	                // Successfully parsed the event log; include it
	                if (parsed) {
	                    event.args = parsed.args;
	                    event.decode = (data, topics) => {
	                        return contract.interface.decodeEventLog(parsed.eventFragment, data, topics);
	                    };
	                    event.event = parsed.name;
	                    event.eventSignature = parsed.signature;
	                }
	                // Useful operations
	                event.removeListener = () => { return contract.provider; };
	                event.getBlock = () => {
	                    return contract.provider.getBlock(receipt.blockHash);
	                };
	                event.getTransaction = () => {
	                    return contract.provider.getTransaction(receipt.transactionHash);
	                };
	                event.getTransactionReceipt = () => {
	                    return Promise.resolve(receipt);
	                };
	                return event;
	            });
	            return receipt;
	        });
	    };
	}
	function buildCall(contract, fragment, collapseSimple) {
	    const signerOrProvider = (contract.signer || contract.provider);
	    return function (...args) {
	        return __awaiter$4(this, void 0, void 0, function* () {
	            // Extract the "blockTag" override if present
	            let blockTag = undefined;
	            if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
	                const overrides = shallowCopy(args.pop());
	                if (overrides.blockTag != null) {
	                    blockTag = yield overrides.blockTag;
	                }
	                delete overrides.blockTag;
	                args.push(overrides);
	            }
	            // If the contract was just deployed, wait until it is mined
	            if (contract.deployTransaction != null) {
	                yield contract._deployed(blockTag);
	            }
	            // Call a node and get the result
	            const tx = yield populateTransaction(contract, fragment, args);
	            const result = yield signerOrProvider.call(tx, blockTag);
	            try {
	                let value = contract.interface.decodeFunctionResult(fragment, result);
	                if (collapseSimple && fragment.outputs.length === 1) {
	                    value = value[0];
	                }
	                return value;
	            }
	            catch (error) {
	                if (error.code === Logger.errors.CALL_EXCEPTION) {
	                    error.address = contract.address;
	                    error.args = args;
	                    error.transaction = tx;
	                }
	                throw error;
	            }
	        });
	    };
	}
	function buildSend(contract, fragment) {
	    return function (...args) {
	        return __awaiter$4(this, void 0, void 0, function* () {
	            if (!contract.signer) {
	                logger$7.throwError("sending a transaction requires a signer", Logger.errors.UNSUPPORTED_OPERATION, {
	                    operation: "sendTransaction"
	                });
	            }
	            // If the contract was just deployed, wait until it is mined
	            if (contract.deployTransaction != null) {
	                yield contract._deployed();
	            }
	            const txRequest = yield populateTransaction(contract, fragment, args);
	            const tx = yield contract.signer.sendTransaction(txRequest);
	            // Tweak the tx.wait so the receipt has extra properties
	            addContractWait(contract, tx);
	            return tx;
	        });
	    };
	}
	function buildDefault(contract, fragment, collapseSimple) {
	    if (fragment.constant) {
	        return buildCall(contract, fragment, collapseSimple);
	    }
	    return buildSend(contract, fragment);
	}
	function getEventTag$1(filter) {
	    if (filter.address && (filter.topics == null || filter.topics.length === 0)) {
	        return "*";
	    }
	    return (filter.address || "*") + "@" + (filter.topics ? filter.topics.map((topic) => {
	        if (Array.isArray(topic)) {
	            return topic.join("|");
	        }
	        return topic;
	    }).join(":") : "");
	}
	class RunningEvent {
	    constructor(tag, filter) {
	        defineReadOnly(this, "tag", tag);
	        defineReadOnly(this, "filter", filter);
	        this._listeners = [];
	    }
	    addListener(listener, once) {
	        this._listeners.push({ listener: listener, once: once });
	    }
	    removeListener(listener) {
	        let done = false;
	        this._listeners = this._listeners.filter((item) => {
	            if (done || item.listener !== listener) {
	                return true;
	            }
	            done = true;
	            return false;
	        });
	    }
	    removeAllListeners() {
	        this._listeners = [];
	    }
	    listeners() {
	        return this._listeners.map((i) => i.listener);
	    }
	    listenerCount() {
	        return this._listeners.length;
	    }
	    run(args) {
	        const listenerCount = this.listenerCount();
	        this._listeners = this._listeners.filter((item) => {
	            const argsCopy = args.slice();
	            // Call the callback in the next event loop
	            setTimeout(() => {
	                item.listener.apply(this, argsCopy);
	            }, 0);
	            // Reschedule it if it not "once"
	            return !(item.once);
	        });
	        return listenerCount;
	    }
	    prepareEvent(event) {
	    }
	    // Returns the array that will be applied to an emit
	    getEmit(event) {
	        return [event];
	    }
	}
	class ErrorRunningEvent extends RunningEvent {
	    constructor() {
	        super("error", null);
	    }
	}
	// @TODO Fragment should inherit Wildcard? and just override getEmit?
	//       or have a common abstract super class, with enough constructor
	//       options to configure both.
	// A Fragment Event will populate all the properties that Wildcard
	// will, and additionally dereference the arguments when emitting
	class FragmentRunningEvent extends RunningEvent {
	    constructor(address, contractInterface, fragment, topics) {
	        const filter = {
	            address: address
	        };
	        let topic = contractInterface.getEventTopic(fragment);
	        if (topics) {
	            if (topic !== topics[0]) {
	                logger$7.throwArgumentError("topic mismatch", "topics", topics);
	            }
	            filter.topics = topics.slice();
	        }
	        else {
	            filter.topics = [topic];
	        }
	        super(getEventTag$1(filter), filter);
	        defineReadOnly(this, "address", address);
	        defineReadOnly(this, "interface", contractInterface);
	        defineReadOnly(this, "fragment", fragment);
	    }
	    prepareEvent(event) {
	        super.prepareEvent(event);
	        event.event = this.fragment.name;
	        event.eventSignature = this.fragment.format();
	        event.decode = (data, topics) => {
	            return this.interface.decodeEventLog(this.fragment, data, topics);
	        };
	        try {
	            event.args = this.interface.decodeEventLog(this.fragment, event.data, event.topics);
	        }
	        catch (error) {
	            event.args = null;
	            event.decodeError = error;
	        }
	    }
	    getEmit(event) {
	        const errors = checkResultErrors(event.args);
	        if (errors.length) {
	            throw errors[0].error;
	        }
	        const args = (event.args || []).slice();
	        args.push(event);
	        return args;
	    }
	}
	// A Wildcard Event will attempt to populate:
	//  - event            The name of the event name
	//  - eventSignature   The full signature of the event
	//  - decode           A function to decode data and topics
	//  - args             The decoded data and topics
	class WildcardRunningEvent extends RunningEvent {
	    constructor(address, contractInterface) {
	        super("*", { address: address });
	        defineReadOnly(this, "address", address);
	        defineReadOnly(this, "interface", contractInterface);
	    }
	    prepareEvent(event) {
	        super.prepareEvent(event);
	        try {
	            const parsed = this.interface.parseLog(event);
	            event.event = parsed.name;
	            event.eventSignature = parsed.signature;
	            event.decode = (data, topics) => {
	                return this.interface.decodeEventLog(parsed.eventFragment, data, topics);
	            };
	            event.args = parsed.args;
	        }
	        catch (error) {
	            // No matching event
	        }
	    }
	}
	class BaseContract {
	    constructor(addressOrName, contractInterface, signerOrProvider) {
	        // @TODO: Maybe still check the addressOrName looks like a valid address or name?
	        //address = getAddress(address);
	        defineReadOnly(this, "interface", getStatic(new.target, "getInterface")(contractInterface));
	        if (signerOrProvider == null) {
	            defineReadOnly(this, "provider", null);
	            defineReadOnly(this, "signer", null);
	        }
	        else if (Signer.isSigner(signerOrProvider)) {
	            defineReadOnly(this, "provider", signerOrProvider.provider || null);
	            defineReadOnly(this, "signer", signerOrProvider);
	        }
	        else if (Provider.isProvider(signerOrProvider)) {
	            defineReadOnly(this, "provider", signerOrProvider);
	            defineReadOnly(this, "signer", null);
	        }
	        else {
	            logger$7.throwArgumentError("invalid signer or provider", "signerOrProvider", signerOrProvider);
	        }
	        defineReadOnly(this, "callStatic", {});
	        defineReadOnly(this, "estimateGas", {});
	        defineReadOnly(this, "functions", {});
	        defineReadOnly(this, "populateTransaction", {});
	        defineReadOnly(this, "filters", {});
	        {
	            const uniqueFilters = {};
	            Object.keys(this.interface.events).forEach((eventSignature) => {
	                const event = this.interface.events[eventSignature];
	                defineReadOnly(this.filters, eventSignature, (...args) => {
	                    return {
	                        address: this.address,
	                        topics: this.interface.encodeFilterTopics(event, args)
	                    };
	                });
	                if (!uniqueFilters[event.name]) {
	                    uniqueFilters[event.name] = [];
	                }
	                uniqueFilters[event.name].push(eventSignature);
	            });
	            Object.keys(uniqueFilters).forEach((name) => {
	                const filters = uniqueFilters[name];
	                if (filters.length === 1) {
	                    defineReadOnly(this.filters, name, this.filters[filters[0]]);
	                }
	                else {
	                    logger$7.warn(`Duplicate definition of ${name} (${filters.join(", ")})`);
	                }
	            });
	        }
	        defineReadOnly(this, "_runningEvents", {});
	        defineReadOnly(this, "_wrappedEmits", {});
	        if (addressOrName == null) {
	            logger$7.throwArgumentError("invalid contract address or ENS name", "addressOrName", addressOrName);
	        }
	        defineReadOnly(this, "address", addressOrName);
	        if (this.provider) {
	            defineReadOnly(this, "resolvedAddress", resolveName(this.provider, addressOrName));
	        }
	        else {
	            try {
	                defineReadOnly(this, "resolvedAddress", Promise.resolve(getAddress(addressOrName)));
	            }
	            catch (error) {
	                // Without a provider, we cannot use ENS names
	                logger$7.throwError("provider is required to use ENS name as contract address", Logger.errors.UNSUPPORTED_OPERATION, {
	                    operation: "new Contract"
	                });
	            }
	        }
	        // Swallow bad ENS names to prevent Unhandled Exceptions
	        this.resolvedAddress.catch((e) => { });
	        const uniqueNames = {};
	        const uniqueSignatures = {};
	        Object.keys(this.interface.functions).forEach((signature) => {
	            const fragment = this.interface.functions[signature];
	            // Check that the signature is unique; if not the ABI generation has
	            // not been cleaned or may be incorrectly generated
	            if (uniqueSignatures[signature]) {
	                logger$7.warn(`Duplicate ABI entry for ${JSON.stringify(signature)}`);
	                return;
	            }
	            uniqueSignatures[signature] = true;
	            // Track unique names; we only expose bare named functions if they
	            // are ambiguous
	            {
	                const name = fragment.name;
	                if (!uniqueNames[`%${name}`]) {
	                    uniqueNames[`%${name}`] = [];
	                }
	                uniqueNames[`%${name}`].push(signature);
	            }
	            if (this[signature] == null) {
	                defineReadOnly(this, signature, buildDefault(this, fragment, true));
	            }
	            // We do not collapse simple calls on this bucket, which allows
	            // frameworks to safely use this without introspection as well as
	            // allows decoding error recovery.
	            if (this.functions[signature] == null) {
	                defineReadOnly(this.functions, signature, buildDefault(this, fragment, false));
	            }
	            if (this.callStatic[signature] == null) {
	                defineReadOnly(this.callStatic, signature, buildCall(this, fragment, true));
	            }
	            if (this.populateTransaction[signature] == null) {
	                defineReadOnly(this.populateTransaction, signature, buildPopulate(this, fragment));
	            }
	            if (this.estimateGas[signature] == null) {
	                defineReadOnly(this.estimateGas, signature, buildEstimate(this, fragment));
	            }
	        });
	        Object.keys(uniqueNames).forEach((name) => {
	            // Ambiguous names to not get attached as bare names
	            const signatures = uniqueNames[name];
	            if (signatures.length > 1) {
	                return;
	            }
	            // Strip off the leading "%" used for prototype protection
	            name = name.substring(1);
	            const signature = signatures[0];
	            // If overwriting a member property that is null, swallow the error
	            try {
	                if (this[name] == null) {
	                    defineReadOnly(this, name, this[signature]);
	                }
	            }
	            catch (e) { }
	            if (this.functions[name] == null) {
	                defineReadOnly(this.functions, name, this.functions[signature]);
	            }
	            if (this.callStatic[name] == null) {
	                defineReadOnly(this.callStatic, name, this.callStatic[signature]);
	            }
	            if (this.populateTransaction[name] == null) {
	                defineReadOnly(this.populateTransaction, name, this.populateTransaction[signature]);
	            }
	            if (this.estimateGas[name] == null) {
	                defineReadOnly(this.estimateGas, name, this.estimateGas[signature]);
	            }
	        });
	    }
	    static getContractAddress(transaction) {
	        return getContractAddress(transaction);
	    }
	    static getInterface(contractInterface) {
	        if (Interface.isInterface(contractInterface)) {
	            return contractInterface;
	        }
	        return new Interface(contractInterface);
	    }
	    // @TODO: Allow timeout?
	    deployed() {
	        return this._deployed();
	    }
	    _deployed(blockTag) {
	        if (!this._deployedPromise) {
	            // If we were just deployed, we know the transaction we should occur in
	            if (this.deployTransaction) {
	                this._deployedPromise = this.deployTransaction.wait().then(() => {
	                    return this;
	                });
	            }
	            else {
	                // @TODO: Once we allow a timeout to be passed in, we will wait
	                // up to that many blocks for getCode
	                // Otherwise, poll for our code to be deployed
	                this._deployedPromise = this.provider.getCode(this.address, blockTag).then((code) => {
	                    if (code === "0x") {
	                        logger$7.throwError("contract not deployed", Logger.errors.UNSUPPORTED_OPERATION, {
	                            contractAddress: this.address,
	                            operation: "getDeployed"
	                        });
	                    }
	                    return this;
	                });
	            }
	        }
	        return this._deployedPromise;
	    }
	    // @TODO:
	    // estimateFallback(overrides?: TransactionRequest): Promise<BigNumber>
	    // @TODO:
	    // estimateDeploy(bytecode: string, ...args): Promise<BigNumber>
	    fallback(overrides) {
	        if (!this.signer) {
	            logger$7.throwError("sending a transactions require a signer", Logger.errors.UNSUPPORTED_OPERATION, { operation: "sendTransaction(fallback)" });
	        }
	        const tx = shallowCopy(overrides || {});
	        ["from", "to"].forEach(function (key) {
	            if (tx[key] == null) {
	                return;
	            }
	            logger$7.throwError("cannot override " + key, Logger.errors.UNSUPPORTED_OPERATION, { operation: key });
	        });
	        tx.to = this.resolvedAddress;
	        return this.deployed().then(() => {
	            return this.signer.sendTransaction(tx);
	        });
	    }
	    // Reconnect to a different signer or provider
	    connect(signerOrProvider) {
	        if (typeof (signerOrProvider) === "string") {
	            signerOrProvider = new VoidSigner(signerOrProvider, this.provider);
	        }
	        const contract = new (this.constructor)(this.address, this.interface, signerOrProvider);
	        if (this.deployTransaction) {
	            defineReadOnly(contract, "deployTransaction", this.deployTransaction);
	        }
	        return contract;
	    }
	    // Re-attach to a different on-chain instance of this contract
	    attach(addressOrName) {
	        return new (this.constructor)(addressOrName, this.interface, this.signer || this.provider);
	    }
	    static isIndexed(value) {
	        return Indexed.isIndexed(value);
	    }
	    _normalizeRunningEvent(runningEvent) {
	        // Already have an instance of this event running; we can re-use it
	        if (this._runningEvents[runningEvent.tag]) {
	            return this._runningEvents[runningEvent.tag];
	        }
	        return runningEvent;
	    }
	    _getRunningEvent(eventName) {
	        if (typeof (eventName) === "string") {
	            // Listen for "error" events (if your contract has an error event, include
	            // the full signature to bypass this special event keyword)
	            if (eventName === "error") {
	                return this._normalizeRunningEvent(new ErrorRunningEvent());
	            }
	            // Listen for any event that is registered
	            if (eventName === "event") {
	                return this._normalizeRunningEvent(new RunningEvent("event", null));
	            }
	            // Listen for any event
	            if (eventName === "*") {
	                return this._normalizeRunningEvent(new WildcardRunningEvent(this.address, this.interface));
	            }
	            // Get the event Fragment (throws if ambiguous/unknown event)
	            const fragment = this.interface.getEvent(eventName);
	            return this._normalizeRunningEvent(new FragmentRunningEvent(this.address, this.interface, fragment));
	        }
	        // We have topics to filter by...
	        if (eventName.topics && eventName.topics.length > 0) {
	            // Is it a known topichash? (throws if no matching topichash)
	            try {
	                const topic = eventName.topics[0];
	                if (typeof (topic) !== "string") {
	                    throw new Error("invalid topic"); // @TODO: May happen for anonymous events
	                }
	                const fragment = this.interface.getEvent(topic);
	                return this._normalizeRunningEvent(new FragmentRunningEvent(this.address, this.interface, fragment, eventName.topics));
	            }
	            catch (error) { }
	            // Filter by the unknown topichash
	            const filter = {
	                address: this.address,
	                topics: eventName.topics
	            };
	            return this._normalizeRunningEvent(new RunningEvent(getEventTag$1(filter), filter));
	        }
	        return this._normalizeRunningEvent(new WildcardRunningEvent(this.address, this.interface));
	    }
	    _checkRunningEvents(runningEvent) {
	        if (runningEvent.listenerCount() === 0) {
	            delete this._runningEvents[runningEvent.tag];
	            // If we have a poller for this, remove it
	            const emit = this._wrappedEmits[runningEvent.tag];
	            if (emit && runningEvent.filter) {
	                this.provider.off(runningEvent.filter, emit);
	                delete this._wrappedEmits[runningEvent.tag];
	            }
	        }
	    }
	    // Subclasses can override this to gracefully recover
	    // from parse errors if they wish
	    _wrapEvent(runningEvent, log, listener) {
	        const event = deepCopy(log);
	        event.removeListener = () => {
	            if (!listener) {
	                return;
	            }
	            runningEvent.removeListener(listener);
	            this._checkRunningEvents(runningEvent);
	        };
	        event.getBlock = () => { return this.provider.getBlock(log.blockHash); };
	        event.getTransaction = () => { return this.provider.getTransaction(log.transactionHash); };
	        event.getTransactionReceipt = () => { return this.provider.getTransactionReceipt(log.transactionHash); };
	        // This may throw if the topics and data mismatch the signature
	        runningEvent.prepareEvent(event);
	        return event;
	    }
	    _addEventListener(runningEvent, listener, once) {
	        if (!this.provider) {
	            logger$7.throwError("events require a provider or a signer with a provider", Logger.errors.UNSUPPORTED_OPERATION, { operation: "once" });
	        }
	        runningEvent.addListener(listener, once);
	        // Track this running event and its listeners (may already be there; but no hard in updating)
	        this._runningEvents[runningEvent.tag] = runningEvent;
	        // If we are not polling the provider, start polling
	        if (!this._wrappedEmits[runningEvent.tag]) {
	            const wrappedEmit = (log) => {
	                let event = this._wrapEvent(runningEvent, log, listener);
	                // Try to emit the result for the parameterized event...
	                if (event.decodeError == null) {
	                    try {
	                        const args = runningEvent.getEmit(event);
	                        this.emit(runningEvent.filter, ...args);
	                    }
	                    catch (error) {
	                        event.decodeError = error.error;
	                    }
	                }
	                // Always emit "event" for fragment-base events
	                if (runningEvent.filter != null) {
	                    this.emit("event", event);
	                }
	                // Emit "error" if there was an error
	                if (event.decodeError != null) {
	                    this.emit("error", event.decodeError, event);
	                }
	            };
	            this._wrappedEmits[runningEvent.tag] = wrappedEmit;
	            // Special events, like "error" do not have a filter
	            if (runningEvent.filter != null) {
	                this.provider.on(runningEvent.filter, wrappedEmit);
	            }
	        }
	    }
	    queryFilter(event, fromBlockOrBlockhash, toBlock) {
	        const runningEvent = this._getRunningEvent(event);
	        const filter = shallowCopy(runningEvent.filter);
	        if (typeof (fromBlockOrBlockhash) === "string" && isHexString(fromBlockOrBlockhash, 32)) {
	            if (toBlock != null) {
	                logger$7.throwArgumentError("cannot specify toBlock with blockhash", "toBlock", toBlock);
	            }
	            filter.blockHash = fromBlockOrBlockhash;
	        }
	        else {
	            filter.fromBlock = ((fromBlockOrBlockhash != null) ? fromBlockOrBlockhash : 0);
	            filter.toBlock = ((toBlock != null) ? toBlock : "latest");
	        }
	        return this.provider.getLogs(filter).then((logs) => {
	            return logs.map((log) => this._wrapEvent(runningEvent, log, null));
	        });
	    }
	    on(event, listener) {
	        this._addEventListener(this._getRunningEvent(event), listener, false);
	        return this;
	    }
	    once(event, listener) {
	        this._addEventListener(this._getRunningEvent(event), listener, true);
	        return this;
	    }
	    emit(eventName, ...args) {
	        if (!this.provider) {
	            return false;
	        }
	        const runningEvent = this._getRunningEvent(eventName);
	        const result = (runningEvent.run(args) > 0);
	        // May have drained all the "once" events; check for living events
	        this._checkRunningEvents(runningEvent);
	        return result;
	    }
	    listenerCount(eventName) {
	        if (!this.provider) {
	            return 0;
	        }
	        if (eventName == null) {
	            return Object.keys(this._runningEvents).reduce((accum, key) => {
	                return accum + this._runningEvents[key].listenerCount();
	            }, 0);
	        }
	        return this._getRunningEvent(eventName).listenerCount();
	    }
	    listeners(eventName) {
	        if (!this.provider) {
	            return [];
	        }
	        if (eventName == null) {
	            const result = [];
	            for (let tag in this._runningEvents) {
	                this._runningEvents[tag].listeners().forEach((listener) => {
	                    result.push(listener);
	                });
	            }
	            return result;
	        }
	        return this._getRunningEvent(eventName).listeners();
	    }
	    removeAllListeners(eventName) {
	        if (!this.provider) {
	            return this;
	        }
	        if (eventName == null) {
	            for (const tag in this._runningEvents) {
	                const runningEvent = this._runningEvents[tag];
	                runningEvent.removeAllListeners();
	                this._checkRunningEvents(runningEvent);
	            }
	            return this;
	        }
	        // Delete any listeners
	        const runningEvent = this._getRunningEvent(eventName);
	        runningEvent.removeAllListeners();
	        this._checkRunningEvents(runningEvent);
	        return this;
	    }
	    off(eventName, listener) {
	        if (!this.provider) {
	            return this;
	        }
	        const runningEvent = this._getRunningEvent(eventName);
	        runningEvent.removeListener(listener);
	        this._checkRunningEvents(runningEvent);
	        return this;
	    }
	    removeListener(eventName, listener) {
	        return this.off(eventName, listener);
	    }
	}
	class Contract extends BaseContract {
	}

	/**
	 * var basex = require("base-x");
	 *
	 * This implementation is heavily based on base-x. The main reason to
	 * deviate was to prevent the dependency of Buffer.
	 *
	 * Contributors:
	 *
	 * base-x encoding
	 * Forked from https://github.com/cryptocoinjs/bs58
	 * Originally written by Mike Hearn for BitcoinJ
	 * Copyright (c) 2011 Google Inc
	 * Ported to JavaScript by Stefan Thomas
	 * Merged Buffer refactorings from base58-native by Stephen Pair
	 * Copyright (c) 2013 BitPay Inc
	 *
	 * The MIT License (MIT)
	 *
	 * Copyright base-x contributors (c) 2016
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.

	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
	 * IN THE SOFTWARE.
	 *
	 */
	class BaseX {
	    constructor(alphabet) {
	        defineReadOnly(this, "alphabet", alphabet);
	        defineReadOnly(this, "base", alphabet.length);
	        defineReadOnly(this, "_alphabetMap", {});
	        defineReadOnly(this, "_leader", alphabet.charAt(0));
	        // pre-compute lookup table
	        for (let i = 0; i < alphabet.length; i++) {
	            this._alphabetMap[alphabet.charAt(i)] = i;
	        }
	    }
	    encode(value) {
	        let source = arrayify(value);
	        if (source.length === 0) {
	            return "";
	        }
	        let digits = [0];
	        for (let i = 0; i < source.length; ++i) {
	            let carry = source[i];
	            for (let j = 0; j < digits.length; ++j) {
	                carry += digits[j] << 8;
	                digits[j] = carry % this.base;
	                carry = (carry / this.base) | 0;
	            }
	            while (carry > 0) {
	                digits.push(carry % this.base);
	                carry = (carry / this.base) | 0;
	            }
	        }
	        let string = "";
	        // deal with leading zeros
	        for (let k = 0; source[k] === 0 && k < source.length - 1; ++k) {
	            string += this._leader;
	        }
	        // convert digits to a string
	        for (let q = digits.length - 1; q >= 0; --q) {
	            string += this.alphabet[digits[q]];
	        }
	        return string;
	    }
	    decode(value) {
	        if (typeof (value) !== "string") {
	            throw new TypeError("Expected String");
	        }
	        let bytes = [];
	        if (value.length === 0) {
	            return new Uint8Array(bytes);
	        }
	        bytes.push(0);
	        for (let i = 0; i < value.length; i++) {
	            let byte = this._alphabetMap[value[i]];
	            if (byte === undefined) {
	                throw new Error("Non-base" + this.base + " character");
	            }
	            let carry = byte;
	            for (let j = 0; j < bytes.length; ++j) {
	                carry += bytes[j] * this.base;
	                bytes[j] = carry & 0xff;
	                carry >>= 8;
	            }
	            while (carry > 0) {
	                bytes.push(carry & 0xff);
	                carry >>= 8;
	            }
	        }
	        // deal with leading zeros
	        for (let k = 0; value[k] === this._leader && k < value.length - 1; ++k) {
	            bytes.push(0);
	        }
	        return arrayify(new Uint8Array(bytes.reverse()));
	    }
	}
	new BaseX("abcdefghijklmnopqrstuvwxyz234567");
	const Base58 = new BaseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
	//console.log(Base58.decode("Qmd2V777o5XvJbYMeMb8k2nU5f8d3ciUQ5YpYuWhzv8iDj"))
	//console.log(Base58.encode(Base58.decode("Qmd2V777o5XvJbYMeMb8k2nU5f8d3ciUQ5YpYuWhzv8iDj")))

	const version$4 = "sha2/5.7.0";

	new Logger(version$4);
	function sha256(data) {
	    return "0x" + (hash.sha256().update(arrayify(data)).digest("hex"));
	}

	const version$3 = "networks/5.7.1";

	const logger$6 = new Logger(version$3);
	function isRenetworkable(value) {
	    return (value && typeof (value.renetwork) === "function");
	}
	function ethDefaultProvider(network) {
	    const func = function (providers, options) {
	        if (options == null) {
	            options = {};
	        }
	        const providerList = [];
	        if (providers.InfuraProvider && options.infura !== "-") {
	            try {
	                providerList.push(new providers.InfuraProvider(network, options.infura));
	            }
	            catch (error) { }
	        }
	        if (providers.EtherscanProvider && options.etherscan !== "-") {
	            try {
	                providerList.push(new providers.EtherscanProvider(network, options.etherscan));
	            }
	            catch (error) { }
	        }
	        if (providers.AlchemyProvider && options.alchemy !== "-") {
	            try {
	                providerList.push(new providers.AlchemyProvider(network, options.alchemy));
	            }
	            catch (error) { }
	        }
	        if (providers.PocketProvider && options.pocket !== "-") {
	            // These networks are currently faulty on Pocket as their
	            // network does not handle the Berlin hardfork, which is
	            // live on these ones.
	            // @TODO: This goes away once Pocket has upgraded their nodes
	            const skip = ["goerli", "ropsten", "rinkeby", "sepolia"];
	            try {
	                const provider = new providers.PocketProvider(network, options.pocket);
	                if (provider.network && skip.indexOf(provider.network.name) === -1) {
	                    providerList.push(provider);
	                }
	            }
	            catch (error) { }
	        }
	        if (providers.CloudflareProvider && options.cloudflare !== "-") {
	            try {
	                providerList.push(new providers.CloudflareProvider(network));
	            }
	            catch (error) { }
	        }
	        if (providers.AnkrProvider && options.ankr !== "-") {
	            try {
	                const skip = ["ropsten"];
	                const provider = new providers.AnkrProvider(network, options.ankr);
	                if (provider.network && skip.indexOf(provider.network.name) === -1) {
	                    providerList.push(provider);
	                }
	            }
	            catch (error) { }
	        }
	        if (providerList.length === 0) {
	            return null;
	        }
	        if (providers.FallbackProvider) {
	            let quorum = 1;
	            if (options.quorum != null) {
	                quorum = options.quorum;
	            }
	            else if (network === "homestead") {
	                quorum = 2;
	            }
	            return new providers.FallbackProvider(providerList, quorum);
	        }
	        return providerList[0];
	    };
	    func.renetwork = function (network) {
	        return ethDefaultProvider(network);
	    };
	    return func;
	}
	function etcDefaultProvider(url, network) {
	    const func = function (providers, options) {
	        if (providers.JsonRpcProvider) {
	            return new providers.JsonRpcProvider(url, network);
	        }
	        return null;
	    };
	    func.renetwork = function (network) {
	        return etcDefaultProvider(url, network);
	    };
	    return func;
	}
	const homestead = {
	    chainId: 1,
	    ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
	    name: "homestead",
	    _defaultProvider: ethDefaultProvider("homestead")
	};
	const ropsten = {
	    chainId: 3,
	    ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
	    name: "ropsten",
	    _defaultProvider: ethDefaultProvider("ropsten")
	};
	const classicMordor = {
	    chainId: 63,
	    name: "classicMordor",
	    _defaultProvider: etcDefaultProvider("https://www.ethercluster.com/mordor", "classicMordor")
	};
	// See: https://chainlist.org
	const networks = {
	    unspecified: { chainId: 0, name: "unspecified" },
	    homestead: homestead,
	    mainnet: homestead,
	    morden: { chainId: 2, name: "morden" },
	    ropsten: ropsten,
	    testnet: ropsten,
	    rinkeby: {
	        chainId: 4,
	        ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
	        name: "rinkeby",
	        _defaultProvider: ethDefaultProvider("rinkeby")
	    },
	    kovan: {
	        chainId: 42,
	        name: "kovan",
	        _defaultProvider: ethDefaultProvider("kovan")
	    },
	    goerli: {
	        chainId: 5,
	        ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
	        name: "goerli",
	        _defaultProvider: ethDefaultProvider("goerli")
	    },
	    kintsugi: { chainId: 1337702, name: "kintsugi" },
	    sepolia: {
	        chainId: 11155111,
	        name: "sepolia",
	        _defaultProvider: ethDefaultProvider("sepolia")
	    },
	    // ETC (See: #351)
	    classic: {
	        chainId: 61,
	        name: "classic",
	        _defaultProvider: etcDefaultProvider("https:/\/www.ethercluster.com/etc", "classic")
	    },
	    classicMorden: { chainId: 62, name: "classicMorden" },
	    classicMordor: classicMordor,
	    classicTestnet: classicMordor,
	    classicKotti: {
	        chainId: 6,
	        name: "classicKotti",
	        _defaultProvider: etcDefaultProvider("https:/\/www.ethercluster.com/kotti", "classicKotti")
	    },
	    xdai: { chainId: 100, name: "xdai" },
	    matic: {
	        chainId: 137,
	        name: "matic",
	        _defaultProvider: ethDefaultProvider("matic")
	    },
	    maticmum: { chainId: 80001, name: "maticmum" },
	    optimism: {
	        chainId: 10,
	        name: "optimism",
	        _defaultProvider: ethDefaultProvider("optimism")
	    },
	    "optimism-kovan": { chainId: 69, name: "optimism-kovan" },
	    "optimism-goerli": { chainId: 420, name: "optimism-goerli" },
	    arbitrum: { chainId: 42161, name: "arbitrum" },
	    "arbitrum-rinkeby": { chainId: 421611, name: "arbitrum-rinkeby" },
	    "arbitrum-goerli": { chainId: 421613, name: "arbitrum-goerli" },
	    bnb: { chainId: 56, name: "bnb" },
	    bnbt: { chainId: 97, name: "bnbt" },
	};
	/**
	 *  getNetwork
	 *
	 *  Converts a named common networks or chain ID (network ID) to a Network
	 *  and verifies a network is a valid Network..
	 */
	function getNetwork(network) {
	    // No network (null)
	    if (network == null) {
	        return null;
	    }
	    if (typeof (network) === "number") {
	        for (const name in networks) {
	            const standard = networks[name];
	            if (standard.chainId === network) {
	                return {
	                    name: standard.name,
	                    chainId: standard.chainId,
	                    ensAddress: (standard.ensAddress || null),
	                    _defaultProvider: (standard._defaultProvider || null)
	                };
	            }
	        }
	        return {
	            chainId: network,
	            name: "unknown"
	        };
	    }
	    if (typeof (network) === "string") {
	        const standard = networks[network];
	        if (standard == null) {
	            return null;
	        }
	        return {
	            name: standard.name,
	            chainId: standard.chainId,
	            ensAddress: standard.ensAddress,
	            _defaultProvider: (standard._defaultProvider || null)
	        };
	    }
	    const standard = networks[network.name];
	    // Not a standard network; check that it is a valid network in general
	    if (!standard) {
	        if (typeof (network.chainId) !== "number") {
	            logger$6.throwArgumentError("invalid network chainId", "network", network);
	        }
	        return network;
	    }
	    // Make sure the chainId matches the expected network chainId (or is 0; disable EIP-155)
	    if (network.chainId !== 0 && network.chainId !== standard.chainId) {
	        logger$6.throwArgumentError("network chainId mismatch", "network", network);
	    }
	    // @TODO: In the next major version add an attach function to a defaultProvider
	    // class and move the _defaultProvider internal to this file (extend Network)
	    let defaultProvider = network._defaultProvider || null;
	    if (defaultProvider == null && standard._defaultProvider) {
	        if (isRenetworkable(standard._defaultProvider)) {
	            defaultProvider = standard._defaultProvider.renetwork(network);
	        }
	        else {
	            defaultProvider = standard._defaultProvider;
	        }
	    }
	    // Standard Network (allow overriding the ENS address)
	    return {
	        name: network.name,
	        chainId: standard.chainId,
	        ensAddress: (network.ensAddress || standard.ensAddress || null),
	        _defaultProvider: defaultProvider
	    };
	}

	const version$2 = "web/5.7.1";

	var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	function getUrl(href, options) {
	    return __awaiter$3(this, void 0, void 0, function* () {
	        if (options == null) {
	            options = {};
	        }
	        const request = {
	            method: (options.method || "GET"),
	            headers: (options.headers || {}),
	            body: (options.body || undefined),
	        };
	        if (options.skipFetchSetup !== true) {
	            request.mode = "cors"; // no-cors, cors, *same-origin
	            request.cache = "no-cache"; // *default, no-cache, reload, force-cache, only-if-cached
	            request.credentials = "same-origin"; // include, *same-origin, omit
	            request.redirect = "follow"; // manual, *follow, error
	            request.referrer = "client"; // no-referrer, *client
	        }
	        if (options.fetchOptions != null) {
	            const opts = options.fetchOptions;
	            if (opts.mode) {
	                request.mode = (opts.mode);
	            }
	            if (opts.cache) {
	                request.cache = (opts.cache);
	            }
	            if (opts.credentials) {
	                request.credentials = (opts.credentials);
	            }
	            if (opts.redirect) {
	                request.redirect = (opts.redirect);
	            }
	            if (opts.referrer) {
	                request.referrer = opts.referrer;
	            }
	        }
	        const response = yield fetch(href, request);
	        const body = yield response.arrayBuffer();
	        const headers = {};
	        if (response.headers.forEach) {
	            response.headers.forEach((value, key) => {
	                headers[key.toLowerCase()] = value;
	            });
	        }
	        else {
	            ((response.headers).keys)().forEach((key) => {
	                headers[key.toLowerCase()] = response.headers.get(key);
	            });
	        }
	        return {
	            headers: headers,
	            statusCode: response.status,
	            statusMessage: response.statusText,
	            body: arrayify(new Uint8Array(body)),
	        };
	    });
	}

	var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$5 = new Logger(version$2);
	function staller(duration) {
	    return new Promise((resolve) => {
	        setTimeout(resolve, duration);
	    });
	}
	function bodyify(value, type) {
	    if (value == null) {
	        return null;
	    }
	    if (typeof (value) === "string") {
	        return value;
	    }
	    if (isBytesLike(value)) {
	        if (type && (type.split("/")[0] === "text" || type.split(";")[0].trim() === "application/json")) {
	            try {
	                return toUtf8String(value);
	            }
	            catch (error) { }
	        }
	        return hexlify(value);
	    }
	    return value;
	}
	function unpercent(value) {
	    return toUtf8Bytes(value.replace(/%([0-9a-f][0-9a-f])/gi, (all, code) => {
	        return String.fromCharCode(parseInt(code, 16));
	    }));
	}
	// This API is still a work in progress; the future changes will likely be:
	// - ConnectionInfo => FetchDataRequest<T = any>
	// - FetchDataRequest.body? = string | Uint8Array | { contentType: string, data: string | Uint8Array }
	//   - If string => text/plain, Uint8Array => application/octet-stream (if content-type unspecified)
	// - FetchDataRequest.processFunc = (body: Uint8Array, response: FetchDataResponse) => T
	// For this reason, it should be considered internal until the API is finalized
	function _fetchData(connection, body, processFunc) {
	    // How many times to retry in the event of a throttle
	    const attemptLimit = (typeof (connection) === "object" && connection.throttleLimit != null) ? connection.throttleLimit : 12;
	    logger$5.assertArgument((attemptLimit > 0 && (attemptLimit % 1) === 0), "invalid connection throttle limit", "connection.throttleLimit", attemptLimit);
	    const throttleCallback = ((typeof (connection) === "object") ? connection.throttleCallback : null);
	    const throttleSlotInterval = ((typeof (connection) === "object" && typeof (connection.throttleSlotInterval) === "number") ? connection.throttleSlotInterval : 100);
	    logger$5.assertArgument((throttleSlotInterval > 0 && (throttleSlotInterval % 1) === 0), "invalid connection throttle slot interval", "connection.throttleSlotInterval", throttleSlotInterval);
	    const errorPassThrough = ((typeof (connection) === "object") ? !!(connection.errorPassThrough) : false);
	    const headers = {};
	    let url = null;
	    // @TODO: Allow ConnectionInfo to override some of these values
	    const options = {
	        method: "GET",
	    };
	    let allow304 = false;
	    let timeout = 2 * 60 * 1000;
	    if (typeof (connection) === "string") {
	        url = connection;
	    }
	    else if (typeof (connection) === "object") {
	        if (connection == null || connection.url == null) {
	            logger$5.throwArgumentError("missing URL", "connection.url", connection);
	        }
	        url = connection.url;
	        if (typeof (connection.timeout) === "number" && connection.timeout > 0) {
	            timeout = connection.timeout;
	        }
	        if (connection.headers) {
	            for (const key in connection.headers) {
	                headers[key.toLowerCase()] = { key: key, value: String(connection.headers[key]) };
	                if (["if-none-match", "if-modified-since"].indexOf(key.toLowerCase()) >= 0) {
	                    allow304 = true;
	                }
	            }
	        }
	        options.allowGzip = !!connection.allowGzip;
	        if (connection.user != null && connection.password != null) {
	            if (url.substring(0, 6) !== "https:" && connection.allowInsecureAuthentication !== true) {
	                logger$5.throwError("basic authentication requires a secure https url", Logger.errors.INVALID_ARGUMENT, { argument: "url", url: url, user: connection.user, password: "[REDACTED]" });
	            }
	            const authorization = connection.user + ":" + connection.password;
	            headers["authorization"] = {
	                key: "Authorization",
	                value: "Basic " + encode$1(toUtf8Bytes(authorization))
	            };
	        }
	        if (connection.skipFetchSetup != null) {
	            options.skipFetchSetup = !!connection.skipFetchSetup;
	        }
	        if (connection.fetchOptions != null) {
	            options.fetchOptions = shallowCopy(connection.fetchOptions);
	        }
	    }
	    const reData = new RegExp("^data:([^;:]*)?(;base64)?,(.*)$", "i");
	    const dataMatch = ((url) ? url.match(reData) : null);
	    if (dataMatch) {
	        try {
	            const response = {
	                statusCode: 200,
	                statusMessage: "OK",
	                headers: { "content-type": (dataMatch[1] || "text/plain") },
	                body: (dataMatch[2] ? decode$1(dataMatch[3]) : unpercent(dataMatch[3]))
	            };
	            let result = response.body;
	            if (processFunc) {
	                result = processFunc(response.body, response);
	            }
	            return Promise.resolve(result);
	        }
	        catch (error) {
	            logger$5.throwError("processing response error", Logger.errors.SERVER_ERROR, {
	                body: bodyify(dataMatch[1], dataMatch[2]),
	                error: error,
	                requestBody: null,
	                requestMethod: "GET",
	                url: url
	            });
	        }
	    }
	    if (body) {
	        options.method = "POST";
	        options.body = body;
	        if (headers["content-type"] == null) {
	            headers["content-type"] = { key: "Content-Type", value: "application/octet-stream" };
	        }
	        if (headers["content-length"] == null) {
	            headers["content-length"] = { key: "Content-Length", value: String(body.length) };
	        }
	    }
	    const flatHeaders = {};
	    Object.keys(headers).forEach((key) => {
	        const header = headers[key];
	        flatHeaders[header.key] = header.value;
	    });
	    options.headers = flatHeaders;
	    const runningTimeout = (function () {
	        let timer = null;
	        const promise = new Promise(function (resolve, reject) {
	            if (timeout) {
	                timer = setTimeout(() => {
	                    if (timer == null) {
	                        return;
	                    }
	                    timer = null;
	                    reject(logger$5.makeError("timeout", Logger.errors.TIMEOUT, {
	                        requestBody: bodyify(options.body, flatHeaders["content-type"]),
	                        requestMethod: options.method,
	                        timeout: timeout,
	                        url: url
	                    }));
	                }, timeout);
	            }
	        });
	        const cancel = function () {
	            if (timer == null) {
	                return;
	            }
	            clearTimeout(timer);
	            timer = null;
	        };
	        return { promise, cancel };
	    })();
	    const runningFetch = (function () {
	        return __awaiter$2(this, void 0, void 0, function* () {
	            for (let attempt = 0; attempt < attemptLimit; attempt++) {
	                let response = null;
	                try {
	                    response = yield getUrl(url, options);
	                    if (attempt < attemptLimit) {
	                        if (response.statusCode === 301 || response.statusCode === 302) {
	                            // Redirection; for now we only support absolute locataions
	                            const location = response.headers.location || "";
	                            if (options.method === "GET" && location.match(/^https:/)) {
	                                url = response.headers.location;
	                                continue;
	                            }
	                        }
	                        else if (response.statusCode === 429) {
	                            // Exponential back-off throttling
	                            let tryAgain = true;
	                            if (throttleCallback) {
	                                tryAgain = yield throttleCallback(attempt, url);
	                            }
	                            if (tryAgain) {
	                                let stall = 0;
	                                const retryAfter = response.headers["retry-after"];
	                                if (typeof (retryAfter) === "string" && retryAfter.match(/^[1-9][0-9]*$/)) {
	                                    stall = parseInt(retryAfter) * 1000;
	                                }
	                                else {
	                                    stall = throttleSlotInterval * parseInt(String(Math.random() * Math.pow(2, attempt)));
	                                }
	                                //console.log("Stalling 429");
	                                yield staller(stall);
	                                continue;
	                            }
	                        }
	                    }
	                }
	                catch (error) {
	                    response = error.response;
	                    if (response == null) {
	                        runningTimeout.cancel();
	                        logger$5.throwError("missing response", Logger.errors.SERVER_ERROR, {
	                            requestBody: bodyify(options.body, flatHeaders["content-type"]),
	                            requestMethod: options.method,
	                            serverError: error,
	                            url: url
	                        });
	                    }
	                }
	                let body = response.body;
	                if (allow304 && response.statusCode === 304) {
	                    body = null;
	                }
	                else if (!errorPassThrough && (response.statusCode < 200 || response.statusCode >= 300)) {
	                    runningTimeout.cancel();
	                    logger$5.throwError("bad response", Logger.errors.SERVER_ERROR, {
	                        status: response.statusCode,
	                        headers: response.headers,
	                        body: bodyify(body, ((response.headers) ? response.headers["content-type"] : null)),
	                        requestBody: bodyify(options.body, flatHeaders["content-type"]),
	                        requestMethod: options.method,
	                        url: url
	                    });
	                }
	                if (processFunc) {
	                    try {
	                        const result = yield processFunc(body, response);
	                        runningTimeout.cancel();
	                        return result;
	                    }
	                    catch (error) {
	                        // Allow the processFunc to trigger a throttle
	                        if (error.throttleRetry && attempt < attemptLimit) {
	                            let tryAgain = true;
	                            if (throttleCallback) {
	                                tryAgain = yield throttleCallback(attempt, url);
	                            }
	                            if (tryAgain) {
	                                const timeout = throttleSlotInterval * parseInt(String(Math.random() * Math.pow(2, attempt)));
	                                //console.log("Stalling callback");
	                                yield staller(timeout);
	                                continue;
	                            }
	                        }
	                        runningTimeout.cancel();
	                        logger$5.throwError("processing response error", Logger.errors.SERVER_ERROR, {
	                            body: bodyify(body, ((response.headers) ? response.headers["content-type"] : null)),
	                            error: error,
	                            requestBody: bodyify(options.body, flatHeaders["content-type"]),
	                            requestMethod: options.method,
	                            url: url
	                        });
	                    }
	                }
	                runningTimeout.cancel();
	                // If we had a processFunc, it either returned a T or threw above.
	                // The "body" is now a Uint8Array.
	                return body;
	            }
	            return logger$5.throwError("failed response", Logger.errors.SERVER_ERROR, {
	                requestBody: bodyify(options.body, flatHeaders["content-type"]),
	                requestMethod: options.method,
	                url: url
	            });
	        });
	    })();
	    return Promise.race([runningTimeout.promise, runningFetch]);
	}
	function fetchJson(connection, json, processFunc) {
	    let processJsonFunc = (value, response) => {
	        let result = null;
	        if (value != null) {
	            try {
	                result = JSON.parse(toUtf8String(value));
	            }
	            catch (error) {
	                logger$5.throwError("invalid JSON", Logger.errors.SERVER_ERROR, {
	                    body: value,
	                    error: error
	                });
	            }
	        }
	        if (processFunc) {
	            result = processFunc(result, response);
	        }
	        return result;
	    };
	    // If we have json to send, we must
	    // - add content-type of application/json (unless already overridden)
	    // - convert the json to bytes
	    let body = null;
	    if (json != null) {
	        body = toUtf8Bytes(json);
	        // Create a connection with the content-type set for JSON
	        const updated = (typeof (connection) === "string") ? ({ url: connection }) : shallowCopy(connection);
	        if (updated.headers) {
	            const hasContentType = (Object.keys(updated.headers).filter((k) => (k.toLowerCase() === "content-type")).length) !== 0;
	            if (!hasContentType) {
	                updated.headers = shallowCopy(updated.headers);
	                updated.headers["content-type"] = "application/json";
	            }
	        }
	        else {
	            updated.headers = { "content-type": "application/json" };
	        }
	        connection = updated;
	    }
	    return _fetchData(connection, body, processJsonFunc);
	}
	function poll(func, options) {
	    if (!options) {
	        options = {};
	    }
	    options = shallowCopy(options);
	    if (options.floor == null) {
	        options.floor = 0;
	    }
	    if (options.ceiling == null) {
	        options.ceiling = 10000;
	    }
	    if (options.interval == null) {
	        options.interval = 250;
	    }
	    return new Promise(function (resolve, reject) {
	        let timer = null;
	        let done = false;
	        // Returns true if cancel was successful. Unsuccessful cancel means we're already done.
	        const cancel = () => {
	            if (done) {
	                return false;
	            }
	            done = true;
	            if (timer) {
	                clearTimeout(timer);
	            }
	            return true;
	        };
	        if (options.timeout) {
	            timer = setTimeout(() => {
	                if (cancel()) {
	                    reject(new Error("timeout"));
	                }
	            }, options.timeout);
	        }
	        const retryLimit = options.retryLimit;
	        let attempt = 0;
	        function check() {
	            return func().then(function (result) {
	                // If we have a result, or are allowed null then we're done
	                if (result !== undefined) {
	                    if (cancel()) {
	                        resolve(result);
	                    }
	                }
	                else if (options.oncePoll) {
	                    options.oncePoll.once("poll", check);
	                }
	                else if (options.onceBlock) {
	                    options.onceBlock.once("block", check);
	                    // Otherwise, exponential back-off (up to 10s) our next request
	                }
	                else if (!done) {
	                    attempt++;
	                    if (attempt > retryLimit) {
	                        if (cancel()) {
	                            reject(new Error("retry limit reached"));
	                        }
	                        return;
	                    }
	                    let timeout = options.interval * parseInt(String(Math.random() * Math.pow(2, attempt)));
	                    if (timeout < options.floor) {
	                        timeout = options.floor;
	                    }
	                    if (timeout > options.ceiling) {
	                        timeout = options.ceiling;
	                    }
	                    setTimeout(check, timeout);
	                }
	                return null;
	            }, function (error) {
	                if (cancel()) {
	                    reject(error);
	                }
	            });
	        }
	        check();
	    });
	}

	var ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

	// pre-compute lookup table
	var ALPHABET_MAP = {};
	for (var z = 0; z < ALPHABET.length; z++) {
	  var x = ALPHABET.charAt(z);

	  if (ALPHABET_MAP[x] !== undefined) throw new TypeError(x + ' is ambiguous')
	  ALPHABET_MAP[x] = z;
	}

	function polymodStep (pre) {
	  var b = pre >> 25;
	  return ((pre & 0x1FFFFFF) << 5) ^
	    (-((b >> 0) & 1) & 0x3b6a57b2) ^
	    (-((b >> 1) & 1) & 0x26508e6d) ^
	    (-((b >> 2) & 1) & 0x1ea119fa) ^
	    (-((b >> 3) & 1) & 0x3d4233dd) ^
	    (-((b >> 4) & 1) & 0x2a1462b3)
	}

	function prefixChk (prefix) {
	  var chk = 1;
	  for (var i = 0; i < prefix.length; ++i) {
	    var c = prefix.charCodeAt(i);
	    if (c < 33 || c > 126) return 'Invalid prefix (' + prefix + ')'

	    chk = polymodStep(chk) ^ (c >> 5);
	  }
	  chk = polymodStep(chk);

	  for (i = 0; i < prefix.length; ++i) {
	    var v = prefix.charCodeAt(i);
	    chk = polymodStep(chk) ^ (v & 0x1f);
	  }
	  return chk
	}

	function encode (prefix, words, LIMIT) {
	  LIMIT = LIMIT || 90;
	  if ((prefix.length + 7 + words.length) > LIMIT) throw new TypeError('Exceeds length limit')

	  prefix = prefix.toLowerCase();

	  // determine chk mod
	  var chk = prefixChk(prefix);
	  if (typeof chk === 'string') throw new Error(chk)

	  var result = prefix + '1';
	  for (var i = 0; i < words.length; ++i) {
	    var x = words[i];
	    if ((x >> 5) !== 0) throw new Error('Non 5-bit word')

	    chk = polymodStep(chk) ^ x;
	    result += ALPHABET.charAt(x);
	  }

	  for (i = 0; i < 6; ++i) {
	    chk = polymodStep(chk);
	  }
	  chk ^= 1;

	  for (i = 0; i < 6; ++i) {
	    var v = (chk >> ((5 - i) * 5)) & 0x1f;
	    result += ALPHABET.charAt(v);
	  }

	  return result
	}

	function __decode (str, LIMIT) {
	  LIMIT = LIMIT || 90;
	  if (str.length < 8) return str + ' too short'
	  if (str.length > LIMIT) return 'Exceeds length limit'

	  // don't allow mixed case
	  var lowered = str.toLowerCase();
	  var uppered = str.toUpperCase();
	  if (str !== lowered && str !== uppered) return 'Mixed-case string ' + str
	  str = lowered;

	  var split = str.lastIndexOf('1');
	  if (split === -1) return 'No separator character for ' + str
	  if (split === 0) return 'Missing prefix for ' + str

	  var prefix = str.slice(0, split);
	  var wordChars = str.slice(split + 1);
	  if (wordChars.length < 6) return 'Data too short'

	  var chk = prefixChk(prefix);
	  if (typeof chk === 'string') return chk

	  var words = [];
	  for (var i = 0; i < wordChars.length; ++i) {
	    var c = wordChars.charAt(i);
	    var v = ALPHABET_MAP[c];
	    if (v === undefined) return 'Unknown character ' + c
	    chk = polymodStep(chk) ^ v;

	    // not in the checksum?
	    if (i + 6 >= wordChars.length) continue
	    words.push(v);
	  }

	  if (chk !== 1) return 'Invalid checksum for ' + str
	  return { prefix: prefix, words: words }
	}

	function decodeUnsafe () {
	  var res = __decode.apply(null, arguments);
	  if (typeof res === 'object') return res
	}

	function decode (str) {
	  var res = __decode.apply(null, arguments);
	  if (typeof res === 'object') return res

	  throw new Error(res)
	}

	function convert (data, inBits, outBits, pad) {
	  var value = 0;
	  var bits = 0;
	  var maxV = (1 << outBits) - 1;

	  var result = [];
	  for (var i = 0; i < data.length; ++i) {
	    value = (value << inBits) | data[i];
	    bits += inBits;

	    while (bits >= outBits) {
	      bits -= outBits;
	      result.push((value >> bits) & maxV);
	    }
	  }

	  if (pad) {
	    if (bits > 0) {
	      result.push((value << (outBits - bits)) & maxV);
	    }
	  } else {
	    if (bits >= inBits) return 'Excess padding'
	    if ((value << (outBits - bits)) & maxV) return 'Non-zero padding'
	  }

	  return result
	}

	function toWordsUnsafe (bytes) {
	  var res = convert(bytes, 8, 5, true);
	  if (Array.isArray(res)) return res
	}

	function toWords (bytes) {
	  var res = convert(bytes, 8, 5, true);
	  if (Array.isArray(res)) return res

	  throw new Error(res)
	}

	function fromWordsUnsafe (words) {
	  var res = convert(words, 5, 8, false);
	  if (Array.isArray(res)) return res
	}

	function fromWords (words) {
	  var res = convert(words, 5, 8, false);
	  if (Array.isArray(res)) return res

	  throw new Error(res)
	}

	var bech32 = {
	  decodeUnsafe: decodeUnsafe,
	  decode: decode,
	  encode: encode,
	  toWordsUnsafe: toWordsUnsafe,
	  toWords: toWords,
	  fromWordsUnsafe: fromWordsUnsafe,
	  fromWords: fromWords
	};

	const version$1 = "providers/5.7.2";

	const logger$4 = new Logger(version$1);
	class Formatter {
	    constructor() {
	        this.formats = this.getDefaultFormats();
	    }
	    getDefaultFormats() {
	        const formats = ({});
	        const address = this.address.bind(this);
	        const bigNumber = this.bigNumber.bind(this);
	        const blockTag = this.blockTag.bind(this);
	        const data = this.data.bind(this);
	        const hash = this.hash.bind(this);
	        const hex = this.hex.bind(this);
	        const number = this.number.bind(this);
	        const type = this.type.bind(this);
	        const strictData = (v) => { return this.data(v, true); };
	        formats.transaction = {
	            hash: hash,
	            type: type,
	            accessList: Formatter.allowNull(this.accessList.bind(this), null),
	            blockHash: Formatter.allowNull(hash, null),
	            blockNumber: Formatter.allowNull(number, null),
	            transactionIndex: Formatter.allowNull(number, null),
	            confirmations: Formatter.allowNull(number, null),
	            from: address,
	            // either (gasPrice) or (maxPriorityFeePerGas + maxFeePerGas)
	            // must be set
	            gasPrice: Formatter.allowNull(bigNumber),
	            maxPriorityFeePerGas: Formatter.allowNull(bigNumber),
	            maxFeePerGas: Formatter.allowNull(bigNumber),
	            gasLimit: bigNumber,
	            to: Formatter.allowNull(address, null),
	            value: bigNumber,
	            nonce: number,
	            data: data,
	            r: Formatter.allowNull(this.uint256),
	            s: Formatter.allowNull(this.uint256),
	            v: Formatter.allowNull(number),
	            creates: Formatter.allowNull(address, null),
	            raw: Formatter.allowNull(data),
	        };
	        formats.transactionRequest = {
	            from: Formatter.allowNull(address),
	            nonce: Formatter.allowNull(number),
	            gasLimit: Formatter.allowNull(bigNumber),
	            gasPrice: Formatter.allowNull(bigNumber),
	            maxPriorityFeePerGas: Formatter.allowNull(bigNumber),
	            maxFeePerGas: Formatter.allowNull(bigNumber),
	            to: Formatter.allowNull(address),
	            value: Formatter.allowNull(bigNumber),
	            data: Formatter.allowNull(strictData),
	            type: Formatter.allowNull(number),
	            accessList: Formatter.allowNull(this.accessList.bind(this), null),
	        };
	        formats.receiptLog = {
	            transactionIndex: number,
	            blockNumber: number,
	            transactionHash: hash,
	            address: address,
	            topics: Formatter.arrayOf(hash),
	            data: data,
	            logIndex: number,
	            blockHash: hash,
	        };
	        formats.receipt = {
	            to: Formatter.allowNull(this.address, null),
	            from: Formatter.allowNull(this.address, null),
	            contractAddress: Formatter.allowNull(address, null),
	            transactionIndex: number,
	            // should be allowNull(hash), but broken-EIP-658 support is handled in receipt
	            root: Formatter.allowNull(hex),
	            gasUsed: bigNumber,
	            logsBloom: Formatter.allowNull(data),
	            blockHash: hash,
	            transactionHash: hash,
	            logs: Formatter.arrayOf(this.receiptLog.bind(this)),
	            blockNumber: number,
	            confirmations: Formatter.allowNull(number, null),
	            cumulativeGasUsed: bigNumber,
	            effectiveGasPrice: Formatter.allowNull(bigNumber),
	            status: Formatter.allowNull(number),
	            type: type
	        };
	        formats.block = {
	            hash: Formatter.allowNull(hash),
	            parentHash: hash,
	            number: number,
	            timestamp: number,
	            nonce: Formatter.allowNull(hex),
	            difficulty: this.difficulty.bind(this),
	            gasLimit: bigNumber,
	            gasUsed: bigNumber,
	            miner: Formatter.allowNull(address),
	            extraData: data,
	            transactions: Formatter.allowNull(Formatter.arrayOf(hash)),
	            baseFeePerGas: Formatter.allowNull(bigNumber)
	        };
	        formats.blockWithTransactions = shallowCopy(formats.block);
	        formats.blockWithTransactions.transactions = Formatter.allowNull(Formatter.arrayOf(this.transactionResponse.bind(this)));
	        formats.filter = {
	            fromBlock: Formatter.allowNull(blockTag, undefined),
	            toBlock: Formatter.allowNull(blockTag, undefined),
	            blockHash: Formatter.allowNull(hash, undefined),
	            address: Formatter.allowNull(address, undefined),
	            topics: Formatter.allowNull(this.topics.bind(this), undefined),
	        };
	        formats.filterLog = {
	            blockNumber: Formatter.allowNull(number),
	            blockHash: Formatter.allowNull(hash),
	            transactionIndex: number,
	            removed: Formatter.allowNull(this.boolean.bind(this)),
	            address: address,
	            data: Formatter.allowFalsish(data, "0x"),
	            topics: Formatter.arrayOf(hash),
	            transactionHash: hash,
	            logIndex: number,
	        };
	        return formats;
	    }
	    accessList(accessList) {
	        return accessListify(accessList || []);
	    }
	    // Requires a BigNumberish that is within the IEEE754 safe integer range; returns a number
	    // Strict! Used on input.
	    number(number) {
	        if (number === "0x") {
	            return 0;
	        }
	        return BigNumber.from(number).toNumber();
	    }
	    type(number) {
	        if (number === "0x" || number == null) {
	            return 0;
	        }
	        return BigNumber.from(number).toNumber();
	    }
	    // Strict! Used on input.
	    bigNumber(value) {
	        return BigNumber.from(value);
	    }
	    // Requires a boolean, "true" or  "false"; returns a boolean
	    boolean(value) {
	        if (typeof (value) === "boolean") {
	            return value;
	        }
	        if (typeof (value) === "string") {
	            value = value.toLowerCase();
	            if (value === "true") {
	                return true;
	            }
	            if (value === "false") {
	                return false;
	            }
	        }
	        throw new Error("invalid boolean - " + value);
	    }
	    hex(value, strict) {
	        if (typeof (value) === "string") {
	            if (!strict && value.substring(0, 2) !== "0x") {
	                value = "0x" + value;
	            }
	            if (isHexString(value)) {
	                return value.toLowerCase();
	            }
	        }
	        return logger$4.throwArgumentError("invalid hash", "value", value);
	    }
	    data(value, strict) {
	        const result = this.hex(value, strict);
	        if ((result.length % 2) !== 0) {
	            throw new Error("invalid data; odd-length - " + value);
	        }
	        return result;
	    }
	    // Requires an address
	    // Strict! Used on input.
	    address(value) {
	        return getAddress(value);
	    }
	    callAddress(value) {
	        if (!isHexString(value, 32)) {
	            return null;
	        }
	        const address = getAddress(hexDataSlice(value, 12));
	        return (address === AddressZero) ? null : address;
	    }
	    contractAddress(value) {
	        return getContractAddress(value);
	    }
	    // Strict! Used on input.
	    blockTag(blockTag) {
	        if (blockTag == null) {
	            return "latest";
	        }
	        if (blockTag === "earliest") {
	            return "0x0";
	        }
	        switch (blockTag) {
	            case "earliest": return "0x0";
	            case "latest":
	            case "pending":
	            case "safe":
	            case "finalized":
	                return blockTag;
	        }
	        if (typeof (blockTag) === "number" || isHexString(blockTag)) {
	            return hexValue(blockTag);
	        }
	        throw new Error("invalid blockTag");
	    }
	    // Requires a hash, optionally requires 0x prefix; returns prefixed lowercase hash.
	    hash(value, strict) {
	        const result = this.hex(value, strict);
	        if (hexDataLength(result) !== 32) {
	            return logger$4.throwArgumentError("invalid hash", "value", value);
	        }
	        return result;
	    }
	    // Returns the difficulty as a number, or if too large (i.e. PoA network) null
	    difficulty(value) {
	        if (value == null) {
	            return null;
	        }
	        const v = BigNumber.from(value);
	        try {
	            return v.toNumber();
	        }
	        catch (error) { }
	        return null;
	    }
	    uint256(value) {
	        if (!isHexString(value)) {
	            throw new Error("invalid uint256");
	        }
	        return hexZeroPad(value, 32);
	    }
	    _block(value, format) {
	        if (value.author != null && value.miner == null) {
	            value.miner = value.author;
	        }
	        // The difficulty may need to come from _difficulty in recursed blocks
	        const difficulty = (value._difficulty != null) ? value._difficulty : value.difficulty;
	        const result = Formatter.check(format, value);
	        result._difficulty = ((difficulty == null) ? null : BigNumber.from(difficulty));
	        return result;
	    }
	    block(value) {
	        return this._block(value, this.formats.block);
	    }
	    blockWithTransactions(value) {
	        return this._block(value, this.formats.blockWithTransactions);
	    }
	    // Strict! Used on input.
	    transactionRequest(value) {
	        return Formatter.check(this.formats.transactionRequest, value);
	    }
	    transactionResponse(transaction) {
	        // Rename gas to gasLimit
	        if (transaction.gas != null && transaction.gasLimit == null) {
	            transaction.gasLimit = transaction.gas;
	        }
	        // Some clients (TestRPC) do strange things like return 0x0 for the
	        // 0 address; correct this to be a real address
	        if (transaction.to && BigNumber.from(transaction.to).isZero()) {
	            transaction.to = "0x0000000000000000000000000000000000000000";
	        }
	        // Rename input to data
	        if (transaction.input != null && transaction.data == null) {
	            transaction.data = transaction.input;
	        }
	        // If to and creates are empty, populate the creates from the transaction
	        if (transaction.to == null && transaction.creates == null) {
	            transaction.creates = this.contractAddress(transaction);
	        }
	        if ((transaction.type === 1 || transaction.type === 2) && transaction.accessList == null) {
	            transaction.accessList = [];
	        }
	        const result = Formatter.check(this.formats.transaction, transaction);
	        if (transaction.chainId != null) {
	            let chainId = transaction.chainId;
	            if (isHexString(chainId)) {
	                chainId = BigNumber.from(chainId).toNumber();
	            }
	            result.chainId = chainId;
	        }
	        else {
	            let chainId = transaction.networkId;
	            // geth-etc returns chainId
	            if (chainId == null && result.v == null) {
	                chainId = transaction.chainId;
	            }
	            if (isHexString(chainId)) {
	                chainId = BigNumber.from(chainId).toNumber();
	            }
	            if (typeof (chainId) !== "number" && result.v != null) {
	                chainId = (result.v - 35) / 2;
	                if (chainId < 0) {
	                    chainId = 0;
	                }
	                chainId = parseInt(chainId);
	            }
	            if (typeof (chainId) !== "number") {
	                chainId = 0;
	            }
	            result.chainId = chainId;
	        }
	        // 0x0000... should actually be null
	        if (result.blockHash && result.blockHash.replace(/0/g, "") === "x") {
	            result.blockHash = null;
	        }
	        return result;
	    }
	    transaction(value) {
	        return parse(value);
	    }
	    receiptLog(value) {
	        return Formatter.check(this.formats.receiptLog, value);
	    }
	    receipt(value) {
	        const result = Formatter.check(this.formats.receipt, value);
	        // RSK incorrectly implemented EIP-658, so we munge things a bit here for it
	        if (result.root != null) {
	            if (result.root.length <= 4) {
	                // Could be 0x00, 0x0, 0x01 or 0x1
	                const value = BigNumber.from(result.root).toNumber();
	                if (value === 0 || value === 1) {
	                    // Make sure if both are specified, they match
	                    if (result.status != null && (result.status !== value)) {
	                        logger$4.throwArgumentError("alt-root-status/status mismatch", "value", { root: result.root, status: result.status });
	                    }
	                    result.status = value;
	                    delete result.root;
	                }
	                else {
	                    logger$4.throwArgumentError("invalid alt-root-status", "value.root", result.root);
	                }
	            }
	            else if (result.root.length !== 66) {
	                // Must be a valid bytes32
	                logger$4.throwArgumentError("invalid root hash", "value.root", result.root);
	            }
	        }
	        if (result.status != null) {
	            result.byzantium = true;
	        }
	        return result;
	    }
	    topics(value) {
	        if (Array.isArray(value)) {
	            return value.map((v) => this.topics(v));
	        }
	        else if (value != null) {
	            return this.hash(value, true);
	        }
	        return null;
	    }
	    filter(value) {
	        return Formatter.check(this.formats.filter, value);
	    }
	    filterLog(value) {
	        return Formatter.check(this.formats.filterLog, value);
	    }
	    static check(format, object) {
	        const result = {};
	        for (const key in format) {
	            try {
	                const value = format[key](object[key]);
	                if (value !== undefined) {
	                    result[key] = value;
	                }
	            }
	            catch (error) {
	                error.checkKey = key;
	                error.checkValue = object[key];
	                throw error;
	            }
	        }
	        return result;
	    }
	    // if value is null-ish, nullValue is returned
	    static allowNull(format, nullValue) {
	        return (function (value) {
	            if (value == null) {
	                return nullValue;
	            }
	            return format(value);
	        });
	    }
	    // If value is false-ish, replaceValue is returned
	    static allowFalsish(format, replaceValue) {
	        return (function (value) {
	            if (!value) {
	                return replaceValue;
	            }
	            return format(value);
	        });
	    }
	    // Requires an Array satisfying check
	    static arrayOf(format) {
	        return (function (array) {
	            if (!Array.isArray(array)) {
	                throw new Error("not an array");
	            }
	            const result = [];
	            array.forEach(function (value) {
	                result.push(format(value));
	            });
	            return result;
	        });
	    }
	}

	var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$3 = new Logger(version$1);
	const MAX_CCIP_REDIRECTS = 10;
	//////////////////////////////
	// Event Serializeing
	function checkTopic(topic) {
	    if (topic == null) {
	        return "null";
	    }
	    if (hexDataLength(topic) !== 32) {
	        logger$3.throwArgumentError("invalid topic", "topic", topic);
	    }
	    return topic.toLowerCase();
	}
	function serializeTopics(topics) {
	    // Remove trailing null AND-topics; they are redundant
	    topics = topics.slice();
	    while (topics.length > 0 && topics[topics.length - 1] == null) {
	        topics.pop();
	    }
	    return topics.map((topic) => {
	        if (Array.isArray(topic)) {
	            // Only track unique OR-topics
	            const unique = {};
	            topic.forEach((topic) => {
	                unique[checkTopic(topic)] = true;
	            });
	            // The order of OR-topics does not matter
	            const sorted = Object.keys(unique);
	            sorted.sort();
	            return sorted.join("|");
	        }
	        else {
	            return checkTopic(topic);
	        }
	    }).join("&");
	}
	function deserializeTopics(data) {
	    if (data === "") {
	        return [];
	    }
	    return data.split(/&/g).map((topic) => {
	        if (topic === "") {
	            return [];
	        }
	        const comps = topic.split("|").map((topic) => {
	            return ((topic === "null") ? null : topic);
	        });
	        return ((comps.length === 1) ? comps[0] : comps);
	    });
	}
	function getEventTag(eventName) {
	    if (typeof (eventName) === "string") {
	        eventName = eventName.toLowerCase();
	        if (hexDataLength(eventName) === 32) {
	            return "tx:" + eventName;
	        }
	        if (eventName.indexOf(":") === -1) {
	            return eventName;
	        }
	    }
	    else if (Array.isArray(eventName)) {
	        return "filter:*:" + serializeTopics(eventName);
	    }
	    else if (ForkEvent.isForkEvent(eventName)) {
	        logger$3.warn("not implemented");
	        throw new Error("not implemented");
	    }
	    else if (eventName && typeof (eventName) === "object") {
	        return "filter:" + (eventName.address || "*") + ":" + serializeTopics(eventName.topics || []);
	    }
	    throw new Error("invalid event - " + eventName);
	}
	//////////////////////////////
	// Helper Object
	function getTime() {
	    return (new Date()).getTime();
	}
	function stall(duration) {
	    return new Promise((resolve) => {
	        setTimeout(resolve, duration);
	    });
	}
	//////////////////////////////
	// Provider Object
	/**
	 *  EventType
	 *   - "block"
	 *   - "poll"
	 *   - "didPoll"
	 *   - "pending"
	 *   - "error"
	 *   - "network"
	 *   - filter
	 *   - topics array
	 *   - transaction hash
	 */
	const PollableEvents = ["block", "network", "pending", "poll"];
	class Event {
	    constructor(tag, listener, once) {
	        defineReadOnly(this, "tag", tag);
	        defineReadOnly(this, "listener", listener);
	        defineReadOnly(this, "once", once);
	        this._lastBlockNumber = -2;
	        this._inflight = false;
	    }
	    get event() {
	        switch (this.type) {
	            case "tx":
	                return this.hash;
	            case "filter":
	                return this.filter;
	        }
	        return this.tag;
	    }
	    get type() {
	        return this.tag.split(":")[0];
	    }
	    get hash() {
	        const comps = this.tag.split(":");
	        if (comps[0] !== "tx") {
	            return null;
	        }
	        return comps[1];
	    }
	    get filter() {
	        const comps = this.tag.split(":");
	        if (comps[0] !== "filter") {
	            return null;
	        }
	        const address = comps[1];
	        const topics = deserializeTopics(comps[2]);
	        const filter = {};
	        if (topics.length > 0) {
	            filter.topics = topics;
	        }
	        if (address && address !== "*") {
	            filter.address = address;
	        }
	        return filter;
	    }
	    pollable() {
	        return (this.tag.indexOf(":") >= 0 || PollableEvents.indexOf(this.tag) >= 0);
	    }
	}
	// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
	const coinInfos = {
	    "0": { symbol: "btc", p2pkh: 0x00, p2sh: 0x05, prefix: "bc" },
	    "2": { symbol: "ltc", p2pkh: 0x30, p2sh: 0x32, prefix: "ltc" },
	    "3": { symbol: "doge", p2pkh: 0x1e, p2sh: 0x16 },
	    "60": { symbol: "eth", ilk: "eth" },
	    "61": { symbol: "etc", ilk: "eth" },
	    "700": { symbol: "xdai", ilk: "eth" },
	};
	function bytes32ify(value) {
	    return hexZeroPad(BigNumber.from(value).toHexString(), 32);
	}
	// Compute the Base58Check encoded data (checksum is first 4 bytes of sha256d)
	function base58Encode(data) {
	    return Base58.encode(concat([data, hexDataSlice(sha256(sha256(data)), 0, 4)]));
	}
	const matcherIpfs = new RegExp("^(ipfs):/\/(.*)$", "i");
	const matchers = [
	    new RegExp("^(https):/\/(.*)$", "i"),
	    new RegExp("^(data):(.*)$", "i"),
	    matcherIpfs,
	    new RegExp("^eip155:[0-9]+/(erc[0-9]+):(.*)$", "i"),
	];
	function _parseString(result, start) {
	    try {
	        return toUtf8String(_parseBytes(result, start));
	    }
	    catch (error) { }
	    return null;
	}
	function _parseBytes(result, start) {
	    if (result === "0x") {
	        return null;
	    }
	    const offset = BigNumber.from(hexDataSlice(result, start, start + 32)).toNumber();
	    const length = BigNumber.from(hexDataSlice(result, offset, offset + 32)).toNumber();
	    return hexDataSlice(result, offset + 32, offset + 32 + length);
	}
	// Trim off the ipfs:// prefix and return the default gateway URL
	function getIpfsLink(link) {
	    if (link.match(/^ipfs:\/\/ipfs\//i)) {
	        link = link.substring(12);
	    }
	    else if (link.match(/^ipfs:\/\//i)) {
	        link = link.substring(7);
	    }
	    else {
	        logger$3.throwArgumentError("unsupported IPFS format", "link", link);
	    }
	    return `https:/\/gateway.ipfs.io/ipfs/${link}`;
	}
	function numPad(value) {
	    const result = arrayify(value);
	    if (result.length > 32) {
	        throw new Error("internal; should not happen");
	    }
	    const padded = new Uint8Array(32);
	    padded.set(result, 32 - result.length);
	    return padded;
	}
	function bytesPad(value) {
	    if ((value.length % 32) === 0) {
	        return value;
	    }
	    const result = new Uint8Array(Math.ceil(value.length / 32) * 32);
	    result.set(value);
	    return result;
	}
	// ABI Encodes a series of (bytes, bytes, ...)
	function encodeBytes(datas) {
	    const result = [];
	    let byteCount = 0;
	    // Add place-holders for pointers as we add items
	    for (let i = 0; i < datas.length; i++) {
	        result.push(null);
	        byteCount += 32;
	    }
	    for (let i = 0; i < datas.length; i++) {
	        const data = arrayify(datas[i]);
	        // Update the bytes offset
	        result[i] = numPad(byteCount);
	        // The length and padded value of data
	        result.push(numPad(data.length));
	        result.push(bytesPad(data));
	        byteCount += 32 + Math.ceil(data.length / 32) * 32;
	    }
	    return hexConcat(result);
	}
	class Resolver {
	    // The resolvedAddress is only for creating a ReverseLookup resolver
	    constructor(provider, address, name, resolvedAddress) {
	        defineReadOnly(this, "provider", provider);
	        defineReadOnly(this, "name", name);
	        defineReadOnly(this, "address", provider.formatter.address(address));
	        defineReadOnly(this, "_resolvedAddress", resolvedAddress);
	    }
	    supportsWildcard() {
	        if (!this._supportsEip2544) {
	            // supportsInterface(bytes4 = selector("resolve(bytes,bytes)"))
	            this._supportsEip2544 = this.provider.call({
	                to: this.address,
	                data: "0x01ffc9a79061b92300000000000000000000000000000000000000000000000000000000"
	            }).then((result) => {
	                return BigNumber.from(result).eq(1);
	            }).catch((error) => {
	                if (error.code === Logger.errors.CALL_EXCEPTION) {
	                    return false;
	                }
	                // Rethrow the error: link is down, etc. Let future attempts retry.
	                this._supportsEip2544 = null;
	                throw error;
	            });
	        }
	        return this._supportsEip2544;
	    }
	    _fetch(selector, parameters) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            // e.g. keccak256("addr(bytes32,uint256)")
	            const tx = {
	                to: this.address,
	                ccipReadEnabled: true,
	                data: hexConcat([selector, namehash(this.name), (parameters || "0x")])
	            };
	            // Wildcard support; use EIP-2544 to resolve the request
	            let parseBytes = false;
	            if (yield this.supportsWildcard()) {
	                parseBytes = true;
	                // selector("resolve(bytes,bytes)")
	                tx.data = hexConcat(["0x9061b923", encodeBytes([dnsEncode(this.name), tx.data])]);
	            }
	            try {
	                let result = yield this.provider.call(tx);
	                if ((arrayify(result).length % 32) === 4) {
	                    logger$3.throwError("resolver threw error", Logger.errors.CALL_EXCEPTION, {
	                        transaction: tx, data: result
	                    });
	                }
	                if (parseBytes) {
	                    result = _parseBytes(result, 0);
	                }
	                return result;
	            }
	            catch (error) {
	                if (error.code === Logger.errors.CALL_EXCEPTION) {
	                    return null;
	                }
	                throw error;
	            }
	        });
	    }
	    _fetchBytes(selector, parameters) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const result = yield this._fetch(selector, parameters);
	            if (result != null) {
	                return _parseBytes(result, 0);
	            }
	            return null;
	        });
	    }
	    _getAddress(coinType, hexBytes) {
	        const coinInfo = coinInfos[String(coinType)];
	        if (coinInfo == null) {
	            logger$3.throwError(`unsupported coin type: ${coinType}`, Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: `getAddress(${coinType})`
	            });
	        }
	        if (coinInfo.ilk === "eth") {
	            return this.provider.formatter.address(hexBytes);
	        }
	        const bytes = arrayify(hexBytes);
	        // P2PKH: OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
	        if (coinInfo.p2pkh != null) {
	            const p2pkh = hexBytes.match(/^0x76a9([0-9a-f][0-9a-f])([0-9a-f]*)88ac$/);
	            if (p2pkh) {
	                const length = parseInt(p2pkh[1], 16);
	                if (p2pkh[2].length === length * 2 && length >= 1 && length <= 75) {
	                    return base58Encode(concat([[coinInfo.p2pkh], ("0x" + p2pkh[2])]));
	                }
	            }
	        }
	        // P2SH: OP_HASH160 <scriptHash> OP_EQUAL
	        if (coinInfo.p2sh != null) {
	            const p2sh = hexBytes.match(/^0xa9([0-9a-f][0-9a-f])([0-9a-f]*)87$/);
	            if (p2sh) {
	                const length = parseInt(p2sh[1], 16);
	                if (p2sh[2].length === length * 2 && length >= 1 && length <= 75) {
	                    return base58Encode(concat([[coinInfo.p2sh], ("0x" + p2sh[2])]));
	                }
	            }
	        }
	        // Bech32
	        if (coinInfo.prefix != null) {
	            const length = bytes[1];
	            // https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#witness-program
	            let version = bytes[0];
	            if (version === 0x00) {
	                if (length !== 20 && length !== 32) {
	                    version = -1;
	                }
	            }
	            else {
	                version = -1;
	            }
	            if (version >= 0 && bytes.length === 2 + length && length >= 1 && length <= 75) {
	                const words = bech32.toWords(bytes.slice(2));
	                words.unshift(version);
	                return bech32.encode(coinInfo.prefix, words);
	            }
	        }
	        return null;
	    }
	    getAddress(coinType) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            if (coinType == null) {
	                coinType = 60;
	            }
	            // If Ethereum, use the standard `addr(bytes32)`
	            if (coinType === 60) {
	                try {
	                    // keccak256("addr(bytes32)")
	                    const result = yield this._fetch("0x3b3b57de");
	                    // No address
	                    if (result === "0x" || result === HashZero) {
	                        return null;
	                    }
	                    return this.provider.formatter.callAddress(result);
	                }
	                catch (error) {
	                    if (error.code === Logger.errors.CALL_EXCEPTION) {
	                        return null;
	                    }
	                    throw error;
	                }
	            }
	            // keccak256("addr(bytes32,uint256")
	            const hexBytes = yield this._fetchBytes("0xf1cb7e06", bytes32ify(coinType));
	            // No address
	            if (hexBytes == null || hexBytes === "0x") {
	                return null;
	            }
	            // Compute the address
	            const address = this._getAddress(coinType, hexBytes);
	            if (address == null) {
	                logger$3.throwError(`invalid or unsupported coin data`, Logger.errors.UNSUPPORTED_OPERATION, {
	                    operation: `getAddress(${coinType})`,
	                    coinType: coinType,
	                    data: hexBytes
	                });
	            }
	            return address;
	        });
	    }
	    getAvatar() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const linkage = [{ type: "name", content: this.name }];
	            try {
	                // test data for ricmoo.eth
	                //const avatar = "eip155:1/erc721:0x265385c7f4132228A0d54EB1A9e7460b91c0cC68/29233";
	                const avatar = yield this.getText("avatar");
	                if (avatar == null) {
	                    return null;
	                }
	                for (let i = 0; i < matchers.length; i++) {
	                    const match = avatar.match(matchers[i]);
	                    if (match == null) {
	                        continue;
	                    }
	                    const scheme = match[1].toLowerCase();
	                    switch (scheme) {
	                        case "https":
	                            linkage.push({ type: "url", content: avatar });
	                            return { linkage, url: avatar };
	                        case "data":
	                            linkage.push({ type: "data", content: avatar });
	                            return { linkage, url: avatar };
	                        case "ipfs":
	                            linkage.push({ type: "ipfs", content: avatar });
	                            return { linkage, url: getIpfsLink(avatar) };
	                        case "erc721":
	                        case "erc1155": {
	                            // Depending on the ERC type, use tokenURI(uint256) or url(uint256)
	                            const selector = (scheme === "erc721") ? "0xc87b56dd" : "0x0e89341c";
	                            linkage.push({ type: scheme, content: avatar });
	                            // The owner of this name
	                            const owner = (this._resolvedAddress || (yield this.getAddress()));
	                            const comps = (match[2] || "").split("/");
	                            if (comps.length !== 2) {
	                                return null;
	                            }
	                            const addr = yield this.provider.formatter.address(comps[0]);
	                            const tokenId = hexZeroPad(BigNumber.from(comps[1]).toHexString(), 32);
	                            // Check that this account owns the token
	                            if (scheme === "erc721") {
	                                // ownerOf(uint256 tokenId)
	                                const tokenOwner = this.provider.formatter.callAddress(yield this.provider.call({
	                                    to: addr, data: hexConcat(["0x6352211e", tokenId])
	                                }));
	                                if (owner !== tokenOwner) {
	                                    return null;
	                                }
	                                linkage.push({ type: "owner", content: tokenOwner });
	                            }
	                            else if (scheme === "erc1155") {
	                                // balanceOf(address owner, uint256 tokenId)
	                                const balance = BigNumber.from(yield this.provider.call({
	                                    to: addr, data: hexConcat(["0x00fdd58e", hexZeroPad(owner, 32), tokenId])
	                                }));
	                                if (balance.isZero()) {
	                                    return null;
	                                }
	                                linkage.push({ type: "balance", content: balance.toString() });
	                            }
	                            // Call the token contract for the metadata URL
	                            const tx = {
	                                to: this.provider.formatter.address(comps[0]),
	                                data: hexConcat([selector, tokenId])
	                            };
	                            let metadataUrl = _parseString(yield this.provider.call(tx), 0);
	                            if (metadataUrl == null) {
	                                return null;
	                            }
	                            linkage.push({ type: "metadata-url-base", content: metadataUrl });
	                            // ERC-1155 allows a generic {id} in the URL
	                            if (scheme === "erc1155") {
	                                metadataUrl = metadataUrl.replace("{id}", tokenId.substring(2));
	                                linkage.push({ type: "metadata-url-expanded", content: metadataUrl });
	                            }
	                            // Transform IPFS metadata links
	                            if (metadataUrl.match(/^ipfs:/i)) {
	                                metadataUrl = getIpfsLink(metadataUrl);
	                            }
	                            linkage.push({ type: "metadata-url", content: metadataUrl });
	                            // Get the token metadata
	                            const metadata = yield fetchJson(metadataUrl);
	                            if (!metadata) {
	                                return null;
	                            }
	                            linkage.push({ type: "metadata", content: JSON.stringify(metadata) });
	                            // Pull the image URL out
	                            let imageUrl = metadata.image;
	                            if (typeof (imageUrl) !== "string") {
	                                return null;
	                            }
	                            if (imageUrl.match(/^(https:\/\/|data:)/i)) {
	                                // Allow
	                            }
	                            else {
	                                // Transform IPFS link to gateway
	                                const ipfs = imageUrl.match(matcherIpfs);
	                                if (ipfs == null) {
	                                    return null;
	                                }
	                                linkage.push({ type: "url-ipfs", content: imageUrl });
	                                imageUrl = getIpfsLink(imageUrl);
	                            }
	                            linkage.push({ type: "url", content: imageUrl });
	                            return { linkage, url: imageUrl };
	                        }
	                    }
	                }
	            }
	            catch (error) { }
	            return null;
	        });
	    }
	    getContentHash() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            // keccak256("contenthash()")
	            const hexBytes = yield this._fetchBytes("0xbc1c58d1");
	            // No contenthash
	            if (hexBytes == null || hexBytes === "0x") {
	                return null;
	            }
	            // IPFS (CID: 1, Type: DAG-PB)
	            const ipfs = hexBytes.match(/^0xe3010170(([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f]*))$/);
	            if (ipfs) {
	                const length = parseInt(ipfs[3], 16);
	                if (ipfs[4].length === length * 2) {
	                    return "ipfs:/\/" + Base58.encode("0x" + ipfs[1]);
	                }
	            }
	            // IPNS (CID: 1, Type: libp2p-key)
	            const ipns = hexBytes.match(/^0xe5010172(([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f]*))$/);
	            if (ipns) {
	                const length = parseInt(ipns[3], 16);
	                if (ipns[4].length === length * 2) {
	                    return "ipns:/\/" + Base58.encode("0x" + ipns[1]);
	                }
	            }
	            // Swarm (CID: 1, Type: swarm-manifest; hash/length hard-coded to keccak256/32)
	            const swarm = hexBytes.match(/^0xe40101fa011b20([0-9a-f]*)$/);
	            if (swarm) {
	                if (swarm[1].length === (32 * 2)) {
	                    return "bzz:/\/" + swarm[1];
	                }
	            }
	            const skynet = hexBytes.match(/^0x90b2c605([0-9a-f]*)$/);
	            if (skynet) {
	                if (skynet[1].length === (34 * 2)) {
	                    // URL Safe base64; https://datatracker.ietf.org/doc/html/rfc4648#section-5
	                    const urlSafe = { "=": "", "+": "-", "/": "_" };
	                    const hash = encode$1("0x" + skynet[1]).replace(/[=+\/]/g, (a) => (urlSafe[a]));
	                    return "sia:/\/" + hash;
	                }
	            }
	            return logger$3.throwError(`invalid or unsupported content hash data`, Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "getContentHash()",
	                data: hexBytes
	            });
	        });
	    }
	    getText(key) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            // The key encoded as parameter to fetchBytes
	            let keyBytes = toUtf8Bytes(key);
	            // The nodehash consumes the first slot, so the string pointer targets
	            // offset 64, with the length at offset 64 and data starting at offset 96
	            keyBytes = concat([bytes32ify(64), bytes32ify(keyBytes.length), keyBytes]);
	            // Pad to word-size (32 bytes)
	            if ((keyBytes.length % 32) !== 0) {
	                keyBytes = concat([keyBytes, hexZeroPad("0x", 32 - (key.length % 32))]);
	            }
	            const hexBytes = yield this._fetchBytes("0x59d1d43c", hexlify(keyBytes));
	            if (hexBytes == null || hexBytes === "0x") {
	                return null;
	            }
	            return toUtf8String(hexBytes);
	        });
	    }
	}
	let defaultFormatter = null;
	let nextPollId = 1;
	class BaseProvider extends Provider {
	    /**
	     *  ready
	     *
	     *  A Promise<Network> that resolves only once the provider is ready.
	     *
	     *  Sub-classes that call the super with a network without a chainId
	     *  MUST set this. Standard named networks have a known chainId.
	     *
	     */
	    constructor(network) {
	        super();
	        // Events being listened to
	        this._events = [];
	        this._emitted = { block: -2 };
	        this.disableCcipRead = false;
	        this.formatter = new.target.getFormatter();
	        // If network is any, this Provider allows the underlying
	        // network to change dynamically, and we auto-detect the
	        // current network
	        defineReadOnly(this, "anyNetwork", (network === "any"));
	        if (this.anyNetwork) {
	            network = this.detectNetwork();
	        }
	        if (network instanceof Promise) {
	            this._networkPromise = network;
	            // Squash any "unhandled promise" errors; that do not need to be handled
	            network.catch((error) => { });
	            // Trigger initial network setting (async)
	            this._ready().catch((error) => { });
	        }
	        else {
	            const knownNetwork = getStatic(new.target, "getNetwork")(network);
	            if (knownNetwork) {
	                defineReadOnly(this, "_network", knownNetwork);
	                this.emit("network", knownNetwork, null);
	            }
	            else {
	                logger$3.throwArgumentError("invalid network", "network", network);
	            }
	        }
	        this._maxInternalBlockNumber = -1024;
	        this._lastBlockNumber = -2;
	        this._maxFilterBlockRange = 10;
	        this._pollingInterval = 4000;
	        this._fastQueryDate = 0;
	    }
	    _ready() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            if (this._network == null) {
	                let network = null;
	                if (this._networkPromise) {
	                    try {
	                        network = yield this._networkPromise;
	                    }
	                    catch (error) { }
	                }
	                // Try the Provider's network detection (this MUST throw if it cannot)
	                if (network == null) {
	                    network = yield this.detectNetwork();
	                }
	                // This should never happen; every Provider sub-class should have
	                // suggested a network by here (or have thrown).
	                if (!network) {
	                    logger$3.throwError("no network detected", Logger.errors.UNKNOWN_ERROR, {});
	                }
	                // Possible this call stacked so do not call defineReadOnly again
	                if (this._network == null) {
	                    if (this.anyNetwork) {
	                        this._network = network;
	                    }
	                    else {
	                        defineReadOnly(this, "_network", network);
	                    }
	                    this.emit("network", network, null);
	                }
	            }
	            return this._network;
	        });
	    }
	    // This will always return the most recently established network.
	    // For "any", this can change (a "network" event is emitted before
	    // any change is reflected); otherwise this cannot change
	    get ready() {
	        return poll(() => {
	            return this._ready().then((network) => {
	                return network;
	            }, (error) => {
	                // If the network isn't running yet, we will wait
	                if (error.code === Logger.errors.NETWORK_ERROR && error.event === "noNetwork") {
	                    return undefined;
	                }
	                throw error;
	            });
	        });
	    }
	    // @TODO: Remove this and just create a singleton formatter
	    static getFormatter() {
	        if (defaultFormatter == null) {
	            defaultFormatter = new Formatter();
	        }
	        return defaultFormatter;
	    }
	    // @TODO: Remove this and just use getNetwork
	    static getNetwork(network) {
	        return getNetwork((network == null) ? "homestead" : network);
	    }
	    ccipReadFetch(tx, calldata, urls) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            if (this.disableCcipRead || urls.length === 0) {
	                return null;
	            }
	            const sender = tx.to.toLowerCase();
	            const data = calldata.toLowerCase();
	            const errorMessages = [];
	            for (let i = 0; i < urls.length; i++) {
	                const url = urls[i];
	                // URL expansion
	                const href = url.replace("{sender}", sender).replace("{data}", data);
	                // If no {data} is present, use POST; otherwise GET
	                const json = (url.indexOf("{data}") >= 0) ? null : JSON.stringify({ data, sender });
	                const result = yield fetchJson({ url: href, errorPassThrough: true }, json, (value, response) => {
	                    value.status = response.statusCode;
	                    return value;
	                });
	                if (result.data) {
	                    return result.data;
	                }
	                const errorMessage = (result.message || "unknown error");
	                // 4xx indicates the result is not present; stop
	                if (result.status >= 400 && result.status < 500) {
	                    return logger$3.throwError(`response not found during CCIP fetch: ${errorMessage}`, Logger.errors.SERVER_ERROR, { url, errorMessage });
	                }
	                // 5xx indicates server issue; try the next url
	                errorMessages.push(errorMessage);
	            }
	            return logger$3.throwError(`error encountered during CCIP fetch: ${errorMessages.map((m) => JSON.stringify(m)).join(", ")}`, Logger.errors.SERVER_ERROR, {
	                urls, errorMessages
	            });
	        });
	    }
	    // Fetches the blockNumber, but will reuse any result that is less
	    // than maxAge old or has been requested since the last request
	    _getInternalBlockNumber(maxAge) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this._ready();
	            // Allowing stale data up to maxAge old
	            if (maxAge > 0) {
	                // While there are pending internal block requests...
	                while (this._internalBlockNumber) {
	                    // ..."remember" which fetch we started with
	                    const internalBlockNumber = this._internalBlockNumber;
	                    try {
	                        // Check the result is not too stale
	                        const result = yield internalBlockNumber;
	                        if ((getTime() - result.respTime) <= maxAge) {
	                            return result.blockNumber;
	                        }
	                        // Too old; fetch a new value
	                        break;
	                    }
	                    catch (error) {
	                        // The fetch rejected; if we are the first to get the
	                        // rejection, drop through so we replace it with a new
	                        // fetch; all others blocked will then get that fetch
	                        // which won't match the one they "remembered" and loop
	                        if (this._internalBlockNumber === internalBlockNumber) {
	                            break;
	                        }
	                    }
	                }
	            }
	            const reqTime = getTime();
	            const checkInternalBlockNumber = resolveProperties({
	                blockNumber: this.perform("getBlockNumber", {}),
	                networkError: this.getNetwork().then((network) => (null), (error) => (error))
	            }).then(({ blockNumber, networkError }) => {
	                if (networkError) {
	                    // Unremember this bad internal block number
	                    if (this._internalBlockNumber === checkInternalBlockNumber) {
	                        this._internalBlockNumber = null;
	                    }
	                    throw networkError;
	                }
	                const respTime = getTime();
	                blockNumber = BigNumber.from(blockNumber).toNumber();
	                if (blockNumber < this._maxInternalBlockNumber) {
	                    blockNumber = this._maxInternalBlockNumber;
	                }
	                this._maxInternalBlockNumber = blockNumber;
	                this._setFastBlockNumber(blockNumber); // @TODO: Still need this?
	                return { blockNumber, reqTime, respTime };
	            });
	            this._internalBlockNumber = checkInternalBlockNumber;
	            // Swallow unhandled exceptions; if needed they are handled else where
	            checkInternalBlockNumber.catch((error) => {
	                // Don't null the dead (rejected) fetch, if it has already been updated
	                if (this._internalBlockNumber === checkInternalBlockNumber) {
	                    this._internalBlockNumber = null;
	                }
	            });
	            return (yield checkInternalBlockNumber).blockNumber;
	        });
	    }
	    poll() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const pollId = nextPollId++;
	            // Track all running promises, so we can trigger a post-poll once they are complete
	            const runners = [];
	            let blockNumber = null;
	            try {
	                blockNumber = yield this._getInternalBlockNumber(100 + this.pollingInterval / 2);
	            }
	            catch (error) {
	                this.emit("error", error);
	                return;
	            }
	            this._setFastBlockNumber(blockNumber);
	            // Emit a poll event after we have the latest (fast) block number
	            this.emit("poll", pollId, blockNumber);
	            // If the block has not changed, meh.
	            if (blockNumber === this._lastBlockNumber) {
	                this.emit("didPoll", pollId);
	                return;
	            }
	            // First polling cycle, trigger a "block" events
	            if (this._emitted.block === -2) {
	                this._emitted.block = blockNumber - 1;
	            }
	            if (Math.abs((this._emitted.block) - blockNumber) > 1000) {
	                logger$3.warn(`network block skew detected; skipping block events (emitted=${this._emitted.block} blockNumber${blockNumber})`);
	                this.emit("error", logger$3.makeError("network block skew detected", Logger.errors.NETWORK_ERROR, {
	                    blockNumber: blockNumber,
	                    event: "blockSkew",
	                    previousBlockNumber: this._emitted.block
	                }));
	                this.emit("block", blockNumber);
	            }
	            else {
	                // Notify all listener for each block that has passed
	                for (let i = this._emitted.block + 1; i <= blockNumber; i++) {
	                    this.emit("block", i);
	                }
	            }
	            // The emitted block was updated, check for obsolete events
	            if (this._emitted.block !== blockNumber) {
	                this._emitted.block = blockNumber;
	                Object.keys(this._emitted).forEach((key) => {
	                    // The block event does not expire
	                    if (key === "block") {
	                        return;
	                    }
	                    // The block we were at when we emitted this event
	                    const eventBlockNumber = this._emitted[key];
	                    // We cannot garbage collect pending transactions or blocks here
	                    // They should be garbage collected by the Provider when setting
	                    // "pending" events
	                    if (eventBlockNumber === "pending") {
	                        return;
	                    }
	                    // Evict any transaction hashes or block hashes over 12 blocks
	                    // old, since they should not return null anyways
	                    if (blockNumber - eventBlockNumber > 12) {
	                        delete this._emitted[key];
	                    }
	                });
	            }
	            // First polling cycle
	            if (this._lastBlockNumber === -2) {
	                this._lastBlockNumber = blockNumber - 1;
	            }
	            // Find all transaction hashes we are waiting on
	            this._events.forEach((event) => {
	                switch (event.type) {
	                    case "tx": {
	                        const hash = event.hash;
	                        let runner = this.getTransactionReceipt(hash).then((receipt) => {
	                            if (!receipt || receipt.blockNumber == null) {
	                                return null;
	                            }
	                            this._emitted["t:" + hash] = receipt.blockNumber;
	                            this.emit(hash, receipt);
	                            return null;
	                        }).catch((error) => { this.emit("error", error); });
	                        runners.push(runner);
	                        break;
	                    }
	                    case "filter": {
	                        // We only allow a single getLogs to be in-flight at a time
	                        if (!event._inflight) {
	                            event._inflight = true;
	                            // This is the first filter for this event, so we want to
	                            // restrict events to events that happened no earlier than now
	                            if (event._lastBlockNumber === -2) {
	                                event._lastBlockNumber = blockNumber - 1;
	                            }
	                            // Filter from the last *known* event; due to load-balancing
	                            // and some nodes returning updated block numbers before
	                            // indexing events, a logs result with 0 entries cannot be
	                            // trusted and we must retry a range which includes it again
	                            const filter = event.filter;
	                            filter.fromBlock = event._lastBlockNumber + 1;
	                            filter.toBlock = blockNumber;
	                            // Prevent fitler ranges from growing too wild, since it is quite
	                            // likely there just haven't been any events to move the lastBlockNumber.
	                            const minFromBlock = filter.toBlock - this._maxFilterBlockRange;
	                            if (minFromBlock > filter.fromBlock) {
	                                filter.fromBlock = minFromBlock;
	                            }
	                            if (filter.fromBlock < 0) {
	                                filter.fromBlock = 0;
	                            }
	                            const runner = this.getLogs(filter).then((logs) => {
	                                // Allow the next getLogs
	                                event._inflight = false;
	                                if (logs.length === 0) {
	                                    return;
	                                }
	                                logs.forEach((log) => {
	                                    // Only when we get an event for a given block number
	                                    // can we trust the events are indexed
	                                    if (log.blockNumber > event._lastBlockNumber) {
	                                        event._lastBlockNumber = log.blockNumber;
	                                    }
	                                    // Make sure we stall requests to fetch blocks and txs
	                                    this._emitted["b:" + log.blockHash] = log.blockNumber;
	                                    this._emitted["t:" + log.transactionHash] = log.blockNumber;
	                                    this.emit(filter, log);
	                                });
	                            }).catch((error) => {
	                                this.emit("error", error);
	                                // Allow another getLogs (the range was not updated)
	                                event._inflight = false;
	                            });
	                            runners.push(runner);
	                        }
	                        break;
	                    }
	                }
	            });
	            this._lastBlockNumber = blockNumber;
	            // Once all events for this loop have been processed, emit "didPoll"
	            Promise.all(runners).then(() => {
	                this.emit("didPoll", pollId);
	            }).catch((error) => { this.emit("error", error); });
	            return;
	        });
	    }
	    // Deprecated; do not use this
	    resetEventsBlock(blockNumber) {
	        this._lastBlockNumber = blockNumber - 1;
	        if (this.polling) {
	            this.poll();
	        }
	    }
	    get network() {
	        return this._network;
	    }
	    // This method should query the network if the underlying network
	    // can change, such as when connected to a JSON-RPC backend
	    detectNetwork() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            return logger$3.throwError("provider does not support network detection", Logger.errors.UNSUPPORTED_OPERATION, {
	                operation: "provider.detectNetwork"
	            });
	        });
	    }
	    getNetwork() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const network = yield this._ready();
	            // Make sure we are still connected to the same network; this is
	            // only an external call for backends which can have the underlying
	            // network change spontaneously
	            const currentNetwork = yield this.detectNetwork();
	            if (network.chainId !== currentNetwork.chainId) {
	                // We are allowing network changes, things can get complex fast;
	                // make sure you know what you are doing if you use "any"
	                if (this.anyNetwork) {
	                    this._network = currentNetwork;
	                    // Reset all internal block number guards and caches
	                    this._lastBlockNumber = -2;
	                    this._fastBlockNumber = null;
	                    this._fastBlockNumberPromise = null;
	                    this._fastQueryDate = 0;
	                    this._emitted.block = -2;
	                    this._maxInternalBlockNumber = -1024;
	                    this._internalBlockNumber = null;
	                    // The "network" event MUST happen before this method resolves
	                    // so any events have a chance to unregister, so we stall an
	                    // additional event loop before returning from /this/ call
	                    this.emit("network", currentNetwork, network);
	                    yield stall(0);
	                    return this._network;
	                }
	                const error = logger$3.makeError("underlying network changed", Logger.errors.NETWORK_ERROR, {
	                    event: "changed",
	                    network: network,
	                    detectedNetwork: currentNetwork
	                });
	                this.emit("error", error);
	                throw error;
	            }
	            return network;
	        });
	    }
	    get blockNumber() {
	        this._getInternalBlockNumber(100 + this.pollingInterval / 2).then((blockNumber) => {
	            this._setFastBlockNumber(blockNumber);
	        }, (error) => { });
	        return (this._fastBlockNumber != null) ? this._fastBlockNumber : -1;
	    }
	    get polling() {
	        return (this._poller != null);
	    }
	    set polling(value) {
	        if (value && !this._poller) {
	            this._poller = setInterval(() => { this.poll(); }, this.pollingInterval);
	            if (!this._bootstrapPoll) {
	                this._bootstrapPoll = setTimeout(() => {
	                    this.poll();
	                    // We block additional polls until the polling interval
	                    // is done, to prevent overwhelming the poll function
	                    this._bootstrapPoll = setTimeout(() => {
	                        // If polling was disabled, something may require a poke
	                        // since starting the bootstrap poll and it was disabled
	                        if (!this._poller) {
	                            this.poll();
	                        }
	                        // Clear out the bootstrap so we can do another
	                        this._bootstrapPoll = null;
	                    }, this.pollingInterval);
	                }, 0);
	            }
	        }
	        else if (!value && this._poller) {
	            clearInterval(this._poller);
	            this._poller = null;
	        }
	    }
	    get pollingInterval() {
	        return this._pollingInterval;
	    }
	    set pollingInterval(value) {
	        if (typeof (value) !== "number" || value <= 0 || parseInt(String(value)) != value) {
	            throw new Error("invalid polling interval");
	        }
	        this._pollingInterval = value;
	        if (this._poller) {
	            clearInterval(this._poller);
	            this._poller = setInterval(() => { this.poll(); }, this._pollingInterval);
	        }
	    }
	    _getFastBlockNumber() {
	        const now = getTime();
	        // Stale block number, request a newer value
	        if ((now - this._fastQueryDate) > 2 * this._pollingInterval) {
	            this._fastQueryDate = now;
	            this._fastBlockNumberPromise = this.getBlockNumber().then((blockNumber) => {
	                if (this._fastBlockNumber == null || blockNumber > this._fastBlockNumber) {
	                    this._fastBlockNumber = blockNumber;
	                }
	                return this._fastBlockNumber;
	            });
	        }
	        return this._fastBlockNumberPromise;
	    }
	    _setFastBlockNumber(blockNumber) {
	        // Older block, maybe a stale request
	        if (this._fastBlockNumber != null && blockNumber < this._fastBlockNumber) {
	            return;
	        }
	        // Update the time we updated the blocknumber
	        this._fastQueryDate = getTime();
	        // Newer block number, use  it
	        if (this._fastBlockNumber == null || blockNumber > this._fastBlockNumber) {
	            this._fastBlockNumber = blockNumber;
	            this._fastBlockNumberPromise = Promise.resolve(blockNumber);
	        }
	    }
	    waitForTransaction(transactionHash, confirmations, timeout) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            return this._waitForTransaction(transactionHash, (confirmations == null) ? 1 : confirmations, timeout || 0, null);
	        });
	    }
	    _waitForTransaction(transactionHash, confirmations, timeout, replaceable) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const receipt = yield this.getTransactionReceipt(transactionHash);
	            // Receipt is already good
	            if ((receipt ? receipt.confirmations : 0) >= confirmations) {
	                return receipt;
	            }
	            // Poll until the receipt is good...
	            return new Promise((resolve, reject) => {
	                const cancelFuncs = [];
	                let done = false;
	                const alreadyDone = function () {
	                    if (done) {
	                        return true;
	                    }
	                    done = true;
	                    cancelFuncs.forEach((func) => { func(); });
	                    return false;
	                };
	                const minedHandler = (receipt) => {
	                    if (receipt.confirmations < confirmations) {
	                        return;
	                    }
	                    if (alreadyDone()) {
	                        return;
	                    }
	                    resolve(receipt);
	                };
	                this.on(transactionHash, minedHandler);
	                cancelFuncs.push(() => { this.removeListener(transactionHash, minedHandler); });
	                if (replaceable) {
	                    let lastBlockNumber = replaceable.startBlock;
	                    let scannedBlock = null;
	                    const replaceHandler = (blockNumber) => __awaiter$1(this, void 0, void 0, function* () {
	                        if (done) {
	                            return;
	                        }
	                        // Wait 1 second; this is only used in the case of a fault, so
	                        // we will trade off a little bit of latency for more consistent
	                        // results and fewer JSON-RPC calls
	                        yield stall(1000);
	                        this.getTransactionCount(replaceable.from).then((nonce) => __awaiter$1(this, void 0, void 0, function* () {
	                            if (done) {
	                                return;
	                            }
	                            if (nonce <= replaceable.nonce) {
	                                lastBlockNumber = blockNumber;
	                            }
	                            else {
	                                // First check if the transaction was mined
	                                {
	                                    const mined = yield this.getTransaction(transactionHash);
	                                    if (mined && mined.blockNumber != null) {
	                                        return;
	                                    }
	                                }
	                                // First time scanning. We start a little earlier for some
	                                // wiggle room here to handle the eventually consistent nature
	                                // of blockchain (e.g. the getTransactionCount was for a
	                                // different block)
	                                if (scannedBlock == null) {
	                                    scannedBlock = lastBlockNumber - 3;
	                                    if (scannedBlock < replaceable.startBlock) {
	                                        scannedBlock = replaceable.startBlock;
	                                    }
	                                }
	                                while (scannedBlock <= blockNumber) {
	                                    if (done) {
	                                        return;
	                                    }
	                                    const block = yield this.getBlockWithTransactions(scannedBlock);
	                                    for (let ti = 0; ti < block.transactions.length; ti++) {
	                                        const tx = block.transactions[ti];
	                                        // Successfully mined!
	                                        if (tx.hash === transactionHash) {
	                                            return;
	                                        }
	                                        // Matches our transaction from and nonce; its a replacement
	                                        if (tx.from === replaceable.from && tx.nonce === replaceable.nonce) {
	                                            if (done) {
	                                                return;
	                                            }
	                                            // Get the receipt of the replacement
	                                            const receipt = yield this.waitForTransaction(tx.hash, confirmations);
	                                            // Already resolved or rejected (prolly a timeout)
	                                            if (alreadyDone()) {
	                                                return;
	                                            }
	                                            // The reason we were replaced
	                                            let reason = "replaced";
	                                            if (tx.data === replaceable.data && tx.to === replaceable.to && tx.value.eq(replaceable.value)) {
	                                                reason = "repriced";
	                                            }
	                                            else if (tx.data === "0x" && tx.from === tx.to && tx.value.isZero()) {
	                                                reason = "cancelled";
	                                            }
	                                            // Explain why we were replaced
	                                            reject(logger$3.makeError("transaction was replaced", Logger.errors.TRANSACTION_REPLACED, {
	                                                cancelled: (reason === "replaced" || reason === "cancelled"),
	                                                reason,
	                                                replacement: this._wrapTransaction(tx),
	                                                hash: transactionHash,
	                                                receipt
	                                            }));
	                                            return;
	                                        }
	                                    }
	                                    scannedBlock++;
	                                }
	                            }
	                            if (done) {
	                                return;
	                            }
	                            this.once("block", replaceHandler);
	                        }), (error) => {
	                            if (done) {
	                                return;
	                            }
	                            this.once("block", replaceHandler);
	                        });
	                    });
	                    if (done) {
	                        return;
	                    }
	                    this.once("block", replaceHandler);
	                    cancelFuncs.push(() => {
	                        this.removeListener("block", replaceHandler);
	                    });
	                }
	                if (typeof (timeout) === "number" && timeout > 0) {
	                    const timer = setTimeout(() => {
	                        if (alreadyDone()) {
	                            return;
	                        }
	                        reject(logger$3.makeError("timeout exceeded", Logger.errors.TIMEOUT, { timeout: timeout }));
	                    }, timeout);
	                    if (timer.unref) {
	                        timer.unref();
	                    }
	                    cancelFuncs.push(() => { clearTimeout(timer); });
	                }
	            });
	        });
	    }
	    getBlockNumber() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            return this._getInternalBlockNumber(0);
	        });
	    }
	    getGasPrice() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const result = yield this.perform("getGasPrice", {});
	            try {
	                return BigNumber.from(result);
	            }
	            catch (error) {
	                return logger$3.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
	                    method: "getGasPrice",
	                    result, error
	                });
	            }
	        });
	    }
	    getBalance(addressOrName, blockTag) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const params = yield resolveProperties({
	                address: this._getAddress(addressOrName),
	                blockTag: this._getBlockTag(blockTag)
	            });
	            const result = yield this.perform("getBalance", params);
	            try {
	                return BigNumber.from(result);
	            }
	            catch (error) {
	                return logger$3.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
	                    method: "getBalance",
	                    params, result, error
	                });
	            }
	        });
	    }
	    getTransactionCount(addressOrName, blockTag) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const params = yield resolveProperties({
	                address: this._getAddress(addressOrName),
	                blockTag: this._getBlockTag(blockTag)
	            });
	            const result = yield this.perform("getTransactionCount", params);
	            try {
	                return BigNumber.from(result).toNumber();
	            }
	            catch (error) {
	                return logger$3.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
	                    method: "getTransactionCount",
	                    params, result, error
	                });
	            }
	        });
	    }
	    getCode(addressOrName, blockTag) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const params = yield resolveProperties({
	                address: this._getAddress(addressOrName),
	                blockTag: this._getBlockTag(blockTag)
	            });
	            const result = yield this.perform("getCode", params);
	            try {
	                return hexlify(result);
	            }
	            catch (error) {
	                return logger$3.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
	                    method: "getCode",
	                    params, result, error
	                });
	            }
	        });
	    }
	    getStorageAt(addressOrName, position, blockTag) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const params = yield resolveProperties({
	                address: this._getAddress(addressOrName),
	                blockTag: this._getBlockTag(blockTag),
	                position: Promise.resolve(position).then((p) => hexValue(p))
	            });
	            const result = yield this.perform("getStorageAt", params);
	            try {
	                return hexlify(result);
	            }
	            catch (error) {
	                return logger$3.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
	                    method: "getStorageAt",
	                    params, result, error
	                });
	            }
	        });
	    }
	    // This should be called by any subclass wrapping a TransactionResponse
	    _wrapTransaction(tx, hash, startBlock) {
	        if (hash != null && hexDataLength(hash) !== 32) {
	            throw new Error("invalid response - sendTransaction");
	        }
	        const result = tx;
	        // Check the hash we expect is the same as the hash the server reported
	        if (hash != null && tx.hash !== hash) {
	            logger$3.throwError("Transaction hash mismatch from Provider.sendTransaction.", Logger.errors.UNKNOWN_ERROR, { expectedHash: tx.hash, returnedHash: hash });
	        }
	        result.wait = (confirms, timeout) => __awaiter$1(this, void 0, void 0, function* () {
	            if (confirms == null) {
	                confirms = 1;
	            }
	            if (timeout == null) {
	                timeout = 0;
	            }
	            // Get the details to detect replacement
	            let replacement = undefined;
	            if (confirms !== 0 && startBlock != null) {
	                replacement = {
	                    data: tx.data,
	                    from: tx.from,
	                    nonce: tx.nonce,
	                    to: tx.to,
	                    value: tx.value,
	                    startBlock
	                };
	            }
	            const receipt = yield this._waitForTransaction(tx.hash, confirms, timeout, replacement);
	            if (receipt == null && confirms === 0) {
	                return null;
	            }
	            // No longer pending, allow the polling loop to garbage collect this
	            this._emitted["t:" + tx.hash] = receipt.blockNumber;
	            if (receipt.status === 0) {
	                logger$3.throwError("transaction failed", Logger.errors.CALL_EXCEPTION, {
	                    transactionHash: tx.hash,
	                    transaction: tx,
	                    receipt: receipt
	                });
	            }
	            return receipt;
	        });
	        return result;
	    }
	    sendTransaction(signedTransaction) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const hexTx = yield Promise.resolve(signedTransaction).then(t => hexlify(t));
	            const tx = this.formatter.transaction(signedTransaction);
	            if (tx.confirmations == null) {
	                tx.confirmations = 0;
	            }
	            const blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
	            try {
	                const hash = yield this.perform("sendTransaction", { signedTransaction: hexTx });
	                return this._wrapTransaction(tx, hash, blockNumber);
	            }
	            catch (error) {
	                error.transaction = tx;
	                error.transactionHash = tx.hash;
	                throw error;
	            }
	        });
	    }
	    _getTransactionRequest(transaction) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            const values = yield transaction;
	            const tx = {};
	            ["from", "to"].forEach((key) => {
	                if (values[key] == null) {
	                    return;
	                }
	                tx[key] = Promise.resolve(values[key]).then((v) => (v ? this._getAddress(v) : null));
	            });
	            ["gasLimit", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "value"].forEach((key) => {
	                if (values[key] == null) {
	                    return;
	                }
	                tx[key] = Promise.resolve(values[key]).then((v) => (v ? BigNumber.from(v) : null));
	            });
	            ["type"].forEach((key) => {
	                if (values[key] == null) {
	                    return;
	                }
	                tx[key] = Promise.resolve(values[key]).then((v) => ((v != null) ? v : null));
	            });
	            if (values.accessList) {
	                tx.accessList = this.formatter.accessList(values.accessList);
	            }
	            ["data"].forEach((key) => {
	                if (values[key] == null) {
	                    return;
	                }
	                tx[key] = Promise.resolve(values[key]).then((v) => (v ? hexlify(v) : null));
	            });
	            return this.formatter.transactionRequest(yield resolveProperties(tx));
	        });
	    }
	    _getFilter(filter) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            filter = yield filter;
	            const result = {};
	            if (filter.address != null) {
	                result.address = this._getAddress(filter.address);
	            }
	            ["blockHash", "topics"].forEach((key) => {
	                if (filter[key] == null) {
	                    return;
	                }
	                result[key] = filter[key];
	            });
	            ["fromBlock", "toBlock"].forEach((key) => {
	                if (filter[key] == null) {
	                    return;
	                }
	                result[key] = this._getBlockTag(filter[key]);
	            });
	            return this.formatter.filter(yield resolveProperties(result));
	        });
	    }
	    _call(transaction, blockTag, attempt) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            if (attempt >= MAX_CCIP_REDIRECTS) {
	                logger$3.throwError("CCIP read exceeded maximum redirections", Logger.errors.SERVER_ERROR, {
	                    redirects: attempt, transaction
	                });
	            }
	            const txSender = transaction.to;
	            const result = yield this.perform("call", { transaction, blockTag });
	            // CCIP Read request via OffchainLookup(address,string[],bytes,bytes4,bytes)
	            if (attempt >= 0 && blockTag === "latest" && txSender != null && result.substring(0, 10) === "0x556f1830" && (hexDataLength(result) % 32 === 4)) {
	                try {
	                    const data = hexDataSlice(result, 4);
	                    // Check the sender of the OffchainLookup matches the transaction
	                    const sender = hexDataSlice(data, 0, 32);
	                    if (!BigNumber.from(sender).eq(txSender)) {
	                        logger$3.throwError("CCIP Read sender did not match", Logger.errors.CALL_EXCEPTION, {
	                            name: "OffchainLookup",
	                            signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
	                            transaction, data: result
	                        });
	                    }
	                    // Read the URLs from the response
	                    const urls = [];
	                    const urlsOffset = BigNumber.from(hexDataSlice(data, 32, 64)).toNumber();
	                    const urlsLength = BigNumber.from(hexDataSlice(data, urlsOffset, urlsOffset + 32)).toNumber();
	                    const urlsData = hexDataSlice(data, urlsOffset + 32);
	                    for (let u = 0; u < urlsLength; u++) {
	                        const url = _parseString(urlsData, u * 32);
	                        if (url == null) {
	                            logger$3.throwError("CCIP Read contained corrupt URL string", Logger.errors.CALL_EXCEPTION, {
	                                name: "OffchainLookup",
	                                signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
	                                transaction, data: result
	                            });
	                        }
	                        urls.push(url);
	                    }
	                    // Get the CCIP calldata to forward
	                    const calldata = _parseBytes(data, 64);
	                    // Get the callbackSelector (bytes4)
	                    if (!BigNumber.from(hexDataSlice(data, 100, 128)).isZero()) {
	                        logger$3.throwError("CCIP Read callback selector included junk", Logger.errors.CALL_EXCEPTION, {
	                            name: "OffchainLookup",
	                            signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
	                            transaction, data: result
	                        });
	                    }
	                    const callbackSelector = hexDataSlice(data, 96, 100);
	                    // Get the extra data to send back to the contract as context
	                    const extraData = _parseBytes(data, 128);
	                    const ccipResult = yield this.ccipReadFetch(transaction, calldata, urls);
	                    if (ccipResult == null) {
	                        logger$3.throwError("CCIP Read disabled or provided no URLs", Logger.errors.CALL_EXCEPTION, {
	                            name: "OffchainLookup",
	                            signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
	                            transaction, data: result
	                        });
	                    }
	                    const tx = {
	                        to: txSender,
	                        data: hexConcat([callbackSelector, encodeBytes([ccipResult, extraData])])
	                    };
	                    return this._call(tx, blockTag, attempt + 1);
	                }
	                catch (error) {
	                    if (error.code === Logger.errors.SERVER_ERROR) {
	                        throw error;
	                    }
	                }
	            }
	            try {
	                return hexlify(result);
	            }
	            catch (error) {
	                return logger$3.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
	                    method: "call",
	                    params: { transaction, blockTag }, result, error
	                });
	            }
	        });
	    }
	    call(transaction, blockTag) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const resolved = yield resolveProperties({
	                transaction: this._getTransactionRequest(transaction),
	                blockTag: this._getBlockTag(blockTag),
	                ccipReadEnabled: Promise.resolve(transaction.ccipReadEnabled)
	            });
	            return this._call(resolved.transaction, resolved.blockTag, resolved.ccipReadEnabled ? 0 : -1);
	        });
	    }
	    estimateGas(transaction) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const params = yield resolveProperties({
	                transaction: this._getTransactionRequest(transaction)
	            });
	            const result = yield this.perform("estimateGas", params);
	            try {
	                return BigNumber.from(result);
	            }
	            catch (error) {
	                return logger$3.throwError("bad result from backend", Logger.errors.SERVER_ERROR, {
	                    method: "estimateGas",
	                    params, result, error
	                });
	            }
	        });
	    }
	    _getAddress(addressOrName) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            addressOrName = yield addressOrName;
	            if (typeof (addressOrName) !== "string") {
	                logger$3.throwArgumentError("invalid address or ENS name", "name", addressOrName);
	            }
	            const address = yield this.resolveName(addressOrName);
	            if (address == null) {
	                logger$3.throwError("ENS name not configured", Logger.errors.UNSUPPORTED_OPERATION, {
	                    operation: `resolveName(${JSON.stringify(addressOrName)})`
	                });
	            }
	            return address;
	        });
	    }
	    _getBlock(blockHashOrBlockTag, includeTransactions) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            blockHashOrBlockTag = yield blockHashOrBlockTag;
	            // If blockTag is a number (not "latest", etc), this is the block number
	            let blockNumber = -128;
	            const params = {
	                includeTransactions: !!includeTransactions
	            };
	            if (isHexString(blockHashOrBlockTag, 32)) {
	                params.blockHash = blockHashOrBlockTag;
	            }
	            else {
	                try {
	                    params.blockTag = yield this._getBlockTag(blockHashOrBlockTag);
	                    if (isHexString(params.blockTag)) {
	                        blockNumber = parseInt(params.blockTag.substring(2), 16);
	                    }
	                }
	                catch (error) {
	                    logger$3.throwArgumentError("invalid block hash or block tag", "blockHashOrBlockTag", blockHashOrBlockTag);
	                }
	            }
	            return poll(() => __awaiter$1(this, void 0, void 0, function* () {
	                const block = yield this.perform("getBlock", params);
	                // Block was not found
	                if (block == null) {
	                    // For blockhashes, if we didn't say it existed, that blockhash may
	                    // not exist. If we did see it though, perhaps from a log, we know
	                    // it exists, and this node is just not caught up yet.
	                    if (params.blockHash != null) {
	                        if (this._emitted["b:" + params.blockHash] == null) {
	                            return null;
	                        }
	                    }
	                    // For block tags, if we are asking for a future block, we return null
	                    if (params.blockTag != null) {
	                        if (blockNumber > this._emitted.block) {
	                            return null;
	                        }
	                    }
	                    // Retry on the next block
	                    return undefined;
	                }
	                // Add transactions
	                if (includeTransactions) {
	                    let blockNumber = null;
	                    for (let i = 0; i < block.transactions.length; i++) {
	                        const tx = block.transactions[i];
	                        if (tx.blockNumber == null) {
	                            tx.confirmations = 0;
	                        }
	                        else if (tx.confirmations == null) {
	                            if (blockNumber == null) {
	                                blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
	                            }
	                            // Add the confirmations using the fast block number (pessimistic)
	                            let confirmations = (blockNumber - tx.blockNumber) + 1;
	                            if (confirmations <= 0) {
	                                confirmations = 1;
	                            }
	                            tx.confirmations = confirmations;
	                        }
	                    }
	                    const blockWithTxs = this.formatter.blockWithTransactions(block);
	                    blockWithTxs.transactions = blockWithTxs.transactions.map((tx) => this._wrapTransaction(tx));
	                    return blockWithTxs;
	                }
	                return this.formatter.block(block);
	            }), { oncePoll: this });
	        });
	    }
	    getBlock(blockHashOrBlockTag) {
	        return (this._getBlock(blockHashOrBlockTag, false));
	    }
	    getBlockWithTransactions(blockHashOrBlockTag) {
	        return (this._getBlock(blockHashOrBlockTag, true));
	    }
	    getTransaction(transactionHash) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            transactionHash = yield transactionHash;
	            const params = { transactionHash: this.formatter.hash(transactionHash, true) };
	            return poll(() => __awaiter$1(this, void 0, void 0, function* () {
	                const result = yield this.perform("getTransaction", params);
	                if (result == null) {
	                    if (this._emitted["t:" + transactionHash] == null) {
	                        return null;
	                    }
	                    return undefined;
	                }
	                const tx = this.formatter.transactionResponse(result);
	                if (tx.blockNumber == null) {
	                    tx.confirmations = 0;
	                }
	                else if (tx.confirmations == null) {
	                    const blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
	                    // Add the confirmations using the fast block number (pessimistic)
	                    let confirmations = (blockNumber - tx.blockNumber) + 1;
	                    if (confirmations <= 0) {
	                        confirmations = 1;
	                    }
	                    tx.confirmations = confirmations;
	                }
	                return this._wrapTransaction(tx);
	            }), { oncePoll: this });
	        });
	    }
	    getTransactionReceipt(transactionHash) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            transactionHash = yield transactionHash;
	            const params = { transactionHash: this.formatter.hash(transactionHash, true) };
	            return poll(() => __awaiter$1(this, void 0, void 0, function* () {
	                const result = yield this.perform("getTransactionReceipt", params);
	                if (result == null) {
	                    if (this._emitted["t:" + transactionHash] == null) {
	                        return null;
	                    }
	                    return undefined;
	                }
	                // "geth-etc" returns receipts before they are ready
	                if (result.blockHash == null) {
	                    return undefined;
	                }
	                const receipt = this.formatter.receipt(result);
	                if (receipt.blockNumber == null) {
	                    receipt.confirmations = 0;
	                }
	                else if (receipt.confirmations == null) {
	                    const blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
	                    // Add the confirmations using the fast block number (pessimistic)
	                    let confirmations = (blockNumber - receipt.blockNumber) + 1;
	                    if (confirmations <= 0) {
	                        confirmations = 1;
	                    }
	                    receipt.confirmations = confirmations;
	                }
	                return receipt;
	            }), { oncePoll: this });
	        });
	    }
	    getLogs(filter) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            const params = yield resolveProperties({ filter: this._getFilter(filter) });
	            const logs = yield this.perform("getLogs", params);
	            logs.forEach((log) => {
	                if (log.removed == null) {
	                    log.removed = false;
	                }
	            });
	            return Formatter.arrayOf(this.formatter.filterLog.bind(this.formatter))(logs);
	        });
	    }
	    getEtherPrice() {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            yield this.getNetwork();
	            return this.perform("getEtherPrice", {});
	        });
	    }
	    _getBlockTag(blockTag) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            blockTag = yield blockTag;
	            if (typeof (blockTag) === "number" && blockTag < 0) {
	                if (blockTag % 1) {
	                    logger$3.throwArgumentError("invalid BlockTag", "blockTag", blockTag);
	                }
	                let blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
	                blockNumber += blockTag;
	                if (blockNumber < 0) {
	                    blockNumber = 0;
	                }
	                return this.formatter.blockTag(blockNumber);
	            }
	            return this.formatter.blockTag(blockTag);
	        });
	    }
	    getResolver(name) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            let currentName = name;
	            while (true) {
	                if (currentName === "" || currentName === ".") {
	                    return null;
	                }
	                // Optimization since the eth node cannot change and does
	                // not have a wildcard resolver
	                if (name !== "eth" && currentName === "eth") {
	                    return null;
	                }
	                // Check the current node for a resolver
	                const addr = yield this._getResolver(currentName, "getResolver");
	                // Found a resolver!
	                if (addr != null) {
	                    const resolver = new Resolver(this, addr, name);
	                    // Legacy resolver found, using EIP-2544 so it isn't safe to use
	                    if (currentName !== name && !(yield resolver.supportsWildcard())) {
	                        return null;
	                    }
	                    return resolver;
	                }
	                // Get the parent node
	                currentName = currentName.split(".").slice(1).join(".");
	            }
	        });
	    }
	    _getResolver(name, operation) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            if (operation == null) {
	                operation = "ENS";
	            }
	            const network = yield this.getNetwork();
	            // No ENS...
	            if (!network.ensAddress) {
	                logger$3.throwError("network does not support ENS", Logger.errors.UNSUPPORTED_OPERATION, { operation, network: network.name });
	            }
	            try {
	                // keccak256("resolver(bytes32)")
	                const addrData = yield this.call({
	                    to: network.ensAddress,
	                    data: ("0x0178b8bf" + namehash(name).substring(2))
	                });
	                return this.formatter.callAddress(addrData);
	            }
	            catch (error) {
	                // ENS registry cannot throw errors on resolver(bytes32)
	            }
	            return null;
	        });
	    }
	    resolveName(name) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            name = yield name;
	            // If it is already an address, nothing to resolve
	            try {
	                return Promise.resolve(this.formatter.address(name));
	            }
	            catch (error) {
	                // If is is a hexstring, the address is bad (See #694)
	                if (isHexString(name)) {
	                    throw error;
	                }
	            }
	            if (typeof (name) !== "string") {
	                logger$3.throwArgumentError("invalid ENS name", "name", name);
	            }
	            // Get the addr from the resolver
	            const resolver = yield this.getResolver(name);
	            if (!resolver) {
	                return null;
	            }
	            return yield resolver.getAddress();
	        });
	    }
	    lookupAddress(address) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            address = yield address;
	            address = this.formatter.address(address);
	            const node = address.substring(2).toLowerCase() + ".addr.reverse";
	            const resolverAddr = yield this._getResolver(node, "lookupAddress");
	            if (resolverAddr == null) {
	                return null;
	            }
	            // keccak("name(bytes32)")
	            const name = _parseString(yield this.call({
	                to: resolverAddr,
	                data: ("0x691f3431" + namehash(node).substring(2))
	            }), 0);
	            const addr = yield this.resolveName(name);
	            if (addr != address) {
	                return null;
	            }
	            return name;
	        });
	    }
	    getAvatar(nameOrAddress) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            let resolver = null;
	            if (isHexString(nameOrAddress)) {
	                // Address; reverse lookup
	                const address = this.formatter.address(nameOrAddress);
	                const node = address.substring(2).toLowerCase() + ".addr.reverse";
	                const resolverAddress = yield this._getResolver(node, "getAvatar");
	                if (!resolverAddress) {
	                    return null;
	                }
	                // Try resolving the avatar against the addr.reverse resolver
	                resolver = new Resolver(this, resolverAddress, node);
	                try {
	                    const avatar = yield resolver.getAvatar();
	                    if (avatar) {
	                        return avatar.url;
	                    }
	                }
	                catch (error) {
	                    if (error.code !== Logger.errors.CALL_EXCEPTION) {
	                        throw error;
	                    }
	                }
	                // Try getting the name and performing forward lookup; allowing wildcards
	                try {
	                    // keccak("name(bytes32)")
	                    const name = _parseString(yield this.call({
	                        to: resolverAddress,
	                        data: ("0x691f3431" + namehash(node).substring(2))
	                    }), 0);
	                    resolver = yield this.getResolver(name);
	                }
	                catch (error) {
	                    if (error.code !== Logger.errors.CALL_EXCEPTION) {
	                        throw error;
	                    }
	                    return null;
	                }
	            }
	            else {
	                // ENS name; forward lookup with wildcard
	                resolver = yield this.getResolver(nameOrAddress);
	                if (!resolver) {
	                    return null;
	                }
	            }
	            const avatar = yield resolver.getAvatar();
	            if (avatar == null) {
	                return null;
	            }
	            return avatar.url;
	        });
	    }
	    perform(method, params) {
	        return logger$3.throwError(method + " not implemented", Logger.errors.NOT_IMPLEMENTED, { operation: method });
	    }
	    _startEvent(event) {
	        this.polling = (this._events.filter((e) => e.pollable()).length > 0);
	    }
	    _stopEvent(event) {
	        this.polling = (this._events.filter((e) => e.pollable()).length > 0);
	    }
	    _addEventListener(eventName, listener, once) {
	        const event = new Event(getEventTag(eventName), listener, once);
	        this._events.push(event);
	        this._startEvent(event);
	        return this;
	    }
	    on(eventName, listener) {
	        return this._addEventListener(eventName, listener, false);
	    }
	    once(eventName, listener) {
	        return this._addEventListener(eventName, listener, true);
	    }
	    emit(eventName, ...args) {
	        let result = false;
	        let stopped = [];
	        let eventTag = getEventTag(eventName);
	        this._events = this._events.filter((event) => {
	            if (event.tag !== eventTag) {
	                return true;
	            }
	            setTimeout(() => {
	                event.listener.apply(this, args);
	            }, 0);
	            result = true;
	            if (event.once) {
	                stopped.push(event);
	                return false;
	            }
	            return true;
	        });
	        stopped.forEach((event) => { this._stopEvent(event); });
	        return result;
	    }
	    listenerCount(eventName) {
	        if (!eventName) {
	            return this._events.length;
	        }
	        let eventTag = getEventTag(eventName);
	        return this._events.filter((event) => {
	            return (event.tag === eventTag);
	        }).length;
	    }
	    listeners(eventName) {
	        if (eventName == null) {
	            return this._events.map((event) => event.listener);
	        }
	        let eventTag = getEventTag(eventName);
	        return this._events
	            .filter((event) => (event.tag === eventTag))
	            .map((event) => event.listener);
	    }
	    off(eventName, listener) {
	        if (listener == null) {
	            return this.removeAllListeners(eventName);
	        }
	        const stopped = [];
	        let found = false;
	        let eventTag = getEventTag(eventName);
	        this._events = this._events.filter((event) => {
	            if (event.tag !== eventTag || event.listener != listener) {
	                return true;
	            }
	            if (found) {
	                return true;
	            }
	            found = true;
	            stopped.push(event);
	            return false;
	        });
	        stopped.forEach((event) => { this._stopEvent(event); });
	        return this;
	    }
	    removeAllListeners(eventName) {
	        let stopped = [];
	        if (eventName == null) {
	            stopped = this._events;
	            this._events = [];
	        }
	        else {
	            const eventTag = getEventTag(eventName);
	            this._events = this._events.filter((event) => {
	                if (event.tag !== eventTag) {
	                    return true;
	                }
	                stopped.push(event);
	                return false;
	            });
	        }
	        stopped.forEach((event) => { this._stopEvent(event); });
	        return this;
	    }
	}

	var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const logger$2 = new Logger(version$1);
	const errorGas = ["call", "estimateGas"];
	function spelunk(value, requireData) {
	    if (value == null) {
	        return null;
	    }
	    // These *are* the droids we're looking for.
	    if (typeof (value.message) === "string" && value.message.match("reverted")) {
	        const data = isHexString(value.data) ? value.data : null;
	        if (!requireData || data) {
	            return { message: value.message, data };
	        }
	    }
	    // Spelunk further...
	    if (typeof (value) === "object") {
	        for (const key in value) {
	            const result = spelunk(value[key], requireData);
	            if (result) {
	                return result;
	            }
	        }
	        return null;
	    }
	    // Might be a JSON string we can further descend...
	    if (typeof (value) === "string") {
	        try {
	            return spelunk(JSON.parse(value), requireData);
	        }
	        catch (error) { }
	    }
	    return null;
	}
	function checkError(method, error, params) {
	    const transaction = params.transaction || params.signedTransaction;
	    // Undo the "convenience" some nodes are attempting to prevent backwards
	    // incompatibility; maybe for v6 consider forwarding reverts as errors
	    if (method === "call") {
	        const result = spelunk(error, true);
	        if (result) {
	            return result.data;
	        }
	        // Nothing descriptive..
	        logger$2.throwError("missing revert data in call exception; Transaction reverted without a reason string", Logger.errors.CALL_EXCEPTION, {
	            data: "0x", transaction, error
	        });
	    }
	    if (method === "estimateGas") {
	        // Try to find something, with a preference on SERVER_ERROR body
	        let result = spelunk(error.body, false);
	        if (result == null) {
	            result = spelunk(error, false);
	        }
	        // Found "reverted", this is a CALL_EXCEPTION
	        if (result) {
	            logger$2.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
	                reason: result.message, method, transaction, error
	            });
	        }
	    }
	    // @TODO: Should we spelunk for message too?
	    let message = error.message;
	    if (error.code === Logger.errors.SERVER_ERROR && error.error && typeof (error.error.message) === "string") {
	        message = error.error.message;
	    }
	    else if (typeof (error.body) === "string") {
	        message = error.body;
	    }
	    else if (typeof (error.responseText) === "string") {
	        message = error.responseText;
	    }
	    message = (message || "").toLowerCase();
	    // "insufficient funds for gas * price + value + cost(data)"
	    if (message.match(/insufficient funds|base fee exceeds gas limit|InsufficientFunds/i)) {
	        logger$2.throwError("insufficient funds for intrinsic transaction cost", Logger.errors.INSUFFICIENT_FUNDS, {
	            error, method, transaction
	        });
	    }
	    // "nonce too low"
	    if (message.match(/nonce (is )?too low/i)) {
	        logger$2.throwError("nonce has already been used", Logger.errors.NONCE_EXPIRED, {
	            error, method, transaction
	        });
	    }
	    // "replacement transaction underpriced"
	    if (message.match(/replacement transaction underpriced|transaction gas price.*too low/i)) {
	        logger$2.throwError("replacement fee too low", Logger.errors.REPLACEMENT_UNDERPRICED, {
	            error, method, transaction
	        });
	    }
	    // "replacement transaction underpriced"
	    if (message.match(/only replay-protected/i)) {
	        logger$2.throwError("legacy pre-eip-155 transactions not supported", Logger.errors.UNSUPPORTED_OPERATION, {
	            error, method, transaction
	        });
	    }
	    if (errorGas.indexOf(method) >= 0 && message.match(/gas required exceeds allowance|always failing transaction|execution reverted|revert/)) {
	        logger$2.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
	            error, method, transaction
	        });
	    }
	    throw error;
	}
	function timer(timeout) {
	    return new Promise(function (resolve) {
	        setTimeout(resolve, timeout);
	    });
	}
	function getResult(payload) {
	    if (payload.error) {
	        // @TODO: not any
	        const error = new Error(payload.error.message);
	        error.code = payload.error.code;
	        error.data = payload.error.data;
	        throw error;
	    }
	    return payload.result;
	}
	function getLowerCase(value) {
	    if (value) {
	        return value.toLowerCase();
	    }
	    return value;
	}
	const _constructorGuard = {};
	class JsonRpcSigner extends Signer {
	    constructor(constructorGuard, provider, addressOrIndex) {
	        super();
	        if (constructorGuard !== _constructorGuard) {
	            throw new Error("do not call the JsonRpcSigner constructor directly; use provider.getSigner");
	        }
	        defineReadOnly(this, "provider", provider);
	        if (addressOrIndex == null) {
	            addressOrIndex = 0;
	        }
	        if (typeof (addressOrIndex) === "string") {
	            defineReadOnly(this, "_address", this.provider.formatter.address(addressOrIndex));
	            defineReadOnly(this, "_index", null);
	        }
	        else if (typeof (addressOrIndex) === "number") {
	            defineReadOnly(this, "_index", addressOrIndex);
	            defineReadOnly(this, "_address", null);
	        }
	        else {
	            logger$2.throwArgumentError("invalid address or index", "addressOrIndex", addressOrIndex);
	        }
	    }
	    connect(provider) {
	        return logger$2.throwError("cannot alter JSON-RPC Signer connection", Logger.errors.UNSUPPORTED_OPERATION, {
	            operation: "connect"
	        });
	    }
	    connectUnchecked() {
	        return new UncheckedJsonRpcSigner(_constructorGuard, this.provider, this._address || this._index);
	    }
	    getAddress() {
	        if (this._address) {
	            return Promise.resolve(this._address);
	        }
	        return this.provider.send("eth_accounts", []).then((accounts) => {
	            if (accounts.length <= this._index) {
	                logger$2.throwError("unknown account #" + this._index, Logger.errors.UNSUPPORTED_OPERATION, {
	                    operation: "getAddress"
	                });
	            }
	            return this.provider.formatter.address(accounts[this._index]);
	        });
	    }
	    sendUncheckedTransaction(transaction) {
	        transaction = shallowCopy(transaction);
	        const fromAddress = this.getAddress().then((address) => {
	            if (address) {
	                address = address.toLowerCase();
	            }
	            return address;
	        });
	        // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
	        // wishes to use this, it is easy to specify explicitly, otherwise
	        // we look it up for them.
	        if (transaction.gasLimit == null) {
	            const estimate = shallowCopy(transaction);
	            estimate.from = fromAddress;
	            transaction.gasLimit = this.provider.estimateGas(estimate);
	        }
	        if (transaction.to != null) {
	            transaction.to = Promise.resolve(transaction.to).then((to) => __awaiter(this, void 0, void 0, function* () {
	                if (to == null) {
	                    return null;
	                }
	                const address = yield this.provider.resolveName(to);
	                if (address == null) {
	                    logger$2.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
	                }
	                return address;
	            }));
	        }
	        return resolveProperties({
	            tx: resolveProperties(transaction),
	            sender: fromAddress
	        }).then(({ tx, sender }) => {
	            if (tx.from != null) {
	                if (tx.from.toLowerCase() !== sender) {
	                    logger$2.throwArgumentError("from address mismatch", "transaction", transaction);
	                }
	            }
	            else {
	                tx.from = sender;
	            }
	            const hexTx = this.provider.constructor.hexlifyTransaction(tx, { from: true });
	            return this.provider.send("eth_sendTransaction", [hexTx]).then((hash) => {
	                return hash;
	            }, (error) => {
	                if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
	                    logger$2.throwError("user rejected transaction", Logger.errors.ACTION_REJECTED, {
	                        action: "sendTransaction",
	                        transaction: tx
	                    });
	                }
	                return checkError("sendTransaction", error, hexTx);
	            });
	        });
	    }
	    signTransaction(transaction) {
	        return logger$2.throwError("signing transactions is unsupported", Logger.errors.UNSUPPORTED_OPERATION, {
	            operation: "signTransaction"
	        });
	    }
	    sendTransaction(transaction) {
	        return __awaiter(this, void 0, void 0, function* () {
	            // This cannot be mined any earlier than any recent block
	            const blockNumber = yield this.provider._getInternalBlockNumber(100 + 2 * this.provider.pollingInterval);
	            // Send the transaction
	            const hash = yield this.sendUncheckedTransaction(transaction);
	            try {
	                // Unfortunately, JSON-RPC only provides and opaque transaction hash
	                // for a response, and we need the actual transaction, so we poll
	                // for it; it should show up very quickly
	                return yield poll(() => __awaiter(this, void 0, void 0, function* () {
	                    const tx = yield this.provider.getTransaction(hash);
	                    if (tx === null) {
	                        return undefined;
	                    }
	                    return this.provider._wrapTransaction(tx, hash, blockNumber);
	                }), { oncePoll: this.provider });
	            }
	            catch (error) {
	                error.transactionHash = hash;
	                throw error;
	            }
	        });
	    }
	    signMessage(message) {
	        return __awaiter(this, void 0, void 0, function* () {
	            const data = ((typeof (message) === "string") ? toUtf8Bytes(message) : message);
	            const address = yield this.getAddress();
	            try {
	                return yield this.provider.send("personal_sign", [hexlify(data), address.toLowerCase()]);
	            }
	            catch (error) {
	                if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
	                    logger$2.throwError("user rejected signing", Logger.errors.ACTION_REJECTED, {
	                        action: "signMessage",
	                        from: address,
	                        messageData: message
	                    });
	                }
	                throw error;
	            }
	        });
	    }
	    _legacySignMessage(message) {
	        return __awaiter(this, void 0, void 0, function* () {
	            const data = ((typeof (message) === "string") ? toUtf8Bytes(message) : message);
	            const address = yield this.getAddress();
	            try {
	                // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
	                return yield this.provider.send("eth_sign", [address.toLowerCase(), hexlify(data)]);
	            }
	            catch (error) {
	                if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
	                    logger$2.throwError("user rejected signing", Logger.errors.ACTION_REJECTED, {
	                        action: "_legacySignMessage",
	                        from: address,
	                        messageData: message
	                    });
	                }
	                throw error;
	            }
	        });
	    }
	    _signTypedData(domain, types, value) {
	        return __awaiter(this, void 0, void 0, function* () {
	            // Populate any ENS names (in-place)
	            const populated = yield TypedDataEncoder.resolveNames(domain, types, value, (name) => {
	                return this.provider.resolveName(name);
	            });
	            const address = yield this.getAddress();
	            try {
	                return yield this.provider.send("eth_signTypedData_v4", [
	                    address.toLowerCase(),
	                    JSON.stringify(TypedDataEncoder.getPayload(populated.domain, types, populated.value))
	                ]);
	            }
	            catch (error) {
	                if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
	                    logger$2.throwError("user rejected signing", Logger.errors.ACTION_REJECTED, {
	                        action: "_signTypedData",
	                        from: address,
	                        messageData: { domain: populated.domain, types, value: populated.value }
	                    });
	                }
	                throw error;
	            }
	        });
	    }
	    unlock(password) {
	        return __awaiter(this, void 0, void 0, function* () {
	            const provider = this.provider;
	            const address = yield this.getAddress();
	            return provider.send("personal_unlockAccount", [address.toLowerCase(), password, null]);
	        });
	    }
	}
	class UncheckedJsonRpcSigner extends JsonRpcSigner {
	    sendTransaction(transaction) {
	        return this.sendUncheckedTransaction(transaction).then((hash) => {
	            return {
	                hash: hash,
	                nonce: null,
	                gasLimit: null,
	                gasPrice: null,
	                data: null,
	                value: null,
	                chainId: null,
	                confirmations: 0,
	                from: null,
	                wait: (confirmations) => { return this.provider.waitForTransaction(hash, confirmations); }
	            };
	        });
	    }
	}
	const allowedTransactionKeys = {
	    chainId: true, data: true, gasLimit: true, gasPrice: true, nonce: true, to: true, value: true,
	    type: true, accessList: true,
	    maxFeePerGas: true, maxPriorityFeePerGas: true
	};
	class JsonRpcProvider extends BaseProvider {
	    constructor(url, network) {
	        let networkOrReady = network;
	        // The network is unknown, query the JSON-RPC for it
	        if (networkOrReady == null) {
	            networkOrReady = new Promise((resolve, reject) => {
	                setTimeout(() => {
	                    this.detectNetwork().then((network) => {
	                        resolve(network);
	                    }, (error) => {
	                        reject(error);
	                    });
	                }, 0);
	            });
	        }
	        super(networkOrReady);
	        // Default URL
	        if (!url) {
	            url = getStatic(this.constructor, "defaultUrl")();
	        }
	        if (typeof (url) === "string") {
	            defineReadOnly(this, "connection", Object.freeze({
	                url: url
	            }));
	        }
	        else {
	            defineReadOnly(this, "connection", Object.freeze(shallowCopy(url)));
	        }
	        this._nextId = 42;
	    }
	    get _cache() {
	        if (this._eventLoopCache == null) {
	            this._eventLoopCache = {};
	        }
	        return this._eventLoopCache;
	    }
	    static defaultUrl() {
	        return "http:/\/localhost:8545";
	    }
	    detectNetwork() {
	        if (!this._cache["detectNetwork"]) {
	            this._cache["detectNetwork"] = this._uncachedDetectNetwork();
	            // Clear this cache at the beginning of the next event loop
	            setTimeout(() => {
	                this._cache["detectNetwork"] = null;
	            }, 0);
	        }
	        return this._cache["detectNetwork"];
	    }
	    _uncachedDetectNetwork() {
	        return __awaiter(this, void 0, void 0, function* () {
	            yield timer(0);
	            let chainId = null;
	            try {
	                chainId = yield this.send("eth_chainId", []);
	            }
	            catch (error) {
	                try {
	                    chainId = yield this.send("net_version", []);
	                }
	                catch (error) { }
	            }
	            if (chainId != null) {
	                const getNetwork = getStatic(this.constructor, "getNetwork");
	                try {
	                    return getNetwork(BigNumber.from(chainId).toNumber());
	                }
	                catch (error) {
	                    return logger$2.throwError("could not detect network", Logger.errors.NETWORK_ERROR, {
	                        chainId: chainId,
	                        event: "invalidNetwork",
	                        serverError: error
	                    });
	                }
	            }
	            return logger$2.throwError("could not detect network", Logger.errors.NETWORK_ERROR, {
	                event: "noNetwork"
	            });
	        });
	    }
	    getSigner(addressOrIndex) {
	        return new JsonRpcSigner(_constructorGuard, this, addressOrIndex);
	    }
	    getUncheckedSigner(addressOrIndex) {
	        return this.getSigner(addressOrIndex).connectUnchecked();
	    }
	    listAccounts() {
	        return this.send("eth_accounts", []).then((accounts) => {
	            return accounts.map((a) => this.formatter.address(a));
	        });
	    }
	    send(method, params) {
	        const request = {
	            method: method,
	            params: params,
	            id: (this._nextId++),
	            jsonrpc: "2.0"
	        };
	        this.emit("debug", {
	            action: "request",
	            request: deepCopy(request),
	            provider: this
	        });
	        // We can expand this in the future to any call, but for now these
	        // are the biggest wins and do not require any serializing parameters.
	        const cache = (["eth_chainId", "eth_blockNumber"].indexOf(method) >= 0);
	        if (cache && this._cache[method]) {
	            return this._cache[method];
	        }
	        const result = fetchJson(this.connection, JSON.stringify(request), getResult).then((result) => {
	            this.emit("debug", {
	                action: "response",
	                request: request,
	                response: result,
	                provider: this
	            });
	            return result;
	        }, (error) => {
	            this.emit("debug", {
	                action: "response",
	                error: error,
	                request: request,
	                provider: this
	            });
	            throw error;
	        });
	        // Cache the fetch, but clear it on the next event loop
	        if (cache) {
	            this._cache[method] = result;
	            setTimeout(() => {
	                this._cache[method] = null;
	            }, 0);
	        }
	        return result;
	    }
	    prepareRequest(method, params) {
	        switch (method) {
	            case "getBlockNumber":
	                return ["eth_blockNumber", []];
	            case "getGasPrice":
	                return ["eth_gasPrice", []];
	            case "getBalance":
	                return ["eth_getBalance", [getLowerCase(params.address), params.blockTag]];
	            case "getTransactionCount":
	                return ["eth_getTransactionCount", [getLowerCase(params.address), params.blockTag]];
	            case "getCode":
	                return ["eth_getCode", [getLowerCase(params.address), params.blockTag]];
	            case "getStorageAt":
	                return ["eth_getStorageAt", [getLowerCase(params.address), hexZeroPad(params.position, 32), params.blockTag]];
	            case "sendTransaction":
	                return ["eth_sendRawTransaction", [params.signedTransaction]];
	            case "getBlock":
	                if (params.blockTag) {
	                    return ["eth_getBlockByNumber", [params.blockTag, !!params.includeTransactions]];
	                }
	                else if (params.blockHash) {
	                    return ["eth_getBlockByHash", [params.blockHash, !!params.includeTransactions]];
	                }
	                return null;
	            case "getTransaction":
	                return ["eth_getTransactionByHash", [params.transactionHash]];
	            case "getTransactionReceipt":
	                return ["eth_getTransactionReceipt", [params.transactionHash]];
	            case "call": {
	                const hexlifyTransaction = getStatic(this.constructor, "hexlifyTransaction");
	                return ["eth_call", [hexlifyTransaction(params.transaction, { from: true }), params.blockTag]];
	            }
	            case "estimateGas": {
	                const hexlifyTransaction = getStatic(this.constructor, "hexlifyTransaction");
	                return ["eth_estimateGas", [hexlifyTransaction(params.transaction, { from: true })]];
	            }
	            case "getLogs":
	                if (params.filter && params.filter.address != null) {
	                    params.filter.address = getLowerCase(params.filter.address);
	                }
	                return ["eth_getLogs", [params.filter]];
	        }
	        return null;
	    }
	    perform(method, params) {
	        return __awaiter(this, void 0, void 0, function* () {
	            // Legacy networks do not like the type field being passed along (which
	            // is fair), so we delete type if it is 0 and a non-EIP-1559 network
	            if (method === "call" || method === "estimateGas") {
	                const tx = params.transaction;
	                if (tx && tx.type != null && BigNumber.from(tx.type).isZero()) {
	                    // If there are no EIP-1559 properties, it might be non-EIP-1559
	                    if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
	                        const feeData = yield this.getFeeData();
	                        if (feeData.maxFeePerGas == null && feeData.maxPriorityFeePerGas == null) {
	                            // Network doesn't know about EIP-1559 (and hence type)
	                            params = shallowCopy(params);
	                            params.transaction = shallowCopy(tx);
	                            delete params.transaction.type;
	                        }
	                    }
	                }
	            }
	            const args = this.prepareRequest(method, params);
	            if (args == null) {
	                logger$2.throwError(method + " not implemented", Logger.errors.NOT_IMPLEMENTED, { operation: method });
	            }
	            try {
	                return yield this.send(args[0], args[1]);
	            }
	            catch (error) {
	                return checkError(method, error, params);
	            }
	        });
	    }
	    _startEvent(event) {
	        if (event.tag === "pending") {
	            this._startPending();
	        }
	        super._startEvent(event);
	    }
	    _startPending() {
	        if (this._pendingFilter != null) {
	            return;
	        }
	        const self = this;
	        const pendingFilter = this.send("eth_newPendingTransactionFilter", []);
	        this._pendingFilter = pendingFilter;
	        pendingFilter.then(function (filterId) {
	            function poll() {
	                self.send("eth_getFilterChanges", [filterId]).then(function (hashes) {
	                    if (self._pendingFilter != pendingFilter) {
	                        return null;
	                    }
	                    let seq = Promise.resolve();
	                    hashes.forEach(function (hash) {
	                        // @TODO: This should be garbage collected at some point... How? When?
	                        self._emitted["t:" + hash.toLowerCase()] = "pending";
	                        seq = seq.then(function () {
	                            return self.getTransaction(hash).then(function (tx) {
	                                self.emit("pending", tx);
	                                return null;
	                            });
	                        });
	                    });
	                    return seq.then(function () {
	                        return timer(1000);
	                    });
	                }).then(function () {
	                    if (self._pendingFilter != pendingFilter) {
	                        self.send("eth_uninstallFilter", [filterId]);
	                        return;
	                    }
	                    setTimeout(function () { poll(); }, 0);
	                    return null;
	                }).catch((error) => { });
	            }
	            poll();
	            return filterId;
	        }).catch((error) => { });
	    }
	    _stopEvent(event) {
	        if (event.tag === "pending" && this.listenerCount("pending") === 0) {
	            this._pendingFilter = null;
	        }
	        super._stopEvent(event);
	    }
	    // Convert an ethers.js transaction into a JSON-RPC transaction
	    //  - gasLimit => gas
	    //  - All values hexlified
	    //  - All numeric values zero-striped
	    //  - All addresses are lowercased
	    // NOTE: This allows a TransactionRequest, but all values should be resolved
	    //       before this is called
	    // @TODO: This will likely be removed in future versions and prepareRequest
	    //        will be the preferred method for this.
	    static hexlifyTransaction(transaction, allowExtra) {
	        // Check only allowed properties are given
	        const allowed = shallowCopy(allowedTransactionKeys);
	        if (allowExtra) {
	            for (const key in allowExtra) {
	                if (allowExtra[key]) {
	                    allowed[key] = true;
	                }
	            }
	        }
	        checkProperties(transaction, allowed);
	        const result = {};
	        // JSON-RPC now requires numeric values to be "quantity" values
	        ["chainId", "gasLimit", "gasPrice", "type", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "value"].forEach(function (key) {
	            if (transaction[key] == null) {
	                return;
	            }
	            const value = hexValue(BigNumber.from(transaction[key]));
	            if (key === "gasLimit") {
	                key = "gas";
	            }
	            result[key] = value;
	        });
	        ["from", "to", "data"].forEach(function (key) {
	            if (transaction[key] == null) {
	                return;
	            }
	            result[key] = hexlify(transaction[key]);
	        });
	        if (transaction.accessList) {
	            result["accessList"] = accessListify(transaction.accessList);
	        }
	        return result;
	    }
	}

	const logger$1 = new Logger(version$1);
	let _nextId = 1;
	function buildWeb3LegacyFetcher(provider, sendFunc) {
	    const fetcher = "Web3LegacyFetcher";
	    return function (method, params) {
	        const request = {
	            method: method,
	            params: params,
	            id: (_nextId++),
	            jsonrpc: "2.0"
	        };
	        return new Promise((resolve, reject) => {
	            this.emit("debug", {
	                action: "request",
	                fetcher,
	                request: deepCopy(request),
	                provider: this
	            });
	            sendFunc(request, (error, response) => {
	                if (error) {
	                    this.emit("debug", {
	                        action: "response",
	                        fetcher,
	                        error,
	                        request,
	                        provider: this
	                    });
	                    return reject(error);
	                }
	                this.emit("debug", {
	                    action: "response",
	                    fetcher,
	                    request,
	                    response,
	                    provider: this
	                });
	                if (response.error) {
	                    const error = new Error(response.error.message);
	                    error.code = response.error.code;
	                    error.data = response.error.data;
	                    return reject(error);
	                }
	                resolve(response.result);
	            });
	        });
	    };
	}
	function buildEip1193Fetcher(provider) {
	    return function (method, params) {
	        if (params == null) {
	            params = [];
	        }
	        const request = { method, params };
	        this.emit("debug", {
	            action: "request",
	            fetcher: "Eip1193Fetcher",
	            request: deepCopy(request),
	            provider: this
	        });
	        return provider.request(request).then((response) => {
	            this.emit("debug", {
	                action: "response",
	                fetcher: "Eip1193Fetcher",
	                request,
	                response,
	                provider: this
	            });
	            return response;
	        }, (error) => {
	            this.emit("debug", {
	                action: "response",
	                fetcher: "Eip1193Fetcher",
	                request,
	                error,
	                provider: this
	            });
	            throw error;
	        });
	    };
	}
	class Web3Provider extends JsonRpcProvider {
	    constructor(provider, network) {
	        if (provider == null) {
	            logger$1.throwArgumentError("missing provider", "provider", provider);
	        }
	        let path = null;
	        let jsonRpcFetchFunc = null;
	        let subprovider = null;
	        if (typeof (provider) === "function") {
	            path = "unknown:";
	            jsonRpcFetchFunc = provider;
	        }
	        else {
	            path = provider.host || provider.path || "";
	            if (!path && provider.isMetaMask) {
	                path = "metamask";
	            }
	            subprovider = provider;
	            if (provider.request) {
	                if (path === "") {
	                    path = "eip-1193:";
	                }
	                jsonRpcFetchFunc = buildEip1193Fetcher(provider);
	            }
	            else if (provider.sendAsync) {
	                jsonRpcFetchFunc = buildWeb3LegacyFetcher(provider, provider.sendAsync.bind(provider));
	            }
	            else if (provider.send) {
	                jsonRpcFetchFunc = buildWeb3LegacyFetcher(provider, provider.send.bind(provider));
	            }
	            else {
	                logger$1.throwArgumentError("unsupported provider", "provider", provider);
	            }
	            if (!path) {
	                path = "unknown:";
	            }
	        }
	        super(path, network);
	        defineReadOnly(this, "jsonRpcFetchFunc", jsonRpcFetchFunc);
	        defineReadOnly(this, "provider", subprovider);
	    }
	    send(method, params) {
	        return this.jsonRpcFetchFunc(method, params);
	    }
	}

	const version = "units/5.7.0";

	const logger = new Logger(version);
	const names = [
	    "wei",
	    "kwei",
	    "mwei",
	    "gwei",
	    "szabo",
	    "finney",
	    "ether",
	];
	function parseUnits(value, unitName) {
	    if (typeof (value) !== "string") {
	        logger.throwArgumentError("value must be a string", "value", value);
	    }
	    if (typeof (unitName) === "string") {
	        const index = names.indexOf(unitName);
	        if (index !== -1) {
	            unitName = 3 * index;
	        }
	    }
	    return parseFixed(value, (unitName != null) ? unitName : 18);
	}
	function parseEther(ether) {
	    return parseUnits(ether, 18);
	}

	const sha3 = require('js-sha3').keccak_256;
	const fileAbi = ["function write(bytes memory filename, bytes memory data) public payable", "function writeChunk(bytes memory name, uint256 chunkId, bytes memory data) public payable", "function files(bytes memory filename) public view returns (bytes memory)", "function setDefault(bytes memory _defaultFile) public", "function refund() public", "function remove(bytes memory name) external returns (uint256)", "function countChunks(bytes memory name) external view returns (uint256)", "function getChunkHash(bytes memory name, uint256 chunkId) public view returns (bytes32)"];
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
	};
	function stringToHex(s) {
	  return hexlify(toUtf8Bytes(s));
	}
	async function readFile(file) {
	  return new Promise((resolve, reject) => {
	    const reader = new FileReader();
	    reader.onload = res => {
	      resolve(Buffer.from(res.target.result));
	    };
	    reader.readAsArrayBuffer(file);
	  });
	}
	async function deleteFile(contract, hexName) {
	  const estimatedGas = await contract.estimateGas.remove(hexName);
	  let tx = await contract.remove(hexName, {
	    gasLimit: estimatedGas.mul(6).div(5).toString()
	  });
	  const receipt = await tx.wait();
	  if (receipt.status) {
	    return REMOVE_SUCCESS;
	  } else {
	    return REMOVE_FAIL;
	  }
	}
	async function checkAndDelete(contract, hexName, chunkLength) {
	  let oldChunkLength = await contract.countChunks(hexName);
	  if (oldChunkLength > chunkLength) {
	    return await deleteFile(contract, hexName);
	  }
	  return REMOVE_NORMAL;
	}
	function FileContract(_provider, _address) {
	  let provider = new Web3Provider(_provider);
	  let contract = new Contract(_address, fileAbi, provider);
	  return contract.connect(provider.getSigner());
	}
	const noop = () => {};
	async function upload(provider, address, file, dirPath = "", onProgress = noop, onSuccess = noop, onError = noop) {
	  if (!file) {
	    onError(`missing file!`);
	    return;
	  }
	  if (!address) {
	    onError(`missing contract address!`);
	    return;
	  }
	  const contract = FileContract(provider, address);
	  const {
	    chainId
	  } = await contract.provider.getNetwork();
	  const content = await readFile(file);
	  const name = dirPath ? dirPath + file.name : file.name;
	  let fileSize = file.size;
	  const hexName = stringToHex(name);
	  let chunks = [];
	  if (chainId === GALILEO_CHAIN_ID) {
	    if (fileSize > 475 * 1024) {
	      const chunkSize = Math.ceil(fileSize / (475 * 1024));
	      chunks = bufferChunk(content, chunkSize);
	      fileSize = fileSize / chunkSize;
	    } else {
	      chunks.push(content);
	    }
	  } else {
	    if (fileSize > 24 * 1024 - 326) {
	      const chunkSize = Math.ceil(fileSize / (24 * 1024 - 326));
	      chunks = bufferChunk(content, chunkSize);
	      fileSize = fileSize / chunkSize;
	    } else {
	      chunks.push(content);
	    }
	  }
	  const clearState = await checkAndDelete(contract, hexName, chunks.length);
	  if (clearState === REMOVE_FAIL) {
	    onError(`Check Old File Fail!`);
	    return;
	  }
	  let cost = 0;
	  if (chainId === GALILEO_CHAIN_ID && fileSize > 24 * 1024 - 326) {
	    cost = Math.floor((fileSize + 326) / 1024 / 24);
	  }
	  onProgress(0, chunks.length, file);
	  for (const index in chunks) {
	    const chunk = chunks[index];
	    const hexData = '0x' + chunk.toString('hex');
	    if (clearState === REMOVE_NORMAL) {
	      const localHash = '0x' + sha3(chunk);
	      let hash = await contract.getChunkHash(hexName, index);
	      if (localHash === hash) {
	        console.log(`File chunkId: ${index}: The data is not changed.`);
	        onProgress(index, chunks.length, file);
	        continue;
	      }
	    }
	    const estimatedGas = await contract.estimateGas.writeChunk(hexName, index, hexData, {
	      value: parseEther(cost.toString())
	    });
	    const tx = await contract.writeChunk(hexName, index, hexData, {
	      gasLimit: estimatedGas.mul(6).div(5).toString(),
	      value: parseEther(cost.toString())
	    });
	    console.log(`File chunkId: ${index}: The data is upload. ${tx}`);
	    const receipt = await tx.wait();
	    if (!receipt.status) {
	      onError(`File chunkId: ${index} upload fail`);
	      break;
	    }
	    onProgress(index, chunks.length, file);
	  }
	  onSuccess(file);
	}

	var index = {
	  upload
	};

	exports["default"] = index;
	exports.upload = upload;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
