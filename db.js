var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env == 'production') {
	sequelize = new Sequelize('postgres://podognssmdfzqe:b83539bd6c53faf1bd64a954ba1f2913fcaa00fb4f8ccf6e91511a82e9929f41@ec2-54-163-254-143.compute-1.amazonaws.com:5432/ddd4b17fpa08kl', {
		dialect: 'postgres',
		protocol: 'postgres',
		port: '5432',
		host: 'ec2-54-163-254-143.compute-1.amazonaws.com',
		logging: true //false
	});
} else {
	sequelize = new Sequelize(undefined, undefined, undefined, {
		'dialect': 'sqlite',
		'storage': __dirname + '/data/chat.sqlite'
	});
}

var db = {};

db.room = sequelize.import(__dirname + '/models/room.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.token = sequelize.import(__dirname + '/models/token.js');
db.conversation = sequelize.import(__dirname + '/models/conversation.js');
db.usersrooms = sequelize.import(__dirname + '/models/usersrooms.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.token.belongsTo(db.user);
db.user.hasMany(db.token);
db.room.belongsToMany(db.user, {
	through: db.usersrooms
});
db.user.belongsToMany(db.room, {
	through: db.usersrooms
});



module.exports = db;