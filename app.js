require('dotenv').config();
console.log(process.env.SESSION_SECRET);
const cors = require('cors');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({

    origin: true,

    credentials: true

}));


app.get('/test-db', async (req, res) => {

    try {

        const [matches] =
            await pool.query(
                'SELECT * FROM matches'
            );

        const [users] =
            await pool.query(
                'SELECT * FROM users'
            );

        res.json({

            matches,
            users

        });

    }

    catch (error) {

        console.log(error);

        res.json(error);

    }

});





// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(
    path.join(__dirname, 'public')
));

app.set('trust proxy', 1);

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

        secure: true,

        httpOnly: true,

        sameSite: 'none',

        maxAge: 1000 * 60 * 60 * 24 * 7

    }

}));

// ======================================================
// HELPERS
// ======================================================

function verificarToken(req, res, next) {

    if (!req.session.usuario) {

        return res.status(401).json({

            ok: false,
            mensaje: 'No autorizado'

        });

    }

    next();

}

function soloAdmin(req, res, next) {

    if (
        !req.session.usuario ||
        req.session.usuario.rol !== 'admin'
    ) {

        return res.status(403).json({

            ok: false,
            mensaje: 'Solo admin'

        });

    }

    next();

}

// ======================================================
// HOME
// ======================================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'public', 'login.html')
    );

});

// ======================================================
// SESSION
// ======================================================

app.get('/session', (req, res) => {

    if (!req.session.usuario) {

        return res.json({

            ok: false,
            user: null

        });

    }

    res.json({

        ok: true,
        user: req.session.usuario

    });

});

// ======================================================
// REGISTER
// ======================================================

app.post('/register', async (req, res) => {

    try {

        let { nombre, password } = req.body;

        nombre = nombre.trim();
        password = password.trim();

        const [existe] = await pool.query(

            'SELECT * FROM users WHERE nombre=?',

            [nombre]

        );

        if (existe.length > 0) {

            return res.json({

                ok: false,
                mensaje: 'Usuario ya existe'

            });

        }

        const hash =
            await bcrypt.hash(password, 10);

        const [cantidad] =
            await pool.query(
                'SELECT COUNT(*) as total FROM users'
            );

        const rol =
            cantidad[0].total === 0
                ? 'admin'
                : 'usuario';

        await pool.query(

    `INSERT INTO users
    (
        nombre,
        password,
        rol,
        puntos,
        activo
    )
    VALUES(?,?,?,?,?)`,

    [
        nombre,
        hash,
        rol,
        0,
        rol === 'admin' ? 1 : 0
    ]

);

        res.json({

            ok: true,
            mensaje: 'Usuario creado'

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error register'

        });

    }

});

// ======================================================
// LOGIN
// ======================================================

app.post('/login', async (req, res) => {

    try {

        let { nombre, password } = req.body;

        nombre = nombre.trim();
        password = password.trim();

        const [rows] = await pool.query(

            'SELECT * FROM users WHERE nombre=?',

            [nombre]

        );

        if (rows.length === 0) {

            return res.json({

                ok: false,
                mensaje: 'Usuario no encontrado'

            });

        }

        const user = rows[0];
        if (!user.activo) {

    return res.json({

        ok: false,

        mensaje:
            'Tu cuenta está pendiente de aprobación'

    });

}

        const valido =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!valido) {

            return res.json({

                ok: false,
                mensaje: 'Contraseña incorrecta'

            });

        }

        req.session.usuario = {

            id: user.id,

            nombre: user.nombre,

            rol: user.rol

        };

        req.session.save(err => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    ok: false,
                    mensaje: 'Error sesión'

                });

            }

            return res.json({

                ok: true,

                mensaje: 'Login correcto',

                usuario: req.session.usuario

            });

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error login'

        });

    }

});

// ======================================================
// LOGOUT
// ======================================================

app.post('/logout', (req, res) => {

    req.session.destroy(() => {

        res.clearCookie('connect.sid');

        res.json({

            ok: true,
            mensaje: 'Logout correcto'

        });

    });

});

// ======================================================
// MATCHES
// ======================================================

// ======================================================
// ⚽ MATCHES
// ======================================================

