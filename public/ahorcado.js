let palabra = '';  // Palabra a adivinar
let letrasUsadas = new Set();  // Conjunto de letras ya intentadas
let intentosRestantes = 6;
let tiempoInicio;
let puntos = 0;
let tiempoTranscurrido = 0;
let temporizador;
let manejarEntradaTeclado = null;
let letrasElemento = document.getElementById('letras');
let palabraElemento = document.getElementById('palabra');
let letrasUsadasElemento = document.getElementById('letras-usadas');
let canvas = document.getElementById('ahorcadoCanvas');  // Canvas donde se dibuja el ahorcado
let ctx = canvas.getContext('2d');  // Contexto de dibujo en el canvas
let jugarBoton = document.getElementById('jugar');
let vidasElemento = document.getElementById('vidas');
let messageContainer = document.getElementById('messageContainer');
let messageElement = document.getElementById('message');
let continueButton = document.getElementById('continueButton');
let exitButton = document.getElementById('exitButton');
const tiempoElemento = document.getElementById('tiempo');
const tablaPosicionesContainer = document.getElementById('tablaPosicionesContainer');

continueButton.addEventListener('click', () => {
    messageElement.textContent = ''; // Limpiar el mensaje
    continueButton.disabled = true; // Desactivar el botón "Continuar" de nuevo
    messageContainer.classList.add('hidden'); // Ocultar el contenedor de mensajes
    empezarJuego(); // Volver a iniciar el juego
});

exitButton.addEventListener('click', () => {
    window.location.href = '/';
});

async function inicializarJuego() {
    manejarEntradaTeclado = (event) => {
        const letra = event.key.toUpperCase();  // Obtener la letra ingresada y convertirla a mayúscula
        if (letra.length === 1 && letra >= 'A' && letra <= 'Z') {
            intentarLetra(letra);  // Intentar adivinar la letra
        } else if (event.key === ' ') {
            event.preventDefault();  // Evitar el comportamiento predeterminado al presionar espacio
        }
    };

    document.addEventListener('keydown', manejarEntradaTeclado);
    jugarBoton.addEventListener('click', empezarJuego);
    await empezarJuego();  // Empezar el juego al cargar la página
}

function iniciarTemporizador() {
    tiempoInicio = Date.now();
    temporizador = setInterval(() => {
        tiempoTranscurrido = Math.floor((Date.now() - tiempoInicio) / 1000);
        tiempoElemento.textContent = `Tiempo: ${tiempoTranscurrido}s`;
    }, 1000);
}

function detenerTemporizador() {
    clearInterval(temporizador);
}

async function empezarJuego() {
    letrasUsadas.clear();
    intentosRestantes = 6;
    // No reiniciar puntos ni tiempo transcurrido aquí
    if (!temporizador) {  // Iniciar el temporizador solo si no está ya en marcha
        iniciarTemporizador();
    }
    await obtenerPalabra();
    actualizarPalabra();
    limpiarCanvas();
    dibujarBase();
    crearBotonesLetras();
    actualizarVidas();
    habilitarLetras(true);
    habilitarTeclado(true);
}


async function obtenerPalabra() {
    try {
        const response = await fetch('/api/palabra');  // Hacer una solicitud a la api para obtener la palabra
        const data = await response.json();  // Convertir la respuesta a formato JSON
        palabra = data.palabra.toUpperCase();
    } catch (error) {
        console.error('Error al obtener la palabra:', error);
    }
}

function crearBotonesLetras() {
    letrasElemento.innerHTML = '';
    for (let i = 65; i <= 90; i++) {
        const letra = String.fromCharCode(i);
        const letraElemento = document.createElement('button');
        letraElemento.textContent = letra;
        letraElemento.className = 'letra';
        letraElemento.addEventListener('click', () => intentarLetra(letra));
        letrasElemento.appendChild(letraElemento);
    }
}

function habilitarTeclado(habilitar) {
    if (habilitar) {
        document.addEventListener('keydown', manejarEntradaTeclado);
    } else {
        document.removeEventListener('keydown', manejarEntradaTeclado);
    }
}

function habilitarLetras(habilitar) {
    const botones = letrasElemento.getElementsByTagName('button');
    for (let boton of botones) {
        boton.disabled = !habilitar;
    }
}

function desactivarTeclado() {
    if (manejarEntradaTeclado) {
        document.removeEventListener('keydown', manejarEntradaTeclado);
    }
}

function intentarLetra(letra) {
    if (letrasUsadas.has(letra)) return;

    letrasUsadas.add(letra);

    const letraElemento = letrasElemento.querySelector(`button:nth-child(${letra.charCodeAt(0) - 64})`);
    if (letraElemento) {
        letraElemento.classList.add('usada');
        letraElemento.disabled = true;
    }

    if (palabra.includes(letra)) {
        puntos += 20; // Sumar puntos por letra correcta
    } else {
        puntos -= 10; // Restar puntos por letra incorrecta
        intentosRestantes--;
        dibujarAhorcado(6 - intentosRestantes);
        actualizarVidas();
    }

    actualizarPalabra();
    actualizarPuntaje(); // Actualizar el puntaje
    verificarEstadoJuego();
}

