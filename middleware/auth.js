require('dotenv').config();

const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {

    const authHeader = req.headers['authorization'];

    if (!authHeader) {

        return res.status(401).json({
            ok: false,
            mensaje: 'Token requerido'
        });

    }

    const token = authHeader.split(' ')[1];

    if (!token) {

        return res.status(401).json({
            ok: false,
            mensaje: 'Token inválido'
        });

    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, decoded) => {

            if (err) {

                return res.status(403).json({
                    ok: false,
                    mensaje: 'Token no válido'
                });

            }

            req.usuario = decoded;

            next();

        }
    );

}

module.exports = verificarToken;