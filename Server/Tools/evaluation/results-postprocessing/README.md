# Results Postprocessing
This tool processes the evaluation results in the *data* directory and enhances them by adding more information which is useful for analyzing the results.
The tool accepts the following command line parameters:
* -v
  * Verbose output
* onlyFirst
  * Only process the results of the first evaluation round.
* onlySecond
  * Only process the results of the second evaluation round.
* showEquivalent
  * Show all questions that were answered more than once.

To run the tool without any command line parameters, just invoke `npm start`. This will process the results of both evaluation rounds.
