var flashcards;
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 386:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * [js-md5]{@link https://github.com/emn178/js-md5}
 *
 * @namespace md5
 * @version 0.7.3
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */
(function () {
  'use strict';

  var ERROR = 'input is invalid type';
  var WINDOW = typeof window === 'object';
  var root = WINDOW ? window : {};
  if (root.JS_MD5_NO_WINDOW) {
    WINDOW = false;
  }
  var WEB_WORKER = !WINDOW && typeof self === 'object';
  var NODE_JS = !root.JS_MD5_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = __webpack_require__.g;
  } else if (WEB_WORKER) {
    root = self;
  }
  var COMMON_JS = !root.JS_MD5_NO_COMMON_JS && "object" === 'object' && module.exports;
  var AMD =  true && __webpack_require__.amdO;
  var ARRAY_BUFFER = !root.JS_MD5_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [128, 32768, 8388608, -2147483648];
  var SHIFT = [0, 8, 16, 24];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'buffer', 'arrayBuffer', 'base64'];
  var BASE64_ENCODE_CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

  var blocks = [], buffer8;
  if (ARRAY_BUFFER) {
    var buffer = new ArrayBuffer(68);
    buffer8 = new Uint8Array(buffer);
    blocks = new Uint32Array(buffer);
  }

  if (root.JS_MD5_NO_NODE_JS || !Array.isArray) {
    Array.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  if (ARRAY_BUFFER && (root.JS_MD5_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    ArrayBuffer.isView = function (obj) {
      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    };
  }

  /**
   * @method hex
   * @memberof md5
   * @description Output hash as hex string
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {String} Hex string
   * @example
   * md5.hex('The quick brown fox jumps over the lazy dog');
   * // equal to
   * md5('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method digest
   * @memberof md5
   * @description Output hash as bytes array
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Array} Bytes array
   * @example
   * md5.digest('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method array
   * @memberof md5
   * @description Output hash as bytes array
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Array} Bytes array
   * @example
   * md5.array('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method arrayBuffer
   * @memberof md5
   * @description Output hash as ArrayBuffer
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {ArrayBuffer} ArrayBuffer
   * @example
   * md5.arrayBuffer('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method buffer
   * @deprecated This maybe confuse with Buffer in node.js. Please use arrayBuffer instead.
   * @memberof md5
   * @description Output hash as ArrayBuffer
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {ArrayBuffer} ArrayBuffer
   * @example
   * md5.buffer('The quick brown fox jumps over the lazy dog');
   */
  /**
   * @method base64
   * @memberof md5
   * @description Output hash as base64 string
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {String} base64 string
   * @example
   * md5.base64('The quick brown fox jumps over the lazy dog');
   */
  var createOutputMethod = function (outputType) {
    return function (message) {
      return new Md5(true).update(message)[outputType]();
    };
  };

  /**
   * @method create
   * @memberof md5
   * @description Create Md5 object
   * @returns {Md5} Md5 object.
   * @example
   * var hash = md5.create();
   */
  /**
   * @method update
   * @memberof md5
   * @description Create and update Md5 object
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Md5} Md5 object.
   * @example
   * var hash = md5.update('The quick brown fox jumps over the lazy dog');
   * // equal to
   * var hash = md5.create();
   * hash.update('The quick brown fox jumps over the lazy dog');
   */
  var createMethod = function () {
    var method = createOutputMethod('hex');
    if (NODE_JS) {
      method = nodeWrap(method);
    }
    method.create = function () {
      return new Md5();
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type);
    }
    return method;
  };

  var nodeWrap = function (method) {
    var crypto = eval("require('crypto')");
    var Buffer = eval("require('buffer').Buffer");
    var nodeMethod = function (message) {
      if (typeof message === 'string') {
        return crypto.createHash('md5').update(message, 'utf8').digest('hex');
      } else {
        if (message === null || message === undefined) {
          throw ERROR;
        } else if (message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        }
      }
      if (Array.isArray(message) || ArrayBuffer.isView(message) ||
        message.constructor === Buffer) {
        return crypto.createHash('md5').update(new Buffer(message)).digest('hex');
      } else {
        return method(message);
      }
    };
    return nodeMethod;
  };

  /**
   * Md5 class
   * @class Md5
   * @description This is internal class.
   * @see {@link md5.create}
   */
  function Md5(sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
      this.buffer8 = buffer8;
    } else {
      if (ARRAY_BUFFER) {
        var buffer = new ArrayBuffer(68);
        this.buffer8 = new Uint8Array(buffer);
        this.blocks = new Uint32Array(buffer);
      } else {
        this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
    }
    this.h0 = this.h1 = this.h2 = this.h3 = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
  }

  /**
   * @method update
   * @memberof Md5
   * @instance
   * @description Update hash
   * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
   * @returns {Md5} Md5 object.
   * @see {@link md5.update}
   */
  Md5.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }

    var notString, type = typeof message;
    if (type !== 'string') {
      if (type === 'object') {
        if (message === null) {
          throw ERROR;
        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        } else if (!Array.isArray(message)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
            throw ERROR;
          }
        }
      } else {
        throw ERROR;
      }
      notString = true;
    }
    var code, index = 0, i, length = message.length, blocks = this.blocks;
    var buffer8 = this.buffer8;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = blocks[16];
        blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if (notString) {
        if (ARRAY_BUFFER) {
          for (i = this.start; index < length && i < 64; ++index) {
            buffer8[i++] = message[index];
          }
        } else {
          for (i = this.start; index < length && i < 64; ++index) {
            blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
          }
        }
      } else {
        if (ARRAY_BUFFER) {
          for (i = this.start; index < length && i < 64; ++index) {
            code = message.charCodeAt(index);
            if (code < 0x80) {
              buffer8[i++] = code;
            } else if (code < 0x800) {
              buffer8[i++] = 0xc0 | (code >> 6);
              buffer8[i++] = 0x80 | (code & 0x3f);
            } else if (code < 0xd800 || code >= 0xe000) {
              buffer8[i++] = 0xe0 | (code >> 12);
              buffer8[i++] = 0x80 | ((code >> 6) & 0x3f);
              buffer8[i++] = 0x80 | (code & 0x3f);
            } else {
              code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
              buffer8[i++] = 0xf0 | (code >> 18);
              buffer8[i++] = 0x80 | ((code >> 12) & 0x3f);
              buffer8[i++] = 0x80 | ((code >> 6) & 0x3f);
              buffer8[i++] = 0x80 | (code & 0x3f);
            }
          }
        } else {
          for (i = this.start; index < length && i < 64; ++index) {
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
      }
      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Md5.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex;
    blocks[i >> 2] |= EXTRA[i & 3];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = blocks[16];
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = this.bytes << 3;
    blocks[15] = this.hBytes << 3 | this.bytes >>> 29;
    this.hash();
  };

  Md5.prototype.hash = function () {
    var a, b, c, d, bc, da, blocks = this.blocks;

    if (this.first) {
      a = blocks[0] - 680876937;
      a = (a << 7 | a >>> 25) - 271733879 << 0;
      d = (-1732584194 ^ a & 2004318071) + blocks[1] - 117830708;
      d = (d << 12 | d >>> 20) + a << 0;
      c = (-271733879 ^ (d & (a ^ -271733879))) + blocks[2] - 1126478375;
      c = (c << 17 | c >>> 15) + d << 0;
      b = (a ^ (c & (d ^ a))) + blocks[3] - 1316259209;
      b = (b << 22 | b >>> 10) + c << 0;
    } else {
      a = this.h0;
      b = this.h1;
      c = this.h2;
      d = this.h3;
      a += (d ^ (b & (c ^ d))) + blocks[0] - 680876936;
      a = (a << 7 | a >>> 25) + b << 0;
      d += (c ^ (a & (b ^ c))) + blocks[1] - 389564586;
      d = (d << 12 | d >>> 20) + a << 0;
      c += (b ^ (d & (a ^ b))) + blocks[2] + 606105819;
      c = (c << 17 | c >>> 15) + d << 0;
      b += (a ^ (c & (d ^ a))) + blocks[3] - 1044525330;
      b = (b << 22 | b >>> 10) + c << 0;
    }

    a += (d ^ (b & (c ^ d))) + blocks[4] - 176418897;
    a = (a << 7 | a >>> 25) + b << 0;
    d += (c ^ (a & (b ^ c))) + blocks[5] + 1200080426;
    d = (d << 12 | d >>> 20) + a << 0;
    c += (b ^ (d & (a ^ b))) + blocks[6] - 1473231341;
    c = (c << 17 | c >>> 15) + d << 0;
    b += (a ^ (c & (d ^ a))) + blocks[7] - 45705983;
    b = (b << 22 | b >>> 10) + c << 0;
    a += (d ^ (b & (c ^ d))) + blocks[8] + 1770035416;
    a = (a << 7 | a >>> 25) + b << 0;
    d += (c ^ (a & (b ^ c))) + blocks[9] - 1958414417;
    d = (d << 12 | d >>> 20) + a << 0;
    c += (b ^ (d & (a ^ b))) + blocks[10] - 42063;
    c = (c << 17 | c >>> 15) + d << 0;
    b += (a ^ (c & (d ^ a))) + blocks[11] - 1990404162;
    b = (b << 22 | b >>> 10) + c << 0;
    a += (d ^ (b & (c ^ d))) + blocks[12] + 1804603682;
    a = (a << 7 | a >>> 25) + b << 0;
    d += (c ^ (a & (b ^ c))) + blocks[13] - 40341101;
    d = (d << 12 | d >>> 20) + a << 0;
    c += (b ^ (d & (a ^ b))) + blocks[14] - 1502002290;
    c = (c << 17 | c >>> 15) + d << 0;
    b += (a ^ (c & (d ^ a))) + blocks[15] + 1236535329;
    b = (b << 22 | b >>> 10) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[1] - 165796510;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[6] - 1069501632;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[11] + 643717713;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[0] - 373897302;
    b = (b << 20 | b >>> 12) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[5] - 701558691;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[10] + 38016083;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[15] - 660478335;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[4] - 405537848;
    b = (b << 20 | b >>> 12) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[9] + 568446438;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[14] - 1019803690;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[3] - 187363961;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[8] + 1163531501;
    b = (b << 20 | b >>> 12) + c << 0;
    a += (c ^ (d & (b ^ c))) + blocks[13] - 1444681467;
    a = (a << 5 | a >>> 27) + b << 0;
    d += (b ^ (c & (a ^ b))) + blocks[2] - 51403784;
    d = (d << 9 | d >>> 23) + a << 0;
    c += (a ^ (b & (d ^ a))) + blocks[7] + 1735328473;
    c = (c << 14 | c >>> 18) + d << 0;
    b += (d ^ (a & (c ^ d))) + blocks[12] - 1926607734;
    b = (b << 20 | b >>> 12) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[5] - 378558;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[8] - 2022574463;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[11] + 1839030562;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[14] - 35309556;
    b = (b << 23 | b >>> 9) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[1] - 1530992060;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[4] + 1272893353;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[7] - 155497632;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[10] - 1094730640;
    b = (b << 23 | b >>> 9) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[13] + 681279174;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[0] - 358537222;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[3] - 722521979;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[6] + 76029189;
    b = (b << 23 | b >>> 9) + c << 0;
    bc = b ^ c;
    a += (bc ^ d) + blocks[9] - 640364487;
    a = (a << 4 | a >>> 28) + b << 0;
    d += (bc ^ a) + blocks[12] - 421815835;
    d = (d << 11 | d >>> 21) + a << 0;
    da = d ^ a;
    c += (da ^ b) + blocks[15] + 530742520;
    c = (c << 16 | c >>> 16) + d << 0;
    b += (da ^ c) + blocks[2] - 995338651;
    b = (b << 23 | b >>> 9) + c << 0;
    a += (c ^ (b | ~d)) + blocks[0] - 198630844;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[7] + 1126891415;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[14] - 1416354905;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[5] - 57434055;
    b = (b << 21 | b >>> 11) + c << 0;
    a += (c ^ (b | ~d)) + blocks[12] + 1700485571;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[3] - 1894986606;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[10] - 1051523;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[1] - 2054922799;
    b = (b << 21 | b >>> 11) + c << 0;
    a += (c ^ (b | ~d)) + blocks[8] + 1873313359;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[15] - 30611744;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[6] - 1560198380;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[13] + 1309151649;
    b = (b << 21 | b >>> 11) + c << 0;
    a += (c ^ (b | ~d)) + blocks[4] - 145523070;
    a = (a << 6 | a >>> 26) + b << 0;
    d += (b ^ (a | ~c)) + blocks[11] - 1120210379;
    d = (d << 10 | d >>> 22) + a << 0;
    c += (a ^ (d | ~b)) + blocks[2] + 718787259;
    c = (c << 15 | c >>> 17) + d << 0;
    b += (d ^ (c | ~a)) + blocks[9] - 343485551;
    b = (b << 21 | b >>> 11) + c << 0;

    if (this.first) {
      this.h0 = a + 1732584193 << 0;
      this.h1 = b - 271733879 << 0;
      this.h2 = c - 1732584194 << 0;
      this.h3 = d + 271733878 << 0;
      this.first = false;
    } else {
      this.h0 = this.h0 + a << 0;
      this.h1 = this.h1 + b << 0;
      this.h2 = this.h2 + c << 0;
      this.h3 = this.h3 + d << 0;
    }
  };

  /**
   * @method hex
   * @memberof Md5
   * @instance
   * @description Output hash as hex string
   * @returns {String} Hex string
   * @see {@link md5.hex}
   * @example
   * hash.hex();
   */
  Md5.prototype.hex = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3;

    return HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
      HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
      HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
      HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
      HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
      HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
      HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
      HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
      HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
      HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
      HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
      HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
      HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
      HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
      HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
      HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F];
  };

  /**
   * @method toString
   * @memberof Md5
   * @instance
   * @description Output hash as hex string
   * @returns {String} Hex string
   * @see {@link md5.hex}
   * @example
   * hash.toString();
   */
  Md5.prototype.toString = Md5.prototype.hex;

  /**
   * @method digest
   * @memberof Md5
   * @instance
   * @description Output hash as bytes array
   * @returns {Array} Bytes array
   * @see {@link md5.digest}
   * @example
   * hash.digest();
   */
  Md5.prototype.digest = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3;
    return [
      h0 & 0xFF, (h0 >> 8) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 24) & 0xFF,
      h1 & 0xFF, (h1 >> 8) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 24) & 0xFF,
      h2 & 0xFF, (h2 >> 8) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 24) & 0xFF,
      h3 & 0xFF, (h3 >> 8) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 24) & 0xFF
    ];
  };

  /**
   * @method array
   * @memberof Md5
   * @instance
   * @description Output hash as bytes array
   * @returns {Array} Bytes array
   * @see {@link md5.array}
   * @example
   * hash.array();
   */
  Md5.prototype.array = Md5.prototype.digest;

  /**
   * @method arrayBuffer
   * @memberof Md5
   * @instance
   * @description Output hash as ArrayBuffer
   * @returns {ArrayBuffer} ArrayBuffer
   * @see {@link md5.arrayBuffer}
   * @example
   * hash.arrayBuffer();
   */
  Md5.prototype.arrayBuffer = function () {
    this.finalize();

    var buffer = new ArrayBuffer(16);
    var blocks = new Uint32Array(buffer);
    blocks[0] = this.h0;
    blocks[1] = this.h1;
    blocks[2] = this.h2;
    blocks[3] = this.h3;
    return buffer;
  };

  /**
   * @method buffer
   * @deprecated This maybe confuse with Buffer in node.js. Please use arrayBuffer instead.
   * @memberof Md5
   * @instance
   * @description Output hash as ArrayBuffer
   * @returns {ArrayBuffer} ArrayBuffer
   * @see {@link md5.buffer}
   * @example
   * hash.buffer();
   */
  Md5.prototype.buffer = Md5.prototype.arrayBuffer;

  /**
   * @method base64
   * @memberof Md5
   * @instance
   * @description Output hash as base64 string
   * @returns {String} base64 string
   * @see {@link md5.base64}
   * @example
   * hash.base64();
   */
  Md5.prototype.base64 = function () {
    var v1, v2, v3, base64Str = '', bytes = this.array();
    for (var i = 0; i < 15;) {
      v1 = bytes[i++];
      v2 = bytes[i++];
      v3 = bytes[i++];
      base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] +
        BASE64_ENCODE_CHAR[(v1 << 4 | v2 >>> 4) & 63] +
        BASE64_ENCODE_CHAR[(v2 << 2 | v3 >>> 6) & 63] +
        BASE64_ENCODE_CHAR[v3 & 63];
    }
    v1 = bytes[i];
    base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] +
      BASE64_ENCODE_CHAR[(v1 << 4) & 63] +
      '==';
    return base64Str;
  };

  var exports = createMethod();

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    /**
     * @method md5
     * @description Md5 hash function, export to global in browsers.
     * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
     * @returns {String} md5 hashes
     * @example
     * md5(''); // d41d8cd98f00b204e9800998ecf8427e
     * md5('The quick brown fox jumps over the lazy dog'); // 9e107d9d372bb6826bd81d3542a419d6
     * md5('The quick brown fox jumps over the lazy dog.'); // e4d909c290d0fb1ca068ffaddf22cbd0
     *
     * // It also supports UTF-8 encoding
     * md5('中文'); // a7bac2239fcdcb3a067903d8077c4a07
     *
     * // It also supports byte `Array`, `Uint8Array`, `ArrayBuffer`
     * md5([]); // d41d8cd98f00b204e9800998ecf8427e
     * md5(new Uint8Array([])); // d41d8cd98f00b204e9800998ecf8427e
     */
    root.md5 = exports;
    if (AMD) {
      !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
        return exports;
      }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
  }
})();


