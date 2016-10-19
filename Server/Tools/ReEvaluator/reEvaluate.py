#!/usr/bin/python3
# -*- coding: UTF-8 -*-
import json
import sys
from functools import reduce

# Include custom libs
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import pymongo
from bson.objectid import ObjectId

from hashlib import md5
import os.path

from math import sqrt, log

# Calculates evaluation results for one evaluation session
def calculateStatsOneItem(data):
	questionCount = 0
	correctCount = 0
	for questionResults in data['questions']:
		questionCount += 1
		if questionResults['answer'] == questionResults['nonSimilarCharacter']['_id']:
			correctCount += 1
	return {'questionCount': questionCount, 'correctCount': correctCount, 'correctRatio': float(correctCount)/float(questionCount)}

# Calculates evaluation results for a list of evaluation sessions
def calculateStatsListItems(data):
	sessionResults = []
	for session in data:
		sessionResults += [calculateStatsOneItem(session)]
		# Uncommenting this will print every session's result
		# print(sessionResults[-1:])
	cRatio = reduce(lambda prev,cur: [prev[0]+1, prev[1]+cur['correctRatio']], sessionResults, [0,0])
	distribution = {str(i): reduce(lambda prev,cur: prev+1 if cur['correctCount']==i else prev, sessionResults, 0) for i in range(0,11)}
	return {'correctRatio': cRatio[1]/float(cRatio[0]), 'resultDistribution': distribution}

# Helper function to print result classes
def printResultDistribution(dist):
	header    = "│ Correct Answers │"
	separator = "├─────────────────"
	datastring= "│ Session Count   │"
	for i in range(len(dist)):
		header    += ' {0:4d} │'.format(i)
		separator +=   '┼──────'
		datastring+= ' {0:4d} │'.format(dist[str(i)])
	print('╭'+separator[1:].replace('┼','┬')+'╮')
	print(header)
	print(separator+'┤')
	print(datastring)
	print('╰'+separator[1:].replace('┼','┴')+'╯')

# Helper for reading results:
def getFirst(cursorRes):
	for a in cursorRes:
		return a
	return None

# Helper method to generate a (hopefully) unique name from character ids and db name
def genHash(ids, dbname):
	b = bytearray()
	b.extend(map(ord,dbname))
	for i in sorted(ids):
		b.extend(map(ord," "))
		b.extend(map(ord,i))
	return md5(b).hexdigest()

# Creates a vector of score values from an insights object
def vectorFromInsights(insights, scoreType, isRecursive = False):
	if not isRecursive:
		vector = []
		for x in ['needs','personality','values']:
			vector += vectorFromInsights(insights[x], scoreType, True)
		return vector
	else:
		vector = []
		dimensionNames = sorted([x['_id'] for x in insights])
		for dimensionName in dimensionNames:
			dimension = [x for x in insights if x['_id']==dimensionName][0]
			vector += [dimension[scoreType] if scoreType in dimension else 1.0]
			if 'subDimensions' in dimension:
				vector += vectorFromInsights(dimension['subDimensions'], scoreType, True)
		return vector

# Cosine measure for re-evaluation http://users.uom.gr/~kouiruki/sung.pdf # 20
def measureCosine(insightsA, insightsB, scoreType):
	vectorA = vectorFromInsights(insightsA, scoreType)
	vectorB = vectorFromInsights(insightsB, scoreType)
	numerator = 0
	sizeA = 0
	sizeB = 0
	for i in range(len(vectorA)):
		numerator += vectorA[i] * vectorB[i]
		sizeA += vectorA[i]*vectorA[i]
		sizeB += vectorB[i]*vectorB[i]
	denominator = sqrt(sizeA) * sqrt(sizeB)
	return numerator / denominator

# Harmonic mean as in http://users.uom.gr/~kouiruki/sung.pdf #19
def measureHarmonicMean(insightsA, insightsB, scoreType):
	vectorA = vectorFromInsights(insightsA, scoreType)
	vectorB = vectorFromInsights(insightsB, scoreType)
	f = 0
	for i in range(len(vectorA)):
		f += (vectorA[i]*vectorB[i])/(vectorA[i]+vectorB[i])
	return 2*f

