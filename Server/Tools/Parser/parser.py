#!/usr/bin/python3
parser_version="1.01"

# Include custom libs
import sys
import traceback
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

from os import listdir
from os.path import isfile, join
import re

import datetime

import btagparser, alignmentparser

class MovieData:
	def __init__(self, title):
		self.__title = title
		self.__quotes=[]
		self.__characters=set()
		self.__quoteId = 0
		self.__unifiedCharacters = {}
		self.__minWordCount = 0
		
		self.__bracketPattern = re.compile('.+(\([^\)]+\))')
		self.__titlePattern = re.compile('^([^,]+), ([a-zA-Z]+)$')
	
	def getMetaData(self):
		return {
			'_id': self.__title,
			'normalizedMovieId': self.getNormalizedMovieId(),
			'parserInfo': {
				'version': parser_version,
				'date': datetime.datetime.now(),
				'minWordCount': self.__minWordCount,
				'implementation': self.__parserName,
				'confidence': self.__parserConfidence
			},
			'characterMapping': [(k,v) for k,v in self.__unifiedCharacters.items()],
			'unifiedCharacters': list(set([c for c in self.__unifiedCharacters.values()]))
		}
	
	def setParserInfo(self, parserName, conf):
		self.__parserName = parserName
		self.__parserConfidence = conf

	def getNormalizedMovieId(self):
		res = self.__titlePattern.match(self.__title)
		if not res is None:
			return res.group(2) + " " + res.group(1)
		else:
			return self.__title

	def addQuote(self, character, text, attribute = None):
		newQuote = {'_id': {
						'movie': self.__title,
						'quote': self.__quoteId
					},
					'scriptCharacter': character,
					'text': text}
		if not attribute is None:
			newQuote['attribute'] = attribute.strip()
		
		self.__quotes += [newQuote]

		self.__characters.add(character)
		if not character in self.__unifiedCharacters:
			self.__unifiedCharacters[character] = character.strip().title()

		self.__quoteId += 1

	def getQuotes(self):
		return self.__quotes

	def getCharacters(self):
		return [c for c in self.__characters]

	def __isCharacterBlacklisted(self, charname):
		charnamel=charname.lower()

		# Use a blacklist for words that must not appear in character names.
		# Characters containing those words (± 3 characters) are removed.		
		characternameBlacklist = ['continued', 'cut to','(beat)','subtitled','fade in','dissolve to', 'continuing']
		for blacklistEntry in characternameBlacklist:
			if charnamel.find(blacklistEntry)>=0 and len(blacklistEntry)-3<len(charnamel):
				return True

		# Check for some movie-script-specific expressions that will almost never
		# be part of character names, if they appear in the beginning of a name
		startIndex = 0
		# Strip Numbers/Dots/Spaces in the beginning
		while charnamel[startIndex].isdigit() or charnamel[startIndex].isspace() or charnamel[startIndex]=='.':
			startIndex+=1
			if startIndex >= len(charnamel):
				return True

		beginningBlacklist = ['int ','int.','ext.','ext ','int_','ext_','cut to','angle:', 'interior', 'exterior', 'back to scene']
		for blacklistEntry in beginningBlacklist:
			if len(charnamel)>=startIndex+len(blacklistEntry):
				if charnamel[startIndex:startIndex+len(blacklistEntry)]==blacklistEntry:
					return True


		# Some Scripts use page numbers formatted like character names. We do
		# not want those things in our database
		if len([c for c in charnamel if c not in ['0','1','2','3','4','5','6','7','8','9','.',':']])==0:
			return True

		return False

	def unifyCharacters(self):
		# Update unification mappings (addQuote() only creates basic mappings
		# of character -> character.strip.title)

		charactersToRemove = []
		for character, mapping in self.__unifiedCharacters.items():
			if self.__isCharacterBlacklisted(character):
				charactersToRemove+=[character]
		for c in charactersToRemove:
			del self.__unifiedCharacters[c]
			self.__quotes = [quote for quote in self.__quotes if quote['scriptCharacter']!=c]

		# Character names with some bracketed part at the end usually perform better
		# when stripping this part (eg from "JOHN (CONT'D)" or "JOHN (TO JIM)" to "JOHN")
		# This also goes for characters ending with "'s voice" and "'s thoughts"
		for character, mapping in self.__unifiedCharacters.items():
			replacedSomething = True
			while replacedSomething:
				replacedSomething = False
				# Check for brackets in the end
				bracketMatches = self.__bracketPattern.findall(mapping)
				for match in bracketMatches:
					mapping = mapping.replace(match, '').strip()
					replacedSomething = True
				# Check for voice or thoughts
				for ending in ["'s thoughts", "'s voice", "'s voices"]:
					idx=-len(ending)
					if mapping[idx:].lower()==ending:
						mapping = mapping[:idx].strip()
						replacedSomething = True
			self.__unifiedCharacters[character] = mapping
		
		# If we have a name that consists of a single word and there is exactly one
		# other name with this word at the beginning or end, this is usually the same
		# person.
		# Examples:
		# Darth Vader & Vader
		# Rick Coleman & Rick
		for srcCharacter, srcMapping in self.__unifiedCharacters.items():
			if srcMapping.find(" ") < 0: # Only one-word-names

				# Find suitable mappings
				suitableMappings = []
				for targMapping in self.__unifiedCharacters.values():
					if targMapping.startswith(srcMapping) or targMapping.endswith(srcMapping):
						suitableMappings += [targMapping]

				# As there may already be more mappings pointing to one unified target:
				suitableMappings = set(suitableMappings)

				if len(suitableMappings) == 1: # Exactly one match
					newMapping = suitableMappings.pop()
					self.__unifiedCharacters[srcCharacter] = newMapping
		
		# Apply unification mappings
		for quote in self.__quotes:
			quote['character'] = self.__unifiedCharacters[quote['scriptCharacter']]

	
	def applyMinWordCount(self, minWordCount = 0):
		self.__minWordCount = minWordCount

		# Count words for each unified character
		wordCounts = {k: 0 for k in self.__unifiedCharacters.values()}
		for quote in self.__quotes:
			wordCount = len(re.findall(r'\w+',quote['text']))
			wordCounts[quote['character']] += wordCount

		# Find characters below the threshold
		insufficientCharacters = [k for k in wordCounts if wordCounts[k]<minWordCount]
		
		# Remove quotes of these characters
		self.__quotes = [quote for quote in self.__quotes if not quote['character'] in insufficientCharacters]

		# Remove character mappings
		self.__unifiedCharacters = {scriptCharacter: character for scriptCharacter, character in self.__unifiedCharacters.items() if not character in insufficientCharacters}