function actualizarPalabra() {
    palabraElemento.textContent = palabra
        .split('') // Dividir la palabra en un array de caracteres
        .map(letra => letrasUsadas.has(letra) ? letra : '_') // Mapear cada letra para mostrarla o mostrar '_'
        .join(' ');  // Unir las letras (o guiones bajos) en una cadena para mostrar la palabra adivinada
}

function actualizarVidas() {
    vidasElemento.innerHTML = '';  // Limpiar las vidas anteriores

    for (let i = 0; i < 6; i++) {
        const vida = document.createElement('div');
        vida.className = i < intentosRestantes ? 'vida verde' : 'vida rojo';  // Asignar clase verde o rojo según si la vida está activa o perdida
        vidasElemento.appendChild(vida);  // Agregar el elemento de vida al contenedor de vidas
    }
}

function verificarEstadoJuego() {
    if (palabra === palabraElemento.textContent.replace(/ /g, '')) {
        finalizarJuego('Ganaste');
    } else if (intentosRestantes === 0) {
        finalizarJuego(`Perdiste. La palabra era: ${palabra}`);
        detenerTemporizador(); // Detener el temporizador si se pierde
    }
}

function actualizarPuntaje() {
    const puntosElemento = document.getElementById('puntos');
    puntosElemento.textContent = `Puntos: ${puntos}`;
}

function finalizarJuego(mensaje) {
    habilitarLetras(false);
    desactivarTeclado();
    puntos += mensaje === 'Ganaste' ? 50 : 0; // Bonus por ganar
    puntos += mensaje === 'Ganaste' ? Math.max(0, 100 - tiempoTranscurrido) : 0; // Bonus por tiempo si se gana
    mostrarMensajeFinal(mensaje, mensaje === 'Ganaste');
}

function mostrarMensajeFinal(mensaje, esVictoria) {
    messageElement.textContent = mensaje;
    messageContainer.classList.remove('hidden');
    continueButton.disabled = !esVictoria;
    messageElement.style.color = esVictoria ? '#2B9348' : '#EF233C';
    exitButton.disabled = false;

    if (!esVictoria) { // Solo mostrar el formulario si el jugador pierde
        mostrarFormularioPuntuacion();
    }
}

function mostrarFormularioPuntuacion() {
    const formulario = document.createElement('form');
    formulario.innerHTML = `
        <input type="text" id="nombreJugador" placeholder="Tu nombre" required>
        <button id="sumbitButton" type="submit">Guardar puntuación</button>
    `;
    formulario.onsubmit = guardarPuntuacion;
    messageContainer.appendChild(formulario);
}

async function guardarPuntuacion(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombreJugador').value;

    try {
        const response = await fetch('/api/guardar-puntuacion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, tiempo: tiempoTranscurrido, puntos }),
        });

        continueButton.disabled = true;

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                mostrarTablaPosiciones();
                continueButton.disabled = true;
                const formulario = document.querySelector('#messageContainer form');
                if (formulario) {
                    formulario.remove();
                }
            } 
        } 
    } catch (error) {
        console.error('Error:', error);
    }
}

async function mostrarTablaPosiciones() {
    try {
        const response = await fetch('/api/tabla-posiciones'); // Asegúrate de que esta URL sea correcta
        const posiciones = await response.json();

        const tablaPosiciones = document.getElementById('tablaPosiciones');
        const tbody = tablaPosiciones.querySelector('tbody');

        tbody.innerHTML = '';

        posiciones.slice(0, 5).forEach((pos, index) => {
            const row = document.createElement('tr');
            row.id = `row${index + 1}`;

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${pos.nombre}</td>
                <td>${pos.puntos}</td>
                <td>${pos.tiempo} seg</td>
            `;

            tbody.appendChild(row);
        });

        // Mostrar el contenedor
        document.getElementById('tablaPosicionesContainer').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al obtener la tabla de posiciones');
    }
}

mostrarTablaPosiciones();

function limpiarCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpiar el canvas completamente
}

function dibujarBase() {
    ctx.beginPath();
    ctx.moveTo(50, 270);
    ctx.lineTo(250, 270);
    ctx.moveTo(100, 270);
    ctx.lineTo(100, 50);
    ctx.lineTo(200, 50);
    ctx.lineTo(200, 80);
    ctx.stroke();  // Dibujar todas las líneas 
}

function dibujarAhorcado(paso) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    switch (paso) {
        case 1:
            ctx.arc(200, 100, 20, 0, Math.PI * 2);  // Cabeza
            break;
        case 2:
            ctx.moveTo(200, 120);
            ctx.lineTo(200, 190);  // Cuerpo
            break;
        case 3:
            ctx.moveTo(200, 130);
            ctx.lineTo(170, 160);  // Brazo izquierdo
            break;
        case 4:
            ctx.moveTo(200, 130);
            ctx.lineTo(230, 160);  // Brazo derecho
            break;
        case 5:
            ctx.moveTo(200, 190);
            ctx.lineTo(180, 230);  // Pierna izquierda
            break;
        case 6:
            ctx.moveTo(200, 190);
            ctx.lineTo(220, 230);  // Pierna derecha
            break;
    }
    ctx.stroke();  // Dibujar la parte del ahorcado
}

// Iniciar cuando se carga la página completamente
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');

    jugarBoton.addEventListener('click', () => {
        loader.classList.add('hidden');
        inicializarJuego();
    });
});