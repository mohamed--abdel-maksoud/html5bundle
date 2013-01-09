#!/bin/bash

# usage: ./make-bundle.sh <directory> <output file name>

# bundle = files.tar().lzg()

WD=$PWD
DIR=$1
out=$2
LZG_PATH=lzg    # download and install from http://liblzg.bitsnbites.eu/

cd $DIR
echo "** generating ogg versions of the mp3's"
for i in *.mp3; do
    avconv -i $i -ar 32000 -v quiet ${i/.mp3/.wav}
    oggenc -Q -b 150 ${i/.mp3/.wav}
    rm ${i/.mp3/.wav}
done
echo "** creating $DIR/_bundle.tar"
#../../jsonpack.py * > _bundle.json
tar cf _bundle.tar *
$LZG_PATH -9 _bundle.tar _bundle.lzg
cp _bundle.lzg _bundle.LZG; echo -n "LZG" >> _bundle.LZG # mark end of file to ensure integrity
cd $WD

mv $DIR/_bundle.LZG $out; base64 $out > $out.txt
rm -f $DIR/_bundle.lzg $DIR/_bundle.tar

echo "** done making bundle @ $out.txt"


exit 0
