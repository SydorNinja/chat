var _ = require('underscore');
var db = require('./db.js');
module.exports = {
	loginRoom: function(user, body) {
		return new Promise(function(resolve, reject) {
			if (body === null || body.title === null) {
				reject();
			} else {
				if (body.password != null) {
					body.private = true;
				}
				if (!_.isString(body.password) && body.private === true) {
					reject();
				}
				db.room.findOne({
					where: body
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
						role: 1
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
			if (body.password) {
				where.password = body.password
			}
			db.room.findOne({
				where: where
			}).then(function(room) {
				if (room === null) {
					reject();
				}
				db.UsersRooms.findOne({
					where: {
						roomId: room.get('id'),
						userId: user.get('id')
					}
				}).then(function(connection) {
					if (connection === null) {
						reject();
					}
					if (connection.role == true) {
						db.user.findOne({
							where: {
								username: body.userToRemove
							}
						}).then(function(deleteUser) {
							if (deleteUser === null) {
								reject();
							}
							db.UsersRooms.findOne({
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
	rooms: function(user) {
		return new Promise(function(resolve, reject) {
			var id = user.id;
			var roomIdArray = [];
			var roomTitleArray = [];
			db.UsersRooms.findAll({
				where: {
					userId: id
				}
			}).then(function(connections) {
				connections.forEach(function(connection) {
					roomIdArray.push(connection.roomId);
				});
				for (var i = 0; i < roomIdArray.length; i++) {
					if (i <= roomIdArray.length) {
						db.room.findOne({
							where: {
								id: roomIdArray[i]
							}
						}).then(function(room) {
							roomTitleArray.push(room.title);
							if (i == roomIdArray.length) {
								resolve(roomTitleArray);
							}
						});
					}
				}
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
					db.UsersRooms.findOne({
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
	favoriteRooms: function(user){
		return new Promise(function(resolve, reject) {
			var id = user.id;
			var roomIdArray = [];
			var roomTitleArray = [];
			db.UsersRooms.findAll({
				where: {
					userId: id,
					favorite: true
				}
			}).then(function(connections) {
				if (connections == 0) {
					return resolve('no favorite rooms');
				}
				connections.forEach(function(connection) {
					roomIdArray.push(connection.roomId);
				});
				for (var i = 0; i < roomIdArray.length; i++) {
					if (i <= roomIdArray.length) {
						db.room.findOne({
							where: {
								id: roomIdArray[i]
							}
						}).then(function(room) {
							roomTitleArray.push(room.title);
							if (i == roomIdArray.length) {
								resolve(roomTitleArray);
							}
						});
					}
				}
			}, function() {
				reject();
			});
		});
	}
}