# Euclidean distance: http://users.uom.gr/~kouiruki/sung.pdf #1
def measureEuclidean(insightsA, insightsB, scoreType):
	vectorA = vectorFromInsights(insightsA, scoreType)
	vectorB = vectorFromInsights(insightsB, scoreType)
	x = 0
	for i in range(len(vectorA)):
		x += (vectorA[i] - vectorB[i])**2
	return sqrt(x)

# Intersection: http://users.uom.gr/~kouiruki/sung.pdf #11
def measureIntersection(insightsA, insightsB, scoreType):
	vectorA = vectorFromInsights(insightsA, scoreType)
	vectorB = vectorFromInsights(insightsB, scoreType)
	x = 0
	for i in range(len(vectorA)):
		x+=min(vectorA[i],vectorB[i])
	return x

# Wave Hedges: http://users.uom.gr/~kouiruki/sung.pdf #12
def measureWaveHedges(insightsA, insightsB, scoreType):
	vectorA = vectorFromInsights(insightsA, scoreType)
	vectorB = vectorFromInsights(insightsB, scoreType)
	x = 0
	for i in range(len(vectorA)):
		x+=1-(min(vectorA[i],vectorB[i])/max(vectorA[i],vectorB[i]))
	return x

# Tanimoto: http://users.uom.gr/~kouiruki/sung.pdf #17
def measureTanimoto(insightsA, insightsB, scoreType):
	vectorA = vectorFromInsights(insightsA, scoreType)
	vectorB = vectorFromInsights(insightsB, scoreType)
	sq = 0
	sp = 0
	sm = 0
	for i in range(len(vectorA)):
		sm += min(vectorA[i],vectorB[i])
		sp += vectorA[i]
		sq += vectorB[i]
	return (sp+sq-2*sm)/(sp+sq-sm)

# Divergence: http://users.uom.gr/~kouiruki/sung.pdf #34
def measureDivergence(insightsA, insightsB, scoreType):
	vectorA = vectorFromInsights(insightsA, scoreType)
	vectorB = vectorFromInsights(insightsB, scoreType)
	x = 0
	for i in range(len(vectorA)):
		x += ((vectorA[i]-vectorB[i])**2) / ((vectorA[i]+vectorB[i])**2)
	return 2*x

# Jeffreys (Symmetric KL-Divergence): http://users.uom.gr/~kouiruki/sung.pdf #38
def measureJeffreys(insightsA, insightsB, scoreType):
	if scoreType!='normalizedScore' and measureJeffreys.warningShown is False:
		print("WARNING: Switching to normalizedScores to prevent values < 0")
		measureJeffreys.warningShown = True
	vectorA = vectorFromInsights(insightsA, 'normalizedScore') # Won't work with values <0
	vectorB = vectorFromInsights(insightsB, 'normalizedScore')
	x = 0
	for i in range(len(vectorA)):
		if vectorA[i]!=0 and vectorB[i]!=0: # Not really correct this way...
			x += (vectorA[i]-vectorB[i]) * log(vectorA[i]/vectorB[i])
		else:
			print("WARNING: Skipping component with value of 0")
	return x
measureJeffreys.warningShown = False

# List of known measure functions
knownMeasures = {'cosine': measureCosine, 'euclidean': measureEuclidean, 'harmonic': measureHarmonicMean, 'intersection': measureIntersection, 'waveHedges': measureWaveHedges, 'tanimoto': measureTanimoto, 'divergence': measureDivergence, 'jeffreys': measureJeffreys}

