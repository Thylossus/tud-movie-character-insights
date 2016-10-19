import scriptparsers
import re

class BTagParser(scriptparsers.AbstractParser):
	""" Parser that mainly relies on the <b>-Tags to find character names etc. """


	def parseScript(self, filename, movieId):
		quoteList = []
		self.__sp=''

		with open(filename, 'r') as f:
			carryover = ''
			for line in f:
				lineData, carryover = self.__parseScriptLine(line, carryover)
				quoteList.extend(lineData)
		
		return quoteList

	def calculateConfidence(self, quotes):
		return 0.5 # Baseline implementation, returns 50% confidence everytime

	
	class ChunkInfo:
		def __init__(self, t):
			if t.find('<b>') >= 0:
				self.text = t[t.find('<b>')+3:t.find('</b>')].strip()
				self.bold = True
			else:
				self.text = t.strip()
				self.bold = False
			self.empty = self.text.isspace()
	
		def prettify(self):
			
			# Find "INSERT CUT" - an inline director statement
			endIndices = [len(self.text)]
			endIndices += [self.text.find("INSERT CUT:")]

			# Cut text after double line break
			endIndices += [self.text.find("\n\n")]
			endIndices += [self.text.find("\r\n\r\n")]
			endIndices += [self.text.find("\r\r")]

			# Find the lowest, non-negative index
			endIndex = min([i for i in endIndices if i >= 0])
			
			self.text = re.sub('\s+',' ', self.text[:endIndex+1])

	def __getNextChunk(self, line):
		line = line.strip()
		nextB = line.find('<b>')
		if (nextB == 0):
			nextBEnd = line.find('</b>')
			if (nextBEnd >= 0):
				return self.__removeDuplicateWhitespace(line[0:nextBEnd+4]), nextBEnd+4
			else:
				return '', 0
		elif (nextB < 0):
			return '', 0
		else:
			return self.__removeDuplicateWhitespace(line[0:nextB]), nextB


	def __removeDuplicateWhitespace(self, a):
		# Remove Spaces
		a = re.sub(' +',' ', a)

		return a

	# Returns a list ParsedQuotes, each representing a quote of the script
	def __parseScriptLine(self, line, carriedover):
		chunks = []
	
		line = (carriedover + line).lstrip()
	
		hasMore = True
		while hasMore:
			nextChunk, chunkLength = self.__getNextChunk(line)
			if chunkLength==0:
				hasMore = False
			else:
				line = line[chunkLength:]
				chunks += [self.ChunkInfo(nextChunk)]

		parsedData = []

		for chunk in chunks:
		
			if chunk.empty:
				self.__sp = ''
			elif chunk.bold:
				self.__sp = '' + chunk.text
			else:
				chunk.prettify()
				if len(self.__sp)>0:
					parsedData+= self.findAttributesInQuote(self.__sp, chunk.text)

		return parsedData, line

