#!/bin/bash
mat="../../../Applications/MATLAB_R2018b.app/bin/matlab"
filename=$1

while read line; do
echo "$line"	
file_url="vpa_input/$line.pdb"
res=$(pdb_info.pl $file_url)
echo "res: $res"
searchstring="Tnum"
app_line="${searchstring} ${res#*$searchstring}"
echo "app_line: $app_line"
script="clear all;clc;close all;$app_line;pdbid = '$line'"
echo $script | tee loadcapsid.m
$mat -nodisplay -nosplash -nodesktop -r "run('franken_pas.m');exit;"
if [ -e $line.xlsx ]; then
    ./group_pas.sh $line
else
    echo $line >> errors.txt
fi
done < $filename
