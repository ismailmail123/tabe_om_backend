'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class variant extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            variant.hasMany(models.orderitem, {
                foreignKey: "variant_id",
                as: "orderitem"
            })
            variant.hasMany(models.cart, {
                foreignKey: "variant_id",
                as: "cart"
            })
            variant.hasMany(models.promo, {
                foreignKey: "variant_id",
                as: "promo"
            })
            variant.belongsTo(models.product, {
                foreignKey: "product_id",
                as: "product"
            })
        }
    }
    variant.init({
        product_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        img_url: DataTypes.TEXT,
        price: DataTypes.DECIMAL,
        sku: DataTypes.STRING,
        stock: DataTypes.INTEGER,
        is_available: DataTypes.BOOLEAN,
        is_delete: DataTypes.BOOLEAN
    }, {
        sequelize,
        modelName: 'variant',
        underscored: true,
    });
    return variant;
};