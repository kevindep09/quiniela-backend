// =======================
// 🔐 LOGIN
// =======================
const form =
    document.getElementById('loginForm');

form.addEventListener('submit',
async (e) => {

    e.preventDefault();

    try {

        const nombre =
            document.getElementById(
                'nombre'
            ).value;

        const password =
            document.getElementById(
                'password'
            ).value;

        const res = await fetch('/login', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            credentials: 'include',

            body: JSON.stringify({
                nombre,
                password
            })

        });

        const data = await res.json();

        // 🚫 LOGIN INCORRECTO
        if (!data.ok) {

            alert(data.mensaje);

            return;

        }

        // ✅ GUARDAR USUARIO
        localStorage.setItem(
            'usuario',
            JSON.stringify(data.user)
        );

        // ✅ REDIRECCION
        if (data.user.rol === 'admin') {

            window.location.href =
                '/admin.html';

        }

        else {

            window.location.href =
                '/index.html';

        }

    }

    catch (error) {

        console.log(error);

        alert('Error en login');

    }

});