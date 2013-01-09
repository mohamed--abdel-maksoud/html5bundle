var FastBase64 = {

    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],

    Init: function() {
        for (var i=0; i<4096; i++) {
            this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3F];
        }
    },

    Encode: function(src) {
        var len = src.length;
        var dst = '';
        var i = 0;
        while (len > 2) {
            n = (src[i] << 16) | (src[i+1]<<8) | src[i+2];
            dst+= this.encLookup[n >> 12] + this.encLookup[n & 0xFFF];
            len-= 3;
            i+= 3;
        }
        if (len > 0) {
            var n1= (src[i] & 0xFC) >> 2;
            var n2= (src[i] & 0x03) << 4;
            if (len > 1) n2 |= (src[++i] & 0xF0) >> 4;
            dst+= this.chars[n1];
            dst+= this.chars[n2];
            if (len == 2) {
                var n3= (src[i++] & 0x0F) << 2;
                n3 |= (src[i] & 0xC0) >> 6;
                dst+= this.chars[n3];
            }
            if (len == 1) dst+= '=';
            dst+= '=';
        }
        return dst;
    }, // end Encode


    Decode: function(text) {

        text = text.replace(/\s/g,"");

        if(!(/^[a-z0-9\+\/\s]+\={0,2}$/i.test(text)) || text.length % 4 > 0){
            throw new Error("Not a base64-encoded string.");
        }

        //local variables
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            cur, prev, digitNum,
            i=0,
            result = [];

        text = text.replace(/=/g, "");

        while(i < text.length){

            cur = digits.indexOf(text.charAt(i));
            digitNum = i % 4;

            switch(digitNum){

                //case 0: first digit - do nothing, not enough info to work with

                case 1: //second digit
                    result.push((prev << 2 | cur >> 4));
                    break;

                case 2: //third digit
                    result.push(((prev & 0x0f) << 4 | cur >> 2));
                    break;

                case 3: //fourth digit
                    result.push(((prev & 3) << 6 | cur));
                    break;
            }

            prev = cur;
            i++;
        }

        return result;
    }
    
}

FastBase64.Init();


