#!/usr/bin/env bash

# If error code, stop script
set -e

# Install packages
npm config set strict-ssl false
npm install

# Clean
rm -rf *.tgz
rm -rf target
rm -rf dist

# Test
node build-tasks.js test

# Optimize
node build-tasks.js optimize
mkdir dist
cp target/virtual-scrolling-tree.js dist/virtual-scrolling-tree.min.js

# Build Demo
mkdir -p target/demo/vst
cp index.html target/demo/vst/index.html
cp require.config.demo.js target/demo/vst/require.config.js
cp package.demo.json target/demo/vst/package.json
cd target/demo/vst
npm install
npm install ../../../
cd ../../../


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

    # Clone website and push demo
    cd target
    git clone git@github.com/PepsRyuu/pepsryuu.github.io.git
    cp -R demo pepsryuu.github.io/
    cd pepsryuu.github.io
    git add --all
    git commit -am "Added demo for virtual-scrolling-tree@${VERSION}"
    git push origin master
fi

