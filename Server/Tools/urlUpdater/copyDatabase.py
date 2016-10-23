#!/usr/bin/python3
# -*- coding: UTF-8 -*-
import sys

# Include custom libs
sys.path.append( '../../include/python' )

import serverutils.config as config
import serverutils.mongohelper as mongohelper

import pymongo

props = {'targetDbName': 'characterinsights_copy'}
for prop in sys.argv[1:]:
	k,v = prop.split("=",1)
	props[k]=v

# Connect DBs
mongoClientSource, mongoDbSource = mongohelper.getMongoClient()
mongoClientTarget, mongoDbTarget = mongohelper.getMongoClient(orMongoMode='local',orHost='localhost',orDbName=props['targetDbName'])

collections = ['inouttest','movies','personalitydimensionnormalizations','rawMovies','rawQuotes','results']

for collection in collections:
	print(collection)
	for doc in mongoDbSource[collection].find():
		mongoDbTarget[collection].insert_one(doc)
		print('.',end='',flush=True)
	print("")

print("Done.")
