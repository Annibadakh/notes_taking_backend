const User = require("./User");
const Note = require("./Note");

const Associations = () => {
  User.hasMany(Note, {
    foreignKey: "userId",
    sourceKey: "uuid",
    as: "notes",
    onDelete: "CASCADE",
  });

  Note.belongsTo(User, {
    foreignKey: "userId",
    targetKey: "uuid",
    as: "user",
  });
};

module.exports = Associations;
