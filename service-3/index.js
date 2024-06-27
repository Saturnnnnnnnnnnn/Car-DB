const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3003;

const upload = multer({ dest: 'uploads/' });

// Подключение к базе данных
const db = new sqlite3.Database('../cars.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных', err);
    } else {
        console.log('Подключение к базе данных успешно');
    }
});

app.use(express.static('public'));
app.use(bodyParser.json());

// Маршрут для корневого URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Получение всех автомобилей
app.get('/api/cars', (req, res) => {
    db.all('SELECT * FROM cars', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Изменение статуса автомобиля
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

// Добавление автомобиля
app.post('/api/cars', upload.single('carImage'), (req, res) => {
    const { make, model, year } = req.body;
    const imagePath = req.file.path;
    db.run(`INSERT INTO cars (make, model, year, image_path) VALUES (?, ?, ?, ?)`,
        [make, model, year, imagePath], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

// Удаление автомобиля
app.delete('/api/cars/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM cars WHERE id = ?`, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deleted: this.changes });
    });
});

// Получение всех владельцев
app.get('/api/owners', (req, res) => {
    db.all('SELECT * FROM owners', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Добавление владельца
app.post('/api/owners', (req, res) => {
    const { carId, name, email, phone } = req.body;
    db.run(`INSERT INTO owners (car_id, name, email, phone) VALUES (?, ?, ?, ?)`,
        [carId, name, email, phone], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

// Удаление владельца
app.delete('/api/owners/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM owners WHERE id = ?`, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deleted: this.changes });
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