/***/ }),

/***/ 668:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;/*
 * [js-sha1]{@link https://github.com/emn178/js-sha1}
 *
 * @version 0.6.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */
/*jslint bitwise: true */
(function() {
  'use strict';

  var root = typeof window === 'object' ? window : {};
  var NODE_JS = !root.JS_SHA1_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = __webpack_require__.g;
  }
  var COMMON_JS = !root.JS_SHA1_NO_COMMON_JS && "object" === 'object' && module.exports;
  var AMD =  true && __webpack_require__.amdO;
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];

  var blocks = [];

  var createOutputMethod = function (outputType) {
    return function (message) {
      return new Sha1(true).update(message)[outputType]();
    };
  };

  var createMethod = function () {
    var method = createOutputMethod('hex');
    if (NODE_JS) {
      method = nodeWrap(method);
    }
    method.create = function () {
      return new Sha1();
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type);
    }
    return method;
  };

  var nodeWrap = function (method) {
    var crypto = eval("require('crypto')");
    var Buffer = eval("require('buffer').Buffer");
    var nodeMethod = function (message) {
      if (typeof message === 'string') {
        return crypto.createHash('sha1').update(message, 'utf8').digest('hex');
      } else if (message.constructor === ArrayBuffer) {
        message = new Uint8Array(message);
      } else if (message.length === undefined) {
        return method(message);
      }
      return crypto.createHash('sha1').update(new Buffer(message)).digest('hex');
    };
    return nodeMethod;
  };

  function Sha1(sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
    } else {
      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    this.h0 = 0x67452301;
    this.h1 = 0xEFCDAB89;
    this.h2 = 0x98BADCFE;
    this.h3 = 0x10325476;
    this.h4 = 0xC3D2E1F0;

    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
  }

  Sha1.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }
    var notString = typeof(message) !== 'string';
    if (notString && message.constructor === root.ArrayBuffer) {
      message = new Uint8Array(message);
    }
    var code, index = 0, i, length = message.length || 0, blocks = this.blocks;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if(notString) {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
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
      this.bytes += i - this.start;
      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Sha1.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >> 2] |= EXTRA[i & 3];
    this.block = blocks[16];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha1.prototype.hash = function () {
    var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4;
    var f, j, t, blocks = this.blocks;

    for(j = 16; j < 80; ++j) {
      t = blocks[j - 3] ^ blocks[j - 8] ^ blocks[j - 14] ^ blocks[j - 16];
      blocks[j] =  (t << 1) | (t >>> 31);
    }

    for(j = 0; j < 20; j += 5) {
      f = (b & c) | ((~b) & d);
      t = (a << 5) | (a >>> 27);
      e = t + f + e + 1518500249 + blocks[j] << 0;
      b = (b << 30) | (b >>> 2);

      f = (a & b) | ((~a) & c);
      t = (e << 5) | (e >>> 27);
      d = t + f + d + 1518500249 + blocks[j + 1] << 0;
      a = (a << 30) | (a >>> 2);

      f = (e & a) | ((~e) & b);
      t = (d << 5) | (d >>> 27);
      c = t + f + c + 1518500249 + blocks[j + 2] << 0;
      e = (e << 30) | (e >>> 2);

      f = (d & e) | ((~d) & a);
      t = (c << 5) | (c >>> 27);
      b = t + f + b + 1518500249 + blocks[j + 3] << 0;
      d = (d << 30) | (d >>> 2);

      f = (c & d) | ((~c) & e);
      t = (b << 5) | (b >>> 27);
      a = t + f + a + 1518500249 + blocks[j + 4] << 0;
      c = (c << 30) | (c >>> 2);
    }

    for(; j < 40; j += 5) {
      f = b ^ c ^ d;
      t = (a << 5) | (a >>> 27);
      e = t + f + e + 1859775393 + blocks[j] << 0;
      b = (b << 30) | (b >>> 2);

      f = a ^ b ^ c;
      t = (e << 5) | (e >>> 27);
      d = t + f + d + 1859775393 + blocks[j + 1] << 0;
      a = (a << 30) | (a >>> 2);

      f = e ^ a ^ b;
      t = (d << 5) | (d >>> 27);
      c = t + f + c + 1859775393 + blocks[j + 2] << 0;
      e = (e << 30) | (e >>> 2);

      f = d ^ e ^ a;
      t = (c << 5) | (c >>> 27);
      b = t + f + b + 1859775393 + blocks[j + 3] << 0;
      d = (d << 30) | (d >>> 2);

      f = c ^ d ^ e;
      t = (b << 5) | (b >>> 27);
      a = t + f + a + 1859775393 + blocks[j + 4] << 0;
      c = (c << 30) | (c >>> 2);
    }

    for(; j < 60; j += 5) {
      f = (b & c) | (b & d) | (c & d);
      t = (a << 5) | (a >>> 27);
      e = t + f + e - 1894007588 + blocks[j] << 0;
      b = (b << 30) | (b >>> 2);

      f = (a & b) | (a & c) | (b & c);
      t = (e << 5) | (e >>> 27);
      d = t + f + d - 1894007588 + blocks[j + 1] << 0;
      a = (a << 30) | (a >>> 2);

      f = (e & a) | (e & b) | (a & b);
      t = (d << 5) | (d >>> 27);
      c = t + f + c - 1894007588 + blocks[j + 2] << 0;
      e = (e << 30) | (e >>> 2);

      f = (d & e) | (d & a) | (e & a);
      t = (c << 5) | (c >>> 27);
      b = t + f + b - 1894007588 + blocks[j + 3] << 0;
      d = (d << 30) | (d >>> 2);

      f = (c & d) | (c & e) | (d & e);
      t = (b << 5) | (b >>> 27);
      a = t + f + a - 1894007588 + blocks[j + 4] << 0;
      c = (c << 30) | (c >>> 2);
    }

    for(; j < 80; j += 5) {
      f = b ^ c ^ d;
      t = (a << 5) | (a >>> 27);
      e = t + f + e - 899497514 + blocks[j] << 0;
      b = (b << 30) | (b >>> 2);

      f = a ^ b ^ c;
      t = (e << 5) | (e >>> 27);
      d = t + f + d - 899497514 + blocks[j + 1] << 0;
      a = (a << 30) | (a >>> 2);

      f = e ^ a ^ b;
      t = (d << 5) | (d >>> 27);
      c = t + f + c - 899497514 + blocks[j + 2] << 0;
      e = (e << 30) | (e >>> 2);

      f = d ^ e ^ a;
      t = (c << 5) | (c >>> 27);
      b = t + f + b - 899497514 + blocks[j + 3] << 0;
      d = (d << 30) | (d >>> 2);

      f = c ^ d ^ e;
      t = (b << 5) | (b >>> 27);
      a = t + f + a - 899497514 + blocks[j + 4] << 0;
      c = (c << 30) | (c >>> 2);
    }

    this.h0 = this.h0 + a << 0;
    this.h1 = this.h1 + b << 0;
    this.h2 = this.h2 + c << 0;
    this.h3 = this.h3 + d << 0;
    this.h4 = this.h4 + e << 0;
  };

  Sha1.prototype.hex = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4;

    return HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
           HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
           HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
           HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
           HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
           HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
           HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
           HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
           HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
           HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
           HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
           HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
           HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
           HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
           HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
           HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
           HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
           HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
           HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
           HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F];
  };

  Sha1.prototype.toString = Sha1.prototype.hex;

  Sha1.prototype.digest = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4;

    return [
      (h0 >> 24) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 8) & 0xFF, h0 & 0xFF,
      (h1 >> 24) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 8) & 0xFF, h1 & 0xFF,
      (h2 >> 24) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 8) & 0xFF, h2 & 0xFF,
      (h3 >> 24) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 8) & 0xFF, h3 & 0xFF,
      (h4 >> 24) & 0xFF, (h4 >> 16) & 0xFF, (h4 >> 8) & 0xFF, h4 & 0xFF
    ];
  };

  Sha1.prototype.array = Sha1.prototype.digest;

  Sha1.prototype.arrayBuffer = function () {
    this.finalize();

    var buffer = new ArrayBuffer(20);
    var dataView = new DataView(buffer);
    dataView.setUint32(0, this.h0);
    dataView.setUint32(4, this.h1);
    dataView.setUint32(8, this.h2);
    dataView.setUint32(12, this.h3);
    dataView.setUint32(16, this.h4);
    return buffer;
  };

  var exports = createMethod();

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    root.sha1 = exports;
    if (AMD) {
      !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
        return exports;
      }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
  }
})();


/***/ }),

/***/ 193:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const flashcard_1 = __webpack_require__(88);
const flashcard_template_1 = __webpack_require__(791);
class BasicFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "basic-template"; }
    render(data) {
        var a = document.createElement("div");
        a.textContent = data[0];
        var fontSize = 100.0 / (10.0 * Math.log(10 + data[0].length));
        var fl = new flashcard_1.Flashcard(a, data[1]);
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new BasicFlashcardTemplate());


/***/ }),

/***/ 994:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils_1 = __webpack_require__(185);
const flashcard_generator_1 = __webpack_require__(808);
const flashcard_sync_generator_1 = __webpack_require__(410);
const flashcard_template_1 = __webpack_require__(791);
const editor_1 = __webpack_require__(43);
const flashcard_deck_1 = __webpack_require__(836);
class ClozeFlashcardGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() { return "cloze-puzzles"; }
    getNextCard(state) {
        var cardIsOk = (c) => !(state.settings.blacklist.includes(c.guid));
        var validKeys = Object.keys(state.cards).filter((k) => state.cards[k].cards.some(cardIsOk));
        var key = validKeys[Math.floor(Math.random() * validKeys.length)];
        var group = state.cards[key].cards.filter(cardIsOk);
        return group[Math.floor(Math.random() * group.length)];
    }
    updateState(state, cardData, result) {
        if (result == flashcard_generator_1.FlashcardResult.Correct) {
            state.cards[cardData.group].correct += 1;
        }
        else if (result == flashcard_generator_1.FlashcardResult.Incorrect) {
            state.cards[cardData.group].incorrect += 1;
        }
        else {
            state.cards[cardData.group].skipped += 1;
            if (state.settings.blacklistSkipped) {
                state.settings.blacklist.push(cardData.guid);
            }
        }
        return state;
    }
    checkAnswer(ans, st, cardData) {
        var targetWords = [];
        cardData.upper.replaceAll(/\{\{([^\{\}]+)\}\}/g, (match, p1) => {
            targetWords.push(p1);
            return match;
        });
        var correctAns = targetWords.join(", ");
        return (ans == correctAns);
    }
    generateCard(st, data) {
        return (0, flashcard_template_1.renderCard)("cloze-template", data);
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    repairDeckState(st) { return st; }
}
function makeClozeCard(group, top, bottom) {
    return {
        group: group,
        guid: (0, utils_1.getUuid)(`${top} | ${bottom}`, 5),
        upper: top,
        lower: bottom
    };
}
function makeClozeEditor(state) {
    var container = document.createElement("div");
    var blacklistEditor = (0, editor_1.boolEditor)("Permanently remove skipped cards?", state.settings.blacklistSkipped);
    blacklistEditor.element.classList.add("deck-menu-submenu");
    var summaryContainer = document.createElement("div");
    summaryContainer.classList.add("deck-menu-submenu");
    var loadCards = (s) => {
        if (s.length > 0) {
            var newCardDict = {};
            var infoList = JSON.parse(s);
            console.log(infoList);
            for (var i in Object.keys(infoList)) {
                var k = Object.keys(infoList)[i];
                newCardDict[k] = {
                    key: k,
                    cards: infoList[k].map((c) => {
                        return {
                            upper: c["prompt"],
                            lower: c["translation"],
                            guid: (0, utils_1.guidGenerator)(),
                            group: k
                        };
                    }),
                    correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                    incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0,
                    skipped: Object.keys(state.cards).includes(k) ? state.cards[k].skipped : 0
                };
            }
            state.cards = newCardDict;
        }
    };
    var deckSummary = document.createElement("div");
    var makeDeckSummary = () => {
        deckSummary.innerHTML = "";
        var keys = Object.keys(state.cards).sort();
        for (var i in keys) {
            var k = keys[i];
            var entryDiv = document.createElement("div");
            entryDiv.classList.add("deck-editor-info-entry");
            var entryKey = document.createElement("span");
            entryKey.textContent = k;
            var entryInfo = document.createElement("span");
            entryInfo.textContent = `${state.cards[k].cards.length} puzzles`;
            entryInfo.style.float = "right";
            entryDiv.appendChild(entryKey);
            entryDiv.appendChild(entryInfo);
            deckSummary.appendChild(entryDiv);
        }
    };
    makeDeckSummary();
    var fileEd = (0, editor_1.fileUploadEditor)("Upload cloze puzzles", (s) => {
        loadCards(s);
        makeDeckSummary();
    });
    summaryContainer.appendChild(fileEd.element);
    summaryContainer.appendChild(deckSummary);
    container.appendChild(blacklistEditor.element);
    container.appendChild(summaryContainer);
    return {
        element: container,
        menuToState: () => {
            var deckStr = fileEd.menuToState();
            if (deckStr.length > 0) {
                var newCardDict = {};
                var infoList = JSON.parse(deckStr);
                console.log(infoList);
                for (var i in Object.keys(infoList)) {
                    var k = Object.keys(infoList)[i];
                    newCardDict[k] = {
                        key: k,
                        cards: infoList[k].map((c) => makeClozeCard(k, c["prompt"], c["translation"])),
                        correct: Object.keys(state.cards).includes(k) ? state.cards[k].correct : 0,
                        incorrect: Object.keys(state.cards).includes(k) ? state.cards[k].incorrect : 0,
                        skipped: Object.keys(state.cards).includes(k) ? state.cards[k].skipped : 0
                    };
                }
                state.cards = newCardDict;
            }
            state.settings.blacklistSkipped = blacklistEditor.menuToState();
            return state;
        }
    };
}
var clozeDefaultState = {
    cards: {
        "gehen": {
            key: "gehen",
            cards: [
                makeClozeCard("gehen", "Ich {{gehe}} ins Kino.", "I go to the movies."),
                makeClozeCard("gehen", "Wohin {{gehst}} du?", "Where are you going?")
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        },
        "haben": {
            key: "haben",
            cards: [
                makeClozeCard("haben", "Ich {{habe}} einen Hund.", "I have a dog."),
                makeClozeCard("haben", "{{Hast}} du einen Hund?", "Do you have a dog?")
            ],
            correct: 0,
            incorrect: 0,
            skipped: 0
        }
    },
    settings: {
        blacklist: [],
        blacklistSkipped: true
    }
};
(0, flashcard_deck_1.registerDeckType)(new ClozeFlashcardGen(), makeClozeEditor, "cloze-quizzer", "Simple German cloze quizzer", clozeDefaultState, "#ffddbb");


/***/ }),

