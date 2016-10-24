#!/bin/sh
nginx
mongod -f /etc/mongod.conf --fork --logappend --logpath /logs/mongod.log

cd /Server/Tools/urlUpdater
python3 updateURLs.py -q newHost=/

echo "mongod started?"
ps aux | grep mongod
echo "nginx started?"
ps aux | grep nginx

# echo "Starting app"
cd /Server/app
node app.js
