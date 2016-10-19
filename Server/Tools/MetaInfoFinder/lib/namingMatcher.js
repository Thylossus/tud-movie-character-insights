'use strict';

var _ = require('underscore'),
    Combinatorics = require('js-combinatorics'),
    levenshtein = require('fast-levenshtein'),
    diacritics = require('diacritics');


/**
 * NamingMatcher to find a good fitting name w.r.t a set of options, when no String matching is working.
 * Initialize this matcher with this method
 *
 * @param {[String]} possibleMatches Full names
 * @param {String} [logTag] - for writing logs
 */
var NamingMatcher = function(possibleMatches, logTag) {
    if(!_.isArray(possibleMatches)) {
        throw new Error('Invalid initialization of namingmatcher! possibleMatches must be an Array of strings!');
    }
    this.logTag = logTag;
    this.expandedPossibleMatches = [];
    for(var i=0; i<possibleMatches.length; i++) {
        var current = possibleMatches[i];
        this.expandedPossibleMatches.push({
            original: current,
            options: expand(cleanString(current).split(' '))
        });
    }
};

/**
 * Resolve the names to the object the name belongs to.
 * @param {[Object]} matches - matches received from this namingmatcher
 * @param {[Object]} originalObjects - original objects from which the name was used
 * @param {String} key - key of the name
 */
NamingMatcher.prototype.resolveToFullObjects = function(matches, originalObjects, key) {
    for(var i = 0; i < matches.length; i++) {
        var currentMatch = matches[i];
        var found = _.find(originalObjects, function(o) {return o[key] == currentMatch.resolved})
        currentMatch.resolved = found;
    }

    return matches;
};

/**
 * Find the best matches for a name
 * @param {[String]} names - names to be resolved
 * @return {[Object]} - {scriptUnified, resolved, score}
 */
NamingMatcher.prototype.findBestMatches = function(names) {
    var matchToResult = function(scripName, match) {
        return {
            scriptUnified: scripName,
            resolved: bestMatch ? bestMatch.original : null,
            score: bestMatch ? bestMatch.score : null
        };
    };

    var matches = [];
    for(var i = 0; i < names.length; i++) {
        var currentName = names[i];
        var bestMatch = this.findBestMatch(currentName, false);
        matches.push(matchToResult(currentName, bestMatch));
    }

    // for sorting
    var bestFirst = function(match) {
        return match.score * -1;
    };

    // store always the best here
    var resolved = [];

    // find best match and leave the rest
    while(matches.length > 0) {
        matches = _.sortBy(matches, bestFirst);
        var best = matches.shift();
        resolved.push(best);
        this.removeFromPossibleMatches(best.resolved);

        // all those with the best match == same name must recalculate
        var conflicts = _.where(matches, {resolved: best.resolved});
        matches = _.filter(matches, function(m) { return m.resolved != best.resolved});

        for(i = 0; i < conflicts.length; i++) {
            bestMatch = this.findBestMatch(conflicts[i].scriptUnified, false);
            matches.push(matchToResult(conflicts[i].scriptUnified, bestMatch));
        }
    }

    return resolved;
};

/**
 * Find the best matching name to a given reference
 * @param name  this name must be resolved
 * @param {Boolean} [forceMatch] (default: false): if set to true, the best match will be found, even if no single word in the name matches.
 *                                            if set to false a result is only returned when at least one word in the complete name matches
 *                                            and at least as many characters are matching as characters are missing.
 */
NamingMatcher.prototype.findBestMatch = function(name, forceMatch) {
    forceMatch = forceMatch || false;
    var workingName = cleanString(name);
    var toExpand = workingName.split(' ');
    if(toExpand.length > 20) {
        // early out!
        return null;
    }
    var optionsName = expand(toExpand);

    // now check all permutations, starting with the longest
    for(var size=optionsName.length - 1; size >= 0; size--) {
        var currentPerms = optionsName[size];
        var candidates = getValidCandidates(this.expandedPossibleMatches, size + 1);
        var results = [];

        for(var i=0; i<candidates.length; i++) {
            var candidate = candidates[i];
            var candidatePerms = candidate.options[size];
            var idx = this.expandedPossibleMatches.indexOf(candidate)
            var matches = getMatches(candidate.original, idx, currentPerms, candidatePerms);
            // remember matches
            if(matches.length > 0) {
                results = results.concat(matches);
            }
        }

        // now find the best of the matches
        if (results.length > 0) {
            var originalPerm = optionsName[optionsName.length - 1][0];
            var calculatedResults = [];

            for(var j=0; j<results.length; j++) {
                var current = results[j];
                var currentCandidate = this.expandedPossibleMatches[current.candidate];
                var candidatePerm = currentCandidate.options[currentCandidate.options.length - 1][0];

                currentCandidate.score = scoreMatch(originalPerm, candidatePerm, current.matchingPerm);
                calculatedResults.push(currentCandidate);
            }

            // return original name of best scoring option
            var winner = _.max(calculatedResults, function(r) {
                return r.score;
            });

            return _.omit(winner, 'options');
        }
    }

    // nothing found so far
    if(forceMatch) {
        // just check minimum edit distance
        var bestMatch = findBestMinimumEditDistance(name, this.expandedPossibleMatches).original;
        console.log('[' + this.logTag + ']force match: minimum edit distance for', name, '->', bestMatch);
        return bestMatch;
    }

    // nothing found
    return null;
};