/***/ 292:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const flashcard_1 = __webpack_require__(88);
const flashcard_template_1 = __webpack_require__(791);
class ClozeFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "cloze-template"; }
    render(data) {
        var el = document.createElement("div");
        el.style.display = "block";
        el.style.textAlign = "center";
        var aUpper = document.createElement("p");
        var aLower = document.createElement("p");
        aUpper.style.display = "block";
        aLower.style.display = "block";
        el.appendChild(aUpper);
        el.appendChild(document.createElement("hr"));
        el.appendChild(aLower);
        var targetWords = [];
        aUpper.textContent = data.upper.replaceAll(/\{\{([^\{\}]+)\}\}/g, (match, p1) => {
            targetWords.push(p1);
            return "___";
        });
        var answer = targetWords.join(", ");
        aLower.textContent = data.lower;
        var fontSize = 900.0 / (10.0 * Math.log(10 + aUpper.textContent.length));
        aUpper.style.fontSize = `${fontSize}px`;
        aLower.style.fontSize = `${0.7 * fontSize}px`;
        var fl = new flashcard_1.Flashcard(el, answer);
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new ClozeFlashcardTemplate());


/***/ }),

/***/ 79:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateDecklistMenu = generateDecklistMenu;
exports.setupDecklistMenu = setupDecklistMenu;
const utils_1 = __webpack_require__(185);
const flashcard_deck_1 = __webpack_require__(836);
const editor_1 = __webpack_require__(43);
const synchronization_1 = __webpack_require__(36);
function generateDeckNameEditor(deck) {
    var nicknameEditor = (0, editor_1.singleTextFieldEditor)(deck.name);
    var colorEditor = (0, editor_1.singleTextFieldEditor)(deck.view.color);
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Save";
    var deckIdA = document.createElement("A");
    deckIdA.textContent = `Internal deck ID: ${deck.slug}`;
    var contDiv = document.createElement("div");
    [
        nicknameEditor.element,
        colorEditor.element,
        closeBtn,
        document.createElement("br"),
        deckIdA
    ].map((el) => contDiv.appendChild(el));
    contDiv.onclick = (e) => {
        e.cancelBubble = true;
        if (e.stopPropagation)
            e.stopPropagation();
    };
    var ed = {
        element: contDiv,
        menuToState: () => {
            deck.name = nicknameEditor.menuToState();
            deck.view.color = colorEditor.menuToState();
            contDiv.remove();
            return deck;
        }
    };
    return ed;
}
function generateDecklistMenu(decklist, onfinish) {
    var decklistEditor = document.getElementById("flashcard-decklist-editor");
    decklistEditor.innerHTML = "";
    var decklistOverlay = document.getElementById("flashcard-decklist-overlay");
    var syncServerBtn = document.createElement("button");
    syncServerBtn.textContent = "Setup sync server";
    syncServerBtn.onclick = synchronization_1.promptForSyncCreds;
    decklistEditor.appendChild(syncServerBtn);
    var addRemoteBtn = document.createElement("button");
    addRemoteBtn.textContent = "Add external deck";
    addRemoteBtn.onclick = (e) => {
        var deckslug = prompt("Enter the ID of the deck you would like to download.") || "";
        (0, synchronization_1.syncDownloadDeck)(deckslug, (s) => {
            console.log(s);
            (0, flashcard_deck_1.setDeck)(deckslug, s, () => {
                generateDecklistMenu(decklist, onfinish);
            });
        });
    };
    decklistEditor.appendChild(addRemoteBtn);
    Object.keys(decklist).sort();
    for (var k in decklist) {
        var deckDiv = document.createElement("div");
        var slug = decklist[k].slug;
        var deckLabel = document.createElement("a");
        deckLabel.textContent = decklist[k].name;
        deckDiv.appendChild(deckLabel);
        deckDiv.classList.add("deck-editor-entry");
        if (decklist[k].view !== undefined) {
            deckDiv.style.backgroundColor = decklist[k].view.color;
        }
        deckDiv.onclick = ((s) => (e) => {
            decklistOverlay.style.display = "none";
            onfinish(decklist);
            (0, flashcard_deck_1.saveDeck)(s, () => (0, flashcard_deck_1.runDeck)(s));
        })(slug);
        var deckEditBtn = document.createElement("button");
        deckEditBtn.title = "Edit deck";
        deckEditBtn.innerHTML = "<img src='edit.png'/>";
        deckEditBtn.classList.add("deck-editor-button");
        deckEditBtn.onclick = ((dk, deckDiv) => (e) => {
            var ed = generateDeckNameEditor(dk);
            var closeBtn = ed.element.getElementsByTagName("button")[0];
            closeBtn.onclick = (e) => {
                var newDeck = ed.menuToState();
                decklist[dk.slug] = newDeck;
                (0, flashcard_deck_1.saveDeck)(dk.slug, () => { });
                generateDecklistMenu(decklist, onfinish);
            };
            deckDiv.replaceChildren(ed.element);
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
        })(decklist[k], deckDiv);
        var deckDeleteBtn = document.createElement("button");
        deckDeleteBtn.title = "Delete deck";
        deckDeleteBtn.classList.add("deck-editor-button");
        deckDeleteBtn.innerHTML = "<img src='trash.png'/>";
        deckDeleteBtn.onclick = ((dk) => (e) => {
            var confirmation = confirm(`Are you sure you want to delete "${dk.name}"?`);
            if (confirmation) {
                (0, flashcard_deck_1.eraseDeck)(dk.slug);
            }
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        var deckCloneBtn = document.createElement("button");
        deckCloneBtn.title = "Clone deck";
        deckCloneBtn.classList.add("deck-editor-button");
        deckCloneBtn.innerHTML = "<img src='copy.png'/>";
        deckCloneBtn.onclick = ((dk) => (e) => {
            var guid = (0, utils_1.guidGenerator)();
            var deckClone = JSON.parse(JSON.stringify(dk));
            deckClone.slug = guid;
            decklist[guid] = deckClone;
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
            generateDecklistMenu(decklist, onfinish);
        })(decklist[k]);
        var deckUploadBtn = document.createElement("button");
        deckUploadBtn.title = "Upload deck to server";
        deckUploadBtn.classList.add("deck-editor-button");
        deckUploadBtn.innerHTML = "<img src='upcloud.png'/>";
        deckUploadBtn.onclick = ((dk) => (e) => {
            (0, synchronization_1.syncUploadDeck)(dk);
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
        })(decklist[k]);
        var deckDownloadBtn = document.createElement("button");
        deckDownloadBtn.title = "Download deck from server";
        deckDownloadBtn.classList.add("deck-editor-button");
        deckDownloadBtn.innerHTML = "<img src='downcloud.png'/>";
        deckDownloadBtn.onclick = ((k) => (e) => {
            (0, synchronization_1.syncDownloadDeck)(k, (s) => { (0, flashcard_deck_1.setDeck)(k, s, () => { }); });
            e.cancelBubble = true;
            if (e.stopPropagation)
                e.stopPropagation();
        })(k);
        deckDiv.appendChild(deckUploadBtn);
        deckDiv.appendChild(deckDownloadBtn);
        deckDiv.appendChild(deckEditBtn);
        deckDiv.appendChild(deckDeleteBtn);
        deckDiv.appendChild(deckCloneBtn);
        decklistEditor.appendChild(deckDiv);
    }
}
function setupDecklistMenu() {
    var decksBtn = document.getElementById("deck-list-button");
    decksBtn.onclick = (e) => {
        var decklistOverlay = document.getElementById("flashcard-decklist-overlay");
        generateDecklistMenu(flashcard_deck_1.gDeckRegistry, (_) => { });
        decklistOverlay.style.display = "block";
    };
}


/***/ }),

/***/ 43:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.boolEditor = boolEditor;
exports.radioEditor = radioEditor;
exports.scrollNumberEditor = scrollNumberEditor;
exports.singleTextFieldEditor = singleTextFieldEditor;
exports.validatedTextFieldEditor = validatedTextFieldEditor;
exports.doubleTextFieldEditor = doubleTextFieldEditor;
exports.optionsEditor = optionsEditor;
exports.fileUploadEditor = fileUploadEditor;
exports.combineEditors = combineEditors;
exports.swappingTextEditor = swappingTextEditor;
exports.makeTranslationEditor = makeTranslationEditor;
exports.fixedNumEditors = fixedNumEditors;
exports.multipleEditors = multipleEditors;
const utils_1 = __webpack_require__(185);
/* Some useful state editors */
function boolEditor(label, val) {
    var checkbox = document.createElement("input");
    var editor = {
        element: null,
        menuToState: () => checkbox.checked
    };
    checkbox.type = "checkbox";
    checkbox.checked = val;
    var guid = (0, utils_1.guidGenerator)();
    checkbox.id = guid;
    var elementLabel = document.createElement("label");
    elementLabel.htmlFor = guid;
    elementLabel.textContent = label;
    var boxWithLabel = document.createElement("div");
    boxWithLabel.appendChild(checkbox);
    boxWithLabel.appendChild(elementLabel);
    editor.element = boxWithLabel;
    return editor;
}
function radioEditor(selected, options, labels) {
    var container = document.createElement("div");
    var radioName = (0, utils_1.guidGenerator)();
    var valueMap = {};
    var radios = [];
    for (var i in options) {
        var opt = options[i];
        var label = labels[i];
        var radioId = (0, utils_1.guidGenerator)();
        var radioBtn = document.createElement("input");
        radioBtn.type = "radio";
        radioBtn.id = radioId;
        radioBtn.name = radioName;
        var radioLabel = document.createElement("label");
        radioLabel.textContent = label;
        radioLabel.htmlFor = radioId;
        var radioDiv = document.createElement("div");
        radioDiv.appendChild(radioBtn);
        radioDiv.appendChild(radioLabel);
        container.appendChild(radioDiv);
        radioBtn.value = radioId;
        valueMap[radioId] = opt;
        radioBtn.checked = (opt == selected);
        radios.push(radioBtn);
    }
    return {
        element: container,
        menuToState: () => {
            for (var i in radios) {
                var r = radios[i];
                if (r.checked) {
                    return valueMap[r.value];
                }
            }
            return null;
        }
    };
}
function scrollNumberEditor(label, val, min, max, step) {
    var scroller = document.createElement("input");
    scroller.type = "number";
    scroller.max = max.toString();
    scroller.min = min.toString();
    scroller.value = val.toString();
    scroller.step = step.toString();
    var scrollerLabel = document.createElement("a");
    scrollerLabel.textContent = label;
    var scrollerCont = document.createElement("div");
    scrollerCont.appendChild(scrollerLabel);
    scrollerCont.appendChild(scroller);
    scrollerCont.style.display = "block";
    return {
        element: scrollerCont,
        menuToState: () => parseFloat(scroller.value)
    };
}
function singleTextFieldEditor(txt) {
    var editor = {
        element: document.createElement("input"),
        menuToState: () => editor.element.value
    };
    editor.element.value = txt;
    return editor;
}
function validatedTextFieldEditor(txt, pred = () => true) {
    var editor = singleTextFieldEditor(txt);
    editor.element.oninput = (e) => {
        if (!pred(editor.element.value)) {
            editor.element.style.backgroundColor = "#ffeeee";
        }
        else {
            editor.element.style.backgroundColor = "white";
        }
    };
    return editor;
}
function doubleTextFieldEditor(txts) {
    var children = [singleTextFieldEditor(txts[0]), singleTextFieldEditor(txts[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => children.map((c) => c.menuToState())
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
function optionsEditor(st, opts, labels) {
    var pickerEl = document.createElement("select");
    var optDict = {};
    for (var x of opts) {
        var optEl = document.createElement("option");
        var label = labels(x);
        optDict[label] = x;
        optEl.textContent = label;
        optEl.setAttribute("value", label);
        pickerEl.appendChild(optEl);
        if (label == labels(st)) {
            pickerEl.value = label;
        }
    }
    return {
        element: pickerEl,
        menuToState: () => optDict[pickerEl.selectedOptions[0].getAttribute("value")]
    };
}
function fileUploadEditor(label, callback) {
    var content = "";
    var container = document.createElement("div");
    var importBtn = document.createElement("button");
    importBtn.textContent = label;
    var fileUploadInput = document.createElement("input");
    fileUploadInput.type = "file";
    fileUploadInput.style.display = "none";
    container.appendChild(importBtn);
    container.appendChild(fileUploadInput);
    importBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = fileUploadInput.files;
            if (files == null)
                return;
            var file = files[0];
            if (file == null)
                return;
            var reader = new FileReader();
            reader.onload = (e) => {
                content = e.target.result;
                callback(content);
            };
            reader.readAsText(file, "UTF-8");
        };
    };
    return {
        element: container,
        menuToState: () => content
    };
}
function combineEditors(st, gen1, gen2) {
    var children = [gen1(st[0]), gen2(st[1])];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => [children[0].menuToState(), children[1].menuToState()]
    };
    editor.element.appendChild(children[0].element);
    editor.element.appendChild(children[1].element);
    return editor;
}
function swappingTextEditor(spr) {
    var ed1 = singleTextFieldEditor(spr[0]);
    var ed2 = singleTextFieldEditor(spr[1]);
    var container = document.createElement("div");
    var btn = document.createElement("button");
    btn.onclick = () => {
        var tmp = ed1.element.value;
        ed1.element.value = ed2.element.value;
        ed2.element.value = tmp;
    };
    btn.textContent = "↔";
    container.appendChild(ed1.element);
    container.appendChild(btn);
    container.appendChild(ed2.element);
    return {
        element: container,
        menuToState: () => [ed1.menuToState(), ed2.menuToState()]
    };
}
function makeTranslationEditor(ls, validator) {
    return multipleEditors(ls, () => ["", ""], (item) => combineEditors(item, (s) => singleTextFieldEditor(s), (s) => validatedTextFieldEditor(s, validator)), true, (s, cd) => cd[0].includes(s) || cd[1].includes(s));
}
function fixedNumEditors(ls, ed) {
    var children = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => (0, utils_1.arrayReindex)(children.map((c) => c.menuToState()))
    };
    var statePartEditorFactory = (statePart) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        editor.element.appendChild(newEditor.element);
    };
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
}
function multipleEditors(ls, empty, ed, includeSearch = false, searchFxn = (s, x) => true) {
    var children = [];
    var includedInds = [];
    var editor = {
        element: document.createElement("div"),
        menuToState: () => (0, utils_1.arrayReindex)(includedInds.map((i) => children[i].menuToState()))
    };
    var addBtn = document.createElement("button");
    addBtn.classList.add("add-new-field-button");
    addBtn.textContent = "Add another";
    var listDiv = document.createElement("div");
    var statePartDivs = [];
    var statePartEditorFactory = (statePart) => {
        var newEditor = ed(statePart);
        children.push(newEditor);
        var ind = children.length - 1;
        includedInds.push(ind);
        var statePartDiv = document.createElement("div");
        statePartDiv.appendChild(newEditor.element);
        newEditor.element.style.display = "inline-block";
        var delBtn = document.createElement("button");
        var undelBtn = document.createElement("button");
        statePartDiv.appendChild(delBtn);
        statePartDiv.appendChild(undelBtn);
        listDiv.prepend(statePartDiv);
        statePartDivs.push(statePartDiv);
        delBtn.classList.add("menu-remove-card-button");
        delBtn.textContent = "remove";
        delBtn.onclick = (e) => {
            delBtn.style.display = "none";
            undelBtn.style.display = "inline-block";
            statePartDiv.style.backgroundColor = "#ffdddd";
            includedInds = includedInds.filter((i) => i !== ind);
        };
        undelBtn.style.display = "none";
        undelBtn.classList.add("menu-remove-card-button");
        undelBtn.textContent = "restore";
        undelBtn.onclick = (e) => {
            undelBtn.style.display = "none";
            delBtn.style.display = "inline-block";
            statePartDiv.style.backgroundColor = window.getComputedStyle(statePartDiv.parentElement).backgroundColor;
            includedInds.push(ind);
        };
    };
    addBtn.onclick = (e) => { statePartEditorFactory(empty()); };
    editor.element.appendChild(addBtn);
    if (includeSearch) {
        var searchBar = document.createElement("input");
        searchBar.placeholder = "Search...";
        searchBar.oninput = (e) => {
            for (var i in children) {
                var ed = children[i];
                if (searchFxn(searchBar.value, ed.menuToState())) {
                    statePartDivs[i].style.display = "block";
                }
                else {
                    statePartDivs[i].style.display = "none";
                }
            }
        };
        editor.element.appendChild(searchBar);
    }
    editor.element.appendChild(listDiv);
    for (var i in ls) {
        statePartEditorFactory(ls[i]);
    }
    return editor;
}


