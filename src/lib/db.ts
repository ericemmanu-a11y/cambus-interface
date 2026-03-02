import { Pool } from 'pg';

declare global {
    var _dbPool: Pool | undefined;
}

const pool = global._dbPool || new Pool({
    user: 'cambus_admin',
    host: '127.0.0.1',
    database: 'cambus_db',
    password: 'cambus_admin_123',
    port: 5432,
});

if (process.env.NODE_ENV !== 'production') {
    global._dbPool = pool;
}

export default pool;