;(function( namespace, undefined ){  
    "use strict"
    // private methods
    //
    var binary2str = function (bdata) {
        var str = '', byte2hex = function(n) {
            return (n<=16?"0":"") + (n & 0xff).toString(16);
        };
        //alert(bdata.length)
        for (var i=0; i<16; i+=2) str += byte2hex(bdata[i+1])+byte2hex(bdata[i])+ ' ';
        str += '\n...\n';
        for (var i=0; i<16; i+=2) str += byte2hex(bdata[i+1+bdata.length/2])+byte2hex(bdata[i+bdata.length/2])+ ' ';
        str += '\n...\n';
        for (var i=0; i<16; i+=2) str += byte2hex(bdata[i+1+bdata.length-32])+byte2hex(bdata[i+bdata.length-32])+ ' ';
        str += "\n";
        for (var i=0; i<16; i+=2) str += byte2hex(bdata[i+1+bdata.length-16])+byte2hex(bdata[i+bdata.length-16])+ ' ';
        return (str);
    };
    
    var object2str = function (obj) {
        var str = '', i;
        for (i in obj) str += i+", ";
        return (str);
    };
    
    
    var readUTF8String = function (bytes) {
        var ix = 0;

        if( bytes.slice(0,3) == "\xEF\xBB\xBF") {
            ix = 3;
        }

        var string = "";
        for( ; ix < bytes.length; ix++ ) {
            var byte1 = bytes[ix];
            if( byte1 < 0x80 ) {
                string += String.fromCharCode(byte1);
            } else if( byte1 >= 0xC2 && byte1 < 0xE0 ) {
                var byte2 = bytes[++ix];
                string += String.fromCharCode(((byte1&0x1F)<<6) + (byte2&0x3F));
            } else if( byte1 >= 0xE0 && byte1 < 0xF0 ) {
                var byte2 = bytes[++ix];
                var byte3 = bytes[++ix];
                string += String.fromCharCode(((byte1&0xFF)<<12) + ((byte2&0x3F)<<6) + (byte3&0x3F));
            } else if( byte1 >= 0xF0 && byte1 < 0xF5) {
                var byte2 = bytes[++ix];
                var byte3 = bytes[++ix];
                var byte4 = bytes[++ix];
                var codepoint = ((byte1&0x07)<<18) + ((byte2&0x3F)<<12)+ ((byte3&0x3F)<<6) + (byte4&0x3F);
                codepoint -= 0x10000;
                string += String.fromCharCode(
                    (codepoint>>10) + 0xD800,
                    (codepoint&0x3FF) + 0xDC00
                );
            }
        }

        return string;
    };
    if (typeof Audio != 'function') {   // if Audio is not defined globally
        //alert('faking audio')
        var Audio = function (src) {
            this.audio = document.createElement('audio');
            if (src) this.audio.setAttribute("src", src);
            this.src = src;
            this.audio.setAttribute("preload", "preload");
            this.audio.load()
            this.duration = this.audio.duration
            this.play = function() {this.audio.play();}
            this.pause = function() {this.audio.pause();}
            this.canPlayType = function (t){return ( typeof this.audio.canPlayType == 'function' && this.audio.canPlayType(t)!=="");}
        }
    }
    namespace.Audio = Audio
    
    // public methods
    //
    namespace.Bundle = function() {
        
        var _data, _keys, files, fnames, This = this;
        
        function decipher() {
            
            var s,i;
            // TODO deciphering algorithm, if needed, using _keys
            // use the trailing LZG to trim any padding
            s = "LZG"; i = _data.lastIndexOf(s.charCodeAt(2));
            if (_data[i-1]==s.charCodeAt(1) && _data[i-2]==s.charCodeAt(0)) _data.splice(i-2);
        }
        
        function decompress() {
            var lzg = new lzgmini();
            lzg.decode(_data);
            _data = lzg.getByteArray();
            _data = untar(_data);
        }
        
        var organise = function() {
            var ext, i, base, fname, audio = new Audio();
            This.files = {};
            This.fnames = [];
            for (fname in _data) {
                //alert(object2str(audio))
                //alert(object2str(audio.attributes))
                //alert(typeof audio[0].play)
                This.fnames.push(fname)
                i = fname.lastIndexOf('.'); ext = fname.substring(i+1), base=fname.substring(0,i);
                if (base in This.files) continue;
                switch(ext.toLowerCase())
                {
                    case 'mp3':
                        if (audio)  // audio is supported
                        {
                            if (audio.canPlayType('audio/mpeg'))
                            {
                                This.files[base] = new Audio("data:audio/mpeg;base64,"
                                    + FastBase64.Encode(_data[fname].fileData)
                                    );
                            }
                        }
                        break;
                    case 'ogg':
                        if (audio)  // audio is supported
                        {

                            if (audio.canPlayType('audio/ogg'))
                            {
                                This.files[base] = new Audio("data:audio/ogg;base64,"
                                    + FastBase64.Encode(_data[fname].fileData)
                                    );
                            }
                        }
                        break;
                    case 'jpg':
                    case 'png':
                    case 'gif':
                    case 'bmp':
                        This.files[fname] = new Image()
                        This.files[fname].src = "data:image/"+(ext=='jpg'?'jpeg':ext)+";base64,"
                            + FastBase64.Encode(_data[fname].fileData)
                        break;
                        
                    default: // assume it's text
                        This.files[fname] = readUTF8String(_data[fname].fileData)
                        //String.fromCharCode.apply(null,files[fname].fileData);
                        break;
                }
            }// for each file in the bundle
            console.log(This.fnames)
            _data = null;
            return This.files;
        }
        
        This.files = {};
        This.fnames = [];
        
        This.start = function (url, onComplete, onProgress, onError) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            xhr.onload = function(e) {
                var files;
                if (this.status == 200) {
                    _data = FastBase64.Decode(this.responseText);
                    decipher();
                    decompress();
                    files = organise();
                    if (onComplete)  onComplete(files);
                }
            }
            xhr.send();
        };
    };
    
})(window.html5bundle = window.html5bundle || {});
// -*- mode: javascript; tab-width: 2; indent-tabs-mode: nil; -*-

