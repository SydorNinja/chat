var username = getQueryVariable('username');
var password = getQueryVariable('password');
var room = 'test';
var socket = io();

console.log(username + ' wants to join ');
console.log(window.location);
jQuery('.room-title').text(room);

socket.on('connect', function() {
	if (window.location.href == 'http://localhost:3000/myProfile.html') {
		socket.emit('target', {
			target: '200'
		});
	}
	if (window.location.href == 'http://localhost:3000/myRooms.html') {
		socket.emit('target2', {
			target: '200'
		});
	}
	if (window.location.href == 'http://localhost:3000/landing.html') {
		socket.emit('target2', {
			target: '200'
		});
	}
	if (window.location.host == 'localhost:3000' && window.location.pathname == '/roomDetailes.html') {
		console.log(window.location.search.slice(7));
		socket.emit('target3', {
			title: window.location.search.slice(7)
		});
	}

	if (window.location.host == 'localhost:3000' && window.location.pathname == '/roomDetailesChange.html') {
		var dest = 'http://localhost:3000/roomDetailesChange?title=' + window.location.search.slice(7);
		$("form[action='/roomDetailesChange']").attr('action', dest);
	}

	console.log('Connected to socket.io server!');
	socket.emit('signin', {
		username: username,
		password: password
	});
});

socket.on('message', function(message) {
	var timestampMoment = moment.utc(message.timestamp);
	var $messages = jQuery('.messages');
	var $message = jQuery('<li class="list-group-item"></li>');

	console.log('New message:');
	console.log(message.text);

	$message.append('<p><strong>' + message.name + ' ' + timestampMoment.local().format('h:mm a') + '</strong></p>');
	$message.append('<p>' + message.text + '<p>');
	$messages.append($message);
});

var $form = jQuery('#message-form');
$form.on('submit', function(event) {
	event.preventDefault();

	$message = $form.find('input[name=message]');

	socket.emit('message', {
		name: name,
		text: $message.val()
	});

	$message.val('');
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

socket.on('target2', function(rooms) {
	if (window.location.href == 'http://localhost:3000/landing.html') {
		var $el = $('.selectClass');
		$el.empty();
		rooms.forEach(function(room){
    		$el.append("<option style=\"width: 310px\" value="+ room +">"+ room +"</option>");});

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

socket.on('target3', function(room) {
	var $roomDetailes = jQuery('#roomDetailes');

	if (room == null) {
		$roomDetailes.append('<h1>No Room Found</h1>');
		$("a[href='/roomDetailesChange.html']").attr('href', 'http://localhost:3000/landing.html');

	} else {
		var dest = 'roomDetailesChange.html?title=' + room.title;
		$("a[href='/roomDetailesChange.html']").attr('href', dest);
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