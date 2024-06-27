const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Получаем домашнюю директорию пользователя
const homeDirectory = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

// Определяем путь к директории для загрузки в домашней директории
const uploadDirectory = path.join(homeDirectory, 'uploads');

// Убеждаемся, что директория для загрузки существует или создаем ее
fs.mkdir(uploadDirectory, { recursive: true }, (err) => {
    if (err) {
        console.error("Ошибка при создании директории:", err);
    } else {
        console.log("Директория для загрузки файлов подготовлена.");
    }
});

// Настройка Multer для сохранения загруженных файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory); // Используем абсолютный путь к домашней директории
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Подключаем статическую папку для CSS и других статических файлов
app.use(express.static('public'));

// Middleware для разбора тела запроса в формате urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Подключение к базе данных SQLite
const db = new sqlite3.Database('../cars.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("Ошибка подключения к базе данных:", err.message);
    } else {
        console.log("Подключение к базе данных успешно установлено.");
    }
});

// Создание таблиц, если они не существуют
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        make TEXT,
        model TEXT,
        year INTEGER,
        image_path TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id INTEGER,
        name TEXT,
        email TEXT,
        phone TEXT,
        FOREIGN KEY (car_id) REFERENCES cars(id)
    )`);
});

// Маршрут для корневого URL - отдача файла index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Маршрут для обработки отправленной формы и загрузки файлов
app.post('/submit', upload.single('carImage'), (req, res) => {
    const { make, model, year, ownerName, ownerEmail, ownerPhone } = req.body;
    
    // Проверка обязательных полей
    if (!make || !model || !year || !ownerName || !ownerEmail || !req.file) {
        return res.status(400).send('Все поля формы должны быть заполнены, включая изображение.');
    }

    const imagePath = req.file.path; // Сохраняем путь к изображению

    // Вставка данных об автомобиле в базу данных
    db.run(`INSERT INTO cars (make, model, year, image_path) VALUES (?, ?, ?, ?)`, [make, model, year, imagePath], function(err) {
        if (err) {
            console.error('Ошибка при вставке данных об автомобиле:', err.message);
            return res.status(500).send('Произошла ошибка при вставке данных об автомобиле');
        }

        const carId = this.lastID;

        // Вставка данных о владельце
        db.run(`INSERT INTO owners (car_id, name, email, phone) VALUES (?, ?, ?, ?)`, [carId, ownerName, ownerEmail, ownerPhone], function(err) {
            if (err) {
                console.error('Ошибка при вставке данных о владельце:', err.message);
                return res.status(500).send('Произошла ошибка при вставке данных о владельце');
            }

            console.log('Данные успешно сохранены');
            res.send('Данные успешно сохранены');
        });
    });
});

// Маршрут для загрузки файлов
app.post('/upload', upload.single('carImage'), (req, res) => {
    res.send('Файл загружен');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
