const passport = require('passport');

class Auth {
    static authenticate(req, res, next) {
        passport.authenticate('jwt',
            (err, user, authenticateError) =>
                Auth.processAuthenticate(req, res, next, err, user, authenticateError))(req, res, next);
    }

    static processAuthenticate(req, res, next, err, user, authenticateError) {
        // Обрабатываем ошибки JWT
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: true,
                    message: "Access token истек",
                    code: "ACCESS_TOKEN_EXPIRED"
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: true,
                    message: "Неверный токен",
                    code: "INVALID_TOKEN"
                });
            }
            return res.status(500).json({
                error: true,
                message: "Ошибка аутентификации"
            });
        }

        // Обрабатываем ошибки от Passport
        if (authenticateError) {
            return res.status(401).json({
                error: true,
                message: authenticateError.message || "Ошибка аутентификации"
            });
        }

        // Проверяем пользователя
        if (!user) {
            return res.status(401).json({
                error: true,
                message: "Пользователь не авторизован"
            });
        }

        req.user = user;
        return next();

        // old code
        // if (authenticateError) {
        //     return next(new Error(authenticateError.message));
        // }
        // if (err) {
        //     return next(err);
        // }
        // // Check User
        // if (!user) {
        //     return next(new Error('User unauthorized'));
        // }
        //
        // req.user = user;
        //
        // return next();
    }

}

module.exports = Auth;