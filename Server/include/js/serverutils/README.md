# Server Utilities
To use this module, include it as a dependency in your package.json.
See https://docs.npmjs.com/files/package.json#local-paths for further information.
This is necessary, to automatically load the dependencies of this package when using `npm install`.

All modules are exposed by `index.js`. Therefore, it can be used as follows:

```javascript
const util = require('serverutils');

// e.g. load the configuration
const config = util.config.getConfiguration();
```
