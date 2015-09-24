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
		 * 1. create salt
		 * 2. create username
		 * 3. save username and salt
		 * 4. create password (mock email)
		 * 5. change password
		 * 
		 * Test sign in:
		 * 1. get salt for user name
		 * 3. submit username and salted password
		 */
	
		res.status(401).send("Test not complete");
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

    	var User = require('./app/models/user');

    	var user = new User();      // create a new instance of the User model
    	user.username = req.body.username;  // set the user's name (comes from the request)

        // save the user and check for errors
    	user.save(function(err) {
            if (err) {
                res.send(err);
                mongoose.disconnect();
            }
            else {
            	res.json({ message: 'Created ' + user.username });
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