//------------------------------------------------------------------------------
// This file is part of liblzg.
//
// Copyright (c) 2010 Marcus Geelnard
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//    claim that you wrote the original software. If you use this software
//    in a product, an acknowledgment in the product documentation would
//    be appreciated but is not required.
//
// 2. Altered source versions must be plainly marked as such, and must not
//    be misrepresented as being the original software.
//
// 3. This notice may not be removed or altered from any source
//    distribution.
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Description
// -----------
// This is a JavaScript implementation of the LZG decoder.
//
// Example usage:
//
//   var lzg = new lzgmini();
//   lzg.decode(compressedStr);
//   var str = lzg.getStringUTF8();
//
// The lzgmini class provides a few different methods for retrieving the
// decoded data:
//
//   getByteArray()    - Get the raw (numeric) byte array.
//   getStringLatin1() - Get the data as a string, assuming it is encoded in
//                       8-bit Latin 1 (ISO-8859-1, also works with ASCII).
//   getStringUTF8()   - Get the data as a string, assuming it is encoded in
//                       UTF-8 format.
//------------------------------------------------------------------------------

function lzgmini() {

  // Constants
  var LZG_HEADER_SIZE = 16;
  var LZG_METHOD_COPY = 0;
  var LZG_METHOD_LZG1 = 1;

  // LUT for decoding the copy length parameter
  var LZG_LENGTH_DECODE_LUT = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,
                               20,21,22,23,24,25,26,27,28,29,35,48,72,128];

  // Decoded data (produced by the decode() method)
  var outdata = null;

  // Calculate the checksum
  var calcChecksum = function(data) {
    var a = 1;
    var b = 0;
    var i = LZG_HEADER_SIZE;
    while (i < data.length)
    {
      a = (a + (data[i] & 0xff)) & 0xffff;
      b = (b + a) & 0xffff;
      i++;
    }
    return (b << 16) | a;
  }

  // Decode LZG coded data. The function returns the size of the decoded data.
  // Use any of the get* methods to retrieve the decoded data.
  this.decode = function(data) {
    // Start by clearing the decompressed array in this object
    outdata = null;

    // Check magic ID
    if ((data.length < LZG_HEADER_SIZE) || (data[0] != 76) ||
         (data[1] != 90) ||  (data[2] != 71))
    {
        alert('wrong magic ID')
        return 0;
    }

    // Calculate & check the checksum
    var checksum = ((data[11] & 0xff) << 24) |
                   ((data[12] & 0xff) << 16) |
                   ((data[13] & 0xff) << 8) |
                   (data[14] & 0xff);
    if (calcChecksum(data) != checksum)
    {
       alert('wrong checksum');
       return 0;
    }

    // Check which method to use
    var method = data[15] & 0xff;
    if (method == LZG_METHOD_LZG1)
    {
      // Get marker symbols
      var m1 = data[16] & 0xff;
      var m2 = data[17] & 0xff;
      var m3 = data[18] & 0xff;
      var m4 = data[19] & 0xff;

      // Main decompression loop
      var symbol, b, b2, b3, len, offset;
      var dst = new Array();
      var dstlen = 0;
      var k = LZG_HEADER_SIZE + 4;
      var datalen = data.length;
      while (k <= datalen)
      {
        symbol = data[k++] & 0xff;
        if ((symbol != m1) && (symbol != m2) && (symbol != m3) && (symbol != m4))
        {
          // Literal copy
          dst[dstlen++] = symbol;
        }
        else
        {
          b = data[k++] & 0xff;
          if (b != 0)
          {
            // Decode offset / length parameters
            if (symbol == m1)
            {
              // marker1 - "Distant copy"
              len = LZG_LENGTH_DECODE_LUT[b & 0x1f];
              b2 = data[k++] & 0xff;
              b3 = data[k++] & 0xff;
              offset = (((b & 0xe0) << 11) | (b2 << 8) | b3) + 2056;
            }
            else if (symbol == m2)
            {
              // marker2 - "Medium copy"
              len = LZG_LENGTH_DECODE_LUT[b & 0x1f];
              b2 = data[k++] & 0xff;
              offset = (((b & 0xe0) << 3) | b2) + 8;
            }
            else if (symbol == m3)
            {
              // marker3 - "Short copy"
              len = (b >> 6) + 3;
              offset = (b & 63) + 8;
            }
            else
            {
              // marker4 - "Near copy (incl. RLE)"
              len = LZG_LENGTH_DECODE_LUT[b & 0x1f];
              offset = (b >> 5) + 1;
            }

            // Copy the corresponding data from the history window
            for (i = 0; i < len; i++)
            {
              dst[dstlen] = dst[dstlen-offset];
              dstlen++;
            }
          }
          else
          {
            // Literal copy (single occurance of a marker symbol)
            dst[dstlen++] = symbol;
          }
        }
      }

      // Store the decompressed data in the lzgmini object for later retrieval
      outdata = dst;
      return dstlen;
    }
    else if (method == LZG_METHOD_COPY)
    {
      // Plain copy
      var dst = new Array();
      var dstlen = 0;
      var datalen = data.length;
      for (var i = LZG_HEADER_SIZE; i < datalen; i++)
      {
        dst[dstlen++] = data[i] & 0xff;
      }
      outdata = dst;
      return dstlen;
    }
    else
    {
      // Unknown method
      alert('unknown method');
      return 0;
    }
  }

  // Get the decoded byte array
  this.getByteArray = function()
  {
    return outdata;
  }

  // Get the decoded string from a Latin 1 (or ASCII) encoded array
  this.getStringLatin1 = function()
  {
    var str = "";
    if (outdata != null)
    {
      var charLUT = new Array();
      for (var i = 0; i < 256; ++i)
        charLUT[i] = String.fromCharCode(i);
      var outlen = outdata.length;
      for (var i = 0; i < outlen; i++)
        str += charLUT[outdata[i]];
    }
    return str;
  }

  // Get the decoded string from an UTF-8 encoded array
  this.getStringUTF8 = function()
  {
    var str = "";
    if (outdata != null)
    {
      var charLUT = new Array();
      for (var i = 0; i < 128; ++i)
        charLUT[i] = String.fromCharCode(i);
      var c;
      var outlen = outdata.length;
      for (var i = 0; i < outlen;)
      {
        c = outdata[i++];
        if (c < 128)
        {
          str += charLUT[c];
        }
        else
        {
          if ((c > 191) && (c < 224))
          {
            c = ((c & 31) << 6) | (outdata[i++] & 63);
          }
          else
          {
            c = ((c & 15) << 12) | ((outdata[i] & 63) << 6) | (outdata[i+1] & 63);
            i += 2;
          }
          str += String.fromCharCode(c);
        }
      }
    }
    return str;
  }
}

