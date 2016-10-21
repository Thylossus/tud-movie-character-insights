#!/usr/bin/python3
# -*- coding: UTF-8 -*-
import sys
import re

# Include custom libs
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import pymongo

if '--help' in sys.argv:
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
			print("ERROR: Could not detect previous host in URL:",url)
			print("       URL will not be modified.")
			return url
		return newHostname + "/" + url[len(m.group(0)):]
	else:
		return url

print("Updating image URLs in database. This may take a few seconds...")

props = {'newHost': 'https://localhost'}
for prop in sys.argv[1:]:
	k,v = prop.split("=",1)
	props[k]=v

newHostname = props['newHost']

# Check for correct protocol
if newHostname[0:7]!='http://' and newHostname[0:8]!="https://":
	print("Invalid new hostname:",newHostname)
	print("The hostname has to start either with http:// or https://")
	exit()

# Remove any trailing slashes
while newHostname[-1:]=="/":
	newHostname = newHostname[:-1]

if newHostname[8:].find("/") > 0:
	print("Invalid new hostname:",newHostname)
	print("The hostname must not contain any slashes")
	exit()

print("New host is",newHostname)

# Connect DBs
mongoClient, mongoDb = mongohelper.getMongoClient()

for movie in mongoDb['movies'].find():
	movieName = movie['names']['resolved'] if len(movie['names']['resolved'])>0 else movie['names']['scriptUnified']
	print("Processing",movieName)

	oldMoviePosterUrl = movie['picture']['path']
	newMoviePosterUrl = replaceUrl(oldMoviePosterUrl,newHostname)

	if oldMoviePosterUrl!=newMoviePosterUrl:
		movie['picture']['path'] = newMoviePosterUrl
		print("\t"+oldMoviePosterUrl+" → "+newMoviePosterUrl)

	for movieCharacter in movie['characters']:
		oldCharImageUrl = movieCharacter['picture']['path']
		newCharImageUrl = replaceUrl(oldCharImageUrl,newHostname)

		if oldCharImageUrl!=newCharImageUrl:
			movieCharacter['picture']['path'] = newCharImageUrl
			print("\t"+oldCharImageUrl+" → "+newCharImageUrl)

	mongoDb['movies'].replace_one({'_id': movie['_id']},movie)

