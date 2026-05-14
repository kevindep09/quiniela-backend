// =======================
// 🏆 CARGAR BRACKETS FIFA
// =======================
async function cargarBrackets() {

    try {

        const res = await fetch(
            '/brackets?t=' + Date.now()
        );

        const brackets = await res.json();

        // =======================
        // CONTENEDORES
        // =======================
        const treintaidos =
            document.getElementById('treintaidos');

        const octavos =
            document.getElementById('octavos');

        const cuartos =
            document.getElementById('cuartos');

        const semis =
            document.getElementById('semis');

        const final =
            document.getElementById('final');

        if (
            !treintaidos ||
            !octavos ||
            !cuartos ||
            !semis ||
            !final
        ) {
            return;
        }

        // =======================
        // LIMPIAR
        // =======================
        treintaidos.innerHTML = '';
        octavos.innerHTML = '';
        cuartos.innerHTML = '';
        semis.innerHTML = '';
        final.innerHTML = '';

        // =======================
        // CREAR MATCH
        // =======================
        brackets.forEach(b => {

            const ganadorReal =
                b.ganador
                    ? `<div class="winner">
                        🏆 ${b.ganador}
                       </div>`
                    : '';

            const html = `

                <div class="
                    match
                    ${b.fase === 'final'
                        ? 'final-card'
                        : ''
                    }
                ">

                    <div class="team">

                        <span>
                            ${b.equipo1}
                        </span>

                    </div>

                    <div class="team">

                        <span>
                            ${b.equipo2}
                        </span>

                    </div>

                    <select id="bracket-${b.id}">

                        <option value="">
                            Elegir ganador
                        </option>

                        <option value="${b.equipo1}">
                            ${b.equipo1}
                        </option>

                        <option value="${b.equipo2}">
                            ${b.equipo2}
                        </option>

                    </select>

                    <button onclick="
                        apostarBracket(${b.id})
                    ">
                        Apostar
                    </button>

                    ${ganadorReal}

                </div>
            `;

            // =======================
            // FASES
            // =======================
            if (b.fase === '32avos') {

                treintaidos.innerHTML += html;

            }

            else if (b.fase === 'octavos') {

                octavos.innerHTML += html;

            }

            else if (b.fase === 'cuartos') {

                cuartos.innerHTML += html;

            }

            else if (b.fase === 'semi') {

                semis.innerHTML += html;

            }

            else if (b.fase === 'final') {

                final.innerHTML += html;

            }

        });

    }

    catch (error) {

        console.log(
            'Error brackets:',
            error
        );

    }
}

// =======================
// 🏆 APOSTAR LLAVE
// =======================
async function apostarBracket(id) {

    try {

        const nombre =
            document.getElementById('nombre').value;

        const ganador =
            document.getElementById(
                `bracket-${id}`
            ).value;

        if (!nombre) {

            alert('Escribe tu nombre');

            return;
        }

        if (!ganador) {

            alert(
                'Selecciona un ganador'
            );

            return;
        }

        const res = await fetch(
            '/apostar-bracket',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({

                    nombre,

                    bracketId: id,

                    ganador

                })

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        // 🔄 RECARGAR
        await cargarBrackets();

        if (
            typeof cargarRanking
            === 'function'
        ) {

            await cargarRanking();

        }

    }

    catch (error) {

        console.log(
            'Error apostar bracket:',
            error
        );

    }
}

// =======================
// 🚀 INIT
// =======================
window.addEventListener(
    'DOMContentLoaded',

    async () => {

        await cargarBrackets();

        // AUTO REFRESH
        setInterval(async () => {

            await cargarBrackets();

        }, 5000);

    }
);