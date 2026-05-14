// =======================
// 🔐 VALIDAR ADMIN
// =======================
const usuario = JSON.parse(
    localStorage.getItem('usuario')
);

if (
    !usuario ||
    usuario.rol !== 'admin'
) {

    window.location.href =
        '/login.html';

}

// =======================
// 🚪 LOGOUT
// =======================
const logoutBtn =
    document.getElementById('logoutBtn');

if (logoutBtn) {

    logoutBtn.addEventListener(
        'click',
        async () => {

            try {

                await fetch('/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

            } catch (error) {

                console.log(error);

            }

            localStorage.removeItem('usuario');

            window.location.href =
                '/login.html';

        }
    );

}

// =======================
// 🔄 CARGAR ADMIN
// =======================
async function cargarAdmin() {

    try {

        // =======================
        // ⚽ PARTIDOS
        // =======================
        const resMatches = await fetch(
            '/matches',
            {
                credentials: 'include'
            }
        );

        const matches =
            await resMatches.json();

        const tbody =
            document.getElementById(
                'adminTabla'
            );

        tbody.innerHTML = '';

        matches.forEach(m => {

            tbody.innerHTML += `

                <tr>

                    <td>${m.id}</td>

                    <td>${m.grupo || '-'}</td>

                    <td>
                        ${m.homeTeam}
                        vs
                        ${m.awayTeam}
                    </td>

                    <td>

                        <input
                            type="date"
                            id="fecha-${m.id}"
                            value="${m.fecha || ''}"
                        >

                    </td>

                    <td>

                        <input
                            type="time"
                            id="hora-${m.id}"
                            value="${m.hora || ''}"
                        >

                    </td>

                    <td>

                        <input
                            type="number"
                            id="home-${m.id}"
                            value="${m.resultado?.home ?? ''}"
                            style="width:60px"
                        >

                        -

                        <input
                            type="number"
                            id="away-${m.id}"
                            value="${m.resultado?.away ?? ''}"
                            style="width:60px"
                        >

                    </td>

                    <td>

                        <button
                            onclick="guardarResultado(${m.id})"
                        >
                            💾 Resultado
                        </button>

                        <button
                            onclick="guardarFechaHora(${m.id})"
                        >
                            🕒 Fecha
                        </button>

                        <button
                            onclick="eliminarPartido(${m.id})"
                        >
                            ❌
                        </button>

                    </td>

                </tr>

            `;

        });

        // =======================
        // 🏆 BRACKETS
        // =======================
        const resBrackets = await fetch(
            '/brackets',
            {
                credentials: 'include'
            }
        );

        const brackets =
            await resBrackets.json();

        const tablaBrackets =
            document.getElementById(
                'tablaBrackets'
            );

        tablaBrackets.innerHTML = '';

        brackets.forEach(b => {

            tablaBrackets.innerHTML += `

                <tr>

                    <td>${b.id}</td>

                    <td>${b.fase}</td>

                    <td>
                        ${b.equipo1}
                        vs
                        ${b.equipo2}
                    </td>

                    <td>

                        <input
                            type="date"
                            id="fecha-bracket-${b.id}"
                            value="${b.fecha || ''}"
                        >

                    </td>

                    <td>

                        <input
                            type="time"
                            id="hora-bracket-${b.id}"
                            value="${b.hora || ''}"
                        >

                    </td>

                    <td>

                        <select
                            id="ganador-${b.id}"
                        >

                            <option value="">
                                Seleccionar
                            </option>

                            <option
                                value="${b.equipo1}"
                                ${b.ganador === b.equipo1 ? 'selected' : ''}
                            >
                                ${b.equipo1}
                            </option>

                            <option
                                value="${b.equipo2}"
                                ${b.ganador === b.equipo2 ? 'selected' : ''}
                            >
                                ${b.equipo2}
                            </option>

                        </select>

                    </td>

                    <td>

                        <button
                            onclick="guardarGanador(${b.id})"
                        >
                            💾 Ganador
                        </button>

                        <button
                            onclick="guardarBracketFechaHora(${b.id})"
                        >
                            🕒 Fecha
                        </button>

                        <button
                            onclick="eliminarBracket(${b.id})"
                        >
                            ❌
                        </button>

                    </td>

                </tr>

            `;

        });

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 💾 GUARDAR FECHA/HORA
// =======================
async function guardarFechaHora(id) {

    try {

        const fecha =
            document.getElementById(
                `fecha-${id}`
            ).value;

        const hora =
            document.getElementById(
                `hora-${id}`
            ).value;

        const res = await fetch(
            '/editar-partido',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({

                    id,
                    fecha,
                    hora

                })

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 💾 GUARDAR FECHA/HORA BRACKET
// =======================
async function guardarBracketFechaHora(id) {

    try {

        const fecha =
            document.getElementById(
                `fecha-bracket-${id}`
            ).value;

        const hora =
            document.getElementById(
                `hora-bracket-${id}`
            ).value;

        const res = await fetch(
            '/editar-bracket',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({

                    id,
                    fecha,
                    hora

                })

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 💾 RESULTADO
// =======================
async function guardarResultado(id) {

    try {

        const home =
            document.getElementById(
                `home-${id}`
            ).value;

        const away =
            document.getElementById(
                `away-${id}`
            ).value;

        const res = await fetch(
            '/resultado',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({

                    matchId: id,
                    home,
                    away

                })

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ❌ ELIMINAR PARTIDO
// =======================
async function eliminarPartido(id) {

    try {

        if (
            !confirm(
                '¿Eliminar partido?'
            )
        ) return;

        const res = await fetch(
            '/eliminar-partido/' + id,
            {

                method: 'DELETE',

                credentials: 'include'

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 🏆 GUARDAR GANADOR
// =======================
async function guardarGanador(id) {

    try {

        const ganador =
            document.getElementById(
                `ganador-${id}`
            ).value;

        if (!ganador) {

            alert(
                'Selecciona ganador'
            );

            return;

        }

        const res = await fetch(
            '/resultado-bracket',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({

                    id,
                    ganador

                })

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ❌ ELIMINAR BRACKET
// =======================
async function eliminarBracket(id) {

    try {

        if (
            !confirm(
                '¿Eliminar llave?'
            )
        ) return;

        const res = await fetch(
            '/eliminar-bracket/' + id,
            {

                method: 'DELETE',

                credentials: 'include'

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ➕ CREAR PARTIDO
// =======================
async function crearPartido() {

    try {

        const grupo =
            document.getElementById(
                'grupo'
            ).value;

        const homeTeam =
            document.getElementById(
                'homeTeam'
            ).value;

        const awayTeam =
            document.getElementById(
                'awayTeam'
            ).value;

        const fecha =
            document.getElementById(
                'fecha'
            ).value;

        const hora =
            document.getElementById(
                'hora'
            ).value;

        const res = await fetch(
            '/crear-partido',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({

                    grupo,
                    homeTeam,
                    awayTeam,
                    fecha,
                    hora

                })

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ➕ CREAR BRACKET
// =======================
async function crearBracket() {

    try {

        const fase =
            document.getElementById(
                'fase'
            ).value;

        const equipo1 =
            document.getElementById(
                'eq1'
            ).value;

        const equipo2 =
            document.getElementById(
                'eq2'
            ).value;

        const fecha =
            document.getElementById(
                'fechaBracket'
            ).value;

        const hora =
            document.getElementById(
                'horaBracket'
            ).value;

        const res = await fetch(
            '/crear-bracket',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({

                    fase,
                    equipo1,
                    equipo2,
                    fecha,
                    hora

                })

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ⚙️ GENERAR 32AVOS
// =======================
async function generar32avos() {

    try {

        const res = await fetch(
            '/generar-32avos',
            {

                method: 'POST',

                credentials: 'include'

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ⚙️ GENERAR OCTAVOS
// =======================
async function generarOctavos() {

    try {

        const res = await fetch(
            '/generar-octavos',
            {

                method: 'POST',

                credentials: 'include'

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ⚙️ GENERAR CUARTOS
// =======================
async function generarCuartos() {

    try {

        const res = await fetch(
            '/generar-cuartos',
            {

                method: 'POST',

                credentials: 'include'

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ⚙️ GENERAR SEMIS
// =======================
async function generarSemis() {

    try {

        const res = await fetch(
            '/generar-semis',
            {

                method: 'POST',

                credentials: 'include'

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ⚙️ GENERAR FINAL
// =======================
async function generarFinal() {

    try {

        const res = await fetch(
            '/generar-final',
            {

                method: 'POST',

                credentials: 'include'

            }
        );

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// 🚀 INIT
cargarAdmin();