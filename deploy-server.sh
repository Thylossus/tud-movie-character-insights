#!/bin/bash
echo "Checkout deploy/backend"
git checkout deploy/backend
echo "Merge master into deploy/backend"
git merge master
echo "Push to upstream"
git push
echo "Checkout master"
git checkout master
