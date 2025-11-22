'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class promo extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            promo.belongsTo(models.product, {
                foreignKey: "product_id",
                as: "product"
            })
        }
    }
    promo.init({
        product_id: DataTypes.INTEGER,
        discount_percentage: DataTypes.INTEGER,
        start_date: DataTypes.DATE,
        end_date: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'promo',
        underscored: true,
    });
    return promo;
};