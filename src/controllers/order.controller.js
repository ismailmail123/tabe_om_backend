const {
    user: UserModel,
    order: OrderModel,
    product: ProductModel,
    variant: VariantModel,
    orderitem: OrderItemModel,
    payment: PaymentModel,
    order_historie: HistoryModel,
    order_data: OrderDataModel,
    order_historie: OrderHistoryModel
} = require("../models");
const { sequelize } = require('../models');
const crypto = require('crypto');
const midtransClient = require("midtrans-client");

const Pusher = require('pusher');

// Konfigurasi Pusher
const pusher = new Pusher({
    appId: "1948721",
    key: process.env.PUSHER_KEY, // Pastikan ini sesuai dengan .env
    secret: process.env.PUSHER_SECRET, // Pastikan ini sesuai dengan .env
    cluster: "ap1",
    useTLS: true
});

// Konfigurasi Midtrans
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY, // Pastikan ini sesuai dengan .env
    clientKey: process.env.MIDTRANS_CLIENT_KEY // Pastikan ini sesuai dengan .env
});



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
// const create = async(req, res, next) => {
//     try {
//         const {
//             items,
//             payment_method,
//             wbp_name,
//             wbp_room,
//             wbp_register_number,
//             wbp_sender,
//             note,
//         } = req.body;
//         const currentUser = req.user;

//         // Validasi awal
//         if (!items || items.length === 0) {
//             return res.status(400).send({ message: "Data tidak ditemukan" });
//         }

//         if (!currentUser || !currentUser.id) {
//             return res.status(401).send({ message: "User tidak terautentikasi" });
//         }

//         if (!wbp_name || !wbp_room || !wbp_sender) {
//             return res.status(400).send({ message: "data tidak lengkap" });
//         }


//         // Ambil produk beserta seller
//         const variants = await VariantModel.findAll({
//             where: { id: items.map(item => item.variant_id) },
//             include: [{
//                 model: ProductModel,
//                 as: 'product',
//                 include: [{
//                     model: UserModel,
//                     as: 'user',
//                     attributes: { exclude: ['password', 'terverifikasi'] },
//                 }]
//             }]
//         });



//         if (variants.length !== items.length) {
//             return res.status(400).send({ message: "Satu atau lebih produk tidak ditemukan" });
//         }

//         // Generate order code
//         const code = "01" + Math.floor(Math.random() * 1000000);



//         // Buat order
//         const newOrder = await OrderModel.create({
//             user_id: currentUser.id,
//             order_date: new Date(),
//             payment_method,
//             order_code: code,
//         });

//         // Hitung total harga
//         let totalPrice = 0;
//         let totalItems = 0;
//         const orderItems = items.map((item) => {
//             const variant = variants.find((b) => b.id === item.variant_id);
//             const subtotal = variant.price * item.quantity;
//             totalPrice += subtotal;
//             totalItems += item.quantity;
//             return {
//                 order_id: newOrder.id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: variant.price,
//                 total: subtotal,
//             };
//         });

//         await OrderItemModel.bulkCreate(orderItems);

//         await OrderModel.update({
//             total_price: totalPrice,
//             status: "pending",
//         }, {
//             where: { id: newOrder.id },
//         });

//         await OrderDataModel.create({
//             order_id: newOrder.id,
//             wbp_name,
//             wbp_name,
//             wbp_room,
//             wbp_register_number,
//             wbp_sender,
//             note,
//         });


//         // Response ke client
//         return res.send({
//             message: "Success",
//             data: {
//                 order_id: newOrder.id,
//                 order_code: newOrder.order_code,
//                 total_price: totalPrice,
//                 items: orderItems,
//             },
//         });


//     } catch (error) {
//         console.error('Error in order creation:', error);
//         return res.status(400).send({ message: error.message });
//     }
// };

//!dengan midtrans

// const create = async(req, res, next) => {
//     const transaction = await sequelize.transaction();
//     try {
//         const {
//             items,
//             payment_method,
//             wbp_name,
//             wbp_room,
//             wbp_register_number,
//             wbp_sender,
//             note,
//         } = req.body;
//         const currentUser = req.user;

