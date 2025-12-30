const {
    payment: PaymentModel,
    order: OrderModel,
    orderitem: OrderItemModel,
    product: ProductModel,
    variant: VariantModel,
    order_historie: OrderHistoryModel,
    user: UserModel,
    order_data: OrderDataModel,
    order_history: HistoryModel,
    sequelize,
} = require("../models");
const crypto = require('crypto');
const midtransClient = require("midtrans-client");
const nodemailer = require("nodemailer");

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

const sendNotificationPayment = async(order, payment_proof_path) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    // Format total harga ke Rupiah
    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Format tanggal
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notifikasi Pembayaran Baru</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            body {
                background-color: #f5f7fa;
                padding: 20px;
            }
            
            .email-container {
                max-width: 700px;
                margin: 0 auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            }
            
            .email-header {
                background: linear-gradient(135deg, #4a6ee0 0%, #6a4aa2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .email-header h1 {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 10px;
                letter-spacing: 0.5px;
            }
            
            .email-header p {
                font-size: 16px;
                opacity: 0.9;
                font-weight: 300;
            }
            
            .email-body {
                background-color: white;
                padding: 40px;
            }
            
            .notification-badge {
                display: inline-block;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 8px 20px;
                border-radius: 30px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 30px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .order-info {
                background: #f8f9ff;
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border-left: 5px solid #667eea;
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
            }
            
            .order-info h2 {
                color: #333;
                font-size: 22px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .order-info h2:before {
                content: "📦";
                font-size: 20px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            
            .info-item {
                background: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
                border: 1px solid #eef1ff;
            }
            
            .info-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
                font-weight: 600;
            }
            
            .info-value {
                font-size: 18px;
                color: #333;
                font-weight: 600;
            }
            
            .highlight-value {
                color: #667eea;
                font-size: 20px;
            }
            
            .wbp-details {
                background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
                border-radius: 15px;
                padding: 25px;
                margin-top: 30px;
            }
            
            .wbp-details h3 {
                color: #333;
                font-size: 20px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .wbp-details h3:before {
                content: "👤";
                font-size: 18px;
            }
            
            .wbp-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .wbp-item {
                background: rgba(255, 255, 255, 0.9);
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
            }
            
            .status-badge {
                display: inline-block;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-top: 20px;
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            
            .payment-status {
                background: #ffd8d8;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .footer-note {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .action-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 30px;
                font-weight: 600;
                font-size: 16px;
                margin-top: 30px;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .action-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
            }
            
            .logo {
                font-size: 24px;
                font-weight: 700;
                color: white;
                margin-bottom: 20px;
                display: inline-block;
            }
            
            @media (max-width: 600px) {
                .email-body {
                    padding: 25px;
                }
                
                .info-grid, .wbp-grid {
                    grid-template-columns: 1fr;
                }
                
                .email-header {
                    padding: 30px 20px;
                }
                
                .email-header h1 {
                    font-size: 26px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <div class="logo">Layanan WBP</div>
                <h1>📬 Notifikasi Pembayaran Baru</h1>
                <p>Pesanan baru memerlukan konfirmasi pembayaran</p>
            </div>
            
            <div class="email-body">
                <div class="notification-badge">Pembayaran Menunggu</div>
                
                <div class="order-info">
                    <h2>Detail Pesanan</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Order ID</div>
                            <div class="info-value">${order.id}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Kode Pesanan</div>
                            <div class="info-value">#${order.order_code}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Total Pembayaran</div>
                            <div class="info-value highlight-value">${formatRupiah(order.total_price)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Tanggal Pesanan</div>
                            <div class="info-value">${formatDate(order.createdAt)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Bukti Pembayaran</div>
                            <img src=${payment_proof_path} alt="Bukti Pembayaran" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"/>
                        </div>
                    </div>
                </div>
                
                <div class="wbp-details">
                    <h3>Informasi WBP (Warga Binaan Pemasyarakatan)</h3>
                    <div class="wbp-grid">
                        <div class="wbp-item">
                            <div class="info-label">Nama WBP</div>
                            <div class="info-value">${order.order_data[0].wbp_name}</div>
                        </div>
                        <div class="wbp-item">
                            <div class="info-label">Nomor Register</div>
                            <div class="info-value">${order.order_data[0].wbp_register_number}</div>
                        </div>
                        <div class="wbp-item">
                            <div class="info-label">Ruang / Sel</div>
                            <div class="info-value">${order.order_data[0].wbp_room}</div>
                        </div>
                        <div class="wbp-item">
                            <div class="info-label">Pengirim</div>
                            <div class="info-value">${order.order_data[0].wbp_sender}</div>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <div class="status-badge">Status Pesanan: ${order.status}</div>
                    <div class="status-badge payment-status" style="margin-left: 10px;">
                        Status Pembayaran: ${order.payment_status}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="#" class="action-button">Lihat Detail Lengkap</a>
                </div>
                
                <div class="footer-note">
                    <p><strong>Segera lakukan verifikasi pembayaran untuk melanjutkan proses pesanan.</strong></p>
                    <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
                    <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                        © ${new Date().getFullYear()} Layanan WBP. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: 'ismailbary2@gmail.com',
        subject: `[Aksi Diperlukan] Notifikasi Pembayaran Baru - Order #${order.order_code}`,
        html: htmlContent,
        text: `Pembayaran Baru Menunggu Verifikasi\n\nOrder ID: ${order.order_id}\nKode Pesanan: ${order.order_code}\nTotal: ${formatRupiah(order.total)}\nNama WBP: ${order.order_data[0].wbp_name}\nPengirim: ${order.order_data[0].wbp_sender}\nRuang: ${order.order_data[0].wbp_room}\nNomor Register: ${order.order_data[0].wbp_register_number}\n\nSegera verifikasi pembayaran melalui dashboard admin.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email notifikasi pembayaran berhasil dikirim ke ismailbary2@gmail.com`);
    } catch (error) {
        console.error('Error sending payment notification email:', error);
        throw error;
    }
};


/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 */

const index = async(req, res, _next) => {
    try {
        const currentUser = req.user;


        let payments;


        payments = await PaymentModel.findAll({
            include: [{
                model: OrderModel,
                as: "order",

            }, ],
        });


        return res.send({
            message: "Success",
            data: payments,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ message: "Internal Server Error" });
    }

};
// ! dengan midtrans
// const createPayment = async(req, res) => {
//     try {
//         const { order_id } = req.params;
//         const currentUser = req.user;
//         const { payment_method } = req.body;


//         // Input validation
//         if (!order_id) {
//             return res.status(400).json({ message: "Order ID wajib diisi" });
//         }

//         if (!payment_method || !['COD', 'transfer'].includes(payment_method)) {
//             return res.status(400).json({ message: "Metode pembayaran tidak valid" });
//         }

//         const order = await OrderModel.findOne({
//             where: { id: order_id },
//         });

//         const amount = parseFloat(order.total_price);

//         if (!order) {
//             return res.status(404).json({ message: "Order tidak ditemukan" });
//         }


//         // Determine initial status based on payment method
//         const initial_payment_status = payment_method === 'COD' ? 'completed' : 'pending';
//         const initial_order_status = payment_method === 'COD' ? 'process' : 'pending';

//         // Create initial order history
//         await OrderHistoryModel.create({
//             order_id,
//             user_id: currentUser.id,
//             status: initial_order_status,
//             note: payment_method === 'COD' ?
//                 'Pembayaran COD - Bayar saat barang diterima' : 'Menunggu pembayaran transfer'
//         });

//         // Create payment record
//         const payment = await PaymentModel.create({
//             order_id,
//             user_id: currentUser.id,
//             payment_method,
//             amount,
//             payment_status: initial_payment_status,
//             payment_date: new Date(),
//             // midtrans_order_id: parameter.transaction_details.order_id
//         });

//         // Update order status
//         await OrderModel.update({
//             status: initial_order_status,
//             payment_method,
//             payment_status: initial_payment_status
//         }, { where: { id: order_id } });

//         // Process based on payment method
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
//             });


//             return res.status(201).json({
//                 message: "Silakan lanjutkan pembayaran",
//                 payment_url: midtransTransaction.redirect_url,
//                 payment_data: payment
//             });
//         } else {


//             // PROSES COD - KURANGI STOK
//             const orderItems = await OrderItemModel.findAll({
//                 where: { order_id },
//                 include: [{
//                     model: VariantModel,
//                     as: 'variant',
//                     include: [{
//                         model: ProductModel,
//                         as: 'product'
//                     }]
//                 }]
//             });

//             const orders = await OrderModel.findOne({
//                 where: { id: order_id },
//                 include: [{
//                     model: UserModel,
//                     as: 'user',
//                 }]
//             });



//             // Gunakan transaction untuk COD juga
//             const codTransaction = await sequelize.transaction();

//             try {
//                 for (const item of orderItems) {
//                     if (!item.variant) continue;

//                     // Method 1: Gunakan decrement
//                     await VariantModel.decrement('stock', {
//                         by: item.quantity,
//                         where: { id: item.variant.id },
//                         transaction: codTransaction
//                     });

//                     // Jika perlu update product juga
//                     if (item.variant.product) {
//                         await ProductModel.decrement('stock', {
//                             by: item.quantity,
//                             where: { id: item.variant.product.id },
//                             transaction: codTransaction
//                         });

//                         await ProductModel.increment('total_sold', {
//                             by: item.quantity,
//                             where: { id: item.variant.product.id },
//                             transaction: codTransaction
//                         });
//                     }
//                 }

//                 await codTransaction.commit();
//             } catch (error) {
//                 await codTransaction.rollback();
//                 console.error('Gagal update stok COD:', error);
//                 return res.status(500).json({ message: "Gagal update stok" });
//             }


//             // Prepare items data for Pusher
//             const pusherItems = orderItems.map(item => ({
//                 product_id: item.variant && item.variant.product ? item.variant.product.id : null,
//                 name: item.variant && item.variant.product ? item.variant.product.name : null,
//                 product_description: item.variant && item.variant.product ? item.variant.product.description : null,
//                 image_url: item.variant && item.variant.product ? item.variant.product.image_url : null,
//                 seller_id: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.id : null,
//                 seller_name: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.name : null,
//                 variant_id: item.variant ? item.variant.id : null,
//                 variant_name: item.variant ? item.variant.name : null,
//                 price: item.price,
//                 quantity: item.quantity
//             }));

//             const pusherData = {
//                 order_id: order.id,
//                 user_id: currentUser.id,
//                 customer_name: orders.user.name,
//                 payment_method: 'COD',
//                 amount: amount,
//                 status: 'process',
//                 order_date: new Date(),
//                 distance: shippingInfo.distance,
//                 address: shippingInfo.address,
//                 items: pusherItems
//             };

//             // Kirim ke admin
//             pusher.trigger('admin-channel', 'new-order', pusherData);


//             // Kirim notifikasi ke semua seller yang terkait
//             const sellerItemsMap = {};
//             orderItems.forEach(item => {
//                 const sellerId = item.variant.product.user_id;
//                 if (sellerId) {
//                     if (!sellerItemsMap[sellerId]) {
//                         sellerItemsMap[sellerId] = [];
//                     }
//                     sellerItemsMap[sellerId].push(item);
//                 }
//             });

//             // Kirim notifikasi ke setiap seller
//             for (const [sellerId, items] of Object.entries(sellerItemsMap)) {
//                 const sellerPusherData = {
//                     order_id: order.id,
//                     user_id: currentUser.id,
//                     customer_name: orders.user.name,
//                     payment_method: 'COD',
//                     amount: items.reduce((total, item) => total + (item.price * item.quantity), 0),
//                     status: 'process',
//                     order_date: new Date(),
//                     distance: shippingInfo.distance,
//                     address: shippingInfo.address,
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


//             return res.status(201).json({
//                 message: "Pembayaran COD berhasil diproses",
//                 payment_data: payment
//             });
//         }
//     } catch (error) {
//         console.error('Payment Error:', error);
//         return res.status(500).json({
//             message: "Terjadi kesalahan saat memproses pembayaran",
//             error: error.message
//         });
//     }
// };

// const createPayment = async(req, res) => {
//     try {
//         const { order_id } = req.params;
//         const currentUser = req.user;

//         console.log("ooooooooooooooooooooooooorder id", order_id);

//         // Validasi apakah ada file yang diupload
//         if (!req.files || !req.files.proof_of_payment) {
//             return res.status(400).json({ message: "Bukti pembayaran wajib diunggah" });
//         }

//         const payment_proof_file = req.files.proof_of_payment[0];

//         // Validasi tipe file
//         const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
//         if (!allowedMimeTypes.includes(payment_proof_file.mimetype)) {
//             return res.status(400).json({
//                 message: "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau PDF"
//             });
//         }

//         // Validasi ukuran file (maksimal 5MB)
//         const maxSize = 5 * 1024 * 1024; // 5MB
//         if (payment_proof_file.size > maxSize) {
//             return res.status(400).json({
//                 message: "Ukuran file terlalu besar. Maksimal 5MB"
//             });
//         }

//         // Path file yang sudah diupload
//         const payment_proof_path = payment_proof_file.path;

//         // const payment = await PaymentModel.findOne({
//         //     where: {
//         //         order_id: order_id,
//         //         // user_id: currentUser.id // Pastikan hanya pemilik yang bisa konfirmasi
//         //     },
//         //     include: [{
//         //         model: OrderModel,
//         //         as: 'order'
//         //     }]
//         // });

//         // if (!payment) {
//         //     return res.status(404).json({ message: "Pembayaran tidak ditemukan" });
//         // }

//         // if (payment.payment_status !== 'pending') {
//         //     return res.status(400).json({ message: "Pembayaran sudah dikonfirmasi atau dibatalkan" });
//         // }

//         // Update payment dengan bukti transfer
//         await payment.update({
//             payment_proof: payment_proof_path,
//             payment_status: 'pending_verification',
//             updated_at: new Date()
//         });

//         // Update order status
//         await OrderModel.update({
//             status: 'pending_verification'
//         }, { where: { id: payment.order_id } });

//         // Buat order history
//         await OrderHistoryModel.create({
//             order_id: payment.order_id,
//             user_id: currentUser.id,
//             status: 'pending_verification',
//             note: 'Bukti pembayaran telah diunggah, menunggu verifikasi admin'
//         });

//         // Kirim notifikasi ke admin
//         const orderDetails = await OrderModel.findOne({
//             where: { id: payment.order_id },
//             include: [{
//                 model: UserModel,
//                 as: 'user',
//             }]
//         });

//         const adminPusherData = {
//             order_id: payment.order_id,
//             payment_id: payment.id,
//             customer_name: orderDetails.user.name,
//             amount: payment.amount,
//             payment_proof: payment_proof_path,
//             payment_method: payment.payment_method,
//             payment_code: payment.payment_code,
//             action_required: true,
//             message: 'Bukti pembayaran perlu diverifikasi'
//         };

//         if (pusher) {
//             pusher.trigger('admin-channel', 'payment-proof-uploaded', adminPusherData);
//         }

//         return res.status(200).json({
//             status: "success",
//             message: "Bukti pembayaran berhasil diunggah",
//             data: {
//                 payment: payment,
//                 proof_url: payment_proof_path
//             },
//             next_step: "Menunggu verifikasi admin"
//         });

//     } catch (error) {
//         console.error('Confirm Payment Error:', error);

//         // Handle multer errors
//         if (error.name === 'MulterError') {
//             if (error.code === 'LIMIT_FILE_SIZE') {
//                 return res.status(400).json({
//                     message: "Ukuran file terlalu besar. Maksimal 5MB"
//                 });
//             }
//             return res.status(400).json({
//                 message: "Error uploading file: " + error.message
//             });
//         }

//         return res.status(500).json({
//             status: "error",
//             message: "Terjadi kesalahan saat mengunggah bukti pembayaran",
//             error: error.message
//         });
//     }
// };

const createPayment = async(req, res) => {
    try {
        const { order_id } = req.params;
        const currentUser = req.user;
        // const { payment_method } = req.body;


        // Input validation
        if (!order_id) {
            return res.status(400).json({ message: "Order ID wajib diisi" });
        }

        const order = await OrderModel.findOne({
            where: { id: order_id },
            include: [

                {
                    model: OrderDataModel,
                    as: "order_data",
                },


            ],

        });

        console.log("ooooooooooooooooooooooooorder", order.payment);

        // if (order.payment_method !== 'COD' || order.payment_method !== 'transfer') {
        //     return res.status(400).json({ message: "Metode pembayaran tidak valid" });
        // }

        //         // Validasi apakah ada file yang diupload
        if (!req.files || !req.files.proof_of_payment) {
            return res.status(400).json({ message: "Bukti pembayaran wajib diunggah" });
        }

        const payment_proof_file = req.files.proof_of_payment[0];

        // Validasi tipe file
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedMimeTypes.includes(payment_proof_file.mimetype)) {
            return res.status(400).json({
                message: "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau PDF"
            });
        }

        // Validasi ukuran file (maksimal 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (payment_proof_file.size > maxSize) {
            return res.status(400).json({
                message: "Ukuran file terlalu besar. Maksimal 5MB"
            });
        }

        // Path file yang sudah diupload
        const payment_proof_path = payment_proof_file.path;

        // const order = await OrderModel.findOne({
        //     where: { id: order_id },
        // });

        if (!order) {
            return res.status(404).json({ message: "Order tidak ditemukan" });
        }

        const amount = parseFloat(order.total_price);

        // Determine initial status based on payment method
        const initial_payment_status = order.payment_method === 'COD' ? 'completed' : 'process';
        const initial_order_status = order.payment_method === 'COD' ? 'process' : 'pending';

        // Create initial order history
        await OrderHistoryModel.create({
            order_id,
            user_id: currentUser.id,
            status: initial_order_status,
            note: order.payment_method === 'COD' ?
                'Pembayaran COD - Bayar saat barang diterima' : 'Menunggu pembayaran transfer'
        });

        // Create payment record
        const payment = await PaymentModel.create({
            order_id,
            user_id: currentUser.id,
            payment_method: order.payment_method,
            amount,
            payment_status: initial_payment_status,
            payment_date: new Date(),
            proof_of_payment: payment_proof_path
        });

        // Update order status
        await OrderModel.update({
            status: initial_order_status,
            payment_method: order.payment_method,
            payment_status: initial_payment_status
        }, { where: { id: order_id } });

        // Get order details for Pusher
        const orderItems = await OrderItemModel.findAll({
            where: { order_id },
            include: [{
                model: VariantModel,
                as: 'variant',
                include: [{
                    model: ProductModel,
                    as: 'product'
                }]
            }]
        });

        const orderDetails = await OrderModel.findOne({
            where: { id: order_id },
            include: [{
                model: UserModel,
                as: 'user',
            }]
        });

        // Process based on payment method
        if (order.payment_method === 'transfer') {
            // TRANSFER MANUAL - Tidak perlu Midtrans
            // Kirim notifikasi ke admin untuk verifikasi pembayaran transfer

            await OrderHistoryModel.create({
                order_id,
                user_id: currentUser.id,
                status: 'pending',
                note: 'Bukti pembayaran telah diunggah, menunggu verifikasi admin'
            });

            await sendNotificationPayment(order, payment_proof_path);

            // Prepare items data for Pusher
            const pusherItems = orderItems.map(item => ({
                product_id: item.variant && item.variant.product ? item.variant.product.id : null,
                name: item.variant && item.variant.product ? item.variant.product.name : null,
                product_description: item.variant && item.variant.product ? item.variant.product.description : null,
                image_url: item.variant && item.variant.product ? item.variant.product.image_url : null,
                seller_id: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.id : null,
                seller_name: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.name : null,
                variant_id: item.variant ? item.variant.id : null,
                variant_name: item.variant ? item.variant.name : null,
                price: item.price,
                quantity: item.quantity
            }));

            const pusherData = {
                order_id: order.id,
                user_id: currentUser.id,
                customer_name: orderDetails.user.name,
                customer_email: currentUser.email,
                customer_phone: currentUser.phone_number,
                payment_method: 'transfer',
                payment_status: 'process',
                amount: amount,
                status: 'process',
                order_date: new Date(),
                payment_id: payment.id,
                items: pusherItems,
                note: 'Menunggu verifikasi pembayaran transfer'
            };

            // Kirim ke admin channel untuk notifikasi pembayaran pending
            pusher.trigger('admin-channel', 'pending-payment', pusherData);

            // Kirim notifikasi ke user
            pusher.trigger(`user-${currentUser.id}`, 'payment-pending', {
                message: 'Pembayaran transfer menunggu verifikasi',
                order_id: order.id,
                amount: amount,
                payment_method: 'transfer',
                bank_account: '1234567890 (Bank ABC)', // Informasi rekening bank
                payment_instructions: 'Silakan transfer ke rekening di atas dan unggah bukti transfer'
            });


            return res.status(201).json({
                message: "Pembayaran transfer berhasil diajukan",
                payment_data: payment,
                instructions: {
                    bank_account: '1234567890',
                    bank_name: 'Bank ABC',
                    account_name: 'Nama Toko Anda',
                    amount: amount,
                    note: `Order ID: ${order.id}`
                }
            });


        } else {
            // PROSES COD - KURANGI STOK
            const codTransaction = await sequelize.transaction();

            try {
                for (const item of orderItems) {
                    if (!item.variant) continue;

                    // Kurangi stok variant
                    await VariantModel.decrement('stock', {
                        by: item.quantity,
                        where: { id: item.variant.id },
                        transaction: codTransaction
                    });

                    // Update product stock dan total sold
                    if (item.variant.product) {
                        await ProductModel.decrement('stock', {
                            by: item.quantity,
                            where: { id: item.variant.product.id },
                            transaction: codTransaction
                        });

                        await ProductModel.increment('total_sold', {
                            by: item.quantity,
                            where: { id: item.variant.product.id },
                            transaction: codTransaction
                        });
                    }
                }

                await codTransaction.commit();
            } catch (error) {
                await codTransaction.rollback();
                console.error('Gagal update stok COD:', error);
                return res.status(500).json({ message: "Gagal update stok" });
            }

            // Prepare items data for Pusher untuk COD
            const pusherItems = orderItems.map(item => ({
                product_id: item.variant && item.variant.product ? item.variant.product.id : null,
                name: item.variant && item.variant.product ? item.variant.product.name : null,
                product_description: item.variant && item.variant.product ? item.variant.product.description : null,
                image_url: item.variant && item.variant.product ? item.variant.product.image_url : null,
                seller_id: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.id : null,
                seller_name: item.variant && item.variant.product && item.variant.product.user ? item.variant.product.user.name : null,
                variant_id: item.variant ? item.variant.id : null,
                variant_name: item.variant ? item.variant.name : null,
                price: item.price,
                quantity: item.quantity
            }));

            const pusherData = {
                order_id: order.id,
                user_id: currentUser.id,
                customer_name: orderDetails.user.name,
                payment_method: 'COD',
                payment_status: 'completed',
                amount: amount,
                status: 'process',
                order_date: new Date(),
                items: pusherItems,
                note: 'Pesanan COD siap diproses'
            };

            // Kirim ke admin
            pusher.trigger('admin-channel', 'new-order', pusherData);

            // Kirim notifikasi ke semua seller yang terkait
            const sellerItemsMap = {};
            orderItems.forEach(item => {
                const sellerId = item.variant.product.user_id;
                if (sellerId) {
                    if (!sellerItemsMap[sellerId]) {
                        sellerItemsMap[sellerId] = [];
                    }
                    sellerItemsMap[sellerId].push(item);
                }
            });

            // Kirim notifikasi ke setiap seller
            for (const [sellerId, items] of Object.entries(sellerItemsMap)) {
                const sellerPusherData = {
                    order_id: order.id,
                    user_id: currentUser.id,
                    customer_name: orderDetails.user.name,
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

            // Kirim notifikasi ke user
            pusher.trigger(`user-${currentUser.id}`, 'order-confirmed', {
                message: 'Pesanan COD berhasil dibuat',
                order_id: order.id,
                amount: amount,
                status: 'process'
            });

            return res.status(201).json({
                message: "Pembayaran COD berhasil diproses",
                payment_data: payment
            });
        }
    } catch (error) {
        console.error('Payment Error:', error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat memproses pembayaran",
            error: error.message
        });
    }
};

// Endpoint untuk admin verifikasi pembayaran
const verifyPayment = async(req, res) => {
    try {

        const { order_id, status, note } = req.body; // status: 'completed' atau 'rejected'

        console.log("ooooooooooooooooooooooooooooooooooooooooooooooooooorder id", order_id);

        if (!status || !['completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: "Status verifikasi tidak valid" });
        }

        const payment = await PaymentModel.findOne({
            where: { order_id: order_id },
            include: [{
                model: OrderModel,
                as: 'order'
            }]
        });

        if (!payment) {
            return res.status(404).json({ message: "Pembayaran tidak ditemukan" });
        }

        // Update payment status
        await payment.update({
            payment_status: status,
            verified_at: new Date(),
            verified_by: req.user.name,
        });

        // Update order status berdasarkan hasil verifikasi
        let orderStatus;
        let historyNote;
        if (status === 'completed') {
            orderStatus = 'process';
            historyNote = `Pembayaran telah diverifikasi, pesanan diproses catatan oleh admin: ${note || 'Tidak ada catatan'}`;

            // Kurangi stok untuk transfer yang berhasil
            const orderItems = await OrderItemModel.findAll({
                where: { order_id: payment.order_id },
                include: [{
                    model: VariantModel,
                    as: 'variant',
                    include: [{
                        model: ProductModel,
                        as: 'product'
                    }]
                }]
            });

            const transaction = await sequelize.transaction();
            try {
                for (const item of orderItems) {
                    if (!item.variant) continue;

                    await VariantModel.decrement('stock', {
                        by: item.quantity,
                        where: { id: item.variant.id },
                        transaction: transaction
                    });

                    if (item.variant.product) {
                        await ProductModel.decrement('stock', {
                            by: item.quantity,
                            where: { id: item.variant.product.id },
                            transaction: transaction
                        });

                        await ProductModel.increment('total_sold', {
                            by: item.quantity,
                            where: { id: item.variant.product.id },
                            transaction: transaction
                        });
                    }
                }
                await transaction.commit();
            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } else {
            orderStatus = 'cancelled';
            historyNote = `Pembayaran ditolak: ${note || 'Tidak memenuhi kriteria'}`;
        }

        await OrderModel.update({
            status: orderStatus,
            payment_status: status
        }, { where: { id: payment.order_id } });

        // Buat order history
        await OrderHistoryModel.create({
            order_id: payment.order_id,
            user_id: req.user.id,
            status: orderStatus,
            note: historyNote
        });

        // Kirim notifikasi ke user
        const userPusherData = {
            order_id: payment.order_id,
            payment_id: payment.id,
            status: orderStatus,
            message: status === 'completed' ?
                'Pembayaran Anda telah diverifikasi, pesanan sedang diproses' : `Pembayaran ditolak: ${note || 'Silakan hubungi admin'}`,
            note: note
        };
        pusher.trigger(`user-${payment.user_id}`, 'payment-verified', userPusherData);

        return res.status(200).json({
            message: status === 'completed' ?
                "Pembayaran berhasil diverifikasi" : "Pembayaran ditolak",
            payment: payment,
            order_status: orderStatus
        });



    } catch (error) {
        console.error('Verify Payment Error:', error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat memverifikasi pembayaran",
            error: error.message
        });
    }
};

const handleMidtransNotification = async(req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const notification = req.body;
        const midtransOrderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        // 1. Validasi Signature Key
        const hashed = crypto
            .createHash('sha512')
            .update(
                `${midtransOrderId}${notification.status_code}${notification.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
            )
            .digest('hex');

        if (hashed !== notification.signature_key) {
            await transaction.rollback();
            return res.status(401).json({ message: "Signature tidak valid" });
        }

        // 2. Cari Payment dan Order terkait
        const payment = await PaymentModel.findOne({
            where: { midtrans_order_id: midtransOrderId },
            include: [{
                model: OrderModel,
                as: 'order',
                include: [{
                    model: UserModel,
                    as: 'user',

                }]
            }],
            transaction
        });

        if (!payment) {
            await transaction.rollback();
            return res.status(404).json({ message: "Pembayaran tidak ditemukan" });
        }

        // 3. Skip jika sudah completed
        if (payment.payment_status === 'completed') {
            await transaction.rollback();
            return res.status(200).json({ message: "Pembayaran sudah diproses sebelumnya" });
        }

        // 4. Handle Berbagai Status Transaksi
        // 4.1 Pembayaran Berhasil
        if (
            transactionStatus === 'settlement' ||
            (transactionStatus === 'capture' && fraudStatus === 'accept')
        ) {
            // Update payment status
            await payment.update({
                payment_status: 'completed',
                payment_date: new Date(),
                midtrans_response: JSON.stringify(notification)
            }, { transaction });

            // Update order status
            await OrderModel.update({
                status: 'process',
                payment_status: 'completed'
            }, {
                where: { id: payment.order_id },
                transaction
            });

            // Buat order history
            await OrderHistoryModel.create({
                order_id: payment.order_id,
                user_id: payment.user_id,
                status: 'process',
                note: 'Pembayaran transfer berhasil diproses'
            }, { transaction });



            // Kurangi stok produk
            const orderItems = await OrderItemModel.findAll({
                where: { order_id: payment.order_id },
                include: [{
                    model: VariantModel,
                    as: 'variant',
                    include: [{
                        model: ProductModel,
                        as: 'product'
                    }]
                }],
                transaction
            });

            for (const item of orderItems) {
                if (item.variant) {
                    // Kurangi stok variant
                    await VariantModel.update({
                        stock: item.variant.stock - item.quantity,
                        total_sold: item.variant.total_sold + item.quantity
                    }, {
                        where: { id: item.variant.id },
                        transaction
                    });

                    // Kurangi stok produk
                    if (item.variant.product) {
                        await ProductModel.update({
                            stock: item.variant.product.stock - item.quantity,
                            total_sold: item.variant.product.total_sold + item.quantity
                        }, {
                            where: { id: item.variant.product.id },
                            transaction
                        });
                    }
                }
            }

            // Commit transaksi database
            await transaction.commit();


            // Data untuk notifikasi
            const notificationData = {
                order_id: payment.order_id,
                payment_id: payment.id,
                status: 'completed',
                timestamp: new Date(),
                customer_name: payment.order && payment.order.user ? payment.order.user.name : null,
                midtrans_order_id: payment.midtrans_order_id,
                amount: payment.amount,
                customer_address: payment.order && payment.order.user ? payment.order.user.address : null,
                items: orderItems
            };


            // 5.1 Kirim ke Admin
            pusher.trigger('admin-channel', 'new-order', notificationData);


            // 5.3 Kirim ke Customer
            pusher.trigger(`user-${payment.user_id}`, 'payment-update', {
                status: 'completed',
                message: 'Pembayaran berhasil diproses'
            });

            return res.status(200).json({ message: "Pembayaran berhasil diproses" });
        }

        // 4.2 Handle Status Lainnya (pending, deny, expire, cancel)
        if (['pending', 'deny', 'expire', 'cancel'].includes(transactionStatus)) {
            await payment.update({
                payment_status: transactionStatus,
                midtrans_response: JSON.stringify(notification)
            }, { transaction });

            await OrderModel.update({
                payment_status: transactionStatus
            }, {
                where: { id: payment.order_id },
                transaction
            });

            await transaction.commit();

            // Kirim notifikasi status pembayaran
            const notificationData = {
                order_id: payment.order_id,
                status: transactionStatus,
                message: `Status pembayaran: ${transactionStatus}`
            };

            // Ke Admin
            pusher.trigger('admin-channel', 'payment-update', notificationData);

            // Ke Customer
            pusher.trigger(`user-${payment.user_id}`, 'payment-update', notificationData);


            return res.status(200).json({
                message: `Status pembayaran diperbarui: ${transactionStatus}`
            });
        }

        // 4.3 Status Tidak Dikenali
        await transaction.commit();
        return res.status(200).json({ message: "Notifikasi berhasil diterima" });
    } catch (error) {
        await transaction.rollback();
        console.error('Payment Notification Error:', error);
        return res.status(500).json({
            message: "Terjadi kesalahan saat memproses notifikasi",
            error: error.message
        });
    }
};


// const updateStatus = async(req, res, _next) => {
//     try {
//         const currentUser = req.user;
//         const { order_id } = req.params;
//         const { payment_status, proof_of_payment } = req.body;


//         // Memastikan productId tidak undefined
//         if (!order_id) {
//             return res.status(400).send({ message: "Product ID tidak ditemukan" });
//         }

//         // Cari Order berdasarkan productId
//         const payment = await PaymentModel.findOne({
//             where: {
//                 order_id,
//                 user_id: currentUser.id,
//             },
//         });

//         if (!payment) {
//             return res.status(404).send({ message: "Payment tidak ditemukan atau Anda tidak memiliki izin untuk memperbaruinya" });
//         }

//         // Memvalidasi inputan dari user
//         if (!payment_status) {
//             return res.status(400).send({ message: "Tidak ada data yang diperbarui" });
//         }



//         // Update produk
//         const updatedPayment = await payment.update({
//             payment_status,
//             payment_date: new Date(),
//         });

//         if (payment_status == 'failed') {
//             await OrderModel.update({
//                 status: 'cancelled',
//             }, {
//                 where: {
//                     id: order_id,
//                 },
//             });
//         }
//         await OrderModel.update({
//             payment_status: payment_status,
//         }, {
//             where: {
//                 id: order_id,
//             },
//         });

//         return res.send({
//             message: "Order updated successfully",
//             data: updatedPayment,
//         });
//     } catch (error) {
//         console.error("Error:", error.message); // Hanya untuk debugging
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };

const updateStatus = async(req, res, _next) => {
    try {
        const currentUser = req.user;
        const { order_id } = req.params;
        const { payment_status } = req.body;

        // Memastikan order_id tidak undefined
        if (!order_id) {
            return res.status(400).send({ message: "Order ID tidak ditemukan" });
        }

        // Cari Payment berdasarkan order_id
        const payment = await PaymentModel.findOne({
            where: {
                order_id,
                user_id: currentUser.id,
            },
        });


        if (!payment) {
            return res.status(404).send({ message: "Payment tidak ditemukan atau Anda tidak memiliki izin untuk memperbaruinya" });
        }

        // Memvalidasi inputan dari user
        if (!payment_status) {
            return res.status(400).send({ message: "Status pembayaran tidak boleh kosong" });
        }

        // Validasi status yang diizinkan
        const allowedStatuses = ['pending', 'process', 'completed', 'cancelled'];
        if (!allowedStatuses.includes(payment_status)) {
            return res.status(400).send({
                message: "Status tidak valid. Gunakan: pending, process, completed atau cancelled"
            });
        }

        // Siapkan data untuk diupdate
        const updateData = {
            payment_status,
            payment_date: new Date(),
        };

        // Jika ada file bukti pembayaran diupload, tambahkan ke updateData
        if (req.files && req.files.proof_of_payment) {
            const proofPhoto = req.files.proof_of_payment[0];

            // Validasi tipe file
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
            if (!allowedMimeTypes.includes(proofPhoto.mimetype)) {
                return res.status(400).send({
                    message: "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau PDF"
                });
            }

            // Validasi ukuran file (maksimal 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (proofPhoto.size > maxSize) {
                return res.status(400).send({
                    message: "Ukuran file terlalu besar. Maksimal 5MB"
                });
            }

            updateData.proof_of_payment = proofPhoto.path;

            // Jika mengupload bukti, otomatis set status ke 'pending' untuk verifikasi
            if (!payment_status) {
                updateData.payment_status = 'process';
            }
        }

        // Validasi: Jika status 'paid' tetapi tidak ada bukti pembayaran
        if (payment_status === 'process' && !req.files.proof_of_payment && !payment.proof_of_payment) {
            return res.status(400).send({
                message: "Untuk status 'completed', bukti pembayaran harus diupload"
            });
        }

        // Update payment
        await payment.update(updateData);

        // Update status order berdasarkan payment_status
        if (payment_status === 'cancelled') {
            await OrderModel.update({
                status: 'cancelled',
                payment_status: payment_status,
            }, {
                where: {
                    id: order_id,
                },
            });
        } else if (payment_status === 'process') {
            // Jika payment status paid, update order status menjadi process
            await OrderModel.update({
                status: 'process',
                payment_status: payment_status,
            }, {
                where: {
                    id: order_id,
                },
            });
        } else {
            // Untuk status lainnya (pending, refunded, dll)
            await OrderModel.update({
                payment_status: payment_status,
            }, {
                where: {
                    id: order_id,
                },
            });
        }

        // Ambil data payment yang sudah diupdate
        const freshPaymentData = await PaymentModel.findOne({
            where: {
                id: payment.id,
            },
        });

        return res.send({
            message: "Payment updated successfully",
            data: freshPaymentData,
        });
    } catch (error) {
        console.error("Error:", error.message);

        // Handle multer errors
        if (error.name === 'MulterError') {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    message: "Ukuran file terlalu besar. Maksimal 5MB"
                });
            }
            return res.status(400).json({
                message: "Error uploading file: " + error.message
            });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { index, updateStatus, createPayment, handleMidtransNotification, verifyPayment };