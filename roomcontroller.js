var db = require('./db.js');
var invite = require('./invite.js');
var _ = require('underscore');
module.exports = {
	makeRoom: function(user, body) {
		return new Promise(function(resolve, reject) {
			var creator = {};
			if (body != null && body.title != null) {
				creator.title = body.title;
				if (body.password.trim().length > 0) {
					creator.invite = invite(body.password);
					creator.password = body.password;
					creator.private = true;
					console.log(creator);
				} else {
					creator.invite = invite(body.title);
					console.log(creator);
				}
				db.room.create(creator).then(function(room) {
					user.addRoom(room, {
						role: 1
					});
					var publicFormRoom = _.pick(room, 'private', 'title');
					resolve(publicFormRoom);
				}, function() {
					reject();
				});
			} else {
				reject();
			}
		});
	},
	deleteRoom: function(user, body) {
		return new Promise(function(resolve, reject) {
			if (body != null && body.title != null) {
				var where = body;
				if (body.password) {
					where.private = true;
				} else {
					where.private = false;
				}
				db.room.findOne({
					where: where
				}).then(function(room) {
					if (room != null) {
						var room = room;
						db.usersrooms.findOne({
							where: {
								userId: user.get('id'),
								roomId: room.get('id')
							}
						}).then(function(connection) {
							if (connection != null) {
								if (connection.get('role') == true) {
									db.conversation.findAll({
										where: {
											roomId: room.id
										}
									}).then(function(conversations) {
										conversations.forEach(function(conversation) {
											conversation.destroy();
										});
									});
									room.destroy();
									resolve();
								} else {
									reject();
								}
							} else {
								reject();
							}
						}, function() {
							reject();
						})
					} else {
						reject();
					}
				}, function() {
					reject();
				});
			} else {
				reject();
			}
		});
	},
	findRoomByTitle: function(title, user) {
		return new Promise(function(resolve, reject) {
			db.room.findOne({
				where: {
					title: title
				}
			}).then(function(room) {
				if (room != null) {
					var publicFormRoom = _.pick(room, 'private', 'title', 'icon');
					if (room.private == false) {
						publicFormRoom.invite = room.invite;
						if (user != undefined) {
							db.usersrooms.findOne({
								where: {
									userId: user.id,
									roomId: room.id
								}
							}).then(function(connection) {
								if (connection == null) {
									resolve(publicFormRoom);
								} else {
									publicFormRoom.InRoom = true;
									resolve(publicFormRoom);
								}
							});
						} else {
							resolve(publicFormRoom);
						}
					} else {
						if (user != undefined) {
							db.usersrooms.findOne({
								where: {
									userId: user.id,
									roomId: room.id
								}
							}).then(function(connection) {
								if (connection == null) {
									resolve(publicFormRoom);
								} else {
									publicFormRoom.invite = room.invite;
									publicFormRoom.InRoom = true;
									resolve(publicFormRoom);
								}
							});
						} else {
							resolve(publicFormRoom);
						}

					}

				} else {
					reject();
				}
			}, function() {
				reject();
			});
		});
	},
	showPublicRooms: function() {
		return new Promise(function(resolve, reject) {
			db.room.findAll({
				where: {
					private: false
				}
			}).then(function(rooms) {
				var publicFormRooms = [];
				rooms.forEach(function(room) {
					room = _.pick(room, 'title', 'invite', 'icon');
					publicFormRooms.push(room);
				});
				return publicFormRooms;
			}, function() {
				return reject();
			}).then(function(rooms) {
				resolve(rooms);
			}, function(e) {
				reject();
			});
		});
	},
	changeRoomDetails: function(body, roomTitle, user) {
		return new Promise(function(resolve, reject) {
			body = _.pick(body, 'title', 'password', 'icon');
			db.room.findOne({
				where: {
					title: roomTitle
				}
			}).then(function(room) {
				if (room != null) {
					db.usersrooms.findOne({
						where: {
							userId: user.id,
							roomId: room.id
						}
					}).then(function(connection) {
						if (connection != null) {
							if (connection.role != 1) {

							} else {
								if (body.password == '' && body.title != '') {
									body = _.pick(body, 'title');
									room.update(body);
								} else if (body.title == '' && body.password != '') {
									body = _.pick(body, 'password');
									body.private = true;
									room.update(body);
								} else if (_.isString(body.icon)) {
									body = _.pick(body, 'icon');
									room.update(body);
								} else if (body.password != '' && body.title != '') {
									room.update(body);
								}
							}

							resolve();
						} else {
							reject();
						}
					}, function() {
						reject();
					});
				} else {
					reject();
				}
			}, function() {
				reject();
			});
		});
	}
};