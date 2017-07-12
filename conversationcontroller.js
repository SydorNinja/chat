var _ = require('underscore');
var db = require('./db.js');
var icontroler = 0;
var result;
var postmark = require("postmark");
var client = new postmark.Client("f557529a-2ec5-468b-ac99-5aa8f9a1d335");
var moment = require('moment');

function Publicating(messages, number) {
	for (var i = 0; i < messages.length; i++) {
		messages[i] = messages[i].toPublic();
	}
	var messagesSliced = messages.slice(messages.length - number, messages.length);
	return messagesSliced;
}

function PublicatingJSON(messages, number) {
	for (var i = 0; i < messages.length; i++) {
		messages[i] = messages[i].toPublicJSON();
	}
	var messagesSliced = messages.slice(messages.length - number, messages.length);
	return JSON.stringify(messagesSliced);
}

function daysCalc(messages, days) {
	for (var i = 0; i < messages.length; i++) {
		if (messages[i].time < moment().valueOf() - days * 86400) {
			messages.splice(i, 1);
			console.log(messages);
		}
	}
	return messages;
}

function a(conversations) {
	console.log('101');
	return new Promise(function(resolve, reject) {
		var htmlConversetions = '<ul>';
		conversations.forEach(function(message, i, array) {
			htmlConversetions = htmlConversetions + '<li>';
			htmlConversetions = htmlConversetions + '<p><strong>' + message.sender + ' ' + moment.utc(message.time).format('h:mm a') + '</strong></p>';
			if (message.photo != null) {
				htmlConversetions = htmlConversetions + '<p><strong> </strong></p>' + '<img src=' + message.photo + ' style= width:50px height:100px>';
			}
			if (message.text != null) {
				htmlConversetions = htmlConversetions + '<p><strong>' + message.text + '</strong></p>';
			}
			htmlConversetions = htmlConversetions + '</li>';
		});
		htmlConversetions = htmlConversetions + '</ul>';
		resolve(htmlConversetions);

	});
}

