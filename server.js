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
    console.log("Received " + req.method + " request: " + req.url);
    next(); // make sure we go to the next routes and don't stop here
});

/*
 * Authenticate a user with given user name and *salted* password
 * 
 * Required POST params: username, password (= raw password + salt)
 */
router.route('/authenticateduser')

	.post(function(req, res) {
		
		var mongoose = require('mongoose');
		
		if (mongoose.connection.readyState == 0) { // disconnected
			mongoose.connect('mongodb://localhost:27017/authentication_tutorial');
		}

    	var User = require('./app/models/user');
    	
    	User.find(
        	{ username : req.body.username },
            function (error, result) {
        		if (error) {
    				console.log(error);
    				res.status(500).send(error);
    			}
    			else if (result.length == 0) {
    				var message = "User not found: ";
        			message += req.body.username;
        			
        			var error = new Error(message);
        			console.log(error);
    				res.status(500).send(error);
    			}
    			else if (result.length > 1) {
    				var message = result.length + " users found: ";
        			message += req.body.username;
        			
        			var error = new Error(message);
        			console.log(error);
    				res.status(500).send(error);
    			}
    			else {
    				var authCrypto = require("./app/crypto/authenticationCrypto");
    				var encryptionAlgorithm = "aes256";
    				var encryptionKey = result[0].encryptionKey;
    				
    				var encryptedSaltedPassword = authCrypto.encrypt(
                	    encryptionAlgorithm, encryptionKey, req.body.password);
    				
    				User.find(
    			        { username : req.body.username,
    			          password : encryptedSaltedPassword },
    			        function (error, result) {
    			        	if (error) {
    			    			console.log(error);
    			    			res.status(500).send(error);
    			    		}
    			    		else if (result.length == 0) {
    			    			var message = "User not found: ";
    			        		message += req.body.username;
    			        			
    			        		var error = new Error(message);
    			        		console.log(error);
    			    			res.status(500).send(error);
    			    		}
    			    		else if (result.length > 1) {
    			    			var message = result.length + " users found: ";
    			        		message += req.body.username;
    			        			
    			        		var error = new Error(message);
    			        		console.log(error);
    			    			res.status(500).send(error);
    			    		}
    			    		else {
    			    			res.json({ userid : result[0].userid });
    			    		}
    			        	
    			        	mongoose.disconnect();
    			        }
    			    );
    			}
        	}
        );		
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
			url: "http://localhost:8080/api/newuser",
			method: 'POST',
			headers: headers,
			form: { username : username }
		};
		
		request (options, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				
				// convert String key names to field names
				body = JSON.parse(body);
				console.log(body);
				
				var userid = body.userid;
				
				// create a new password for the user
				var options = {
					url: "http://localhost:8080/api/newpassword",
					method: 'POST',
					headers: headers,
					form: { username : username, userid : userid }
				};
				
				request (options, function(error, response, body) {
					if (!error && response.statusCode == 200) {
						
						// convert String key names to field names
						body = JSON.parse(body);
						console.log(body);
						
						var oldPassword = body.password;
						
						// change user's password
						var authCrypto = require("./app/crypto/authenticationCrypto");
						var passwordLength = 8;
						var newPassword = authCrypto.getRandomChars(passwordLength);
						
						var url = "http://localhost:8080/api/password/";
						url += username + "/";
						url += userid + "/";
						url += oldPassword + "/";
						url += newPassword;
						
						var options = {
							url: url,
							method: 'PUT',
							headers: headers
						};
						
						request (options, function(error, response, body) {
							if (!error && response.statusCode == 200) {
								
								// convert String key names to field names
								body = JSON.parse(body);
								console.log(body);
								
								// get user's salt
								
								var options = {
									url: "http://localhost:8080/api/salt/" + username,
									method: 'GET',
									headers: headers
								};
								
								request (options, function(error, response, body) {
									if (!error && response.statusCode == 200) {
										
										// convert String key names to field names
										body = JSON.parse(body);
										console.log(body);
										
										var salt = body.salt;
										
										// authenticate the user
										
										url = "http://localhost:8080/api/authenticateduser/";
										
										var options = {
											url: url,
											method: 'POST',
											headers: headers,
											form: { username : username, password : newPassword + salt }
										};
										
										request (options, function(error, response, body) {
											if (!error && response.statusCode == 200) {
												
												// convert String key names to field names
												body = JSON.parse(body);
												console.log(body);

												if (body.userid == null) {
													var message = "Sign-in failed - "
													message += "no id found for " + username
													res.status(500).send(message);
												}
												else if (body.userid != userid) {
													var message = "Sign-in failed - "
													message += "wrong id found for " + username
													res.status(500).send(message);
												}
												else
												{
													// delete the test user
													
													url = "http://localhost:8080/api/user/";
													url += username + "/";
													url += newPassword + salt;
													
													var options = {
														url: url,
														method: 'DELETE',
														headers: headers
													};

													request (options, function(error, response, body) {
														if (!error && response.statusCode == 200) {															
															var fullTestResult = { success : true };
															console.log(JSON.stringify(fullTestResult));
															res.json(fullTestResult);
														}
														else {
															console.log(error);
															res.status(500).send(error);
														}
													});
												}
											}
											else {
												console.log(error);
												res.status(500).send(error);
											}
										});
									}
									else {
										console.log(error);
										res.status(500).send(error);
									}
								});
							}
							else {
								console.log(error);
								res.status(500).send(error);
							}
						});
					}
					else {
						console.log(error);
						res.status(500).send(error);
					}
				});
		    }
			else {
				console.log(error);
				res.status(500).send(error);
			}
		});
	});

