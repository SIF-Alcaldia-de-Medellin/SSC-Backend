import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
console.log('Directorio actual:', __dirname);
const result = config();

/**
 * Configuración de la conexión a base de datos usando variables de entorno
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  schema: process.env.DB_SCHEMA,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

export default dataSource; 