import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestModule } from '../../src/test/test.module';
import { Usuario, RolUsuario } from '../../src/usuarios/usuario.entity';
import { E2EUtils } from '../e2e-utils';
import { ensureSchema } from '../../src/test/test-config';

describe('Flujo: Adiciones a Contratos (e2e)', () => {
  let app: INestApplication;
  let utils: E2EUtils;
  let usuarioRepository: Repository<Usuario>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  // Datos de prueba
  const adminData = {
    cedula: '666666666',
    password: 'Admin123',
    rol: RolUsuario.ADMIN
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  it('debería permitir crear múltiples adiciones para un contrato', async () => {
    // 1. Login como admin
    const token = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // Generar datos de prueba
    const testData = utils.generateTestData();

    // 2. Crear contrato
    const contratoData = {
      ...testData.contrato,
      usuarioCedula: adminData.cedula
    };
    const contrato = await utils.createContrato(token, contratoData);
    const valorOriginal = parseInt(contrato.valorTotal);

    // 3. Crear primera adición
    const adicion1Data = {
      ...testData.adicion,
      contratoId: contrato.id,
      valorAdicion: 300000000
    };
    const adicion1 = await utils.createAdicion(token, adicion1Data);
    expect(adicion1).toHaveProperty('id');

    // 4. Crear segunda adición
    const adicion2Data = {
      ...testData.adicion,
      contratoId: contrato.id,
      valorAdicion: 200000000
    };
    const adicion2 = await utils.createAdicion(token, adicion2Data);
    expect(adicion2).toHaveProperty('id');

    // 5. Verificar que ambas adiciones existen y son diferentes
    expect(adicion1.id).not.toBe(adicion2.id);
    expect(parseInt(adicion1.valorAdicion)).toBe(300000000);
    expect(parseInt(adicion2.valorAdicion)).toBe(200000000);

    // 6. Verificar que el valor total del contrato incluye ambas adiciones
    const response = await request(app.getHttpServer())
      .get(`/contratos/${contrato.id}`)
      .set('Authorization', `Bearer ${token}`);

    const contratoActualizado = response.body;
    expect(parseInt(contratoActualizado.valorTotal)).toBe(valorOriginal + 300000000 + 200000000);
  });

  it('debería permitir gestionar adiciones con diferentes usuarios', async () => {
    // 1. Crear usuario supervisor
    const supervisorData = {
      cedula: '777777777',
      password: 'Supervisor123',
      rol: RolUsuario.SUPERVISOR
    };
    await utils.createTestUser(
      supervisorData.cedula,
      supervisorData.password,
      supervisorData.rol
    );

    // 2. Login como admin para crear contrato
    const adminToken = await utils.loginUser(adminData.cedula, adminData.password);

    // 3. Crear contrato asignado al supervisor
    const testData = utils.generateTestData();
    const contrato = await utils.createContrato(adminToken, {
      ...testData.contrato,
      usuarioCedula: supervisorData.cedula
    });

    // 4. Crear adición como admin (debe funcionar)
    const adicionData = {
      contratoId: contrato.id,
      valorAdicion: 1000000,
      fecha: new Date().toISOString().split('T')[0],
      observaciones: 'Adición creada por admin'
    };
    const adicion = await utils.createAdicion(adminToken, adicionData);
    expect(adicion).toHaveProperty('id');
    expect(adicion.contratoId).toBe(contrato.id);
  });
}); 