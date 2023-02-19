# SIP data

This is a repository for all the date files that are used in my
[SIP](https://github.com/gabeorosan/pa-project/blob/master/SIP.md)

## Graphs

Screenshots of graphs, along with the .txt files used to make them, are stored in the graphs/ directory
For bar graphs and heatmaps, those with all capsids start with all_  

Each section begins with a line describing the format for how the plots are enumerated. This generally corresponds to
the naming of the graph/data files.

## Scatter

\<ids\> |  \<y-axis\> x \<x-axis\> x \<color\>

all | (weight, average_radius, resolution) x atoms x tnumber 

## Bar 

\<ids\> |  \<y-axis\> x \<x-axis\>

(all, unique) | (count, atoms, average_radius) x (tnumber, genome, gauge_point, closest_gp_aa)

## Pie

\<ids\> | \<field\>

(all, unique) | (fold, genome, tnumber, gauge_point, closest_gp_aa, family)

## Heatmap

\<ids\> | \<y-axis\> x \<x-axis\> x \<shading\>

(all, unique) | count x (closest_gp_aa, gauge_point, genome) x tnumber
(all, unique) | count x (gauge_point, genome, other_gp_aa) x closest_gp_aa
unique | (count, average_radius, atoms) x genome x gauge_point

