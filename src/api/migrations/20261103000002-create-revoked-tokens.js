'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('revoked_tokens', {
      token_hash: {
        type: Sequelize.CHAR(64),
        allowNull: false,
        primaryKey: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('revoked_tokens');
  },
};
