// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

//middleware to use for all requests
router.use(function(req, res, next) {
	
	// Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    
	// do logging
    console.log("Received request: " + req.url);
    next(); // make sure we go to the next routes and don't stop here
});

/*
 * Automated integration test.
 * 
 * Example: http://localhost:8080/api/fulltest
 */
router.route('/fulltest')

	.get(function(req, res) {
	
		/*
		 * 
		 * Test user preparation:
		 * 1. create and persist user
		 * 2. create and persist password and salt
		 *    a. for localhost, return password in response body
		 *    b. otherwise, email password to username
		 * 3. change password
		 * 
		 * Test sign in:
		 * 1. get salt for user name
		 * 3. submit username and salted password to get userid
		 */
		
		// Documentation: https://github.com/request/request
		// To install: >npm install request --save
		var request = require('request');
		
		var authCrypto = require("./app/crypto/authenticationCrypto");
		var userNamePrefixLength = 8;
		var username = authCrypto.getRandomChars(userNamePrefixLength) + "@localhost.com";

		var headers = {
			'User-Agent': 'Super Agent/0.0.1',
			'Content-Type': 'application/x-www-form-urlencoded'
		}
		
		var options = {
			url: "http://localhost:8080/api/user",
			method: 'POST',
			headers: headers,
			form: { username : username }
		};
		
		request (options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
		        res.status(500).send("Test successful so far but not complete");
		    }
			else {
				console.log(error);
				res.status(500).send(error);
			}
		});
	});

// Create a string of random digits and letters (upper and lower case).
// Example: http://localhost:8080/api/randomChars/6
router.route("/randomChars/:length")

	.get(function(req, res) {
		if (req.params.length < 1) {
			// 400 Bad Request
			res.status(400).send("Length must be between 1 and 256 characters");
		}
		else if (req.params.length > 256) {
			// 400 Bad Request
	    	res.status(400).send("Length must be < 256 characters, otherwise unpredictability will be broken");
		}
		else {			
			var authCrypto = require("./app/crypto/authenticationCrypto");
			var targetLength = parseInt(req.params.length);
			var randomChars = authCrypto.getRandomChars(targetLength);

			res.json({ 
				randomChars: randomChars
			});
		}		
    });
	
/*
 * Create, read, update or delete a user.
 */
router.route('/user')

	/*
	 * Create a user
	 * 
	 * Manual test procedure:
	 * 1. Run MondoDB server
	 * 2. Run Node.js server
	 * 3. Run Postman
	 *    a. Post to http://localhost:8080/api/user
	 *    b. Set name/value pairs in X-www-form-urlencoded content type
	 *    c. Hit Send
	 * 4. Run MongoDB CLI
	 *    a. show dbs
	 *    b. use authentication_tutorial
	 *    c. show collections
	 *    d. db.users.count();
	 *    e. db.users.find();
	 */
    .post(function(req, res) {    	

    	var mongoose = require('mongoose');
    	mongoose.connect('mongodb://localhost:27017/authentication_tutorial');
    	
    	var authCrypto = require("./app/crypto/authenticationCrypto");
    	var userIdLength = 32;

    	var User = require('./app/models/user');

    	var user = new User();      // create a new instance of the User model
    	user.userid = authCrypto.getRandomChars(userIdLength);
    	user.username = req.body.username;  // set the user's name (comes from the request)

        // save the user and check for errors
    	user.save(function(err) {
            if (err) {
                res.send(err);
                mongoose.disconnect();
            }
            else {
            	res.json({ success: true });
            	mongoose.disconnect();
            }
        });
    });

//REGISTER OUR ROUTES -------------------------------
//all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Listening on port ' + port);
