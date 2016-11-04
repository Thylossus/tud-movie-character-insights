#!/bin/bash

docker build . -t moviecharacterinsight:demo

docker run -d -p ${1:-8181}:80 --name moviecharacterinsights moviecharacterinsight:demo

docker logs -f moviecharacterinsights