/*
 * Create a user's password
 * 
 * required input: 
 * { 
 * 		username:username, 
 * 		userid:userid
 * }
 */
router.route("/newpassword")

	.post(function(req, res) {
    	
    	var authCrypto = require("./app/crypto/authenticationCrypto");
    	
    	var passwordLength = 6;
    	var password = authCrypto.getRandomChars(passwordLength);
    	
    	var saltLength = 32;
    	var salt = authCrypto.getRandomChars(saltLength);
    	
    	var saltedPassword = password + salt;
    	
    	var encryptionKeyLength = 32;
    	var encryptionKey = authCrypto.getRandomChars(encryptionKeyLength);
    	
    	var encryptionAlgorithm = "aes256";
    	var encryptedSaltedPassword = authCrypto.encrypt(
    		encryptionAlgorithm, encryptionKey, saltedPassword);
		
		var mongoose = require('mongoose');

		if (mongoose.connection.readyState == 0) { // disconnected
			mongoose.connect('mongodb://localhost:27017/authentication_tutorial');
		}
    	
    	var User = require('./app/models/user');
    	
    	User.update(
    		{ userid : req.body.userid, 
    			username : req.body.username },
    		{ $set: { 
    			salt : salt, 
    			encryptionKey : encryptionKey,
    			password : encryptedSaltedPassword
    		}},
    		
    		function (error, result) {
    				
    			if (result == 0) {
    				var error = new Error("User not found with userid = " + req.body.userid);
    				console.log(error);    
    				res.status(500).send(error);
    				mongoose.disconnect();
    			}
    			else if (!error) {
    				
    				if ( req.body.username.indexOf("@localhost.com") > -1) {
    					res.json({  password: password });
    				}
    				else {
    					// TODO: email password to username
    				}

    				mongoose.disconnect();
    			}
    			else {
    				console.log(error);
    				res.status(500).send(error);
    				mongoose.disconnect();
    			}
    		}
    	);
	});

/*
 * Create a user
 */
router.route('/newuser')

	/*
	 * Manual test procedure:
	 * 1. Run MongoDB server (run mongod at command line)
	 * 2. Run Node.js server
	 * 3. Run Postman
	 *    a. Post to http://localhost:8080/api/newuser
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

    	if (mongoose.connection.readyState == 0) { // disconnected
			mongoose.connect('mongodb://localhost:27017/authentication_tutorial');
		}
    	
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
            	res.json({ userid : user.userid });
            	mongoose.disconnect();
            }
        });
    });

/*
 * Change a user's password
 */
