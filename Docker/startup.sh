#!/bin/sh
# nginx
# mongod -f /etc/mongod.conf --fork --syslog

# echo "mongod started?"
# ps aux | grep mongod
# echo "nginx started?"
# ps aux | grep nginx

echo "Starting app"
node /server/app/app.js