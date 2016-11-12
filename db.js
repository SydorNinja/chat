var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env == 'production') {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres'
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
db.UsersRooms = sequelize.import(__dirname + '/models/UsersRooms.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.conversation.belongsTo(db.room);
db.room.hasMany(db.conversation);
db.token.belongsTo(db.user);
db.user.hasMany(db.token);
db.room.belongsToMany(db.user, {
	through: db.UsersRooms
});
db.user.belongsToMany(db.room, {through: db.UsersRooms});



module.exports = db;