#!/bin/bash
cd blog

# TODO: Support toggling the node_env with an argument
exec npm run build 2>&1 | tee ../build.log

# copy index1.html to index.html for convenience and better ux
cp out/index1.html out/index.html
