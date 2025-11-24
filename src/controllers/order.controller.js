const {
    user: UserModel,
    order: OrderModel,
    product: ProductModel,
    variant: VariantModel,
    orderitem: OrderItemModel,
    payment: PaymentModel,
    order_historie: HistoryModel,
    order_data: OrderDataModel
} = require("../models");
const { sequelize } = require('../models');

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */


const index = async(req, res, next) => {
    try {
        let whereCondition = {};

        // Jika user bukan admin, filter berdasarkan user_id
        if (req.user.role !== "admin") {
            whereCondition.user_id = req.user.id;
        }

        const orders = await OrderModel.findAll({
            where: whereCondition, // Gunakan kondisi where yang sudah ditentukan
            include: [{
                    model: UserModel,
                    as: "user",
                    attributes: { exclude: ['password', 'terverifikasi'] }
                },
                {
                    model: PaymentModel,
                    as: "payment",
                },
                {
                    model: OrderDataModel,
                    as: "order_data",
                },
                {
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
                {
                    model: HistoryModel,
                    as: "order_historie",
                }
            ],
        });

        console.log("ordersssssssssssssssssssssssssssssssssssssss", orders);

        // Kumpulkan semua product_id unik
        const allProductIds = [];
        orders.forEach(order => {
            order.orderitem.forEach(item => {
                if (item.variant && item.variant.product) {
                    allProductIds.push(item.variant.product.id);
                }
            });
        });


        const formattedOrders = orders
            .map((order) => {
                // Menghitung total quantity dari orderitem
                const totalQuantity = order.orderitem.reduce((acc, item) => acc + item.quantity, 0);

                return {
                    user_id: order.user_id,
                    order_id: order.id,
                    total: parseFloat(order.total_price),
                    quantity: totalQuantity,
                    order_code: order.order_code,
                    order_date: order.order_date,
                    status: order.status,
                    payment_method: order.payment_method,
                    payment_status: order.payment_status,
                    purchase_receipt_photo: order.purchase_receipt_photo,
                    created_at: order.createdAt,
                    user: order.user,
                    items: order.orderitem.map((item) => {

                        const variantId = item.variant && item.variant.product ? item.variant.product.id : null;
                        return {
                            order_id: item.order_id,
                            quantity: item.quantity,
                            variant_id: item.variant_id,
                            product_id: item.variant ? item.variant.product_id : null,
                            name: item.variant ? item.variant.name : null,
                            img_url: item.variant ? item.variant.img_url : null,
                            price: item.variant ? item.variant.price : null,
                            sku: item.variant ? item.variant.sku : null,
                            stock: item.variant ? item.variant.stock : null,
                            product_name: item.variant && item.variant.product ? item.variant.product.name : null,
                            product_description: item.variant && item.variant.product ? item.variant.product.description : null,
                            product_image_url: item.variant && item.variant.product ? item.variant.product.image_url : null,
                            product_stock: item.variant && item.variant.product ? item.variant.product.stock : null,
                            product_total_sold: item.variant && item.variant.product ? item.variant.product.total_sold : null,
                            product_category: item.variant && item.variant.product ? item.variant.product.category : null,
                            seller_id: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.id : null,
                            seller_name: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.name : null,
                        }
                    }),
                    order_data: order.order_data || [],
                    order_historie: order.order_historie || []
                }
            });


        return res.send({
            message: "Success",
            data: formattedOrders,
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




// Controller untuk membuat order
const create = async(req, res, next) => {
    try {
        const {
            items,
            payment_method,
            wbp_name,
            wbp_room,
            wbp_register_number,
            wbp_sender,
            note,
        } = req.body;
        const currentUser = req.user;

        // Validasi awal
        if (!items || items.length === 0) {
            return res.status(400).send({ message: "Data tidak ditemukan" });
        }

        if (!currentUser || !currentUser.id) {
            return res.status(401).send({ message: "User tidak terautentikasi" });
        }

        if (!wbp_name || !wbp_room || !wbp_sender) {
            return res.status(400).send({ message: "data tidak lengkap" });
        }


        // Ambil produk beserta seller
        const variants = await VariantModel.findAll({
            where: { id: items.map(item => item.variant_id) },
            include: [{
                model: ProductModel,
                as: 'product',
                include: [{
                    model: UserModel,
                    as: 'user',
                    attributes: { exclude: ['password', 'terverifikasi'] },
                }]
            }]
        });



        if (variants.length !== items.length) {
            return res.status(400).send({ message: "Satu atau lebih produk tidak ditemukan" });
        }

        // Generate order code
        const code = "01" + Math.floor(Math.random() * 1000000);



        // Buat order
        const newOrder = await OrderModel.create({
            user_id: currentUser.id,
            order_date: new Date(),
            payment_method,
            order_code: code,
        });

        // Hitung total harga
        let totalPrice = 0;
        let totalItems = 0;
        const orderItems = items.map((item) => {
            const variant = variants.find((b) => b.id === item.variant_id);
            const subtotal = variant.price * item.quantity;
            totalPrice += subtotal;
            totalItems += item.quantity;
            return {
                order_id: newOrder.id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: variant.price,
                total: subtotal,
            };
        });

        await OrderItemModel.bulkCreate(orderItems);

        await OrderModel.update({
            total_price: totalPrice,
            status: "process",
        }, {
            where: { id: newOrder.id },
        });

        await OrderDataModel.create({
            order_id: newOrder.id,
            wbp_name,
            wbp_name,
            wbp_room,
            wbp_register_number,
            wbp_sender,
            note,
        });


        // Response ke client
        return res.send({
            message: "Success",
            data: {
                order_id: newOrder.id,
                order_code: newOrder.order_code,
                total_price: totalPrice,
                items: orderItems,
            },
        });


    } catch (error) {
        console.error('Error in order creation:', error);
        return res.status(400).send({ message: error.message });
    }
};


/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const getOrderById = async(req, res, next) => {
    try {
        const { orderId } = req.params;

        // Temukan order berdasarkanorder_id
        const order = await OrderModel.findByPk(orderId, {
            include: [{
                    model: UserModel,
                    as: "user",
                },

                {
                    model: PaymentModel,
                    as: "payment",
                },
                {
                    model: HistoryModel,
                    as: "order_historie",
                },
                {
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
            ],
        });

        // Jika order tidak ditemukan
        if (!order) {
            return res.status(404).send({ message: "Order not found" });
        }


        // Format data order untuk dikembalikan
        const totalQuantity = order.orderitem.reduce((acc, item) => acc + item.quantity, 0);

        const formattedOrder = {
            id: order.id,
            user_id: order.user_id,
            order_id: order.id,
            total: parseFloat(order.total_price),
            quantity: totalQuantity,
            status: order.status,
            order_code: order.order_code,
            order_date: order.order_date,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            created_at: order.created_at,
            customer: order.user,
            order_history: order.order_historie.map((history) => ({
                id: history.id,
                order_id: history.order_id,
                user_id: history.user_id,
                status: history.status,
                note: history.note,
                created_at: history.createdAt,
            })),
            items: order.orderitem
                .map((item) => ({
                    order_id: item.order_id,
                    quantity: item.quantity,
                    variant_id: item.variant_id,
                    product_id: item.variant ? item.variant.product_id : null,
                    name: item.variant ? item.variant.name : null,
                    img_url: item.variant ? item.variant.img_url : null,
                    price: item.variant ? item.variant.price : null,
                    sku: item.variant ? item.variant.sku : null,
                    stock: item.variant ? item.variant.stock : null,
                    product_name: item.variant && item.variant.product ? item.variant.product.name : null,
                    product_description: item.variant && item.variant.product ? item.variant.product.description : null,
                    product_image_url: item.variant && item.variant.product ? item.variant.product.image_url : null,
                    product_stock: item.variant && item.variant.product ? item.variant.product.stock : null,
                    product_total_sold: item.variant && item.variant.product ? item.variant.product.total_sold : null,
                    product_category: item.variant && item.variant.product ? item.variant.product.category : null,
                    seller_id: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.id : null,
                    seller_name: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.name : null,

                })),
        };

        return res.send({
            message: "Success",
            data: formattedOrder,
        });
    } catch (error) {
        next(error);
    }
};

const updateStatus = async(req, res, next) => {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const currentUser = req.user;

    // Validasi input
    if (!orderId) {
        return res.status(400).send({ message: "Order ID is required" });
    }

    if (!status) {
        return res.status(400).send({ message: "Status is required" });
    }

    try {
        // Gunakan transaction dengan auto-commit/rollback
        const result = await sequelize.transaction(async(transaction) => {
            // 1. Cari order berdasarkan orderId
            const order = await OrderModel.findByPk(orderId, {
                include: [{
                        model: UserModel,
                        as: "user",
                    },
                    {
                        model: PaymentModel,
                        as: "payment",
                    },
                    {
                        model: HistoryModel,
                        as: "order_historie", // <- UBAH DI SINI: "order" menjadi "order_historie"
                    },
                    {
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
                                    as: "user",
                                }]
                            }]
                        }],
                    },
                ],
                transaction
            });

            if (!order) {
                throw new Error("Order not found");
            }

            // 2. Cek jika order sudah dibatalkan
            if (order.status === "cancelled") {
                throw new Error("Order has been cancelled");
            }

            // 3. Validasi status yang diizinkan
            const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
            if (!allowedStatuses.includes(status)) {
                throw new Error("Invalid status value");
            }

            // 4. Siapkan data untuk diupdate
            const updateData = { status };

            // Jika purchase_receipt_photo diupload, tambahkan ke updateData
            if (req.files && req.files.purchase_receipt_photo) {
                updateData.purchase_receipt_photo = req.files.purchase_receipt_photo[0].path;
            }

            // Jika delivery_receipt_photo diupload, tambahkan ke updateData
            if (req.files && req.files.delivery_receipt_photo) {
                updateData.delivery_receipt_photo = req.files.delivery_receipt_photo[0].path;
            }

            // 5. Update status order dan path foto (jika ada)
            const [affectedRows] = await OrderModel.update(
                updateData, {
                    where: { id: orderId },
                    transaction
                }
            );

            // Cek jika update berhasil
            if (affectedRows === 0) {
                throw new Error("Failed to update order status");
            }

            // 6. Simpan history perubahan status
            await HistoryModel.create({
                order_id: orderId,
                user_id: currentUser.id,
                status,
                note: note || `Order status changed to ${status}`,
            }, { transaction });

            // Return data untuk response - juga perbaiki di sini
            const updatedOrder = await OrderModel.findByPk(orderId, {
                include: [{
                    model: HistoryModel,
                    as: "order_historie" // <- UBAH DI SINI JUGA
                }]
            });

            return updatedOrder;
        });

        return res.send({
            message: "Order status updated successfully",
            data: result
        });

    } catch (error) {
        console.error("Error updating order status:", error);

        // Handle specific errors
        if (error.message === "Order not found") {
            return res.status(404).send({ message: error.message });
        }
        if (error.message === "Order has been cancelled") {
            return res.status(403).send({ message: error.message });
        }
        if (error.message === "Invalid status value") {
            return res.status(400).send({ message: error.message });
        }
        if (error.message === "Failed to update order status") {
            return res.status(500).send({ message: error.message });
        }

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).send({
                message: "Validation error",
                errors: error.errors
            });
        }

        next(error);
    }
};

const cancelOrder = async(req, res, next) => {
    const { orderId } = req.params;

    try {
        const order = await OrderModel.findByPk(orderId, {
            include: {
                model: OrderItemModel,
                as: 'orderitem'
            }
        });

        if (!order) {
            return res.status(404).send({ message: "Orderan tidak ditemukan" });
        }


        if (order.status === "cancelled") {
            return res.status(400).send({ message: "Orderan sudah dibatalkan" });
        }

        const orderItem = order.orderitem;

        for (const item of orderItem) {
            const variant = await VariantModel.findByPk(item.variant_id);

            if (!variant) {
                return res.status(404).send({ message: `Produk dengan ID ${item.variant_id} tidak ditemukan` });
            }

            variant.stock += item.quantity;
            await variant.save();
        }

        await OrderModel.update({ status: "cancelled", payment_status: "cancelled" }, { where: { id: orderId } });

        // Periksa apakah pembaruan berhasil
        const updatedOrder = await OrderModel.findByPk(orderId);

        return res.send({ message: "Order cancelled successfully" });
    } catch (error) {
        next(error);
    }
};



module.exports = { index, create, getOrderById, cancelOrder, updateStatus };