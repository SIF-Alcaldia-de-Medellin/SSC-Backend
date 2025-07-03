import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { UsuariosModule } from './usuarios.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario } from './usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { Usuario } from './usuario.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ensureSchema } from '../test/test-config';
import * as bcrypt from 'bcrypt';

describe('Usuarios - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let adminToken: string;
  let supervisorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, UsuariosModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Inicializar la base de datos
    await ensureSchema(dataSource);

    // Generar tokens para las pruebas
    adminToken = TestUtils.generarToken(jwtService, RolUsuario.ADMIN);
    supervisorToken = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR);
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada prueba
    await TestUtils.limpiarBaseDatos(dataSource);

    // Crear usuario administrador por defecto con campos de contraseña
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    await usuarioRepository.save({
      cedula: '111111111',
      nombre: 'Admin Test',
      email: 'admin@test.com',
      password: hashedPassword,
      rol: RolUsuario.ADMIN,
      mustChangePassword: false, // Admin no necesita cambiar contraseña
      lastPasswordChange: new Date()
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /usuarios', () => {
    it('debería crear un usuario supervisor como ADMIN', async () => {
      const datosUsuario = {
        cedula: '222222222',
        nombre: 'Supervisor Test',
        email: 'supervisor@test.com',
        password: 'Supervisor123',
        rol: RolUsuario.SUPERVISOR
      };

      const response = await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosUsuario)
        .expect(201);

      expect(response.body).toMatchObject({
        cedula: datosUsuario.cedula,
        nombre: datosUsuario.nombre,
        email: datosUsuario.email,
        rol: datosUsuario.rol,
      });
      // Verificar que la contraseña no se devuelve
      expect(response.body.password).toBeUndefined();
    });

    it('debería rechazar la creación de usuario como SUPERVISOR', async () => {
      const datosUsuario = {
        cedula: '333333333',
        nombre: 'Nuevo Usuario',
        email: 'nuevo@test.com',
        password: 'Nuevo123',
        rol: RolUsuario.SUPERVISOR
      };

      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(datosUsuario)
        .expect(403);
    });

    it('debería validar cédula única', async () => {
      const datosUsuario = {
        cedula: '111111111', // Cédula ya existente
        nombre: 'Duplicado Test',
        email: 'duplicado@test.com',
        password: 'Duplicado123',
        rol: RolUsuario.SUPERVISOR
      };

      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosUsuario)
        .expect(409); // Conflict para cédula duplicada
    });

    it('debería validar email único', async () => {
      const datosUsuario = {
        cedula: '444444444',
        nombre: 'Duplicado Test',
        email: 'admin@test.com', // Email ya existente
        password: 'Duplicado123',
        rol: RolUsuario.SUPERVISOR
      };

      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosUsuario)
        .expect(409); // Conflict para email duplicado
    });
  });

  describe('GET /usuarios/:cedula', () => {
    it('debería obtener un usuario por cédula como ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/usuarios/111111111')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        cedula: '111111111',
        nombre: 'Admin Test',
        email: 'admin@test.com',
        rol: RolUsuario.ADMIN
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('debería rechazar acceso como SUPERVISOR', async () => {
      await request(app.getHttpServer())
        .get('/usuarios/111111111')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });
  });

  describe('GET /usuarios/perfil/me', () => {
    it('debería obtener el perfil del usuario autenticado', async () => {
      // Crear un token para un usuario específico
      const userToken = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '111111111');

      const response = await request(app.getHttpServer())
        .get('/usuarios/perfil/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        cedula: '111111111',
        nombre: 'Admin Test',
        email: 'admin@test.com',
        rol: RolUsuario.ADMIN
      });
      expect(response.body).not.toHaveProperty('password');
    });
  });
}); 
