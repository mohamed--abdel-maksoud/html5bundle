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


