// =======================
// 🔐 VALIDAR ADMIN
// =======================

async function validarAdmin() {

    try {

        const res =
            await fetch('/session', {

                credentials: 'include'

            });

        const data =
            await res.json();

        if (
            !data.user ||
            data.user.rol !== 'admin'
        ) {

            window.location.href =
                '/login.html';

            return false;

        }

        localStorage.setItem(
            'usuario',
            JSON.stringify(data.user)
        );

        return true;

    }

    catch (error) {

        console.log(error);

        window.location.href =
            '/login.html';

        return false;

    }

}

// =======================
// 🚪 LOGOUT
// =======================

async function logout() {

    try {

        await fetch('/logout', {

            method: 'POST',

            credentials: 'include'

        });

        localStorage.removeItem('usuario');

        window.location.href =
            '/login.html';

    }

    catch (error) {

        console.log(error);

    }

}

const logoutBtn =
    document.getElementById('logoutBtn');

if (logoutBtn) {

    logoutBtn.addEventListener(
        'click',
        logout
    );

}

// =======================
// 🔄 CARGAR ADMIN
// =======================

// =======================
// 🔄 CARGAR ADMIN
// =======================

async function cargarAdmin() {

    try {

        // =======================
        // ⚽ PARTIDOS
        // =======================

        const resMatches =
            await fetch('/matches', {

                credentials: 'include'

            });

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
value="${m.fecha ? m.fecha.split('T')[0] : ''}"
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
value="${m.homeResult ?? ''}"
style="width:60px"
>

-

<input
type="number"
id="away-${m.id}"
value="${m.awayResult ?? ''}"
style="width:60px"
>

</td>

<td>

<button onclick="guardarResultado(${m.id})">
💾 Resultado
</button>

<button onclick="guardarFechaHora(${m.id})">
🕒 Fecha
</button>

<button onclick="eliminarPartido(${m.id})">
❌
</button>

</td>

</tr>

            `;

        });

        // =======================
        // 🏆 BRACKETS
        // =======================

        const resBrackets =
            await fetch('/brackets', {

                credentials: 'include'

            });

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

<select id="ganador-${b.id}">

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

<button onclick="guardarGanador(${b.id})">
💾 Guardar
</button>

<button onclick="eliminarBracket(${b.id})">
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

        const res =
            await fetch('/resultado', {

                method: 'POST',

                credentials: 'include',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body: JSON.stringify({

                    matchId: id,
                    home,
                    away

                })

            });

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
// 💾 FECHA/HORA PARTIDO
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

        const res =
            await fetch('/editar-partido', {

                method: 'POST',

                credentials: 'include',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body: JSON.stringify({

                    id,
                    fecha,
                    hora

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

// =======================
// 💾 FECHA/HORA BRACKET
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

        const res =
            await fetch('/editar-bracket', {

                method: 'POST',

                credentials: 'include',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body: JSON.stringify({

                    id,
                    fecha,
                    hora

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

// =======================
// ❌ ELIMINAR PARTIDO
// =======================

async function eliminarPartido(id) {

    if (
        !confirm(
            '¿Eliminar partido?'
        )
    ) return;

    try {

        const res =
            await fetch(

                `/eliminar-partido/${id}`,

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
// 💾 GANADOR
// =======================

async function guardarGanador(id) {

    try {

        const ganador =
            document.getElementById(
                `ganador-${id}`
            ).value;

        const res =
            await fetch(
                '/resultado-bracket',
                {

                    method: 'POST',

                    credentials: 'include',

                    headers: {

                        'Content-Type':
                            'application/json'

                    },

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

    if (
        !confirm(
            '¿Eliminar llave?'
        )
    ) return;

    try {

        const res =
            await fetch(

                `/eliminar-bracket/${id}`,

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
            document.getElementById('grupo').value;

        const homeTeam =
            document.getElementById('homeTeam').value;

        const awayTeam =
            document.getElementById('awayTeam').value;

        const fecha =
            document.getElementById('fecha').value;

        const hora =
            document.getElementById('hora').value;

        const res = await fetch('/crear-partido', {

            method: 'POST',

            credentials: 'include',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                grupo,
                homeTeam,
                awayTeam,
                fecha,
                hora

            })

        });

        const data = await res.json();

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
            document.getElementById('fase').value;

        const equipo1 =
            document.getElementById('eq1').value;

        const equipo2 =
            document.getElementById('eq2').value;

        const res = await fetch('/crear-bracket', {

            method: 'POST',

            credentials: 'include',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                fase,
                equipo1,
                equipo2

            })

        });

        const data = await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ⚙️ GENERADORES
// =======================

async function generar32avos() {

    const res =
        await fetch('/generar-32avos', {

            method: 'POST',
            credentials: 'include'

        });

    const data = await res.json();

    alert(data.mensaje);

}

async function generarOctavos() {

    const res =
        await fetch('/generar-octavos', {

            method: 'POST',
            credentials: 'include'

        });

    const data = await res.json();

    alert(data.mensaje);

}

async function generarCuartos() {

    const res =
        await fetch('/generar-cuartos', {

            method: 'POST',
            credentials: 'include'

        });

    const data = await res.json();

    alert(data.mensaje);

}

async function generarSemis() {

    const res =
        await fetch('/generar-semis', {

            method: 'POST',
            credentials: 'include'

        });

    const data = await res.json();

    alert(data.mensaje);

}

async function generarFinal() {

    const res =
        await fetch('/generar-final', {

            method: 'POST',
            credentials: 'include'

        });

    const data = await res.json();

    alert(data.mensaje);

}




// =======================
// 🚀 INIT
// =======================

window.onload = async () => {

    const ok =
        await validarAdmin();

    if (!ok) return;

    cargarAdmin();

};
// =======================
// 🗑️ REINICIAR TORNEO
// =======================

async function reiniciarTorneo() {

    const confirmar =
        confirm(
            'Esto eliminará resultados, apuestas y puntos. ¿Continuar?'
        );

    if (!confirmar) return;

    try {

        const res =
            await fetch('/reiniciar-torneo', {

                method: 'POST',

                credentials: 'include'

            });

        const data =
            await res.json();

        console.log(data);

        alert(data.mensaje);

        if (data.ok) {

            cargarAdmin();

        }

    }

    catch (error) {

        console.log(error);

        alert('Error conectando servidor');

    }

}

// =======================
// 🏆 REINICIAR BRACKETS
// =======================

async function reiniciarBrackets() {

    const confirmar =
        confirm(
            'Esto eliminará brackets y apuestas de brackets'
        );

    if (!confirmar) return;

    try {

        const res =
            await fetch('/reiniciar-brackets', {

                method: 'POST',

                credentials: 'include'

            });

        const data =
            await res.json();

        alert(data.mensaje);

        cargarAdmin();

    }

    catch (error) {

        console.log(error);

    }

}
