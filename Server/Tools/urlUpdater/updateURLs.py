#!/usr/bin/python3
# -*- coding: UTF-8 -*-
import sys
import re

# Include custom libs
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import pymongo

quiet = False
while '-q' in sys.argv:
	quiet = True
	sys.argv.remove('-q')

if '--help' in sys.argv:
	if not quiet:
		print()
		print("Update image URL hosts in the database")
		print()
		print("  Usage: updateURLs.py [newHost=http[s]://hostname[:port]]")
		print()
		print("  Default hostname is https://localhost")
		print("  The database may be configured in server.conf")
		print()
	exit()

def replaceUrl(url, newHostname):
	if len(url) > 0:
		m = re.search('^(http|https)://[^:/]+(:[0-9]{1,5})?/',url)
		if m is None:
			if not quiet:
				print("ERROR: Could not detect previous host in URL:",url)
				print("       URL will not be modified.")
			return url
		return newHostname + "/" + url[len(m.group(0)):]
	else:
		return url

if not quiet:
	print("Updating image URLs in database. This may take a few seconds...")

props = {'newHost': 'https://localhost'}
for prop in sys.argv[1:]:
	k,v = prop.split("=",1)
	props[k]=v

newHostname = props['newHost']

# Check for correct protocol
if newHostname[0:7]!='http://' and newHostname[0:8]!="https://":
	if not quiet:
		print("Invalid new hostname:",newHostname)
		print("The hostname has to start either with http:// or https://")
	exit()

# Remove any trailing slashes
while newHostname[-1:]=="/":
	newHostname = newHostname[:-1]

if newHostname[8:].find("/") > 0:
	if not quiet:
		print("Invalid new hostname:",newHostname)
		print("The hostname must not contain any slashes")
	exit()

if not quiet:
	print("New host is",newHostname)

# Connect DBs
mongoClient, mongoDb = mongohelper.getMongoClient(silent=quiet)

for movie in mongoDb['movies'].find():
	movieName = movie['names']['resolved'] if len(movie['names']['resolved'])>0 else movie['names']['scriptUnified']
	if not quiet:
		print("Processing",movieName)

	dataChanged = False

	oldMoviePosterUrl = movie['picture']['path']
	newMoviePosterUrl = replaceUrl(oldMoviePosterUrl,newHostname)

	if oldMoviePosterUrl!=newMoviePosterUrl:
		movie['picture']['path'] = newMoviePosterUrl
		dataChanged = True
		if not quiet:
			print("\t"+oldMoviePosterUrl+" --> "+newMoviePosterUrl)

	for movieCharacter in movie['characters']:
		oldCharImageUrl = movieCharacter['picture']['path']
		newCharImageUrl = replaceUrl(oldCharImageUrl,newHostname)

		if oldCharImageUrl!=newCharImageUrl:
			movieCharacter['picture']['path'] = newCharImageUrl
			dataChanged = True
			if not quiet:
				print("\t"+oldCharImageUrl+" --> "+newCharImageUrl)
	if dataChanged:
		mongoDb['movies'].replace_one({'_id': movie['_id']},movie)

