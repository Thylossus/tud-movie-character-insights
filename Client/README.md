# Movie Character Insights Client

## Overview

The client for the movie character insights application is a web application.
In particular, it is a single page application (SPA) which is developed using [React](https://facebook.github.io/react/) as the view layer
and [Redux](http://redux.js.org/) for managing the application state.

Moreover, we use [Material-UI](http://www.material-ui.com/#/) to apply Google's
[Material design](https://www.google.com/design/spec/material-design/introduction.html) specification to our application.

As a style guide we rely on [Airbnb's React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react) and enforce it with [ESLint](http://eslint.org/) when possible.
Further guidelines can be obtained from Khan Academy's style references (https://github.com/Khan/style-guides/blob/master/style/react.md and https://docs.google.com/document/d/1ChtFUao18IyNhaXZ5sE2W-CFuFcYnqlFTyi5gfe6XV0/edit).

Especially, the following concept from [Khan Academy's style reference](https://github.com/Khan/style-guides/blob/master/style/react.md) is important:

> A common pattern — which matches the "logic" vs. "presentation" component distinction — is to create several stateless components that just render data,
> and have a stateful component above them in the hierarchy that passes its state to its children via props. The stateful component encapsulates all of 
> the interaction logic, while the stateless components take care of rendering data in a declarative way.

The folder structure is based on the [Redux real-world example](https://github.com/reactjs/redux/tree/master/examples/real-world).

## Resources

* [React documentation](https://facebook.github.io/react/docs/getting-started.html)
* [Redux documentation](http://redux.js.org/)
* [Redux introduction video course](https://egghead.io/series/getting-started-with-redux) (approx. 1:30h)
* [Material UI components](http://www.material-ui.com/#/components/app-bar)
* [Airbnb's React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)


## Commands

* `npm start`: run development server with hot reloading
* `npm run lint`: only run eslint
* `npm run build`: only run webpack build process

## Deployment
To deploy the client to Azure, just merge the version you want to deploy into deploy/frontend and push the branch to remote.
This can be automated by running `./deploy-client.sh` in the root directory of this repository.
