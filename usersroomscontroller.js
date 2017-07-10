var _ = require('underscore');
var db = require('./db.js');

function a(connections) {
	return new Promise(function(resolve, reject) {
		connections.forEach(function(connection, i, connections) {
			connections[i] = connection.userId;
			if (i == connections.length - 1) {
				resolve(connections);
			}

		});
	});
}

function b(ids) {
	return new Promise(function(resolve, reject) {
		ids.forEach(function(id, i, ids) {
			var user = db.user.findOne({
				where: {
					id: id
				}
			}).then(function(user) {
				ids[i] = user.username;
				if (i == ids.length - 1) {
					resolve(ids);
				}
			});
		});
	});
}

module.exports = {
	loginRoom: function(user, body) {
		return new Promise(function(resolve, reject) {
			var searcher = {};
			if (body === null || body.title === null) {
				reject();
			} else {
				searcher.title = body.title;
				if (body.password != '') {
					searcher.private = true;
					searcher.password = body.password;
				}
				if (!_.isString(body.password) && body.private === true) {
					reject();
				}
				db.room.findOne({
					where: searcher
				}).then(function(room) {
					if (room === null) {
						reject();
					} else {
						user.addRoom(room, {
							role: 0
						});
						resolve();
					}
				}, function() {
					reject();
				});
			}
		});
	},
	connectViaInvite: function(user, invite) {
		return new Promise(function(resolve, reject) {
			db.room.findOne({
				where: {
					invite: invite
				}
			}).then(function(room) {
				if (room != null) {
					user.addRoom(room, {
						role: 0
					});
					resolve();
				} else {
					reject();
				}
			}, function() {
				reject();
			});
		});
	},
	deleteUserFromRoom: function(user, body) {
		return new Promise(function(resolve, reject) {
			var where = {};
			where.title = body.room;
			db.room.findOne({
				where: where
			}).then(function(room) {
				if (room === null) {
					reject();
				}
				db.usersrooms.findOne({
					where: {
						roomId: room.id,
						userId: user.id
					}
				}).then(function(connection) {
					if (connection === null) {
						return reject();
					}
					if (connection.role == 1) {
						db.user.findOne({
							where: {
								username: body.userToRemove
							}
						}).then(function(deleteUser) {
							if (deleteUser == null) {
								reject();
							}
							db.usersrooms.findOne({
								where: {
									roomId: room.get('id'),
									userId: deleteUser.get('id')
								}
							}).then(function(connection) {
								if (connection != null) {
									connection.destroy();
									resolve(deleteUser.toPublicJSON());
								} else {
									reject();
								}
							}, function() {
								reject();
							});
						}, function() {
							reject();
						});
					} else {
						reject();
					}
				}, function() {
					reject();
				});
			}, function() {
				reject();
			});
		});
	},
	exitRoom: function(user, body) {
		return new Promise(function(resolve, reject) {
			var where = {};
			where.title = body.room;
			db.room.findOne({
				where: where
			}).then(function(room) {
				if (room === null) {
					reject();
				}
				db.usersrooms.findOne({
					where: {
						roomId: room.id,
						userId: user.id
					}
				}).then(function(connection) {
					if (connection === null) {
						return reject();
					} else {
						connection.destroy();
						resolve();
					}
				}, function() {
					reject();
				});
			}, function() {
				reject();
			});
		});
	},
	rooms: function(user) {
		return new Promise(function(resolve, reject) {
			var id = user.id;
			var roomTitleArray = [];
			var i = 0;
			db.usersrooms.findAll({
				where: {
					userId: id
				}
			}).then(function(connections) {
				if (connections == 0 || connections === []) {
					console.log('no Rooms');
					return resolve(false);
				}
				connections.forEach(function(connection) {
					var roomId = connection.roomId;
					db.room.findOne({
						where: {
							id: roomId
						}
					}).then(function(room) {
						roomTitleArray[i] = room.title;
						i++;
						if (i == connections.length) {
							resolve(roomTitleArray);
						}
					});
				});
			}, function() {
				reject();
			});
		});
	},
	favoriteChange: function(user, body) {
		return new Promise(function(resolve, reject) {
			var error;
			var roomTitle = body.room;
			var favoriteChange = body.favorite;
			if (!_.isBoolean(favoriteChange)) {
				return reject();
			}
			var attributes = {
				favorite: favoriteChange
			};
			var userId = user.id;
			var roomId;
			db.room.findOne({
				where: {
					title: roomTitle
				}
			}).then(function(room) {
				if (room) {
					roomId = room.id;
					db.usersrooms.findOne({
						where: {
							userId: userId,
							roomId: roomId
						}
					}).then(function(connection) {
						if (connection) {
							connection.update(attributes);
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
			})
		});
	},
	favoriteRooms: function(user) {
		return new Promise(function(resolve, reject) {
			var id = user.id;
			var roomTitleArray = [];
			var i = 0;
			db.usersrooms.findAll({
				where: {
					userId: id,
					favorite: true
				}
			}).then(function(connections) {
				if (connections == 0 || connections === []) {
					console.log('no Rooms');
					return resolve(false);
				}
				connections.forEach(function(connection) {
					var roomId = connection.roomId;
					db.room.findOne({
						where: {
							id: roomId
						}
					}).then(function(room) {
						roomTitleArray[i] = room.title;
						i++;
						if (i == connections.length) {
							resolve(roomTitleArray);
						}
					});
				});
			}, function() {
				reject();
			});
		});
	},
	usersInRoom: function(roomTitle, user) {
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
					if (connection == null || connection.role != 1) {
						reject();
					} else {
						db.usersrooms.findAll({
							where: {
								roomId: room.id
							}
						}).then(function(connections) {
							a(connections).then(function(ids) {
								b(ids).then(function(usernames) {
									resolve(ids);
								});
							});
						});
					}
				})
			})
		});
	}
}