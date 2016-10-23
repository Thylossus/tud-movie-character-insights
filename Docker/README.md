# Docker Demo

This folder contains the `Dockerfile` which can be used to build the demo docker container.
Besides the files already contained in this folder, the following files have to be copied into this folder:

 * server.user.conf
 * images.tar.gz
 * dbdump.tgz

These files are necessary to build the container but cannot be hosted in this repository as they are too large
or contain sensitive information.

## server.user.conf
A configuration file which amongst other information contains sensitive credentials.
The configuration file contains key-value pairs. The following needs to be specified:

```
dir.base=/Server

mongo.connection.mode=local
mongo.dbname=characterinsights

mongo.url=mongodb://localhost/${mongo.dbname}

watsonCredentialsUsername=<ADD USERNAME FOR PERSONALITY INSIGHTS SERVICE INSTANCE>
watsonCredentialsPassword=<ADD PASSWORD FOR PERSONALITY INSIGHTS SERVICE INSTANCE>
```

## images.tar.gz
An archive containing all movie posters and character portraits.

## dbdump.tgz
A database dump which will be used to populate the container's database.