//         // Validasi awal
//         if (!items || items.length === 0) {
//             await transaction.rollback();
//             return res.status(400).send({ message: "Data tidak ditemukan" });
//         }

//         if (!currentUser || !currentUser.id) {
//             await transaction.rollback();
//             return res.status(401).send({ message: "User tidak terautentikasi" });
//         }

//         if (!wbp_name || !wbp_room || !wbp_sender) {
//             await transaction.rollback();
//             return res.status(400).send({ message: "data tidak lengkap" });
//         }

//         // Validasi payment method
//         if (!payment_method || !['COD', 'transfer'].includes(payment_method)) {
//             await transaction.rollback();
//             return res.status(400).json({ message: "Metode pembayaran tidak valid" });
//         }

//         // Ambil produk beserta seller
//         const variants = await VariantModel.findAll({
//             where: { id: items.map(item => item.variant_id) },
//             include: [{
//                 model: ProductModel,
//                 as: 'product',
//                 include: [{
//                     model: UserModel,
//                     as: 'user',
//                     attributes: { exclude: ['password', 'terverifikasi'] },
//                 }]
//             }],
//             transaction
//         });

//         if (variants.length !== items.length) {
//             await transaction.rollback();
//             return res.status(400).send({ message: "Satu atau lebih produk tidak ditemukan" });
//         }

//         // Generate order code
//         const code = "01" + Math.floor(Math.random() * 1000000);

//         // Buat order
//         const newOrder = await OrderModel.create({
//             user_id: currentUser.id,
//             order_date: new Date(),
//             payment_method,
//             order_code: code,
//             total_price: 0, // akan diupdate nanti
//             status: "pending",
//         }, { transaction });

//         // Hitung total harga dan buat order items
//         let totalPrice = 0;
//         let totalItems = 0;
//         const orderItems = items.map((item) => {
//             const variant = variants.find((b) => b.id === item.variant_id);
//             const subtotal = variant.price * item.quantity;
//             totalPrice += subtotal;
//             totalItems += item.quantity;
//             return {
//                 order_id: newOrder.id,
//                 variant_id: item.variant_id,
//                 quantity: item.quantity,
//                 price: variant.price,
//                 total: subtotal,
//             };
//         });

//         await OrderItemModel.bulkCreate(orderItems, { transaction });
//         await OrderModel.update({
//             total_price: totalPrice,
//         }, {
//             where: { id: newOrder.id },
//             transaction
//         });

//         await OrderDataModel.create({
//             order_id: newOrder.id,
//             wbp_name,
//             wbp_room,
//             wbp_register_number,
//             wbp_sender,
//             note,
//         }, { transaction });

//         // PROSES PEMBAYARAN OTOMATIS
//         const amount = parseFloat(totalPrice);

//         // Determine initial status based on payment method
//         const initial_payment_status = payment_method === 'COD' ? 'completed' : 'pending';
//         const initial_order_status = payment_method === 'COD' ? 'process' : 'pending';

//         // Create initial order history
//         await OrderHistoryModel.create({
//             order_id: newOrder.id,
//             user_id: currentUser.id,
//             status: initial_order_status,
//             note: payment_method === 'COD' ?
//                 'Pembayaran COD - Bayar saat barang diterima' : 'Menunggu pembayaran transfer'
//         }, { transaction });

//         // Create payment record
//         const payment = await PaymentModel.create({
//             order_id: newOrder.id,
//             user_id: currentUser.id,
//             payment_method,
//             amount,
//             payment_status: initial_payment_status,
//             payment_date: new Date(),
//         }, { transaction });

//         // Update order status
//         await OrderModel.update({
//             status: initial_order_status,
//             payment_method,
//             payment_status: initial_payment_status
//         }, {
//             where: { id: newOrder.id },
//             transaction
//         });

//         // Process based on payment method
//         let paymentResponse = null;

