const jwt = require("jsonwebtoken");
const config = require('../config/config');
const UserModel = require('../models/user.model');
const crypto = require('crypto');

class TokenUtils {
    static async generateTokens(user, rememberMe = false) {
        try {
            const jti = crypto.randomBytes(16).toString('hex'); // Unique ID for token
            const payload = {
                id: user._id.toString(),
                email: user.email,
                jti: jti, // Добавляем уникальный идентификатор
            };

            const accessToken = jwt.sign(
                payload,
                config.secret,
                {expiresIn: rememberMe ? "10d" : "1d"}
            );

            const refreshToken = jwt.sign(
                payload,
                config.secret,
                {expiresIn: rememberMe ? '30d' : '7d'}
            );

            // Сохраняем jti в пользователе (для инвалидации старых токенов)
            user.lastTokenId = jti;
            user.refreshToken = refreshToken;
            await user.save();


            return Promise.resolve({accessToken, refreshToken});
        } catch (err) {
            return Promise.reject(err);
        }
    }

    static verifyRefreshToken(refreshToken) {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await UserModel.findOne({refreshToken: refreshToken});
                if (!user) {
                    return reject({
                        status: 401,
                        error: true,
                        message: "Токен не валиден"
                    });
                }

                jwt.verify(refreshToken, config.secret, (err, tokenDetails) => {
                    if (err) {
                        let status = 401;
                        let message = "Токен не валиден";

                        if (err.name === 'TokenExpiredError') {
                            message = "Токен истек";
                        } else if (err.name === 'JsonWebTokenError') {
                            message = "Неверный формат токена";
                        }

                        return reject({
                            status: status,
                            error: true,
                            message: message
                        });
                    }

                    resolve({
                        tokenDetails,
                        error: false,
                        message: "Valid refresh token",
                    });
                });
            } catch (error) {
                // Обработка ошибок базы данных
                reject({
                    status: 500,
                    error: true,
                    message: "Внутренняя ошибка сервера"
                });
            }
        });
    }
}

module.exports = TokenUtils;