# Re-Evaluation method
#  sessions: The sessions with questions used to re-evaluate
#  idmap: Map that connects character IDs of the session to insights
#  measure: The measure to use
#  scoreType: Evaluate either on "score" or on "normalizedScore"
def runReEvaluation(sessions, idmap, measure = measureCosine, scoreType = 'normalizedScore'):
	output = []
	for session in sessions:
		sessionOutput = {"_id": session['_id'], 'creationTime': session['creationTime'], 'questions': []}
		for question in session['questions']:
			referenceInsights = idmap[question['referenceCharacter']['_id']]['insights']
			questionData = {'answer': question['answer'], 'referenceCharacter': {'_id': question['referenceCharacter']['_id']}, '_id': question['_id']}

			# Calculate new similarities
			possibleAnswers = {}
			for answer in question['distractorCharacters']:
				possibleAnswers[answer['_id']] = measure(referenceInsights, idmap[answer['_id']]['insights'],scoreType)
			nonSimilarId = question['nonSimilarCharacter']['_id']
			possibleAnswers[nonSimilarId] = measure(referenceInsights, idmap[nonSimilarId]['insights'],scoreType)

			# Find new nonSimilarCharacter
			minSimilarity = nonSimilarId
			for cId in possibleAnswers.keys():
				if possibleAnswers[cId] < possibleAnswers[minSimilarity]:
					minSimilarity = cId
			questionData['nonSimilarCharacter'] = {'_id': minSimilarity, 'similarity': possibleAnswers[minSimilarity]}

			# Add distractor characters
			questionData['distractorCharacters'] = [{'_id': k, 'similarity': possibleAnswers[k]} for k in possibleAnswers.keys() if k!=minSimilarity]

			# Add question to session
			sessionOutput['questions'] += [questionData]
		output+=[sessionOutput]
	return output

def printUsage():
	print("Usage: reEvaluate.py [props]")
	print()
	print("       Where props are entries in the form key=value")
	print()
	print("       evaluationDataFile (default: evalData.json)")
	print("         Defines the input of the last evaluation in json format")
	print()
	print("       insightsDbInitial (default: characterinsights_dev)")
	print("         Name of database that is used to load insights for the first evaluation")
	print()
	print("       insightsDbNew (default: characterinsights_test)")
	print("         Name of database that is used to load insights for the re-evaluation")
	print()
	print("       newMeasure (default: not set)")
	print("         Name of the measure used to re-evaluate the existing data")
	print("         Currently known measures:",', '.join(knownMeasures.keys()))
	print()

print("ReEvaluation Tool")
print("=================")
print("This tool can use data from the first evaluation and reevaluate it again, using")
print("  a) A different similarity measure [TBD]")
print("  b) Other insights")
print()

# Usage Info
if "--help" in sys.argv:
	printUsage()
	exit()

# Default properties
props = {'evaluationDataFile': 'evalData.json', 'insightsDbInitial': 'characterinsights_dev', 'insightsDbNew': 'characterinsights_test'}
for prop in sys.argv[1:]:
	k,v = prop.split("=",1)
	props[k]=v

# Connect DB
mongoClient, mongoDb = mongohelper.getMongoClient()
print("DB for initial insight values:",props['insightsDbInitial'])
mongoDbInitial = mongoClient[props['insightsDbInitial']]
print("DB for new insight values:    ",props['insightsDbNew'])
mongoDbNew = mongoClient[props['insightsDbNew']]
print()

# Read results of last evaluation
with open(props['evaluationDataFile'],'r') as evalDataFile:
  evalData = json.loads(evalDataFile.read())
print("Found", len(evalData), "evaluation results in",props['evaluationDataFile'])

# Clean out Entries without nonSimilarCharacter
evalData = list(filter(lambda d: 'nonSimilarCharacter' in d['questions'][0], evalData))
print("There are", len(evalData), "remaining evaluation sessions after deleting those without nonSimliarCharacter.\n")

# Get previous results and print them, to make comparing easier
evalDataResults = calculateStatsListItems(evalData)
print("The EXISTING DATA has a ratio of",(100.0*evalDataResults['correctRatio']),"% for correct answers.")
print("The distribution of the results is as follows:")
printResultDistribution(evalDataResults['resultDistribution'])
print()

# Loading insights
# ----------------

# Get all character ids
ids = set()
for evalSession in evalData:
	for question in evalSession['questions']:
		ids.add(question['referenceCharacter']['_id'])
		ids.add(question['nonSimilarCharacter']['_id'])
		for distChar in question['distractorCharacters']:
			ids.add(distChar['_id'])

# For debugging of insights loading: Only one id
#ids = {'576290eac469a2b809acc8e8'}

# Check if there is a cache
cacheFilename = genHash(ids, props['insightsDbInitial']) + ".cache.json"
if os.path.isfile(cacheFilename):
	print("Reading insights for previous evaluation from cache")
	with open(cacheFilename,'r') as cacheFile:
		initialInsights = json.loads(cacheFile.read())
