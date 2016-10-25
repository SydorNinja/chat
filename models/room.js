var _ = require('underscore');
module.exports = function(sequelize, DataTypes) {
	return room = sequelize.define('room', {
		title: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				len: [3, 20]
			}
		},
		icon: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		private: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		invite: {
			type: DataTypes.STRING,
			allowNull: false
		},
		password: DataTypes.STRING
	});
}