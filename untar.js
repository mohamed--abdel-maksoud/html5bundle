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
  this.size = parseInt(this.readCleanString(bstream, 12), 8 /*g chrome wont recognize the string is in octal automatically*/);
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