/***/ }),

/***/ 836:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gDeckRegistry = exports.gDeckTypeRegistry = void 0;
exports.setDeck = setDeck;
exports.saveDeck = saveDeck;
exports.loadAllDecks = loadAllDecks;
exports.eraseDeck = eraseDeck;
exports.runDeck = runDeck;
exports.setLastDeck = setLastDeck;
exports.getStartingDeck = getStartingDeck;
exports.registerDeckType = registerDeckType;
const utils_1 = __webpack_require__(185);
const fs_1 = __webpack_require__(633);
exports.gDeckTypeRegistry = {};
exports.gDeckRegistry = {};
function setDeck(deckSlug, deckString, callback) {
    var deck = JSON.parse(deckString);
    exports.gDeckRegistry[deckSlug] = deck;
    saveDeck(deckSlug, callback);
}
function saveDeck(deckSlug, callback) {
    (0, fs_1.setDeckJSON)(deckSlug, JSON.stringify(exports.gDeckRegistry[deckSlug])).then((_) => callback());
}
function loadDeckIfExists(deckSlug) {
    return (0, fs_1.getDeckJSON)(deckSlug).then((j) => {
        if (j.length > 0) {
            var d = JSON.parse(j);
            exports.gDeckRegistry[d.slug] = d;
        }
    });
}
function loadAllDecks() {
    var deckSlugsP = (0, fs_1.getDeckSlugs)();
    var deckSlugs = Object.keys(exports.gDeckRegistry);
    return deckSlugsP.then((slugs) => Promise.all(slugs.map(loadDeckIfExists)));
}
function eraseDeck(deckSlug) {
    (0, fs_1.deleteDeck)(deckSlug);
    delete exports.gDeckRegistry[deckSlug];
}
/* Setup general-purpose menus */
function menuSetup(deckSlug) {
    var deck = exports.gDeckRegistry[deckSlug];
    var decktypeSlug = deck.type;
    var decktype = exports.gDeckTypeRegistry[decktypeSlug];
    var getState = () => exports.gDeckRegistry[deckSlug].state;
    var editBtn = document.getElementById("deck-edit-button");
    editBtn.onclick = () => {
        var editorOverlay = document.getElementById("flashcard-deck-editor-overlay");
        var editorCont = document.getElementById("flashcard-deck-editor");
        var editor = decktype.editor(getState());
        editorOverlay.style.display = "inline-block";
        editorCont.replaceChildren(editor.element);
        var doneBtn = document.getElementById("flashcard-deck-editor-close");
        window.onbeforeunload = function () {
            return "Are you sure you want to leave before saving your deck?";
        };
        doneBtn.onclick = () => {
            window.onbeforeunload = () => { };
            editorOverlay.style.display = "none";
            deck.state = editor.menuToState();
            exports.gDeckRegistry[deckSlug].state = deck.state;
            saveDeck(deckSlug, () => { });
            runDeck(deck.slug);
        };
    };
}
function importExportSetup(deckSlug, setDeck) {
    var importBtn = document.getElementById("import-deck-button");
    var fileUploadInput = document.getElementById("deck-upload-file");
    var exportBtn = document.getElementById("export-deck-button");
    importBtn.onclick = (e) => {
        fileUploadInput.click();
        fileUploadInput.onchange = (e) => {
            var files = fileUploadInput.files;
            if (files == null)
                return;
            var file = files[0];
            if (file == null)
                return;
            var reader = new FileReader();
            reader.onload = (e) => {
                var importedDeck = JSON.parse(e.target.result);
                importedDeck.slug = deckSlug;
                setDeck(importedDeck);
            };
            reader.readAsText(file, "UTF-8");
        };
    };
    exportBtn.onclick = (e) => {
        (0, utils_1.downloadText)(deckSlug, JSON.stringify(exports.gDeckRegistry[deckSlug]));
    };
}
function runDeck(deckSlug) {
    setLastDeck(deckSlug);
    document.getElementById("flashcard-container").innerHTML = "";
    var decktype = exports.gDeckTypeRegistry[exports.gDeckRegistry[deckSlug].type];
    exports.gDeckRegistry[deckSlug].state = decktype.gen.repairDeckState(exports.gDeckRegistry[deckSlug].state);
    var getState = () => exports.gDeckRegistry[deckSlug].state;
    var setState = (state) => {
        exports.gDeckRegistry[deckSlug].state = state;
    };
    menuSetup(deckSlug);
    importExportSetup(deckSlug, (s) => {
        exports.gDeckRegistry[deckSlug] = s;
        saveDeck(deckSlug, () => {
            runDeck(deckSlug);
        });
    });
    decktype.gen.runLoop(getState, setState, () => saveDeck(deckSlug, () => { }));
}
function setLastDeck(deckSlug) {
    localStorage.setItem("last-deck-slug", deckSlug);
}
function getStartingDeck(defaultSlug) {
    var lastDeckSlug = localStorage.getItem("last-deck-slug");
    if ((lastDeckSlug == undefined) || !(lastDeckSlug in exports.gDeckRegistry)) {
        return defaultSlug;
    }
    return lastDeckSlug;
}
/* Register a new type of deck */
function registerDeckType(gen, mkEd, defaultSlug, defaultName, defaultState, colorCode = "#ffffee") {
    exports.gDeckTypeRegistry[gen.getGenName()] = {
        slug: gen.getGenName(),
        gen: gen,
        editor: mkEd
    };
    exports.gDeckRegistry[defaultSlug] = {
        name: defaultName,
        slug: defaultSlug,
        type: gen.getGenName(),
        state: defaultState,
        view: {
            color: colorCode
        }
    };
}


/***/ }),

/***/ 808:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FlashcardGen = exports.FlashcardResult = void 0;
const utils_1 = __webpack_require__(185);
var FlashcardResult;
(function (FlashcardResult) {
    FlashcardResult[FlashcardResult["Correct"] = 0] = "Correct";
    FlashcardResult[FlashcardResult["Incorrect"] = 1] = "Incorrect";
    FlashcardResult[FlashcardResult["Unanswered"] = 2] = "Unanswered";
})(FlashcardResult || (exports.FlashcardResult = FlashcardResult = {}));
var SOONEST_RUN = null;
class FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    showLoading = false;
    async runOnce(s, setState, callback) {
        this.showLoading = true;
        setTimeout(() => {
            if (this.showLoading) {
                (0, utils_1.showLoadingIcon)();
            }
        }, 500);
        var thisRunTime = new Date();
        console.log(thisRunTime);
        SOONEST_RUN = thisRunTime;
        var cardData = await this.getNextCardAsync(s);
        var card = await this.generateCardAsync(s, cardData);
        card.check = (ans) => this.checkAnswerAsync(ans, s, cardData);
        if (thisRunTime.getTime() !== SOONEST_RUN.getTime()) {
            console.log(`Canceling run for ${thisRunTime} as it is not the most recent`);
            return;
        }
        (0, utils_1.hideLoadingIcon)();
        this.showLoading = false;
        var inputBox = document.getElementById("answer-input");
        var correctCallback = (newState) => () => {
            inputBox.value = "";
            setState(newState);
            card.slideOut(callback, true);
        };
        var inputCallback = async (attempt) => {
            var correct = await card.check(attempt);
            if (correct) {
                inputBox.onkeydown = (e) => { }; // To prevent multiple submissions by accident
                var result = card.correctFirst ? FlashcardResult.Correct : FlashcardResult.Incorrect;
                var newState = await this.updateStateAsync(s, cardData, result);
                await this.correctEffect(newState, cardData, attempt, correctCallback(newState));
            }
            else {
                card.markWrong();
                inputBox.oninput = (e) => {
                    inputBox.value = e.data;
                    inputBox.oninput = (e) => { };
                };
            }
        };
        inputBox.onkeydown = async (e) => {
            if (e.key == "Enter") {
                inputCallback(inputBox.value);
            }
            else if (e.key == "ArrowUp") {
                var newState = await this.updateStateAsync(s, cardData, FlashcardResult.Correct);
                this.correctEffect(newState, cardData, "", correctCallback(newState));
            }
            else if (e.key == "ArrowDown") {
                inputBox.value = "";
                this.updateStateAsync(s, cardData, FlashcardResult.Unanswered).then(setState);
                card.slideOut(callback, false);
            }
        };
        card.slideIn();
    }
    runLoop(getState, setState, callback) {
        var looper = () => {
            this.runOnce(getState(), setState, () => {
                callback();
                looper();
            });
        };
        looper();
    }
}
exports.FlashcardGen = FlashcardGen;


/***/ }),

/***/ 410:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FlashcardSyncGen = void 0;
const flashcard_generator_1 = __webpack_require__(808);
class FlashcardSyncGen extends flashcard_generator_1.FlashcardGen {
    // Type S is the state type for this flashcard deck
    // Type D is the type of the data involved in the single card
    getGenName() {
        throw new Error("getGenName not implemented!");
    }
    getNextCardAsync(state) {
        return new Promise((resolve, _) => { resolve(this.getNextCard(state)); });
    }
    updateStateAsync(state, cardData, correct) {
        return new Promise((resolve, _) => { resolve(this.updateState(state, cardData, correct)); });
    }
    generateCardAsync(state, data) {
        return new Promise((resolve, _) => { resolve(this.generateCard(state, data)); });
    }
    checkAnswerAsync(answer, state, data) {
        return new Promise((resolve, _) => { resolve(this.checkAnswer(answer, state, data)); });
    }
}
exports.FlashcardSyncGen = FlashcardSyncGen;


/***/ }),

/***/ 791:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gTemplateRegistry = exports.FlashcardTemplate = void 0;
exports.registerTemplate = registerTemplate;
exports.renderCard = renderCard;
class FlashcardTemplate {
}
exports.FlashcardTemplate = FlashcardTemplate;
exports.gTemplateRegistry = {};
function registerTemplate(tpl) {
    exports.gTemplateRegistry[tpl.getName()] = tpl;
}
function renderCard(tplName, cardData) {
    if (tplName in exports.gTemplateRegistry) {
        return exports.gTemplateRegistry[tplName].render(cardData);
    }
    throw new Error(`Unrecognized card template ${tplName}`);
}


/***/ }),

/***/ 88:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Flashcard = void 0;
class Flashcard {
    el;
    check;
    hint;
    correctFirst;
    constructor(el, hint, check = (_) => new Promise((resolve, _) => false)) {
        this.el = el;
        this.check = check;
        this.hint = hint;
        this.correctFirst = true;
    }
    slideIn() {
        var flCont = document.getElementById("flashcard-container");
        this.el.classList.add("flashcard");
        this.el.classList.add("flashcard-slide-in");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-slide-in"); };
        flCont.appendChild(this.el);
        document.getElementById("answer-hint").value = "";
    }
    slideOut(callback, correct) {
        var outClass = correct ? "flashcard-slide-out" : "flashcard-slide-out-unanswered";
        this.el.classList.add(outClass);
        this.el.onanimationend = () => {
            this.el.classList.remove(outClass);
            this.el.remove();
            callback();
        };
        document.getElementById("answer-hint").value = "";
    }
    markWrong() {
        this.correctFirst = false;
        this.el.classList.add("flashcard-incorrect");
        this.el.onanimationend = () => { this.el.classList.remove("flashcard-incorrect"); };
        document.getElementById("answer-hint").value = this.hint;
    }
}
exports.Flashcard = Flashcard;


/***/ }),

/***/ 633:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDeckJSON = getDeckJSON;
exports.getDeckSlugs = getDeckSlugs;
exports.setDeckJSON = setDeckJSON;
exports.deleteDeck = deleteDeck;
const opfsRootP = () => navigator.storage.getDirectory();
const deckFolderP = () => opfsRootP().then((r) => r.getDirectoryHandle("decks", { create: true }));
function getDeckJSON(deckSlug) {
    var deckHandleP = deckFolderP().then((f) => f.getFileHandle(deckSlug));
    return deckHandleP
        .then((h) => h.getFile()).then((f) => f.text())
        .catch((e) => { console.log(e); return ""; });
}
function getDeckSlugs() {
    var entriesP = deckFolderP().then((h) => Array.fromAsync(h.entries()));
    var namesP = entriesP.then((es) => es.map((entry) => entry[0]));
    return namesP;
}
function setDeckJSON(deckSlug, deckBlob) {
    var deckHandleP = deckFolderP().then((f) => f.getFileHandle(deckSlug, { create: true }));
    var deckWriteableP = deckHandleP.then((h) => h.createWritable());
    return deckWriteableP.then((w) => {
        w.write(deckBlob).then(() => w.close());
    }).catch((e) => console.log(`ERROR WRITING DECK: ${e}`));
}
function deleteDeck(deckSlug) {
    deckFolderP().then((h) => h.removeEntry(deckSlug));
}


/***/ }),

