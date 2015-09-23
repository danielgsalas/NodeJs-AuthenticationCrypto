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

// more routes for our API will happen here

router.route('/user')

	/*
	 * Create a user
	 * 
	 * Test procedure:
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
