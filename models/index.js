'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

//모델
db.board = require('./Board')(sequelize);
db.comment = require('./comment')(sequelize);
db.like = require('./Like')(sequelize);
db.User = require('./User')(sequelize);
db.Class = require('./Class')(sequelize);
db.Subject = require('./Subject')(sequelize);
db.UserTakeClass = require('./UserTakeClass')(sequelize);
db.Chat = require('./Chat')(sequelize);
db.participant = require('./participant')(sequelize);
db.room = require('./room')(sequelize);
db.Desk = require('./Desk')(sequelize);
db.Position = require('./Position')(sequelize);
db.Chosen = require('./Chosen')(sequelize);
db.File = require('./File')(sequelize);
db.calendar = require('./calendar')(sequelize);
db.map = require('./map')(sequelize);
db.Memo = require('./Memo')(sequelize);

//모델 관계

//////////// 유저와 클래스
db.User.belongsToMany(db.Class, { through: 'UserTakeClass' });
db.Class.belongsToMany(db.User, { through: 'UserTakeClass' });

///////////// 클래스와 주제
db.Class.hasMany(db.Subject, { foreignKey: 'ClassId' });
db.Subject.belongsTo(db.Class, { foreignKey: 'ClassId' });

/////////////주제와 게시글
db.Subject.hasMany(db.board, { foreignKey: 'SubjectId' });
db.board.belongsTo(db.Subject, { foreignKey: 'SubjectId' });

/////////////클래스와 게시글
db.Class.hasMany(db.board, { foreignKey: 'ClassId' });
db.board.belongsTo(db.Class, { foreignKey: 'ClassId' });

////////////게시글과 댓글
db.board.hasMany(db.comment, { foreignKey: 'BoardId' });
db.comment.belongsTo(db.board, { foreignKey: 'BoardId' });

///////////게시글과 유저
db.User.hasMany(db.board, { foreignKey: 'id' });
db.board.belongsTo(db.User, { foreignKey: 'id' });

//////////게시글과 좋아요
db.board.hasMany(db.like, { foreignKey: 'BoardId' });
db.like.belongsTo(db.board, { foreignKey: 'BoardId' });

////////////게시글과 장소
db.board.hasMany(db.map, { foreignKey: 'BoardId' });
db.map.belongsTo(db.board, { foreignKey: 'BoardId' });

////////////유저와 좋아요
db.User.hasMany(db.like, { foreignKey: 'id' });
db.like.belongsTo(db.User, { foreignKey: 'id' });

//////////// 자리배치 관계
db.Desk.hasMany(db.Chosen);
db.Chosen.belongsTo(db.Desk);
db.Desk.hasMany(db.Position);
db.Position.belongsTo(db.Desk);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
