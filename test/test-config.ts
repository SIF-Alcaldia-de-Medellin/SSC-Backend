import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno de test
config({ path: '.env.test' });

// Leer el script SQL
const createTablesScript = fs.readFileSync(
  path.join(__dirname, '../src/database/create-tables.sql'),
  'utf8'
);

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_DATABASE || 'ssc_test',
  schema: process.env.TEST_DB_SCHEMA || 'SSC',
  entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
  synchronize: false, // No usar synchronize, usaremos el script SQL
  logging: true
};

// Función para inicializar la base de datos
export async function initializeTestDatabase(dataSource: any) {
  try {
    // Crear el schema si no existe
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "SSC"');

    // Intentar limpiar las tablas si existen
    try {
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_SEGUIMIENTO_ACTIVIDAD" CASCADE');
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_SEGUIMIENTO_GENERAL" CASCADE');
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_ACTIVIDADES" CASCADE');
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_CUO" CASCADE');
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_MODIFICACIONES" CASCADE');
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_ADICIONES" CASCADE');
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_CONTRATOS" CASCADE');
      await dataSource.query('TRUNCATE TABLE "SSC"."TBL_USUARIOS" CASCADE');
    } catch (error) {
      // Si las tablas no existen, ignorar el error
      console.log('Las tablas no existían, se crearán ahora');
    }

    // Ejecutar el script de creación
    const statements = createTablesScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await dataSource.query(statement);
      } catch (error) {
        // Ignorar errores de "ya existe"
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
    
    console.log('Base de datos de prueba inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw error;
  }
} 