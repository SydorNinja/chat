module.exports = usersrooms = function(sequelize, DataTypes) {
	return sequelize.define('usersrooms', {
		role: DataTypes.STRING,
		favorite: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		}
	});
};
