// require('dotenv').config()

// const express = require("express");
// const cookieParser = require('cookie-parser');
// const path = require("path");
// const passport = require('passport');
// require('./config/passport');
// const jwt = require('jsonwebtoken');

// const app = express();

// const authRouter = require("./routes/auth.router");
// const userRouter = require("./routes/user.router");
// const productRouter = require("./routes/product.router");
// const cartRouter = require("./routes/cart.router");
// const variantRouter = require("./routes/variant.router");
// const categoryRouter = require("./routes/category.router");
// const orderRouter = require("./routes/order.router");
// const paymentRouter = require("./routes/payment.router");
// const { user: UserModel } = require("./models");

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(cookieParser());
// const cors = require("cors");


// if (!process.env.JWT_SECRET) {
//     console.error(
//         "JWT_SECRET is not provided, fill it with random string or generate it using 'openssl rand -base64/-hex 32'"
//     );
//     process.exit(1);
// }



// // **PERBAIKAN KONFIGURASI CORS**
// const corsOptions = {
//     origin: 'http://localhost:3000', // Ganti dengan URL frontend Anda
//     credentials: true, // INI PENTING untuk cookies
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// };

// app.use(cors(corsOptions));

// // **HANDLE PREFLIGHT REQUESTS**
// app.options('*', cors(corsOptions));


// app.use(passport.initialize());

// app.use("/struks", express.static(path.join(process.cwd(), "./")));;


// app.use("/api/auth", authRouter);
// app.use("/api/users", userRouter);
// app.use("/api/products", productRouter);
// app.use("/api/carts", cartRouter);
// app.use("/api/variants", variantRouter);
// app.use("/api/categories", categoryRouter);
// app.use("/api/orders", orderRouter);
// app.use("/api/payments", paymentRouter);




// // Routes Google OAuth
// app.get('/auth/google', (req, res, next) => {
//     const { role } = req.query;

//     // Validasi role yang diperbolehkan - TAMBAHKAN 'seller'
//     const allowedRoles = ['user', 'admin'];
//     const selectedRole = allowedRoles.includes(role) ? role : 'user';

//     console.log("Received role from frontend:", role);
//     console.log("Selected role for authentication:", selectedRole);

//     passport.authenticate('google', {
//         session: false,
//         state: JSON.stringify({ role: selectedRole }) // Simpan role di state
//     })(req, res, next);
// });

// app.get(
//     '/auth/google/callback',
//     (req, res, next) => {
//         passport.authenticate('google', { session: false }, (err, user, info) => {
//             if (err) {
//                 if (err.name === 'ProviderMismatchError') {
//                     return res.redirect(`${process.env.CLIENT_URL}/auth?error=provider_mismatch&message=${encodeURIComponent(err.message)}`);
//                 }
//                 return res.redirect(`${process.env.CLIENT_URL}/auth?error=authentication_failed`);
//             }
//             if (!user) {
//                 return res.redirect(`${process.env.CLIENT_URL}/auth?error=authentication_failed`);
//             }

//             req.user = user;
//             next();
//         })(req, res, next);
//     },
//     async(req, res) => {
//         try {
//             const googleUser = req.user;

//             console.log("User from Google auth:", {
//                 id: googleUser.id,
//                 email: googleUser.email,
//                 role: googleUser.role
//             });

//             // Ambil data lengkap user dari DB
//             const fullUser = await UserModel.findByPk(googleUser.id, {
//                 attributes: [
//                     'id', 'nama', 'email', 'alamat',
//                     'photo', 'hp', 'role',
//                     'createdAt'
//                 ]
//             });

//             console.log("Full user data fetched from DB:", fullUser ? fullUser.get({ plain: true }) : "No user found");

//             if (!fullUser) {
//                 return res.redirect(`${process.env.CLIENT_URL}/auth?error=user_not_found`);
//             }

//             const user = fullUser.get({ plain: true });

//             const token = jwt.sign({
//                     id: user.id,
//                     nama: user.nama,
//                     email: user.email,
//                     role: user.role, // Pastikan pakai role dari user
//                     hp: user.hp,
//                     alamat: user.alamat,
//                     photo: user.photo,
//                 },
//                 process.env.JWT_SECRET, { expiresIn: '1h' }
//             );

//             console.log("Generated token for role:", user.role);

//             // Kirim ke frontend
//             res.redirect(`${process.env.CLIENT_URL}/auth?token=${token}`);
//         } catch (error) {
//             console.error('Google auth error:', error);
//             res.redirect(`${process.env.CLIENT_URL}/auth?error=authentication_failed`);
//         }
//     }
// );




// app.listen(process.env.SERVER_PORT || 3000, () => {
//     console.log("Server Running");
// });



require('dotenv').config()
const express = require("express");
const cookieParser = require('cookie-parser');
const path = require("path");
const passport = require('passport');
require('./config/passport');
const jwt = require('jsonwebtoken');

const app = express();

