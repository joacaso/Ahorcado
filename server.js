const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const asyncHandler = require('express-async-handler');

const app = express();
const PORT = 3000;

// Configuración de la conexión a MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'Score',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('Conexión exitosa a la base de datos MySQL de XAMPP');
        connection.release();
    })
    .catch(error => {
        console.error('Error al conectar a la base de datos de XAMPP:', error);
        process.exit(1);
    });


// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Palabras para el juego
const palabras = [
    'Guiso', 'Milanesa', 'Pure', 'Ratatouille', 'Ensalada', 'Maradona',
    'Empanadas', 'Asado', 'Pizza', 'Tarta', 'Hamburguesa', 'Choripan', 'Locro',
    'Polenta', 'Canelones', 'Tallarines', 'Sorrentinos', 'Tortilla'
];

let ultimaPalabra = '';

// API para obtener una palabra aleatoria
app.get('/api/palabra', (req, res) => {
    let palabraRandom;
    do {
        palabraRandom = palabras[Math.floor(Math.random() * palabras.length)];
    } while (palabraRandom === ultimaPalabra);
    ultimaPalabra = palabraRandom;
    res.json({ palabra: palabraRandom });
});

// API para guardar puntuación
app.post('/api/guardar-puntuacion', asyncHandler(async (req, res) => {
    const { nombre, tiempo, puntos } = req.body;
    const [result] = await pool.query(
        'INSERT INTO score (nombre, tiempo, puntos, fecha) VALUES (?, ?, ?, NOW())',
        [nombre, tiempo, puntos]
    );
    res.json({ success: true, id: result.insertId });
}));

// API para obtener tabla de posiciones
app.get('/api/tabla-posiciones', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
        'SELECT nombre, tiempo, puntos FROM score ORDER BY puntos DESC, tiempo ASC LIMIT 10'
    );
    res.json(rows);
}));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
