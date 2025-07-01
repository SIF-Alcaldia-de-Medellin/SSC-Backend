import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as path from 'path';

// Cargar variables de entorno de test
config({ path: '.env.test' });

// Función para inicializar el schema
export async function initializeTestSchema(dataSource: DataSource) {
  try {
    // Crear el schema si no existe
    await dataSource.query('CREATE SCHEMA IF NOT EXISTS "SSC"');
    // Establecer el schema por defecto
    await dataSource.query('SET search_path TO "SSC"');
  } catch (error) {
    console.error('Error inicializando schema:', error);
    throw error;
  }
}

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_DATABASE || 'ssc_test',
  schema: 'SSC',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
  migrationsRun: true, // Ejecutar migraciones automáticamente
  synchronize: false,
  dropSchema: false,
  logging: false
};

// Función auxiliar para asegurar que el schema existe y limpiar datos
export async function ensureSchema(dataSource: DataSource) {
  const schemaName = process.env.TEST_DB_SCHEMA || 'SSC';
  try {
    // Crear el schema si no existe
    await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // Verificar si las tablas existen
    const tablesExist = await dataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = '${schemaName}' 
      AND table_name = 'TBL_USUARIOS'
    `);
    
    if (parseInt(tablesExist[0].count) === 0) {
      // Las tablas no existen, ejecutar migraciones desde cero
      console.log('Ejecutando migraciones de test desde cero...');
      
      // Limpiar la tabla de migraciones para forzar re-ejecución
      try {
        await dataSource.query(`DROP TABLE IF EXISTS migrations`);
        await dataSource.query(`DROP TABLE IF EXISTS "${schemaName}".migrations`);
      } catch (error) {
        // Ignorar errores si las tablas no existen
      }
      
      // Ejecutar migraciones
      await dataSource.runMigrations();
      
      // Verificar si las tablas se crearon en public y moverlas a SSC
      const publicTablesExist = await dataSource.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'TBL_USUARIOS'
      `);
      
      if (parseInt(publicTablesExist[0].count) > 0) {
        console.log('Moviendo tablas del schema public al schema SSC...');
        
        // Mover todas las tablas al schema correcto
        const tables = [
          'TBL_USUARIOS', 'TBL_CONTRATOS', 'TBL_SEGUIMIENTOGENERAL', 
          'TBL_CUO', 'TBL_ACTIVIDADES', 'TBL_SEGUIMIENTOACTIVIDAD',
          'TBL_MODIFICACIONES', 'TBL_ADICIONES'
        ];
        
        for (const table of tables) {
          try {
            await dataSource.query(`ALTER TABLE public."${table}" SET SCHEMA "${schemaName}"`);
          } catch (error) {
            // Ignorar errores si la tabla ya está en el schema correcto
            console.log(`Tabla ${table} ya está en el schema correcto o no existe`);
          }
        }
        
        // También mover los tipos ENUM
        const enums = [
          'TBL_USUARIOS_usu_rol_enum',
          'TBL_CONTRATOS_con_estado_enum',
          'TBL_MODIFICACIONES_mod_tipo_enum'
        ];
        
        for (const enumType of enums) {
          try {
            await dataSource.query(`ALTER TYPE public."${enumType}" SET SCHEMA "${schemaName}"`);
          } catch (error) {
            // Ignorar errores si el tipo ya está en el schema correcto
            console.log(`Tipo ${enumType} ya está en el schema correcto o no existe`);
          }
        }
      }
      
      console.log('Migraciones de test ejecutadas exitosamente');
    } else {
      // Las tablas existen, solo limpiar datos
      console.log('Limpiando datos de test...');
      
      // Establecer el schema por defecto
      await dataSource.query(`SET search_path TO "${schemaName}"`);
      
      // Limpiar datos existentes
      const tables = [
        'TBL_SEGUIMIENTOACTIVIDAD',
        'TBL_SEGUIMIENTOGENERAL', 
        'TBL_ACTIVIDADES',
        'TBL_ADICIONES',
        'TBL_MODIFICACIONES',
        'TBL_CUO',
        'TBL_CONTRATOS',
        'TBL_USUARIOS'
      ];
      
      // Deshabilitar checks de foreign key temporalmente
      await dataSource.query('SET session_replication_role = replica;');
      
      // Limpiar todas las tablas
      for (const table of tables) {
        await dataSource.query(`TRUNCATE TABLE "${schemaName}"."${table}" CASCADE;`);
      }
      
      // Rehabilitar checks de foreign key
      await dataSource.query('SET session_replication_role = DEFAULT;');
      console.log('Datos de test limpiados exitosamente');
    }
    
    // IMPORTANTE: Verificar y corregir la precisión de la columna SEG_AVANCE_FINANCIERO
    try {
      console.log('Verificando precisión de columnas...');
      
      // Verificar la precisión actual de la columna
      const columnInfo = await dataSource.query(`
        SELECT numeric_precision, numeric_scale 
        FROM information_schema.columns 
        WHERE table_schema = '${schemaName}' 
        AND table_name = 'TBL_SEGUIMIENTOGENERAL' 
        AND column_name = 'SEG_AVANCE_FINANCIERO'
      `);
      
      if (columnInfo.length > 0) {
        const { numeric_precision, numeric_scale } = columnInfo[0];
        console.log(`Precisión actual: ${numeric_precision}, Escala: ${numeric_scale}`);
        
        if (numeric_precision === 5) {
          console.log('Corrigiendo precisión de SEG_AVANCE_FINANCIERO...');
          await dataSource.query(`
            ALTER TABLE "${schemaName}"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FINANCIERO" TYPE decimal(15,2)
          `);
          console.log('Precisión corregida exitosamente');
        } else {
          console.log('La precisión ya es correcta');
        }
      }
    } catch (error) {
      console.error('Error verificando/corrigiendo precisión:', error);
    }
    
  } catch (error) {
    console.error('Error al preparar el schema de test:', error);
    throw error;
  }
} 