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
		'evalFile2': '../results-postprocessing/data/evaluation2.json',
		'histogramFile': None,
		'histogramInterval': 5000}
propDesc = {'evalFile1': 'Post-processed result file from first evaluation',
			'evalFile2': 'Post-processed result file from second evaluation',
			'histogramFile': 'Prefix for filename of histogram output files',
			'histogramInterval': 'Interval size for histogram categories'}

type1dimensions = ['Openness','Neuroticism','Extraversion','Conscientiousness','Agreeableness']

# Usage info
def printUsageInfo():
	print("Evaluation of correctness depending on time taken to answer a question")
	print()
	print("Usage: evaluationTime.py",(" ".join(map(lambda x: '['+x+'=...]', sorted(propDesc.keys())))))
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

# Helper function to extract (time, correct)-Tuples from the input data
# data is the input data
# quizType is either None (first evaluation) or 0/1 for the second evaluation
def extractTimes(data, quizType = None):
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
				qTime = question['timeTaken']
				qCorrect = question['answer'] not in map(lambda c: c['_id'], question['distractorCharacters'])
				results += [(qTime, qCorrect)]
	return results

# Write a histogram file
def writeHistogram(filename, data, interval):
	data = removeOutliers(data)
	histData = {}
	maxVal = 0
	for d in data:
		idx = int(d/interval)+1
		if not idx in histData:
			histData[idx] = 1
		else:
			histData[idx] = histData[idx]+1
		maxVal = max(idx, maxVal)
	with open(filename,'w') as csv:
		for n in range(maxVal+1):
			if n in histData:
				csv.write(str(n*interval)+";"+str(histData[n])+"\n")
			else:
				csv.write(str(n*interval)+";0\n")


# Method to remove outliers (users taking a nap in front of the screen etc.)
def removeOutliers(values):
	q1 = np.percentile(values, 25)
	q3 = np.percentile(values, 75)
	k = 1.5
	kq = k*(q3-q1)
	return list(filter(lambda v: q1 - kq < v < q3 + kq, values))

# Returns distribution information
def getDistributionInfo(valuesWithOutliers):
	values = removeOutliers(valuesWithOutliers)
	return {'mean': mean(values),
			'median': median(values),
			'totalCount': len(valuesWithOutliers),
			'outlierCount': len(valuesWithOutliers)-len(values),
			'cleanedCount': len(values),
			'stdev': stdev(values)}

# Helper function to read a json file
def readData(filename):
	print("Reading:",filename)
	data = None
	with open(filename,'r') as inFile:
		data = json.loads(inFile.read())
	return data

print("Analysis of Time Taken to Answer a Question and Corresponding Correctness")
print("─────────────────────────────────────────────────────────────────────────")
print()

# Read input data:
eval1Data = readData(props['evalFile1'])
eval2Data = readData(props['evalFile2'])
print()

# Extract different data series from the input
evalResults = {'eval1': extractTimes(eval1Data),
			'eval2-main': extractTimes(eval2Data, 1),
			'eval2-sub': extractTimes(eval2Data, 0)}
evalTitles = {'eval1': 'Evaluation 1: Complete Character',
			'eval2-main': 'Evaluation 2: Main Dimensions',
			'eval2-sub': 'Evaluation 2: Sub Dimensions'}

def printDistributionInfo(header, dInfo):
	print(header)
	print("  Mean:               ",dInfo['mean'])
	print("  Standard Deviation: ",dInfo['stdev'])
	print()

# Do analysis and write output
for evalRun in sorted(evalResults.keys()):
	results = evalResults[evalRun]

	# Get two list with times for correct (a[1]==true) and wrong (a[1]==false) answers
	# The lists are plain integer lists, as their usage is more comfortable with statistics functions
	dataCorrect = list(map(lambda b: int(b[0]), filter(lambda a: a[1], results)))
	dataWrong   = list(map(lambda b: int(b[0]), filter(lambda a: not a[1], results)))
	# Remove outliers and get distribution information for each distribution
	distInfoCorrect = getDistributionInfo(dataCorrect)
	distInfoWrong   = getDistributionInfo(dataWrong)

	# Print information about both distributions
	print(evalTitles[evalRun])
	print((len(evalTitles[evalRun]))*"─")
	print("Total Answers:     "+str(len(results)))
	print("  Correct Answers: "+str(distInfoCorrect['cleanedCount'])+" (excl. "+str(distInfoCorrect['outlierCount'])+" outliers)")
	print("  Wrong Answers:   "+str(distInfoWrong['cleanedCount'])+" (excl. "+str(distInfoWrong['outlierCount'])+" outliers)")
	print()

	if props['histogramFile'] is not None:
		writeHistogram(props['histogramFile']+"-"+evalRun+"-correct.csv",dataCorrect,int(props['histogramInterval']))
		writeHistogram(props['histogramFile']+"-"+evalRun+"-wrong.csv",dataWrong,int(props['histogramInterval']))

	printDistributionInfo("Distribution of Correct Answers",distInfoCorrect)
	printDistributionInfo("Distribution of Wrong Answers",distInfoWrong)

	print()