module.exports = {
	upload: function(message) {
		return new Promise(function(resolve, reject) {
			db.usersrooms.findOne({
				where: {
					roomId: message.roomId,
					userId: message.userId
				}
			}).then(function(connection) {
				if (connection != null) {
					db.conversation.create(message).then(function(messageCreated) {
						if (message.TTL === true) {
							setTimeout(function() {
								messageCreated.destroy();
								resolve();
							}, 30000);

						} else {
							resolve();
						}

					});
				} else {
					reject();
				}
			});

		});

	},
	seeMessages: function(title, user) {
		return new Promise(function(resolve, reject) {
			var result = {};
			var messages = [];
			db.room.findOne({
				where: {
					title: title
				}
			}).then(function(room) {
				if (room == null) {
					return reject();
				}
				db.conversation.findAll({
					where: {
						roomId: room.id
					}
				}).then(function(messages) {
					if (messages.length == 0) {
						result.message = 'no messages';
						db
					} else {
						result.result = Publicating(messages, messages.length);
					}

				}).then(function() {
					db.usersrooms.findOne({
						where: {
							userId: user.id,
							roomId: room.id
						}
					}).then(function(connection) {
							if (connection == null) {
								reject();
							} else {
								if (connection.role == 1) {

									result.role = 1;
									result.username = user.username;
									resolve(result);
								} else {

									result.username = user.username;
									resolve(result);
								}

							}
						},

						function() {
							reject();
						});
				});
			});
		});
	},

	alternativeNM: function(title, number) {
		return new Promise(function(resolve, reject) {
			if (number > 0) {
				var messages = [];
				db.room.findOne({
					where: {
						title: title
					}
				}).then(function(room) {
					db.conversation.findAll({
						where: {
							roomId: room.id
						}
					}).then(function(messages) {
						if (messages.length == 0) {
							return resolve({
								message: 'no messages'
							});
						} else if (messages.length < number) {
							number = messages.length;
							result = Publicating(messages, number);
						} else {
							result = Publicating(messages, number);
						}

					}).then(function() {
						db.usersrooms.findOne({
							where: {
								userId: user.id,
								roomId: room.id
							}
						}).then(function(connection) {
								if (connection == null) {
									reject();
								} else {
									resolve(result);
								}
							},

							function() {
								reject();
							});
					});
				});
			} else {
				return resolve({
					message: 'no messages'
				});
			}
		});
	},
	clearConversation: function(user, roomTitle) {
		return new Promise(function(resolve, reject) {
			db.room.findOne({
				where: {
					title: roomTitle
				}
			}).then(function(room) {
				db.usersrooms.findOne({
					where: {
						roomId: room.id,
						userId: user.id
					}
				}).then(function(connection) {
					if (connection.role == 1) {
						db.conversation.findAll({
							where: {
								roomId: room.id
							}
						}).then(function(conversations) {
							conversations.forEach(function(conversation) {
								conversation.destroy();
							});
							resolve();
						}, function() {
							reject();
						});
					} else {
						reject();
					}
				}, function() {
					reject();
				})
			}, function() {
				reject();
			})
		});
	},
	deleteMessage: function(user, messageId) {
		return new Promise(function(resolve, reject) {
			db.conversation.findOne({
				where: {
					id: messageId
				}
			}).then(function(message) {
				if (message == undefined) {
					return reject();
				} else if (message.userId == user.id) {
					message.destroy();
					resolve();
				} else {
					db.usersrooms.findOne({
						where: {
							roomId: message.roomId,
							userId: user.id
						}
					}).then(function(connection) {
						if (connection.role == 1) {
							message.destroy();
							resolve();
						} else {
							reject();
						}
					}, function() {
						reject();
					});
				}
			}, function() {
				reject();
			});
		});
	},
	editMessage: function(user, messageId, messageUpload) {
		return new Promise(function(resolve, reject) {
			db.conversation.findOne({
				where: {
					id: messageId,
					userId: user.id
				}
			}).then(function(message) {
				if (message == undefined) {
					reject();
				}
				attributes = messageUpload;
				message.update(attributes);
				resolve(message);
			}, function() {
				reject();
			});
		});
	},
	sendToMail: function(user, roomTitle) {
		return new Promise(function(resolve, reject) {
			db.room.findOne({
				where: {
					title: roomTitle
				}
			}).then(function(room) {
				if (room == null) {
					reject();
				} else {
					db.usersrooms.findOne({
						where: {
							userId: user.id,
							roomId: room.id
						}
					}).then(function(connection) {
						if (connection == null) {
							reject();
						} else {
							db.conversation.findAll({
								where: {
									roomId: room.id
								}
							}).then(function(conversations) {
								if (conversations == null) {

								} else {
									a(conversations).then(function(htmlConversetions) {
										client.sendEmail({
											"From": "denys@pomvom.com",
											"To": "" + user.email + "",
											"Subject": "conversations",
											"HtmlBody": "" + htmlConversetions + ""
										}, function(error, success) {
											if (error) {
												console.log(error);
												reject();
											} else {
												resolve();
											}
										});
										resolve(htmlConversetions);
									});
								}
							});
						}
					});
				}
			});
		});
	},
	seeNLastDays: function(title, days) {
		return new Promise(function(resolve, reject) {
			var messages = [];
			db.room.findOne({
				where: {
					title: title
				}
			}).then(function(room) {
				db.conversation.findAll({
					where: {
						roomId: room.id
					}
				}).then(function(messages) {
					if (messages.length == 0) {
						return resolve({
							message: 'no messages'
						});
					} else {
						result = Publicating(messages, messages.length);
						result = daysCalc(result, days);
					}

				}).then(function() {
					db.usersrooms.findOne({
						where: {
							userId: user.id,
							roomId: room.id
						}
					}).then(function(connection) {
							if (connection == null) {
								reject();
							} else {
								resolve(result);
							}
						},

						function() {
							reject();
						});
				});
			});
		});
	}
}