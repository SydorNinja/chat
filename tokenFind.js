var db = require('./db.js');
var cryptojs = require('crypto-js');
module.exports = function(token) {
	console.log('token: '+token);
	db.token.findOne({
		where: {
			tokenHash: cryptojs.MD5(token).toString()
		}
	}).then(function(tokenInstance) {
		var tokenSearch = tokenInstance;
		return db.user.findByToken(token);
	});
}