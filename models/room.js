module.exports = function(sequelize, DataTypes) {
	return room = sequelize.define('room', {
		title: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [3,20]
			}
		},
		icon: {
			type: DataTypes.BLOB,
			allowNull: true,
		}
	});
}