const authRouter = require("./routes/auth.router");
const userRouter = require("./routes/user.router");
const productRouter = require("./routes/product.router");
const cartRouter = require("./routes/cart.router");
const variantRouter = require("./routes/variant.router");
const categoryRouter = require("./routes/category.router");
const orderRouter = require("./routes/order.router");
const paymentRouter = require("./routes/payment.router");
const { user: UserModel } = require("./models");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
const cors = require("cors");

if (!process.env.JWT_SECRET) {
    console.error(
        "JWT_SECRET is not provided, fill it with random string or generate it using 'openssl rand -base64/-hex 32'"
    );
    process.exit(1);
}

// **KONFIGURASI CORS**
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(passport.initialize());

app.use("/struks", express.static(path.join(process.cwd(), "./")));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);
app.use("/api/variants", variantRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);

// **ROUTES GOOGLE OAUTH - VERSION 1: Query Parameters**
app.get('/auth/google', (req, res, next) => {
    const { role } = req.query;

    const allowedRoles = ['user', 'admin', 'seller'];
    const selectedRole = allowedRoles.includes(role) ? role : 'user';

    console.log("🔑 OAuth Request - Role:", selectedRole);

    passport.authenticate('google', {
        session: false,
        state: JSON.stringify({ role: selectedRole })
    })(req, res, next);
});

