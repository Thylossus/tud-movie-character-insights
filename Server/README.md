# Server

This directory contains code for the backend, the data processing pipeline, and the analysis of both evaluation rounds.

## Backend
The backend can be found in the *app* directory. It is a REST API built with [Express](https://expressjs.com/), the [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md), and [mongoose](http://mongoosejs.com/).

## Data Processing Pipeline
The data processing pipeline consists of the following tools in the *Tools* directory:

* Crawler - Get the movie scripts from [http://www.imsdb.com/](http://www.imsdb.com/).
* Parser - Parse the crawled scripts.
* quotesToWatsonBatcProcessor - Use the utterances extracted from the scripts by the parser to sent them to the Personality Insights service and receive the personality analyses.
* normalize-personality - Normalize the received personality values.
* MetaInfoFinder - Search several sources for movie and character metadata and images.
* normalize-imdb - Normalize [IMDb](http://www.imdb.com/) ratings.

## Analysis
Within the *Tools* directory, the directories *evaluation*, *evaluation basic*, and *ReEvaluator* all contain tools to analyze the results from both evaluation rounds.

## include
The directory *include* contains common modules used by tools and the backend. 