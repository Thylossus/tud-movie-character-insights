#!/bin/sh
echo "starting in 5 seconds, please copy server.user.conf now"
sleep 5
nginx
mongod -f /etc/mongod.conf --fork --logappend --logpath /logs/mongod.log

cd /Server/Tools/urlUpdater
python3 updateURLs.py -q newHost=/

echo "mongod started?"
ps aux | grep mongod
echo "nginx started?"
ps aux | grep nginx

echo "Starting app"
cat /Server/server.user.conf
cd /Server/app
node app.js
