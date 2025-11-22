'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('variants', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            product_id: {
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            img_url: {
                type: Sequelize.TEXT
            },
            price: {
                type: Sequelize.DECIMAL
            },
            sku: {
                type: Sequelize.STRING
            },
            stock: {
                type: Sequelize.INTEGER
            },
            is_available: {
                type: Sequelize.BOOLEAN
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
        await queryInterface.dropTable('variants');
    }
};