app.get('/matches', verificarToken, async (req, res) => {

    try {

        const [matches] =
            await pool.query(

                `SELECT *
                FROM matches
                ORDER BY fecha ASC, hora ASC`

            );

        res.json(matches);

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error cargando partidos'

        });

    }

});



// ======================================================
// 🏆 BRACKETS
// ======================================================

app.get('/brackets', verificarToken, async (req, res) => {

    try {

        const [brackets] =
            await pool.query(

                `SELECT *
                FROM brackets
                ORDER BY id ASC`

            );

        res.json(brackets);

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error brackets'

        });

    }

});

// ======================================================
// ✅ ACTIVAR / BLOQUEAR USUARIO
// ======================================================

app.post(
    '/toggle-usuario',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const { id } = req.body;

            const [rows] =
                await pool.query(

                    `SELECT activo
                     FROM users
                     WHERE id=?`,

                    [id]

                );

            if (rows.length === 0) {

                return res.json({

                    ok: false,

                    mensaje:
                        'Usuario no existe'

                });

            }

            const nuevoEstado =
                rows[0].activo ? 0 : 1;

            await pool.query(

                `UPDATE users
                 SET activo=?
                 WHERE id=?`,

                [
                    nuevoEstado,
                    id
                ]

            );

            res.json({

                ok: true,

                mensaje:
                    nuevoEstado
                        ? 'Usuario aprobado'
                        : 'Usuario bloqueado'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,

                mensaje:
                    'Error usuario'

            });

        }

    }
);


// ======================================================
// 🏆 GUARDAR GANADOR BRACKET
// ======================================================

// ======================================================
// 🏆 RESULTADO BRACKET
// ======================================================

app.post(
    '/resultado-bracket',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const {
                id,
                ganador
            } = req.body;

            // =========================
            // GUARDAR GANADOR REAL
            // =========================

            await pool.query(

                `UPDATE brackets
                SET ganador=?
                WHERE id=?`,

                [
                    ganador,
                    id
                ]

            );

            // =========================
            // OBTENER APUESTAS
            // =========================

            const [apuestas] =
                await pool.query(

                    `SELECT *
                     FROM bracket_apuestas
                     WHERE bracketId=?`,

                    [id]

                );

            // =========================
            // RECALCULAR PUNTOS
            // =========================

            for (const a of apuestas) {

                let puntos = 0;

                // ✅ SI ACIERTA GANADOR
                if (a.ganador === ganador) {

                    puntos = 5;

                }

                await pool.query(

                    `UPDATE bracket_apuestas
                     SET puntos=?
                     WHERE id=?`,

                    [
                        puntos,
                        a.id
                    ]

                );

            }

            // =========================
            // RECALCULAR RANKING GENERAL
            // =========================

            const [users] =
                await pool.query(

                    `SELECT id
                     FROM users`

                );

            for (const u of users) {

                // puntos normales
                const [normal] =
                    await pool.query(

                        `SELECT
                         COALESCE(
                            SUM(puntos),
                            0
                         ) AS total
                         FROM apuestas
                         WHERE userId=?`,

                        [u.id]

                    );

                // puntos brackets
                const [brackets] =
                    await pool.query(

                        `SELECT
                         COALESCE(
                            SUM(puntos),
                            0
                         ) AS total
                         FROM bracket_apuestas
                         WHERE userId=?`,

                        [u.id]

                    );

                // total general
                const total =

    parseInt(normal[0].total || 0) +

    parseInt(brackets[0].total || 0);

                await pool.query(

                    `UPDATE users
                     SET puntos=?
                     WHERE id=?`,

                    [
                        total,
                        u.id
                    ]

                );

            }

            res.json({

                ok: true,
                mensaje: 'Ganador guardado'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje: 'Error bracket'

            });

        }

    }
);


// ======================================================
// 🏆 APOSTAR BRACKET
// ======================================================

