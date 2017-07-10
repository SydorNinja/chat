var username = getQueryVariable('username');
var password = getQueryVariable('password');
var title = getQueryVariable('title');
var room = getQueryVariable("room");
var socket = io();
var days = getQueryVariable('days');
var messagesNum = getQueryVariable('messagesNum');
if (window.location.host == 'localhost:3000' && window.location.pathname == '/chat.html') {

	var instance = new SocketIOFileUpload(socket);
	instance.listenOnSubmit(document.getElementById("submitb"), document.getElementById("siofu_input"));
}

function daysCalc(messages, days) {
	for (var i = 0; i < messages.length; i++) {
		if (messages[i].time < moment().valueOf() - days * 86400) {
			messages.splice(i, 1);
		}
	}
	return messages;
}
console.log(username + ' wants to join ');
console.log(window.location);
jQuery('.room-title').text(room);

socket.on('connect', function() {
	if (window.location.href == 'http://localhost:3000/myProfile.html') {
		socket.emit('target3', {
			mission: 'message',
			title: room
		});
		window.location.href = '/chat.html?room=' + room;
	}
	if (window.location.href == 'http://localhost:3000/reloader.html') {
		socket.emit('requireM', {
			target: '200'
		});
	}
	if (window.location.href == 'http://localhost:3000/favorite.html') {
		console.log(1);
		socket.emit('target4', {
			target: '200'
		});
	}
	if (window.location.href == 'http://localhost:3000/landing.html' || window.location.href == 'http://localhost:3000/favorite.html' || window.location.href == 'http://localhost:3000/myRooms.html') {

		socket.emit('target2', {
			target: '200'
		});
	}
	if (window.location.host == 'localhost:3000' && window.location.pathname == '/roomDetailes.html') {

		socket.emit('target3', {
			title: title
		});
	}

	if (window.location.host == 'localhost:3000' && window.location.pathname == '/chat.html') {
		socket.emit('target3', {
			mission: 'message',
			title: room
		});

		socket.emit('joinRoom', {
			room: room
		});
	}

	if (window.location.host == 'localhost:3000' && window.location.pathname == '/roomDetailesChange.html') {

		var dest = 'http://localhost:3000/roomDetailesChange?title=' + title;
		$("form[action='/roomDetailesChange']").attr('action', dest);
	}

	if (window.location.href == 'http://localhost:3000/publicRooms.html') {
		socket.emit('target2', {
			target: 'public'
		});
	}

	console.log('Connected to socket.io server!');
});

socket.on('messages', function(result) {
	console.log('role');
	console.log(result);
	var messages = result.result;
	if (days != "") {
		daysCalc(messages, parseInt(days));
	}

	if (messagesNum != "" && messages.length > messagesNum) {
		messages = messages.slice(messages.length - messagesNum, messages.length);
	}

	var $messages = jQuery('.messages');
	$messages.empty();
	console.log(messages);
	if (result.message === "no messages") {
		console.log("sorry");
		$messages.append('<p><h1>No Messages</strong></p>');
	} else {
		messages.forEach(function(message) {
			console.log(message);
			var timestampMoment = moment.utc(message.time);

			var $message = jQuery('<li class="list-group-item"></li>');

			console.log('New message:');
			console.log(message.text + ' photo ' + message.photo);
			$message.append('<p><strong>' + message.sender + ' ' + timestampMoment.local().format('h:mm a') + '</strong></p>');
			if (message.photo) {
				$message.append('<p><strong> </strong></p>' + '<img src=' + message.photo + ' style= width:50px height:100px>');
			}
			if (message.text) {
				$message.append('<p>' + message.text + '<p>');
			}
			if (result.username == message.sender || result.role == 1) {
				$message.append('<form id="' + message.id + '"><input type="submit" class="btn btn-block btn-danger" value="delete"></form>');
			}
			if (result.username == message.sender) {
				$message.append('<br><br><form id="' + message.id + 'change"><input type="hidden" name="id" value="' + message.id + '"><br><input type="text" name="message" class="form-control" id="abc" /><br><input type="file" id="siofu_input' + message.id + '" name="photo" class="form-control" /><br><input type="submit" class="btn btn-block btn-warning" value="Change" id="submitb2' + message.id + '"></form>');

			}



			$messages.append($message);
			if (result.username == message.sender) {

				instance.listenOnSubmit(document.getElementById("submitb2" + message.id + ""), document.getElementById("siofu_input" + message.id + ""));
			}

			jQuery('#' + message.id).on('submit', function(event) {
				event.preventDefault();
				socket.emit('deleteMessage', {
					id: message.id
				});
			});
			jQuery('#' + message.id + 'change').on('submit', function(event) {
				var message = {};
				event.preventDefault();
				var id = (event.currentTarget.childNodes["0"].defaultValue);
				var form = jQuery('#' + id + 'change');
				var messageUpload = {};

				$photo = form.find('input[name=photo]');
				if ($photo.val().length > 0) {
					messageUpload.photo = $photo.val().split('\\')[2];
				}
				$text = form.find('input[name=message]').val().trim();
				$TTL = form.find('select[name=TTL]');

				if ($TTL.val() == "true") {
					messageUpload.TTL = true;
				}
				if ($text.length > 0) {
					messageUpload.text = $text;
				}
				if (messageUpload.text != undefined || messageUpload.photo != undefined) {
					console.log("good");
					message.id = id;
					message.messageUpload = messageUpload;
					socket.emit('changeMessage', message);
				}
			});
		});


	}
	console.log(result);
	if (result.role != 1) {
		console.log("no admin");
		$adminRow = jQuery('#row-admin');
		$adminRow.remove();
	} else {
		console.log("admin");
	}
});

