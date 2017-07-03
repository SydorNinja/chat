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

module.exports = {
	upload: function(message) {

		db.conversation.create(message).then(function(messageCreated) {
			if (message.TTL === true) {
				setTimeout(function() {
					messageCreated.destroy();
				}, 30000);
			}

		});

	},
	seeMessages: function(title) {
		return new Promise(function(resolve, reject) {
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
						return resolve({
							message: 'no messages'
						});
					} else {
						result = Publicating(messages, messages.length);
					}

				}).then(function() {
					resolve(result);
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
						resolve(result);
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
				attributes = {
					text: messageUpload
				};
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
				if (room == undefined) {
					reject();
				}
				var sendText;
				db.conversation.findAll({
					where: {
						roomId: room.id
					}
				}).then(function(messages) {
					if (messages == undefined || messages.length == 0) {
						return reject({
							message: 'nothing to send'
						});
					} else {
						result = PublicatingJSON(messages, messages.length);
						client.sendEmail({
							"From": "denyss@perfectomobile.com",
							"To": "" + user.email + "",
							"Subject": "conversations",
							"TextBody": "" + result + ""
						}, function(error, success) {
							if (error) {
								reject();
							} else {
								resolve();
							}
						});
					}
				}, function() {
					reject();
				});
			}, function() {
				reject();
			});
		}, function() {
			reject();
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
					resolve(result);
				});
			});
		});
	}
}