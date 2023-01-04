# Pipeline

This folder contains the files used to download virus capsids from ViperDB and run franken_pas.m and find_aas.py on
them, compiling the results in xlfiles/

## dl_ids.py

This downloads the ViperDB coordinates of all the ids in a given text file

## makeicos.pl

## extract_coords.pl

## extract.py

This runs makeicos.pl and extract_coords.pl on each of the downloaded capsids and groups them into the vpa_input folder

## pas_from_ids.sh

This runs find_aas.py and franken_pas.m on all of the capsids in a given text file in vpa_input/

## dl_to_pas.sh

## find_aas.py

## franken_pas.m

## group_pas.sh

## pas_ids.sh

## run_pas.sh

This runs find_aas.py on all the pas for a given virus
