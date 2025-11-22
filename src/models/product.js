'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class product extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            product.hasMany(models.variant, {
                foreignKey: "product_id",
                as: "variant"
            })
            product.belongsTo(models.category, {
                foreignKey: "category_id",
                as: "category"
            })
            product.belongsTo(models.user, {
                foreignKey: "user_id",
                as: "user"
            })
        }
    }
    product.init({
        user_id: DataTypes.INTEGER,
        category_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        img_url: DataTypes.TEXT,
        price: DataTypes.DECIMAL,
        stock: DataTypes.INTEGER,
        availability: DataTypes.BOOLEAN,
        rating: DataTypes.DECIMAL,
        total_sold: DataTypes.INTEGER,
        discount: DataTypes.DECIMAL,
        is_delete: DataTypes.BOOLEAN
    }, {
        sequelize,
        modelName: 'product',
        underscored: true,
    });
    return product;
};