'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('payments', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER
            },
            order_id: {
                type: Sequelize.INTEGER
            },
            midtrans_order_id: {
                type: Sequelize.STRING
            },
            payment_method: {
                type: Sequelize.ENUM('COD', 'transfer'),
                defaultValue: 'transfer'
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2)
            },
            payment_status: {
                type: Sequelize.ENUM('pending', 'process', 'cancelled', 'completed'),
                defaultValue: 'pending'
            },
            payment_date: {
                type: Sequelize.DATE
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
        await queryInterface.dropTable('payments');
    }
};