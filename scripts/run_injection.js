const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: 'cambus_admin',
    host: '127.0.0.1',
    database: 'cambus_db',
    password: 'cambus_admin_123',
    port: 5432,
});

async function runScript() {
    try {
        const scriptPath = path.join(__dirname, 'generar_datos_prueba.sql');
        const sql = fs.readFileSync(scriptPath, 'utf8');
        console.log('Running script...');
        await pool.query(sql);
        console.log('Script ran successfully');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

runScript();
