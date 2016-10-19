from abc import ABC, abstractmethod

import re

class ParsingResult:
	""" Stores a parsing result of a subclass of AbstractParser
	with a confidence level from 0.0 (bad) to 1.0 (good)
	"""

	def __init__(self):
		self.quotes = []
		self.confidence = 1.0
		self.parserName = ""

class ParsedQuote:
	""" Stores a single parsed quote with its speaker

	(the name as it appears in the text).
	"""

	def __init__(self, speaker, quote, attribute = None):
		self.quote = quote if not quote is None else ''
		self.speaker = speaker
		self.attribute = attribute


class AbstractParser(ABC):
	""" Abstract base class for all parser implementations.
	
	The getParseResult method should return an instance of
	which stores the parsed quotes and the confidence level, meaning an
	approximation of the quality of the results from 0.0 (bad) to 1.0 (good)
	"""

	def __init__(self):
		self.__regex_attributes = re.compile('(?:\(([^\)]+)\))?([^\(]+)')

	# Returns the ParsingResult
	# filename: The movie script file as raw HTML
	# movieId: The movie id
	def getParseResult(self, filename, movieId):
		result = ParsingResult()
		result.quotes = self.parseScript(filename, movieId)
		result.confidence = self.calculateConfidence(result.quotes)
		result.parserName = self.__class__.__name__
		return result

	# Returns a list of ParsedQuotes
	# filename: The movie script file as raw HTML
	# movieId: The movie id
	@abstractmethod
	def parseScript(self, filename, movieId):
		pass

	# Calculates the confidence level of the result
	# quotes: The list of ParsedQuotes to evaluate
	@abstractmethod
	def calculateConfidence(self, quotes):
		pass

	# Helper method to find attribute in quotes, separating them into individual quote instances
	# Example:
	# "Wait, I'll check this (into phone) Is he right? (to John, angry) What have you done?"
	# 1) (None) Wait, I'll check this
	# 2) (into phone) Is he right?
	# 3) (to John, angry) What have you done?
	def findAttributesInQuote(self, speaker, quote):
		attributedQuotes = []
		idx = 0
		while idx < len(quote):
			res = self.__regex_attributes.search(quote, idx)
			if res is None:
				break
			attributedQuotes += [ParsedQuote(speaker, res.group(2), res.group(1))]
			idx = res.end()
		return attributedQuotes
