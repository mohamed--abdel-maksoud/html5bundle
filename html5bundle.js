// The MIT License (MIT)
// 
// Copyright (c) 2013 Mohamed Abdel Maksoud
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
// modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
// is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
// IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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
