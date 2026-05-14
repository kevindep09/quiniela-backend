const express = require('express');
const db = require("./db");
const fs = require('fs');
const session = require('express-session');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const verificarToken =
require('./middleware/auth');
require('dotenv').config();

const app = express();
app.use(express.json());
const PORT = 3000;
app.get("/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error en MySQL");
    } else {
      res.json(results);
    }
  });
});

// =======================
// 🔧 MIDDLEWARES
// =======================

app.use(express.json());

app.use(session({

    secret: 'quiniela-secreta',

    resave: false,

    saveUninitialized: false,

    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax'
    }

}));

app.use(express.static('public'));

app.use((req, res, next) => {

    res.setHeader('Cache-Control', 'no-store');

    next();

});

// =======================
// 📂 LEER JSON
// =======================

function leerJSON(ruta) {

    try {

        return JSON.parse(
            fs.readFileSync(ruta, 'utf8')
        );

    } catch {

        return [];

    }

}

// =======================
// 💾 GUARDAR JSON
// =======================

function guardarJSON(ruta, data) {

    fs.writeFileSync(
        ruta,
        JSON.stringify(data, null, 2)
    );

}

// =======================
// 🔢 OBTENER NUEVO ID
// =======================

function obtenerNuevoId(lista) {

    if (!lista.length) return 1;

    return Math.max(
        ...lista.map(i => Number(i.id) || 0)
    ) + 1;

}

// =======================
// 🔐 VERIFICAR LOGIN
// =======================

function verificarLogin(req, res, next) {

    if (!req.session.user) {

        return res.status(401).json({

            ok: false,
            mensaje: 'No autenticado'

        });

    }

    next();

}

// =======================
// 🔐 SOLO ADMIN
// =======================

function soloAdmin(req, res, next) {

    if (
        !req.session.user ||
        req.session.user.rol !== 'admin'
    ) {

        return res.status(403).json({

            ok: false,
            mensaje: 'No autorizado'

        });

    }

    next();

}

// =======================
// 🧮 CALCULAR TABLA
// =======================

function calcularGrupos() {

    const matches =
        leerJSON('./data/matches.json');

    let grupos = {};

    matches.forEach(m => {

        if (!m.grupo) return;

        if (!grupos[m.grupo]) {

            grupos[m.grupo] = {};

        }

        if (!grupos[m.grupo][m.homeTeam]) {

            grupos[m.grupo][m.homeTeam] = {

                equipo: m.homeTeam,
                grupo: m.grupo,
                pts: 0,
                gf: 0,
                gc: 0,
                dg: 0

            };

        }

        if (!grupos[m.grupo][m.awayTeam]) {

            grupos[m.grupo][m.awayTeam] = {

                equipo: m.awayTeam,
                grupo: m.grupo,
                pts: 0,
                gf: 0,
                gc: 0,
                dg: 0

            };

        }

        if (
            m.resultado.home === null ||
            m.resultado.away === null
        ) return;

        const home =
            grupos[m.grupo][m.homeTeam];

        const away =
            grupos[m.grupo][m.awayTeam];

        home.gf += m.resultado.home;
        home.gc += m.resultado.away;

        away.gf += m.resultado.away;
        away.gc += m.resultado.home;

        home.dg = home.gf - home.gc;
        away.dg = away.gf - away.gc;

        if (m.resultado.home > m.resultado.away) {

            home.pts += 3;

        }

        else if (m.resultado.home < m.resultado.away) {

            away.pts += 3;

        }

        else {

            home.pts += 1;
            away.pts += 1;

        }

    });

    return grupos;

}

// =======================
// 🔐 LOGIN
// =======================

app.post('/login', (req, res) => {

    const { nombre, password } = req.body;

    db.query(
        'SELECT * FROM usuarios WHERE usuario = ?',
        [nombre],
        async (err, results) => {

            if (err) {

                return res.json({
                    ok: false,
                    mensaje: 'Error MySQL'
                });

            }

            if (results.length === 0) {

                return res.json({
                    ok: false,
                    mensaje: 'Usuario no encontrado'
                });

            }

            const usuario = results[0];

            const passwordCorrecta =
                await bcrypt.compare(
                    password,
                    usuario.password
                );

            if (!passwordCorrecta) {

                return res.json({
                    ok: false,
                    mensaje: 'Password incorrecta'
                });

            }

            const token = jwt.sign(

                {
                    id: usuario.id,
                    usuario: usuario.usuario,
                    rol: usuario.rol
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: '7d'
                }

            );

            res.json({

                ok: true,
                mensaje: 'Login correcto ✅',
                token

            });

        }
    );

});

