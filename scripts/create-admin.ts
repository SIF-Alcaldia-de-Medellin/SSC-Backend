import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { Usuario, RolUsuario } from '../src/usuarios/usuario.entity';

config();

/**
 * Script para crear el usuario administrador inicial
 */
async function createAdminUser() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_SCHEMA,
    entities: [Usuario],
    synchronize: false,
    logging: false,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
      console.error('❌ Error: Faltan variables de entorno de base de datos');
      console.log('Asegúrate de tener configuradas: DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE');
      process.exit(1);
    }

    console.log('🔌 Conectando a la base de datos...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    console.log(`   Schema: ${process.env.DB_SCHEMA || 'public'}`);

    await dataSource.initialize();
    console.log('✅ Conexión establecida');

    const usuarioRepository = dataSource.getRepository(Usuario);

    // Verificar si ya existe un admin
    const adminExistente = await usuarioRepository.findOne({
      where: { email: 'admin@ssc.gov.co' }
    });

    if (adminExistente) {
      console.log('ℹ️  El usuario administrador ya existe');
      console.log('👤 Email: admin@ssc.gov.co');
      console.log('🔑 Contraseña: Admin123!');
      await dataSource.destroy();
      return;
    }

    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = usuarioRepository.create({
      cedula: '12345678',
      nombre: 'Administrador Principal',
      email: 'admin@ssc.gov.co',
      password: hashedPassword,
      rol: RolUsuario.ADMIN
    });

    await usuarioRepository.save(admin);

    console.log('🎉 Usuario administrador creado exitosamente!');
    console.log('');
    console.log('👤 Credenciales de acceso:');
    console.log('   Email: admin@ssc.gov.co');
    console.log('   Contraseña: Admin123!');
    console.log('   Rol: ADMIN');
    console.log('');
    console.log('🚀 Ahora puedes hacer login:');
    console.log('   POST /auth/login');
    console.log('   {');
    console.log('     "email": "admin@ssc.gov.co",');
    console.log('     "password": "Admin123!"');
    console.log('   }');

    await dataSource.destroy();

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Verifica que PostgreSQL esté ejecutándose');
    } else if (error.code === '3D000') {
      console.log('💡 La base de datos no existe. Créala primero.');
    } else if (error.code === '28P01') {
      console.log('💡 Error de autenticación. Verifica usuario y contraseña.');
    }
    
    process.exit(1);
  }
}

createAdminUser(); 