app.post(
    '/apostar-bracket',
    verificarToken,
    async (req, res) => {

        try {

            const {
                bracketId,
                ganador
            } = req.body;

            const userId =
                req.session.usuario.id;

            // =========================
            // VERIFICAR SI YA EXISTE
            // RESULTADO REAL
            // =========================

            const [brackets] =
                await pool.query(

                    `SELECT ganador
                     FROM brackets
                     WHERE id=?`,

                    [bracketId]

                );

            // 🚫 APUESTAS CERRADAS

            if (

                brackets.length > 0 &&

                brackets[0].ganador

            ) {

                return res.json({

                    ok: false,

                    mensaje:
                        'Las apuestas están cerradas'

                });

            }

            // =========================
            // VERIFICAR SI YA APOSTÓ
            // =========================

            const [existe] =
                await pool.query(

                    `SELECT *
                     FROM bracket_apuestas
                     WHERE userId=? AND bracketId=?`,

                    [userId, bracketId]

                );

            // =========================
            // UPDATE
            // =========================

            if (existe.length > 0) {

                await pool.query(

                    `UPDATE bracket_apuestas
                     SET ganador=?
                     WHERE userId=? AND bracketId=?`,

                    [
                        ganador,
                        userId,
                        bracketId
                    ]

                );

            }

            // =========================
            // INSERT
            // =========================

            else {

                await pool.query(

                    `INSERT INTO bracket_apuestas
                    (
                        userId,
                        bracketId,
                        ganador,
                        puntos
                    )
                    VALUES(?,?,?,?)`,

                    [
                        userId,
                        bracketId,
                        ganador,
                        0
                    ]

                );

            }

            res.json({

                ok: true,
                mensaje: 'Predicción guardada'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje: 'Error apuesta bracket'

            });

        }

    }
);


// ======================================================
// CREAR PARTIDO
// ======================================================

app.post(
    '/crear-partido',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const {
                grupo,
                homeTeam,
                awayTeam,
                fecha,
                hora
            } = req.body;

            await pool.query(

                `INSERT INTO matches
                (grupo,homeTeam,awayTeam,fecha,hora)
                VALUES(?,?,?,?,?)`,

                [
                    grupo,
                    homeTeam,
                    awayTeam,
                    fecha,
                    hora
                ]

            );

            res.json({

                ok: true,
                mensaje: 'Partido creado'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje: 'Error crear partido'

            });

        }

    }
);

// ======================================================
// RESULTADO
// ======================================================

app.post(
    '/resultado',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const {
                matchId,
                home,
                away
            } = req.body;

            await pool.query(

                `UPDATE matches
                SET
                homeResult=?,
                awayResult=?
                WHERE id=?`,

                [
                    Number(home),
                    Number(away),
                    Number(matchId)
                ]

            );

            // =========================
            // RECALCULAR APUESTAS
            // =========================

            const [apuestas] =
                await pool.query(

                    `SELECT *
                    FROM apuestas
                    WHERE matchId=?`,

                    [matchId]

                );

            for (const a of apuestas) {

                let puntos = 0;

                let estado = 'fallo';

                // ✅ RESULTADO EXACTO

                if (

                    Number(a.home) === Number(home) &&
                    Number(a.away) === Number(away)

                ) {

                    puntos = 5;

                    estado = 'exacto';

                }

                else {

                    // ✅ GANADOR

                    const prediccion =

                        Number(a.home) >
                        Number(a.away)

                            ? 'L'

                            : Number(a.home) <
                              Number(a.away)

                                ? 'V'

                                : 'E';

                    const real =

                        Number(home) >
                        Number(away)

                            ? 'L'

                            : Number(home) <
                              Number(away)

                                ? 'V'

                                : 'E';

                    if (prediccion === real) {

                        puntos = 3;

                        estado = 'ganador';

                    }

                }

                await pool.query(

                    `UPDATE apuestas
                    SET
                    puntos=?,
                    estado=?
                    WHERE id=?`,

                    [
                        puntos,
                        estado,
                        a.id
                    ]

                );

            }

            // =========================
            // RECALCULAR RANKING
            // =========================

            const [users] =
                await pool.query(

                    `SELECT id
                    FROM users`

                );

            for (const u of users) {

                const [total] =
                    await pool.query(

                        `SELECT
                        COALESCE(SUM(puntos),0)
                        AS total
                        FROM apuestas
                        WHERE userId=?`,

                        [u.id]

                    );

                await pool.query(

                    `UPDATE users
                    SET puntos=?
                    WHERE id=?`,

                    [
                        total[0].total,
                        u.id
                    ]

                );

            }

            res.json({

                ok: true,
                mensaje: 'Resultado guardado'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje: 'Error resultado'

            });

        }

    }
);
// EDITAR PARTIDO //

