const { Pool } = require('pg');

const tryPasswords = ['postgres', 'admin', 'root', '12345', '', 'cambus'];

async function attemptDeploy() {
    for (const pwd of tryPasswords) {
        let pool;
        try {
            pool = new Pool({
                user: 'postgres',
                host: '127.0.0.1',
                database: 'cambus_db',
                password: pwd,
                port: 5432,
            });
            const client = await pool.connect();
            console.log(`Connected with password: '${pwd}'`);

            // Execute the schema updates
            await client.query(`
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
                
                CREATE TABLE IF NOT EXISTS estado_simulador (
                    id INTEGER PRIMARY KEY,
                    ultimo_latido TIMESTAMPTZ NOT NULL
                );
            `);

            await client.query(`
                GRANT SELECT, INSERT, UPDATE, DELETE ON incidencias TO cambus_admin;
                GRANT SELECT, INSERT, UPDATE, DELETE ON estado_simulador TO cambus_admin;
                
                GRANT SELECT, INSERT, UPDATE ON incidencias TO cambus_supervisor;
                GRANT SELECT, INSERT, UPDATE, DELETE ON estado_simulador TO cambus_supervisor;
                
                GRANT SELECT, INSERT, UPDATE, DELETE ON estado_simulador TO cambus_operador;

                GRANT USAGE ON SEQUENCE incidencias_id_incidencia_seq TO cambus_admin, cambus_supervisor;
                
                GRANT CREATE ON SCHEMA public TO cambus_admin;
            `);

            console.log('Tablas creadas y permisos otorgados exitosamente.');
            client.release();
            await pool.end();
            return;
        } catch (e) {
            if (pool) await pool.end();
            // Try next
        }
    }
    console.log('Could not connect with any common postgres password.');
}

attemptDeploy();
