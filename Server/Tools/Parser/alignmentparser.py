import scriptparsers
import re

class AlignmentParser(scriptparsers.AbstractParser):
	""" This Parser tries to use alignment information to parse scripts"""

	class ScriptDocument:
		
		def __init__(self):
			self.__lastLineBold = False
			self.__rows = []

		def addLine(self, line):
			line = line.replace("\n","").replace("\r","")
			row = AlignmentParser.ScriptRow(line, self.__lastLineBold)
			self.__lastLineBold = row.endsBold()
			self.__rows += [row]

		def getRows(self):
			return self.__rows


	class ScriptRow:
		
		patternWhitespace = re.compile('[^\s]')
		

		def __init__(self, text, bold):
			self.__tokens = []
			self.__length = 0
			self.__emptyRow = True
			self.__firstContentToken = None

			i = 0			
			lastType = 'u' # unknown
			lastIndex = 0
			newBold = bold
			while i < len(text):
				newType = 'u'
				if text[i].isspace():
					newType = 's' # space
				elif text[i] == '<':
					if text[i:i+3]=='<b>':
						newBold=True
						newType = 'u'
						i+=2 # adjust index
					elif text[i:i+4]=='</b>':
						newBold=False
						newType = 'u'
						i+=3 # adjust index
					else:
						newType = 'w' # word
				else:
					newType = 'w'
				
				if newType!=lastType:
					if lastType == 'w':
						t = AlignmentParser.ScriptToken(text[lastIndex:i], bold)
						self.__tokens += [t]
						self.__emptyRow = False
						if self.__firstContentToken is None:
							self.__firstContentToken = t
					elif lastType == 's':
						self.__tokens += [AlignmentParser.ScriptWhitespace(i-lastIndex)]
					lastType = newType
					lastIndex = i
					# unknown needs no processing (only tags or other garbage)
				bold = newBold
				
				i+=1 # next character

			# Process the last token
			if lastType == 'w':
				t = AlignmentParser.ScriptToken(text[lastIndex:], bold)
				self.__tokens += [t]
				self.__emptyRow = False
				if self.__firstContentToken is None:
					self.__firstContentToken = t
			elif lastType == 's':
				self.__tokens += [AlignmentParser.ScriptWhitespace(len(text)-lastIndex)]

			# Find row properties
			self.__endBold = bold
			
			# Calculate row length (Exclude whitespace tokens in beginning and end
			self.__initialPadding = 0
			for token in self.__tokens:
				self.__length += len(token)
			if len(self.__tokens)>0:
				if isinstance(self.__tokens[0], AlignmentParser.ScriptWhitespace):
					self.__length -= len(self.__tokens[0])
					self.__initialPadding = len(self.__tokens[0])
				if len(self.__tokens) > 1 and isinstance(self.__tokens[-1], AlignmentParser.ScriptWhitespace):
					self.__length -= len(self.__tokens[-1])

		def __str__(self):
			s = "Row(pad=" + str(self.__initialPadding)
			s+= ", len=" + str(self.__length) + ", tokens=["
			for i in range(len(self.__tokens)):
				token=self.__tokens[i]
				if i>0:
					s+=", "
				s+=str(token)
			return s+"])"

		def __len__(self):
			return self.__length

		def endsBold(self):
			return self.__endBold

		def getTokens(self):
			return self.__tokens

		def getInitialPadding(self):
			return self.__initialPadding

		def isEmptyRow(self):
			return self.__emptyRow

		def getFirstContentToken(self):
			return self.__firstContentToken

	class ScriptWhitespace:
		
		def __init__(self, length):
			self.__length = length

		def __len__(self):
			return self.__length

		def __str__(self):
			return "WhiteSpace("+str(self.__length)+")"

		def getContent(self):
			return " "

	class ScriptToken:

		def __init__(self, content, bold):
			self.__bold = bold
			self.__content = content

		def __len__(self):
			return len(self.__content)

		def __str__(self):
			return "Token(\""+self.__content+("\", bold" if self.__bold else "\"")+")"

		def isBold(self):
			return self.__bold
		
		def getContent(self):
			return self.__content

	def parseScript(self, filename, movieId):
		
		# Reset confidence information
		# Confidence calculation is based on the reason for breaking the input
		# apart: If it's mostly done because the indentation changes, it might
		# be a good idea to use this parser
		self.__confBoldBreaks = 1.0
		self.__confPaddBreaks = 1.0

		# Generate document structure
		doc = AlignmentParser.ScriptDocument()
		for line in open(filename, 'r'):
			doc.addLine(line)

		return self.__getQuotes(doc)

	def __getQuotes(self, doc):
		quotes = []

		padding = -1 # -1 means: The next non-bold token defines the padding to use
		speaker = None # None: No active speaker, create no quotes
		tokens = [] # List of tokens for current speaker
		bold = False

		# Iterate over Tokens
		for row in doc.getRows():
			# Check for a non-empty line with different padding
			rowPadding = row.getInitialPadding()
			firstContentToken = row.getFirstContentToken()
			#print(str(row)+"\n\tSpeaker: "+str(speaker)+"\n\tTokens:  "+str(tokens)+"\n\tPadding: "+str(padding))

			if not row.isEmptyRow() and rowPadding != padding:
				if len(tokens) > 0 and speaker is not None and len(speaker)>0 and padding>=0:
					# The padding changed, the quote ends here
					quotes += self.__createQuote(speaker, tokens)
					self.__confPaddBreaks += 1.0
					speaker = None
					tokens = []
					padding = -1

			# Check tokens in this row
			for token in row.getTokens():
				if isinstance(token, AlignmentParser.ScriptToken):
					# Set padding if required
					if padding == -1 and not token.isBold() and firstContentToken.getContent()[0]!="(":
						padding = rowPadding
					
					# If the previous token wasn't bold and this is: New speaker
					if not bold and token.isBold():
						# If there is a previous speaker and the quote has tokens
						# it's time to save it.
						if len(tokens) > 0 and speaker is not None and len(speaker)>0:
							quotes += self.__createQuote(speaker, tokens)
							self.__confBoldBreaks += 1.0
						tokens = []
						speaker = ""
						padding = -1

					# Update state
					bold = token.isBold()

				# Append token
				if bold and speaker is not None:
					speaker += token.getContent()
				elif not bold:
					tokens += [token.getContent()]

		return quotes

	def __createQuote(self, speaker, tokens):
		# Create a quote of a token list
		quote = "".join(tokens).strip()
		if len(quote) > 0:
			return self.findAttributesInQuote(speaker.strip(), quote)
		else:
			return []

	def calculateConfidence(self, quotes):
		return self.__confPaddBreaks / (self.__confBoldBreaks + self.__confPaddBreaks)

