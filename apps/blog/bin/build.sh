#!/bin/bash
cd blog
exec npm run build

# copy index1.html to index.html for convenience and better ux
cp blog/out/index1.html blog/out/index.html