// ======================================================
// 💾 EDITAR PARTIDO
// ======================================================

app.post(
    '/editar-partido',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const {
                id,
                fecha,
                hora
            } = req.body;

            await pool.query(

                `UPDATE matches
                SET fecha = ?, hora = ?
                WHERE id = ?`,

                [fecha, hora, id]

            );

            res.json({

                ok: true,
                mensaje: 'Fecha actualizada'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje: 'Error editar partido'

            });

        }

    }
);

// ======================================================
// ⚽ APOSTAR
// ======================================================



app.post(
    '/apostar',
    verificarToken,
    async (req, res) => {

        try {

            const {
                matchId,
                home,
                away
            } = req.body;

            const userId =
                req.session.usuario.id;

            // =========================
            // OBTENER PARTIDO
            // =========================

            const [matches] =
                await pool.query(

                    `SELECT *
                     FROM matches
                     WHERE id=?`,

                    [matchId]

                );

            if (matches.length === 0) {

                return res.json({

                    ok: false,
                    mensaje: 'Partido no existe'

                });

            }

            const match =
                matches[0];

            // =========================
            // 🚫 SI YA TIENE RESULTADO
            // =========================

            if (

                match.homeResult !== null &&

                match.awayResult !== null

            ) {

                return res.json({

                    ok: false,

                    mensaje:
                        'Las apuestas están cerradas'

                });

            }

            // =========================
            // ⏰ VALIDAR CIERRE
            // =========================

            if (

                match.fecha &&

                match.hora

            ) {

                // FECHA STRING

                const fechaTexto =
                    String(match.fecha)
                    .split('T')[0];

                // PARTIR FECHA

                const partesFecha =
                    fechaTexto.split('-');

                // PARTIR HORA

                const partesHora =
                    String(match.hora)
                    .split(':');

                // CREAR FECHA LOCAL

                const fechaPartido = new Date(

                    Number(partesFecha[0]),

                    Number(partesFecha[1]) - 1,

                    Number(partesFecha[2]),

                    Number(partesHora[0]),

                    Number(partesHora[1]),

                    0

                );

                // RESTAR 15 MINUTOS

                const limite = new Date(

                    fechaPartido.getTime()

                    - (15 * 60 * 1000)

                );

                const ahora =
                    new Date();


console.log({

    fechaMYSQL: match.fecha,

    horaMYSQL: match.hora,

    fechaTexto,

    partesFecha,

    partesHora,

    fechaPartido,

    limite,

    ahora

});






                // BLOQUEAR

                if (ahora >= limite) {

                    return res.json({

                        ok: false,

                        mensaje:
                            'Las apuestas están cerradas'

                    });

                }

            }

            // =========================
            // VERIFICAR SI YA EXISTE
            // =========================

            const [existe] =
                await pool.query(

                    `SELECT *
                     FROM apuestas
                     WHERE userId=? AND matchId=?`,

                    [
                        userId,
                        matchId
                    ]

                );

            // =========================
            // UPDATE
            // =========================

            if (existe.length > 0) {

                await pool.query(

                    `UPDATE apuestas
                     SET
                     home=?,
                     away=?
                     WHERE userId=? AND matchId=?`,

                    [
                        home,
                        away,
                        userId,
                        matchId
                    ]

                );

            }

            // =========================
            // INSERT
            // =========================

            else {

                await pool.query(

                    `INSERT INTO apuestas
                    (
                        userId,
                        matchId,
                        home,
                        away,
                        puntos,
                        estado
                    )
                    VALUES(?,?,?,?,?,?)`,

                    [
                        userId,
                        matchId,
                        home,
                        away,
                        0,
                        'pendiente'
                    ]

                );

            }

            res.json({

                ok: true,
                mensaje: 'Apuesta guardada'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje: 'Error apuesta'

            });

        }

    }
);


            // =========================
            // INSERT
            // =========================

            else {

                await pool.query(

                    `INSERT INTO apuestas
                    (
                        userId,
                        matchId,
                        home,
                        away,
                        puntos,
                        estado
                    )
                    VALUES(?,?,?,?,?,?)`,

                    [
                        userId,
                        matchId,
                        home,
                        away,
                        0,
                        'pendiente'
                    ]

                );

            }

            res.json({

                ok: true,
                mensaje: 'Apuesta guardada'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje: 'Error apuesta'

            });

        }

    }
);



