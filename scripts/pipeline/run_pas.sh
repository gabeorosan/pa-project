#!/bin/sh
echo $2
for f in $2/*; do
    if [[ $f == *"pa"* ]]; then
        echo $f
        python3 find_aas.py $1 $f
    fi
done

