var cryptojs = require('crypto-js');
var _ = require('underscore');
var cookieParser = require('cookie-parser');

module.exports = function(db) {
	return {
		requireAuthentication: function(req, res, next) {
			console.log(req.cookies.Auth);
			var token = req.cookies.Auth;

			db.token.findOne({
				where: {
					tokenHash: cryptojs.MD5(token).toString()
				}
			}).then(function(tokenInstance) {
				if (!tokenInstance) {
					res.status(401).send();
				}
				req.token = tokenInstance;
				return db.user.findByToken(token);
			}, function() {
				res.status(401).send();
			}).then(function(user) {
				if (user.valid != true) {
					res.status(401).json("please validate your account via email");
				}
				req.user = user;
				next();
			}).catch(function() {
				res.status(401).send();
			});
		},
		validCheck: function(req, res, next) {
			var body = _.pick(req.body, 'username', 'password');
			db.user.authenticate(body).then(function(user) {
				if (user != null && user.valid == true) {
					req.user = user;
					next();
				} else {
					res.status(401).json("please validate your account via email");
				}
			}, function() {
				res.status(401).send();
			});

		}
	}
};