/**
 * untar.js
 *
 * Copyright(c) 2011 Google Inc.
 *
 * Reference Documentation:
 *
 * TAR format: http://www.gnu.org/software/automake/manual/tar/Standard.html
 */


// Progress variables.
var currentFilename = "";
var currentFileNumber = 0;
var currentBytesUnarchivedInFile = 0;
var currentBytesUnarchived = 0;
var totalUncompressedBytesInArchive = 0;
var totalFilesInArchive = 0;


// wrap JS array as bitstream
var BitStream = function (arr) {
    // arr is an array of integers
    this.array = arr;
    this.ptr = 0;
    this.readBytes = function(s) {
        if ((this.ptr+s)>this.array.length)   return null;
        this.ptr += s;
        return this.array.slice(this.ptr-s, this.ptr-1);
    }
    this.readString = function(s) {
        return String.fromCharCode.apply(null, this.readBytes(s));
    }
    this.peekBytes = function(s) {
        return this.array.slice(this.ptr, this.ptr+s-1);
    }
    this.peekNumber = function( n ) {
        var result = 0;
        // read from last byte to first byte and roll them in
        var curByte = this.ptr + n - 1;
        while (curByte >= this.ptr) {
            result <<= 8;
            result |= (this.array[curByte]&0xff);
            --curByte;
        }
        return result;
    };

    this.eof = function () {
        return this.ptr >= this.array.length;
    }
};



