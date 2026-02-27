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
        console.log("Seeding 3 standard users with pgcrypto...");

        // Use PostgreSQL pgcrypto to safely hash the passwords inside the DB itself
        await client.query(`
            INSERT INTO usuarios (nombre_usuario, correo, password_hash, rol)
            VALUES 
            ('Gran Administrador', 'admin@mabe.com', crypt('Admin123!', gen_salt('bf')), 'admin'),
            ('Supervisor Turno', 'supervisor@mabe.com', crypt('Super123!', gen_salt('bf')), 'supervisor'),
            ('Operador de Patio', 'operador@mabe.com', crypt('Ope123!', gen_salt('bf')), 'operador')
            ON CONFLICT (correo) DO UPDATE 
            SET password_hash = EXCLUDED.password_hash, rol = EXCLUDED.rol;
        `);

        console.log("Users inserted/updated successfully:");
        console.log("- admin@mabe.com / Admin123!");
        console.log("- supervisor@mabe.com / Super123!");
        console.log("- operador@mabe.com / Ope123!");

    } catch (e) {
        console.error("Error seeding users:", e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
