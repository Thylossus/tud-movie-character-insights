#!/usr/bin/python3

import sys
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

mongoClient, mongoDb = mongohelper.getMongoClient()

workingDir = config.getProperty("autoEnc.workDir")
if workingDir is None:
	print("Using current working directory for output")
	workingDir = ""
else:
	print("Using " + workingDir + " for output")

def getIndexMap(insights, filename):
	print("No dimension mapping found... Initializing dimension mapping:")
	dims = []
	for dimension in insights:
		dimensionName = dimension['name']
		dims += [dimensionName]
		for subDimension in dimension['subDimensions']:
			subDimensionName = dimensionName+"."+subDimension['name']
			dims += [subDimensionName]
	dims = sorted(dims)
	m = {}
	idx = 0
	with open(filename+'.dims','w') as fileHandle:
		for dim in dims:
			print("\t"+str(idx)+": "+dim)
			fileHandle.write(dim+"\n")
			m[dim] = idx
			idx+=1
	return m

def getDim(insights, key):
	dims = key.split(".",1)
	for insight in insights:
		if insight['name']==dims[0]:
			if len(dims)==1:
				return insight['score']
			else:
				return getDim(insight['subDimensions'], dims[1])
	return None

def getMappedInsights(insights, insight2idx):
	insightVector = [0.0] * len(insight2idx)
	for key, idx in insight2idx.items():
		dim = getDim(insights, key)
		if dim is not None:
			insightVector[idx] = dim
		else:
			raise AttributeError("ERROR: Dimension value not found for " + key)
	return " ".join([str(i) for i in insightVector])

# Maps insight property names to vector indices
insight2idx = None

movieCount = 0
charCount = 0

filename=workingDir+'/characters'

with open(filename+".vec","w") as outputFile:
	for movies in mongoDb['movies'].find({},{'names': 1, 'characters': 1}):
		movieName = movies['names']['scriptUnified']
		print("Loading characters from: " + movieName)
		for character in movies['characters']:
			cName = "<unknown>"
			if character['names']['scriptUnified'] is not None:
				cName = character['names']['scriptUnified']
			if character['names']['resolved'] is not None:
				cName = character['names']['resolved']
			cName=cName.strip()
			if len(cName)==0:
				print("Skipping 1 characters without a name")
				continue

			print("\t- "+cName)
			if character['characteristics'] is not None and character['characteristics']['personality'] is not None:
				if insight2idx is None:
					insight2idx = getIndexMap(character['characteristics']['personality'],filename)

				try:
					outLine = movieName+"\t"+cName+"\t"+getMappedInsights(character['characteristics']['personality'],insight2idx)+"\n"
					outputFile.write(outLine)
				except AttributeError as attrErr:
					print("Skipping " + cName + " because:",attrErr)
				charCount+=1
			else:
				print("\t\t(no insights available)")
		print("")
		movieCount+=1

print("Found "+str(charCount)+" characters in "+str(movieCount)+" movies")





