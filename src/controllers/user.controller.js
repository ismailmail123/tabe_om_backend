const { Op, where } = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const { user: UserModel, orderitem: OrderItemModel, order_historie: HistoryModel, order_data: OrderDataModel, product: ProductModel, order: OrderModel, variant: VariantModel, payment: PaymentModel, courier_earning: Courier_earningModel, courier: CourierModel } = require("../models");
const { axios } = require("axios");
const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");


/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */


const indexUser = async(req, res, next) => {
    try {
        // Cek apakah user yang sedang login adalah admin
        if (req.user.role !== "admin") {
            return res.status(403).send({
                message: "Forbidden: You are not allowed to access this resource.",
            });
        }

        // Pertama ambil semua user dengan data dasar
        const users = await UserModel.findAll({
            where: {
                is_delete: false,
                id: {
                    [Op.ne]: req.user.id
                } // Exclude current user
            },
            include: [{
                model: OrderModel,
                as: "orders",
                include: [
                    { model: PaymentModel, as: "payment" },
                    {
                        model: HistoryModel,
                        as: "order_historie"
                    },
                    {
                        model: OrderDataModel,
                        as: "order_data"
                    },
                ],

            }, ],
        }, {
            attributes: { execlude: ['password', "terverifikasi", ] }
        });

        return res.send({
            message: "success",
            data: users,
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

const show = async(req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).send({ message: "User ID tidak ditemukan" });
        }

        const user = await UserModel.findByPk(id, {
            attributes: { exclude: ['password', 'kode_verifikasi', 'nama_perangkat'] },
            include: [{
                model: OrderModel,
                as: "orders",
                include: [{
                        model: OrderItemModel,
                        as: "orderitem",
                        include: [{
                            model: VariantModel,
                            as: "variant",
                            include: [{
                                model: ProductModel,
                                as: "product",
                                include: [{
                                    model: UserModel,
                                    as: "user"
                                }]
                            }]
                        }],
                    },
                    { model: PaymentModel, as: "payment" },
                    {
                        model: HistoryModel,
                        as: "order_historie"
                    },
                    {
                        model: OrderDataModel,
                        as: "order_data"
                    },
                ],

            }, ],
        });

        return res.send({
            message: "success",
            data: user,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};


const updateUser = async(req, res, _next) => {
    try {
        const { userId } = req.params;
        const image = req.file ? req.file.path : null;
        const currentUser = req.user;

        if (!userId) {
            return res.status(400).send({ message: "User ID tidak ditemukan" });
        }

        // if (currentUser.id !== userId) {
        //     return res.status(403).json({ message: "Unauthorized: Anda hanya bisa mengupdate profil sendiri" });
        // }
        const {
            nama,
            alamat,
            photo,
            hp,
            jenis_kelamin,
            tempat_lahir,
            tanggal_lahir,
            terverifikasi
        } = req.body;



        const userExist = await UserModel.findOne({ where: { id: userId } });
        if (!userExist) {
            return res.status(401).json({ message: "User tidak ditemukan" });
        }

        const updatedProfile = await UserModel.update({
            nama,
            alamat,
            photo: image || userExist.photo,
            hp,
            jenis_kelamin,
            tempat_lahir,
            tanggal_lahir,
            terverifikasi
        }, {
            where: { id: userId }
        });


        return res.send({
            message: "Update successfully",
            data: updatedProfile, // Kirim data user yang sudah diupdate
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};
const remove = async(req, res, _next) => {
    try {
        const currentUser = req.user;
        const { userId } = req.body;

        console.log("Uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuser ID to delete:", userId);


        // Memastikan hanya admin yang dapat menghapus user
        if (currentUser.role !== 'admin') {
            return res.status(403).send({ message: "Hanya admin yang dapat menghapus user" });
        }

        const user = await UserModel.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            return res.status(404).send({ message: "User tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya" });
        }

        // await VariantModel.destroy({
        //     where: {
        //         id: variantId,
        //     },
        // });

        await UserModel.update({
            is_delete: true // Tandai sebagai dihapus
        }, {
            where: {
                id: userId,
            },
        });


        return res.send({ message: "User berhasil dihapus" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};


module.exports = {
    indexUser,
    show,
    updateUser,
    remove,
};