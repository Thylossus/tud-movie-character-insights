# Meta Info Finder
A tool to find more information and images to a movie and it's containing characters. (Doc might change, not done yet!)

## Configuration
What needs to be done to run the script.
#### General
This project contains a ``keysDemo.js`` which is checked into the repsository. This file must be copied to a file called ``keys.js``, which will ne be checked in into the repository. The keys in the demo file must be replaced with valid keys. For now only a key for the BING API is needed.

Afterwards you may run `npm install` and `npm start` as usual.

#### config.js
Some fields might need changing when running the script in the main `config.js`.
* `bing.wikiaSearchAmount`: Even with the API key there is a limit of 5000 results/month. For each movie a bing request is sent in order to find a good wikia with the information about characters. This property determines how many results are requested from bing.
  * a higher number will lead to prior reaching the API limit
  * a lower number might lead to finding not a good wikia, espercially for more uncommon movies.
* `images.movieBaseFolder`: Images of movies (and their characters) are stored in this path (relative to this directory), within a separate folder with the movie's name.
  * Example: For *Lord of the Rings* and ``movieBaseFolder: 'movies'`` all ressources for this movie would be stored in ``./movies/Lord of the Rings/*``
* ``images.moviePosterName``: Name of the main poster for an image.
* ``images.movieExternalFolder``: This is the equivalent of ``movieBaseFolder``, but not how images are stored on the local system, but what path is stored in the database. This should usually be the relative URL to the image ressource.
* `mongo`: For details about connecting see http://mongoosejs.com/docs/connections.html

#### readInput.js
(I will probably do that)
This is the step between the crawled and parsed data from movie scripts,and how it is converted to fit the tools input types. This function needs to supply the search entries for movies like following:
```javascript
next(null, searchEntries
```
While ``searchEntries`` is an array of search entries, as follows:
```javascript
{
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    figures: [
        'Frodo',
        'Gandalf',
        // ...
    ]
}
```
Be aware that the tool does not check for movies that have already been parsed. Only return searchEntries of movies that have not been searched yet, in order to preven double entries.

## These things might break!
As many steps are invleved finding all the required information about movie and characters a few things might go wrong on they way. However in every case a movie document will be created containing it's characters. In the worst case (if nothin was found at all) it will only consist of the provided information from the searchEntries.

#### OMDB API
If the movie is not found in the OMDB API no information like plot or picture can will be stored in the database. 

**Possible problems:** 
* The OMDB API needs the correct movie title, no abbreviation, no shortened version att all. Must be perfect! :-)

#### OMDB Website
Unfortunately the API does not give information about the mapping from shortened character names (like used in the script) and the correct full names of the characters. This information however can be retrieved with html-crawling using sessions. 

**Possible problems:**
* Movie not found: no resolved character names
* Wrong movie found: character names are resolved to a wrong name! Very bad thing. A warning is shown when the tool resolves a name only based on minimum edit distance, which is the fallback if nothing better is found.
* OMDB rejects crawling, be sad!

#### Bing API
Wikias for character information are found using the BING API.

**Possible Problems:**
* No appropriate Wikia is found -> maybe increase bing result amount in config.js
* Wrong Wikia is found -> like a fantasy/lego/etc variant of the movie -> be sad
* Run out of API Calls -> add new API Key

#### Wikia API
Wikias have all different kind of topics. From all wikias found good articles for a character name are searched. However in the wikias might be other information only, like the description of episodes or chapters.

**Possible Problems:**
* No appropriate article is found -> no information retrieved for this character
* Wrong article is found -> wrong information retrieved for this character
* Wikia API down -> (I had this issue, it did not work on browser OR tool) -> just wait, it will be back.
* Crappy content of article (only first section plus thumbnail is retrieved) -> crappy content...
