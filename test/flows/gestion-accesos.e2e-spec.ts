import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestModule } from '../../src/test/test.module';
import { Usuario, RolUsuario } from '../../src/usuarios/usuario.entity';
import { E2EUtils } from '../e2e-utils';
import { ensureSchema } from '../../src/test/test-config';

describe('Flujo: Gestión de Accesos (e2e)', () => {
  let app: INestApplication;
  let utils: E2EUtils;
  let usuarioRepository: Repository<Usuario>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  // Datos de prueba
  const adminData = {
    cedula: '555555555',
    password: 'Admin123',
    rol: RolUsuario.ADMIN
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar ValidationPipe global para validar DTOs
    app.useGlobalPipes(new ValidationPipe());
    
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);

    utils = new E2EUtils(app, jwtService, usuarioRepository);

    // Inicializar la base de datos usando el script SQL
    await ensureSchema(dataSource);
  }, 30000);

  beforeEach(async () => {
    // Crear usuario admin de prueba
    await utils.createTestUser(
      adminData.cedula,
      adminData.password,
      adminData.rol
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('debería completar el flujo de gestión de accesos exitosamente', async () => {
    // 1. Login como admin
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );
    expect(adminToken).toBeDefined();
    expect(typeof adminToken).toBe('string');

    // 2. Crear nuevo usuario supervisor
    const nuevoSupervisor = {
      cedula: '987654321',
      password: 'Supervisor123',
      nombre: 'Nuevo Supervisor',
      email: '987654321@test.com',
      rol: RolUsuario.SUPERVISOR
    };

    const responseCreacion = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(nuevoSupervisor);

    console.log('Datos enviados al registro:', nuevoSupervisor);
    console.log('Respuesta del registro:', responseCreacion.status, responseCreacion.body);

    expect(responseCreacion.status).toBe(201);
    expect(responseCreacion.body.user.cedula).toBe(nuevoSupervisor.cedula);
    expect(responseCreacion.body.user.rol).toBe(RolUsuario.SUPERVISOR);

    // 3. Crear contrato y asignarlo al nuevo supervisor
    const testData = utils.generateTestData();
    const contratoData = {
      ...testData.contrato,
      usuarioCedula: nuevoSupervisor.cedula
    };
    const contrato = await utils.createContrato(adminToken, contratoData);
    expect(contrato.usuarioCedula).toBe(nuevoSupervisor.cedula);

    // 4. Login como nuevo supervisor
    console.log('Intentando login con:', {
      cedula: nuevoSupervisor.cedula,
      email: `${nuevoSupervisor.cedula}@test.com`,
      password: nuevoSupervisor.password
    });
    
    const supervisorToken = await utils.loginUser(
      nuevoSupervisor.cedula,
      nuevoSupervisor.password
    );

    // 5. Verificar acceso del supervisor a su contrato
    const responseContrato = await request(app.getHttpServer())
      .get(`/contratos/${contrato.id}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .expect(200);

    expect(responseContrato.body.id).toBe(contrato.id);

    // 6. Verificar que el supervisor no puede acceder a otros contratos
    const otroTestData = utils.generateTestData();
    const otroContrato = await utils.createContrato(adminToken, {
      ...otroTestData.contrato,
      usuarioCedula: adminData.cedula
    });

    await request(app.getHttpServer())
      .get(`/contratos/${otroContrato.id}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .expect(403);
  });

  it('debería validar restricciones en la creación de usuarios', async () => {
    // 1. Login como admin
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 2. Intentar crear usuario con cédula duplicada
    const usuarioDuplicado = {
      cedula: adminData.cedula, // Cédula que ya existe
      password: 'Test123456',
      nombre: 'Test Usuario',
      email: 'test@test.com',
      rol: RolUsuario.SUPERVISOR
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(usuarioDuplicado)
      .expect(409);

    // 3. Intentar crear usuario con email inválido
    const usuarioEmailInvalido = {
      cedula: '111222333',
      password: 'Test123456',
      nombre: 'Test Usuario',
      email: 'emailinvalido', // Email sin formato correcto
      rol: RolUsuario.SUPERVISOR
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(usuarioEmailInvalido)
      .expect(400);
  });

  it('debería validar permisos en la gestión de usuarios', async () => {
    // 1. Crear usuario supervisor
    const supervisorData = {
      cedula: '987654321',
      password: 'Supervisor123',
      rol: RolUsuario.SUPERVISOR
    };
    await utils.createTestUser(
      supervisorData.cedula,
      supervisorData.password,
      supervisorData.rol
    );

    // 2. Login como supervisor
    const supervisorToken = await utils.loginUser(
      supervisorData.cedula,
      supervisorData.password
    );

    // 3. Intentar crear nuevo usuario como supervisor (debe fallar)
    const nuevoUsuario = {
      cedula: '111222333',
      password: 'Test123456',
      nombre: 'Test Usuario',
      email: '111222333@test.com',
      rol: RolUsuario.SUPERVISOR
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send(nuevoUsuario)
      .expect(403);

    // 4. Intentar acceder a información de otro usuario como supervisor (debe fallar)
    await request(app.getHttpServer())
      .get(`/usuarios/${adminData.cedula}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .expect(403);
  });

  it('debería permitir autenticación de nuevos usuarios correctamente', async () => {
    // 1. Login como admin
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 2. Crear nuevo usuario
    const nuevoUsuario = {
      cedula: '555666777',
      password: 'Inicial123',
      nombre: 'Test Usuario',
      email: '555666777@test.com',
      rol: RolUsuario.SUPERVISOR
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(nuevoUsuario)
      .expect(201);

    // 3. Login como nuevo usuario
    const nuevoToken = await utils.loginUser(
      nuevoUsuario.cedula,
      nuevoUsuario.password
    );

    // 4. Login de nuevo usuario exitoso (verificar que está funcionando)
    expect(nuevoToken).toBeDefined();
    expect(typeof nuevoToken).toBe('string');

    // Verificar que puede hacer un request autorizado (obtener su propio perfil)
    const responseUser = await request(app.getHttpServer())
      .get('/usuarios/perfil/me')
      .set('Authorization', `Bearer ${nuevoToken}`)
      .expect(200);

    expect(responseUser.body).toBeDefined();
    expect(responseUser.body.cedula).toBe(nuevoUsuario.cedula);
  });
}); 