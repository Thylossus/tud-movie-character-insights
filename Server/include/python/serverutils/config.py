import os
import re

def getConfiguration():
	#TODO: Cache config, so that it will not be read everytime someone calls this method

	# Find the server root as the configuration files are located there
	serverRoot = getServerRoot()
	
	# Get common config and user config
	config = readConfigurationFile(os.path.join(serverRoot, "server.conf"))
	userconfig = readConfigurationFile(os.path.join(serverRoot, "server.user.conf"))

	# Override entries of config with the userconfig
	for key in userconfig:
		config[key] = userconfig[key]

	# Finally, repalce placeholders (${dir.base} etc)
	varPattern = re.compile('\$\{([a-zA-Z0-9\._]+)\}')
	varsReplaced = True # iterate as long as there are replacements
	while varsReplaced:
		varsReplaced = False
		for key in config:
			m = varPattern.match(config[key])
			#TODO: Check for multiple vars in single expression
			if not m is None:
				varname = m.group(1)
				if varname in config:
					placeholder = '${' + varname + '}'
					config[key] = config[key].replace(placeholder, config[varname])
					varsReplaced = True
				else:
					print("Configuration file uses a variable that is not defined:", varname)

	# Return the config
	return config

def getProperty(propname):
	configuration = getConfiguration()
	return configuration[propname]

def getServerRoot():
	serverRoot = os.path.dirname(os.path.abspath(__file__))
	while(len(serverRoot)>0 and serverRoot[-6:]!="Server"):
		serverRoot,_ = os.path.split(serverRoot)
	return serverRoot

def readConfigurationFile(filename):
	kvPattern = re.compile('([^=]+)=(.*)')

	filehandle = open(filename, 'r')

	config = {}

	for line in filehandle:
		if(line[0:1]!="#" and not line.isspace()):
			kvMatch = kvPattern.match(line.strip())
			if not kvMatch is None:
				key = kvMatch.group(1)
				value = kvMatch.group(2)
				if not value.isspace():
					config[key.strip()]=value.strip()
	
	filehandle.close()
	return config

