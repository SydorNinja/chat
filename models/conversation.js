var _ = require('underscore');
module.exports = function(sequelize, DataTypes) {
	return conversation = sequelize.define('conversation', {
		text: {
			type: DataTypes.STRING
		},
		time: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		roomId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		sender: {
			type: DataTypes.STRING,
			allowNull: false
		},
		TTL: {
			type: DataTypes.INTEGER
		},
		photo: {
			type: DataTypes.STRING
		}

	}, {
		instanceMethods: {
			toPublic: function() {
				return _.pick(this, 'sender', 'time', 'photo', 'text', 'id');
			},
			toPublicJSON: function() {
				var json = this.toJSON();
				return _.pick(json, 'sender', 'time', 'photo', 'text', 'id');
			}
		}
	});
}