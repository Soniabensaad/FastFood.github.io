const { Pool } = require('pg');
require('dotenv').config()
const pool = new Pool({
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: 'fast',
    host: process.env.HOST,
    port: process.env.DBPORT
})
module.exports = pool;