def parseMovieId(filename):
	matcher = re.match('.*"([^"]+)" Script',filename)
	if matcher is not None:
		return matcher.group(1)
	else:
		raise AttributeError("Could not parse movie title from "+filename)

def parseMovieScript(filename, movieId, minWordCount = 0):
	# Build up the general data structure
	movieData = MovieData(movieId)

	# Run different Parsers:
	parserList = [btagparser.BTagParser(),
	              alignmentparser.AlignmentParser()]
	results = []
	for parser in parserList:
		results += [parser.getParseResult(filename, movieId)]
	results = sorted(results, key=lambda r: -r.confidence)
	for result in results:
		print("[INFO] " + ("-> " if result == results[0] else "   ") +
			result.parserName + ": " + str(100.0*result.confidence) + "%")
	
	movieData.setParserInfo(results[0].parserName, results[0].confidence)

	# Take the best result to proceed
	for quote in results[0].quotes:
		movieData.addQuote(quote.speaker, quote.quote, quote.attribute)
	
	# Perform unification for character names
	movieData.unifyCharacters()

	# Apply minimum word count
	movieData.applyMinWordCount(minWordCount)
	
	return movieData

# Read configuration
inDir = config.getProperty("dir.parser.in")
minWordCount = int(config.getProperty("parser.minWordCount"))

print("Script Parser v.", parser_version)
print("================================")

print("Input directory:", inDir)
print("Minimum words per character: ", minWordCount)
if minWordCount < 150:
	print("[WARN] Minimum word count is important for clearing out the noise, caused by" +
		" wrongly-recognized character names etc. - Avoid adjusting this parameter to a" +
		" value below 150!")
print()

mongoClient, mongoDb = mongohelper.getMongoClient()

if len(sys.argv)==1 or (len(sys.argv)==2 and sys.argv[1]=='-forceUpdate'):
	scriptList = [f for f in listdir(inDir) if isfile(join(inDir, f))]
else:
	scriptList = [f for f in listdir(inDir) if isfile(join(inDir, f)) and parseMovieId(f) in sys.argv[1:]]

print('[  0%] Processing', len(scriptList), 'scripts')

countTotal = 0
countError = 0
countSkip  = 0

# Iterate over the input files
for i in range(len(scriptList)):
	countTotal += 1
	print('[%3d%%] Processing'% (100*i/len(scriptList)), scriptList[i])
	filename = join(inDir, scriptList[i])
	movieId = parseMovieId(filename)
	
	# Check the database for an already existing version of this movie to prevent parsing the same file again	
	dbResult = mongoDb['rawMovies'].find({'_id': movieId})
	if dbResult.count() > 0:
		if (not '-forceUpdate' in sys.argv) and (dbResult[0]['parserInfo']['version']==parser_version and dbResult[0]['parserInfo']['minWordCount']==minWordCount):
			print('[%3d%%] Skipping (already in DB)'% (100*i/len(scriptList)))
			countSkip+=1
			continue
		else:
			print('[%3d%%] Replacing (already in DB, but with different configuration)'% (100*i/len(scriptList)))
			mongoDb['rawMovies'].remove({'_id': movieId})
			mongoDb['rawQuotes'].remove({'_id.movie': movieId})
	try:
		movieData = parseMovieScript(filename, movieId, minWordCount)
		
		if len(movieData.getQuotes()) > 0:
			mongoDb['rawMovies'].insert_one(movieData.getMetaData())
			mongoDb['rawQuotes'].insert_many(movieData.getQuotes())
		else:
			print('[ERR ] Could not find any quotes in the input data! Movie was not added')

	except:
		print("[ERR ] Could not parse this script!")
		countError += 1
		traceback.print_exception(sys.exc_info()[0], sys.exc_info()[1], sys.exc_info()[2])

print('[100%] Done. Parsed ' + str(countTotal) + ' scripts, ' + str(countError) + ' with errors, '+
	str(countSkip) + ' skipped')