// ======================================================
// 📊 TABLA PREDICCIONES
// ======================================================

app.get(
    '/tabla',
    verificarToken,
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(

                    `SELECT

                        apuestas.id,

                        users.nombre,

                        CONCAT(
                            matches.homeTeam,
                            ' vs ',
                            matches.awayTeam
                        ) AS partido,

                        CONCAT(
                            apuestas.home,
                            ' - ',
                            apuestas.away
                        ) AS prediccion,

                        CASE

                            WHEN matches.homeResult IS NULL

                            THEN 'Pendiente'

                            ELSE CONCAT(
                                matches.homeResult,
                                ' - ',
                                matches.awayResult
                            )

                        END AS resultadoReal,

                        apuestas.puntos,

                        apuestas.estado

                    FROM apuestas

                    INNER JOIN users
                    ON users.id = apuestas.userId

                    INNER JOIN matches
                    ON matches.id = apuestas.matchId

                    ORDER BY apuestas.id DESC`

                );

            res.json(rows);

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,

                mensaje:
                    'Error tabla'

            });

        }

    }
);



// ======================================================
// 🌍 TABLA DE GRUPOS
// ======================================================

app.get('/grupos', verificarToken, async (req, res) => {

    try {

        const [matches] =
            await pool.query(

                `SELECT *
                FROM matches`

            );

        const grupos = {};

        matches.forEach(m => {

            if (!m.grupo) return;

            if (
                m.homeResult === null ||
                m.awayResult === null
            ) return;

            if (!grupos[m.grupo]) {

                grupos[m.grupo] = {};

            }

            [m.homeTeam, m.awayTeam]
                .forEach(eq => {

                    if (!grupos[m.grupo][eq]) {

                        grupos[m.grupo][eq] = {

                            equipo: eq,

                            pj: 0,
                            pg: 0,
                            pe: 0,
                            pp: 0,

                            gf: 0,
                            gc: 0,
                            dg: 0,

                            pts: 0

                        };

                    }

                });

            const home =
                grupos[m.grupo][m.homeTeam];

            const away =
                grupos[m.grupo][m.awayTeam];

            home.pj++;
            away.pj++;

            home.gf += m.homeResult;
            home.gc += m.awayResult;

            away.gf += m.awayResult;
            away.gc += m.homeResult;

            home.dg =
                home.gf - home.gc;

            away.dg =
                away.gf - away.gc;

            if (m.homeResult > m.awayResult) {

                home.pg++;
                away.pp++;

                home.pts += 3;

            }

            else if (m.homeResult < m.awayResult) {

                away.pg++;
                home.pp++;

                away.pts += 3;

            }

            else {

                home.pe++;
                away.pe++;

                home.pts += 1;
                away.pts += 1;

            }

        });

        // ORDENAR

        Object.keys(grupos).forEach(g => {

            grupos[g] =
                Object.values(grupos[g])

                .sort((a, b) => {

                    if (b.pts !== a.pts)
                        return b.pts - a.pts;

                    if (b.dg !== a.dg)
                        return b.dg - a.dg;

                    return b.gf - a.gf;

                });

        });

        res.json(grupos);

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error grupos'

        });

    }

});

// CARGAR 32VOS //




// ======================================================
// 🏆 RANKING
// ======================================================

app.get('/ranking', verificarToken, async (req, res) => {

    try {

        const [users] =
            await pool.query(

                `SELECT
                id,
                nombre,
                puntos
                FROM users
                ORDER BY puntos DESC`

            );

        res.json(users);

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error ranking'

        });

    }

});




// ======================================================
// 🏆 APOSTAR BRACKET
// ======================================================

