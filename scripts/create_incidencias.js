const { Pool } = require('pg');

const pool = new Pool({
    user: 'cambus_admin',
    host: '127.0.0.1',
    database: 'cambus_db',
    password: 'cambus_admin_123',
    port: 5432,
});

async function runScript() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS incidencias (
                id_incidencia SERIAL PRIMARY KEY,
                id_usuario INTEGER REFERENCES usuarios(id_usuario),
                titulo VARCHAR(150) NOT NULL,
                descripcion TEXT NOT NULL,
                nivel_gravedad VARCHAR(20) DEFAULT 'media' CHECK (nivel_gravedad IN ('baja', 'media', 'alta', 'critica')),
                estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_progreso', 'resuelta')),
                fecha_reporte TIMESTAMPTZ DEFAULT NOW(),
                fecha_resolucion TIMESTAMPTZ
            );
        `;
        console.log('Creating incidencias table...');
        await pool.query(sql);
        console.log('Table created. Granting permissions...');
        await pool.query('GRANT SELECT, INSERT, UPDATE, DELETE ON incidencias TO cambus_admin;');
        await pool.query('GRANT SELECT, INSERT, UPDATE ON incidencias TO cambus_supervisor;');
        await pool.query('GRANT USAGE ON SEQUENCE incidencias_id_incidencia_seq TO cambus_supervisor, cambus_admin;');
        console.log('Success');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        pool.end();
    }
}

runScript();
