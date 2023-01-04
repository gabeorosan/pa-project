#!/usr/bin/perl -w
use File::Copy;
use File::Path;
use File::Basename;
#use strict;

open(A,"$ARGV[0]");
my $rot_mat_file = glob('~/virusresearch/PerlScripts/rot60_dw.txt');


my $au_pdb_name = $ARGV[0];
my $file = "full_$au_pdb_name";
my @au_pdb_data = &read_pdb_file($au_pdb_name); # ALL DATA
my @array = @au_pdb_data;
my $iasym	= @array;
print "number of atoms = $iasym\n";

while(<A>){
    next if ! /^ATOM/;
    $icomp++;
    if ($icomp <= $iasym) {
		$i++;
		chomp($_);
		$x[$i] = substr($_,30,8);
		$y[$i] = substr($_,38,8);
		$z[$i] = substr($_,46,8);
		$name[$i]= substr($_,12,4);
		$resname[$i]= substr($_,17,3);
		$resseq[$i]= substr($_,22,4);
		$chainid[$i]=substr($_,21,1);
		$serial[$i]=substr($_,6,5);
		$altloc[$i]=substr($_,16,1);
		$icode[$i]=substr($_,26,1);
		if(length($_)<76) {
	    	$segid[$i] = "    ";}
		else {
		    $segid[$i]=substr($_,72,4);
		}
    }
}

$natom=$i;      
$tot=1.00;
$i=0;
$nmat=0;
$lseg = 1; # DPW: default 0

if ($segid[$natom] !~ /\w/ ) { $lseg = 1;}
#if ($segid[$natom]  == /^\s$/ ) { $lseg = 1;}
open(B,"$rot_mat_file");
while(<B>) {
	next if  /^\s+$/ || /^#/ ;
	@tmp = split;
	$nmat++;
	$mat[1][$nmat] = $tmp[0];
	$mat[2][$nmat] = $tmp[1];
	$mat[3][$nmat] = $tmp[2];
}

$num_mat=$nmat/4;
open( PDBOUT, ">$file" );
for $imat ( 1..$num_mat ) {
    for $i ( 1..$natom ) {

    $xrot[$i]=$mat[1][4*$imat-3]*$x[$i]+$mat[2][4*$imat-3]*$y[$i]+$mat[3][4*$imat-3]*$z[$i];

    $yrot[$i]=$mat[1][4*$imat-2]*$x[$i]+$mat[2][4*$imat-2]*$y[$i]+$mat[3][4*$imat-2]*$z[$i];

    $zrot[$i]=$mat[1][4*$imat-1]*$x[$i]+$mat[2][4*$imat-1]  *$y[$i]+$mat[3][4*$imat-1]*$z[$i];

    $xrot[$i] += $mat[1][4*$imat];
    $yrot[$i] += $mat[2][4*$imat];
    $zrot[$i] += $mat[3][4*$imat];

    if($lseg){$segid[$i] = "M".$imat;}

    printf PDBOUT
	("ATOM  %5d %4s%1s%-4s%1s%4d%1s   %8.3f%8.3f%8.3f%6.2f%6.2f      %-4s\n",
	$serial[$i],$name[$i],$altloc[$i],$resname[$i],$chainid[$i],$resseq[$i]
	,$icode[$i],$xrot[$i],$yrot[$i],$zrot[$i],$tot,$tot,$segid[$i]);
    }
#    print "TER\n";
}


#foreach my $i (1..$natoms_au) {
#        print PDBOUT "$xyz[0][$i] $xyz[1][$i] $xyz[2][$i] \n";
#        #print "$xyz[0][$i] \n";
#    }
###############################################################################
# SUBROUTINES
###############################################################################
sub read_pdb_file {
    my $pdb_before = shift;
    open( INPDB, "$pdb_before" ) or die "can't open file $pdb_before\n";
    my @L = grep /^ATOM/, <INPDB>;
    #my @L = grep /^CA/, <INPDB>;
    close(INPDB);
    return @L;
}
