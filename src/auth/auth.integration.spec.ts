import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { AuthModule } from './auth.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario } from '../usuarios/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ensureSchema } from '../test/test-config';
import * as bcrypt from 'bcrypt';

describe('Auth - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Verificar que estamos en entorno de test
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  ADVERTENCIA: No se detectó NODE_ENV=test. Asegúrate de que .env.test esté configurado.');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Inicializar y preparar el schema de test
    await ensureSchema(dataSource);

    // Verificar que estamos usando la base de datos de test
    const dbName = await dataSource.query('SELECT current_database()');
    console.log('📍 Base de datos en uso:', dbName[0].current_database);
    
    if (!dbName[0].current_database.includes('test')) {
      throw new Error('❌ ERROR CRÍTICO: No se está usando una base de datos de test. Revisar configuración.');
    }
    
    console.log('✅ Configuración de test verificada correctamente');
  }, 60000); // Timeout de 60 segundos para el setup

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada prueba
    await TestUtils.limpiarBaseDatos(dataSource);

    // Crear usuarios de prueba
    const hashedPasswordAdmin = await bcrypt.hash('Admin123', 10);
    await usuarioRepository.save({
      cedula: '123456789',
      nombre: 'Admin Test',
      email: 'admin@test.com',
      password: hashedPasswordAdmin,
      rol: RolUsuario.ADMIN
    });

    const hashedPasswordSupervisor = await bcrypt.hash('Supervisor123', 10);
    await usuarioRepository.save({
      cedula: '987654321',
      nombre: 'Supervisor Test',
      email: 'supervisor@test.com',
      password: hashedPasswordSupervisor,
      rol: RolUsuario.SUPERVISOR
    });
  });

  afterAll(async () => {
    // Limpiar completamente después de todos los tests
    try {
      await TestUtils.limpiarBaseDatos(dataSource);
      console.log('🧹 Base de datos de test limpiada');
    } catch (error) {
      console.warn('⚠️  No se pudo limpiar la base de datos:', error.message);
    }
    
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/login', () => {
    it('debería autenticar un usuario ADMIN con credenciales correctas', async () => {
      const credenciales = {
        email: 'admin@test.com',
        password: 'Admin123'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credenciales)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');

      // Verificar que el token es válido
      const token = response.body.access_token;
      const decodedToken = jwtService.verify(token);
      expect(decodedToken).toMatchObject({
        sub: '123456789',
        email: credenciales.email,
        rol: RolUsuario.ADMIN
      });
    });

    it('debería autenticar un usuario SUPERVISOR con credenciales correctas', async () => {
      const credenciales = {
        email: 'supervisor@test.com',
        password: 'Supervisor123'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credenciales)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');

      // Verificar que el token es válido
      const token = response.body.access_token;
      const decodedToken = jwtService.verify(token);
      expect(decodedToken).toMatchObject({
        sub: '987654321',
        email: credenciales.email,
        rol: RolUsuario.SUPERVISOR
      });
    });

    it('debería rechazar login con email que no existe', async () => {
      const credenciales = {
        email: 'noexiste@test.com',
        password: 'Admin123'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credenciales)
        .expect(404);

      expect(response.body).not.toHaveProperty('access_token');
      expect(response.body).toMatchObject({
        message: 'Usuario con email noexiste@test.com no encontrado',
        error: 'Not Found',
        statusCode: 404
      });
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      const credenciales = {
        email: 'admin@test.com',
        password: 'ContraseñaIncorrecta123'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credenciales)
        .expect(401);

      expect(response.body).not.toHaveProperty('access_token');
      expect(response.body).toMatchObject({
        message: 'Credenciales inválidas',
        error: 'Unauthorized',
        statusCode: 401
      });
    });

    it('debería validar campos requeridos en login', async () => {
      // Sin email
      const response1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Admin123' })
        .expect(401);

      expect(response1.body).toHaveProperty('message');

      // Sin contraseña
      const response2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com' })
        .expect(401);

      expect(response2.body).toHaveProperty('message');
    });

    it('debería validar formato de email en login', async () => {
      const credenciales = {
        email: 'emailinvalido', // Email sin formato válido
        password: 'Admin123'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credenciales)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('debería validar longitud mínima de contraseña en login', async () => {
      const credenciales = {
        email: 'admin@test.com',
        password: '123' // Contraseña muy corta
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credenciales)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/register', () => {
    it('debería registrar un nuevo usuario SUPERVISOR exitosamente por un ADMIN', async () => {
      // Primero hacer login como admin para obtener token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const nuevoUsuario = {
        cedula: '111222333',
        nombre: 'Nuevo Supervisor',
        email: 'nuevo.supervisor@test.com',
        password: 'Supervisor123',
        rol: RolUsuario.SUPERVISOR
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(nuevoUsuario)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toMatchObject({
        cedula: nuevoUsuario.cedula,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: RolUsuario.SUPERVISOR
      });
      expect(response.body.user).not.toHaveProperty('password');

      // Verificar que el usuario fue creado en la base de datos
      const usuarioCreado = await usuarioRepository.findOne({ 
        where: { cedula: nuevoUsuario.cedula } 
      });
      expect(usuarioCreado).toBeTruthy();
      
      if (!usuarioCreado) {
        throw new Error('El usuario no fue creado correctamente');
      }
      
      expect(usuarioCreado.rol).toBe(RolUsuario.SUPERVISOR);

      // Verificar que la contraseña está hasheada
      expect(usuarioCreado.password).not.toBe(nuevoUsuario.password);
      const passwordValida = await bcrypt.compare(
        nuevoUsuario.password,
        usuarioCreado.password
      );
      expect(passwordValida).toBe(true);
    });

    it('debería registrar un nuevo usuario ADMIN exitosamente por un ADMIN', async () => {
      // Login como admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const nuevoUsuario = {
        cedula: '444555666',
        nombre: 'Nuevo Admin',
        email: 'nuevo.admin@test.com',
        password: 'Admin123',
        rol: RolUsuario.ADMIN
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(nuevoUsuario)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toMatchObject({
        cedula: nuevoUsuario.cedula,
        rol: RolUsuario.ADMIN
      });
    });

    it('debería rechazar registro sin autorización', async () => {
      const nuevoUsuario = {
        cedula: '111222333',
        nombre: 'Test',
        email: 'test@test.com',
        password: 'Test123',
        rol: RolUsuario.SUPERVISOR
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(nuevoUsuario)
        .expect(401);
    });

    it('debería rechazar registro de SUPERVISOR intentando crear usuario', async () => {
      // Login como supervisor
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'supervisor@test.com',
          password: 'Supervisor123'
        })
        .expect(201);

      const supervisorToken = loginResponse.body.access_token;

      const nuevoUsuario = {
        cedula: '111222333',
        nombre: 'Test',
        email: 'test@test.com',
        password: 'Test123',
        rol: RolUsuario.SUPERVISOR
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(nuevoUsuario)
        .expect(403);
    });

    it('debería rechazar registro con cédula duplicada', async () => {
      // Login como admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const usuarioExistente = {
        cedula: '123456789', // Cédula que ya existe
        nombre: 'Otro Usuario',
        email: 'otro@test.com',
        password: 'Password123',
        rol: RolUsuario.SUPERVISOR
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioExistente)
        .expect(409);
    });

    it('debería rechazar registro con email duplicado', async () => {
      // Login como admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const usuarioEmailDuplicado = {
        cedula: '777888999',
        nombre: 'Otro Usuario',
        email: 'admin@test.com', // Email que ya existe
        password: 'Password123',
        rol: RolUsuario.SUPERVISOR
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioEmailDuplicado)
        .expect(409);
    });

    it('debería validar campos requeridos en el registro', async () => {
      // Login como admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const usuarioIncompleto = {
        nombre: 'Incompleto'
        // Faltan campos requeridos
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioIncompleto)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('cédula'),
          expect.stringContaining('correo electrónico'),
          expect.stringContaining('contraseña'),
          expect.stringContaining('rol')
        ])
      );
    });

    it('debería validar formato de email en registro', async () => {
      // Login como admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const usuarioEmailInvalido = {
        cedula: '777888999',
        nombre: 'Test Usuario',
        email: 'emailinvalido', // Email sin formato correcto
        password: 'Password123',
        rol: RolUsuario.SUPERVISOR
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioEmailInvalido)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('correo electrónico debe tener un formato válido')
        ])
      );
    });

    it('debería validar complejidad de contraseña en registro', async () => {
      // Login como admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const usuarioPasswordDebil = {
        cedula: '777888999',
        nombre: 'Test Usuario',
        email: 'test@test.com',
        password: 'password', // Sin mayúscula ni número
        rol: RolUsuario.SUPERVISOR
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioPasswordDebil)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('contraseña debe contener al menos una mayúscula')
        ])
      );
    });

    it('debería validar formato de cédula en registro', async () => {
      // Login como admin
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Admin123'
        })
        .expect(201);

      const adminToken = loginResponse.body.access_token;

      const usuarioCedulaInvalida = {
        cedula: '123', // Cédula muy corta
        nombre: 'Test Usuario',
        email: 'test@test.com',
        password: 'Password123',
        rol: RolUsuario.SUPERVISOR
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioCedulaInvalida)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('cédula debe tener entre 8 y 10 dígitos')
        ])
      );
    });
  });
}); 