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

describe('Flujo: Seguimiento General de Contratos (e2e)', () => {
  let app: INestApplication;
  let utils: E2EUtils;
  let usuarioRepository: Repository<Usuario>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  // Datos de prueba
  const adminData = {
    cedula: '111111111',
    password: 'Admin123',
    rol: RolUsuario.ADMIN
  };

  const supervisorData = {
    cedula: '222222222',
    password: 'Supervisor123',
    rol: RolUsuario.SUPERVISOR
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
    // Crear usuarios de prueba
    await utils.createTestUser(
      adminData.cedula,
      adminData.password,
      adminData.rol
    );

    await utils.createTestUser(
      supervisorData.cedula,
      supervisorData.password,
      supervisorData.rol
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('debería completar el flujo de seguimiento general exitosamente', async () => {
    // 1. Login como admin para crear contrato
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 2. Login como supervisor para seguimiento
    const supervisorToken = await utils.loginUser(
      supervisorData.cedula,
      supervisorData.password
    );

    // Generar datos de prueba
    const testData = utils.generateTestData();

    // 3. Crear contrato como admin
    const contratoData = {
      ...testData.contrato,
      usuarioCedula: supervisorData.cedula
    };
    const contrato = await utils.createContrato(adminToken, contratoData);
    expect(contrato).toHaveProperty('id');

    // 4. Crear seguimiento general como supervisor
    const seguimientoData = {
      ...testData.seguimientoGeneral,
      contratoId: contrato.id
    };

    const seguimiento = await utils.createSeguimientoGeneral(supervisorToken, seguimientoData);
    expect(seguimiento).toHaveProperty('id');
    expect(seguimiento.contratoId).toBe(contrato.id);
    
    // Verificar que el valorEjecutado sea el valor en pesos que enviamos
    expect(seguimiento.valorEjecutado).toBe(testData.seguimientoGeneral.avanceFinanciero);
    
    // Verificar que avanceFinanciero sea el porcentaje correcto (valorEjecutado / valorTotal * 100)
    const porcentajeEsperado = (testData.seguimientoGeneral.avanceFinanciero / contrato.valorTotal) * 100;
    expect(seguimiento.avanceFinanciero).toBe(porcentajeEsperado);
    
    expect(seguimiento.avanceFisico).toBe(testData.seguimientoGeneral.avanceFisico);

    // 5. Verificar que el seguimiento se puede consultar
    const response = await request(app.getHttpServer())
      .get(`/seguimiento-general/${seguimiento.id}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(200);
    const seguimientoActualizado = response.body;
    expect(seguimientoActualizado.id).toBe(seguimiento.id);
    expect(seguimientoActualizado.valorEjecutado).toBe(testData.seguimientoGeneral.avanceFinanciero);
  });



  it('debería permitir crear múltiples seguimientos para un contrato', async () => {
    // 1. Login como admin para crear contrato
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 2. Login como supervisor para seguimiento
    const supervisorToken = await utils.loginUser(
      supervisorData.cedula,
      supervisorData.password
    );

    // Generar datos de prueba
    const testData = utils.generateTestData();

    // 3. Crear contrato
    const contratoData = {
      ...testData.contrato,
      usuarioCedula: supervisorData.cedula
    };
    const contrato = await utils.createContrato(adminToken, contratoData);

    // 4. Crear primer seguimiento
    const seguimiento1Data = {
      ...testData.seguimientoGeneral,
      contratoId: contrato.id,
      avanceFinanciero: 250000000, // 250 millones (25% del contrato)
      avanceFisico: 30
    };
    const seguimiento1 = await utils.createSeguimientoGeneral(supervisorToken, seguimiento1Data);
    expect(seguimiento1).toHaveProperty('id');

    // 5. Crear segundo seguimiento
    const seguimiento2Data = {
      ...testData.seguimientoGeneral,
      contratoId: contrato.id,
      avanceFinanciero: 500000000, // 500 millones (50% del contrato)
      avanceFisico: 60
    };
    const seguimiento2 = await utils.createSeguimientoGeneral(supervisorToken, seguimiento2Data);
    expect(seguimiento2).toHaveProperty('id');

    // 6. Verificar que ambos seguimientos existen
    expect(seguimiento1.id).not.toBe(seguimiento2.id);
    
    // Verificar valores ejecutados
    expect(seguimiento1.valorEjecutado).toBe(250000000);
    expect(seguimiento2.valorEjecutado).toBe(500000000);
    
    // Verificar porcentajes financieros calculados
    const porcentaje1 = (250000000 / contrato.valorTotal) * 100;
    const porcentaje2 = (500000000 / contrato.valorTotal) * 100;
    expect(seguimiento1.avanceFinanciero).toBe(porcentaje1);
    expect(seguimiento2.avanceFinanciero).toBe(porcentaje2);
  });

  it('debería validar permisos en el seguimiento general', async () => {
    // 1. Crear otro supervisor
    const otroSupervisorData = {
      cedula: '987654321',
      password: 'Supervisor123',
      rol: RolUsuario.SUPERVISOR
    };
    await utils.createTestUser(
      otroSupervisorData.cedula,
      otroSupervisorData.password,
      otroSupervisorData.rol
    );

    // 2. Login como admin para crear contrato
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 3. Login como supervisor original
    const supervisorToken = await utils.loginUser(
      supervisorData.cedula,
      supervisorData.password
    );

    // 4. Crear contrato para el otro supervisor
    const testData = utils.generateTestData();
    const contrato = await utils.createContrato(adminToken, {
      ...testData.contrato,
      usuarioCedula: otroSupervisorData.cedula // Asignar al otro supervisor
    });

    // 5. Intentar crear seguimiento en contrato ajeno (debe fallar)
    const seguimientoData = {
      ...testData.seguimientoGeneral,
      contratoId: contrato.id
    };
    const response = await request(app.getHttpServer())
      .post('/seguimiento-general')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send(seguimientoData);

    // Debería fallar por permisos (403) o no encontrado (404)
    expect([403, 404]).toContain(response.status);
  });


}); 