# SIP data

This is a repository for all the date files that are used in my
[SIP](https://github.com/gabeorosan/pa-project/blob/master/SIP.md)

## Graphs

Screenshots of graphs, along with the .txt files used to make them, are stored in the all/ and uniq/ directories,
according to the id set used to generate them. 

## Scatter

Scatter plots are enumerated in the following format:

<color> x <x-axis> x <y-axis>

(tnumber, genome, gauge_point) x deposited_polymer_monomer_count x (polymer_molecular_weight_minumum, polymer_molectular_weight_maximum)
(tnumber, genome, gauge_point) x atoms x (weight, average_radius, resolution)

## Bar 

Bar plots are enumerated as:

<x-axis> x <y-axis>

(tnumber, genome, gauge_point, closest_gp_aa, family, genus) x (count, atoms, resolution, average_radius)

## Pie

<field>

(fold, genome)

## Heatmap

tnumber x (gauge_point, closest_gp_aa, genome) x count
closest_gp_aa x (gauge_point, genome, other_gp_aa) x count
gauge_point x (tnumber, closest_gp_aa, genome) x (count, average_radius)