/***/ 602:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Preloader = void 0;
class Preloader {
    values = {};
    valueCounts = {};
    numPreload;
    delaySeconds = 1.0;
    constructor(numPreload) {
        this.numPreload = numPreload;
    }
    fillCacheForKey(k, fetcher) {
        var valuesNeeded = this.numPreload - this.valueCounts[k];
        return fetcher(k).then((xs) => {
            if (xs === null || xs === undefined)
                return;
            xs.map((x) => this.values[k].push(x));
            this.valueCounts[k] = this.values[k].length;
        }).catch((e) => { console.log(e); });
    }
    addKey(k, fetcher) {
        if (this.values[k] === undefined) {
            this.values[k] = [];
            this.valueCounts[k] = 0;
        }
        return this.fillCacheForKey(k, fetcher);
    }
    getKey(k, fetcher, maxAttempts = 3) {
        if (maxAttempts == 0)
            return new Promise((resolve, _) => resolve(undefined));
        var keyAddedPromise = this.addKey(k, fetcher);
        if (this.values[k].length > 0) {
            return new Promise((resolve, _) => {
                this.valueCounts[k] += -1;
                var nextVal = this.values[k].shift();
                this.fillCacheForKey(k, fetcher);
                resolve(nextVal);
            });
        }
        else {
            return keyAddedPromise.then((_) => this.getKey(k, fetcher, maxAttempts - 1));
        }
    }
}
exports.Preloader = Preloader;


/***/ }),

/***/ 926:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils_1 = __webpack_require__(185);
const flashcard_1 = __webpack_require__(88);
const flashcard_template_1 = __webpack_require__(791);
class NoAnswerFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "noanswer-template"; }
    render(data) {
        var a = document.createElement("div");
        a.textContent = data;
        var fontSize = 90.0 / (10.0 * Math.log(10 + data[0].length));
        var fl = new flashcard_1.Flashcard(a, "", (_) => (0, utils_1.trivialPromise)(false));
        fl.el.style.fontSize = `${fontSize}vw`;
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new NoAnswerFlashcardTemplate());


/***/ }),

/***/ 735:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.preprocessStringSub = preprocessStringSub;
exports.validateStringSub = validateStringSub;
exports.randomizeStringSub = randomizeStringSub;
function preprocessStringSub(subString) {
    var subs = {};
    var i = 0;
    const tplString = subString.replaceAll(/\{r([0-9]):([^\}]*)\}/g, function (m, g1, g2) {
        subs[i] = { index: i, group: +g1, options: g2.split(',') };
        var sub = `{${i}}`;
        i += 1;
        return sub;
    });
    return [tplString, subs];
}
function validateStringSub(subString) {
    var preproc = preprocessStringSub(subString);
    var subs = preproc[1];
    var counts = {};
    for (var k in Object.keys(subs)) {
        var sub = subs[k];
        if (sub.group in Object.keys(counts)) {
            if (sub.options.length != counts[sub.group]) {
                return false;
            }
        }
        else {
            counts[sub.group] = sub.options.length;
        }
    }
    return true;
}
function randomizeStringSub(subString, rands = {}) {
    var preproc = preprocessStringSub(subString);
    var outString = preproc[0];
    var subs = preproc[1];
    for (var k in Object.keys(subs)) {
        var sub = subs[k];
        if (!(sub.group in Object.keys(rands))) {
            rands[sub.group] = Math.floor(Math.random() * sub.options.length);
        }
        var sel = sub.options[rands[sub.group]];
        outString = outString.replace(`{${sub.index}}`, sel);
    }
    return [outString, rands];
}


/***/ }),

/***/ 337:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const flashcard_deck_1 = __webpack_require__(836);
const decklist_1 = __webpack_require__(79);
__webpack_require__(193);
__webpack_require__(292);
__webpack_require__(127);
__webpack_require__(926);
__webpack_require__(633);
__webpack_require__(737);
__webpack_require__(18);
__webpack_require__(601);
__webpack_require__(66);
__webpack_require__(994);
__webpack_require__(159);
__webpack_require__(192);
(0, decklist_1.setupDecklistMenu)();
(0, flashcard_deck_1.loadAllDecks)().then((_) => (0, flashcard_deck_1.runDeck)((0, flashcard_deck_1.getStartingDeck)("key-value-quizzer")));


/***/ }),

/***/ 702:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.infoWidgetSR = infoWidgetSR;
exports.studyingEditorSR = studyingEditorSR;
const spaced_repetition_general_1 = __webpack_require__(547);
const editor_1 = __webpack_require__(43);
function infoWidgetSR(st) {
    var contDiv = document.createElement("div");
    contDiv.classList.add("deck-menu-submenu");
    var totP = document.createElement("p");
    totP.textContent = `Total cards: ${Object.keys(st.cards).length}`;
    totP.style.color = "#666666";
    totP.style.fontWeight = "bold";
    var newP = document.createElement("p");
    newP.textContent = `New cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes == 0).length}`;
    newP.style.color = "#9999ee";
    newP.style.fontWeight = "bold";
    var dueP = document.createElement("p");
    dueP.textContent = `Due cards: ${Object.keys(st.cards).filter((i) => st.cards[i].intervalMinutes > 0
        && new Date(st.cards[i].due) < new Date()).length}`;
    dueP.style.color = "#ee9999";
    dueP.style.fontWeight = "bold";
    [totP, newP, dueP].map((el) => contDiv.appendChild(el));
    return contDiv;
}
function studyingEditorSR(st) {
    var studyingEditor = (0, editor_1.radioEditor)(st.studying, [spaced_repetition_general_1.SpacedRepStudying.NewCards, spaced_repetition_general_1.SpacedRepStudying.DueCards, spaced_repetition_general_1.SpacedRepStudying.RandomCards], ["Study new cards", "Study due cards", "Practice random cards"]);
    return studyingEditor;
}


/***/ }),

/***/ 66:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClozeSpacedRepGen = exports.defaultSRClozeState = exports.defaultSRClozeSettings = void 0;
const utils_1 = __webpack_require__(185);
const generic_preloader_1 = __webpack_require__(602);
const flashcard_generator_1 = __webpack_require__(808);
const spaced_repetition_general_1 = __webpack_require__(547);
const speech_1 = __webpack_require__(192);
const text_filters_1 = __webpack_require__(460);
const editor_1 = __webpack_require__(43);
const shared_sr_menu_components_1 = __webpack_require__(702);
const flashcard_template_1 = __webpack_require__(791);
const flashcard_deck_1 = __webpack_require__(836);
const spaced_repetition_newqueue_1 = __webpack_require__(338);
exports.defaultSRClozeSettings = {
    clozeServerUrl: "",
    sourceLangs: ["eng", "spa"],
    targetLang: "deu",
    initialHours: 8,
    correctFactor: 1.5,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
exports.defaultSRClozeState = {
    cards: (0, spaced_repetition_general_1.makeSpacedRepCardDict)([
        { key: "Hund", tags: [] },
        { key: "Katze", tags: [] },
        { key: "Mensch", tags: [] }
    ], () => { return { streak: 0, invalid: false }; }),
    newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(10),
    studying: spaced_repetition_general_1.SpacedRepStudying.NewCards,
    settings: exports.defaultSRClozeSettings
};
function makeEmptyCard() {
    return {
        guid: (0, utils_1.guidGenerator)(),
        content: {
            key: "",
            tags: []
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0,
            invalid: false
        }
    };
}
class ClozeSpacedRepGen extends spaced_repetition_general_1.AbstractAsyncSpacedRepGen {
    getGenName() { return "cloze-spaced-repetition"; }
    repairDeckState(st) {
        this.preFetchClozes(st);
        if (st.newQ === undefined) {
            st.newQ = (0, spaced_repetition_newqueue_1.emptySRQueue)(10);
        }
        return st;
    }
    cache = new generic_preloader_1.Preloader(10);
    cardIsEnabled(card, st) {
        return (!card.auxdata.invalid)
            && !card.content.tags.some((t) => st.settings.inactiveTags.includes(t));
    }
    correctEffect(st, card, attempt, resolve) {
        var cardData = card.data;
        if (st.settings.readCorrectAnswers && card.data.auxdata.cloze !== undefined) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) {
                (0, speech_1.utter)(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            }
            else {
                (0, speech_1.utter)(cardData.auxdata.cloze.answer, ss.voice, ss.rate, ss.pitch, resolve);
            }
        }
        else {
            resolve();
        }
    }
    updateInterval(card, settings, correct) {
        var cardData = card.data;
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            if (cardData.intervalMinutes == 0 && cardData.auxdata.streak >= 3) {
                return settings.initialHours * 60;
            }
            else if (cardData.intervalMinutes != 0) {
                return cardData.intervalMinutes * settings.correctFactor;
            }
            else {
                return 0;
            }
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect && cardData.intervalMinutes > 0) {
            return cardData.intervalMinutes * settings.incorrectFactor;
        }
        else {
            return cardData.intervalMinutes;
        }
    }
    updateAuxData(card, settings, correct) {
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            if (card.data.auxdata.cloze == undefined) {
                // When a card with invalid cloze is overridden, mark it as invalid
                card.data.auxdata.invalid = true;
            }
            else {
                card.data.auxdata.streak += 1;
            }
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect) {
            card.data.auxdata.streak = 0;
        }
        return card.data.auxdata;
    }
    checkAnswerAsync(answer, st, card) {
        if (card.data === undefined || card.data.auxdata.cloze === undefined) {
            return (0, utils_1.trivialPromise)(false);
        }
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        return (0, utils_1.trivialPromise)(tf(card.data.auxdata.cloze.answer) === tf(answer));
    }
    fetchCloze(lemma, settings) {
        return fetch(`${settings.clozeServerUrl}/cloze?` + new URLSearchParams({
            "srcs": settings.sourceLangs.join(","),
            "tgt": settings.targetLang,
            "lemma": lemma,
            "n": this.cache.numPreload.toString()
        }).toString()).then((r) => r.json()).catch((e) => undefined);
    }
    preFetchClozes(st) {
        this.getNew(st).map((k) => {
            var key = st.cards[k].content.key;
            this.cache.addKey(key, (k) => this.fetchCloze(k, st.settings));
        });
        this.getDue(st).map((k) => {
            var key = st.cards[k].content.key;
            this.cache.addKey(key, (k) => this.fetchCloze(k, st.settings));
        });
    }
    nextCardAsyncPreprocessing(card, st) {
        if (st.settings.clozeServerUrl.length == 0 || card.data === undefined) {
            // Returns with .cloze attribute undefined, indicating failure
            return (0, utils_1.trivialPromise)(card);
        }
        return this.cache.getKey(card.data.content.key, (k) => this.fetchCloze(k, st.settings)).then((j) => {
            if (j === undefined) {
                return card;
            }
            card.data.auxdata.cloze = {
                prompt: j["puzzle"],
                answer: j["target"],
                translation: j["source"]
            };
            return card;
        }).catch((e) => {
            return card;
        });
    }
    generateCardAsync(st, card) {
        if (card.data === undefined) {
            return (0, utils_1.trivialPromise)((0, flashcard_template_1.renderCard)("noanswer-template", "No cards left to study."));
        }
        else if (card.data.auxdata.cloze === undefined) {
            return (0, utils_1.trivialPromise)((0, flashcard_template_1.renderCard)("noanswer-template", `Could not get puzzle for card "${card.data.content.key}".`));
        }
        var fl = (0, flashcard_template_1.renderCard)("cloze-template", {
            group: "",
            guid: card.data.guid,
            upper: card.data.auxdata.cloze.prompt,
            lower: card.data.auxdata.cloze.translation
        });
        fl.el.appendChild((0, spaced_repetition_general_1.makeCardsLeftSpan)(card));
        return (0, utils_1.trivialPromise)(fl);
    }
}
exports.ClozeSpacedRepGen = ClozeSpacedRepGen;
function clozeSRMenu(st) {
    var contDiv = document.createElement("div");
    var infoWidget = (0, shared_sr_menu_components_1.infoWidgetSR)(st);
    var studyingEditor = (0, shared_sr_menu_components_1.studyingEditorSR)(st);
    var newQueueSizeEditor = (0, editor_1.scrollNumberEditor)("Max new cards to study at once: ", st.newQ.maxNewCards, 1, 100, 1);
    var clozeServerDiv = document.createElement("div");
    clozeServerDiv.classList.add("deck-menu-submenu");
    var clozeServerUrlEditor = (0, editor_1.singleTextFieldEditor)(st.settings.clozeServerUrl);
    var clozeSourceLangEditor = (0, editor_1.singleTextFieldEditor)(st.settings.sourceLangs.join(','));
    var clozeTargetLangEditor = (0, editor_1.singleTextFieldEditor)(st.settings.targetLang);
    clozeServerDiv.appendChild(clozeServerUrlEditor.element);
    clozeServerDiv.appendChild(clozeSourceLangEditor.element);
    clozeServerDiv.appendChild(clozeTargetLangEditor.element);
    var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", st.settings.initialHours, 1, 240, 1);
    var correctFactor = (0, editor_1.scrollNumberEditor)("Correct factor: ", st.settings.correctFactor, 1, 10, 0.1);
    var incorrectFactor = (0, editor_1.scrollNumberEditor)("Incorrect factor: ", st.settings.incorrectFactor, 0, 1.0, 0.01);
    var omitTagsEditor = (0, editor_1.singleTextFieldEditor)(st.settings.inactiveTags.join(','));
    omitTagsEditor.element.placeholder = "comma-separated tags...";
    var omitTagsCont = document.createElement("div");
    omitTagsCont.textContent = "Omit cards with the following tags: ";
    omitTagsCont.appendChild(omitTagsEditor.element);
    var speechCheckbox = (0, editor_1.boolEditor)("Speak correct answers using text-to-speech?", st.settings.readCorrectAnswers);
    var speechEditor = (0, speech_1.speechSettingsEditor)(st.settings.speechSettings);
    var speechDiv = document.createElement("div");
    speechDiv.appendChild(speechCheckbox.element);
    speechDiv.appendChild(speechEditor.element);
    var omitTagsEditor = (0, editor_1.singleTextFieldEditor)(st.settings.inactiveTags.join(','));
    omitTagsEditor.element.placeholder = "comma-separated tags...";
    var omitTagsCont = document.createElement("div");
    omitTagsCont.textContent = "Omit cards with the following tags: ";
    omitTagsCont.appendChild(omitTagsEditor.element);
    var filterEditor = (0, text_filters_1.textFilterSelectionMenu)(st.settings.filterSettings);
    function makeCardEditor(c) {
        var ed = (0, editor_1.combineEditors)([c.content.key, c.content.tags.join(',')], (k) => {
            var ed2 = (0, editor_1.singleTextFieldEditor)(k);
            ed2.element.style.display = "inline-block";
            return ed2;
        }, (ts) => {
            var ed2 = (0, editor_1.singleTextFieldEditor)(ts);
            ed2.element.placeholder = "tags...";
            return ed2;
        });
        var tf1 = ed.element.children[0];
        if (c.auxdata.invalid)
            tf1.style.backgroundColor = "#ffeeee";
        var cardInfo = document.createElement("a");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.intervalMinutes == 0) {
            cardInfo.textContent = "not studied";
        }
        else {
            cardInfo.textContent = `due ${(0, utils_1.getSRFutureDateInfo)(c.due)}`;
        }
        ed.element.appendChild(cardInfo);
        return {
            element: ed.element,
            menuToState: () => {
                let tp = ed.menuToState();
                c.content.key = tp[0];
                c.content.tags = tp[1].split(",");
                return c;
            }
        };
    }
    var cardsEditor = (0, editor_1.multipleEditors)(Object.values(st.cards), () => makeEmptyCard(), makeCardEditor, true, (s, cd) => cd.content.key.includes(s));
    [
        infoWidget,
        studyingEditor.element,
        clozeServerDiv,
        initHoursEditor.element,
        newQueueSizeEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element,
        cardsEditor.element
    ].map((el) => {
        el.classList.add("deck-menu-submenu");
        contDiv.appendChild(el);
    });
    return {
        element: contDiv,
        menuToState: () => {
            return {
                studying: studyingEditor.menuToState(),
                settings: {
                    clozeServerUrl: clozeServerUrlEditor.menuToState(),
                    sourceLangs: clozeSourceLangEditor.menuToState().split(","),
                    targetLang: clozeTargetLangEditor.menuToState(),
                    initialHours: initHoursEditor.menuToState(),
                    correctFactor: correctFactor.menuToState(),
                    incorrectFactor: incorrectFactor.menuToState(),
                    readCorrectAnswers: speechCheckbox.menuToState(),
                    speechSettings: speechEditor.menuToState(),
                    filterSettings: filterEditor.menuToState(),
                    inactiveTags: omitTagsEditor.menuToState().split(",")
                },
                newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(newQueueSizeEditor.menuToState()),
                cards: (0, utils_1.makeDict)(cardsEditor.menuToState(), (c) => c.guid),
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new ClozeSpacedRepGen(), clozeSRMenu, "cloze-spaced-repetition-deck", "Cloze spaced repetition deck", exports.defaultSRClozeState, "#ffffdd");


/***/ }),

