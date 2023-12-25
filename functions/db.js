// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = 'mongodb+srv://rotemkim:ONFT8Q3kCPxetvG6@cluster0.pv1o5s0.mongodb.net/first_DB?retryWrites=true&w=majority';
        
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }
};

module.exports = connectDB;
