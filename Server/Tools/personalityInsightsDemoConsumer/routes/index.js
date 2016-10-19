var express = require('express');
var router = express.Router();

const util = require('serverutils');
var configFile = util.config.getConfiguration();

const personalityInsightsWrapper = require('personalityinsightswrapper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('apiInput', { title: 'Express' });
});

router.get('/inoutdemo', function(req, res, next) {
  res.render('inoutdemo', {});
});

router.post('/inoutdemoaction', function(req, res, next) {
	console.log("inoutdemoaction started");
	var MongoClient = require('mongodb').MongoClient,
	  f = require('util').format,
	  fs = require('fs');

	// Read the certificates
	var ca = [fs.readFileSync(configFile.dbCertPath + "CAChain.pem")];
	var key = fs.readFileSync(configFile.dbCertPath + "Mongodb.pem");

	// Connect validating the returned certificates from the server
	MongoClient.connect(configFile["mongoDbConnectionString"], {
	  server: {
		  sslValidate:true
		, sslCA:ca
		, sslKey:key
		, sslCert:key
	  }
	}, function(err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			console.log("Successfully connected to DB.");
			var collection = db.collection("inouttest");
			
			if (typeof req.body.save !== 'undefined')
				{
				console.log("I will save the text in the DB.");
				collection.insert({"in": req.body.inputText}, function(err,result){
					if (err)
						{
						console.log("error during insert");
						console.log(err);
						}
					else
						console.log('Inserted %d documents into the collection. The documents inserted with "_id" are:', 		result.length, result);
					
					db.close();
					});
				}
			
			if (typeof req.body.process !== 'undefined')
				{
				console.log("Will look for empty 'out' in collection and query watson for these entries...");
				var stream = collection.find({"out":{ $exists: false}}).stream();
				stream.on("data", function(item) {
					console.log("found data:" + item.in);
					personalityInsightsWrapper.serviceCall(item.in, function(answer){
						collection.update({"_id":item._id}, {$set:{"out":answer}}, function(err, result){
							if (err)
								{
								console.log("error during update");
								console.log(err);
								}
							else
								console.log('Updated %d documents into the collection. The documents inserted with "_id" are:', result);
						});
					});
					
				});
				stream.on("end", function() {
					console.log("keine daten mehr gefunden!")
				});
				}

			res.redirect("inoutdemo");
		}
	});
	/*
	// Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var userName = req.body.username;
    var userEmail = req.body.useremail;

    // Set our collection
    var collection = db.get('usercollection');

    // Submit to the DB
    collection.insert({
        "username" : userName,
        "email" : userEmail
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // And forward to success page
            res.redirect("userlist");
        }
    });*/
});

router.post('/watsonCall', function(req, res){
	personalityInsightsWrapper.serviceCall(req.body.inputText, function(_answer,error){
		if(error)
			res.render('watsonAnswer', {answer: "GOT ERROR: " + JSON.stringify(error, null, 2)});
		else
			res.render('watsonAnswer', {answer: JSON.stringify(_answer, null, 2)});
	}, false);
	
});

/*router.get('/helloworld', function(req, res){
	res.render('helloworld', {title: 'Tachchen sag ich mal wa'});
});

/* GET Userlist page. 
router.get('/userlist', function(req, res) {
    var db = req.db;
    var collection = db.get('usercollection');
    collection.find({},{},function(e,docs){
        res.render('userlist', {
            "userlist" : docs
        });
    });
});

//get New User page
router.get('/newuser', function(req,res){
	res.render('newuser',{title: 'Add New User' });
});

 POST to Add User Service 
router.post('/adduser', function(req, res) {

    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var userName = req.body.username;
    var userEmail = req.body.useremail;

    // Set our collection
    var collection = db.get('usercollection');

    // Submit to the DB
    collection.insert({
        "username" : userName,
        "email" : userEmail
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            // And forward to success page
            res.redirect("userlist");
        }
    });
});*/

module.exports = router;
