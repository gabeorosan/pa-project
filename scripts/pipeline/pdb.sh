#!/bin/sh
for f in $1/*; do
    if [[ $f == *"gz"* ]]; then
        echo $f
        gunzip $f
    fi
done
for f in $1/*.vdb; do
    mv -- "$f" "${f%.vdb}.pdb"
done

cd $1
for f in *.pdb; do
    echo $f
        makeicos.pl $f
done
for f in *.pdb; do
    echo $f
    if [[ $f != *"xyz"* ]]; then
        extract_coords.pl $f
    fi
done
