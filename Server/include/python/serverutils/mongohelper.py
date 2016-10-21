import serverutils.config as config
import re
import sys

from pymongo import MongoClient
from os.path import join
import ssl

# Returns the MongoClient that connects either to the local database or 
# to the non-local database, depending on the current configuration
def getMongoClient(silent = False, orMongoMode = None, orDbName = None, orHost = None, orUserName = None, orPassword = None):
	mongoMode = config.getProperty("mongo.connection.mode") if orMongoMode is None else orMongoMode
	if not mongoMode in ['ssl','local']:
		raise AttributeError('mongo.connection.mode must be either ssl or local')

	dbName = config.getProperty("mongo.dbname") if orDbName is None else orDbName

	if mongoMode == 'local':
		if not silent:
			print("Connecting to MongoDB @ localhost without password, DB = " + dbName)
		client = MongoClient()
		return client, client[dbName]
	else:
		user = config.getProperty("mongo.user") if orUserName is None else orUserName
		password = config.getProperty("mongo.pass") if orPassword is None else orPassword
		host = config.getProperty("mongo.url") if orHost is None else orHost
		if host[0:10]=='mongodb://':
			host = host[10:]

		# Deal with connection strings that contain a database name at the end
		matcher = re.search('/([a-zA-Z0-9_\\-]+)$' , host)
		if matcher is not None:
			urlDbName = matcher.group(1)
			if urlDbName != dbName:
				print("WARNING: Mismatch of Mongo DB name in mongo.dbname and mongo.url!", file=sys.stderr)
				print("         Using name from mongo.url: " + urlDbName, file=sys.stderr)
				dbName = urlDbName
			host = host[:-(len(urlDbName)+1)]

		certPath = config.getProperty("dbCertPath")
		if not silent:
			print("Connecting via SSL to MongoDB @ " + host + ", DB = " + dbName)
		client = MongoClient(host,
					ssl=True,
					ssl_certfile=join(certPath, 'Mongodb.pem'),       
					ssl_cert_reqs=ssl.CERT_REQUIRED,  
					ssl_ca_certs=join(certPath, 'CAChain.pem'))
		client.admin.authenticate(user, password)
		return client, client[dbName]

