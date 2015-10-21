// app/models/user.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
	userid : String,
    username : String,
    password : String,
    salt : String
});

module.exports = mongoose.model('User', UserSchema);