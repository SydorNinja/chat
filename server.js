var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var moment = require('moment');
var _ = require('underscore');
var db = require('./db.js');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



app.post('/signup', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'username');
	body.signup = moment().valueOf();
	body.signin = moment().valueOf();
	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(e) {
		res.status(400).send(e);
	});
});

db.sequelize.sync({
	force: true
}).then(function() {
	http.listen(PORT, function() {
		console.log('Server started!');
	})
});