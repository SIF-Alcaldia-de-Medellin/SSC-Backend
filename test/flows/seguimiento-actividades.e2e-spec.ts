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

describe('Flujo: Seguimiento de Actividades (e2e)', () => {
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
    cedula: '333333333',
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

  it('debería completar el flujo de seguimiento de actividades exitosamente', async () => {
    // 1. Login como admin para crear el contrato
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 2. Login como supervisor para el resto de operaciones
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
    expect(contrato).toHaveProperty('id');
    expect(contrato.usuarioCedula).toBe(supervisorData.cedula);

    // 4. Crear CUO como supervisor
    const cuoData = {
      ...testData.cuo,
      contratoId: contrato.id
    };
    const cuo = await utils.createCUO(supervisorToken, cuoData);
    expect(cuo).toHaveProperty('id');

    // 5. Crear actividad como supervisor
    const actividadData = {
      ...testData.actividad,
      cuoId: cuo.id
    };
    const actividad = await utils.createActividad(supervisorToken, actividadData);
    expect(actividad).toHaveProperty('id');

    // 6. Registrar seguimiento como supervisor
    const seguimientoData = {
      ...testData.seguimientoActividad,
      actividadId: actividad.id
    };
    const seguimiento = await utils.createSeguimientoActividad(supervisorToken, seguimientoData);
    expect(seguimiento).toHaveProperty('id');

    // 7. Verificar que todos los elementos se crearon correctamente
    // Obtener actividad para verificar que existe
    const response = await request(app.getHttpServer())
      .get(`/actividades/${actividad.id}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(200);
    const actividadActualizada = response.body;
    expect(actividadActualizada.id).toBe(actividad.id);
    expect(actividadActualizada.cuoId).toBe(cuo.id);
    expect(actividadActualizada.metaFisica).toBe(100);
    expect(parseInt(actividadActualizada.proyectadoFinanciero)).toBe(100000000);
  });

  it('debería manejar el flujo completo con múltiples elementos', async () => {
    // 1. Login como admin para crear el contrato
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 2. Login como supervisor para el resto de operaciones
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

    // 4. Crear un CUO
    const cuoData = {
      ...testData.cuo,
      contratoId: contrato.id
    };
    const cuo = await utils.createCUO(supervisorToken, cuoData);
    expect(cuo).toHaveProperty('id');

    // 5. Crear múltiples actividades
    const actividad1Data = {
      ...testData.actividad,
      cuoId: cuo.id,
      actividad: 'Primera actividad de prueba'
    };
    const actividad1 = await utils.createActividad(supervisorToken, actividad1Data);
    expect(actividad1).toHaveProperty('id');

    const actividad2Data = {
      ...testData.actividad,
      cuoId: cuo.id,
      actividad: 'Segunda actividad de prueba',
      metaFisica: 200
    };
    const actividad2 = await utils.createActividad(supervisorToken, actividad2Data);
    expect(actividad2).toHaveProperty('id');

    // 6. Crear seguimientos para ambas actividades
    const seguimiento1Data = {
      ...testData.seguimientoActividad,
      actividadId: actividad1.id
    };
    const seguimiento1 = await utils.createSeguimientoActividad(supervisorToken, seguimiento1Data);
    expect(seguimiento1).toHaveProperty('id');

    const seguimiento2Data = {
      ...testData.seguimientoActividad,
      actividadId: actividad2.id,
      avanceFisico: 75
    };
    const seguimiento2 = await utils.createSeguimientoActividad(supervisorToken, seguimiento2Data);
    expect(seguimiento2).toHaveProperty('id');

    // 7. Verificar que se pueden obtener todas las actividades del CUO
    const actividadesResponse = await request(app.getHttpServer())
      .get(`/actividades/cuo/${cuo.id}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(actividadesResponse.status).toBe(200);
    expect(Array.isArray(actividadesResponse.body)).toBe(true);
    expect(actividadesResponse.body.length).toBe(2);
  });
}); 