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
var conversationcontroller = require('./conversationcontroller');
var multer = require('multer');
var fs = require('fs');
var upload = multer({
	dest: '/uploads'
});
var io = require('socket.io')(http);
var moment = require('moment');
app.use(express.static(__dirname + '/public'));
var clientInfo = {};
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var tokener = require('./tokenFind');

app.post('/signup', function(req, res) {
	var body = _.pick(req.body, 'email', 'password', 'username');
	console.log(body);
	usercontroller.signup(body).then(function(user) {
		res.send('Please Validate your account through mail');
	}, function() {
		res.status(400).send('Error');
	});
});
var Auth;

app.post('/upload', middleware.requireAuthentication, upload.single('sampleFile'), function(req, res, next) {
	try {
		console.log(req.file.path);
		fs.readFile(req.file.path, function(err, data) {
			var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
			console.log(base64Image);
			fs.unlink(req.file.path);
				req.user.update({
					photo: base64Image
				});
				res.redirect('/myProfile.html');
		});
	} catch (e) {
		res.status(401).send();
	}
});

app.post('/uploadI', upload.single('sampleFile'), function(req, res, next) {
	try {
		console.log(req.file.path);
		fs.readFile(req.file.path, function(err, data) {
			var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
			console.log(base64Image);
			fs.unlink(req.file.path);
			var message = {
				time: moment().valueOf(),
				userId: 1,
				roomId: 1,
				sender: 'fg',
				photo: base64Image,
				mType: 'image'
			};
			conversationcontroller.upload(message);
			res.status(200).send();
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

//todo
app.get('/users/:roomTitle', function(req, res) {
	usersroomscontroller.usersInRoom(req.params.roomTitle).then(function(users) {
		res.send(users);
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
		res.send('Validated');
	}, function() {
		res.status(401).send();
	});
});

app.post('/changeDetails', middleware.requireAuthentication, function(req, res) {
	console.log(req.body);
	var body = _.pick(req.body, "username", "password");
	usercontroller.changeDetails(req.user, body).then(function() {
		res.redirect('/myProfile.html');
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

app.put('/favorite', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, "room", "favorite");
	usersroomscontroller.favoriteChange(req.user, body).then(function() {
		res.send('changed');
	}, function(error) {
		res.status(401).send(error);
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
		Auth = token;
		res.cookie('Auth', token).header('Auth', token).redirect('/landing.html');
	}, function() {
		res.status(401).send();
	});
});

app.delete('/userFromRoom', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'room', 'password', 'userToRemove');
	usersroomscontroller.deleteUserFromRoom().then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});


//signout is truely delete
app.get('/signout', middleware.requireAuthentication, function(req, res) {
	usercontroller.signout(req.user).then(function() {
		res.status(204).clearCookie("key").redirect('/index.html');
	}, function() {
		res.status(401).send();
	});
});

app.get('/myRooms', middleware.requireAuthentication, function(req, res) {
	usersroomscontroller.rooms(req.user).then(function(rooms) {
		res.send('My Rooms:' + rooms);
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

app.post('/connectViaInvite', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'invite');
	usersroomscontroller.connectViaInvite(req.user, body.invite).then(function() {
		res.status(204).send();
	}, function() {
		res.status(401).send();
	});
});

app.get('/favoriteRooms', middleware.requireAuthentication, function(req, res) {
	usersroomscontroller.favoriteRooms(req.user).then(function(rooms) {
		res.send('My Favorite Rooms:' + rooms);
	}, function() {
		res.status(401).send();
	});
});

app.post('/uploadMessage', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'text', 'TTL', 'mType', 'photo');
	var message = {
		text: body.text,
		time: moment().valueOf(),
		userId: req.user.id,
		roomId: 1,
		sender: req.user.username,
		photo: photo,
		mType: 'text'
	};
	if (typeof(body.TTL) === 'boolean') {
		message.TTL = body.TTL;
	}
	conversationcontroller.upload(message);
	res.status(200).send();
});

app.post('/messages', middleware.requireAuthentication, function(req, res) {
	conversationcontroller.seeMessages(req.body.room).then(function(messages) {
		res.send(messages);
	}, function() {
		res.status(400).send();
	});
});

app.get('/messages101/:roomTitle', middleware.requireAuthentication, function(req, res) {
	conversationcontroller.sendToMail(req.user, req.params.roomTitle).then(function(messages) {
		res.send(messages);
	}, function() {
		res.status(400).send();
	});
});

app.post('/messagesReader', middleware.requireAuthentication, function(req, res) {
	conversationcontroller.alternativeNM(req.body.title, req.body.number).then(function(messages) {
		res.send(messages);
	}, function() {
		res.status(400).send();
	});
});

app.post('/messages/days', middleware.requireAuthentication, function(req, res) {
	conversationcontroller.seeNLastDays(req.body.title, req.body.days).then(function(messages) {
		res.send(messages);
	}, function() {
		res.status(400).send();
	});
});

app.delete('/conversation', middleware.requireAuthentication, function(req, res) {
	conversationcontroller.clearConversation(req.user, req.body.title).then(function() {
		res.status(204).send();
	}, function() {
		res.status(400).send();
	});
});

app.delete('/message', middleware.requireAuthentication, function(req, res) {
	conversationcontroller.deleteMessage(req.user, req.body.id).then(function() {
		res.status(204).send();
	}, function() {
		res.status(400).send();
	});
});
app.put('/message', middleware.requireAuthentication, function(req, res) {
	conversationcontroller.editMessage(req.user, req.body.id, req.body.message).then(function() {
		res.status(204).send();
	}, function() {
		res.status(400).send();
	});
});

io.on('connection', function(socket) {
	console.log('user connected via socket.io!');
	console.log(socket.handshake.headers.cookie);
	var token = socket.handshake.headers.cookie.split(" ");
	if (token[1]) {
		if (token[1].length > token[0].length) {
			token = token[1];
		} else {
			token = token[0];
			token = token.slice(0, token.length - 1);
		}
		token = token.slice(5, token.length);
		console.log(token);
		db.user.findByToken(token).then(function(user) {
			socket.chatUser = user;
		}, function() {});
	} else {
		console.log('bug');
	}
	socket.on('disconnect', function() {
		usercontroller.signout(clientInfo.user);

		var userData = clientInfo[socket.id];
		if (typeof userData != 'undefined') {
			socket.leave(userData.room);
			io.to(userData.room).emit('message', {
				name: 'System',
				text: userData.name + ' has left!',
				timestamp: moment().valueOf()
			});
			delete clientInfo[socket.id];
		}
	});
	socket.on('target', function(target) {
		var user = socket.chatUser.toPublicJSON();
		socket.emit('target', user);
	});

	/*	socket.on('message', function(message) {
			console.log('Message received: ' + message.text);
			if (message.text == '@currentUsers') {
				sendCurrentUsers(socket);
			} else if (message.text.search('@private') != -1) {
				console.log('private');
				sendPrivate(message);
			} else {
				message.timestamp = moment().valueOf();
				io.to(clientInfo[socket.id].room).emit('message', message);
			}
		});*/

	socket.emit('message', {
		name: 'System',
		text: 'Welcome to the chat application',
		timestamp: moment().valueOf()
	});
});


db.sequelize.sync(
	/*	{
			force: true
		}*/
).then(function() {
	http.listen(PORT, function() {
		console.log('Server started!');
	});
});