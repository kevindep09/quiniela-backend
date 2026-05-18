
const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrar() {

    const pool = mysql.createPool({

        host: 'localhost',

        user: 'root',

        password: '',

        database: 'quiniela'

    });

    const matches =
        JSON.parse(
            fs.readFileSync(
                './matches.json',
                'utf8'
            )
        );

    for (const m of matches) {

        await pool.query(

            `INSERT INTO matches
            (grupo,homeTeam,awayTeam,fecha,hora,homeResult,awayResult)
            VALUES(?,?,?,?,?,?,?)`,

            [

                m.grupo || null,

                m.homeTeam,

                m.awayTeam,

                m.fecha || null,

                m.hora || null,

                m.resultado?.home ?? null,

                m.resultado?.away ?? null

            ]

        );

    }

    console.log('✅ Partidos migrados');

    process.exit();

}

migrar();

