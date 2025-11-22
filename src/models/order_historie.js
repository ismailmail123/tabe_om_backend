'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class order_historie extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            order_historie.belongsTo(models.user, {
                foreignKey: "user_id",
                as: "user"
            })
            order_historie.belongsTo(models.order, {
                foreignKey: "order_id",
                as: "order"
            })
        }
    }
    order_historie.init({
        order_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        status: DataTypes.ENUM('pending', 'process', 'cancelled', 'completed'),
        note: DataTypes.TEXT,
    }, {
        sequelize,
        modelName: 'order_historie',
        underscored: true,
    });
    return order_historie;
};