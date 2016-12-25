var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var _ = require('underscore');
var db = require('./db.js');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
	extended: true
})); // support encoded bodies
var middleware = require('./middleware.js')(db);
var roomcontroller = require('./roomcontroller');
var usercontroller = require('./usercontroller.js');
var usersroomscontroller = require('./usersroomscontroller');
var multer = require('multer');
var fs = require('fs');
var upload = multer({
	dest: '/uploads'
});
app.use(express.static(__dirname + '/public'));


app.post('/signup', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'username');
	usercontroller.signup(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function() {
		res.status(400).send();
	});
});

app.post('/upload', upload.single('sampleFile'), function(req, res, next) {
	try {
		console.log(req.file.path);
		fs.readFile(req.file.path, function(err, data) {
			var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
			fs.unlink(req.file.path);
			db.user.findOne({
				where: {
					id: 1
				}
			}).then(function(user) {
				if (user != null) {
					user.update({
						photo: base64Image
					});
					res.status(200).send("uploaded");
				} else {
					throw new Error();
				}
			}, function(e) {
				throw new Error();
			});
		});
	} catch (e) {
		res.status(401).send();
	}
});

app.delete('/room', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'private', 'password', 'title');
	roomcontroller.deleteRoom(req.user, body).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.get('/user/:username', function(req, res) {
	var username = req.params.username;
	usercontroller.findByUsername(username).then(function(user) {
		res.json(user.toPublicJSON());
	}, function() {
		res.status(401).send();
	});
});

app.get('/publicRooms', function(req, res) {
	roomcontroller.showPublicRooms().then(function(rooms) {
		res.send(rooms);
	}, function() {
		res.status(401).send();
	});
});


app.post('/changeUsername', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'newUsername');
	usercontroller.changeUsername(req.user, body.newUsername).then(function(username) {
		res.send("New username: " + username);
	}, function() {
		res.status(400).send();
	});
});

app.post('/room', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'private', 'title', 'password');
	roomcontroller.makeRoom(req.user, body).then(function(publicFormRoom) {
		res.json(publicFormRoom);
	}, function() {
		res.status(401).send();
	});

});

app.put('/changeRoomDetails/:roomTitle', middleware.requireAuthentication, function(req, res) {
	var roomTitle = req.params.roomTitle;
	var body = req.body;
	roomcontroller.changeRoomDetails(body, roomTitle, req.user).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.post('/loginRoom', middleware.requireAuthentication, function(req, res) {
	var body = req.body;
	usersroomscontroller.loginRoom(req.user, body).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.get('/verify', function(req, res) {
	var query = req.query;
	usercontroller.verify(query).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.put('/changePassword', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, "username", "password", "newPassword");
	usercontroller.updatePassword(req.user, body).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.get('/room/:title', function(req, res) {
	var title = req.params.title;
	roomcontroller.findRoomByTitle(title).then(function(publicFormRoom) {
		res.json(publicFormRoom);
	}, function() {
		res.status(404);
	});
});

app.post('/forgotPassword', function(req, res) {
	var body = _.pick(req.body, "email");
	usercontroller.forgotPassword(body).then(function() {
			res.send('sent to that email');
		},
		function(error) {
			if (error) {
				return res.status(400).send("bad syntax");
			}
			res.send('sent to that email');
		});
});

app.get('/getPassword', function(req, res) {
	var query = req.query;
	usercontroller.getPassword(query).then(function(password) {
		res.send('your new password is: ' + password);
	}, function() {
		res.status(401).send();
	});
});

app.post('/signin', middleware.validCheck, function(req, res) {
	usercontroller.signin(req.user).then(function(token) {
		res.header('Auth', token).json(req.user.toPublicJSON());
	}, function() {
		res.status(401).send();
	});
});

app.delete('/userFromRoom', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'room', 'password', 'userToRemove');
	usersroomscontroller.deleteUserFromRoom()
});

app.delete('/signout', middleware.requireAuthentication, function(req, res) {
	usercontroller.signout(req.user).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.delete('/user', middleware.requireAuthentication, function(req, res) {
	usercontroller.deleteUser(req.user).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.post('/connectViaInvite/:invite', middleware.requireAuthentication, function(req, res) {
	usersroomscontroller.connectViaInvite(req.user, req.params.invite).then(function() {
		res.status(204);
	}, function() {
		res.status(401)
	});
});

db.sequelize.sync(
	/*{
		force: true
	}*/
).then(function() {
	http.listen(PORT, function() {
		console.log('Server started!');
	});
});