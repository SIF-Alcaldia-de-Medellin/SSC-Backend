import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import dataSource from '../ormconfig';

config();

/**
 * Datos iniciales para roles del sistema
 */
const rolesIniciales = [
  { nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
  { nombre: 'SUPERVISOR', descripcion: 'Supervisor de contratos' },
  { nombre: 'CONTRATISTA', descripcion: 'Contratista ejecutor' },
];

/**
 * Función principal para ejecutar el seed de datos
 */
async function main() {
  try {
    // Conectar a la base de datos
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // Verificar si ya existen roles para mantener idempotencia
    const rolesRepository = dataSource.getRepository('TBL_ROLES');
    const rolesExistentes = await rolesRepository.find();

    if (rolesExistentes.length === 0) {
      await rolesRepository.save(rolesIniciales);
      console.log('✅ Roles iniciales creados');
    } else {
      console.log('ℹ️ Los roles ya existen, no se requiere seed');
    }

    // Aquí puedes agregar más seeds para otras tablas de referencia

    await dataSource.destroy();
    console.log('✅ Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

main(); 