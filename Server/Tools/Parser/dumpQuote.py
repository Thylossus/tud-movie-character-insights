#!/usr/bin/python3
dump_version="0.21"

# Include custom libs
import sys
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import pymongo

mongoClient, mongoDb = mongohelper.getMongoClient(silent = True)

if len(sys.argv) < 3:
	print("Usage: dumpQuote.py [-pipelineMode] <movieId> <character>")
	print("       On linux systems, dumpQuote.py | wc -w might be useful...")
	exit()

pipelineMode = False
if sys.argv[1] == '-pipelineMode':
	movieId = sys.argv[2]
	character = sys.argv[3].title()
	pipelineMode = True
else:
	movieId = sys.argv[1]
	character = sys.argv[2].title()

for quote in mongoDb.rawQuotes.find({'_id.movie': movieId, 'character':character}).sort(
	                            "_id.id",pymongo.ASCENDING):
	if 'attribute' in quote and not pipelineMode:
		print("("+quote['attribute']+") "+quote['text'])
	else:
		print(quote['text'], end=" " if pipelineMode else "\n")

