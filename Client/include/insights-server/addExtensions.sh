#!/bin/bash

# sed "s/\(require('[^']*\)\(')\)/\1.js\2/g"

# NOTE: this will fail for files with spaces in their names (who does this?!)
# Add .js extension to require calls, disable AMD modules, and remove require statemens that try to load node specific modules (e.g. require('fs'))
# Due to [^.'] in the first regex, this script is idempotent, i.e. it can be safely executed multiple times
# require('fs'): This is a special treatment for ApiClient.js to prevent calling require('fs') because this causes webpack to fail
find . -name '*.js' \
  -exec sed -i "s/\(require('\.\.*\/[^.']*\)\(')\)/\1.js\2/g" {} + \
  -exec sed -i "s/typeof define === 'function' && define.amd/false/g" {} + \
  -exec sed -i "s/require('fs') &&/false/" {} + \
  -exec sed -i "s/param instanceof require('fs').ReadStream//"  {} +
