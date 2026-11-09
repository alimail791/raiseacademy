#!/bin/bash
# ocr.sh <first> <last>
for i in $(seq $1 $2); do
  n=$(printf %03d $i)
  [ -s txt/$n.txt ] && continue
  pdftoppm -f $i -l $i -r 200 -gray -png /mnt/user-data/uploads/ba1d3d1b-wb.pdf img$1 2>/dev/null
  f=$(ls img$1-*.png | head -1)
  tesseract "$f" txt/$n --psm 6 >/dev/null 2>&1
  rm -f img$1-*.png
done