socket.on('Smessage', function(message) {
	var $messages = jQuery('.messages');
	console.log("SM");
	console.log(message);
	var timestampMoment = moment.utc(message.timestamp);
	console.log(timestampMoment);
	var $message = jQuery('<li class="list-group-item"></li>');
	$message.append('<p><strong>' + message.sender + ' ' + timestampMoment.local().format('h:mm a') + '</strong></p>');
	if (message.photo) {
		$message.append('<p><strong> </strong></p>' + '<img src=' + message.photo + ' style= width:50px height:100px>');
	}
	if (message.text) {
		$message.append('<p>' + message.text + '<p>');
	}
	$messages.append($message);
});


var $form = jQuery('#message-form');
$form.on('submit', function(event) {
	event.preventDefault();
	var message = {};
	$photo = $form.find('input[name=photo]');
	if ($photo.val().length > 0) {
		console.log("abcd");
		message.photo = $photo.val().split('\\')[2];
	}
	$text = $form.find('input[name=message]').val().trim();
	$TTL = $form.find('select[name=TTL]');

	if ($TTL.val() == "true") {
		message.TTL = true;
	}
	if ($text.length > 0) {
		message.text = $text;
	}
	console.log(message);
	if (message.text != undefined || message.photo != undefined) {
		socket.emit('message', message);
	}
	$("#siofu_input").val("");
	$("#message_text").val("");
});

$deleteUserFRoom = jQuery('#deleteUserFRoom');
$deleteUserFRoom.on('submit', function(event) {
	event.preventDefault();
	var username = $deleteUserFRoom.find('input[name=username]').val();
	if (username != '') {
		socket.emit('deleteUserFRoom', username);
	}
	$("#username").val("");
});

$exitRoom = jQuery('#exitRoom');
$exitRoom.on('submit', function(event) {
	event.preventDefault();
	socket.emit('exitRoom', {});
	window.location.href = ('/landing.html');
});



$('#clearAdmin').click(function(event) {
	socket.emit('clear', {});
});

$('#deleteRoom').click(function(event) {
	console.log('delete');
	socket.emit('delete', {});
});

