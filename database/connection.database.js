// db.js
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL

// Forzar SSL (Render) de forma segura
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // <- clave para Render
  allowExitOnIdle: true
})

export const db = pool

try {
  const r = await db.query('select current_database() db, current_user "user"')
  console.log('DATABASE connected ->', r.rows[0])
} catch (error) {
  console.error('DB CONNECT ERROR:', error)
}
