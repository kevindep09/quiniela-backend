
// =======================
// 🔐 LOGIN
// =======================

const form = document.getElementById('loginForm');

if (form) {

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        try {

            const nombre =
                document.getElementById('nombre').value.trim();

            const password =
                document.getElementById('password').value.trim();

            const res = await fetch('/login', {

                method: 'POST',

                credentials: 'include',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    nombre,
                    password
                })

            });

            const data = await res.json();

            if (!data.ok) {

                alert(data.mensaje);
                return;

            }

            // ✅ GUARDAR USUARIO
            localStorage.setItem(
                'usuario',
                JSON.stringify(data.usuario)
            );

            alert(data.mensaje);

            // ✅ REDIRECCION
            if (data.usuario.rol === 'admin') {

                window.location.href = '/admin.html';

            } else {

                window.location.href = '/index.html';

            }

        }

        catch (error) {

            console.log(error);

            alert('Error conectando al servidor');

        }

    });

}

