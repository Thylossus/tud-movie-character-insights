FROM debian:jessie

MAINTAINER Tobias Kahse

LABEL Description="This image is used to run the Movie Character Insights web application."

# Get the latest package lists
RUN apt-get update

# Install git
RUN apt-get install -y git

# Install MongoDB
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
RUN echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.2 main" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
RUN apt-get update
RUN apt-get install -y mongodb-org=3.2.10 mongodb-org-server=3.2.10 mongodb-org-shell=3.2.10 mongodb-org-mongos=3.2.10 mongodb-org-tools=3.2.10

# Install cURL
RUN apt-get install -y curl

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs

# Install Nginx
RUN apt-get install -y nginx

# Download repository
RUN git clone https://github.com/Thylossus/tud-movie-character-insights

# Copy code
COPY ./tud-movie-character-insights/Server /mci/server
COPY ./tud-movie-character-insights/Client /mci/client

# Copy resources
# Expecting the following files in this directory
#  - images.tar.gz
#  - dbdump.bson
COPY ./images.tar.gz /temp
COPY ./dbdump.bson /temp

# Copy server.user.conf (expect the file to be in this directory)
COPY ./server.user.conf /mci/server

# Build client
WORKDIR /mci/client
RUN npm install && npm run prebuild && npm run build

# Build server
WORKDIR /mci/server
RUN npm install --production

# 

# TODO
# [ ] configure mongodb
# [ ] configure nginx
# [x] COPY code
# [x] COPY resources
# [x] COPY server.user.conf (could also be solved by mounting the file, but not on windows hosts...)
# [x] build client
# [ ] copy client code to nginx host directory (or configure nginx so that it hosts the build folder)
# [ ] extract images
# [ ] start database server
# [ ] import database dump
# [ ] start nginx
# [ ] start server (npm start)
