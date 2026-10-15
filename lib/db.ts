import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

export default sql;

// Initialize all tables
export async function initializeDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS tiffin_plans (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('morning', 'evening')),
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS weekly_schedule (
      id SERIAL PRIMARY KEY,
      tiffin_plan_id INTEGER REFERENCES tiffin_plans(id) ON DELETE CASCADE,
      day_of_week VARCHAR(10) NOT NULL,
      meal_name VARCHAR(200) NOT NULL,
      meal_description TEXT,
      week_start_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS thalis (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      image_url TEXT,
      available BOOLEAN DEFAULT true,
      category VARCHAR(50) DEFAULT 'regular',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      barcode VARCHAR(50),
      name VARCHAR(200) NOT NULL,
      brand VARCHAR(100),
      category VARCHAR(100),
      image_url TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock INTEGER DEFAULT 0,
      nutrition_data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      customer_phone VARCHAR(15),
      items JSONB NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      order_type VARCHAR(20),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  return { success: true };
}
