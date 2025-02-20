const mongoose =require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/asswebka')
.then(() => {
    console.log(`Connected to the login database`)
})
.catch(() => {
    console.log(`connection failed`)
})

const loginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

const loginCollection = new mongoose.model('loginCollection', loginSchema)

module.exports = loginCollection