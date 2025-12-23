'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('users', [{
                nama: 'Admin',
                email: 'tabeombantaeng@gmail.com',
                password: '$2b$10$.HnWJ5My7jNggT8rfgeeSuWclRvjbzfv57M11CMQnN959ak3mC8QO', // Harus dienkripsi jika dalam produksi
                role: 'admin',
                alamat: 'Jl. Mawar No. 19 Kel. Pallantikang',
                photo: 'https://res.cloudinary.com/dopcawo4w/image/upload/v1742456044/products/lc9qr48odwo47fphbs0v.jpg',
                hp: '+6285342545607',
                jenis_kelamin: 'laki-laki',
                tempat_lahir: 'Bantaeng',
                tanggal_lahir: '1908-01-01',
                status: 'aktif',
                terverifikasi: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                nama: 'User',
                email: 'ismailbary396@gmail.com',
                password: '$2b$10$.HnWJ5My7jNggT8rfgeeSuWclRvjbzfv57M11CMQnN959ak3mC8QO', // Harus dienkripsi jika dalam produksi
                role: 'user',
                alamat: 'Jl. Mawar No. 19 Kel. Pallantikang',
                photo: 'https://res.cloudinary.com/dopcawo4w/image/upload/v1742456044/products/lc9qr48odwo47fphbs0v.jpg',
                hp: '+6285342545607',
                jenis_kelamin: 'laki-laki',
                tempat_lahir: 'Bantaeng',
                tanggal_lahir: '1908-01-01',
                status: 'aktif',
                terverifikasi: 1,
                created_at: new Date(),
                updated_at: new Date(),
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        return queryInterface.bulkDelete('users', null, {});
    }
};