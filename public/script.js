// =======================
// 👤 USUARIO
// =======================

function obtenerUsuario() {

    return JSON.parse(
        localStorage.getItem('usuario')
    );

}

// =======================
// 🔒 VALIDAR SESION
// =======================

async function validarSesion() {

    try {

        const res =
            await fetch('/session', {

                credentials: 'include'

            });

        const data =
            await res.json();

        if (!data.user) {

            localStorage.removeItem('usuario');

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

// =======================
// ⏳ CONTADOR
// =======================

function calcularTiempoRestante(
    fecha,
    hora
) {

    if (!fecha || !hora) {

        return 'Sin fecha';

    }

    const partido =
        new Date(`${fecha}T${hora}:00`);

    partido.setMinutes(
        partido.getMinutes() - 15
    );

    const ahora = new Date();

    const diferencia =
        partido - ahora;

    if (diferencia <= 0) {

        return '⛔ Cerrado';

    }

    const horas =
        Math.floor(
            diferencia / 1000 / 60 / 60
        );

    const minutos =
        Math.floor(
            (diferencia / 1000 / 60) % 60
        );

    return `🕒 ${horas}h ${minutos}m`;

}

// =======================
// ⚽ CARGAR PARTIDOS
// =======================

async function cargarPartidos() {

    try {

        const res =
            await fetch('/matches', {

                credentials: 'include'

            });

        const matches =
            await res.json();

        const select =
            document.getElementById('matchId');

        if (!select) return;

        select.innerHTML = '';

        matches.forEach(m => {

            const contador =
                calcularTiempoRestante(
                    m.fecha,
                    m.hora
                );

            const option =
                document.createElement('option');

            option.value = m.id;

            option.textContent = `

[${m.grupo || '-'}]
${m.homeTeam}
vs
${m.awayTeam}
| ${m.fecha || ''}
| ${m.hora || ''}
| ${contador}

            `;

            select.appendChild(option);

        });

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 📝 APOSTAR
// =======================

const form =
    document.getElementById('formApuesta');

if (form) {

    form.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();

            try {

                const matchId =
                    document.getElementById(
                        'matchId'
                    ).value;

                const home =
                    document.getElementById(
                        'home'
                    ).value;

                const away =
                    document.getElementById(
                        'away'
                    ).value;

                const res =
                    await fetch('/apostar', {

                        method: 'POST',

                        credentials: 'include',

                        headers: {

                            'Content-Type':
                                'application/json'

                        },

                        body: JSON.stringify({

                            matchId,
                            home,
                            away

                        })

                    });

                const data =
                    await res.json();

                alert(data.mensaje);

                await cargarTabla();

                await cargarRanking();

            }

            catch (error) {

                console.log(error);

            }

        }
    );

}

// =======================
// 📊 TABLA
// =======================

async function cargarTabla() {

    try {

        const res =
            await fetch('/tabla', {

                credentials: 'include'

            });

        const data =
            await res.json();

        const tbody =
            document.getElementById('tabla');

        if (!tbody) return;

        tbody.innerHTML = '';

        data.forEach((row, index) => {

            tbody.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>${row.nombre}</td>

<td>${row.partido}</td>

<td>${row.prediccion}</td>

<td>${row.resultadoReal}</td>

<td>${row.puntos}</td>

<td>${row.estado}</td>

</tr>

            `;

        });

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 🏆 RANKING
// =======================

async function cargarRanking() {

    try {

        const usuario =
            obtenerUsuario();

        const res =
            await fetch('/ranking', {

                credentials: 'include'

            });

        const data =
            await res.json();

        const tbody =
            document.getElementById('ranking');

        if (!tbody) return;

        tbody.innerHTML = '';

        data.forEach((user, index) => {

            tbody.innerHTML += `

<tr>

<td>${index + 1}</td>

<td>${user.nombre}</td>

<td>${user.puntos}</td>

${
    usuario &&
    usuario.rol === 'admin'

    ?

    `

<td>

<button onclick="toggleUsuario(${user.id})">

${user.activo ? '🔒' : '✅'}

</button>

<button onclick="eliminarUsuario(${user.id})">

❌

</button>

<button onclick="resetPassword(${user.id})">

🔑

</button>



</td>

`

    :

    '<td></td>'
}

</tr>

            `;

        });

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ❌ ELIMINAR USUARIO
// =======================

async function eliminarUsuario(id) {

    const confirmar =
        confirm('¿Eliminar usuario?');

    if (!confirmar) return;

    try {

        await fetch(`/usuario/${id}`, {

            method: 'DELETE',

            credentials: 'include'

        });

        await cargarRanking();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 🌍 GRUPOS
// =======================

async function cargarGrupos() {

    try {

        const res =
            await fetch('/grupos', {

                credentials: 'include'

            });

        const grupos =
            await res.json();

        const container =
            document.getElementById(
                'gruposContainer'
            );

        const template =
            document.getElementById(
                'grupoTemplate'
            );

        if (!container) return;

        container.innerHTML = '';

        Object.keys(grupos).forEach(grupo => {

            const clone =
                template.content.cloneNode(true);

            clone.querySelector(
                '.grupo-titulo'
            ).textContent =
                `Grupo ${grupo}`;

            const tbody =
                clone.querySelector(
                    '.grupo-body'
                );

            grupos[grupo].forEach((e, index) => {

                const tr =
                    document.createElement('tr');

                if (index <= 1) {

                    tr.classList.add(
                        'clasificado'
                    );

                }

                tr.innerHTML = `

<td>${e.equipo}</td>
<td>${e.pj}</td>
<td>${e.pg}</td>
<td>${e.pe}</td>
<td>${e.pp}</td>
<td>${e.gf}</td>
<td>${e.gc}</td>
<td>${e.dg}</td>
<td>${e.pts}</td>

                `;

                tbody.appendChild(tr);

            });

            container.appendChild(clone);

        });

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// 🚀 INICIO
// =======================

window.onload = async () => {

    const ok =
        await validarSesion();

    if (!ok) return;

    const usuario =
        obtenerUsuario();

    const adminBtn =
        document.getElementById(
            'adminBtn'
        );

    if (
        adminBtn &&
        usuario.rol !== 'admin'
    ) {

        adminBtn.style.display =
            'none';

    }

    const logoutBtn =
        document.getElementById(
            'logoutBtn'
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            'click',
            logout
        );

    }

    await cargarPartidos();

    await cargarTabla();

    await cargarRanking();

    await cargarGrupos();

};
// =======================
// 🔑 RESET PASSWORD
// =======================

async function resetPassword(id) {

    const nuevaPassword =
        prompt(
            'Nueva contraseña'
        );

    if (!nuevaPassword) return;

    try {

        const res =
            await fetch('/reset-password', {

                method: 'POST',

                credentials: 'include',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body: JSON.stringify({

                    userId: id,
                    nuevaPassword

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
// ✅ ACTIVAR USUARIO
// =======================

async function toggleUsuario(id) {

    try {

        const res =
            await fetch('/toggle-usuario', {

                method: 'POST',

                credentials: 'include',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body: JSON.stringify({

                    id

                })

            });

        const data =
            await res.json();

        alert(data.mensaje);

        cargarRanking();

    }

    catch (error) {

        console.log(error);

    }

}

