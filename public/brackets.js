
// =======================
// 🏆 CARGAR BRACKETS
// =======================

async function cargarBrackets() {

    try {

        const res = await fetch('/brackets', {

            credentials: 'include'

        });

        const brackets = await res.json();

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

        treintaidos.innerHTML = '';
        octavos.innerHTML = '';
        cuartos.innerHTML = '';
        semis.innerHTML = '';
        final.innerHTML = '';

        brackets.forEach(b => {

const html = `

<div class="match">

    <div class="match-team">
        ${b.equipo1}
    </div>

    <div class="match-divider"></div>

    <div class="match-team">
        ${b.equipo2}
    </div>

    <select
        class="bracket-select"
        onchange="apostarBracket(${b.id}, this.value)"
    >

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

    <div class="match-winner">

        🏆 ${b.ganador || 'Pendiente'}

    </div>

</div>

`;
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

        console.log(error);

    }

}

async function apostarBracket(bracketId, ganador) {

    try {

        const res =
            await fetch('/apostar-bracket', {

                method: 'POST',

                credentials: 'include',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body: JSON.stringify({

                    bracketId,
                    ganador

                })

            });

        const data =
            await res.json();

        alert(data.mensaje);

    }

    catch (error) {

        console.log(error);

    }

}







window.addEventListener(
    'DOMContentLoaded',
    cargarBrackets
);

