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
var SocketIOFileUploadServer = require("socketio-file-upload");
SocketIOFileUploadServer.listen(app);
app.use(SocketIOFileUploadServer.router);
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
		fs.readFile(req.file.path, function(err, data) {
			var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
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



app.post('/room', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'title', 'password');
	roomcontroller.makeRoom(req.user, body).then(function(publicFormRoom) {
		res.redirect('/landing.html');
	}, function() {
		res.status(401).send();
	});

});

app.post('/changeRoomDetails', middleware.requireAuthentication, function(req, res) {
	var roomTitle = req.headers.referer.slice(52);
	var body = req.body;
	roomcontroller.changeRoomDetails(body, roomTitle, req.user).then(function() {
		if (body.title != '' && body.title != undefined) {
			res.redirect('/roomDetailes.html?title=' + body.title);
		} else {
			res.redirect('/roomDetailes.html?title=' + roomTitle);
		}
	}, function() {
		res.status(401).send();
	});
});

app.post('/upload2', middleware.requireAuthentication, upload.single('sampleFile'), function(req, res, next) {
	var roomTitle = req.headers.referer.slice(52);
	try {
		var body = {};
		fs.readFile(req.file.path, function(err, data) {
			var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
			fs.unlink(req.file.path);
			body.icon = base64Image;
			roomcontroller.changeRoomDetails(body, roomTitle, req.user).then(function() {
				res.redirect('/roomDetailes.html?title=' + roomTitle);
			}, function() {
				res.status(401).send();
			});

		});
	} catch (e) {
		res.status(401).send();
	}
});