router.route("/password/:username/:userid/:oldPassword/:newPassword")	
	
	.put(function(req, res) {
		
		var mongoose = require('mongoose');
		
		if (mongoose.connection.readyState == 0) { // disconnected
			mongoose.connect('mongodb://localhost:27017/authentication_tutorial');
		}

    	var User = require('./app/models/user');
    	
    	User.find(
    		{ userid : req.params.userid, 
        		username : req.params.username },
        	function (error, result) {
        		if (error) {
        			console.log(error);
    				res.status(500).send(error);
    				mongoose.disconnect();
        		}
        		else if (result.length == 0) {
        			var message = "User not found: ";
        			message += req.params.username;
        			
        			var error = new Error(message);
        			console.log(error);
    				res.status(500).send(error);
    				mongoose.disconnect();
        		}
        		else if (result.length > 1) {
        			var message = result.length + " users found: ";
        			message += req.params.username;
        			
        			var error = new Error(message);
        			console.log(error);
    				res.status(500).send(error);
    				mongoose.disconnect();
        		}
        		else {

        			// get the user's salt and encryption key
        			var salt = result[0].salt;
        			var encryptionKey = result[0].encryptionKey;

        			// salt and encrypt the old and new passwords
        			
        			var saltedOldPassword = req.params.oldPassword + salt;
        			var saltedNewPassword = req.params.newPassword + salt;
        			
        			var authCrypto = require("./app/crypto/authenticationCrypto");
        			var encryptionAlgorithm = "aes256";
        			
        	    	var encryptedSaltedOldPassword = authCrypto.encrypt(
        	    		encryptionAlgorithm, encryptionKey, saltedOldPassword);
        	    	
        	    	var encryptedSaltedNewPassword = authCrypto.encrypt(
            	    	encryptionAlgorithm, encryptionKey, saltedNewPassword);
        			
        			// save the new salted encrypted password
        	    	
        	    	User.update(
        	        	{ userid : req.params.userid, 
        	        		username : req.params.username,
        	        		password : encryptedSaltedOldPassword },
        	        	{ $set: { 
        	        		password : encryptedSaltedNewPassword
        	        	}},
        	        		
        	        	function (error, result) {

        	        		if (error) {        	        			
        	        			console.log(error);
        	    				res.status(500).send(error);
        	    				mongoose.disconnect();
        	        		}
        	        		else if (result != 1) {
        	        			var message = "New password not saved for ";
        	        			message += req.params.username;
        	        			
        	        			var error = new Error(message);
        	        			console.log(error);
        	    				res.status(500).send(error);
        	    				mongoose.disconnect();
        	        		}
        	        		else {
        	        			res.json({ success : true });
        	        		}
        	        	}
        	        );
        		}
        	}		
    	);
		
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

// Get the salt for a given user
router.route("/salt/:username")

	.get(function(req, res) {
		
		var mongoose = require('mongoose');
		
		if (mongoose.connection.readyState == 0) { // disconnected
			mongoose.connect('mongodb://localhost:27017/authentication_tutorial');
		}

    	var User = require('./app/models/user');
    	
    	User.find(
    		{ username : req.params.username },
        	function (error, result) {
    			
    			if (error) {
    				console.log(error);
    				res.status(500).send(error);
    			}
    			else if (result.length == 0) {
    				var message = "User not found: ";
        			message += req.params.username;
        			
        			var error = new Error(message);
        			console.log(error);
    				res.status(500).send(error);
    			}
    			else if (result.length > 1) {
    				var message = result.length + " users found: ";
        			message += req.params.username;
        			
        			var error = new Error(message);
        			console.log(error);
    				res.status(500).send(error);
    			}
    			else {
    				res.json({ salt : result[0].salt });
    			}
        		
        		mongoose.disconnect();
        	}
        );
	});

/*
 * Delete a user
 */
router.route('/user/:username/:password')

    .delete(function(req, res) {
    	
    	var request = require('request');
    	
    	var headers = {
    		'User-Agent': 'Super Agent/0.0.1',
    		'Content-Type': 'application/x-www-form-urlencoded'
    	}
    	
    	var url = "http://localhost:8080/api/authenticateduser/";

    	var options = {
			url: url,
			method: 'POST',
			headers: headers,
			form: { username : req.params.username, password : req.params.password }
		};

    	request (options, function(error, response, body) {

			if (!error && response.statusCode == 200) {

				// convert String key names to field names
				body = JSON.parse(body);
				console.log(body);

				if (body.userid == null) {
					var message = "Sign-in failed - "
					message += "no id found for " + username
					res.status(500).send(message);
				}
				else
				{
					var mongoose = require('mongoose');

			    	if (mongoose.connection.readyState == 0) { // disconnected
						mongoose.connect('mongodb://localhost:27017/authentication_tutorial');
					}
			    	
			    	var User = require('./app/models/user');
			    	
			    	User.remove(
			    		{ username : req.params.username,
			    			userid : body.userid },
			    		function (error, result) {
			        			
			        		if (error) {
			        			console.log(error);
			        			res.status(500).send(error);
			        		}
			        		else if (result.length == 0) {
			        			var message = "User not found: ";
			            		message += req.params.username;
			            			
			            		var error = new Error(message);
			            		console.log(error);
			        			res.status(500).send(error);
			        		}
			        		else if (result.length > 1) {
			        			var message = result.length + " users found: ";
			            		message += req.params.username;
			            			
			            		var error = new Error(message);
			            		console.log(error);
			        			res.status(500).send(error);
			        		}
			        		else {
			        			res.json({ success : true });
			        		}
			            		
			            	mongoose.disconnect();
			            }
			    	);
				}
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