/***/ 547:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbstractSpacedRepGen = exports.AbstractAsyncSpacedRepGen = exports.SpacedRepStudying = void 0;
exports.makeSpacedRepCardDict = makeSpacedRepCardDict;
exports.makeCardsLeftSpan = makeCardsLeftSpan;
const utils_1 = __webpack_require__(185);
const flashcard_generator_1 = __webpack_require__(808);
const spaced_repetition_newqueue_1 = __webpack_require__(338);
var SpacedRepStudying;
(function (SpacedRepStudying) {
    SpacedRepStudying[SpacedRepStudying["NewCards"] = 1] = "NewCards";
    SpacedRepStudying[SpacedRepStudying["DueCards"] = 2] = "DueCards";
    SpacedRepStudying[SpacedRepStudying["RandomCards"] = 3] = "RandomCards";
})(SpacedRepStudying || (exports.SpacedRepStudying = SpacedRepStudying = {}));
function makeSpacedRepCardDict(cards, defaultAuxData) {
    var cardDict = {};
    for (var i in cards) {
        var c = cards[i];
        var guid = (0, utils_1.guidGenerator)();
        cardDict[guid] = { guid: guid, content: c, due: new Date(), intervalMinutes: 0, auxdata: defaultAuxData() };
    }
    return cardDict;
}
class AbstractAsyncSpacedRepGen extends flashcard_generator_1.FlashcardGen {
    getDate = () => new Date();
    // For unit testing
    setDate(newDt) { this.getDate = () => newDt; }
    cardIsDue(card) {
        return (card.intervalMinutes > 0 && new Date(card.due).valueOf() < this.getDate().valueOf());
    }
    ;
    cardIsNew(card) {
        return (card.intervalMinutes == 0);
    }
    ;
    updateCard(card, st, correct) {
        // Physical card data could be modified by templating, so must get card data by guid from deck
        var cardData = st.cards[card.data.guid];
        if (card.context.isPractice) {
            return cardData;
        }
        var isNew = cardData.intervalMinutes == 0;
        var newAuxData = this.updateAuxData(card, st.settings, correct);
        cardData.auxdata = newAuxData;
        var newInterval = this.updateInterval(card, st.settings, correct);
        cardData.intervalMinutes = newInterval;
        // Interval > 0 implies the card is no longer new
        // Only reschedule the card if it was answered correctly
        if (correct == flashcard_generator_1.FlashcardResult.Correct && newInterval > 0) {
            cardData.due = this.getDate();
            cardData.due.setHours(cardData.due.getHours() + cardData.intervalMinutes / 60);
        }
        return cardData;
    }
    getNew(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsNew(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }
    getDue(st) {
        return Object.keys(st.cards).filter((k) => this.cardIsDue(st.cards[k]) && this.cardIsEnabled(st.cards[k], st));
    }
    getNextCardAsync(st) {
        var inds = Object.keys(st.cards);
        var newInds = this.getNew(st);
        var dueInds = this.getDue(st);
        switch (st.studying) {
            case SpacedRepStudying.NewCards:
                var newGuid = (0, spaced_repetition_newqueue_1.chooseNext)(st.newQ, newInds);
                if (newGuid === undefined) {
                    return this.nextCardAsyncPreprocessing({
                        data: undefined,
                        context: { cardsLeft: 0, isPractice: false }
                    }, st);
                }
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[newGuid],
                    context: {
                        cardsLeft: newInds.length,
                        isPractice: false
                    }
                }, st);
            case SpacedRepStudying.DueCards:
                if (dueInds.length == 0) {
                    return (0, utils_1.trivialPromise)({ data: undefined, context: { cardsLeft: 0, isPractice: false } });
                }
                var dueInd = dueInds[Math.floor(Math.random() * dueInds.length)];
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[dueInd],
                    context: {
                        cardsLeft: dueInds.length,
                        isPractice: false
                    }
                }, st);
            case SpacedRepStudying.RandomCards:
                var ind = inds[Math.floor(Math.random() * inds.length)];
                return this.nextCardAsyncPreprocessing({
                    data: st.cards[ind],
                    context: {
                        cardsLeft: 0,
                        isPractice: true
                    }
                }, st);
        }
        return this.nextCardAsyncPreprocessing({
            data: undefined,
            context: {
                cardsLeft: 0,
                isPractice: false
            }
        }, st);
    }
    updateStateAsync(st, card, result) {
        if (result == flashcard_generator_1.FlashcardResult.Unanswered || st.studying == SpacedRepStudying.RandomCards)
            return (0, utils_1.trivialPromise)(st);
        var cardData = card.data;
        var correct = (result == flashcard_generator_1.FlashcardResult.Correct);
        var cardGuid = cardData.guid;
        var cardState = st.cards[cardGuid];
        var cardNewState = this.updateCard(card, st, result);
        // If card is still new, stick it back in the queue
        if (st.studying == SpacedRepStudying.NewCards) {
            st.newQ = (0, spaced_repetition_newqueue_1.incorporateLast)(st.newQ, cardGuid, this.cardIsNew(cardNewState));
        }
        st.newQ = (0, spaced_repetition_newqueue_1.filterNewQueue)(st.newQ, (id) => this.cardIsEnabled(st.cards[id], st));
        st.cards[cardGuid] = cardNewState;
        return (0, utils_1.trivialPromise)(st);
    }
}
exports.AbstractAsyncSpacedRepGen = AbstractAsyncSpacedRepGen;
class AbstractSpacedRepGen extends AbstractAsyncSpacedRepGen {
    nextCardAsyncPreprocessing(c, state) {
        return (0, utils_1.trivialPromise)(this.nextCardPreprocessing(c));
    }
    generateCardAsync(st, data) {
        return new Promise((resolve, _) => { resolve(this.generateCard(st, data)); });
    }
    checkAnswerAsync(answer, state, data) {
        return new Promise((resolve, _) => { resolve(this.checkAnswer(answer, state, data)); });
    }
}
exports.AbstractSpacedRepGen = AbstractSpacedRepGen;
// Some helpful utilities that might be shared between SR decks
function makeCardsLeftSpan(card) {
    var infoText = document.createElement("span");
    infoText.classList.add("cards-left-span");
    if (card.context.isPractice) {
        infoText.textContent = "This is a practice card. It will not affect your progress.";
    }
    else {
        infoText.textContent = `${card.context.cardsLeft} cards remaining`;
    }
    return infoText;
}


/***/ }),

/***/ 338:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.emptySRQueue = emptySRQueue;
exports.chooseNext = chooseNext;
exports.incorporateLast = incorporateLast;
exports.filterNewQueue = filterNewQueue;
function emptySRQueue(maxNewCards) {
    return {
        maxNewCards: maxNewCards,
        newQueue: []
    };
}
function chooseNext(q, allOpts) {
    var newOpts = allOpts.filter((k) => !q.newQueue.includes(k));
    if (q.newQueue.length < q.maxNewCards && newOpts.length > 0) {
        return newOpts[Math.floor(Math.random() * newOpts.length)];
    }
    else if (q.newQueue.length > 0) {
        return q.newQueue[0];
    }
    else {
        return undefined;
    }
}
function incorporateLast(q, c, isStillNew) {
    if (c === undefined) {
        return q;
    }
    if (c === q.newQueue[0]) {
        q.newQueue.shift();
    }
    if (isStillNew) {
        q.newQueue.push(c);
    }
    return q;
}
function filterNewQueue(q, fxn) {
    q.newQueue = q.newQueue.filter(fxn);
    return q;
}


/***/ }),

/***/ 601:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SimpleSpacedRepGen = exports.defaultSimpleSRState = exports.defaultSimpleSRSettings = void 0;
exports.makeEmptyCard = makeEmptyCard;
const utils_1 = __webpack_require__(185);
const random_templating_1 = __webpack_require__(735);
const flashcard_1 = __webpack_require__(88);
const flashcard_generator_1 = __webpack_require__(808);
const spaced_repetition_general_1 = __webpack_require__(547);
const speech_1 = __webpack_require__(192);
const text_filters_1 = __webpack_require__(460);
const editor_1 = __webpack_require__(43);
const shared_sr_menu_components_1 = __webpack_require__(702);
const flashcard_deck_1 = __webpack_require__(836);
const spaced_repetition_newqueue_1 = __webpack_require__(338);
exports.defaultSimpleSRSettings = {
    initialHours: 6,
    correctFactor: 1.6,
    incorrectFactor: 0.5,
    inactiveTags: [],
    readCorrectAnswers: false,
    speechSettings: (0, speech_1.defaultSpeechSettings)(),
    filterSettings: text_filters_1.defaultTextFilterSettings
};
exports.defaultSimpleSRState = {
    cards: (0, spaced_repetition_general_1.makeSpacedRepCardDict)([
        { prompt: "the dog", answers: ["le chien"], tags: [] },
        { prompt: "the man", answers: ["l'homme"], tags: [] },
        { prompt: "the woman", answers: ["la dame"], tags: [] }
    ], () => { return { streak: 0, intervalMinutes: 0, due: undefined }; }),
    newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(10),
    studying: spaced_repetition_general_1.SpacedRepStudying.NewCards,
    settings: exports.defaultSimpleSRSettings
};
function makeEmptyCard() {
    return {
        guid: (0, utils_1.guidGenerator)(),
        content: {
            prompt: "",
            answers: [""],
            tags: []
        },
        due: new Date(),
        intervalMinutes: 0,
        auxdata: {
            streak: 0
        }
    };
}
class SimpleSpacedRepGen extends spaced_repetition_general_1.AbstractSpacedRepGen {
    getGenName() { return "simple-spaced-repetition"; }
    cardIsEnabled(card, st) {
        return !card.content.tags.some((t) => st.settings.inactiveTags.some((s) => t === s));
    }
    updateInterval(card, settings, correct) {
        var cardData = card.data;
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            if (cardData.intervalMinutes == 0 && cardData.auxdata.streak >= 3) {
                return settings.initialHours * 60;
            }
            else if (cardData.intervalMinutes != 0) {
                return cardData.intervalMinutes * settings.correctFactor;
            }
            else {
                return 0;
            }
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect && cardData.intervalMinutes > 0) {
            return cardData.intervalMinutes * settings.incorrectFactor;
        }
        else {
            return cardData.intervalMinutes;
        }
    }
    updateAuxData(card, settings, correct) {
        if (correct == flashcard_generator_1.FlashcardResult.Correct) {
            card.data.auxdata.streak += 1;
        }
        else if (correct == flashcard_generator_1.FlashcardResult.Incorrect) {
            card.data.auxdata.streak = 0;
        }
        return card.data.auxdata;
    }
    repairDeckState(st) {
        if (st.newQ === undefined) {
            st.newQ = (0, spaced_repetition_newqueue_1.emptySRQueue)(10);
        }
        return st;
    }
    applyCardTemplating(card) {
        // Random substitution card templating
        var res = (0, random_templating_1.randomizeStringSub)(card.data.content.prompt, {});
        card.data.content.prompt = res[0];
        card.data.content.answers = card.data.content.answers.map((a) => (0, random_templating_1.randomizeStringSub)(a, res[1])[0]);
        return card;
    }
    nextCardPreprocessing(card) {
        // Clone the card so we don't mess with its state in the deck
        var card = JSON.parse(JSON.stringify(card));
        if (card.data !== undefined) {
            card = this.applyCardTemplating(card);
        }
        return card;
    }
    generateCard(st, card) {
        var a = document.createElement("a");
        var prompt = "No cards left to study.";
        var answers = [];
        var hint = "You cannot continue studying until more cards become due.";
        if (card.data !== undefined) {
            prompt = card.data.content.prompt;
            answers = card.data.content.answers;
            hint = card.data.content.answers[0];
        }
        var fontSize = 100.0 / (10.0 * Math.log(10 + prompt.length));
        a.style.fontSize = `${fontSize}vw`;
        a.textContent = prompt;
        var fl = new flashcard_1.Flashcard(a, hint);
        if (card.context.isPractice) {
            fl.el.style.backgroundColor = "#ffffee";
        }
        fl.el.appendChild((0, spaced_repetition_general_1.makeCardsLeftSpan)(card));
        return fl;
    }
    checkAnswer(answer, st, card) {
        if (card.data === undefined)
            return false;
        var cardData = card.data;
        var tf = (s) => (0, text_filters_1.applyTextFilter)(s, st.settings.filterSettings);
        return cardData.content.answers.map(tf).includes(tf(answer));
    }
    correctEffect(st, card, attempt, resolve) {
        var cardData = card.data;
        if (st.settings.readCorrectAnswers) {
            var ss = st.settings.speechSettings;
            if (attempt.length > 0) {
                (0, speech_1.utter)(attempt, ss.voice, ss.rate, ss.pitch, resolve);
            }
            else {
                (0, speech_1.utter)(cardData.content.answers[0], ss.voice, ss.rate, ss.pitch, resolve);
            }
        }
        else {
            resolve();
        }
    }
}
exports.SimpleSpacedRepGen = SimpleSpacedRepGen;
function simpleSRMenu(st) {
    var contDiv = document.createElement("div");
    var infoWidget = (0, shared_sr_menu_components_1.infoWidgetSR)(st);
    var studyingEditor = (0, shared_sr_menu_components_1.studyingEditorSR)(st);
    var settings = st.settings;
    var initHoursEditor = (0, editor_1.scrollNumberEditor)("Initial interval (hours): ", settings.initialHours, 1, 240, 1);
    var newQueueSizeEditor = (0, editor_1.scrollNumberEditor)("Max new cards to study at once: ", st.newQ.maxNewCards, 1, 100, 1);
    var correctFactor = (0, editor_1.scrollNumberEditor)("Correct factor: ", settings.correctFactor, 1, 10, 0.1);
    var incorrectFactor = (0, editor_1.scrollNumberEditor)("Incorrect factor: ", settings.incorrectFactor, 0, 1.0, 0.01);
    var speechCheckbox = (0, editor_1.boolEditor)("Speak correct answers using text-to-speech?", settings.readCorrectAnswers);
    var speechEditor = (0, speech_1.speechSettingsEditor)(settings.speechSettings);
    var speechDiv = document.createElement("div");
    speechDiv.appendChild(speechCheckbox.element);
    speechDiv.appendChild(speechEditor.element);
    var omitTagsEditor = (0, editor_1.singleTextFieldEditor)(settings.inactiveTags.join(','));
    omitTagsEditor.element.placeholder = "comma-separated tags...";
    var omitTagsCont = document.createElement("div");
    omitTagsCont.textContent = "Omit cards with the following tags: ";
    omitTagsCont.appendChild(omitTagsEditor.element);
    var filterEditor = (0, text_filters_1.textFilterSelectionMenu)(settings.filterSettings);
    [
        studyingEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        newQueueSizeEditor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element
    ].map((el) => el.classList.add("deck-menu-submenu"));
    function makeCardEditor(c) {
        var edDetails = document.createElement("details");
        var edSummary = document.createElement("summary");
        edDetails.style.display = "inline-block";
        edDetails.appendChild(edSummary);
        edDetails.classList.add("cardlist-accordion");
        var edMain = (0, editor_1.swappingTextEditor)([c.content.prompt, c.content.answers.join('|')]);
        edMain.element.style.display = "inline-block";
        edSummary.appendChild(edMain.element);
        var tagsEd = (0, editor_1.singleTextFieldEditor)(c.content.tags.join(','));
        tagsEd.element.placeholder = "tags...";
        edDetails.appendChild(tagsEd.element);
        var cardInfo = document.createElement("a");
        cardInfo.classList.add("sr-card-due-date");
        cardInfo.style.color = "lightgray";
        cardInfo.style.marginLeft = "10px";
        cardInfo.style.marginRight = "10px";
        cardInfo.style.verticalAlign = "middle";
        if (c.intervalMinutes == 0) {
            cardInfo.textContent = "not studied";
        }
        else {
            cardInfo.textContent = `due ${(0, utils_1.getSRFutureDateInfo)(c.due)}`;
        }
        cardInfo.style.display = "block";
        edDetails.appendChild(cardInfo);
        var listenBtn = ((ed) => (0, utils_1.iconButton)("speaker.png", () => {
            var ss = speechEditor.menuToState();
            var tgtText = ed.menuToState()[1];
            (0, speech_1.utter)(tgtText, ss.voice, ss.rate, ss.pitch, () => { });
        }))(edMain);
        listenBtn.style.float = "";
        var listenDiv = document.createElement("div");
        listenDiv.style.overflowY = "visible";
        listenDiv.appendChild(listenBtn);
        edDetails.appendChild(listenDiv);
        return {
            element: edDetails,
            menuToState: () => {
                let tp = edMain.menuToState();
                return {
                    guid: c.guid,
                    content: {
                        prompt: tp[0],
                        answers: tp[1].split('|'),
                        tags: tagsEd.menuToState().split(',').filter((t) => t.length > 0)
                    },
                    due: c.due,
                    intervalMinutes: c.intervalMinutes,
                    auxdata: c.auxdata
                };
            }
        };
    }
    ;
    var cardsEditor = (0, editor_1.multipleEditors)(Object.values(st.cards), () => makeEmptyCard(), makeCardEditor, true, (s, cd) => cd.content.prompt.includes(s) || cd.content.answers.some((a) => a.includes(s)));
    var cardsEditorTitle = document.createElement("h3");
    cardsEditorTitle.textContent = "Cards";
    cardsEditor.element.prepend(cardsEditorTitle);
    cardsEditor.element.classList.add("deck-menu-submenu");
    var components = [
        infoWidget,
        studyingEditor.element,
        initHoursEditor.element,
        correctFactor.element,
        incorrectFactor.element,
        newQueueSizeEditor.element,
        omitTagsCont,
        speechDiv,
        filterEditor.element,
        cardsEditor.element,
    ];
    components.map((el) => contDiv.appendChild(el));
    return {
        element: contDiv,
        menuToState: () => {
            return {
                studying: studyingEditor.menuToState(),
                settings: {
                    initialHours: initHoursEditor.menuToState(),
                    correctFactor: correctFactor.menuToState(),
                    incorrectFactor: incorrectFactor.menuToState(),
                    readCorrectAnswers: speechCheckbox.menuToState(),
                    speechSettings: speechEditor.menuToState(),
                    filterSettings: filterEditor.menuToState(),
                    inactiveTags: omitTagsEditor.menuToState().split(',')
                },
                newQ: (0, spaced_repetition_newqueue_1.emptySRQueue)(newQueueSizeEditor.menuToState()),
                cards: (0, utils_1.makeDict)(cardsEditor.menuToState(), (c) => c.guid),
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new SimpleSpacedRepGen(), simpleSRMenu, "simple-spaced-repetition-deck", "Simple spaced repetition deck", exports.defaultSimpleSRState, "#ffffdd");


/***/ }),

/***/ 192:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gSynth = void 0;
exports.utter = utter;
exports.defaultSpeechSettings = defaultSpeechSettings;
exports.speechSettingsEditor = speechSettingsEditor;
const editor_1 = __webpack_require__(43);
const gSynth = () => { return window.speechSynthesis; };
exports.gSynth = gSynth;
function getVoice(voiceName) {
    var voices = (0, exports.gSynth)().getVoices();
    for (var i in voices) {
        var voice = voices[i];
        if (voice.name == voiceName) {
            return voice;
        }
    }
    return voices[0]; // Default behavior
}
function utter(txt, voice, rate = 1, pitch = 1, callback = () => { }) {
    const utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.voice = getVoice(voice);
    utterThis.rate = rate;
    utterThis.pitch = pitch;
    utterThis.onend = callback;
    // console.log(`Speaking "${txt}"...`);
    (0, exports.gSynth)().speak(utterThis);
}
function defaultSpeechSettings() {
    try {
        var voices = (0, exports.gSynth)().getVoices();
        return {
            voice: voices.length > 0 ? voices[0].name : "",
            rate: 1.0,
            pitch: 1.0
        };
    }
    catch (e) {
        return {
            voice: "",
            rate: 1.0,
            pitch: 1.0
        };
    }
}
defaultSpeechSettings();
function speechSettingsEditor(ss) {
    var voices = (0, exports.gSynth)().getVoices().map((v) => v.name);
    var voiceEditor = (0, editor_1.optionsEditor)(ss.voice, voices, (v) => `${getVoice(v).name} (${getVoice(v).lang})`);
    var rateEditor = (0, editor_1.scrollNumberEditor)("Speech rate: ", ss.rate, 0.5, 2.0, 0.05);
    var pitchEditor = (0, editor_1.scrollNumberEditor)("Speech pitch: ", ss.pitch, 0, 2, 0.05);
    var contDiv = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text-to-speech settings";
    accordion.appendChild(accordionSummary);
    [voiceEditor, rateEditor, pitchEditor].map((ed) => accordion.appendChild(ed.element));
    contDiv.appendChild(accordion);
    return {
        element: contDiv,
        menuToState: () => {
            return {
                voice: voiceEditor.menuToState(),
                rate: rateEditor.menuToState(),
                pitch: pitchEditor.menuToState()
            };
        }
    };
}
// utter("Hello, my name is Albert.", gSynth.getVoices()[0], 1, 1);


/***/ }),

