#!/usr/bin/perl -w
use File::Copy;
use File::Path;
use File::Basename;
use strict;


my $au_pdb_name = $ARGV[0];
my $file = "xyz.$au_pdb_name";
my @au_pdb_data = &read_pdb_file($au_pdb_name); # ALL DATA

my @array = @au_pdb_data;
my $natoms_au	= @array;
print "number of atoms = $natoms_au\n";

unshift(@au_pdb_data,'');
my @xyz 		= &get_pdb_data(@au_pdb_data); 		# Should never change


open( PDBOUT, ">$file" );
foreach my $i (1..$natoms_au) {
        print PDBOUT "$xyz[0][$i] $xyz[1][$i] $xyz[2][$i] \n";
        #print "$xyz[0][$i] \n";
    }
###############################################################################
# SUBROUTINES
###############################################################################

sub get_pdb_data{
    my @L = @_; 
    my (@x, @y, @z); # w is segid.
    foreach my $i (1..$#L) {
        # atom number start from 1

        #$x[$i] 			= substr( $L[$i], 42, 12 );
        #%$y[$i] 			= substr( $L[$i], 62, 12 );
        #$z[$i] 			= substr( $L[$i], 82, 12 );

		$x[$i] 			= substr( $L[$i], 30, 8 );
		$y[$i] 			= substr( $L[$i], 38, 8 );
		$z[$i] 			= substr( $L[$i], 46, 8 );
        
    }
	return (\@x, \@y, \@z);
}

sub read_pdb_file {
    my $pdb_before = shift;
    open( INPDB, "$pdb_before" ) or die "can't open file $pdb_before\n";
    my @L = grep /^ATOM/, <INPDB>;
    #my @L = grep /^CA/, <INPDB>;
    close(INPDB);
    return @L;
}
