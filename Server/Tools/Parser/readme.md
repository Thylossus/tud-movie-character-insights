# Parser and Tools

This directory contains the parser and some tools to easily check its processing results.

## The Parser

The parser itself can be called using the Python 3 script parser.py. It makes use of the parser module declarations in scriptparsers.py and of the severale parser modules (currently alignmentparser.py and btagparser.py).

The input directory and the output database can be configured using the server configuration file.

More details are explained in the parser.py file

## dumpMovie.py

This script can be called with a (raw) movie title, and it will then print the result of the parser. This would be the movie script in the ideal case.

## dumpQuote.py

This script can be called with a (raw) movie title and a (raw) character name and will then output the whole text of this character in a formatted manner. To get the text formatted in the way that it was delivered to the Personality Insights service, the -pipelineMode command line parameter may be used.

## show_stats.py

This tool shows word counts for all characters of all movies sorted from high to low.
