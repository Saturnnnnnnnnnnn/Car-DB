const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Путь к директории для загрузки файлов
const uploadsDirectory = '/home/saturn/public/uploads';

// Подключаем статическую папку для загрузок
app.use('/uploads', express.static(uploadsDirectory));

// Подключаем статическую папку для публичных файлов (CSS, JS, изображения и т.д.)
app.use(express.static('public'));

// Подключение к базе данных SQLite
const dbPath = path.join(__dirname, '..', 'cars.db');
const db = new sqlite3.Database(dbPath);

// Отправка HTML-страницы при запросе корня сайта
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработчик для поиска данных в базе
app.get('/search', (req, res) => {
    // Получаем параметр запроса
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }
    // SQL запрос для поиска данных в базе
    const sql = `SELECT cars.*, owners.name AS owner_name, owners.email AS owner_email, owners.phone AS owner_phone
                 FROM cars
                 LEFT JOIN owners ON cars.id = owners.car_id
                 WHERE cars.make LIKE ? AND cars.status != 'Rented'`;

    // Выполняем запрос к базе данных
    db.all(sql, [`%${query}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Запуск сервера на указанном порту
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