app.post(
    '/apostar-bracket',
    verificarToken,
    async (req, res) => {

        try {

            const {
                bracketId,
                ganador
            } = req.body;

            const userId =
                req.session.usuario.id;

            // verificar si ya existe
            const [existe] =
                await pool.query(

                    `SELECT *
                     FROM bracket_apuestas
                     WHERE userId=? AND bracketId=?`,

                    [userId, bracketId]

                );

            if (existe.length > 0) {

                await pool.query(

                    `UPDATE bracket_apuestas
                     SET ganador=?
                     WHERE userId=? AND bracketId=?`,

                    [

                        ganador,
                        userId,
                        bracketId

                    ]

                );

            } else {

                await pool.query(

                    `INSERT INTO bracket_apuestas
                    (
                        userId,
                        bracketId,
                        ganador
                    )
                    VALUES(?,?,?)`,

                    [

                        userId,
                        bracketId,
                        ganador

                    ]

                );

            }

            res.json({

                ok:true,
                mensaje:'Predicción guardada'

            });

        }

        catch(error){

            console.log(error);

            res.status(500).json({

                ok:false,
                mensaje:'Error apuesta bracket'

            });

        }

    }
);



// GENERAR 32VOS //


// ======================================================
// 🏆 GENERAR 32AVOS
// ======================================================

app.post(
    '/generar-32avos',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            // =========================
            // OBTENER PARTIDOS
            // =========================

            const [matches] =
                await pool.query(

                    `SELECT *
                    FROM matches`

                );

            // =========================
            // TABLA DE GRUPOS
            // =========================

            const grupos = {};

            matches.forEach(m => {

                if (!m.grupo) return;

                if (
                    m.homeResult === null ||
                    m.awayResult === null
                ) return;

                if (!grupos[m.grupo]) {

                    grupos[m.grupo] = {};

                }

                // Crear equipos
                [m.homeTeam, m.awayTeam]
                    .forEach(eq => {

                        if (!grupos[m.grupo][eq]) {

                            grupos[m.grupo][eq] = {

                                equipo: eq,

                                pts: 0,
                                dg: 0,
                                gf: 0

                            };

                        }

                    });

                const home =
                    grupos[m.grupo][m.homeTeam];

                const away =
                    grupos[m.grupo][m.awayTeam];

                // Goles
                home.gf += m.homeResult;
                away.gf += m.awayResult;

                home.dg +=
                    m.homeResult - m.awayResult;

                away.dg +=
                    m.awayResult - m.homeResult;

                // Puntos
                if (m.homeResult > m.awayResult) {

                    home.pts += 3;

                }

                else if (
                    m.homeResult < m.awayResult
                ) {

                    away.pts += 3;

                }

                else {

                    home.pts += 1;
                    away.pts += 1;

                }

            });

            // =========================
            // CLASIFICADOS
            // =========================

            let primeros = [];
            let segundos = [];
            let terceros = [];

            Object.keys(grupos).forEach(g => {

                const tabla =
                    Object.values(grupos[g])

                    .sort((a, b) => {

                        if (b.pts !== a.pts)
                            return b.pts - a.pts;

                        if (b.dg !== a.dg)
                            return b.dg - a.dg;

                        return b.gf - a.gf;

                    });

                if (tabla[0])
                    primeros.push(tabla[0]);

                if (tabla[1])
                    segundos.push(tabla[1]);

                if (tabla[2])
                    terceros.push(tabla[2]);

            });

            // =========================
            // 8 MEJORES TERCEROS
            // =========================

            terceros.sort((a, b) => {

                if (b.pts !== a.pts)
                    return b.pts - a.pts;

                if (b.dg !== a.dg)
                    return b.dg - a.dg;

                return b.gf - a.gf;

            });

            terceros =
                terceros.slice(0, 8);

            // =========================
            // CLASIFICADOS
            // =========================

            const clasificados = [

                ...primeros,
                ...segundos,
                ...terceros

            ];

            if (clasificados.length < 32) {

                return res.json({

                    ok: false,

                    mensaje:
                        'Aún no hay suficientes equipos clasificados'

                });

            }

            // =========================
            // LIMPIAR 32AVOS
            // =========================

            await pool.query(

                `DELETE FROM brackets
                WHERE fase='32avos'`

            );

            // =========================
            // CREAR LLAVES
            // =========================

            for (let i = 0; i < 32; i += 2) {

                const eq1 =
                    clasificados[i];

                const eq2 =
                    clasificados[i + 1];

                await pool.query(

                    `INSERT INTO brackets
                    (
                        fase,
                        equipo1,
                        equipo2
                    )
                    VALUES
                    (?, ?, ?)`,

                    [

                        '32avos',
                        eq1.equipo,
                        eq2.equipo

                    ]

                );

            }

            res.json({

                ok: true,
                mensaje:
                    '32avos generados correctamente'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje:
                    'Error generando 32avos'

            });

        }

    }
);


