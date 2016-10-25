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
var multer = require('multer')
var fs = require('fs');
var upload = multer({
	dest: 'uploads/'
})
var invite = require('./invite.js');
app.use(express.static(__dirname + '/public'));


app.post('/signup', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'username');
	body.signup = moment().valueOf();
	body.signin = moment().valueOf();
	if (body.username == null) {
		var email = body.email;
		var searched = email.search('@');
		if (searched != -1) {
			var sliced = email.slice(0, searched).trim();
			body.username = sliced;
		}
	}
	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
		client.sendEmail({
			"From": "denyss@perfectomobile.com",
			"To": "" + body.email + "",
			"Subject": "Your new Todo account",
			"TextBody": "enter the link: http://localhost:3000/verify?vh=" + user.validHash + ""
		}, function(error, success) {
			if (error) {
				console.error('Unable to send via postmark: ' + error.message);
			}
		});
	}, function(e) {
		res.status(400).send(e);
	});
});

app.post('/upload', upload.single('sampleFile'), function(req, res, next) {
	console.log(req.file.path);
	fs.readFile(req.file.path, function(err, data) {
		var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
		db.user.findOne({
			where: {
				id: 1
			}
		}).then(function(user) {
			if (user != null) {
				user.update({
					photo: base64Image
				});
				res.status(204).send();
			} else {
				res.status(401).send();
			}
		}, function(e) {
			res.status(401).send();
		});
	});
	res.status(200).send();
	// req.body will hold the text fields, if there were any
})

app.get('/user/:username', function(req, res) {
	var username = req.params.username;
	db.user.findOne({
		where: {
			username: username
		}
	}).then(function(user) {
		if (user == null) {
			res.status(401).send();
		} else {
			user.signin = moment.utc(user.signin).local().format('MMMM Do, h:mm a');
			user.signup = moment.utc(user.signup).local().format('MMMM Do YYYY, h:mm a');
			res.send(user.toPublicJSON());
		}
	}, function() {
		res.status(401).send();
	});
});


app.post('/changeUsername', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'newUsername');
	if (_.isString(body.newUsername)) {
		var attributes = {
			username: body.newUsername.trim()
		};
		req.user.update(attributes);
		res.send('updated username: ' + attributes.username);
	} else {
		res.status(401).send();
	}
});

app.post('/room', function(req, res) {
	try {
		var body = _.pick(req.body, 'private', 'title', 'password');
		if (body != null && body.title != null) {
			if (body.private === true) {
				if (_.isString(body.password)) {
					body.invite = invite(body.password);
				} else {
					res.status(401).send();
				}
			} else {
				body.invite = invite('t' + body.title);
			}
			db.room.create(body).then(function(room) {
				var publicFormRoom = _.pick(room, 'private', 'title', 'password');
				res.json(publicFormRoom);
			}, function() {
				res.status(401).send();
			});
		} else {
			res.status(401).send();
		}
	}catch (e) {
		res.status(401).send();
	}
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
			var attributes = {
				signin: moment().valueOf()
			};
			req.user.update(attributes);
			req.user.reload();
			res.header('Auth', req.userToken).json(req.user.toPublicJSON());
		});
	}, function() {
		res.status(401).json("please validate your account via email");
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