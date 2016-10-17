var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var moment = require('moment');
var _ = require('underscore');
var db = require('./db.js');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
	extended: true
})); // support encoded bodies
var middleware = require('./middleware.js')(db);


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

app.post('/signin', function(req, res) {
	var body = _.pick(req.body, 'username', 'password');
	var userInstance;
	db.user.authenticate(body).then(function(user) {
		var tokenToken = user.generateToken('authentication');
		userInstance = user;
		db.token.create({
			token: tokenToken
		}).then(function(token) {
			user.addToken(token).then(function() {
				return token.reload();
			}).then(function() {
				res.header('Auth', tokenToken).json(user.toPublicJSON());
			});
		});
	}).catch(function() {
		res.status(401).send();
	});
});

app.delete('/signout', middleware.requireAuthentication, function(req, res) {
	db.token.findAll({
		where: {
			userId: req.user.get('id')
		}
	}).then(function(tokens) {
		tokens.forEach(function(token) {
			token.destroy();
		});
		res.status(204).send();
	}, function() {
		res.status(500).send();
	});
});

app.delete('/user', function(req, res) {
	var body = _.pick(req.body, 'username', 'password');
	db.user.authenticate(body).then(function(user) {
		var userInstance = user;
		db.token.findAll({
			where: {
				userId: user.get('id')
			}
		}).then(function(todos) {
			todos.forEach(function(todo) {
				todo.destroy();
			});
		});
		user.destroy().then(function() {
			res.status(204).send();
		}, function() {
			res.status(500).send();
		});
	}, function() {
		res.status(500).send();
	});
});

db.sequelize.sync({
	force: true
}).then(function() {
	http.listen(PORT, function() {
		console.log('Server started!');
	});
});