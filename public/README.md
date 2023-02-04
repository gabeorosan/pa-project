# Website Usage

## ids

The 'ids included' option above the graph buttons allows you do limit the dataset to certain
[PDB_IDs](https://www.rcsb.org/docs/general-help/identifiers-in-pdb). By default, all ids are included - the full
dataset. 'unique' refers to a specific list of 195 capsids with unique combinations of fields T-number, genome, family, and
genus which can be found [here](https://github.com/gabeorosan/pa-project/blob/master/scripts/data/unids.txt). Additionally
the 'custom' option lets you upload your own newline-delimited text file with PDB IDS to include (all others will be
filtered out).

## Search

Clicking on the magnifying glass in the top left lets yoou search for the data of a specific virus capsid by its PDB id.
Simply type in the id (make sure it is in the ids that make up the dataset - see above) and you will get each of the
fields and values, separated by a colon, from the capsid object.

## Graphs

Clicking on a chart will create a new graph. After creating a graph, click the info icon on the far left to get detailed
information about each specific graph. Graphs are initialized with random selections for x and y axes, and no filters;
click on the dropdowns on each axis to change them. All graphs can be dragged & resized, and the axis dropdowns can be dragged.

## Filters

After creating a graph, a filter bar along the top will be created. There is a filter dropdown checklist for each
property of viral capsids in the database. By default, all values are included (even missing), but if you check a certain value then
only viruses with that value will be graphed; checking multiple values will let viruses with any of the checked values
be included. This means clicking select all will exclude the capsids which have that field missing.

Also on the filter bar you will find the delete button and a download button, which generates a semicolon &
newline-delimited (semicolon for separating coordinates, newline for points) text
file with the data used to generate the graph (varies by the graph, but for example the scatter plot gives you
'x-coordinate;y-coordinate;value;id' on each line correspinding to one point).

## Fields

What follows is a detailed description of all of the data fields. They are grouped into three categories:
[ViperDB](https://viperdb.org/) data,
[RCSB](https://www.rcsb.org/) data, [SCOP](https://scop.mrc-lmb.cam.ac.uk/) fold data, and generated data

## [ViperDB](https://viperdb.org/)

- average_radius (Å): The 'Ave' Radius value on Viper for the capsid
- tnumber: The triangulation number <a
href='https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7150055/#:~:text=The%20triangulation%20number%20(T)%20indicates,3%2C%20and%20T%20%3D%204.'>T-Number</a>
can be thought of as describing how many proteins form the asymmetric unit of a capsid
- resolution (Å): Resolution of the shell coordinate reconstruction
- family: Family of the virus
- genus: Genus of the virus
- genome: Genome of the virus (for uniformity, viruses were grouped into either ssRNA, ssDNA, dsRNA, dsDNA, or NA meaning
other)

## [RCSB](https://www.rcsb.org/)

- atoms: Atom Count (non-hydrogen atoms)
- weight (kDa): Total Structure Weight - molecular weight in all non-hydrogen atoms. Hydrogen atoms are included for the
charged state in ARG, HIS & LYS residues.
- deposited_polymer_monomer_count: Deposited Residue Count - Number of all polymer monomer residues
- polymer_molecular_weight_maximum: Maximum molecular weight of polymers
- polymer_molecular_weight_minimum: Minimum molecular weight of polymers

## [SCOP](https://scop.mrc-lmb.cam.ac.uk/)

- fold: SCOP download files were used to map viruses to their folds described in [Nasir &
Caetano-Anollés, 2017](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5344890/). This was done by finding the string 
corresponding to the folds in Nasir, finding all the SCOP IDS which map to each string, then 
getting PDB IDS of viruses containing those SCOP IDS.

## [Generated data](https://github.com/gabeorosan/pa-project/blob/master/SIP.md)

the gauge point and the top 5 point arrays for each capsid were found with
[franken_pas.m](https://github.com/gabeorosan/pa-project/blob/master/scripts/pipeline/franken_pas.m) (pipeline description
in parent directory)

- gauge_point: The [gauge point](https://www.mdpi.com/1999-4915/12/4/467) of the capsid

amino acid data distance calculations were done with
[find_aas.py](https://github.com/gabeorosan/pa-project/blob/master/scripts/find_aas.py)

- closest_aa: The AA with lowest distance from any point in any of the top 5 PAs (point arrays)  
- other_aa: Another AA which was within 5 Angstroms of closest_aa (NA if none)  
- closest_gp_aa: The AA with lowest distance from the gauge point in the closest PA  
- other_gp_aa: Another AA which was within 5 Angstroms of closest_gp_aa (NA if none)  
- common_gauge_aa: The most common AA from those with distance less than 5 (even if not closest - including other_aa) from any point from the top PA  

- most_common_aa: The most frequent AA in the full capsid (generated using
[makeicos.pl](https://github.com/gabeorosan/pa-project/blob/master/scripts/pipeline/makeicos.pl)


