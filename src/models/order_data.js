'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class order_data extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            order_data.belongsTo(models.order, {
                foreignKey: "order_id",
                as: "order"
            })
        }
    }
    order_data.init({
        order_id: DataTypes.INTEGER,
        wbp_name: DataTypes.STRING,
        wbp_room: DataTypes.STRING,
        wbp_register_number: DataTypes.STRING,
        wbp_sender: DataTypes.STRING,
        note: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'order_data',
        underscored: true,
    });
    return order_data;
};