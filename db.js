var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

console.log('environment = ' + env);
if (env == 'production') {
	var match = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		dialect: 'postgres',
		protocol: 'postgres',
		port: match[4],
		host: match[3],
		logging: true,
		dialectOptions: {
			ssl: true
		}
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