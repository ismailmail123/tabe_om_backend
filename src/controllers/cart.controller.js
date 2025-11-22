const { user: UserModel, cart: CartModel, product: ProductModel, variant: VariantModel, store: StoreModel } = require("../models");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */
const index = async(req, res, _next) => {
    try {


        // Dapatkan user ID dengan cara yang lebih fleksibel
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).send({ message: "User ID not found" });
        }
        const cart = await CartModel.findAll({
            where: {
                user_id: userId,
            },
            attributes: ["id", "variant_id", "quantity"],
            include: [{
                model: VariantModel,
                as: 'variant',
                include: [{
                    model: ProductModel,
                    as: "product",
                    include: [{
                        model: UserModel,
                        as: 'user',

                    }]

                }]
            }]
        });
        return res.send({
            message: "Success",
            data: cart
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
const create = async(req, res, _next) => {
    try {
        const { variant_id, quantity } = req.body;
        const currentUser = req.user;


        // melakukan pengecekan terhadap inputan user
        if (!variant_id || !quantity) {
            return res.status(400).send({ message: "Permintaan tidak valid" });
        }

        // if (currentUser.role !== "customer") {
        //     return res.status(403).send({ message: "Akses ditolak, hanya user yang dapat mengakses" });
        // }

        const variant = await VariantModel.findOne({
            where: {
                id: variant_id,
            },
        });

        // melakukan pengecekan produk dari variant_id
        if (!variant) {
            return res.status(404).send({ message: "Produk tidak ditemukan" });
        }

        // melakukan pengecekan pada stok produk
        if (variant.stock < quantity) {
            return res.status(400).send({ message: "Stock tidak mencukupi" });
        }

        // cek apakah item sudah ada di cart
        const existingCartItem = await CartModel.findOne({
            where: {
                user_id: req.user.id,
                variant_id,
            },
        });

        let cart;

        if (existingCartItem) {
            // jika item sudah ada di cart, update quantity
            const newQuantity = existingCartItem.quantity + quantity;

            // cek stok produk sebelum update
            if (variant.stock < newQuantity) {
                return res.status(400).send({ message: "Stock tidak mencukupi untuk quantity yang diminta" });
            }

            await existingCartItem.update({ quantity: newQuantity });

            cart = existingCartItem;
        } else {
            // jika item belum ada di cart, tambahkan item baru ke cart
            cart = await CartModel.create({
                user_id: req.user.id,
                variant_id,
                quantity,
            });
        }
        return res.send({
            message: "Added successfully",
            data: cart,
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
const remove = async(req, res, _next) => {
    try {
        const { id } = req.params;

        const cartItem = await CartModel.findOne({
            where: {
                id,
                user_id: req.user.id,
            },
        });

        //melakukan pengecekan terhadap produk yang akan dihapus dari cart berdasarkan id dan user_id dari tabel cart
        if (!cartItem) {
            return res.status(404).send({ message: "Cart item not found" });
        }

        await CartModel.destroy({
            where: {
                id,
                user_id: req.user.id,
            },
        });

        return res.send({
            message: "Item removed from cart successfully",
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
const update = async(req, res, _next) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).send({ message: "Quantity must be greater than 0" });
        }

        const cartItem = await CartModel.findOne({
            where: {
                id,
                user_id: req.user.id,
            },
        });

        if (!cartItem) {
            return res.status(404).send({ message: "Cart item not found" });
        }

        const variant = await VariantModel.findOne({
            where: {
                id: cartItem.variant_id,
            },
        });
        // console.log("variant", variant);
        // console.log("cartItem", cartItem);

        if (!variant) {
            return res.status(404).send({ message: "variant not found" });
        }

        //cek stok produk sebelum update
        const stockDifference = quantity - cartItem.quantity;
        if (variant.stock < stockDifference) {
            return res.status(400).send({ message: "Stock tidak mencukupi untuk quantity yang diminta" });
        }

        await cartItem.update({ quantity });

        //update stok produk
        // await variant.update({
        //     stock: variant.stock - stockDifference,
        // });

        return res.send({
            message: "Cart item updated successfully",
            data: cartItem,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }
};

module.exports = { index, create, remove, update };