/***/ 36:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getHostname = getHostname;
exports.setRemote = setRemote;
exports.getRemote = getRemote;
exports.setSyncKey = setSyncKey;
exports.getSyncKey = getSyncKey;
exports.validateSyncCreds = validateSyncCreds;
exports.promptForSyncCreds = promptForSyncCreds;
exports.syncUploadDeck = syncUploadDeck;
exports.syncDownloadDeck = syncDownloadDeck;
const utils_1 = __webpack_require__(185);
function getHostname() {
    var host = localStorage.getItem("host");
    if (host === null) {
        host = (0, utils_1.guidGenerator)();
        localStorage.setItem("host", host);
    }
    return host;
}
function setRemote(url) {
    localStorage.setItem("syncserver", url);
}
function getRemote() {
    return localStorage.getItem("syncserver");
}
function setSyncKey(key) {
    localStorage.setItem("synckey", key);
}
function getSyncKey() {
    return localStorage.getItem("synckey");
}
function validateSyncCreds(goodCallback, badCallback) {
    var remote = getRemote();
    var key = getSyncKey();
    try {
        fetch(`${remote}/status`, {
            method: "POST",
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: key })
        }).then(res => res.json())
            .then(res => goodCallback(remote, key))
            .catch(res => badCallback());
    }
    catch (e) {
        badCallback();
    }
}
function promptForSyncCreds() {
    var remote = window.prompt("Enter the URL of your synchronization server.") || "";
    var key = window.prompt("Enter your key with the synchronization server.") || "";
    setRemote(remote);
    setSyncKey(key);
    validateSyncCreds((_, __) => alert("Successfully paired with synchronization server."), () => alert("Error attempting to connect to synchronization server. Try again."));
}
function syncUploadDeck(deck) {
    var badCallback = () => alert("Could not upload deck. Ensure your sync server is set up.");
    var host = getHostname();
    validateSyncCreds((remote, key) => {
        try {
            fetch(`${remote}/put`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host: host, key: key, id: deck.slug, data: JSON.stringify(deck) })
            }).then(res => alert("Deck uploaded successfully."))
                .catch(res => badCallback());
        }
        catch (e) {
            badCallback();
        }
    }, () => badCallback());
}
function syncDownloadDeck(slug, setDeck) {
    var badCallback = () => alert("Could not download deck. Ensure your sync server is set up and that the deck ID is correct.");
    var host = getHostname();
    validateSyncCreds((remote, key) => {
        try {
            fetch(`${remote}/get`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ host: host, key: key, id: slug })
            }).then(res => res.json())
                .then(res => {
                if (confirm("Are you sure you want to download this deck? Any local version will be overwritten.")) {
                    setDeck(res['data']);
                    alert("Deck downloaded successfully.");
                }
            })
                .catch(res => badCallback());
        }
        catch (e) {
            badCallback();
        }
    }, () => badCallback());
}


/***/ }),

/***/ 460:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.defaultTextFilterSettings = void 0;
exports.applyTextFilter = applyTextFilter;
exports.textFilterSelectionMenu = textFilterSelectionMenu;
const editor_1 = __webpack_require__(43);
exports.defaultTextFilterSettings = {
    removeParenDelimited: false,
    removeSqDelimited: false,
    noPunctuation: false,
    smartQuotes: false,
    doubleSpaces: false,
    trimSpaces: false,
    nfc: false
};
function filterSmartQuotes(str) {
    return str.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
function filterDoubleSpaces(str) {
    return str.replaceAll(/\s+/g, " ");
}
function filterHintParens(str) {
    return str.replaceAll(/\([^\)]*\)/g, "");
}
function filterHintSqs(str) {
    return str.replaceAll(/\[[^\]]*\]/g, "");
}
function filterEndSpaces(str) {
    return str.trim();
}
function filterNFC(str) {
    return str.normalize("NFC");
}
function filterPunctuation(str) {
    return str.replaceAll(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}
// Replace missing settings in the case of updates
function repairTextFilterSettings(tfs) {
    for (var i in Object.keys(exports.defaultTextFilterSettings)) {
        var k = Object.keys(exports.defaultTextFilterSettings)[i];
        if (!(k in tfs)) {
            tfs[k] = false;
        }
    }
    return tfs;
}
function applyTextFilter(str, tfs) {
    tfs = repairTextFilterSettings(tfs);
    if (tfs.removeParenDelimited)
        str = filterHintParens(str);
    if (tfs.removeSqDelimited)
        str = filterHintSqs(str);
    if (tfs.noPunctuation)
        str = filterPunctuation(str);
    if (tfs.smartQuotes)
        str = filterSmartQuotes(str);
    if (tfs.doubleSpaces)
        str = filterDoubleSpaces(str);
    if (tfs.nfc)
        str = filterNFC(str);
    if (tfs.trimSpaces)
        str = filterEndSpaces(str);
    return str;
}
function textFilterSelectionMenu(tfs) {
    tfs = repairTextFilterSettings(tfs);
    var container = document.createElement("div");
    var accordion = document.createElement("details");
    var accordionSummary = document.createElement("summary");
    accordionSummary.textContent = "Text filter settings";
    accordion.appendChild(accordionSummary);
    container.appendChild(accordion);
    var noPunctuationEd = (0, editor_1.boolEditor)("Ignore punctuation", tfs.noPunctuation);
    var smartQuotesEd = (0, editor_1.boolEditor)("Ignore smart quotes", tfs.smartQuotes);
    var doubleSpacesEd = (0, editor_1.boolEditor)("Ignore multiple spaces", tfs.doubleSpaces);
    var trimSpacesEd = (0, editor_1.boolEditor)("Ignore leading and trailing spaces", tfs.trimSpaces);
    var nfcEd = (0, editor_1.boolEditor)("NFC-normalize unicode text", tfs.nfc);
    var removeParenEd = (0, editor_1.boolEditor)("Ignore substrings enclosed in (parentheses)", tfs.removeParenDelimited);
    var removeSqEd = (0, editor_1.boolEditor)("Ignore substrings enclosed in [square brackets]", tfs.removeSqDelimited);
    [
        noPunctuationEd.element,
        smartQuotesEd.element,
        doubleSpacesEd.element,
        trimSpacesEd.element,
        nfcEd.element,
        removeParenEd.element,
        removeSqEd.element
    ].map((el) => accordion.appendChild(el));
    return {
        element: container,
        menuToState: () => {
            return {
                removeParenDelimited: removeParenEd.menuToState(),
                removeSqDelimited: removeSqEd.menuToState(),
                noPunctuation: noPunctuationEd.menuToState(),
                smartQuotes: smartQuotesEd.menuToState(),
                doubleSpaces: doubleSpacesEd.menuToState(),
                trimSpaces: trimSpacesEd.menuToState(),
                nfc: nfcEd.menuToState()
            };
        }
    };
}


/***/ }),

/***/ 737:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TimesTableGen = exports.defaultTimesTableState = void 0;
const flashcard_generator_1 = __webpack_require__(808);
const flashcard_sync_generator_1 = __webpack_require__(410);
const flashcard_template_1 = __webpack_require__(791);
const editor_1 = __webpack_require__(43);
const flashcard_deck_1 = __webpack_require__(836);
// The state of the deck when the user is using it for the first time
exports.defaultTimesTableState = {
    minNum: 1,
    maxNum: 12,
    recentlyIncorrect: []
};
class TimesTableGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() {
        return "times-table-generator";
    }
    repairDeckState(st) {
        return st;
    }
    correctEffect(st, c, attempt, resolve) {
        resolve();
    }
    getNextCard(st) {
        var factor1 = Math.floor(Math.random() * (st.maxNum - st.minNum + 1)) + st.minNum;
        var factor2 = Math.floor(Math.random() * (st.maxNum - st.minNum + 1)) + st.minNum;
        return { factor1: factor1, factor2: factor2 };
    }
    updateState(st, c, res) {
        // Keep track of the last 10 multiplication facts to be incorrectly answered
        if (res === flashcard_generator_1.FlashcardResult.Incorrect) {
            st.recentlyIncorrect.unshift([c.factor1, c.factor2]);
            st.recentlyIncorrect = st.recentlyIncorrect.slice(0, 10);
        }
        return st;
    }
    generateCard(st, c) {
        var cardData = [`${c.factor1} × ${c.factor2}`, (c.factor1 * c.factor2).toString()];
        return (0, flashcard_template_1.renderCard)("basic-template", cardData);
    }
    checkAnswer(answer, st, c) {
        return (answer === (c.factor1 * c.factor2).toString());
    }
}
exports.TimesTableGen = TimesTableGen;
function makeTimesTableEditor(st) {
    var minEd = (0, editor_1.scrollNumberEditor)("Minimum factor:", st.minNum, 0, 100, 1);
    var maxEd = (0, editor_1.scrollNumberEditor)("Maximum factor:", st.maxNum, 0, 100, 1);
    var wrongDiv = document.createElement("div");
    wrongDiv.style.backgroundColor = "#ffdddd";
    wrongDiv.classList.add("deck-menu-submenu");
    var wrongList = document.createElement("ul");
    var wrongHdr = document.createElement("b");
    wrongHdr.textContent = "You have not gotten any cards wrong yet.";
    for (var i in Object.keys(st.recentlyIncorrect)) {
        var fct = st.recentlyIncorrect[i];
        var li = document.createElement("li");
        li.textContent = `${fct[0]} × ${fct[1]} = ${fct[0] * fct[1]}`;
        wrongList.appendChild(li);
        wrongHdr.textContent = "You have gotten the following cards wrong:";
    }
    wrongDiv.appendChild(wrongHdr);
    wrongDiv.appendChild(wrongList);
    var edDiv = document.createElement("div");
    edDiv.appendChild(minEd.element);
    edDiv.appendChild(maxEd.element);
    edDiv.appendChild(wrongDiv);
    return {
        element: edDiv,
        menuToState: () => {
            return {
                minNum: minEd.menuToState(),
                maxNum: maxEd.menuToState(),
                recentlyIncorrect: st.recentlyIncorrect
            };
        }
    };
}
(0, flashcard_deck_1.registerDeckType)(new TimesTableGen(), makeTimesTableEditor, "times-table-quizzer", "Times table quizzer", exports.defaultTimesTableState, "#ffcccc");