else:
	# Load details for all those characters from the inital DB
	print("Loading insights for",str(len(ids)),"characters from previous evaluation. This may take a moment...")
	initialInsights = {}
	for characterID in ids:
		print(".", end="", flush=True)
		movie = getFirst(mongoDbInitial.movies.find({'characters._id': ObjectId(characterID)}))
		if movie is not None:
			cData = {'movieNameResolved': movie['names']['resolved']}
			cData['movieNameUnified'] = movie['names']['scriptUnified']
			for character in movie['characters']:
				if str(character['_id']) == characterID:
					cData['nameResolved'] = character['names']['resolved']
					cData['nameUnified'] = character['names']['scriptUnified']
					cData['insights'] = character['characteristics']
					cData['insights']['queryTimestamp'] = None
					initialInsights[characterID] = cData
					break
		else:
			print("\nError: No character details found for",characterID,"(Wrong DB?)")
	with open(cacheFilename,'w') as cacheFile:
		cacheFile.write(json.dumps(initialInsights))
	print("\nFinished loading previous insights (and written to cache)")

# Check if there is a cache
cacheFilename = genHash(ids, props['insightsDbNew']) + ".cache.json"
if os.path.isfile(cacheFilename):
	print("Reading insights for new evaluation from cache")
	with open(cacheFilename,'r') as cacheFile:
		newInsights = json.loads(cacheFile.read())
else:
	# Find the characters in the new DB. Matching has to be done using Movie and Character name
	# because new crawling means new IDs.
	print("Matching characters from previous to new evaluation and loading new insight values. This may take a moment...")
	newInsights = {}
	for characterID in ids:
		print(".", end="", flush=True)
		initRefChar = initialInsights[characterID]

		# Evil Hack to fix the "Fight Club 1" issue:
		if initRefChar['movieNameResolved'] == 'Fight Club':
			initRefChar['movieNameResolved'] = 'Fight Club 1'

		movie = getFirst(mongoDbNew.movies.find({'names.resolved': initRefChar['movieNameResolved'], 'names.scriptUnified': initRefChar['movieNameUnified']}))
		if movie is not None:
			cData = {'movieNameResolved': movie['names']['resolved']}
			cData['movieNameUnified'] = movie['names']['scriptUnified']
			charFound = False
			for character in movie['characters']:
				if character['names']['resolved'] == initRefChar['nameResolved'] and character['names']['scriptUnified'] == initRefChar['nameUnified']:
					cData['nameResolved'] = character['names']['resolved']
					cData['nameUnified'] = character['names']['scriptUnified']
					cData['insights'] = character['characteristics']
					cData['insights']['queryTimestamp'] = None
					newInsights[characterID] = cData
					charFound = True
					break
			if not charFound:
				print("\nError: Could not find character",initRefChar['nameResolved'],"in new DB! (Movie:",movie['names']['resolved'],")")
		else:
			print("\nError: Could not match character",initRefChar['nameResolved'],"in new DB! (Movie",initRefChar['movieNameResolved'],"is missing)")
	with open(cacheFilename,'w') as cacheFile:
		cacheFile.write(json.dumps(newInsights))
	print("\nFinished matching new insight values (and written to cache)")
print()

measure = measureCosine

# Sanity Check: Setting newMeasure to Cosine should return the same results as before
if 'newMeasure' in props:
	measure = knownMeasures[props['newMeasure']]
	print("Re-Evaluating data using NEW MEASURE:",props['newMeasure'])
	newEval = runReEvaluation(evalData, initialInsights, scoreType = 'score', measure=measure)
	newEvalDataResults = calculateStatsListItems(newEval)
	print("The existing data has a ratio of",(100.0*newEvalDataResults['correctRatio']),"% for correct answers.")
	print("The distribution of the results is as follows:")
	printResultDistribution(newEvalDataResults['resultDistribution'])
	print()

if 'newMeasure' not in props:
	props['newMeasure'] = 'cosine'

# Now that we have the old and the new insights, we can do the actual re-evaluation
newEval = runReEvaluation(evalData, newInsights, scoreType = 'score', measure=measure)
newEvalDataResults = calculateStatsListItems(newEval)
print("With NEW INSIGHT VALUES, the data has a ratio of",(100.0*newEvalDataResults['correctRatio']),"% for correct answers. (Measure: "+props['newMeasure']+")")
print("The distribution of the results is as follows:")
printResultDistribution(newEvalDataResults['resultDistribution'])
print()