/**
 * Remove a name from the matches so that no further searched name will be resolved to it.
 * @param name name to be removed
 */
NamingMatcher.prototype.removeFromPossibleMatches = function(name) {
    this.expandedPossibleMatches = _.reject(this.expandedPossibleMatches, function (elm) {
        return elm.original == name;
    });
};


/**
 * Calculate the score of each candidate string
 * @param originalPerm  maximum permutation of the name that needs to be resolved
 * @param testPerm      this is the original maximum permutation of the matched perumation
 * @param matchingPerm  this permutation had a match
 */
function scoreMatch(originalPerm, testPerm, matchingPerm) {
    var score = 0;

    // find substrings between matching words
    var fromOriginal = 0;
    var fromCandidate = 0;
    for(var i=0; i<matchingPerm.length; i++) {
        var currentMatch = matchingPerm[i];
        var indexOriginal = originalPerm.indexOf(currentMatch);
        var indexCandidate = testPerm.indexOf(currentMatch);

        var originalPrev = originalPerm.slice(fromOriginal, indexOriginal).join(' ');
        fromOriginal = indexOriginal + 1;

        var candidatePrev = testPerm.slice(fromCandidate, indexCandidate).join(' ');
        fromCandidate = indexCandidate + 1;

        // minus minimum edit distance
        score -= levenshtein.get(originalPrev, candidatePrev);

        // plus amount of matching
        score += currentMatch.length;
    }

    // compare strings after last match
    var originalPost, candidatePost;
    if(originalPerm.length > fromOriginal) {
        originalPost = originalPerm.slice(fromOriginal, originalPerm.length).join(' ');
    } else {
        originalPost = '';
    }
    if(testPerm.length > fromCandidate) {
        candidatePost = testPerm.slice(fromCandidate, testPerm.length).join(' ');
    } else {
        candidatePost = '';
    }
    score -= levenshtein.get(originalPost, candidatePost);

    return score;
}

/**
 * Find the best matching string for a name, calculated via minimum edit distance. The original name is used.
 * @param name          name to be resolved
 * @param candidates    candidate list [{original: <unchanged name>}]
 */
function findBestMinimumEditDistance(name, candidates) {
    return _.min(candidates, function (candidate) {
        return levenshtein.get(name, candidate.original);
    })
}

/**
 * Find options that have permutations of a given minimum length
 * @param allCandidates array of all possible candidates for the string
 * @param size size of the permutation that needs to be matched
 */
function getValidCandidates(allCandidates, size) {
    return _.filter(allCandidates, function (c) {
        return c.options.length >= size;
    });
}

/**
 * Find the indexes of the matching permutations
 * @param originalName unchanged name that needs to be resolved
 * @param candidateIndex index of the candidate from which the testPermutations come
 * @param currentPermutations   permutations of the same size of the word that has to be resolved
 * @param testPermutations      permutations of the same size as above from a possible candidate
 * @returns {Array}
 */
function getMatches(originalName, candidateIndex, currentPermutations, testPermutations) {
    var foundMatches = [];
    // all permutations
    for(var i=0; i<currentPermutations.length; i++) {
        var perm = currentPermutations[i];

        // test with all permutations of same length of the testPermutations
        for(var j=0; j<testPermutations.length; j++) {
            var testPerm = testPermutations[j];

            // compare both
            var equal = true;
            for(var k=0; k<perm.length; k++) {
                if(testPerm[k] !== perm[k]) {
                    equal = false;
                    break;
                }
            }

            if(equal) {
                foundMatches.push({
                    originalName: originalName,
                    candidate: candidateIndex,
                    matchingPerm: perm
                });
                break; // dont need to evaluate the other
            }
        }
    }

    return foundMatches;
}

/**
 * Cleans a name by removing expressions in brackets
 * @param names multi word name
 */
function cleanString(names) {

    var clean = function(name) {
        // remove brackets  and it's content
        name = name
            .replace(/ *\([^)]*\) */g, "")  // remove brackets  and it's content
            .replace(/ *[\/\\"'\.-] */g, ' ')  // remove special chars
            .replace(/,/g, ' ')
            .replace(/\s\s+/g, ' ');

        // map accented characters to ASCII
        return diacritics.remove(name);
    };

    if (_.isString(names)) {
        return clean(names);
    } else {
        var cleanedNames = [];
        for(var i=0; i<names.length; i++) {
            cleanedNames.push(clean(names[i]));
        }
        return cleanedNames;
    }
}

/**
 * Expand a multi-word name to all possible variations.
 * @param {[String]} name
 */
function expand(name) {
    var options = [];
    for (var i=name.length; i > 0; i--) {
        var currentSize = [];
        var cmb = Combinatorics.combination(name, i);
        cmb.forEach(function (combination) {
            currentSize.push(combination);
        });
        options.unshift(currentSize)
    }

    return options;
}

exports.NamingMatcher = NamingMatcher;
