const express = require('express');
const path = require('path');
const axios = require('axios');
const loginCollection = require('./db');
const Blog = require('./dbpost');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const qr = require('qr-image');

const app = express();
const API_KEY = '3658909485a951c662bc074d96226dca';
const YANDEX_API_KEY = 'b07ac1e4-3ac3-4e1f-a440-3cca22ff0fbd';
const NEWS_API_KEY = '82d3a25b12804cfb9c13cb964922ff38';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/views/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, './public/views/register.html'));
});

app.post('/register', async (req, res) => {
    const data = new loginCollection({
        username: req.body.username,
        password: req.body.password
    });
    try {
        const existingUser = await loginCollection.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already registered' });
        }
        await data.save();
        res.redirect('/');
    } catch (error) {
        res.status(500).json({ error: 'Server error, try again.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await loginCollection.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(400).json({ error: 'Incorrect email or password' });
        }
        res.redirect('/home');
    } catch (error) {
        res.status(500).json({ error: 'An error occurred. Please try again' });
    }
});

async function getCityCoordinates(city) {
    const response = await axios.get('https://geocode-maps.yandex.ru/1.x/', {
        params: { geocode: city, apikey: YANDEX_API_KEY, format: 'json' }
    });
    if (response.data.response.GeoObjectCollection.featureMember.length > 0) {
        const coordinates = response.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
        return { lat: parseFloat(coordinates[1]), lon: parseFloat(coordinates[0]) };
    }
    throw new Error('City not found');
}

async function getCityNews(city) {
    const url = `https://newsapi.org/v2/everything?q=${city}&apiKey=${NEWS_API_KEY}`;
    const response = await axios.get(url);
    const articles = response.data.articles;
    return articles.length > 0 ? articles[0] : null;
}

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/views/index.html'));
});

app.post('/weather', async (req, res) => {
    const city = req.body.city;
    try {
        const coords = await getCityCoordinates(city);
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;
        const news = await getCityNews(city);
        res.json({
            temperature: data.main.temp,
            description: data.weather[0].description,
            icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`,
            coordinates: { lat: data.coord.lat, lon: data.coord.lon },
            feels_like: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            wind_speed: data.wind.speed,
            country: data.sys.country,
            rain_volume: data.rain ? data.rain['3h'] : 0,
            cityCoordinates: coords,
            news: news ? { title: news.title, description: news.description, url: news.url } : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Unable to fetch weather data' });
    }
});

app.get('/bmi', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/views/bmi.html'));
});

app.post('/Calculate-BMI', (req, res) => {
    const weight = parseFloat(req.body.weight);
    const height = parseFloat(req.body.height);
    if (weight <= 0 || height <= 0) {
        return res.send('<h1>Invalid input! Please enter positive numbers for weight and height.</h1>');
    }
    const bmi = weight / (height ** 2);
    let category = '';
    let color = '';
    if (bmi < 18.5) {
        category = 'Underweight';
        color = 'blue';
    } else if (bmi >= 18.5 && bmi < 24.9) {
        category = 'Normal weight';
        color = 'green';
    } else if (bmi >= 25 && bmi < 29.9) {
        category = 'Overweight';
        color = 'yellow';
    } else {
        category = 'Obese';
        color = 'red';
    }
    res.send(`
        <html>
            <head>
                <title>BMI Result</title>
                <link rel="stylesheet" type="text/css" href="/css/style.css">
                <style>
                    body { text-align: center; }
                </style>
            </head>
            <body>
                <h1>BMI calculated</h1>
                <p>Weight: ${weight} kg</p>
                <p>Height: ${height} cm</p>
                <p class="result" style="color: ${color};"><b>Your BMI is ${bmi.toFixed(2)}, which means you are ${category}</b></p>
                <a href="/bmi">Go Back</a>
            </body>
        </html>
    `);
});

const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: '230129@astanait.edu.kz',
        pass: 'ersik1909',
    },
});

app.get('/email', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/views/email.html'));
});

app.post('/send-email', async (req, res) => {
    const { from, to, subject, text } = req.body;
    const mailOptions = {
        from,
        to,
        subject,
        text
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully', response: info.response });
    } catch (error) {
        res.status(500).json({ message: 'Error sending email', error: error.message });
    }
});

app.post('/blogs', async (req, res) => {
    try {
        const { title, body, author } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }
        const blog = new Blog({ title, body, author });
        await blog.save();
        res.status(201).json(blog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json(blogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/blogs/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid post ID format' });
        }
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Post not found' });
        res.json(blog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/blogs/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid post ID format' });
        }

        const updateData = { ...req.body, updatedAt: new Date() };

        const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!blog) return res.status(404).json({ error: 'Post not found' });

        res.json(blog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.delete('/blogs/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid post ID format' });
        }
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Post not found' });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/posts', (req, res) => {
    res.sendFile(path.join(__dirname, './public/views/post.html'));
});

app.get('/qrcode', (req, res) => {
    res.sendFile(path.join(__dirname, './public/views/qr.html'));
});

app.get('/qr', (req, res) => {
    const url = 'https://chatgpt.com/';
    const qrCode = qr.image(url, { type: 'png' });

    res.setHeader('Content-Type', 'image/png');
    qrCode.pipe(res);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
