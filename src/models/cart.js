'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class cart extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            cart.belongsTo(models.user, {
                foreignKey: "user_id",
                as: "user"
            })
            cart.belongsTo(models.variant, {
                foreignKey: "variant_id",
                as: "variant"
            })
        }
    }
    cart.init({
        user_id: DataTypes.INTEGER,
        variant_id: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'cart',
        underscored: true,
    });
    return cart;
};