app.get(
    '/perfil',
    verificarToken,
    (req, res) => {

        res.json({

            ok: true,
            mensaje: 'Ruta privada ✅',

            usuario: req.usuario

        });

    }
);
// =======================
// 👤 SESSION
// =======================

app.get('/session', (req, res) => {

    res.json({

        user: req.session.user || null

    });

});

// =======================
// 🚪 LOGOUT
// =======================

app.post('/logout', (req, res) => {

    req.session.destroy(() => {

        res.json({
            ok: true
        });

    });

});

// =======================
// ⚽ MATCHES
// =======================

app.get('/matches', verificarLogin, (req, res) => {

    let matches =
        leerJSON('./data/matches.json');

    matches.sort((a, b) => {

        if (a.grupo < b.grupo) return -1;
        if (a.grupo > b.grupo) return 1;

        const fechaA =
            new Date(`${a.fecha || ''} ${a.hora || ''}`);

        const fechaB =
            new Date(`${b.fecha || ''} ${b.hora || ''}`);

        return fechaA - fechaB;

    });

    res.json(matches);

});

// =======================
// 🌍 GRUPOS
// =======================

app.get('/grupos', verificarLogin, (req, res) => {

    const matches =
        leerJSON('./data/matches.json');

    let grupos = {};

    matches.forEach(m => {

        if (!m.grupo) return;

        if (!grupos[m.grupo]) {

            grupos[m.grupo] = {};

        }

        // CREAR EQUIPO LOCAL
        if (!grupos[m.grupo][m.homeTeam]) {

            grupos[m.grupo][m.homeTeam] = {

                equipo: m.homeTeam,

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

        // CREAR EQUIPO VISITANTE
        if (!grupos[m.grupo][m.awayTeam]) {

            grupos[m.grupo][m.awayTeam] = {

                equipo: m.awayTeam,

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

        // IGNORAR SI NO HAY RESULTADO
        if (
            m.resultado.home === null ||
            m.resultado.away === null
        ) return;

        const home =
            grupos[m.grupo][m.homeTeam];

        const away =
            grupos[m.grupo][m.awayTeam];

        // PARTIDOS JUGADOS
        home.pj++;
        away.pj++;

        // GOLES
        home.gf += Number(m.resultado.home);
        home.gc += Number(m.resultado.away);

        away.gf += Number(m.resultado.away);
        away.gc += Number(m.resultado.home);

        // DIFERENCIA
        home.dg = home.gf - home.gc;
        away.dg = away.gf - away.gc;

        // GANADOS / EMPATADOS / PERDIDOS
        if (m.resultado.home > m.resultado.away) {

            home.pg++;
            away.pp++;

            home.pts += 3;

        }

        else if (m.resultado.home < m.resultado.away) {

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

    // ORDENAR TABLAS
    const gruposOrdenados = {};

    Object.keys(grupos)
        .sort()
        .forEach(g => {

            gruposOrdenados[g] =
                Object.values(grupos[g])
                    .sort((a, b) => {

                        return (

                            b.pts - a.pts ||

                            b.dg - a.dg ||

                            b.gf - a.gf

                        );

                    });

        });

    res.json(gruposOrdenados);

});

// =======================
// 📝 APOSTAR
// =======================


app.post('/apostar', verificarLogin, (req, res) => {

    try {

        const {
            matchId,
            home,
            away
        } = req.body;

        let predictions =
            leerJSON('./data/predictions.json');

        let matches =
            leerJSON('./data/matches.json');

        const partido = matches.find(
            m => m.id === parseInt(matchId)
        );

        // ❌ Partido no existe
        if (!partido) {

            return res.json({

                ok: false,
                mensaje: 'Partido no encontrado'

            });

        }

        // =======================
        // ⛔ BLOQUEAR APUESTAS
        // 15 MIN ANTES
        // =======================

        if (
            partido.fecha &&
            partido.hora
        ) {

            const fechaPartido =
                new Date(
                    `${partido.fecha}T${partido.hora}:00`
                );

            // cerrar 15 minutos antes
            fechaPartido.setMinutes(
                fechaPartido.getMinutes() - 15
            );

            const ahora =
                new Date();

            if (ahora >= fechaPartido) {

                return res.json({

                    ok: false,

                    mensaje:
                        '⛔ Las apuestas para este partido ya fueron cerradas'

                });

            }

        }

        // =======================
        // 🔍 VALIDAR GOLES
        // =======================

        const golesHome =
            parseInt(home);

        const golesAway =
            parseInt(away);

        if (
            isNaN(golesHome) ||
            isNaN(golesAway)
        ) {

            return res.json({

                ok: false,

                mensaje:
                    'Debes ingresar goles válidos'

            });

        }

        // =======================
        // ✏️ ACTUALIZAR APUESTA
        // =======================

        const existe = predictions.find(

            p =>

                p.userId === req.session.user.id

                &&

                p.matchId === parseInt(matchId)

        );

        if (existe) {

            existe.resultado = {

                home: golesHome,
                away: golesAway

            };

            guardarJSON(
                './data/predictions.json',
                predictions
            );

            return res.json({

                ok: true,

                mensaje:
                    'Apuesta actualizada ✏️'

            });

        }

        // =======================
        // ✅ NUEVA APUESTA
        // =======================

        predictions.push({

            userId:
                req.session.user.id,

            matchId:
                parseInt(matchId),

            resultado: {

                home: golesHome,
                away: golesAway

            }

        });

        guardarJSON(
            './data/predictions.json',
            predictions
        );

        res.json({

            ok: true,

            mensaje:
                'Apuesta guardada ✅'

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,

            mensaje:
                'Error guardando apuesta'

        });

    }

});

// =======================
// 🛠 CREAR PARTIDO
// =======================

app.post('/crear-partido', soloAdmin, (req, res) => {

    const {
        grupo,
        homeTeam,
        awayTeam,
        fecha,
        hora
    } = req.body;

    let matches =
        leerJSON('./data/matches.json');

    matches.push({

        id: obtenerNuevoId(matches),

        grupo,
        homeTeam,
        awayTeam,
        fecha,
        hora,

        resultado: {
            home: null,
            away: null
        }

    });

    guardarJSON(
        './data/matches.json',
        matches
    );

    res.json({
        mensaje: 'Partido creado ✅'
    });

});

// =======================
// 💾 GUARDAR RESULTADO
// =======================

app.post('/resultado', soloAdmin, (req, res) => {

    const {
        matchId,
        home,
        away
    } = req.body;

    let matches =
        leerJSON('./data/matches.json');

    const partido = matches.find(
        m => m.id === parseInt(matchId)
    );

    if (!partido) {

        return res.json({
            mensaje: 'Partido no encontrado'
        });

    }

    partido.resultado = {
        home: parseInt(home),
        away: parseInt(away)
    };

    guardarJSON(
        './data/matches.json',
        matches
    );

    res.json({
        mensaje: 'Resultado guardado ✅'
    });

});

// =======================
// ✏️ EDITAR PARTIDO
// =======================

app.post('/editar-partido', soloAdmin, (req, res) => {

    const {
        id,
        fecha,
        hora
    } = req.body;

    let matches =
        leerJSON('./data/matches.json');

    let brackets =
        leerJSON('./data/brackets.json');

    const partido = matches.find(
        m => m.id === parseInt(id)
    );

    const bracket = brackets.find(
        b => b.id === parseInt(id)
    );

    if (partido) {

        partido.fecha = fecha;
        partido.hora = hora;

        guardarJSON(
            './data/matches.json',
            matches
        );

        return res.json({
            mensaje: 'Partido actualizado ✅'
        });

    }

    if (bracket) {

        bracket.fecha = fecha;
        bracket.hora = hora;

        guardarJSON(
            './data/brackets.json',
            brackets
        );

        return res.json({
            mensaje: 'Llave actualizada ✅'
        });

    }

    res.json({
        mensaje: 'No encontrado'
    });

});

// =======================
// ❌ ELIMINAR PARTIDO
// =======================

app.delete('/eliminar-partido/:id', soloAdmin, (req, res) => {

    let matches =
        leerJSON('./data/matches.json');

    const id =
        parseInt(req.params.id);

    matches = matches.filter(
        m => m.id !== id
    );

    guardarJSON(
        './data/matches.json',
        matches
    );

    res.json({
        mensaje: 'Partido eliminado ❌'
    });

});

// =======================
// 🏆 BRACKETS
// =======================

app.get('/brackets', verificarLogin, (req, res) => {

    const brackets =
        leerJSON('./data/brackets.json');

    res.json(brackets);

});

// =======================
// ➕ CREAR BRACKET
// =======================

app.post('/crear-bracket', soloAdmin, (req, res) => {

    try {

        const {

            fase,
            equipo1,
            equipo2,
            fecha,
            hora

        } = req.body;

        let brackets =
            leerJSON('./data/brackets.json');

        const nuevo = {

            id: obtenerNuevoId(brackets),

            fase,

            equipo1,
            equipo2,

            fecha,
            hora,

            ganador: null

        };

        brackets.push(nuevo);

        guardarJSON(
            './data/brackets.json',
            brackets
        );

        res.json({

            ok: true,
            mensaje: 'Llave creada ✅'

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            ok: false,
            mensaje: 'Error creando llave'

        });

    }

});

// =======================
// 💾 RESULTADO BRACKET
// =======================

app.post('/resultado-bracket', soloAdmin, (req, res) => {

    const {
        id,
        ganador
    } = req.body;

    let brackets =
        leerJSON('./data/brackets.json');

    const bracket = brackets.find(
        b => b.id === parseInt(id)
    );

    if (!bracket) {

        return res.json({
            mensaje: 'Llave no encontrada'
        });

    }

    bracket.ganador = ganador;

    guardarJSON(
        './data/brackets.json',
        brackets
    );

    res.json({
        mensaje: 'Ganador guardado ✅'
    });

});

// =======================
// ❌ ELIMINAR BRACKET
// =======================

app.delete('/eliminar-bracket/:id', soloAdmin, (req, res) => {

    let brackets =
        leerJSON('./data/brackets.json');

    const id =
        parseInt(req.params.id);

    brackets = brackets.filter(
        b => b.id !== id
    );

    guardarJSON(
        './data/brackets.json',
        brackets
    );

    res.json({
        mensaje: 'Llave eliminada ❌'
    });

});

// =======================
// 🏆 GENERAR 32AVOS
// =======================

app.post('/generar-32avos', soloAdmin, (req, res) => {

    try {

        let brackets =
            leerJSON('./data/brackets.json');

        const existe = brackets.find(
            b => b.fase === '32avos'
        );

        if (existe) {

            return res.json({
                mensaje: 'Los 32avos ya existen'
            });

        }

        const grupos =
            calcularGrupos();

        let primeros = [];
        let segundos = [];
        let terceros = [];

        Object.keys(grupos)
            .sort()
            .forEach(g => {

                const tabla =
                    Object.values(grupos[g])
                    .sort((a, b) => {

                        return (
                            b.pts - a.pts ||
                            b.dg - a.dg ||
                            b.gf - a.gf
                        );

                    });

                if (tabla[0]) primeros.push(tabla[0]);
                if (tabla[1]) segundos.push(tabla[1]);
                if (tabla[2]) terceros.push(tabla[2]);

            });

        terceros.sort((a, b) => {

            return (
                b.pts - a.pts ||
                b.dg - a.dg ||
                b.gf - a.gf
            );

        });

        const mejoresTerceros =
            terceros.slice(0, 8);

        const clasificados = [

            ...primeros,
            ...segundos,
            ...mejoresTerceros

        ];

        let nuevos = [];

        for (let i = 0; i < 16; i++) {

            nuevos.push({

                id: obtenerNuevoId([
                    ...brackets,
                    ...nuevos
                ]),

                fase: '32avos',

                equipo1:
                    clasificados[i].equipo,

                equipo2:
                    clasificados[
                        clasificados.length - 1 - i
                    ].equipo,

                ganador: null,

                fecha: '',
                hora: ''

            });

        }

        brackets.push(...nuevos);

        guardarJSON(
            './data/brackets.json',
            brackets
        );

        res.json({
            mensaje: '32avos generados ✅'
        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error generando 32avos'
        });

    }

});

// =======================
// 🏆 GENERAR OCTAVOS
// =======================

app.post('/generar-octavos', soloAdmin, (req, res) => {

    try {

        let brackets =
            leerJSON('./data/brackets.json');

        const yaExiste = brackets.find(
            b => b.fase === 'Octavos'
        );

        if (yaExiste) {

            return res.json({
                mensaje: 'Los octavos ya existen'
            });

        }

        const ganadores =
            brackets
                .filter(
                    b =>
                        b.fase === '32avos' &&
                        b.ganador
                )
                .map(b => b.ganador);

        if (ganadores.length < 16) {

            return res.json({
                mensaje: 'Faltan ganadores en 32avos'
            });

        }

        for (let i = 0; i < 8; i++) {

            brackets.push({

                id: obtenerNuevoId(brackets),

                fase: 'Octavos',

                equipo1: ganadores[i * 2],

                equipo2: ganadores[i * 2 + 1],

                ganador: null,

                fecha: '',
                hora: ''

            });

        }

        guardarJSON(
            './data/brackets.json',
            brackets
        );

        res.json({
            mensaje: 'Octavos generados ✅'
        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error generando octavos'
        });

    }

});

// =======================
// 🏆 GENERAR CUARTOS
// =======================

app.post('/generar-cuartos', soloAdmin, (req, res) => {

    try {

        let brackets =
            leerJSON('./data/brackets.json');

        const yaExiste = brackets.find(
            b => b.fase === 'Cuartos'
        );

        if (yaExiste) {

            return res.json({
                mensaje: 'Los cuartos ya existen'
            });

        }

        const ganadores =
            brackets
                .filter(
                    b =>
                        b.fase === 'Octavos' &&
                        b.ganador
                )
                .map(b => b.ganador);

        if (ganadores.length < 8) {

            return res.json({
                mensaje: 'Faltan ganadores en octavos'
            });

        }

        for (let i = 0; i < 4; i++) {

            brackets.push({

                id: obtenerNuevoId(brackets),

                fase: 'Cuartos',

                equipo1: ganadores[i * 2],

                equipo2: ganadores[i * 2 + 1],

                ganador: null,

                fecha: '',
                hora: ''

            });

        }

        guardarJSON(
            './data/brackets.json',
            brackets
        );

        res.json({
            mensaje: 'Cuartos generados ✅'
        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error generando cuartos'
        });

    }

});

// =======================
// 🏆 GENERAR SEMIS
// =======================

app.post('/generar-semis', soloAdmin, (req, res) => {

    try {

        let brackets =
            leerJSON('./data/brackets.json');

        const yaExiste = brackets.find(
            b => b.fase === 'Semis'
        );

        if (yaExiste) {

            return res.json({
                mensaje: 'Las semis ya existen'
            });

        }

        const ganadores =
            brackets
                .filter(
                    b =>
                        b.fase === 'Cuartos' &&
                        b.ganador
                )
                .map(b => b.ganador);

        if (ganadores.length < 4) {

            return res.json({
                mensaje: 'Faltan ganadores en cuartos'
            });

        }

        for (let i = 0; i < 2; i++) {

            brackets.push({

                id: obtenerNuevoId(brackets),

                fase: 'Semis',

                equipo1: ganadores[i * 2],

                equipo2: ganadores[i * 2 + 1],

                ganador: null,

                fecha: '',
                hora: ''

            });

        }

        guardarJSON(
            './data/brackets.json',
            brackets
        );

        res.json({
            mensaje: 'Semis generadas ✅'
        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error generando semis'
        });

    }

});

// =======================
// 🏆 GENERAR FINAL
// =======================

app.post('/generar-final', soloAdmin, (req, res) => {

    try {

        let brackets =
            leerJSON('./data/brackets.json');

        const yaExiste = brackets.find(
            b => b.fase === 'Final'
        );

        if (yaExiste) {

            return res.json({
                mensaje: 'La final ya existe'
            });

        }

        const ganadores =
            brackets
                .filter(
                    b =>
                        b.fase === 'Semis' &&
                        b.ganador
                )
                .map(b => b.ganador);

        if (ganadores.length < 2) {

            return res.json({
                mensaje: 'Faltan ganadores en semis'
            });

        }

        brackets.push({

            id: obtenerNuevoId(brackets),

            fase: 'Final',

            equipo1: ganadores[0],

            equipo2: ganadores[1],

            ganador: null,

            fecha: '',
            hora: ''

        });

        guardarJSON(
            './data/brackets.json',
            brackets
        );

        res.json({
            mensaje: 'Final generada ✅'
        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: 'Error generando final'
        });

    }

});

// =======================
// 🚀 SERVER
// =======================

app.listen(process.env.PORT || 3000, () => {

    console.log(
        'Servidor en http://localhost:3000'
    );

});