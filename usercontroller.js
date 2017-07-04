var db = require('./db.js');
var moment = require('moment');
var _ = require('underscore');
var postmark = require("postmark");
var client = new postmark.Client("f557529a-2ec5-468b-ac99-5aa8f9a1d335");


module.exports = {
	findByUsername: function(username) {
		return new Promise(function(resolve, reject) {
			db.user.findOne({
				where: {
					username: username
				}
			}).then(function(user) {
				if (user != null) {
					user.signin = moment.utc(user.signin).local().format('MMMM Do, h:mm a');
					user.signup = moment.utc(user.signup).local().format('MMMM Do YYYY, h:mm a');
					resolve(user);
				} else {
					reject();
				}
			}, function() {
				reject();
			});
		});
	},
	changeUsername: function(user, newUsername) {
		return new Promise(function(resolve, reject) {
			if (_.isString(newUsername)) {
				var attributes = {
					username: newUsername.trim()
				};
				user.update(attributes).then(function() {
					resolve(attributes.username)
				}, function() {
					reject()
				});
			} else {
				reject();
			}
		});
	},
	verify: function(query) {
		return new Promise(function(resolve, reject) {
			if (!query.hasOwnProperty('vh') || !_.isString(query.vh)) {
				reject();
			}
			var validHashUser = query.vh;
			db.user.findOne({
				where: {
					validHash: validHashUser
				}
			}).then(function(user) {
				if (user != null) {
					attributes = {};
					attributes.valid = true;
					user.update(attributes);
					resolve();
				} else {
					reject();
				}
			});
		});
	},
	changeDetails: function(user, body) {
		return new Promise(function(resolve, reject) {
			var up = {};
			if (body.username) {
				up.username = body.username;
			}
			if (body.password.length > 6 && body.password.length < 101) {
				up.password = body.password;
			}
			user.update(up).then(function() {
				resolve();
			}, function() {
				reject();
			});
		});
	},
	signin: function(user) {
		return new Promise(function(resolve, reject) {
			var userToken = user.generateToken('authentication');
			db.token.create({
				token: userToken
			}).then(function(token) {
				user.addToken(token).then(function() {
					return token.reload();
				}).then(function() {
					var attributes = {
						signin: moment().valueOf()
					};
					user.update(attributes);
					user.reload();
					resolve(userToken);
				});
			}, function() {
				reject();
			});
		});
	},
	getPassword: function(query) {
		if (!query.hasOwnProperty('ph')) {
			reject();
		} else {
			user.findOne({
				where: {
					password_hash: query.ph
				}
			}).then(function(user) {
				if (user === null) {
					reject();
				} else {
					var password = Math.floor(Math.random() * 1000000000 + 1);
					user.update({
						password: password.toString()
					});
					resolve(password);
				}
			}, function() {
				res.status(401).send();
			});
		}
	},
	signup: function(body) {
		return new Promise(function(resolve, reject) {
			body.signup = moment().valueOf();
			body.signin = moment().valueOf();
			if (body.username == null) {
				var email = body.email;
				var searched = email.search('@');
				if (searched != -1) {
					var sliced = email.slice(0, searched).trim();
					body.username = sliced;
				}
			}
			db.user.create(body).then(function(user) {
				client.sendEmail({
					"From": "denyss@perfectomobile.com",
					"To": "" + body.email + "",
					"Subject": "Your new Todo account",
					"TextBody": "enter the link: http://localhost:3000/verify?vh=" + user.validHash + ""
				}, function(error, success) {
					if (error) {
						reject();
					} else {
						resolve(user);
					}
				});
			}, function(e) {
				reject();
			});
		});
	},
	forgotPassword: function(body) {
		return new Promise(function(resolve, reject) {
			if (!_.isString(body.email)) {
				reject({
					error: "email"
				});
			} else {
				user.findOne({
					where: {
						email: body.email
					}
				}).then(function(user) {
					if (user === null) {
						reject();
					} else {
						client.sendEmail({
							"From": "denyss@perfectomobile.com",
							"To": "" + body.email + "",
							"Subject": "Restart your password",
							"TextBody": "enter the link: localhost:3000/getPassword?ph=" + user.password_hash + ""
						}, function(error, success) {
							if (error) {
								reject();
							} else {
								resolve();
							}
						});
					}
				}, function(e) {
					reject();
				});
			}
		});
	},
	signout: function(user) {
		return new Promise(function(resolve, reject) {
			db.token.findAll({
				where: {
					userId: user.id
				}
			}).then(function(tokens) {
				tokens.forEach(function(token) {
					token.destroy();
				});
				resolve();
			}, function() {
				reject();
			});
		});
	},
	deleteUser: function(user) {
		return new Promise(function(resolve, reject) {
			db.token.findAll({
				where: {
					userId: user.get('id')
				}
			}).then(function(tokens) {
				tokens.forEach(function(token) {
					token.destroy();
					user.destroy();
				});
				resolve();
			}, function() {
				reject();
			});
		});
	}
};