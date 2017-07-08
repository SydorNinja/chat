var username = getQueryVariable('username');
var password = getQueryVariable('password');
if (window.location.host == 'localhost:3000' && window.location.pathname == '/chat.html') {
	var room = window.location.search.slice(6);
	console.log(window.location.search);
}
var socket = io();
if (window.location.host == 'localhost:3000' && window.location.pathname == '/chat.html') {

	var instance = new SocketIOFileUpload(socket);
	instance.listenOnSubmit(document.getElementById("submitb"), document.getElementById("siofu_input"));
}


console.log(username + ' wants to join ');
console.log(window.location);
jQuery('.room-title').text(room);

socket.on('connect', function() {
	if (window.location.href == 'http://localhost:3000/myProfile.html') {

		socket.emit('target', {
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
			title: window.location.search.slice(7)
		});
	}

	if (window.location.host == 'localhost:3000' && window.location.pathname == '/chat.html') {

		console.log(window.location.search.slice(6));
		socket.emit('target3', {
			mission: 'message',
			title: window.location.search.slice(6)
		});

		socket.emit('joinRoom', {
			room: room
		});
	}

	if (window.location.host == 'localhost:3000' && window.location.pathname == '/roomDetailesChange.html') {

		var dest = 'http://localhost:3000/roomDetailesChange?title=' + window.location.search.slice(7);
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
	console.log(result);
	var messages = result.result;
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

			$messages.append($message);
		});
		console.log(result);
		if (result.role != 1) {
			console.log("no admin");
			$rowClear = jQuery('#row-admin');
			$rowClear.remove();
		}else{console.log("admin");}
	}

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
	if (message != {}) {
		socket.emit('message', message);
	}
	$("#siofu_input").val("");
	$("#abc").val("");
});


$('#clearAdmin').click(function(event) {
	socket.emit('clear', {});
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
	var timestampMoment = moment.utc(message.timestamp);
	var $messages = jQuery('.messages');
	var $message = jQuery('<li class="list-group-item"></li>');

	console.log('New message:');
	console.log(message.text);

	$message.append('<p><strong>' + message.sender + ' ' + timestampMoment.local().format('h:mm a') + '</strong></p>');
	if (message.photo) {
		$message.append('<p><strong> </strong></p>' + '<img src=' + message.photo + ' style= width:50px height:100px>');
	}
	if (message.text) {
		$message.append('<p>' + message.text + '<p>');
	}
	$messages.append($message);
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
				$publicRooms.append('<p><strong> Invite:' + room.invite + '</strong></p> ');
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

socket.on('requireM', function() {
	socket.emit('target3', {
		mission: 'message',
		title: window.location.search.slice(6)
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