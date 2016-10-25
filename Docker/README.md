# Docker Demo

This folder contains the `Dockerfile` which can be used to build the demo docker container.
Besides the files already contained in this folder, the following files have to be copied into this folder:

 * server.user.conf
 * images.tar.gz
 * dbdump.tgz

These files are necessary to build the container but cannot be hosted in this repository as they are too large
or contain sensitive information.

## Building
To build the container, just provide the files mentioned above (and explained below), go to the `Docker` folder (i.e. this folder) and run

```
docker build .
```

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

## Running
The web application is exposed through port 80. To get access to this port, it has to be exposed to the host. This can be done as follows:

```
# Assumption: you are already in the Docker folder
# Build the container and give it a name (just for convenience)
docker build . -t demo
# Run the container and bind port 80 of the container to port 9000 of the host
docker run -p 9000:80 --name moviecharacterinsights -t demo
```
