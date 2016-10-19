#!/usr/bin/python3
stats_version="0.11"

# Include custom libs
import sys
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import re
from pymongo import MongoClient

print("Word stats v.", stats_version)
print("================================")

print()

mongoClient, mongoDb = mongohelper.getMongoClient()

characterWords = []
movies = mongoDb.rawMovies.find({})
for movie in movies:
	if len(sys.argv) > 1 and not movie['_id'] in sys.argv:
		continue
	print("Scanning " + movie['_id'])
	
	counters = {}
	for quote in mongoDb.rawQuotes.find({'_id.movie': movie['_id']}):
		c = len(re.findall(r'\w+',quote['text']))
		if not quote['character'] in counters:
			counters[quote['character']] = 0
		counters[quote['character']] = counters[quote['character']] + c
	
	for character, count in counters.items():
		characterWords += [(movie['_id'], character, count)]

characterWords = sorted(characterWords, key=lambda a: -a[2])

for i in range(200 if len(characterWords) > 200 else len(characterWords)):
	
	print(str(characterWords[i][2]) + " words: " + characterWords[i][1] + " (" + characterWords[i][0] + ")")

