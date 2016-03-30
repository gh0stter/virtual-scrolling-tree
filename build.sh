#!/usr/bin/env bash

# If error code, stop script
set -e

# Install packages
npm config set strict-ssl false
npm install

# Clean
rm -rf *.tgz
rm -rf virtual-scrolling-tree.js

# Test
node_modules/mocha-phantomjs/bin/mocha-phantomjs test/index.html

# Optimize
node build-tasks.js optimize

if [ "$#" -ne 0 ] && [ $1 = "--release" ]
then
    # Increment package json
    node build-tasks.js update-version $2
    VERSION=`node build-tasks.js get-version`

    # Merge to master and publish
    git add package.json
    git commit -am "Released ${VERSION}"
    git tag "${VERSION}" --force
    git push origin HEAD:master --tags
    npm publish
fi

