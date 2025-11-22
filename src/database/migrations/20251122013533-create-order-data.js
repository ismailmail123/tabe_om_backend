'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_data', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            order_id: {
                type: Sequelize.INTEGER
            },
            wbp_name: {
                type: Sequelize.STRING
            },
            wbp_room: {
                type: Sequelize.STRING
            },
            wbp_register_number: {
                type: Sequelize.STRING
            },
            wbp_sender: {
                type: Sequelize.STRING
            },
            note: {
                type: Sequelize.STRING
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
        await queryInterface.dropTable('order_data');
    }
};