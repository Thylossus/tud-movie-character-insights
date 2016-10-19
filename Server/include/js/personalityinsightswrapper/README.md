# Personality Insights Wrapper
To use this module, include it as a dependency in your package.json.
See https://docs.npmjs.com/files/package.json#local-paths for further information.
This is necessary, to automatically load the dependencies of this package when using `npm install`.

All modules are exposed by `index.js`. Therefore, it can be used as follows:

```javascript
const personalityInsightsWrapper = require('personalityinsightswrapper');

personalityInsightsWrapper.serviceCall(
  req.body.inputText, // first parameter is text you want to process
  // second parameter is a callback which is run once the service provided an answer
  function(_answer,error){
  		if(error)
  			console.log("got error: " + error.error);
  		else
			// do whatever you like with _answer
	}, 
	// third parameter is optional, is checked when the originalAnswer of the IBM service should be 
	// part of the answer, default is false
	true);
```