app.get(
    '/auth/google/callback',
    (req, res, next) => {
        console.log('=== GOOGLE OAUTH CALLBACK STARTED ===');
        console.log('Query params:', req.query);
        console.log('State:', req.query.state);

        passport.authenticate('google', {
            session: false
        }, (err, user, info) => {
            console.log('🔐 Google Auth Result:');
            console.log('Error:', err);
            console.log('User:', user ? { id: user.id, email: user.email } : 'No user');

            if (err) {
                console.error('❌ Auth error:', err);
                if (err.name === 'ProviderMismatchError') {
                    return res.redirect(`${process.env.CLIENT_URL}/login?error=provider_mismatch`);
                }
                return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
            }
            if (!user) {
                console.error('❌ No user from Google');
                return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
            }

            req.user = user;
            next();
        })(req, res, next);
    },
    async(req, res) => {
        try {
            console.log('=== PROCESSING USER DATA ===');
            const googleUser = req.user;

            console.log('📧 User from Google:', {
                id: googleUser.id,
                email: googleUser.email,
                role: googleUser.role
            });

            // Ambil data lengkap user dari DB
            const fullUser = await UserModel.findByPk(googleUser.id, {
                attributes: ['id', 'nama', 'email', 'alamat', 'photo', 'hp', 'role', 'createdAt']
            });

            if (!fullUser) {
                console.error('❌ User not found in database');
                return res.redirect(`${process.env.CLIENT_URL}/login?error=user_not_found`);
            }

            const user = fullUser.get({ plain: true });
            console.log('💾 User from database:', user);

            // Generate token
            const token = jwt.sign({
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    role: user.role,
                    hp: user.hp,
                    alamat: user.alamat,
                    photo: user.photo,
                },
                process.env.JWT_SECRET, { expiresIn: '1h' }
            );
            // Generate tokens
            const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
            // Simpan refresh token ke database
            await UserModel.update({ refresh_token: refreshToken }, { where: { id: user.id } });

            // **SET COOKIE DI BACKEND LANGSUNG**
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            };

            res.cookie('refreshToken', refreshToken, cookieOptions);


            console.log('✅ Token generated successfully');
            console.log('📏 Token length:', token.length);
            console.log('🔤 Token preview:', token.substring(0, 50) + '...');

            // **OPTION 1: Redirect dengan query parameters (standard)**
            const encodedToken = encodeURIComponent(token);
            const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${encodedToken}`;

            console.log('🎯 Redirecting to:', redirectUrl);

            res.redirect(redirectUrl);

        } catch (error) {
            console.error('💥 Google auth callback error:', error);
            res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
        }
    }
);


// app.get(
//     '/auth/google/callback',
//     (req, res, next) => {
//         passport.authenticate('google', {
//             session: false
//         }, (err, user, info) => {
//             if (err) {
//                 return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
//             }
//             if (!user) {
//                 return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
//             }
//             req.user = user;
//             next();
//         })(req, res, next);
//     },
//     async(req, res) => {
//         try {
//             const googleUser = req.user;
//             const fullUser = await UserModel.findByPk(googleUser.id);

//             if (!fullUser) {
//                 return res.redirect(`${process.env.CLIENT_URL}/login?error=user_not_found`);
//             }

//             const user = fullUser.get({ plain: true });

//             // Generate tokens
//             const accessToken = jwt.sign({
//                     id: user.id,
//                     nama: user.nama,
//                     email: user.email,
//                     role: user.role,
//                     hp: user.hp,
//                     alamat: user.alamat,
//                     photo: user.photo,
//                 },
//                 process.env.JWT_SECRET, { expiresIn: '15m' }
//             );

//             const refreshToken = jwt.sign({ id: user.id },
//                 process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }
//             );

//             // Simpan refresh token ke database
//             await UserModel.update({ refresh_token: refreshToken }, { where: { id: user.id } });

//             console.log('✅ Tokens generated for OAuth');

//             // **KIRIMKAN TOKENS MELALUI URL QUERY PARAMETERS**
//             const encodedAccessToken = encodeURIComponent(accessToken);
//             const encodedRefreshToken = encodeURIComponent(refreshToken);

//             const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?accessToken=${encodedAccessToken}&refreshToken=${encodedRefreshToken}&userId=${user.id}`;

//             console.log('🎯 Redirecting with tokens in URL');
//             res.redirect(redirectUrl);

//         } catch (error) {
//             console.error('💥 OAuth callback error:', error);
//             res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
//         }
//     }
// );

// **ALTERNATIVE ROUTE: Hash-based token delivery**
app.get('/auth/google/hash', (req, res, next) => {
    const { role } = req.query;

    console.log("🔑 Hash-based OAuth - Role:", role);

    passport.authenticate('google', {
        session: false,
        state: JSON.stringify({
            role: role || 'user',
            method: 'hash'
        })
    })(req, res, next);
});

app.get(
    '/auth/google/hash/callback',
    (req, res, next) => {
        passport.authenticate('google', {
            session: false
        }, (err, user, info) => {
            if (err) {
                return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
            }
            if (!user) {
                return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
            }
            req.user = user;
            next();
        })(req, res, next);
    },
    async(req, res) => {
        try {
            const googleUser = req.user;
            const fullUser = await UserModel.findByPk(googleUser.id);

            if (!fullUser) {
                return res.redirect(`${process.env.CLIENT_URL}/login?error=user_not_found`);
            }

            const user = fullUser.get({ plain: true });

            const token = jwt.sign({
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_SECRET, { expiresIn: '1h' }
            );

            // **OPTION 2: Redirect dengan hash (lebih reliable)**
            const encodedToken = encodeURIComponent(token);
            const redirectUrl = `${process.env.CLIENT_URL}/auth/callback#token=${encodedToken}`;

            console.log('🎯 Hash Redirect to:', redirectUrl);

            res.redirect(redirectUrl);

        } catch (error) {
            console.error('Hash callback error:', error);
            res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
        }
    }
);

// **TEST ROUTE: Untuk debugging token delivery**
app.get('/auth/test-token', (req, res) => {
    const testToken = jwt.sign({ test: true, timestamp: Date.now() },
        process.env.JWT_SECRET, { expiresIn: '1h' }
    );

    const method = req.query.method || 'query';

    if (method === 'hash') {
        res.redirect(`${process.env.CLIENT_URL}/auth/callback#token=${encodeURIComponent(testToken)}`);
    } else {
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${encodeURIComponent(testToken)}`);
    }
});
app.post('/api/auth/set-oauth-cookie', async(req, res) => {
    try {
        const { refreshToken } = req.body;

        console.log('🍪 Received request to set OAuth cookie');

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token diperlukan"
            });
        }

        // Verifikasi refresh token valid
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            console.log('✅ Refresh token verified for user:', decoded.id);
        } catch (error) {
            console.error('❌ Invalid refresh token:', error.message);
            return res.status(403).json({
                success: false,
                message: "Refresh token tidak valid"
            });
        }

        // **KONFIGURASI COOKIE YANG SAMA DENGAN LOGIN BIASA**
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
            path: '/',
        };

        // Jika di production, tambahkan domain
        if (process.env.NODE_ENV === 'production') {
            cookieOptions.domain = '.domainkamu.com'; // Ganti dengan domain Anda
        }

        // Set cookie
        res.cookie('refreshToken', refreshToken, cookieOptions);

        console.log('✅ OAuth refresh token cookie set successfully');

        res.json({
            success: true,
            message: "Cookie berhasil diset"
        });

    } catch (error) {
        console.error('💥 Set OAuth cookie error:', error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

// Endpoint verify token
app.get('/api/auth/verify', async(req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Token diperlukan"
            });
        }

        const token = authHeader.split(' ')[1];

        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Cari user di database
        const user = await UserModel.findByPk(decoded.id, {
            attributes: ['id', 'nama', 'email', 'role', 'photo', 'alamat', 'hp']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User tidak ditemukan"
            });
        }

        console.log('✅ Token verified for user:', user.email);

        res.json({
            success: true,
            message: "Token valid",
            user: user.get({ plain: true })
        });

    } catch (error) {
        console.error('❌ Token verification error:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token telah kadaluarsa",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: "Token tidak valid"
            });
        }

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

app.listen(process.env.SERVER_PORT || 3000, () => {
    console.log("🚀 Server Running on port", process.env.SERVER_PORT || 3000);
    console.log("🔗 OAuth URLs:");
    console.log("   Standard: http://localhost:" + (process.env.SERVER_PORT || 3000) + "/auth/google");
    console.log("   Hash-based: http://localhost:" + (process.env.SERVER_PORT || 3000) + "/auth/google/hash");
    console.log("   Test: http://localhost:" + (process.env.SERVER_PORT || 3000) + "/auth/test-token");
});