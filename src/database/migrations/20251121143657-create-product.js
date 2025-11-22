'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('products', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER
            },
            category_id: {
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            img_url: {
                type: Sequelize.TEXT
            },
            price: {
                type: Sequelize.DECIMAL(10, 2)
            },
            stock: {
                type: Sequelize.INTEGER
            },
            availability: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            rating: {
                type: Sequelize.DECIMAL(2, 2)
            },
            total_sold: {
                type: Sequelize.INTEGER
            },
            discount: {
                type: Sequelize.DECIMAL(2, 2)
            },
            is_delete: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            created_at: {
                allowNull: false,
                type: 'TIMESTAMP',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                allowNull: false,
                type: 'TIMESTAMP',
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('products');
    }
};