'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('orders', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.ENUM('pending', 'process', 'cancelled', 'completed'),
                defaultValue: 'pending',
            },
            total_price: {
                type: Sequelize.DECIMAL(10, 2)
            },
            payment_method: {
                type: Sequelize.ENUM('COD', 'transfer', 'virtual_account', 'qris'),
                defaultValue: 'transfer'
            },
            payment_status: {
                type: Sequelize.ENUM('pending', 'process', 'cancelled', 'completed'),
                defaultValue: 'pending'
            },
            order_code: {
                type: Sequelize.INTEGER
            },
            order_date: {
                type: Sequelize.DATE
            },
            purchase_receipt_photo: {
                type: Sequelize.TEXT
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
        await queryInterface.dropTable('orders');
    }
};