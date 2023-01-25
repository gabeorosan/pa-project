# Pipeline

This folder contains the files used to download virus capsids from ViperDB and run franken_pas.m and find_aas.py on
them, compiling the results in xlfiles/

## dl_ids.py

This downloads the ViperDB coordinates of all the ids in a given text file

## makeicos.pl

Create the full capsid from a given AU pdb file

## extract_coords.pl

get the xyz coordinate file for a given pdb file

## extract.py

This runs makeicos.pl and extract_coords.pl on each of the downloaded capsids and groups them into the vpa_input folder

## pas_from_ids.sh

This runs find_aas.py and franken_pas.m on all of the capsids in a given text file in vpa_input/

## dl_to_pas.sh

Takes in a text file with newline-delimited PDB ids and run dl_ids.py, extract.py, and pas_ids.py, on all downloaded
coordinates, essentially going straight from a PDB id list to all the collected data.

## find_aas.py

Takes in a full capsid file and PA file and computes a list of the closest AA residue to each point in the PA. More
details [here](https://github.com/gabeorosan/vquery/blob/master/scripts/README.md#find_aaspy)

## franken_pas.m

Matlab script, basically frankencode (gets GP & RMSD data) but also writes the top 5 PA coordinates to pdb files.

## group_pas.sh

Organizes the PA output from franken_pas.m in folders and runs find_aas.py on each of the capsids in vpa_input/

## pas_ids.sh

runs pas_from_ids.sh, which runs franken_pas.m and group_pas.sh on all ids in a given text file

## run_pas.sh

This runs find_aas.py on all the pas for a given virus
