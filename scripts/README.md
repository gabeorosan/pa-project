# Data analysis scripts

## find_aas.py

The purpose of this script is to take in two input files: one with the x,y,z coordinates of the full capsid of a virus, and the
other with coordinates of the points of a relevant point array (PA), and compile a list of the closes amino acid residue to
each PA point for each protein chain in the capsid. In order to accomplish this, I first parsed the coordinates into a
dictionary mapping each chain to the coordinates of each constituent atom. I also parsed the coordinates of the PA file
into a list of [x,y,z] point coordinates. Next, I looped through each chain and used the function scipy.spatial.distance.cdist (scipy is a python
library for scientific computing) to compute the distances from each member point for the chain to each point in the
point array. I stored the minimum distance, along with the corresponding residue and atom, and looped through the sorted
distances to find one where the distance was less than 5 (or any given number) and the residue was not the same as the closest one, storing
that residue if it existed or N/A otherwise. Finally, I wrote the results to an xlsx file, with a row for each PA point
and 5 columns for each PA chain.

Most viral capsids have multiple PAs of interest, so I also wrote a shell script callen run_pas.sh to run find_aas.py with a capsid for
every point array file in a designated folder, and adapted the find_aas.py script so that if the excel file being
written to (named after the capsid) already exists, then the results would be written to a new sheet so that the result
of the script being run on a folder is an excel file with sheets named after each PA and storing their respective
results.

Additionally, since in the script I made use of scipy, pandas, numpy, and openpyxl (all python libraries which must be
installed by the user), I used pyinstaller to convert the script into an executable file find_aas_exec bundled with all
the dependencies mentioned (and adapted the run_pas script accordingly - the one included works with the executable and
not the python file. However, because the executable is slightly slower than the python script given the bundled dependencies, I ended up using the python script in the automated pipeline discussed below.

## custom_pas.ipynb

To allow for customizable analysis of Amino Acid data with specific point arrays, fields, and PDB IDs, custom_pa.ipynb was created. It is set up by default to work with the ids produced from uniq.ipynb (detailed above) stored in unids.txt. It allows you to select whether you want to only consider the closest point in the top row of the closest PA (as in the main dataset), or for example the closest point in the top row of the top 5 closest PAs - getting the closest AA for each. Additionally, you can choose a field - say, tnumber - and have it create a separate excel file for each possible value of that field (i.e. tnumber=1, 3, pt3, etc.). Other data like the total counts of each AA in the full capsid are visualized with pie charts.

## analyze_aas.ipynb

count the number of lines in each PDB file to create id_atoms.txt with atom data for each capsid, and check if the PDB
only has C alpha residues - if it does, include it in only_ca.txt

## uniq.ipynb

uniq.ipynb was made to compile a list of capsids with unique combinations of fields T-number, genome, family, and genus.
This is to try to reduce the effect of the bias introduced by the scope of virus research. Scientists tend to study
viruses that impact humans, and viruses that are easy to study (easy to keep alive and grow in lab conditions, among
other things). Among viruses with overlapping fields, the ones with the lowest resolution were chosen. By default, all
viruses with only C alpha residues are removed. The output is
written to unids_ca.txt and uniq_lres_ca_removed.xlsx

## count_aas.py

This creates aas.json, containing the most common AA for each capsid. Note that this requires the full capsid files
which are too large to attach; this script is included for documentation purposes.

## xlfiles_json.ipynb

This notebook does all the data processing necessary to get from the find_aas and franken output to the db.json databse
file used for the website. The steps (also included at the top of the file) are as follows:

Output from find_aas.py is referred to as "aa data" and from franken_pas.m as "franken data"
- convert .xlsx files in xlfiles/ to .csv files in aas_out/ (find_aas.py output) and franken_out/
- convert the aa data csv files to json
- convert the franken data csv files to json
- create the data dictionary and put json data in
- get fold data from SCOP and write the fold for each Viper pdb_id to the data dictionary
- write RCSB data from families.xlsx and id_genus.txt to data dictionary
- write the gauge points from the point data
- rename some ViperDB genomes for simplicity and consistency purposes
- write aa data of full capsid to data dictionary (aas.json is made by count_aas.py)
- compile data about the closest aa (& other aa within 5 Angstroms) for the closest point for the single top line in franken output, along with other aa data described in the README
- separate into discrete and continuous properties, change data types accordingly, and add the lists to dictionary
- create filters for sorting discrete variables

data used can be found in the data/ directory
and xlfiles (containing franken and find_aas output) can be found here: https://drive.google.com/drive/folders/1Rj01xlWx-2bQfp8KkGH-8K5Hcodx6hJN?usp=sharing

## pipeline

This folder contains the files used to download virus capsids from ViperDB and run franken_pas.m and find_aas.py on
them, compiling the results in xlfiles/

## plot_util.py

this contains functions that are used to make pie charts

## analyze_uniq.ipynb

Make some pie charts comparing AA data from the unique ids to the whole data set.

# Instructions for running find_aas

find_aas is an executable version of find_aas.py (made with pyinstaller)
This script takes in virus capsid and point array PDB files and output creates/overwrites an excel file called
\<virusname\>.xlsx
with the closest Amino Acid in the capsid to each point in the PA for each chain, along with the distance and Atom at that point, and
the nearest other AA if there is one within a given number of Angstroms (defaulting to 5) written to a sheet with the PA file name.

Download the file, then you can made it executable by doing

```bash
chmod +x find_aas
```

then you can call it on a single pa like so with distance 10 Angstroms:

```bash
./find_aas full_2g33.pdb pa_346.pdb 10
```

or you can have it loop through a directory of PA files by using the run_pas file

make it executable
```bash
chmod +x run_pas
```

then run it on a pa directory like so
```bash
./run_pas full_2g33.pdb pa_directory
```

note that just like with find_aas, you can choose to pass a number at the end to specify the max distance for other AAs;
if you don't then it defaults to 5