app.post('/loginRoom', middleware.requireAuthentication, function(req, res) {
	var body = req.body;
	console.log(body);
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


app.post('/favorite', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, "room", "favorite");
	if (body.favorite === 'true') {
		body.favorite = true;
	} else if (body.favorite === 'false') {
		body.favorite = false;
	}
	usersroomscontroller.favoriteChange(req.user, body).then(function() {
		res.redirect('http://localhost:3000/favorite.html');
	}, function(error) {
		res.status(401).send();
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
			} else {
				res.send('sent to that email');
			}
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
		var Auth = token;
		res.cookie('Auth', token).header('Auth', token).redirect('/landing.html');
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


app.post('/deleteUser', middleware.requireAuthentication, function(req, res) {
	usercontroller.deleteUser(req.user).then(function() {
		res.status(204).redirect('/index.html');
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



function sendCurrentUsers(socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info == 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function(socketId) {
		var userInfo = clientInfo[socketId];

		if (info.room == userInfo.room) {
			users.push(userInfo.name);
		}
	});

	socket.emit('Smessage', {
		sender: 'System',
		text: 'Current users: ' + users.join(', '),
		timestamp: moment().valueOf()
	});
}

function sendPrivate(message, username) {
	var text = message.text.replace('@private', ' ').trim();
	if (text != null && text.length > 0) {
		console.log('private != null');
		var arrayText = text.split(" ");
		Object.keys(clientInfo).forEach(function(socketId) {
			var name = clientInfo[socketId].name;
			if (arrayText[0] == name) {
				io.to(socketId).emit('Smessage', {
					text: text.replace(name, ' ').trim(),
					timestamp: moment().valueOf(),
					sender: username
				});
			}
		});
	}
}

io.on('connection', function(socket) {
	var uploader = new SocketIOFileUploadServer();
	uploader.dir = "C:/Users/Owner/Desktop/Robert/NodeJs/projects/chat/uploads";
	console.log('path: ' + __dirname);
	uploader.listen(socket);
	var token = socket.handshake.headers.cookie.split(" ");
	if (token[1]) {
		if (token[1].length > token[0].length) {
			token = token[1];
		} else {
			token = token[0];
			token = token.slice(0, token.length - 1);
		}
		token = token.slice(5, token.length);
		db.user.findByToken(token).then(function(user) {
			socket.chatUser = user;
		}, function() {});
	}
	socket.on('disconnect', function() {
		usercontroller.signout(clientInfo.chatUser);

		var userData = clientInfo[socket.id];
		if (typeof userData != 'undefined') {
			socket.leave(userData.room);
			io.to(userData.room).emit('Smessage', {
				sender: 'System',
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

	socket.on('target2', function(target) {
		if (target.target === 'public') {
			roomcontroller.showPublicRooms().then(function(rooms) {
				socket.emit('target2', rooms);
			});
		} else {
			usersroomscontroller.rooms(socket.chatUser).then(function(rooms) {
				socket.emit('target2', rooms);
			});
		}
	});

	socket.on('target4', function(target) {
		console.log('in');
		usersroomscontroller.favoriteRooms(socket.chatUser).then(function(rooms) {
			socket.emit('target4', rooms);
		});
	});
	socket.on('target3', function(target) {
		console.log(target);
		if (target.mission === 'message') {
			conversationcontroller.seeMessages(target.title, socket.chatUser).then(function(messages) {
				console.log(messages);
				socket.emit('messages', messages);
			});
		} else {
			console.log(2002);
			roomcontroller.findRoomByTitle(target.title, socket.chatUser).then(function(room) {
				socket.emit('target3', room);
			}, function() {
				socket.emit('target3', null);
			});
		}

	});
	socket.on('joinRoom', function(req) {
		req.name = socket.chatUser.username;
		clientInfo[socket.id] = req;
		console.log(clientInfo[socket.id]);
		socket.join(req.room);
		socket.broadcast.to(req.room).emit('Smessage', {
			sender: 'System',
			text: req.name + ' has joined!',
			timestamp: moment().valueOf()
		});
	});
	socket.on('deleteMessage', function(request) {
		var id = request.id;
		conversationcontroller.deleteMessage(socket.chatUser, id).then(function() {
			io.to(clientInfo[socket.id].room).emit('requireM', {});
		});
	});
	socket.on('delete', function() {
		console.log('delete');
		roomcontroller.deleteRoom(socket.chatUser, clientInfo[socket.id].room).then(function() {
			io.to(clientInfo[socket.id].room).emit('land', {});
		});
	});
	socket.on('changeMessage', function(request) {
		var id = request.id;
		var messageUpload = {};
		console.log(messageUpload);
		if (_.isString(request.messageUpload.text)) {
			messageUpload.text = request.messageUpload.text;
			console.log(messageUpload);
		} else {
			messageUpload.text = null;
		}

		if (_.isString(request.messageUpload.photo)) {
			setTimeout(function() {
				fs.readFile('C:/Users/Owner/Desktop/Robert/NodeJs/projects/chat/uploads/' + request.messageUpload.photo, function(err, data) {
					var photoname = request.messageUpload.photo;
					console.log(data);
					var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
					console.log(base64Image);
					messageUpload.photo = base64Image;
					fs.unlink('C:/Users/Owner/Desktop/Robert/NodeJs/projects/chat/uploads/' + photoname);
				});

				conversationcontroller.editMessage(socket.chatUser, id, messageUpload).then(function() {
					io.to(clientInfo[socket.id].room).emit('requireM', {});
				});



			}, 1000);
		} else {
			messageUpload.photo = null;
			conversationcontroller.editMessage(socket.chatUser, id, messageUpload).then(function() {
				io.to(clientInfo[socket.id].room).emit('requireM', {});
			});
		}
		console.log(id);
		console.log(request);
	});

	socket.on('message', function(message) {
		var original = message;
		console.log(message);
		console.log('Message received: ' + message.text);

		if (message.text == '@currentUsers') {
			console.log("currentUsers");
			sendCurrentUsers(socket);
		} else if (message.text != undefined && message.text.search('@private') != -1) {
			console.log('private');
			sendPrivate(message, socket.chatUser.username);
		} else if (message.text != undefined && message.text == '@users') {
			console.log('users');
			usersroomscontroller.usersInRoom(clientInfo[socket.id].room, socket.chatUser).then(function(users) {
				var text = 'Users in Room: '+users;
				socket.emit('Smessage', {
					sender: 'System',
					text: text,
					timestamp: moment().valueOf()
				})
			});
		} else {
			var message = {
				time: moment().valueOf(),
				userId: socket.chatUser.id,
				sender: socket.chatUser.username
			};
			if (typeof(original.text) == 'string' && original.text.trim().length > 0) {
				message.text = original.text.trim();
			}
			if (typeof(original.TTL) === 'boolean') {
				message.TTL = original.TTL;
			}
			console.log(original.photo);
			if (typeof(original.photo) === 'string') {
				setTimeout(function() {
					fs.readFile('C:/Users/Owner/Desktop/Robert/NodeJs/projects/chat/uploads/' + original.photo, function(err, data) {
						console.log(data);
						var base64Image = 'data:image/png;base64,' + new Buffer(data, 'binary').toString('base64');
						console.log(base64Image);
						message.photo = base64Image;
						fs.unlink('C:/Users/Owner/Desktop/Robert/NodeJs/projects/chat/uploads/' + original.photo);
					});



					db.room.findOne({
						where: {
							title: clientInfo[socket.id].room
						}
					}).then(function(room) {
						if (room == null) {} else {
							message.roomId = room.id;
							if (message.TTL == true) {
								console.log('ok');
								io.to(clientInfo[socket.id].room).emit('requireM', {});
								conversationcontroller.upload(message).then(function() {
									io.to(clientInfo[socket.id].room).emit('requireM', {});
								});
							} else {
								conversationcontroller.upload(message);
								io.to(clientInfo[socket.id].room).emit('requireM', {});
							}


						}
					}, function() {});
				}, 100);
			} else {
				db.room.findOne({
					where: {
						title: clientInfo[socket.id].room
					}
				}).then(function(room) {
					if (room == null) {} else {
						message.roomId = room.id;
						if (message.TTL == true) {
							console.log('ok');
							io.to(clientInfo[socket.id].room).emit('requireM', {});
							conversationcontroller.upload(message).then(function() {
								io.to(clientInfo[socket.id].room).emit('requireM', {});
							});
						} else {
							conversationcontroller.upload(message);
							io.to(clientInfo[socket.id].room).emit('requireM', {});
						}


					}
				}, function() {});
			}

		}
	});

	socket.emit('Smessage', {
		sender: 'System',
		text: 'Welcome to the chat application',
		timestamp: moment().valueOf()
	});

	socket.on('deleteUserFRoom', function(username) {
		var input = {
			userToRemove: username
		};
		input.room = clientInfo[socket.id].room;
		console.log(input);
		usersroomscontroller.deleteUserFromRoom(socket.chatUser, input).then(function() {});
	});
	socket.on('exitRoom', function(username) {
		var input = {
			userToRemove: socket.chatUser.username
		};
		input.room = clientInfo[socket.id].room;
		console.log(input);
		usersroomscontroller.exitRoom(socket.chatUser, input).then(function() {});
	});

	socket.on('sendMail', function(){
		conversationcontroller.sendToMail(socket.chatUser, clientInfo[socket.id].room);
	});

	socket.on('clear', function(obj) {
		conversationcontroller.clearConversation(socket.chatUser, clientInfo[socket.id].room).then(function() {
			io.to(clientInfo[socket.id].room).emit('requireM', {});
		});

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