//         if (payment_method === 'transfer') {
//             // Create Midtrans transaction
//             const parameter = {
//                 transaction_details: {
//                     order_id: `PAYMENT-${payment.id}`,
//                     gross_amount: amount
//                 },
//                 credit_card: { secure: true },
//                 customer_details: {
//                     first_name: currentUser.username,
//                     email: currentUser.email,
//                     phone: currentUser.phone_number
//                 },
//                 callbacks: {
//                     finish: 'http://localhost:3000/orderhistories',
//                     error: 'http://localhost:3000/payment'
//                 }
//             };

//             const midtransTransaction = await snap.createTransaction(parameter);

//             // Update payment dengan midtrans_order_id dan token
//             await payment.update({
//                 midtrans_order_id: parameter.transaction_details.order_id,
//                 midtrans_token: midtransTransaction.token
//             }, { transaction });

//             paymentResponse = {
//                 payment_type: 'transfer',
//                 payment_url: midtransTransaction.redirect_url,
//                 payment_data: payment
//             };

//         } else {
//             // PROSES COD - KURANGI STOK
//             for (const item of orderItems) {
//                 const variant = variants.find(v => v.id === item.variant_id);
//                 if (!variant) continue;

//                 // Kurangi stok variant
//                 await VariantModel.decrement('stock', {
//                     by: item.quantity,
//                     where: { id: variant.id },
//                     transaction
//                 });

//                 // Update product stock dan total sold
//                 if (variant.product) {
//                     await ProductModel.decrement('stock', {
//                         by: item.quantity,
//                         where: { id: variant.product.id },
//                         transaction
//                     });

//                     await ProductModel.increment('total_sold', {
//                         by: item.quantity,
//                         where: { id: variant.product.id },
//                         transaction
//                     });
//                 }
//             }

//             // Prepare items data for Pusher
//             const pusherItems = orderItems.map(item => {
//                 const variant = variants.find(v => v.id === item.variant_id);
//                 return {
//                     product_id: variant && variant.product ? variant.product.id : null,
//                     name: variant && variant.product ? variant.product.name : null,
//                     product_description: variant && variant.product ? variant.product.description : null,
//                     image_url: variant && variant.product ? variant.product.image_url : null,
//                     seller_id: variant && variant.product && variant.product.user ? variant.product.user.id : null,
//                     seller_name: variant && variant.product && variant.product.user ? variant.product.user.name : null,
//                     variant_id: variant ? variant.id : null,
//                     variant_name: variant ? variant.name : null,
//                     price: item.price,
//                     quantity: item.quantity
//                 };
//             });

//             const pusherData = {
//                 order_id: newOrder.id,
//                 user_id: currentUser.id,
//                 customer_name: currentUser.name,
//                 payment_method: 'COD',
//                 amount: amount,
//                 status: 'process',
//                 order_date: new Date(),
//                 items: pusherItems
//             };

//             // Kirim ke admin
//             pusher.trigger('admin-channel', 'new-order', pusherData);

//             // Kirim notifikasi ke seller yang terkait
//             const sellerItemsMap = {};
//             orderItems.forEach(item => {
//                 const variant = variants.find(v => v.id === item.variant_id);
//                 const sellerId = variant && variant.product ? variant.product.user_id : null;
//                 if (sellerId) {
//                     if (!sellerItemsMap[sellerId]) {
//                         sellerItemsMap[sellerId] = [];
//                     }
//                     sellerItemsMap[sellerId].push({...item, variant });
//                 }
//             });

//             // Kirim notifikasi ke setiap seller
//             for (const [sellerId, items] of Object.entries(sellerItemsMap)) {
//                 const sellerPusherData = {
//                     order_id: newOrder.id,
//                     user_id: currentUser.id,
//                     customer_name: currentUser.name,
//                     payment_method: 'COD',
//                     amount: items.reduce((total, item) => total + (item.price * item.quantity), 0),
//                     status: 'process',
//                     order_date: new Date(),
//                     items: items.map(item => ({
//                         product_id: item.variant.product.id,
//                         name: item.variant.product.name,
//                         variant_id: item.variant.id,
//                         variant_name: item.variant.name,
//                         price: item.price,
//                         quantity: item.quantity,
//                         img_url: item.variant.product.img_url
//                     }))
//                 };