// ======================================================
// 🏆 GENERAR OCTAVOS
// ======================================================

app.post(
    '/generar-octavos',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const [brackets] =
                await pool.query(

                    `SELECT *
                    FROM brackets
                    WHERE fase='32avos'
                    ORDER BY id ASC`

                );

            const ganadores =
                brackets
                    .filter(b => b.ganador)
                    .map(b => b.ganador);

            if (ganadores.length < 16) {

                return res.json({

                    ok: false,
                    mensaje:
                        'Faltan ganadores de 32avos'

                });

            }

            await pool.query(

                `DELETE FROM brackets
                WHERE fase='octavos'`

            );

            for (let i = 0; i < 16; i += 2) {

                await pool.query(

                    `INSERT INTO brackets
                    (
                        fase,
                        equipo1,
                        equipo2
                    )
                    VALUES
                    (?, ?, ?)`,

                    [

                        'octavos',
                        ganadores[i],
                        ganadores[i + 1]

                    ]

                );

            }

            res.json({

                ok: true,
                mensaje:
                    'Octavos generados'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje:
                    'Error octavos'

            });

        }

    }
);


// ======================================================
// 🏆 GENERAR CUARTOS
// ======================================================

app.post(
    '/generar-cuartos',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            // Obtener octavos
            const [octavos] =
                await pool.query(

                    `SELECT *
                     FROM brackets
                     WHERE fase='octavos'
                     ORDER BY id ASC`

                );

            // Validar ganadores
            const ganadores =
                octavos.filter(o => o.ganador);

            if (ganadores.length < 8) {

                return res.json({

                    ok:false,
                    mensaje:'Faltan ganadores en octavos'

                });

            }

            // Limpiar cuartos viejos
            await pool.query(

                `DELETE FROM brackets
                 WHERE fase='cuartos'`

            );

            // Crear cuartos
            for(let i=0; i<8; i+=2){

                await pool.query(

                    `INSERT INTO brackets
                    (
                        fase,
                        equipo1,
                        equipo2
                    )
                    VALUES(?,?,?)`,

                    [

                        'cuartos',

                        ganadores[i].ganador,

                        ganadores[i+1].ganador

                    ]

                );

            }

            res.json({

                ok:true,
                mensaje:'Cuartos generados'

            });

        }

        catch(error){

            console.log(error);

            res.status(500).json({

                ok:false,
                mensaje:'Error generando cuartos'

            });

        }

    }
);


// ======================================================
// 🏆 GENERAR SEMIS
// ======================================================

app.post(
    '/generar-semis',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const [cuartos] =
                await pool.query(

                    `SELECT *
                     FROM brackets
                     WHERE fase='cuartos'
                     ORDER BY id ASC`

                );

            const ganadores =
                cuartos.filter(c => c.ganador);

            if (ganadores.length < 4) {

                return res.json({

                    ok:false,
                    mensaje:'Faltan ganadores en cuartos'

                });

            }

            await pool.query(

                `DELETE FROM brackets
                 WHERE fase='semi'`

            );

            for(let i=0; i<4; i+=2){

                await pool.query(

                    `INSERT INTO brackets
                    (
                        fase,
                        equipo1,
                        equipo2
                    )
                    VALUES(?,?,?)`,

                    [

                        'semi',

                        ganadores[i].ganador,

                        ganadores[i+1].ganador

                    ]

                );

            }

            res.json({

                ok:true,
                mensaje:'Semifinal generada'

            });

        }

        catch(error){

            console.log(error);

            res.status(500).json({

                ok:false,
                mensaje:'Error generando semis'

            });

        }

    }
);



// ======================================================
// 🏆 GENERAR FINAL
// ======================================================

app.post(
    '/generar-final',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const [semis] =
                await pool.query(

                    `SELECT *
                     FROM brackets
                     WHERE fase='semi'
                     ORDER BY id ASC`

                );

            const ganadores =
                semis.filter(s => s.ganador);

            if (ganadores.length < 2) {

                return res.json({

                    ok:false,
                    mensaje:'Faltan ganadores en semifinal'

                });

            }

            await pool.query(

                `DELETE FROM brackets
                 WHERE fase='final'`

            );

            await pool.query(

                `INSERT INTO brackets
                (
                    fase,
                    equipo1,
                    equipo2
                )
                VALUES(?,?,?)`,

                [

                    'final',

                    ganadores[0].ganador,

                    ganadores[1].ganador

                ]

            );

            res.json({

                ok:true,
                mensaje:'Final generada'

            });

        }

        catch(error){

            console.log(error);

            res.status(500).json({

                ok:false,
                mensaje:'Error generando final'

            });

        }

    }
);

