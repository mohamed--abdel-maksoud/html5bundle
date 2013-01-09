all:
	rm -f html5bundle.all.js html5bundle.min.js
	cat *.js > html5bundle.lib.js
	-yui-compressor -o html5bundle.min.js html5bundle.lib.js

clean:
	rm -f html5bundle.lib.js html5bundle.min.js
	
