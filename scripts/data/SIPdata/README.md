# SIP data

This is a repository for all the date files that are used in my
[SIP](https://github.com/gabeorosan/pa-project/blob/master/SIP.md)

## Graphs

Screenshots of graphs, along with the .txt files used to make them, are stored in the all/ and uniq/ directories,
according to the id set used to generate them. 

Each section begins with a line describing the format for how the plots are enumerated.

## Scatter

<ids> | <color> x <x-axis> x <y-axis>

all | tnumber x atoms x (weight, average_radius, resolution)

## Bar 

<ids> |  <x-axis> x <y-axis>

unique | (tnumber, genome, gauge_point, closest_gp_aa) x (count, atoms, average_radius)

## Pie

<ids> | <field>

all | (fold, genome, tnumber, gauge_point, closest_gp_aa, family)

## Heatmap

<ids> | <x-axis> x <y-axis> x <shading>

uniq | tnumber x (gauge_point, closest_gp_aa, genome) x count
uniq | closest_gp_aa x (gauge_point, genome, other_gp_aa) x count
uniq | gauge_point x genome x (count, average_radius, atoms)



