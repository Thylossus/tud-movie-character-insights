#!/usr/bin/python3
dump_version="0.10"

# Include custom libs
import sys
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import pymongo

mongoClient, mongoDb = mongohelper.getMongoClient(silent = True)

if len(sys.argv) < 2:
	print("Usage: dumpMovie.py <movieId>")
	print("")
	print("Listing movies:")
	for movie in mongoDb.rawMovies.find().sort(
					                    "_id",pymongo.ASCENDING):
		print(movie['_id'])

else:
	movieId = sys.argv[1]
	movieCursor = mongoDb.rawMovies.find({'_id': movieId})
	if movieCursor.count() == 0:
		print("The movie with ID \"" + movieId + "\" could not be found. Calling this tool" +
			" without a movie ID will list all available movies.")
	else:
		movieData = movieCursor.next()
		print(movieData['normalizedMovieId'])
		print("=" * len(movieData['normalizedMovieId']) + "\n")
		print("Characters:")
		for uC in movieData['unifiedCharacters']:
			print("\t" + uC)
		print("\n\nScript:\n")

		for quote in mongoDb.rawQuotes.find({'_id.movie': movieId}).sort(
					                    "_id.id",pymongo.ASCENDING):
			if 'attribute' in quote:
				print(quote['character'] + " ("+quote['attribute']+"): "+quote['text'])
			else:
				print(quote['character'] + ": " + quote['text'])
	movieCursor.close()
