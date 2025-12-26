const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { user: UserModel } = require("../models");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require('dotenv').config()

const generateVerificationCode = () => crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 karakter kode acak

const sendVerificationEmail = async(email, verificationCode) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false, // Abaikan validasi sertifikat
        },
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Verify Your Email",
        text: `Your verification code is: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);
};

const register = async(req, res, next) => {
    const {
        nama,
        email,
        password,
        alamat,
        hp,
        jenis_kelamin,
        tempat_lahir,
        tanggal_lahir,
    } = req.body;

    // if (!req.file) {
    //     return res.status(400).send({ message: "Gambar tidak ditemukan, pastikan gambar diunggah dengan benar" });
    // }
    // Buat photo menjadi opsional
    let image = null;
    if (req.file) {
        image = req.file.path; // Cloudinary URL
    }

    console.log("image", image)


    try {
        // Pengecekan email
        const userExist = await UserModel.findOne({ where: { email } });
        if (userExist) {
            return res.status(401).json({ message: "Email already exist" });
        }

        // Generate kode verifikasi
        const verificationCode = generateVerificationCode();

        console.log("ini kode", verificationCode)

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Buat user baru dengan status belum terverifikasi
        const user = await UserModel.create({
            nama,
            email,
            password: passwordHash,
            alamat,
            photo: image,
            hp,
            jenis_kelamin,
            tempat_lahir,
            tanggal_lahir,
            kode_verifikasi: verificationCode,
            terverifikasi: false,
        });

        if (!user) {
            return res.status(500).send({
                message: "Failed to register user",
                data: null,
            });
        }

        // Kirim email verifikasi
        await sendVerificationEmail(email, verificationCode);

        return res.send({
            message: "User successfully registered. Please check your email to verify your account.",
            data: null,
        });
    } catch (err) {
        console.log("Error : ", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


const verifyEmail = async(req, res, next) => {
    const { email, kode_verifikasi } = req.body;

    try {
        const user = await UserModel.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.kode_verifikasi !== kode_verifikasi) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Update status pengguna menjadi terverifikasi
        user.terverifikasi = true;
        user.kode_verifikasi = null; // Hapus kode verifikasi setelah digunakan
        await user.save();

        return res.send({
            message: "Email successfully verified",
            data: kode_verifikasi,
        });
    } catch (err) {
        console.log("Error : ", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



// const login = async(req, res, next) => {
//     const { email, password } = req.body;

//     try {
//         // Cari pengguna berdasarkan email
//         const user = await UserModel.findOne({ where: { email } });

//         console.log("uuuuuuuuuuuuuuuuuser", user)

//         if (!user) {
//             return res.status(401).json({ message: "Invalid email/password" });
//         }

//         if (user.is_delete) {
//             return res.status(401).json({ message: "Maaf akun anda telah dinon aktifkan. Silakan hubungi admin Rutan bantaeng di cp. +6285342545607." });
//         }

//         // Bandingkan password
//         const isValid = await bcrypt.compare(password, user.password);
//         if (!isValid) {
//             return res.status(401).json({ message: "Invalid email/password" });
//         }

//         // Buat payload untuk token
//         const data = {
//             id: user.id,
//             nama: user.nama,
//             email: user.email,
//             alamat: user.alamat,
//             role: user.role,
//         };

//         // Buat token dengan masa berlaku
//         const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1m" });
//         const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

//         // Simpan refresh token di database
//         await UserModel.update({ refresh_token: refreshToken }, { where: { id: user.id } });

//         // **KONFIGURASI COOKIE YANG DIPERBAIKI**
//         const cookieOptions = {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production', // false untuk development
//             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Perbaikan di sini
//             maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
//             path: '/',
//         };

//         // Jika di production, tambahkan domain
//         if (process.env.NODE_ENV === 'production') {
//             cookieOptions.domain = '.domainkamu.com'; // Ganti dengan domain Anda
//         }

//         // Set cookie
//         res.cookie('refreshToken', refreshToken, cookieOptions);

//         // Debug: cek apakah cookie ter-set
//         console.log('Cookie yang diset:', {
//             name: 'refreshToken',
//             value: refreshToken ? 'ada' : 'tidak ada',
//             options: cookieOptions
//         });

//         // **CEK HEADER RESPONSE**
//         console.log('Response headers:', res.getHeaders());

//         // Kirim respons ke frontend
//         return res.status(200).json({
//             message: "Login successful",
//             data: {
//                 user: data,
//                 token: token,
//             },
//         });
//     } catch (err) {
//         console.error("Login error:", err);
//         next(err);
//     }
// };

const login = async(req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Invalid email/password" });
        }

        if (user.is_delete) {
            return res.status(401).json({ message: "Maaf akun anda telah dinon aktifkan. Silakan hubungi admin Rutan bantaeng di cp. +6285342545607." });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid email/password" });
        }

        const data = {
            id: user.id,
            nama: user.nama,
            email: user.email,
            alamat: user.alamat,
            role: user.role,
        };

        const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1m" });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

        // **UPDATE REFRESH TOKEN KE DATABASE DULU**
        await UserModel.update({ refresh_token: refreshToken }, { where: { id: user.id } });

        // **KONFIGURASI COOKIE YANG LEBIH FLEKSIBEL**
        const isProduction = process.env.NODE_ENV === 'production';

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction, // true untuk production (HTTPS)
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        };

        // **HAPUS KONFIGURASI DOMAIN JIKA TIDAK DIPERLUKAN**
        // Biarkan browser menentukan domain secara otomatis
        // cookieOptions.domain hanya diperlukan untuk subdomain spesifik

        // Set cookie
        res.cookie('refreshToken', refreshToken, cookieOptions);

        // **VERIFIKASI: Ambil data user setelah update**
        const updatedUser = await UserModel.findOne({ where: { id: user.id } });
        console.log('Token di database:', updatedUser.refresh_token);
        console.log('Token di cookie:', refreshToken);

        return res.status(200).json({
            message: "Login successful",
            data: {
                user: data,
                token: token,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        next(err);
    }
};

const verifyDevice = async(req, res, next) => {
    const { email, kode_verifikasi } = req.body;

    try {
        const user = await UserModel.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.kode_verifikasi !== kode_verifikasi) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Verifikasi perangkat sukses
        const currentDevice = req.headers['user-agent'] || 'Unknown Device';
        user.nama_perangakat = currentDevice;
        user.kode_verifikasi = null; // Hapus kode verifikasi
        await user.save();

        return res.send({
            message: "Device successfully verified. Please log in again.",
        });
    } catch (err) {
        next(err);
    }
};

const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// auth.controller.js - Logout function
const logout = async(req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        // Jika ada refresh token, hapus dari database
        if (refreshToken) {
            // Cari user dengan refresh token ini
            const user = await UserModel.findOne({
                where: { refresh_token: refreshToken }
            });

            if (user) {
                // Hapus refresh token dari database
                await UserModel.update({ refresh_token: null }, { where: { id: user.id } });
            }
        }

        // Hapus semua cookies yang terkait auth
        const cookiesToClear = [
            'refreshToken',
            'accessToken',
            'token',
            'authUser',
            'sessionId'
        ];

        cookiesToClear.forEach(cookieName => {
            res.clearCookie(cookieName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        });

        res.json({
            message: "Logout berhasil, semua cookies dihapus"
        });

    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Server error saat logout" });
    }
};


// const refreshToken = async(req, res, next) => {
//     try {
//         // Ambil refresh token dari cookie
//         const refreshToken = req.cookies.refreshToken;


//         if (!refreshToken) {
//             return res.status(401).json({ message: "Refresh token tidak ditemukan" });
//         }

//         // Verifikasi refresh token
//         const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);



//         console.log("Dddddddddddddddddddddddddddddddddecoded refresh token:", decoded);

//         console.log("Rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrefresh token from cookie:", refreshToken);

//         // Cari user berdasarkan id dan refresh token
//         const user = await UserModel.findOne({
//             where: {
//                 id: decoded.id,
//                 refresh_token: refreshToken
//             }
//         });

//         console.log("Uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuser found for refresh token:", user.refresh_token);


//         if (!user) {
//             return res.status(401).json({ message: "Refresh token tidak valid" });
//         }

//         // Buat access token baru
//         const newAccessToken = jwt.sign({
//                 id: user.id,
//                 nama: user.nama,
//                 email: user.email,
//                 alamat: user.alamat,
//                 role: user.role,
//             },
//             process.env.JWT_SECRET, { expiresIn: "7d" } // Access token 7 hari
//         );

//         res.json({
//             message: "Token berhasil diperbarui",
//             token: newAccessToken
//         });
//     } catch (error) {
//         console.error("Refresh token error:", error);

//         if (error.name === 'TokenExpiredError') {
//             return res.status(401).json({ message: "Refresh token expired" });
//         }
//         if (error.name === 'JsonWebTokenError') {
//             return res.status(401).json({ message: "Refresh token tidak valid" });
//         }

//         next(error);
//     }
// };

const refreshToken = async(req, res, next) => {
    try {
        // **LOG SEMUA COOKIES YANG DITERIMA**
        console.log('Semua cookies:', req.cookies);
        console.log('Headers cookie:', req.headers.cookie);

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token tidak ditemukan" });
        }

        // **VERIFIKASI TOKEN**
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            console.error("Error verifying token:", error.message);
            return res.status(401).json({ message: "Refresh token tidak valid" });
        }

        console.log("Decoded refresh token:", decoded);
        console.log("Refresh token from cookie:", refreshToken);

        // **CARI USER DENGAN REFRESH TOKEN YANG SAMA**
        const user = await UserModel.findOne({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({ message: "User tidak ditemukan" });
        }

        console.log("Refresh token di database:", user.refresh_token);
        console.log("Refresh token dari cookie:", refreshToken);
        console.log("Apakah sama?", user.refresh_token === refreshToken);

        // **PERIKSA KESAMAAN TOKEN**
        if (user.refresh_token !== refreshToken) {
            return res.status(401).json({
                message: "Refresh token tidak cocok",
                detail: "Token di database berbeda dengan token di cookie"
            });
        }

        // Buat access token baru
        const newAccessToken = jwt.sign({
                id: user.id,
                nama: user.nama,
                email: user.email,
                alamat: user.alamat,
                role: user.role,
            },
            process.env.JWT_SECRET, { expiresIn: "7d" }
        );

        res.json({
            message: "Token berhasil diperbarui",
            token: newAccessToken
        });
    } catch (error) {
        console.error("Refresh token error:", error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Refresh token expired" });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Refresh token tidak valid" });
        }

        next(error);
    }
};

module.exports = {
    login,
    register,
    verifyEmail,
    verifyDevice,
    checkAuth,
    logout,
    refreshToken,
};