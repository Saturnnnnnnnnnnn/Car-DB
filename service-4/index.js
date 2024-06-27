const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3003;

// Подключение к базе данных SQLite
const db = new sqlite3.Database('../cars.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных', err);
    } else {
        console.log('Подключение к базе данных успешно');
    }
});

// Использование middleware для парсинга JSON в теле запроса
app.use(bodyParser.json());

// Использование статической папки для отдачи статических файлов
app.use(express.static('public'));

// Маршрут для корневого URL - отдача файла index.html из папки public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint для получения всех автомобилей
app.get('/api/cars', (req, res) => {
    db.all('SELECT * FROM cars', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API endpoint для изменения статуса автомобиля по его ID
app.put('/api/cars/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.run(`UPDATE cars SET status = ? WHERE id = ?`, [status, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ updated: this.changes });
    });
});

// Запуск сервера на указанном порту
app.listen(port, () => {
    console.log(`Панель менеджера работает на порту ${port}`);
});