//                 pusher.trigger(`seller-${sellerId}`, 'new-order', sellerPusherData);
//             }

//             paymentResponse = {
//                 payment_type: 'COD',
//                 message: "Pembayaran COD berhasil diproses",
//                 payment_data: payment
//             };
//         }

//         await transaction.commit();

//         // Response ke client
//         return res.send({
//             message: "Success",
//             data: {
//                 order_id: newOrder.id,
//                 order_code: newOrder.order_code,
//                 total_price: totalPrice,
//                 items: orderItems,
//                 payment: paymentResponse
//             },
//         });

//     } catch (error) {
//         await transaction.rollback();
//         console.error('Error in order creation:', error);
//         return res.status(400).send({ message: error.message });
//     }
// };

//! dengan method payment
const create = async(req, res, next) => {
    const transaction = await sequelize.transaction();
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
            await transaction.rollback();
            return res.status(400).send({ message: "Data tidak ditemukan" });
        }

        if (!currentUser || !currentUser.id) {
            await transaction.rollback();
            return res.status(401).send({ message: "User tidak terautentikasi" });
        }

        if (!wbp_name || !wbp_room || !wbp_sender) {
            await transaction.rollback();
            return res.status(400).send({ message: "data tidak lengkap" });
        }

        // Validasi payment method
        if (!payment_method || !['COD', 'transfer', 'virtual_account', 'qris'].includes(payment_method)) {
            await transaction.rollback();
            return res.status(400).json({ message: "Metode pembayaran tidak valid" });
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
            }],
            transaction
        });

        if (variants.length !== items.length) {
            await transaction.rollback();
            return res.status(400).send({ message: "Satu atau lebih produk tidak ditemukan" });
        }

        // Generate order code
        const code = "01" + Math.floor(Math.random() * 1000000);

        // Hitung subtotal terlebih dahulu
        let subtotal = 0;
        let totalItems = 0;

        // Hitung subtotal tanpa membuat orderItems dulu
        items.forEach((item) => {
            const variant = variants.find((b) => b.id === item.variant_id);
            const itemSubtotal = variant.price * item.quantity;
            subtotal += itemSubtotal;
            totalItems += item.quantity;
        });

        // HITUNG BIAYA ADMIN BERDASARKAN METODE PEMBAYARAN
        let adminFee = 0;
        if (payment_method === 'virtual_account' || payment_method === 'transfer') {
            adminFee = 5000; // Flat Rp 5.000 untuk virtual account dan transfer
        } else if (payment_method === 'qris') {
            adminFee = Math.round(subtotal * 0.01); // 1% dari subtotal untuk QRIS
        }
        // COD tidak ada biaya admin

        const totalPrice = subtotal + adminFee;

        // Buat order TERLEBIH DAHULU
        const newOrder = await OrderModel.create({
            user_id: currentUser.id,
            order_date: new Date(),
            payment_method,
            order_code: code,
            total_price: totalPrice,
            admin_fee: adminFee, // Simpan biaya admin
            subtotal: subtotal, // Simpan subtotal
            status: "pending",
        }, { transaction });

        // SEKARANG buat orderItems setelah newOrder ada
        const orderItems = items.map((item) => {
            const variant = variants.find((b) => b.id === item.variant_id);
            const itemSubtotal = variant.price * item.quantity;
            return {
                order_id: newOrder.id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: variant.price,
                total: itemSubtotal,
            };
        });

        await OrderItemModel.bulkCreate(orderItems, { transaction });

        await OrderDataModel.create({
            order_id: newOrder.id,
            wbp_name,
            wbp_room,
            wbp_register_number,
            wbp_sender,
            note,
        }, { transaction });

        // PROSES PEMBAYARAN OTOMATIS
        const amount = parseFloat(totalPrice);

        // Determine initial status based on payment method
        const initial_payment_status = payment_method === 'COD' ? 'completed' : 'pending';
        const initial_order_status = payment_method === 'COD' ? 'process' : 'pending';

        // Create initial order history
        let historyNote = '';
        if (payment_method === 'COD') {
            historyNote = 'Pembayaran COD - Bayar saat barang diterima';
        } else if (payment_method === 'transfer') {
            historyNote = 'Menunggu pembayaran transfer (+Rp 5.000 biaya admin)';
        } else if (payment_method === 'virtual_account') {
            historyNote = 'Menunggu pembayaran virtual account (+Rp 5.000 biaya admin)';
        } else if (payment_method === 'qris') {
            historyNote = `Menunggu pembayaran QRIS (+${adminFee.toLocaleString('id-ID')} biaya admin 1%)`;
        }

        await OrderHistoryModel.create({
            order_id: newOrder.id,
            user_id: currentUser.id,
            status: initial_order_status,
            note: historyNote
        }, { transaction });

        // Create payment record
        const payment = await PaymentModel.create({
            order_id: newOrder.id,
            user_id: currentUser.id,
            payment_method,
            amount,
            admin_fee: adminFee,
            subtotal: subtotal,
            payment_status: initial_payment_status,
            payment_date: new Date(),
        }, { transaction });

        // Update order status
        await OrderModel.update({
            status: initial_order_status,
            payment_method,
            payment_status: initial_payment_status
        }, {
            where: { id: newOrder.id },
            transaction
        });

        // Process based on payment method
        let paymentResponse = null;

        if (payment_method === 'transfer' || payment_method === 'virtual_account' || payment_method === 'qris') {
            // TENTUKAN ENABLED PAYMENTS BERDASARKAN METODE YANG DIPILIH
            let enabled_payments = [];

            if (payment_method === 'virtual_account') {
                // Untuk Virtual Account - hanya tampilkan bank transfer
                enabled_payments = ['bank_transfer'];
            } else if (payment_method === 'qris') {
                // Untuk QRIS - gunakan qris payment method
                enabled_payments = ['qris'];
            } else if (payment_method === 'transfer') {
                // Untuk transfer biasa - tampilkan semua
                enabled_payments = ['bank_transfer', 'qris'];
            }

            // Parameter dasar Midtrans
            const parameter = {
                transaction_details: {
                    order_id: `PAYMENT-${payment.id}-${Date.now()}`,
                    gross_amount: amount
                },
                enabled_payments: enabled_payments, // Gunakan variabel enabled_payments yang sudah ditentukan
                customer_details: {
                    first_name: currentUser.username || 'Customer',
                    email: currentUser.email || '',
                    phone: currentUser.phone_number || ''
                },
                callbacks: {
                    finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orderhistories`,
                    error: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment`,
                    pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment`
                }
            };

            // Jika virtual account, tambahkan bank transfer specific parameters
            if (payment_method === 'virtual_account') {
                parameter.bank_transfer = {
                    bank: "bca", // atau bank lain sesuai kebutuhan
                    free_text: {
                        inquiry: [{
                            id: "Silakan transfer ke Virtual Account",
                            en: "Please transfer to Virtual Account"
                        }],
                        payment: [{
                            id: "Terima kasih telah membayar dengan Virtual Account",
                            en: "Thank you for paying with Virtual Account"
                        }]
                    }
                };
            }

            // Jika QRIS, tambahkan QRIS specific parameters
            if (payment_method === 'qris') {
                parameter.qris = {
                    acquirer: "gopay" // atau shopee, linkaja, dll
                };
            }

            console.log('Midtrans Parameters:', JSON.stringify(parameter, null, 2));
            console.log('Payment Details:', {
                subtotal: subtotal,
                admin_fee: adminFee,
                total_amount: amount,
                payment_method: payment_method
            });

            const midtransTransaction = await snap.createTransaction(parameter);

            // Update payment dengan midtrans_order_id dan token
            await payment.update({
                midtrans_order_id: parameter.transaction_details.order_id,
                midtrans_token: midtransTransaction.token,
                midtrans_redirect_url: midtransTransaction.redirect_url
            }, { transaction });

            paymentResponse = {
                payment_type: payment_method,
                payment_url: midtransTransaction.redirect_url,
                payment_data: payment,
                fee_details: {
                    subtotal: subtotal,
                    admin_fee: adminFee,
                    total: amount
                }
            };

        } else {
            // PROSES COD - KURANGI STOK
            for (const item of orderItems) {
                const variant = variants.find(v => v.id === item.variant_id);
                if (!variant) continue;

                // Kurangi stok variant
                await VariantModel.decrement('stock', {
                    by: item.quantity,
                    where: { id: variant.id },
                    transaction
                });

                // Update product stock dan total sold
                if (variant.product) {
                    await ProductModel.decrement('stock', {
                        by: item.quantity,
                        where: { id: variant.product.id },
                        transaction
                    });

                    await ProductModel.increment('total_sold', {
                        by: item.quantity,
                        where: { id: variant.product.id },
                        transaction
                    });
                }
            }

            // Prepare items data for Pusher
            const pusherItems = orderItems.map(item => {
                const variant = variants.find(v => v.id === item.variant_id);
                return {
                    product_id: variant && variant.product ? variant.product.id : null,
                    name: variant && variant.product ? variant.product.name : null,
                    product_description: variant && variant.product ? variant.product.description : null,
                    image_url: variant && variant.product ? variant.product.image_url : null,
                    seller_id: variant && variant.product && variant.product.user ? variant.product.user.id : null,
                    seller_name: variant && variant.product && variant.product.user ? variant.product.user.name : null,
                    variant_id: variant ? variant.id : null,
                    variant_name: variant ? variant.name : null,
                    price: item.price,
                    quantity: item.quantity
                };
            });

            const pusherData = {
                order_id: newOrder.id,
                user_id: currentUser.id,
                customer_name: currentUser.name,
                payment_method: 'COD',
                amount: amount,
                subtotal: subtotal,
                admin_fee: adminFee,
                status: 'process',
                order_date: new Date(),
                items: pusherItems
            };

            // Kirim ke admin
            pusher.trigger('admin-channel', 'new-order', pusherData);

            // Kirim notifikasi ke seller yang terkait
            const sellerItemsMap = {};
            orderItems.forEach(item => {
                const variant = variants.find(v => v.id === item.variant_id);
                const sellerId = variant && variant.product ? variant.product.user_id : null;
                if (sellerId) {
                    if (!sellerItemsMap[sellerId]) {
                        sellerItemsMap[sellerId] = [];
                    }
                    sellerItemsMap[sellerId].push({...item, variant });
                }
            });

            // Kirim notifikasi ke setiap seller
            for (const [sellerId, items] of Object.entries(sellerItemsMap)) {
                const sellerPusherData = {
                    order_id: newOrder.id,
                    user_id: currentUser.id,
                    customer_name: currentUser.name,
                    payment_method: 'COD',
                    amount: items.reduce((total, item) => total + (item.price * item.quantity), 0),
                    status: 'process',
                    order_date: new Date(),
                    items: items.map(item => ({
                        product_id: item.variant.product.id,
                        name: item.variant.product.name,
                        variant_id: item.variant.id,
                        variant_name: item.variant.name,
                        price: item.price,
                        quantity: item.quantity,
                        img_url: item.variant.product.img_url
                    }))
                };

                pusher.trigger(`seller-${sellerId}`, 'new-order', sellerPusherData);
            }

            paymentResponse = {
                payment_type: 'COD',
                message: "Pembayaran COD berhasil diproses",
                payment_data: payment,
                fee_details: {
                    subtotal: subtotal,
                    admin_fee: adminFee,
                    total: amount
                }
            };
        }

        await transaction.commit();

        // Response ke client
        return res.send({
            message: "Success",
            data: {
                order_id: newOrder.id,
                order_code: newOrder.order_code,
                subtotal: subtotal,
                admin_fee: adminFee,
                total_price: totalPrice,
                items: orderItems,
                payment: paymentResponse
            },
        });

    } catch (error) {
        await transaction.rollback();
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
            const allowedStatuses = ['pending', 'process', 'completed', 'cancelled'];
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