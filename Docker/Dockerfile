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

# Install python + dependencies
RUN apt-get install -y python3 python3-pymongo

# Download repository
WORKDIR /code
RUN git clone https://github.com/Thylossus/tud-movie-character-insights

# Create directory for client and images
RUN mkdir -p /var/www/html/mci/img/movies

# Build client
WORKDIR /code/tud-movie-character-insights/Client
RUN npm install
RUN echo {} > ./build.user.config.json
RUN npm run build
RUN cp ./build/* /var/www/html/mci

# Build server
WORKDIR /code/tud-movie-character-insights/Server/app
RUN npm install --production
RUN mkdir /server
RUN cp -R /code/tud-movie-character-insights/Server/* /server

# Create empty certificates so that the server won't fail to start
RUN mkdir /server/dbCerts && \
    touch /server/dbCerts/CAChain.pem && \
    touch /server/dbCerts/Mongodb.pem 

# Create database and temp directory
RUN mkdir /data && mkdir /temp

# Copy resources
# Expecting the following files in this directory
#  - images.tar.gz
#  - dbdump.tgz
#  - nginx.conf
#  - mongod.conf
#  - startup.sh
#  - server.user.conf
# COPY ./images.tar.gz /temp
COPY ./dbdump.tgz /temp
COPY ./nginx.conf /etc/nginx
COPY ./mongod.conf /etc
COPY startup.sh /server
COPY server.user.conf /server

# Extract and copy images
# WORKDIR /temp
# RUN tar -xzvf images.tar.gz -C /var/www/html/img/movies

# Restore database dump
RUN mkdir /temp/dbdump && tar -xzvf /temp/dbdump.tgz -C /temp/dbdump
RUN mongod -f /etc/mongod.conf --fork --syslog && \ 
    mongorestore --host localhost --port 27017 /temp/dbdump/2016-10-21_06h34m.Friday

# Replace image paths
RUN python3 /server/Tools/urlUpdater/updateURLs.py newHost=http://localhost

# Cleanup
# RUN rm -rf /code
# RUN rm -rf /temp
# RUN rm -rf /var/lib/apt/lists/*

# Expose ports
EXPOSE 80

# Make startup script executable and expose it as the entry point
RUN chmod +x /server/startup.sh
ENTRYPOINT /server/startup.sh