require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDatabase = async () => {
  const client = await pool.connect();

  try {
    // Tabla de usuarios (clientes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255),
        expiration_date TIMESTAMP NULL,
        max_devices INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Agregar columna password si no existe (para bases de datos existentes)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)
    `).catch(() => {});

    // Tabla de playlists (fuentes M3U)
    await client.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        original_url TEXT NOT NULL,
        protected_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabla de sesiones activas
    await client.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_id VARCHAR(100),
        last_activity TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabla de logs de acceso
    await client.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        playlist_id INT REFERENCES playlists(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(20),
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  initDatabase,
  query: (text, params) => pool.query(text, params)
};
