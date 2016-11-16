FROM debian:jessie

MAINTAINER Tobias Kahse

LABEL Description="This image is used to run the Movie Character Insights web application."

RUN echo "Building movie character insights demo container"

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
RUN apt-get install -y nginx apache2-utils

# Install python + dependencies
RUN apt-get install -y python3 python3-pip
RUN pip3 install pymongo 

# Create database and temp directory
RUN mkdir /data && mkdir /temp

# Copy resources
# Expecting the following files in this directory
#  - images.tar.gz
#  - dbdump.tgz
#  - mongod.conf
COPY ./images.tar.gz /temp/
COPY ./dbdump.tgz /temp/
COPY ./mongod.conf /etc/

# Restore database dump
RUN mkdir /temp/dbdump && tar -xzvf /temp/dbdump.tgz -C /temp/dbdump
RUN mkdir /logs && touch /logs/mongod.log
RUN mongod -f /etc/mongod.conf --fork --logappend --logpath /logs/mongod.log && \
    mongorestore --host localhost --port 27017 /temp/dbdump/2016-10-21_06h34m.Friday 

# Create directory for client and images
RUN mkdir -p /var/www/html/mci/img/movies

# Extract and copy images
WORKDIR /temp
RUN tar -xzvf images.tar.gz -C /var/www/html/mci/img/movies

# Download repository
WORKDIR /code
RUN echo "Loading source code from repo https://github.com/Thylossus/tud-movie-character-insights"
RUN git clone https://github.com/Thylossus/tud-movie-character-insights

# Build client
WORKDIR /code/tud-movie-character-insights/Client
RUN npm install
# Update URL reference in ApiClient.js
RUN sed -i "s#'http://localhost:8080/'#document.location.origin\+'/api'#g" ./node_modules/insights-server/src/ApiClient.js
RUN echo {} > ./build.user.config.json
RUN npm run build
RUN cp ./build/* /var/www/html/mci

# Build server
WORKDIR /code/tud-movie-character-insights/Server/app
RUN npm install --production
RUN mkdir /Server
RUN htpasswd -b -c /Server/.demopass demo pass
RUN cp -R /code/tud-movie-character-insights/Server/* /Server

# Cleanup
RUN rm -rf /code
RUN rm -rf /temp
RUN rm -rf /var/lib/apt/lists/*

# Create empty certificates so that the server won't fail to start
RUN mkdir /Server/dbCerts && \
    touch /Server/dbCerts/CAChain.pem && \
    touch /Server/dbCerts/Mongodb.pem 

# Copy configuration resources
#  - nginx.conf
#  - startup.sh
#  - server.user.conf
COPY ./nginx.conf /etc/nginx/
COPY startup.sh /Server/
COPY server.user.conf /Server/

WORKDIR /Server

# Expose ports
EXPOSE 80

RUN cat /Server/app/app.js

# Make startup script executable and expose it as the entry point
RUN chmod +x /Server/startup.sh
ENTRYPOINT /Server/startup.sh
