var bcrypt = require('bcryptjs');
module.exports = function(value) {
	var salt = bcrypt.genSaltSync(10);
	var hashed = bcrypt.hashSync(value, salt);
	return hashed;
};