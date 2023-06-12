const Event = require("./Event.models");

module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define("Image", {
    imageId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true,
    },

    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Image;
};
