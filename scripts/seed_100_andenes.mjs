import { Pool } from 'pg';

const pool = new Pool({
    user: 'cambus_admin',
    host: '127.0.0.1',
    database: 'cambus_db',
    password: 'cambus_admin_123',
    port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log("Starting bulk insertion of 95 Andenes...");

        let values = [];
        for (let i = 6; i <= 100; i++) {
            // Distribute across cameras 1-5 (simulating zones)
            const idCamara = (i % 5) + 1;
            const zona = idCamara <= 2 ? 'Norte' : idCamara <= 4 ? 'Sur' : 'Este';
            values.push(`(${i}, ${idCamara}, '${zona}')`);
        }

        const query = `INSERT INTO andenes (numero_anden, id_camara, zona) VALUES ${values.join(', ')} ON CONFLICT (numero_anden) DO NOTHING;`;
        await client.query(query);
        console.log("Successfully inserted Andenes 6 to 100.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