socket.on('target', function(profile) {

	var username = profile.username;
	var email = profile.email;
	var photo = profile.photo;
	var signin = profile.signin;
	var signup = profile.signup;
	var $profile = jQuery('.profiles');
	$profile.append('<p><strong> Username: ' + username + '</strong></p>');
	$profile.append('<p><strong> Email: ' + email + '</strong></p>');
	if (photo == null) {
		$profile.append('<p><strong> No photo </strong></p>');
	} else {
		$profile.append('<p><strong> Photo: </strong></p>' + '<img src=' + photo + ' style= width:50px height:100px>');
	}
	$profile.append('<p><strong> Last sign in: ' + moment.utc(signin).local().format('h:mm a') + '</strong></p>');
	$profile.append('<p><strong> Signed up: ' + moment.utc(signup).local().format('h:mm a') + '</strong></p>');
});
socket.on('message', function(message) {
	socket.emit('target3', {
		mission: 'message',
		title: room
	});
});
socket.on('target2', function(rooms) {

	if (window.location.href == 'http://localhost:3000/landing.html' || window.location.href == 'http://localhost:3000/favorite.html') {
		var $el = $('.selectClass');
		$el.empty();
		rooms.forEach(function(room) {
			$el.append("<option style=\"width: 310px\" value=" + room + ">" + room + "</option>");
		});

	} else if (window.location.href == 'http://localhost:3000/publicRooms.html') {
		console.log("dfsdfsd");
		var $publicRooms = jQuery('.publicRooms');
		if (rooms === false) {
			$publicRooms.append('<h1>No Rooms</h1>');
		} else {

			console.log(rooms);

			$publicRooms.append('<h1> My Rooms </h1>');
			rooms.forEach(function(room) {
				$publicRooms.append('<p><strong> Title:' + room.title + '</strong></p> ');
				if (room.icon == null) {
					$publicRooms.append('<p><strong> No Photo </strong></p>');
				} else {
					$publicRooms.append('<p><strong>Icon: </strong></p><img src=' + room.icon + ' style=width:50px height:100px>');
				}
				$publicRooms.append('<form action="/connectViaInvite" method="post"><input type="hidden" value=' + room.invite + ' class="invite" name="invite"><br><br><input type="submit" value="Login" class="btn btn-primary btn-block" ></form>');
			});
		}
	} else {
		console.log(rooms + ' ' + typeof(rooms));
		var $myRooms = jQuery('.myRooms');
		if (rooms === false) {
			$myRooms.append('<h1>No Rooms</h1>');
		} else {

			console.log(rooms);

			$myRooms.append('<h1> My Rooms </h1>');
			rooms.forEach(function(room) {
				$myRooms.append('<p><strong>' + room + '</strong></p> ');
			});
		}
	}
});

socket.on('land', function() {
	window.location.href = '/landing.html';
});

socket.on('requireM', function() {
	socket.emit('target3', {
		mission: 'message',
		title: room
	});
});

socket.on('target4', function(rooms) {
	var $myRooms = jQuery('.myfavorite');
	if (rooms === false) {
		$myRooms.append('<h1>No Favorite Rooms</h1>');
	} else {

		console.log(rooms);

		$myRooms.append('<h1> My Favorite Rooms: </h1>');
		rooms.forEach(function(room) {
			$myRooms.append('<p><strong>' + room + '</strong></p> ');
		});
	}
});



socket.on('target3', function(room) {

	var $roomDetailes = jQuery('.roomDetailes');


	if (room == null) {
		$roomDetailes.append('<h1>No Room Found</h1>');
		$("a[href='/roomDetailesChange.html']").attr('href', 'http://localhost:3000/landing.html');

	} else {
		console.log(room);
		if (room.InRoom == undefined) {
			$("a[href='/roomDetailesChange.html']").remove();
		} else {
			var dest = 'roomDetailesChange.html?title=' + room.title;
			$("a[href='/roomDetailesChange.html']").attr('href', dest);
		}
		if (room.icon == null) {
			$roomDetailes.append('<p><strong> No Photo </strong></p>');
		} else {
			$roomDetailes.append('<p><strong>Icon: </strong></p><img src=' + room.icon + ' style=width:50px height:100px>');
		}
		$roomDetailes.append('<p><strong>' + room.title + '</strong></p>');
		if (room.private == true) {
			$roomDetailes.append('<p><strong> The Room Is Private! </strong></p>');
		} else {
			$roomDetailes.append('<p><strong> The Room Is Public </strong></p>');

		}
		if (room.invite) {
			$roomDetailes.append('<p><strong> Invite Code: ' + room.invite + ' </strong></p>');
		}



	}
});