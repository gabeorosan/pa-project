#!/usr/bin/perl

#####################################################################
# Last Modified: 8/1/19                                             #
# Created by: Skylar Rizzolo                                        #
#                                                                   #
# Description: Gives information about the general size and makeup  #
# of a protein structure, respresented in PDB format                #
#                                                                   #
# Instructions: To run this script, make sure this file is in your  #
# path or within the directory you're working in in terminal type:  #
#                                                                   #
#   pdb_info.pl filename (replace w/ your file)                     #
#                                                                   #
#   Optional Parameters:                                            #
#   1. include mod for a pdb file that has been modified.           #
#       pdb_info.pl filename mod                                    #
#   2. include aa for info on amino acids within chain              #
#       pdb_info.pl filename aa                                     #
#   3. if using both, put the mod parameter first                   #
#       pdb_info.pl filename mod aa                                 #
#####################################################################

use File::Copy;
use File::Path;
use File::Basename;

open( A, "<", "$ARGV[0]" ) or die "$ARGV[0] not found. $!";
my $arg1_used = 0;
#Chomp and break pdb file into corresponding structures for each category
$i=0;
while (<A>) {
    if (/^ATOM/) {
        $i++;
        chomp($_);
        $key[$i]      = substr( $_, 0,  6 );
        $serial[$i]   = substr( $_, 6,  5 );
        $name[$i]     = substr( $_, 12, 4 );
        $altloc[$i]   = substr( $_, 16, 1 );
        $resnam[$i]   = substr( $_, 17, 3 );
        
        if(!($ARGV[1] cmp "mod"))
        {
            $chainid[$i]  = substr( $_, 75, 1 );
            $resseq[$i]   = substr( $_, 21, 5 );
            $segid[$i]    = substr( $_, 76, 4 );
            $arg1_used = 1;
        }
        else
        {
            $chainid[$i]  = substr( $_, 21, 1 );
            $resseq[$i]   = substr( $_, 22, 4 );
            $segid[$i]    = substr( $_, 72, 4 );
            $arg1_used = 0;
        }
        
        
        $icode[$i]    = substr( $_, 26, 1 );
        $x[$i]        = substr( $_, 30, 8 );
        $y[$i]        = substr( $_, 38, 8 );
        $z[$i]        = substr( $_, 46, 8 );
        $occup[$i]    = substr( $_, 54, 6 );
        $tempfact[$i] = substr( $_, 60, 6 );
        
    }
}
system("echo Found $i atoms");

######################################################################### CHAINS
my @all_ids   = ();
my @chain_nums  = ();
my $t = 0;      #total number of chains
my $r = 0;      #number of RNA chains

#Find Distinct Chains, store in @all_ids
for(my $j=0; $j < $i; $j++)
{
    if(!grep(/^$chainid[$j]$/, @all_ids) && defined($chainid[$j]))
    {
        #Detect RNA chain in residue name
        my $A = $resnam[$j] cmp "A  ";      #
        my $G = $resnam[$j] cmp "G  ";      # One of these will = 0 if RNA chain
        my $C = $resnam[$j] cmp "C  ";      #
        my $U = $resnam[$j] cmp "U  ";      #
        
        $all_ids[$t] = $chainid[$j];
        if($A != 0 && $G != 0 && $C != 0 && $U != 0)
        {
            $t++;
        }
        else
        {
            $t++;
            $r++;
        }
    }
}
$tnum = $t - $r; #Calculating T-number

#Count # of atoms per distinct chain, store in @chain_nums
for(my $j=0; $j < $t; $j++)
{
    $chain_nums[$j] = 0;
}
system("echo Found $tnum protein chains and $r RNA chains");
for(my $j=0; $j <= $i; $j++)
{
    for (my $k=0; $k < $t; $k++)
    {
        if( ord($chainid[$j]) == ord($all_ids[$k]) )
        {
            $chain_nums[$k] += 1;
        }
    }
}
system("echo ;echo === Counting atoms per chain ===");
for(my $j=0; $j < $tnum; $j++)
{
    system("echo Found $chain_nums[$j] atoms in protein chain $all_ids[$j]");
}
for (my $j = $tnum; $j < $t; $j++)
{
    system("echo Found $chain_nums[$j] atoms in RNA chain $all_ids[$j]");
}

######################################################################### AAs
if($arg1_used)
{
    if(!($ARGV[2] cmp "aa"))
    {
        my @all_aa   = ();
        my @aa_nums  = ();
        my $c = 0;
        #Find Distinct amino acids, store in @all_aa
        for(my $j=0; $j < $i; $j++)
        {
            if(!grep(/^$resnam[$j]$/, @all_aa) && defined($resnam[$j]))
            {
                my $A = $resnam[$j] cmp "A  ";      #
                my $G = $resnam[$j] cmp "G  ";      # One of these will = 0 if RNA chain
                my $C = $resnam[$j] cmp "C  ";      #
                my $U = $resnam[$j] cmp "U  ";      #
                
                #Don't include if resname == A, U, C or G
                if($A != 0 && $G != 0 && $C != 0 && $U != 0)
                {
                    $all_aa[$c] = $resnam[$j];
                    $c++;
                }
            }
        }

        #Count # of per amino acid, in @aa_nums
        for(my $j=0; $j < $c; $j++)
        {
            $aa_nums[$j] = 0;
        }

        for(my $j=0; $j < $i; $j++)
        {
            for (my $k=0; $k < $c; $k++)
            {
                if( ord($resnam[$j]) == ord($all_aa[$k]))
                {
                    $aa_nums[$k] += 1;
                }
            }
        }
        system("echo ;echo === Counting occurrences of amino acids ===");
        for(my $j=0; $j < $c; $j++)
        {
            system("echo Found $aa_nums[$j] instances of $all_aa[$j]");
        }
    }
}
else
{
    if(!($ARGV[1] cmp "aa"))
    {
        my @all_aa   = ();
        my @aa_nums  = ();
        my $c = 0;
        #Find Distinct amino acids, store in @all_aa
        for(my $j=0; $j < $i; $j++)
        {
            if(!grep(/^$resnam[$j]$/, @all_aa) && defined($resnam[$j]))
            {
                my $A = $resnam[$j] cmp "A  ";      #
                my $G = $resnam[$j] cmp "G  ";      # One of these will = 0 if RNA chain
                my $C = $resnam[$j] cmp "C  ";      #
                my $U = $resnam[$j] cmp "U  ";      #
                
                #Don't include if resname == A, U, C or G
                if($A != 0 && $G != 0 && $C != 0 && $U != 0)
                {
                    $all_aa[$c] = $resnam[$j];
                    $c++;
                }
            }
        }
        
        #Count # of per amino acid, in @aa_nums
        for(my $j=0; $j < $c; $j++)
        {
            $aa_nums[$j] = 0;
        }
        
        for(my $j=0; $j < $i; $j++)
        {
            for (my $k=0; $k < $c; $k++)
            {
                if( ord($resnam[$j]) == ord($all_aa[$k]))
                {
                    $aa_nums[$k] += 1;
                }
            }
        }
        system("echo ;echo === Counting occurrences of amino acids ===");
        for(my $j=0; $j < $c; $j++)
        {
            system("echo Found $aa_nums[$j] instances of $all_aa[$j]");
        }
    }
}

#Finish up, print results in format for Dr. Dave
for(my $j=0; $j<$r; $j++)
{
    $temp = pop(@chain_nums);
    unshift(@rna_nums, $temp);
}
$A = "Tnum = $tnum\\; app = [@chain_nums]\\; apr = [@rna_nums]";
system("echo ;echo $A");

