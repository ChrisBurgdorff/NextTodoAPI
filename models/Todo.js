module.exports = (sequelize, DataTypes) => {
  const Todo = sequelize.define("Todo", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  });

  return Todo;
}