// takes a ByteStream and parses out the local file information
var TarLocalFile = function(bstream) {
  this.info = function (s) { console.log(s); }

  // Removes all characters from the first zero-byte in the string onwards.
  this.readCleanString = function(bstr, numBytes) {
    var str = bstr.readString(numBytes);
    var zIndex = str.indexOf(String.fromCharCode(0));
    return zIndex != -1 ? str.substr(0, zIndex) : str;
  };


  this.isValid = false;

  // Read in the header block
  this.name = this.readCleanString(bstream, 100);
  this.mode = this.readCleanString(bstream, 8);
  this.uid = this.readCleanString(bstream, 8);
  this.gid = this.readCleanString(bstream, 8);
  this.size = parseInt(this.readCleanString(bstream, 12));
  this.mtime = this.readCleanString(bstream, 12);
  this.chksum = this.readCleanString(bstream, 8);
  this.typeflag = this.readCleanString(bstream, 1);
  this.linkname = this.readCleanString(bstream, 100);
  this.maybeMagic = this.readCleanString(bstream, 6);

  if (this.maybeMagic == "ustar") {
  	this.version = this.readCleanString(bstream, 2);
  	this.uname = this.readCleanString(bstream, 32);
  	this.gname = this.readCleanString(bstream, 32);
  	this.devmajor = this.readCleanString(bstream, 8);
  	this.devminor = this.readCleanString(bstream, 8);
  	this.prefix = this.readCleanString(bstream, 155);

  	if (this.prefix.length) {
      this.name = this.prefix + this.name;
  	}
  	bstream.readBytes(12); // 512 - 500
  } else {
  	bstream.readBytes(255); // 512 - 257
  }

  // Done header, now rest of blocks are the file contents.
  this.filename = this.name;
  this.fileData = null;

  this.info("Untarring file '" + this.filename + "'");
  this.info("  size = " + this.size);
  this.info("  typeflag = " + this.typeflag);

  // A regular file.
  if (this.typeflag == 0) {
  	this.info("  This is a regular file.");
  	var sizeInBytes = parseInt(this.size);
  	this.fileData = bstream.peekBytes(this.size); //new Uint8Array(bstream.bytes.buffer, bstream.ptr, this.size);
    if (this.name.length > 0 && this.size > 0 && this.fileData) {
      this.isValid = true;
  	}

    bstream.readBytes(this.size);

  	// Round up to 512-byte blocks.
  	var remaining = 512 - this.size % 512;
  	if (remaining > 0 && remaining < 512) {
      bstream.readBytes(remaining);
  	}
  } else if (this.typeflag == 5) {
  	 this.info("  This is a directory.")
  }
};

function untar(bytearray) {
    var ret = {}, bstream = new BitStream(bytearray), f, i=0;
    while(bstream.peekNumber(4)!=0) {
        f = new TarLocalFile(bstream);
        if (f && f.isValid && f.filename)
            ret[f.filename] = f;
        if (bstream.eof()) return ret;
        if (i++>99999)    return ret;
    }
    return ret;
}
