#!/bin/bash
echo "Checkout deploy/frontend"
git checkout deploy/frontend
echo "Merge master into deploy/frontend"
git merge master
echo "Push to upstream"
git push
echo "Checkout master"
git checkout master
