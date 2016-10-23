#!/usr/bin/python3
ci_version="0.10"

# This script is used to retrieve corpus information. It can be run after the parser
# has finished its work. The corpus information is part of the final report.
# Database connection is configured in the server configuration.

# Include custom libs
import sys
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import pymongo

mongoClient, mongoDb = mongohelper.getMongoClient(silent = True)

# Initialize all values. To make finding minimal values, we set those
# variables to an extremely high value initially, so that there is at least
# one character that has less...
movieCount = 0
characterCount = 0
minPerMovieCharacterCount = 999
minPerMovieCharacterCountMovie = None
maxPerMovieCharacterCount = 0
maxPerMovieCharacterCountMovie = None
totalWordCount = 0
characterWordCounts = []
minWordCount = 99999
maxWordCount = 0
minWordCountChar = None
maxWordCountChar = None

print("Processing movies ",end="")
# For every movie in our database
for movie in mongoDb.rawMovies.find():
	print(".",end="",flush=True)
	# Count the movie and (re-)initialize movie-specific variables
	movieCount+=1
	characters = {}
	movieCharacterCount = 0

	# For every quote...
	for quote in mongoDb.rawQuotes.find({'_id.movie': movie['_id']}):
		# Sort the quotes into character-specific lists to be able to generate
		# values for the characters
		if quote['character'] in characters:
			characters[quote['character']] = characters[quote['character']] + " " + quote['text']
		else:
			characters[quote['character']] = quote['text']
			movieCharacterCount += 1

	# Calculating word counts for every character
	wordCounts = {cid: len(txt.split()) for cid,txt in characters.items()}
	for char, wc in wordCounts.items():
		totalWordCount += wc
		characterWordCounts += [wc]
		charname = char + " (" + movie['normalizedMovieId'] + ")"
		if minWordCount > wc:
			minWordCount = wc
			minWordCountChar = charname
		elif minWordCount == wc:
			minWordCountChar += ", " + charname
		if maxWordCount < wc:
			maxWordCount = wc
			maxWordCountChar = charname
		elif maxWordCount == wc:
			maxWordCountChar += ", " + charname


	# Adding to total Character Count
	characterCount += movieCharacterCount

	# Counting Characters per Movie
	if minPerMovieCharacterCount > movieCharacterCount:
		minPerMovieCharacterCount = movieCharacterCount
		minPerMovieCharacterCountMovie = movie['normalizedMovieId']
	elif minPerMovieCharacterCount == movieCharacterCount:
		minPerMovieCharacterCountMovie+= ", " + movie['normalizedMovieId']
	if maxPerMovieCharacterCount < movieCharacterCount:
		maxPerMovieCharacterCount = movieCharacterCount
		maxPerMovieCharacterCountMovie = movie['normalizedMovieId']
	elif maxPerMovieCharacterCount == movieCharacterCount:
		maxPerMovieCharacterCountMovie += ", " + movie['normalizedMovieId']

# Display results
print("")
print("Movies in DB:            ", movieCount)
print("Total characters:        ", characterCount)
print("Total words:             ", totalWordCount)
print()
print("Characters per movie...  ")
print("        ... on avarage:  ", float(characterCount)/float(movieCount))
print("               ... max:  ", maxPerMovieCharacterCount, "(in "+maxPerMovieCharacterCountMovie+")")
print("               ... min:  ", minPerMovieCharacterCount, "(in "+minPerMovieCharacterCountMovie+")")
print()
print("Word count...")
print(" ... avg. per character: ", totalWordCount / characterCount)
print("     ... avg. per movie: ", totalWordCount / movieCount)
print("                ... max: ", maxWordCount, "(for " + maxWordCountChar + ")")
print("                ... min: ", minWordCount, "(for " + minWordCountChar + ")")
print()
print("Word count - amount of characters:")
for i in range(0, maxWordCount + 500, 500):
	print("  " + str(i) + " - " + str(i+499) + ": "+str(len(list(filter(lambda a: i <= a < i+500, characterWordCounts)))))

