var bcrypt = require('bcryptjs');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
	return user = sequelize.define('user', {
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				len: [4, 12]
			}
		},


		signup: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		signin: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		photo: {
			type: DataTypes.BLOB
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,			
			validate: {
				isEmail: true
			}
		},
		validHash: {
			type: DataTypes.STRING,
			set: function() {
				var salt = bcrypt.genSaltSync(10);
				var hashed = bcrypt.hashSync(this.email, salt);
				this.setDataValue('validHash', hashed);
			}
		},
		valid: {
			type: DataTypes.BOOLEAN
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function(value) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email == 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		},
		classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {
					if (!_.isString(body.username) || !_.isString(body.password)) {
						console.log('not string ' + body.password + body.username);
						return reject();
					}
					user.findOne({
						where: {
							username: body.username
						}
					}).then(function(user) {
						if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
							console.log('password error');
							return reject();
						}
						console.log(user);
						resolve(user);


					}, function(e) {
						reject();
					});
				});
			},
			findByToken: function(token) {
				return new Promise(function(resolve, reject) {
					try {
						var decodedJWT = jwt.verify(token, 'qwerty098');
						var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#!');
						var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

						user.findById(tokenData.id).then(function(user) {
							if (user) {
								resolve(user);
							} else {
								reject();
							}
						}, function(e) {
							reject();
						})
					} catch (e) {
						reject();
					}
				});
			}
		},
		instanceMethods: {
			toPublicJSON: function() {
				var json = this.toJSON();
				return _.pick(json, 'id', 'username', 'signup', 'signin', 'email');
			},
			generateToken: function(type) {
				if (!_.isString(type)) {
					return undefined;
				}

				try {
					var stringData = JSON.stringify({
						id: this.get('id'),
						type: type
					});
					var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#!').toString();
					var token = jwt.sign({
						token: encryptedData
					}, 'qwerty098');
					return token;
				} catch (e) {
					console.error("Failed to generate token." + e);
					return undefined;
				}
			}
		}
	});
	return user;
};