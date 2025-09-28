const sequelize = require("../config/db");
const User = require('./User');
const Note = require("./Note");
const Associations = require("./associations");

Associations();

module.exports = {
  sequelize,
  User,
  Note,
};
