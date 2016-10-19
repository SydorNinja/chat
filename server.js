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
var postmark = require("postmark");
var client = new postmark.Client("f557529a-2ec5-468b-ac99-5aa8f9a1d335");

app.post('/signup', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'username');
	body.signup = moment().valueOf();
	body.signin = moment().valueOf();
	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
		client.sendEmail({
			"From": "denyss@perfectomobile.com",
			"To": "" + body.email + "",
			"Subject": "Test",
			"TextBody": "enter the link: localhost:3000/verify?vh=" + user.validHash + ""
		}, function(error, success) {
			if (error) {
				console.log('Unable to send via postmark: ' + error.message);
			}
		});
	}, function(e) {
		res.status(400).send(e);
	});
});



app.get('/verify', function(req, res) {
	var query = req.query;
	if (!query.hasOwnProperty('vh') || !_.isString(query.vh)) {
		res.status(400).send();
	}
	var validHashUser = query.vh;
	db.user.findOne({
		where: {
			validHash: validHashUser
		}
	}).then(function(user) {
		if (user != null) {
			attributes = {};
			attributes.valid = true;
			user.update(attributes);
			res.status(204).send();
		} else {
			res.status(400).send();
		}
	});
});

app.put('/changePassword', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, "username", "password", "newPassword");
	var up = {
		username: body.username,
		password: body.password
	};
	if (body === null || body.username === null || body.password === null || body.newPassword === null) {
		return req.status(401).send();
	} else {
		user.authenticate(up).then(function(user) {
			var attributes = {};
			attributes.username = body.username;
			attributes.password = body.newPassword;
			req.user.update(attributes);
			res.status(204).send();
		}, function() {
			res.status(401).send();
		});
	}
});

app.post('/forgotPassword', function(req, res) {
	var body = _.pick(req.body, "email");
	if (body === null) {
		return req.status(401).send();
	} else {
		user.findOne({
			where: {
				email: body.email
			}
		}).then(function(user) {
			client.sendEmail({
				"From": "denyss@perfectomobile.com",
				"To": "" + body.email + "",
				"Subject": "Restart your password",
				"TextBody": "enter the link: localhost:3000/getPassword?ph=" + user.password_hash + ""
			}, function(error, success) {
				if (error) {
					console.log('Unable to send via postmark: ' + error.message);
				}
				res.send("sent");
			});
		}, function(e) {
			res.send("sent");
		});
	}
});

app.get('/getPassword', function(req, res) {
	var query = req.query;
	if (!query.hasOwnProperty('ph')) {
		res.status(401).send();
	} else {
		user.findOne({
			where: {
				password_hash: query.ph
			}
		}).then(function(user) {
			var password = Math.floor(Math.random() * 1000000000 + 1);
			user.update({
				password: password.toString()
			});
			user.reload();
			res.send('your new password is: ' + password);
		}, function() {
			res.status(401).send();
		});
	}
});

app.post('/signin', middleware.validCheck, function(req, res) {
	req.userToken = req.user.generateToken('authentication');
	db.token.create({
		token: req.userToken
	}).then(function(token) {
		req.user.addToken(token).then(function() {
			return token.reload();
		}).then(function() {
			res.header('Auth', req.userToken).json(req.user.toPublicJSON());
		});
	}, function() {
		res.status(401).json("please validate your account via email");
	})

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