#!/usr/bin/python3
# -*- coding: UTF-8 -*-
import json
import sys

# Include custom libs
sys.path.append( '../../../include/python' )

import serverutils.config as config

from statistics import mean, median, stdev
import numpy as np

# Default property values
props = {'evalFile1': '../results-postprocessing/data/evaluation1.json',
		'evalFile2': '../results-postprocessing/data/evaluation2.json'}
propDesc = {'evalFile1': 'Post-processed result file from first evaluation',
			'evalFile2': 'Post-processed result file from second evaluation'}

type1dimensions = ['Openness','Neuroticism','Extraversion','Conscientiousness','Agreeableness']

# Usage info
def printUsageInfo():
	print("Evaluation of correctness depending on distance between reference and non-similar characters")
	print()
	print("Usage: evaluationDistance.py",(" ".join(map(lambda x: '['+x+'=...]', sorted(propDesc.keys())))))
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

# Helper function to extract (distance, correct)-Tuples from the input data
# data is the input data
# quizType is either None (first evaluation) or 0/1 for the second evaluation
def extractDistances(data, quizType = None):
	results = []
	# Iterate through all quiz sessions in the result
	for evalSession in data:
		# Check whether the quizType matches
		includeSession = True
		if quizType is not None:
			# Sadly, the quizType hasn't been stored correctly, so we try to
			# determine it by the dimension of the first question:
			evalSession['quizType'] = 1 if evalSession['questions'][0]['dimension'] in type1dimensions else 0
			includeSession = evalSession['quizType'] == quizType
		# Skip sessions of the wrong quiz type
		if includeSession:
			# Iterate through questions
			for question in evalSession['questions']:
				qCorrect = question['answer'] not in map(lambda c: c['_id'], question['distractorCharacters'])
				if quizType is None and 'nonSimilarCharacter' in question:
					qDistance = question['nonSimilarCharacter']['similarity']
					results += [(qDistance, qCorrect)]
				elif quizType is not None:
					qDistance = min([abs(question['similarCharacter']['similarity']-dC['similarity']) for dC in question['distractorCharacters']])
					results += [(qDistance, qCorrect)]
	return results

# Returns distribution information
def getDistributionInfo(values):
	return {'mean': mean(values),
			'median': median(values),
			'totalCount': len(values),
			'stdev': stdev(values)}

# Helper function to read a json file
def readData(filename):
	print("Reading:",filename)
	data = None
	with open(filename,'r') as inFile:
		data = json.loads(inFile.read())
	return data

print("Analysis of Distance Between Non-Similar and Reference Character and Corresponding Correctness")
print("──────────────────────────────────────────────────────────────────────────────────────────────")
print()

# Read input data:
eval1Data = readData(props['evalFile1'])
eval2Data = readData(props['evalFile2'])
print()

# Extract different data series from the input
evalResults = {'eval1': extractDistances(eval1Data),
			'eval2-main': extractDistances(eval2Data, 1),
			'eval2-sub': extractDistances(eval2Data, 0)}
evalTitles = {'eval1': 'Evaluation 1: Complete Character',
			'eval2-main': 'Evaluation 2: Main Dimensions',
			'eval2-sub': 'Evaluation 2: Sub Dimensions'}

def printDistributionInfo(header, dInfo):
	print(header)
	print("  Mean:               ",dInfo['mean'])
	print("  Standard Deviation: ",dInfo['stdev'])
	print("  Total Count:        ",dInfo['totalCount'])
	print()

# Do analysis and write output
for evalRun in sorted(evalResults.keys()):
	results = evalResults[evalRun]

	# Get two list with distances for correct (a[1]==true) and wrong (a[1]==false) answers
	# The lists are plain float lists, as their usage is more comfortable with statistics functions
	dataCorrect = list(map(lambda b: float(b[0]), filter(lambda a: a[1], results)))
	dataWrong   = list(map(lambda b: float(b[0]), filter(lambda a: not a[1], results)))
	# Remove outliers and get distribution information for each distribution
	distInfoCorrect = getDistributionInfo(dataCorrect)
	distInfoWrong   = getDistributionInfo(dataWrong)

	# Print information about both distributions
	print(evalTitles[evalRun])
	print((len(evalTitles[evalRun]))*"─")
	print("Total Answers:     "+str(len(results)))
	print("  Correct Answers: "+str(distInfoCorrect['totalCount']))
	print("  Wrong Answers:   "+str(distInfoWrong['totalCount']))
	print()

	printDistributionInfo("Distribution of Correct Answers",distInfoCorrect)
	printDistributionInfo("Distribution of Wrong Answers",distInfoWrong)

	print()

