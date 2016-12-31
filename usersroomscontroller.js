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
	}
};