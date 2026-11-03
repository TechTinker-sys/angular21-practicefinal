'use strict';

const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

const adminId = '00000000-0000-4000-8000-000000000001';
const adminEmail = 'admin@example.com';

module.exports = {
  async up(queryInterface) {
    const [existingAdmin] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      {
        replacements: { email: adminEmail },
        type: QueryTypes.SELECT,
      },
    );

    if (existingAdmin) {
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        name: 'Admin',
        email: adminEmail,
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { id: adminId });
  },
};
