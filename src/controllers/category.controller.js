const multer = require("multer");
const { product: ProductModel, category: CategoryModel } = require("../models");
const { where } = require("sequelize");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */

const index = async(req, res, _next) => {
    try {
        let categories = await CategoryModel.findAll({
            where: { is_delete: false },
            include: [{
                model: ProductModel,
                as: "product",
            }],
        });
        return res.send({
            message: "Success",
            data: categories,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
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

        const category = await CategoryModel.findByPk(id, {
            include: [{
                model: ProductModel,
                as: "product",
            }],
        });

        if (!category) {
            return res.status(404).send({
                message: "Category tidak ditemukan",
                data: null
            })
        }

        return res.send({
            message: "success",
            data: category,
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
        const { name, slug, description } = req.body;



        // Validasi field wajib
        if (!name || !slug || !description) {
            return res.status(400).send({ message: "Data tidak lengkap" });
        }

        // Cari produk beserta categorynya
        // const product = await ProductModel.findOne({
        //     where: { id: product_id },
        //     include: [{
        //         model: CategoryModel,
        //         as: "category",
        //     }],
        // });

        // Validasi 1: Pastikan produk ditemukan
        // if (!product) {
        //     return res.status(404).send({ message: "Produk tidak ditemukan" });
        // }


        // Buat category baru
        const newCategory = await CategoryModel.create({
            user_id: currentUser.id,
            name,
            slug,
            description
        });


        return res.send({
            message: "Category berhasil dibuat",
            data: newCategory,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};



const update = async(req, res, _next) => {
    try {
        const currentUser = req.user;
        const { id } = req.params;
        const { name, slug, description } = req.body;


        // Memvalidasi inputan dari user
        if (!name || !slug || !description) {
            return res.status(400).send({ message: "Tidak ada data yang diperbarui" });
        }

        // Memastikan productId tidak undefined
        if (!id) {
            return res.status(400).send({ message: "category ID tidak ditemukan" });
        }

        // Memastikan hanya admin yang dapat memperbarui produk
        if (currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Hanya admin yang dapat memperbarui produk" });
        }

        // Memastikan produk milik admin yang sedang login
        const category = await CategoryModel.findOne({
            where: {
                id: id,
            },
        });

        if (!category) {
            return res.status(404).send({ message: "Category tidak ditemukan atau Anda tidak memiliki izin untuk memperbaruinya" });
        }


        if (!category) {
            return res.status(404).send({ message: "Category tidak ditemukan" });
        }


        // Update produk
        const updatedCategory = await category.update({
            name,
            slug,
            description
        });

        return res.send({
            message: "Category updated successfully",
            data: updatedCategory,
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




/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */

const remove = async(req, res, _next) => {
    try {
        const currentUser = req.user;
        const { categoryId } = req.body;


        // Memastikan hanya admin yang dapat menghapus produk
        if (currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Hanya admin yang dapat menghapus produk" });
        }

        const category = await CategoryModel.findOne({
            where: {
                id: categoryId,
            },
        });

        if (!category) {
            return res.status(404).send({ message: "Category tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya" });
        }

        await CategoryModel.update({
            is_delete: true // Tandai sebagai dihapus
        }, {
            where: {
                id: categoryId,
            },
        });


        return res.send({ message: "Category berhasil dihapus" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};


module.exports = { index, show, create, remove, update };