// ======================================================
// 🗑️ REINICIAR TORNEO
// ======================================================

app.post(
    '/reiniciar-torneo',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            // =========================
            // LIMPIAR RESULTADOS MATCHES
            // =========================

            await pool.query(

                `UPDATE matches
                 SET
                 homeResult = NULL,
                 awayResult = NULL`

            );

            // =========================
            // LIMPIAR BRACKETS
            // =========================

            await pool.query(

                `UPDATE brackets
                 SET ganador = NULL`

            );

            // =========================
            // BORRAR APUESTAS
            // =========================

            await pool.query(

                `DELETE FROM apuestas`

            );

            // =========================
            // BORRAR APUESTAS BRACKETS
            // =========================

            try {

                await pool.query(

                    `DELETE FROM bracket_apuestas`

                );

            }

            catch (e) {

                console.log(
                    'bracket_apuestas no existe aún'
                );

            }

            // =========================
            // RESET PUNTOS
            // =========================

            await pool.query(

                `UPDATE users
                 SET puntos = 0`

            );

            res.json({

                ok: true,

                mensaje:
                    'Torneo reiniciado correctamente'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,

                mensaje:
                    error.message

            });

        }

    }
);

// ======================================================
// 🏆 REINICIAR BRACKETS
// ======================================================
// ======================================================
// 🏆 REINICIAR BRACKETS
// ======================================================

app.post(
    '/reiniciar-brackets',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            // borrar brackets
            await pool.query(

                `DELETE FROM brackets`

            );

            // borrar apuestas brackets
            try {

                await pool.query(

                    `DELETE FROM bracket_apuestas`

                );

            }

            catch (e) {

                console.log(e);

            }

            res.json({

                ok: true,

                mensaje:
                    'Brackets reiniciados'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,

                mensaje:
                    'Error reiniciando brackets'

            });

        }

    }
);


// ======================================================
// 🔑 RESET PASSWORD
// ======================================================

app.post(
    '/reset-password',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const {
                userId,
                nuevaPassword
            } = req.body;

            const hash =
                await bcrypt.hash(
                    nuevaPassword,
                    10
                );

            await pool.query(

                `UPDATE users
                 SET password=?
                 WHERE id=?`,

                [
                    hash,
                    userId
                ]

            );

            res.json({

                ok: true,

                mensaje:
                    'Contraseña actualizada'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,

                mensaje:
                    'Error reset password'

            });

        }

    }
);

app.delete(
    '/usuario/:id',
    verificarToken,
    soloAdmin,
    async (req, res) => {

        try {

            const { id } = req.params;

            // 🚫 EVITAR BORRARSE A SI MISMO

            if (
                Number(id) === req.session.usuario.id
            ) {

                return res.json({

                    ok: false,

                    mensaje:
                        'No puedes eliminarte'

                });

            }

            // =========================
            // ELIMINAR APUESTAS PARTIDOS
            // =========================

            await pool.query(

                `DELETE FROM apuestas
                 WHERE userId=?`,

                [id]

            );

            // =========================
            // ELIMINAR APUESTAS BRACKETS
            // =========================

            await pool.query(

                `DELETE FROM bracket_apuestas
                 WHERE userId=?`,

                [id]

            );

            // =========================
            // ELIMINAR USUARIO
            // =========================

            await pool.query(

                `DELETE FROM users
                 WHERE id=?`,

                [id]

            );

            res.json({

                ok: true,
                mensaje: 'Usuario eliminado'

            });

        }

        catch (error) {

            console.log(error);

            res.status(500).json({

                ok: false,
                mensaje:
                    'Error eliminando usuario'

            });

        }

    }
);




// ======================================================
// START
// ======================================================

app.listen(PORT, () => {

    console.log(
        `Servidor corriendo en puerto ${PORT}`
    );

});

