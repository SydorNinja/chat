module.exports = UsersRooms = function(sequelize, DataTypes) {
	return sequelize.define('UsersRooms', {
		role: DataTypes.STRING
	});
};