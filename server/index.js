require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { initDatabase, query } = require('./database');

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   MIDDLEWARE
========================= */

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

/* =========================
   INICIAR BASE DE DATOS
========================= */

(async () => {
  try {
    await initDatabase();
    console.log("Base de datos inicializada correctamente");
  } catch (err) {
    console.error("Error inicializando DB:", err);
  }
})();

/* =========================
   LOGIN ADMIN
========================= */

app.post('/api/admin/login', (req, res) => {

  const { pin } = req.body;

  if (pin === process.env.ADMIN_PIN) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });

});

/* =========================
   USUARIOS
========================= */

// Obtener usuarios
app.get('/api/users', async (req, res) => {

  try {

    const result = await query(`
      SELECT *
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

// Crear usuario
app.post('/api/users', async (req, res) => {

  try {

    const {
      username,
      password,
      expiration_date,
      max_devices
    } = req.body;

    const result = await query(`
      INSERT INTO users
      (username,password,expiration_date,max_devices)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `, [
      username,
      password,
      expiration_date || null,
      max_devices || 1
    ]);

    res.json(result.rows[0]);

  } catch (error) {

    if (error.code === '23505') {
      res.status(400).json({ error: "Usuario ya existe" });
    } else {
      res.status(500).json({ error: error.message });
    }

  }

});

// EDITAR USUARIO (CORREGIDO)
app.put('/api/users/:id', async (req, res) => {

  try {

    const { id } = req.params;

    const {
      username,
      password,
      expiration_date,
      max_devices,
      is_active
    } = req.body;

    const result = await query(`
      UPDATE users
      SET
        username = $1,
        password = $2,
        expiration_date = $3,
        max_devices = $4,
        is_active = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [
      username,
      password,
      expiration_date || null,
      max_devices || 1,
      is_active !== false,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});

// Eliminar usuario
app.delete('/api/users/:id', async (req, res) => {

  try {

    const { id } = req.params;

    await query(`DELETE FROM users WHERE id=$1`, [id]);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

/* =========================
   PLAYLISTS
========================= */

// Obtener playlists
app.get('/api/playlists', async (req, res) => {

  try {

    const result = await query(`
      SELECT p.*, u.username
      FROM playlists p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

// Crear playlist
app.post('/api/playlists', async (req, res) => {

  try {

    const { user_id, name, original_url } = req.body;

    const key = uuidv4();
    const protected_url = `/m3u/${key}`;

    const result = await query(`
      INSERT INTO playlists
      (user_id,name,original_url,protected_url)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `, [
      user_id,
      name,
      original_url,
      protected_url
    ]);

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

/* =========================
   ESTADISTICAS DEL PANEL
========================= */

app.get('/api/stats', async (req, res) => {

  try {

    const users = await query(`SELECT COUNT(*) FROM users`);

    const playlists = await query(`SELECT COUNT(*) FROM playlists`);

    const activeConnections = await query(`
      SELECT COUNT(*)
      FROM active_sessions
      WHERE last_activity > NOW() - INTERVAL '5 minutes'
    `);

    const blockedToday = await query(`
      SELECT COUNT(*)
      FROM access_logs
      WHERE status='blocked'
      AND created_at >= CURRENT_DATE
    `);

    res.json({
      users: parseInt(users.rows[0].count),
      playlists: parseInt(playlists.rows[0].count),
      activeConnections: parseInt(activeConnections.rows[0].count),
      blockedToday: parseInt(blockedToday.rows[0].count)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

/* =========================
   PLAYLIST PROTEGIDA
========================= */

app.get('/m3u/:key', async (req, res) => {

  try {

    const { key } = req.params;

    const result = await query(`
      SELECT p.*, u.id as user_id
      FROM playlists p
      JOIN users u ON u.id = p.user_id
      WHERE p.protected_url=$1
    `, [`/m3u/${key}`]);

    if (result.rows.length === 0) {
      return res.status(404).send("Playlist no encontrada");
    }

    const playlist = result.rows[0];

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await query(`
      INSERT INTO active_sessions
      (user_id,ip_address,user_agent,last_activity)
      VALUES ($1,$2,$3,NOW())
    `, [
      playlist.user_id,
      ip,
      userAgent
    ]);

    const response = await axios.get(playlist.original_url);

    res.setHeader("Content-Type", "application/x-mpegURL");
    res.send(response.data);

  } catch (error) {

    await query(`
      INSERT INTO access_logs
      (status,reason,created_at)
      VALUES ('blocked','error',NOW())
    `);

    res.status(500).send("Error cargando playlist");

  }

});

/* =========================
   HEALTH CHECK
========================= */

app.get('/api/health', (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   SERVIDOR
========================= */

app.listen(PORT, () => {
  console.log("Servidor iniciado en puerto", PORT);
});

/* =========================
   CATCH ALL (IMPORTANTE)
========================= */

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
