// =======================
// 👤 OBTENER USUARIO
// =======================
function obtenerUsuario() {

    return JSON.parse(
        localStorage.getItem('usuario')
    );

}

// =======================
// 🚪 LOGOUT
// =======================
async function logout() {

    try {

        await fetch('/logout', {
            method: 'POST'
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
// ⏳ CONTADOR APUESTAS
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
// 📊 TABLA
// =======================
async function cargarTabla() {

    try {

        const res =
            await fetch('/tabla?t=' + Date.now());

        const data = await res.json();

        const tbody =
            document.getElementById('tabla');

        if (!tbody) return;

        tbody.innerHTML = '';

        data.forEach((row, index) => {

            let clase = 'fila-normal';

            if (row.estado === 'exacto') {

                clase = 'fila-exacto';

            }

            else if (row.estado === 'ganador') {

                clase = 'fila-ganador';

            }

            else {

                clase = 'fila-fallo';

            }

            tbody.innerHTML += `

                <tr class="${clase}">

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
            await fetch('/ranking?t=' + Date.now());

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

                            <button onclick="eliminarUsuario(${user.id})">

                                ❌

                            </button>

                        </td>

                        `

                        :

                        '<td style="display:none"></td>'

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

        await fetch('/usuario/' + id, {

            method: 'DELETE'

        });

        await cargarRanking();

        await cargarTabla();

    }

    catch (error) {

        console.log(error);

    }

}

// =======================
// ⚽ PARTIDOS
// =======================
async function cargarPartidos() {

    try {

        const res =
            await fetch('/matches?t=' + Date.now());

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

            select.innerHTML += `

                <option value="${m.id}">

                    [${m.grupo || m.fase || 'Llave'}]

                    ${m.homeTeam || m.equipo1}

                    vs

                    ${m.awayTeam || m.equipo2}

                    | ${m.fecha || ''}

                    | ${m.hora || ''}

                    | ${contador}

                </option>

            `;

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

                const home =
                    document.getElementById('home').value;

                const away =
                    document.getElementById('away').value;

                const matchId =
                    document.getElementById('matchId').value;

                const res =
                    await fetch('/apostar', {

                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({

                            home,
                            away,
                            matchId

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
// 🌍 TABLAS DE GRUPOS
// =======================
async function cargarGrupos() {

    try {

        const res =
            await fetch('/grupos?t=' + Date.now());

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

                else if (index === 2) {

                    tr.classList.add(
                        'tercero'
                    );

                }

                tr.innerHTML = `

                    <td>${e.equipo || '-'}</td>
                    <td>${e.pj ?? 0}</td>
                    <td>${e.pg ?? 0}</td>
                    <td>${e.pe ?? 0}</td>
                    <td>${e.pp ?? 0}</td>
                    <td>${e.gf ?? 0}</td>
                    <td>${e.gc ?? 0}</td>
                    <td>${e.dg ?? 0}</td>
                    <td>${e.pts ?? 0}</td>

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
// 🚀 INICIAR
// =======================
window.onload = async () => {

    const usuario =
        obtenerUsuario();

    if (!usuario) {

        window.location.href =
            '/login.html';

        return;

    }

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

    setInterval(async () => {

        await cargarTabla();

        await cargarRanking();

        await cargarGrupos();

        await cargarPartidos();

    }, 30000);

};