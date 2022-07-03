const Application = require('./app/server');

const DB_URL = 'mongodb://localhost:27017/proxyDB';
const PORT = 3001;

new Application(DB_URL,PORT)
require('dotenv').config();