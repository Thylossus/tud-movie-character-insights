#!/usr/bin/python3
# -*- coding: UTF-8 -*-
import json
import sys
from collections import Counter

# Default property values
props = {'evalFile1': '../results-postprocessing/data/evaluation1.json',
		'evalFile2': '../results-postprocessing/data/evaluation2.json'}
propDesc = {'evalFile1': 'Post-processed result file from first evaluation',
			'evalFile2': 'Post-processed result file from second evaluation'}

# Usage info
def printUsageInfo():
	print("Evaluation which movies were selected and what are the top 3 of selected movies")
	print()
	print("Usage: evaluationMovies.py",(" ".join(map(lambda x: '['+x+'=...]', sorted(propDesc.keys())))))
	for prop in sorted(propDesc.keys()):
		print()
		print("  "+prop+" (default: "+str(props[prop])+")")
		print("   "+propDesc[prop])
	print()

# Check whether usage info should be printed out
if '--help' in sys.argv:
	printUsageInfo();
	exit();

# Overridden properties form command line
for arg in sys.argv[1:]:
	k,v = arg.split('=', 2)
	props[k]=v

# Helper function to extract the movies from the input data
def extractMovies(data):
	result = []
	# Iterate through all quiz sessions in the result
	for evalSession in data:
		for movie in evalSession['movies']:
			result.append(movie['name'])
	return result

# Helper function to read a json file
def readData(filename):
	print("Reading:",filename)
	data = None
	with open(filename,'r') as inFile:
		data = json.loads(inFile.read())
	return data

print("Analysis of the selected Movies and the Top 3 of Selected Movies")
print("─────────────────────────────────────────────────────────────────────────")
print()

# Read input data:
eval1Data = readData(props['evalFile1'])
eval2Data = readData(props['evalFile2'])
print()

# Extract different data series from the input
evalResults = {'eval1': extractMovies(eval1Data),
			'eval2': extractMovies(eval2Data)}
evalTitles = {'eval1': 'Evaluation 1',
			'eval2': 'Evaluation 2'}

# Do analysis and write output
for evalRun in sorted(evalResults.keys()):
	results = evalResults[evalRun]

	# Count the number of movies
	counter = Counter(results)

	# Print information about the movies
	print(evalTitles[evalRun])
	print((len(evalTitles[evalRun]))*"─")
	print("Number of distinct selected movies: "+str(len(counter)))
	print("Top 3 movies: "+str(counter.most_common(3)))
	print()

