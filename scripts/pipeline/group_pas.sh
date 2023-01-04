#!/bin/sh
pdb_name="vpa_input/$1.pdb"
folder_name="$1_pas"
mkdir -p pas
mkdir -p pas/$folder_name
for f in *.pdb; do
    if [[ $f == *"pa"* && $f == *$1* ]]; then
        echo $f
        mv $f pas/$folder_name/$f
    fi
done
full_pdb="vpa_input/full_$1.pdb"
./run_pas.sh $full_pdb pas/$folder_name
base_xl="$1.xlsx"
xl_file="full_$1.xlsx"
mv $xl_file xlfiles/
mv $base_xl xlfiles/
