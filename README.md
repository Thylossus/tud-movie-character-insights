# Movie Character Insights

## About
This project is a showcase for [IBM's Personality Insights Service](https://www.ibm.com/watson/developercloud/personality-insights.html) offerend on the [Bluemix Platform](https://console.ng.bluemix.net/docs/). The service enables deriving the author's personality based on the author's texts. For instance, one could use [tweets of someone](https://personality-insights-livedemo.mybluemix.net/) as a text source.

To showcase the capabilities of the service, we developed a web application that allows a user to browse the personalities of her favorite movie characters, compare them, and search for similar movie characters. To test one's knowledge of movie characters, we further developed a quiz that asks the user to find a similar character to a given character. The characters' personalityies are provided by the Personality Insights Service. The text required for these analyses was extracted from movie scripts by parsing them and extracting the sentences said by each character in a movie.

This project was developed by five students of [Technical University Darmstadt](https://www.tu-darmstadt.de/). Access to the Bluemix Platform was provided by IBM. The project was presented at [CeBIT 2017](https://www-05.ibm.com/de/cebit/en/).

## Contact
* Tobias [@Thylossus](https://twitter.com/Thylossus)

## Repository
This repository contains the complete source code of the Movie Character Insights application. The code for the client is located in the *Client* directory.
The *Server* directory contains the application's backend (directory *api*) as well as the data processing pipeline and the evaluation scripts (directory *Tools*). 


## Links
* Personality Insights
  * Home: https://www.ibm.com/watson/developercloud/personality-insights.html
  * Personality Insights Basics: https://www.ibm.com/watson/developercloud/doc/personality-insights/basics.shtml
  * Personality Models: https://www.ibm.com/watson/developercloud/doc/personality-insights/models.shtml
* Technologies:
  * Node.js: https://nodejs.org/en/
  * Python: https://www.python.org/
  * React: https://facebook.github.io/react/
  * Mongodb: https://docs.mongodb.com
