import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { Usuario, RolUsuario } from '../src/usuarios/usuario.entity';
import { Contrato, EstadoContrato } from '../src/contratos/contrato.entity';
import { Cuo } from '../src/cuo/cuo.entity';
import { Actividad } from '../src/actividades/actividad.entity';

config();

/**
 * Configuración de DataSource para el script de seed
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  schema: process.env.DB_SCHEMA,
  entities: [Usuario, Contrato, Cuo, Actividad],
  synchronize: false,
  logging: false,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Datos iniciales para usuarios del sistema
 */
const usuariosIniciales = [
  {
    cedula: '12345678',
    nombre: 'Administrador Principal',
    email: 'admin@ssc.gov.co',
    password: 'Admin123!',
    rol: RolUsuario.ADMIN
  },
  {
    cedula: '87654321',
    nombre: 'Supervisor Obras Norte',
    email: 'supervisor.norte@ssc.gov.co',
    password: 'Super123!',
    rol: RolUsuario.SUPERVISOR
  },
  {
    cedula: '11111111',
    nombre: 'Supervisor Obras Sur',
    email: 'supervisor.sur@ssc.gov.co',
    password: 'Super123!',
    rol: RolUsuario.SUPERVISOR
  }
];

/**
 * Datos iniciales para contratos de ejemplo
 */
const contratosIniciales = [
  {
    usuarioCedula: '87654321',
    numeroContrato: '4600001001',
    anoSuscripcion: 2024,
    programa: 'Programa de Infraestructura Vial Norte',
    tipoContrato: 'Obra Pública',
    objeto: 'Pavimentación y mejoramiento de vías en el sector norte de la ciudad',
    identificadorSimple: 'PAV-NORTE-2024',
    contratista: 'Constructora Vías del Norte S.A.S.',
    numeroProceso: 'LP-001-2024',
    fechaInicio: new Date('2024-03-01'),
    fechaTerminacionInicial: new Date('2024-12-31'),
    fechaTerminacionActual: new Date('2024-12-31'),
    valorInicial: 2500000000,
    valorTotal: 2500000000,
    estado: EstadoContrato.ACTIVO
  },
  {
    usuarioCedula: '11111111',
    numeroContrato: '4600001002',
    anoSuscripcion: 2024,
    programa: 'Programa de Infraestructura Vial Sur',
    tipoContrato: 'Obra Pública',
    objeto: 'Construcción de andenes y ciclorutas en el sector sur',
    identificadorSimple: 'AND-SUR-2024',
    contratista: 'Ingeniería y Construcción Sur Ltda.',
    numeroProceso: 'LP-002-2024',
    fechaInicio: new Date('2024-04-15'),
    fechaTerminacionInicial: new Date('2024-11-30'),
    fechaTerminacionActual: new Date('2024-11-30'),
    valorInicial: 1800000000,
    valorTotal: 1800000000,
    estado: EstadoContrato.ACTIVO
  }
];

/**
 * Datos iniciales para CUOs (Códigos Únicos de Obra)
 */
const cuosIniciales = [
  {
    contratoId: 1, // Se asignará después de crear el contrato
    numero: 'CUO-001',
    latitud: 6.244203,
    longitud: -75.581212,
    comuna: 'Comuna 1 - Popular',
    barrio: 'Popular',
    descripcion: 'Pavimentación Carrera 52 entre Calles 100 y 110'
  },
  {
    contratoId: 1,
    numero: 'CUO-002', 
    latitud: 6.251847,
    longitud: -75.563591,
    comuna: 'Comuna 2 - Santa Cruz',
    barrio: 'Santa Cruz',
    descripcion: 'Mejoramiento vial Calle 107 entre Carreras 48 y 52'
  },
  {
    contratoId: 2,
    numero: 'CUO-003',
    latitud: 6.230833,
    longitud: -75.590556,
    comuna: 'Comuna 14 - El Poblado',
    barrio: 'El Poblado',
    descripcion: 'Construcción cicloruta Avenida El Poblado'
  }
];

/**
 * Datos iniciales para actividades
 */
