const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/asswebka')
.then(() => {
    console.log('Connected to the blog database');
})
.catch((err) => {
    console.error('Connection failed:', err.message);
});

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Anonymous'
    }
}, { timestamps: true, versionKey: false });  

const Blog = mongoose.model('Blog', postSchema); 

module.exports = Blog;
