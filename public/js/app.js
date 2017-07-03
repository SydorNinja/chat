var username = getQueryVariable('username');
var password = getQueryVariable('password');
var socket = io();

console.log(username + ' wants to join ');

jQuery('.room-title').text(room);

socket.on('connect', function() {
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