const actividadesIniciales = [
  {
    cuoId: 1,
    actividad: 'Demolición y retiro de pavimento existente',
    metaFisica: 1200.0,
    proyectadoFinanciero: 150000000,
    unidadesAvance: 'M2'
  },
  {
    cuoId: 1,
    actividad: 'Pavimentación en concreto rígido',
    metaFisica: 1200.0,
    proyectadoFinanciero: 800000000,
    unidadesAvance: 'M2'
  },
  {
    cuoId: 2,
    actividad: 'Construcción de andenes',
    metaFisica: 800.0,
    proyectadoFinanciero: 200000000,
    unidadesAvance: 'M2'
  },
  {
    cuoId: 3,
    actividad: 'Construcción cicloruta en concreto',
    metaFisica: 2000.0,
    proyectadoFinanciero: 600000000,
    unidadesAvance: 'ML'
  }
];

/**
 * Función para encriptar contraseñas
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Función principal para ejecutar el seed de datos
 */
async function main() {
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

    // Conectar a la base de datos
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // Repositorios
    const usuarioRepository = dataSource.getRepository(Usuario);
    const contratoRepository = dataSource.getRepository(Contrato);
    const cuoRepository = dataSource.getRepository(Cuo);
    const actividadRepository = dataSource.getRepository(Actividad);

    // 1. Crear usuarios iniciales
    console.log('📝 Creando usuarios iniciales...');
    const usuariosExistentes = await usuarioRepository.count();
    
    if (usuariosExistentes === 0) {
      for (const userData of usuariosIniciales) {
        const hashedPassword = await hashPassword(userData.password);
        const usuario = usuarioRepository.create({
          ...userData,
          password: hashedPassword
        });
        await usuarioRepository.save(usuario);
        console.log(`✅ Usuario creado: ${userData.nombre} (${userData.email})`);
      }
    } else {
      console.log('ℹ️ Los usuarios ya existen, saltando creación');
    }

    // 2. Crear contratos iniciales
    console.log('📝 Creando contratos iniciales...');
    const contratosExistentes = await contratoRepository.count();
    
    if (contratosExistentes === 0) {
      for (const contratoData of contratosIniciales) {
        const contrato = contratoRepository.create(contratoData);
        const savedContrato = await contratoRepository.save(contrato);
        console.log(`✅ Contrato creado: ${savedContrato.numeroContrato} - ${savedContrato.identificadorSimple}`);
      }
    } else {
      console.log('ℹ️ Los contratos ya existen, saltando creación');
    }

    // 3. Crear CUOs iniciales
    console.log('📝 Creando CUOs iniciales...');
    const cuosExistentes = await cuoRepository.count();
    
    if (cuosExistentes === 0) {
      for (const cuoData of cuosIniciales) {
        const cuo = cuoRepository.create(cuoData);
        const savedCuo = await cuoRepository.save(cuo);
        console.log(`✅ CUO creado: ${savedCuo.numero} - ${savedCuo.descripcion}`);
      }
    } else {
      console.log('ℹ️ Los CUOs ya existen, saltando creación');
    }

    // 4. Crear actividades iniciales
    console.log('📝 Creando actividades iniciales...');
    const actividadesExistentes = await actividadRepository.count();
    
    if (actividadesExistentes === 0) {
      for (const actividadData of actividadesIniciales) {
        const actividad = actividadRepository.create(actividadData);
        const savedActividad = await actividadRepository.save(actividad);
        console.log(`✅ Actividad creada: ${savedActividad.actividad}`);
      }
    } else {
      console.log('ℹ️ Las actividades ya existen, saltando creación');
    }

    await dataSource.destroy();
    console.log('🎉 Seed completado exitosamente');
    console.log('');
    console.log('👤 Usuarios creados:');
    console.log('   - Admin: admin@ssc.gov.co / Admin123!');
    console.log('   - Supervisor Norte: supervisor.norte@ssc.gov.co / Super123!');
    console.log('   - Supervisor Sur: supervisor.sur@ssc.gov.co / Super123!');
    console.log('');
    console.log('🚀 Ahora puedes hacer login con el usuario administrador:');
    console.log('   POST /auth/login');
    console.log('   { "email": "admin@ssc.gov.co", "password": "Admin123!" }');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Verifica que PostgreSQL esté ejecutándose y las credenciales sean correctas');
    }
    process.exit(1);
  }
}

main(); 