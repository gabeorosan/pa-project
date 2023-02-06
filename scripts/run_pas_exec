#!/bin/sh
for f in $2/*; do
    if [[ $f == *"pa"* ]]; then
        echo $f
        ./find_aas_exec $1 $f
    fi
done