/***/ }),

/***/ 159:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const flashcard_sync_generator_1 = __webpack_require__(410);
const flashcard_deck_1 = __webpack_require__(836);
const flashcard_template_1 = __webpack_require__(791);
const speech_1 = __webpack_require__(192);
const editor_1 = __webpack_require__(43);
class TranscriptFlashcardGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() { return "transcript-generator"; }
    getNextCard(state) {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return {
            text: dat,
            speechSettings: state.settings.speechSettings
        };
    }
    updateState(state, cardData, correct) {
        return state;
    }
    checkAnswer(ans, st, data) {
        return (ans == data.text);
    }
    generateCard(st, data) {
        return (0, flashcard_template_1.renderCard)("transcript-template", data);
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    ;
    repairDeckState(st) { return st; }
}
function makeTranscriptEditor(state) {
    var speechEd = (0, speech_1.speechSettingsEditor)(state.settings.speechSettings);
    speechEd.element.classList.add("deck-menu-submenu");
    var fileEd = (0, editor_1.fileUploadEditor)("Upload a list of phrases", (s) => { });
    fileEd.element.classList.add("deck-menu-submenu");
    var container = document.createElement("div");
    container.appendChild(speechEd.element);
    container.appendChild(fileEd.element);
    return {
        element: container,
        menuToState: () => {
            var fileInput = fileEd.menuToState();
            return {
                deck: fileInput.length == 0 ? state.deck : fileInput.split('\n').map((x) => x.trim()),
                settings: {
                    speechSettings: speechEd.menuToState()
                }
            };
        }
    };
}
var transcriptionDefaultState = {
    deck: [
        "Hello, how are you?",
        "My name is Bob.",
        "What strange weather we're having.",
        "I'm 50 years old."
    ],
    settings: {
        speechSettings: (0, speech_1.defaultSpeechSettings)()
    }
};
(0, flashcard_deck_1.registerDeckType)(new TranscriptFlashcardGen(), makeTranscriptEditor, "transcription-quizzer", "Transcription quizzer", transcriptionDefaultState);


/***/ }),

/***/ 127:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const flashcard_1 = __webpack_require__(88);
const flashcard_template_1 = __webpack_require__(791);
const speech_1 = __webpack_require__(192);
class TranscriptFlashcardTemplate extends flashcard_template_1.FlashcardTemplate {
    getName() { return "transcript-template"; }
    render(data) {
        var container = document.createElement("div");
        var playBtn = document.createElement("img");
        playBtn.src = "/static/images/speaker.png";
        playBtn.classList.add("transcription-audio-button");
        playBtn.onclick = (e) => {
            var ss = data.speechSettings;
            (0, speech_1.utter)(data.text, ss.voice, ss.rate, ss.pitch);
        };
        container.appendChild(playBtn);
        var fl = new flashcard_1.Flashcard(container, data.text);
        return fl;
    }
}
(0, flashcard_template_1.registerTemplate)(new TranscriptFlashcardTemplate());


/***/ }),

/***/ 18:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KVFlashcardGen = void 0;
const flashcard_generator_1 = __webpack_require__(808);
const flashcard_sync_generator_1 = __webpack_require__(410);
const flashcard_deck_1 = __webpack_require__(836);
const flashcard_template_1 = __webpack_require__(791);
const editor_1 = __webpack_require__(43);
class KVFlashcardGen extends flashcard_sync_generator_1.FlashcardSyncGen {
    getGenName() { return "uniform-key-value"; }
    getNextCard(state) {
        var dat = state.deck[Math.floor(Math.random() * Object.keys(state.deck).length)];
        return dat;
    }
    updateState(state, cardData, correct) {
        if (correct != flashcard_generator_1.FlashcardResult.Unanswered) {
            state.history.push([cardData[0], correct == flashcard_generator_1.FlashcardResult.Correct]);
        }
        return state;
    }
    checkAnswer(ans, state, cardData) {
        return (ans == cardData[1]);
    }
    generateCard(_, data) {
        return (0, flashcard_template_1.renderCard)("basic-template", data);
    }
    correctEffect(_, __, ___, resolve) { resolve(); }
    ;
    repairDeckState(st) { return st; }
}
exports.KVFlashcardGen = KVFlashcardGen;
function makeKVEditor(state) {
    var transEd = (0, editor_1.makeTranslationEditor)(state.deck, (x) => true);
    return {
        element: transEd.element,
        menuToState: () => {
            return {
                deck: transEd.menuToState(),
                history: state.history
            };
        }
    };
}
var kvDefaultState = {
    deck: [
        ["cat", "gato"],
        ["dog", "perro"],
        ["{r0:the dog,the cat} runs", "{r0:el perro,el gato} corre"],
        ["{r0:I want,you want,he wants} {r1:to eat,to drink}", "{r0:quiero,quieres,quiere} {r1:comer,beber}"]
    ],
    history: []
};
(0, flashcard_deck_1.registerDeckType)(new KVFlashcardGen(), makeKVEditor, "key-value-quizzer", "Simple key-value quizzer", kvDefaultState);


/***/ }),

/***/ 185:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getUuid = void 0;
exports.guidGenerator = guidGenerator;
exports.arrayReindex = arrayReindex;
exports.shuffleArr = shuffleArr;
exports.makeDict = makeDict;
exports.downloadText = downloadText;
exports.trivialPromise = trivialPromise;
exports.getSRFutureDateInfo = getSRFutureDateInfo;
exports.showLoadingIcon = showLoadingIcon;
exports.hideLoadingIcon = hideLoadingIcon;
exports.iconButton = iconButton;
// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
function arrayReindex(ls) {
    return ls.filter((_) => true);
}
function shuffleArr(ls) {
    return ls
        .map((v) => ({ val: v, key: Math.random() }))
        .sort((x, y) => x.key - y.key)
        .map((v) => v.val);
}
function makeDict(items, key) {
    var d = {};
    items.map((x) => { d[key(x)] = x; });
    return d;
}
// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function downloadText(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
exports.getUuid = __webpack_require__(571);
function trivialPromise(x) {
    return new Promise((resolve, _) => { resolve(x); });
}
function getSRFutureDateInfo(d) {
    var dateNow = new Date();
    var seconds = Math.floor((new Date(d).getTime() - dateNow.getTime()) / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    if (seconds < 0)
        return "now";
    else if (hours == 0)
        return "in under an hour";
    else if (hours == 1)
        return "in an hour";
    else if (hours < 24)
        return `in ${hours} hours`;
    else if (days == 1)
        return "in a day";
    else
        return `in ${days} days`;
}
function showLoadingIcon() {
    var cont = document.getElementById("flashcard-container");
    var loadingAnim = document.createElement("div");
    [...new Array(12)].map((x) => {
        var subDiv = document.createElement("div");
        loadingAnim.appendChild(subDiv);
    });
    loadingAnim.id = "card-loading-spinner";
    loadingAnim.classList.add("lds-spinner");
    cont.appendChild(loadingAnim);
}
function hideLoadingIcon() {
    var loadingAnim = document.getElementById("card-loading-spinner");
    if (loadingAnim != null)
        loadingAnim.remove();
}
function iconButton(imgUrl, effect) {
    var btn = document.createElement("button");
    var icon = document.createElement("img");
    btn.appendChild(icon);
    btn.classList.add("deck-editor-button");
    icon.src = imgUrl;
    btn.onclick = effect;
    return btn;
}


/***/ }),

/***/ 571:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var lib = __webpack_require__(804);

/** Uin8Array with zero items */
var EMPTY_UINT8_ARRAY = new Uint8Array(0);

/**
 * Generates the Name-Based UUID hashes v3 and v5 according to RFC-4122
 * https://tools.ietf.org/html/rfc4122#section-4.3
 * @param {string} target Hashing target
 * @param {string} [namespace] Some name space within which generation occurs
 * @param {3|5} [version=5] Version of UUID. Available versions is 3 and 5
 * according to RFC-4122. The version is responsible for the hashing algorithm:
 * version 3 uses MD5, and version 5 uses SHA-1. Default is 5.
 * @returns {string} UUID
 */
function generateUuid(target, namespace, version) {
  if (typeof target !== 'string') {
    throw TypeError('Value must be string');
  }

  if (typeof namespace === 'number') {
    return generateUuid(target, undefined, namespace);
  }

  if (version == null) {
    return generateUuid(target, namespace, 5);
  }

  if (version !== 3 && version !== 5) {
    throw TypeError('Version of UUID can be only 3 or 5');
  }

  // Parsing target chars
  var targetCharBuffer = lib.stringToCharBuffer(target);
  var namespaceCharBuffer = typeof namespace === 'string' ? lib.parseUuid(namespace) : EMPTY_UINT8_ARRAY;

  // Concatenation two buffers of strings to one
  var buffer = lib.concatBuffers(namespaceCharBuffer, targetCharBuffer);

  // Getting hash
  var hash = version === 3 ? lib.md5Hash(buffer) : lib.sha1Hash(buffer);

  return lib.hashToUuid(hash, version);
}

/**
 * Export module
 */
module.exports = generateUuid;


/***/ }),

/***/ 804:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var md5 = __webpack_require__(386);
var sha1 = __webpack_require__(668);

/** List of hex digit for fast accessing by index */
var HEX_DIGITS = '0123456789abcdef'.split('');

/** Length of string containing uuid */
var UUID_LENGTH = 36;

/** Regular expression for uuid testing */
var UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Map matching of hex number and corresponding byte */
var HEX_TO_BYTE_MAP = (function () {
  var map = {};

  for (var i = 0; i < 256; i++) {
    var hex = i.toString(16);

    map[hex.length === 1 ? '0' + hex : hex] = i;
  }

  return map;
})();

/**
 * Converts unsigned byte to hex representation
 * @param {number} ubyte The unsigned byte to convert
 * @returns {string} The hex representation
 */
var uint8ToHex = function (ubyte) {
  var first = ubyte >> 4;
  var second = ubyte - (first << 4);

  return HEX_DIGITS[first] + HEX_DIGITS[second];
};

/**
 * Converts unsigned byte buffer to hex string
 * @param {Uint8Array} buf The unsigned bytes buffer
 * @returns {string} The hex string representation
 */
var uint8ArrayToHex = function (buf) {
  var out = '';

  for (var i = 0; i < buf.length; i++) {
    out += uint8ToHex(buf[i]);
  }

  return out;
};

/**
 * Converts string to buffer of char codes
 * @param {string} str The string to parse
 * @returns {Uint8Array} Buffer of char codes
 */
var stringToCharBuffer = function (str) {
  var escapedStr = unescape(encodeURIComponent(str));
  var buffer = new Uint8Array(escapedStr.length);

  for (var i = 0; i < escapedStr.length; i++) {
    buffer[i] = escapedStr[i].charCodeAt(0);
  }

  return buffer;
};

/**
 * Generates MD5 hash from buffer
 * @param {Uint8Array} buf Buffer of char codes
 * @returns {Uint8Array} MD5 hash buffer
 */
var md5Hash = function (buf) {
  return new Uint8Array(md5.arrayBuffer(buf));
};

/**
 * Generates SHA-1 hash from buffer
 * @param {Uint8Array} buf Buffer of char codes
 * @returns {Uint8Array} SHA-1 hash buffer
 */
var sha1Hash = function (buf) {
  return new Uint8Array(sha1.arrayBuffer(buf));
};

/**
 * Concatenates two uint8 buffers
 * @param {Uint8Array} buf1 The first buffer to concatenate
 * @param {Uint8Array} buf2 The second buffer to concatenate
 * @returns {Uint8Array} Concatenation result
 */
var concatBuffers = function (buf1, buf2) {
  var out = new Uint8Array(buf1.length + buf2.length);

  out.set(new Uint8Array(buf1), 0);
  out.set(new Uint8Array(buf2), buf1.byteLength);

  return out;
};

/**
 * Validates UUID
 * @param {string} uuid UUID to validate
 * @return {boolean} Validation result
 */
var validateUuid = function (uuid) {
  return typeof uuid === 'string' && uuid.length === UUID_LENGTH && UUID_REGEXP.test(uuid);
};

/**
 * Parses UUID into a buffer
 * @param {string} uuid UUID to parse
 * @returns {Uint8Array} Ready buffer
 */
var parseUuid = function (uuid) {
  if (!validateUuid(uuid)) {
    throw TypeError('Invalid UUID');
  }

  var buf = new Uint8Array(16);
  var strIndex = 0;
  var bufIndex = 0;

  while (strIndex < uuid.length) {
    if (uuid[strIndex] === '-') {
      strIndex++;
      continue;
    }

    var oct = (uuid[strIndex] + uuid[strIndex + 1]).toLowerCase();
    buf[bufIndex] = HEX_TO_BYTE_MAP[oct];

    bufIndex++;
    strIndex += 2;
  }

  return buf;
};

/**
 * Creates uuid from hash buffer
 * @param {Uint8Array} hashBuffer Hash buffer
 * @param {3|5} version Version of uuid
 * @returns {string} The uuid
 */
var hashToUuid = function (hashBuffer, version) {
  return (
    // The low field of the timestamp
    uint8ArrayToHex(hashBuffer.slice(0, 4)) +
    '-' +
    // The middle field of the timestamp
    uint8ArrayToHex(hashBuffer.slice(4, 6)) +
    '-' +
    // The high field of the timestamp multiplexed with the version number
    uint8ToHex((hashBuffer[6] & 0x0f) | parseInt(version * 10, 16)) +
    uint8ToHex(hashBuffer[7]) +
    '-' +
    // The high field of the clock sequence multiplexed with the variant
    uint8ToHex((hashBuffer[8] & 0x3f) | 0x80) +
    // The low field of the clock sequence
    uint8ToHex(hashBuffer[9]) +
    '-' +
    //  The spatially unique node identifier
    uint8ArrayToHex(hashBuffer.slice(10, 16))
  );
};

module.exports = {
  uint8ToHex: uint8ToHex,
  uint8ArrayToHex: uint8ArrayToHex,
  stringToCharBuffer: stringToCharBuffer,
  md5Hash: md5Hash,
  sha1Hash: sha1Hash,
  concatBuffers: concatBuffers,
  validateUuid: validateUuid,
  parseUuid: parseUuid,
  hashToUuid: hashToUuid,
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(337);

})();

flashcards = __webpack_exports__;
/******/ })()
;