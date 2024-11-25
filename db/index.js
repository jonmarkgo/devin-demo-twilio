const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://user_twgwnoypyi:Dp6FRX1wdxqTIubZx7JA@devinapps-backend-prod.cluster-clussqewa0rh.us-west-2.rds.amazonaws.com/db_pcgneogeic?sslmode=require'
});

// Initialize tables
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS customer_interactions (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) NOT NULL,
                complete BOOLEAN DEFAULT false,
                service_type INTEGER,
                notifications_enabled BOOLEAN DEFAULT false,
                responses JSONB DEFAULT '[]'::jsonb
            );
        `);
    } finally {
        client.release();
    }
};

module.exports = { pool, initDb };
