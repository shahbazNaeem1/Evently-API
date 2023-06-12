const Event = require("./Event.models");

module.exports = (sequelize, DataTypes) => {
  const Invite = sequelize.define("Invitee", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      alloWNull: false,
      validate: {
        isEmail: true,
      },
    },
    qrCode: {
      type: DataTypes.STRING(65535),
    },
    scanned: {
      type: DataTypes.BOOLEAN,
      required: true,
      defaultValue: false,
    },
  });

  return Invite;
};
