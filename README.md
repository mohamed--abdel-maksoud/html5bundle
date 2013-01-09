html5bundle
===========
Bundle all your web app data (game levels, images, audio, json, xml ...) files in a single file!

Usage
------
- Creating bundles:
  - Make sure you have the following software:
    1. liblzg (see CREDITS)
    2. Linux utilities: `tar`, `avconv`, `oggenc`, `base64`
  - Place all your bundle files in a directory, say $bundle_files_dir
  - execute

        `make-bundle.sh $bundle_files_dir <bundle-name>`
    this will generate <bundle-name>.txt
   
- Decoding bundles in your JavaScript app:

  check `test.html`


CREDITS
-------
html5bundle is developed on top of the following awesome libraries:
- tar decoder was taken from the `bitjs` project http://code.google.com/p/bitjs/
- Base64 encoder was taken from Pedro Ladaria's javascript wave decoder http://codebase.es/riffwave/
- Compression and decompression was supported by Marcus Geelnard's `liblzg` http://liblzg.bitsnbites.eu/
