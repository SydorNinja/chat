module.exports = function(sequelize, DataTypes) {
	return conversation = sequelize.define('conversation', {
		text: {
			type: DataTypes.STRING,
			allowNull: false
		},
		time: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		sender: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
}