import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

export default async function connectDatabase() {
  try {
    await client.connect();
    console.log('Connected to the database');
    
    return client
  } catch (err) {
    console.error('Database connection error:', err.stack);
  } finally {
    await client.end();
  }
}