const multer = require("multer");
const { user: UserModel, category: CategoryModel, store: StoreModel, product: ProductModel, review: ReviewModel, variant: VariantModel, sequelize } = require("../models");
const { Sequelize, where } = require("sequelize");
const category = require("../models/category");

const { Op } = Sequelize;

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */


// Fungsi untuk membandingkan waktu
const isStoreOpen = (openTime, closeTime, currentTime) => {
    const toMinutes = (timeStr) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const currentMinutes = toMinutes(currentTime);
    const openMinutes = toMinutes(openTime);
    const closeMinutes = toMinutes(closeTime);

    // Handle kasus normal (07:00 - 23:00)
    if (openMinutes <= closeMinutes) {
        return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }
    // Handle kasus lewat tengah malam (contoh: 22:00 - 05:00)
    else {
        return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
};

// const index = async(req, res, _next) => {
//     try {

//         // Ambil semua produk dengan toko terlebih dahulu
//         const products = await ProductModel.findAll({
//             where: {
//                 is_delete: false
//             },
//             include: [{
//                     model: UserModel,
//                     as: "user",
//                     attributes: { exclude: ['password', 'terverifikasi'] },
//                     required: true,
//                 },
//                 {
//                     model: CategoryModel,
//                     as: "category",
//                 },
//                 {
//                     model: VariantModel,
//                     as: "variant",
//                 }
//             ],
//         });

//         return res.send({
//             message: "Success",
//             data: products
//         });
//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).send({
//             message: "Internal Server Error",
//             error: error.message
//         });
//     }
// };
const index = async(req, res, _next) => {
    try {
        const userRole = req.user.role; // Asumsi data user ada di req.user setelah authentication

        // Base where condition
        const whereCondition = {
            is_delete: false
        };

        // Tambahkan filter availability untuk non-admin
        if (userRole !== 'admin') {
            whereCondition.availability = true;
        }

        // Ambil semua produk dengan toko terlebih dahulu
        const products = await ProductModel.findAll({
            where: whereCondition,
            include: [{
                    model: UserModel,
                    as: "user",
                    attributes: { exclude: ['password', 'terverifikasi'] },
                    required: true,
                },
                {
                    model: CategoryModel,
                    as: "category",
                },
                {
                    model: VariantModel,
                    as: "variant",
                    where: { is_delete: false }, // Filter variant yang tidak dihapus
                    required: false, // LEFT JOIN untuk variant
                }
            ],
        });

        // Handle variant yang kosong
        const productsWithVariant = products.map(product => {
            if (!product.variant) {
                product.variant = [];
            }
            return product;
        });

        return res.send({
            message: "Success",
            data: productsWithVariant
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */

const show = async(req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findByPk(id, {
            include: [{
                    model: VariantModel,
                    where: { is_delete: false },
                    as: "variant",
                    required: false, // Tambahkan ini untuk LEFT JOIN
                },
                {
                    model: CategoryModel,
                    as: "category",
                },
                {
                    model: UserModel,
                    as: "user",
                    attributes: { exclude: ['password', 'terverifikasi'] },
                }
            ]
        });

        if (!product) {
            return res.status(404).send({
                message: "product tidak ditemukan",
                data: null
            })
        }

        // Jika variant null atau tidak ada, set menjadi array kosong
        if (!product.variant) {
            product.variant = [];
        }

        return res.send({
            message: "success",
            data: product,
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */


const create = async(req, res, _next) => {
    try {
        const currentUser = req.user;
        const { category_id, name, description, img_url, price } = req.body;


        if (!req.file) {
            return res.status(400).send({ message: "Gambar tidak ditemukan, pastikan gambar diunggah dengan benar" });
        }

        const image = req.file.path; // Cloudinary URL

        if (currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Hanya admin yang dapat menambahkan produk" });
        }

        if (!category_id || !name || !description || !price) {
            return res.status(400).send({ message: "Permintaan tidak valid, pastikan semua data diisi" });
        }


        const newProduct = await ProductModel.create({
            user_id: currentUser.id,
            category_id,
            name,
            description,
            img_url: image,
            price,
        });


        return res.send({
            message: "Product created successfully",
            data: newProduct,
        });
    } catch (error) {
        if (error instanceof multer.MulterError) {
            // Tangani error Multer
            return res.status(400).json({ message: error.message });
        } else if (error.message === "File harus berupa gambar!") {
            return res.status(400).json({ message: error.message });
        } else {
            // Error lainnya
            console.error("Error:", error.message); // Hanya untuk debugging
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};


const update = async(req, res, _next) => {
    try {
        const currentUser = req.user;
        const { productId } = req.params;
        const image = req.file ? req.file.path : null; // Menjadi null jika tidak ada file
        const { category_id, name, description, img_url, price } = req.body;



        // Memastikan productId tidak undefined
        if (!productId) {
            return res.status(400).send({ message: "Product ID tidak ditemukan" });
        }

        // Memastikan hanya seller yang dapat memperbarui produk
        // if (currentUser.role !== 'seller') {
        //     return res.status(403).send({ message: "Hanya seller yang dapat memperbarui produk" });
        // }
        // Perbaikan logika pengecekan role
        if (currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Hanya admin yang dapat menambahkan produk" });
        }


        // Memastikan produk milik seller yang sedang login
        const product = await ProductModel.findOne({
            where: {
                id: productId,
            },
        });

        if (!product) {
            return res.status(404).send({ message: "Produk tidak ditemukan atau Anda tidak memiliki izin untuk memperbaruinya" });
        }

        // Memvalidasi inputan dari user
        if (!name || !description) {
            return res.status(400).send({ message: "Tidak ada data yang diperbarui" });
        }

        // Update produk
        const updatedProduct = await product.update({
            category_id: category_id || product.category_id,
            name,
            img_url: image || img_url || product.img_url,
            description,
            price
        });

        return res.send({
            message: "Product updated successfully",
            data: updatedProduct,
        });
    } catch (error) {
        if (error instanceof multer.MulterError) {
            // Tangani error Multer
            return res.status(400).json({ message: error.message });
        } else if (error.message === "File harus berupa gambar!") {
            return res.status(400).json({ message: error.message });
        } else {
            // Error lainnya
            console.error("Error:", error.message); // Hanya untuk debugging
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};
const updateAvailability = async(req, res, _next) => {
    try {
        const currentUser = req.user;
        const { productId, availability } = req.body;

        // Validasi payload
        if (!productId || availability === undefined) {
            return res.status(400).json({
                message: "Product ID dan Availability harus disertakan"
            });
        }

        // Cari produk
        const product = await ProductModel.findOne({
            where: { id: productId }
        });

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan" });
        }

        // Verifikasi hak akses
        if (currentUser.role !== 'admin' && product.userId !== currentUser.id) {
            return res.status(403).json({
                message: "Anda tidak memiliki akses untuk mengupdate produk ini"
            });
        }

        // Update availability
        await product.update({ availability });

        return res.json({
            message: "Availability produk berhasil diupdate",
            data: { availability: product.availability }
        });
    } catch (error) {
        console.error("Update Product Error:", error)
        return res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });
    }
};


/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */

const remove = async(req, res) => {
    const t = await sequelize.transaction(); // Mulai transaction
    try {
        const currentUser = req.user;
        const { productId } = req.params;

        if (!productId) {
            await t.rollback();
            return res.status(400).json({ message: "Product ID is required" });
        }

        // Validasi role
        if (currentUser.role !== 'admin') {
            await t.rollback();
            return res.status(403).json({
                message: "Hanya admin yang dapat menghapus produk"
            });
        }

        // Cari produk termasuk seller_id
        const product = await ProductModel.findOne({
            where: { id: productId },
            transaction: t // Masukkan dalam transaction
        });

        if (!product) {
            await t.rollback();
            return res.status(404).json({
                message: "Produk tidak ditemukan"
            });
        }

        // Validasi kepemilikan
        if (currentUser.role !== 'admin') {
            await t.rollback();
            return res.status(403).json({
                message: "Anda tidak memiliki izin untuk menghapus produk ini"
            });
        }

        // Soft delete produk dan varian
        await ProductModel.update({ is_delete: true }, { where: { id: productId }, transaction: t });

        await VariantModel.update({ is_delete: true }, { where: { product_id: productId }, transaction: t });

        await t.commit(); // Commit transaction jika semua berhasil

        return res.json({
            success: true,
            message: "Produk dan varian berhasil dihapus (soft delete)"
        });

    } catch (error) {
        await t.rollback(); // Rollback jika terjadi error
        console.error("Delete product error:", error);
        return res.status(500).json({
            message: "Terjadi kesalahan pada server"
        });
    }
};
module.exports = { index, show, create, remove, update, updateAvailability };