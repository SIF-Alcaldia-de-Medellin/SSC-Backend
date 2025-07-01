import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestModule } from '../../src/test/test.module';
import { Usuario, RolUsuario } from '../../src/usuarios/usuario.entity';
import { E2EUtils } from '../e2e-utils';
import { TipoModificacion } from '../../src/modificaciones/modificacion.entity';
import { ensureSchema } from '../../src/test/test-config';

describe('Flujo: Modificaciones de Contratos (e2e)', () => {
  let app: INestApplication;
  let utils: E2EUtils;
  let usuarioRepository: Repository<Usuario>;
  let jwtService: JwtService;
  let dataSource: DataSource;

  // Datos de prueba
  const adminData = {
    cedula: '888888888',
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

  it('debería completar el flujo de suspensión de contrato exitosamente', async () => {
    // 1. Login como supervisor
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
    expect(contrato).toHaveProperty('id');

    // 3. Crear suspensión
    const fechaInicio = new Date('2024-02-01');
    const fechaFinal = new Date('2024-02-15');
    const suspensionData = {
      contratoId: contrato.id,
      tipo: TipoModificacion.SUSPENSION,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFinal: fechaFinal.toISOString().split('T')[0],
      observaciones: 'Suspensión por condiciones climáticas'
    };

    const suspension = await utils.createModificacion(token, suspensionData);
    expect(suspension).toHaveProperty('id');
    expect(suspension.tipo).toBe(TipoModificacion.SUSPENSION);
    expect(suspension.duracion).toBe(15); // 15 días inclusive (del 1 al 15 de febrero)

    // 4. Verificar que el contrato refleja la suspensión
    const response = await request(app.getHttpServer())
      .get(`/contratos/${contrato.id}`)
      .set('Authorization', `Bearer ${token}`);

    const contratoActualizado = response.body;
    expect(contratoActualizado.fechaTerminacionActual).not.toBe(contrato.fechaTerminacionActual);
  });

  it('debería completar el flujo de prórroga de contrato exitosamente', async () => {
    // 1. Login como supervisor
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
    const fechaFinOriginal = new Date(contrato.fechaTerminacionActual);

    // 3. Crear prórroga
    const fechaInicio = new Date(contrato.fechaTerminacionActual); // Inicia cuando termina el contrato
    const fechaFinal = new Date(fechaInicio);
    fechaFinal.setMonth(fechaFinal.getMonth() + 2); // Prórroga de 2 meses

    const prorrogaData = {
      contratoId: contrato.id,
      tipo: TipoModificacion.PRORROGA,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFinal: fechaFinal.toISOString().split('T')[0],
      observaciones: 'Prórroga por ampliación de alcance'
    };

    const prorroga = await utils.createModificacion(token, prorrogaData);
    expect(prorroga).toHaveProperty('id');
    expect(prorroga.tipo).toBe(TipoModificacion.PRORROGA);

    // 4. Verificar que el contrato refleja la prórroga
    const response = await request(app.getHttpServer())
      .get(`/contratos/${contrato.id}`)
      .set('Authorization', `Bearer ${token}`);

    const contratoActualizado = response.body;
    const fechaFinNueva = new Date(contratoActualizado.fechaTerminacionActual);
    
    // Las prórrogas SÍ afectan la fecha de terminación del contrato
    expect(fechaFinNueva.getTime()).toBeGreaterThan(fechaFinOriginal.getTime());
    
    // Verificar que la prórroga se creó correctamente con su duración
    expect(prorroga.duracion).toBeGreaterThan(0);
  });

  it('debería validar restricciones en el flujo de modificaciones', async () => {
    // 1. Login como supervisor
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

    // 3. Intentar crear modificación con fechas inválidas
    const modificacionInvalida1 = {
      contratoId: contrato.id,
      tipo: TipoModificacion.SUSPENSION,
      fechaInicio: '2024-02-15',
      fechaFinal: '2024-02-01', // Fecha final antes de la inicial
      observaciones: 'Fechas inválidas'
    };
    await request(app.getHttpServer())
      .post('/modificaciones')
      .set('Authorization', `Bearer ${token}`)
      .send(modificacionInvalida1)
      .expect(400);

    // 4. Intentar crear modificación sin tipo
    const modificacionInvalida2 = {
      contratoId: contrato.id,
      fechaInicio: '2024-02-01',
      fechaFinal: '2024-02-15',
      observaciones: 'Sin tipo de modificación'
    };
    await request(app.getHttpServer())
      .post('/modificaciones')
      .set('Authorization', `Bearer ${token}`)
      .send(modificacionInvalida2)
      .expect(400);
  });

  it('debería validar permisos en el flujo de modificaciones', async () => {
    // 1. Crear dos supervisores
    const supervisor1Data = {
      cedula: '999999999',
      password: 'Supervisor123',
      rol: RolUsuario.SUPERVISOR
    };
    const supervisor2Data = {
      cedula: '101010101',
      password: 'Supervisor456',
      rol: RolUsuario.SUPERVISOR
    };
    
    await utils.createTestUser(
      supervisor1Data.cedula,
      supervisor1Data.password,
      supervisor1Data.rol
    );
    await utils.createTestUser(
      supervisor2Data.cedula,
      supervisor2Data.password,
      supervisor2Data.rol
    );

    // 2. Login como admin para crear el contrato
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 3. Crear contrato para el supervisor 1
    const testData = utils.generateTestData();
    const contrato = await utils.createContrato(adminToken, {
      ...testData.contrato,
      usuarioCedula: supervisor1Data.cedula // Asignar al supervisor 1
    });

    // 4. Login como supervisor 2 (que NO tiene acceso al contrato)
    const supervisor2Token = await utils.loginUser(
      supervisor2Data.cedula,
      supervisor2Data.password
    );

    // 5. Intentar crear modificación en contrato ajeno (debe fallar)
    const modificacionData = {
      contratoId: contrato.id,
      tipo: TipoModificacion.SUSPENSION,
      fechaInicio: '2024-02-01',
      fechaFinal: '2024-02-15',
      observaciones: 'Intento de modificación en contrato ajeno'
    };
    await request(app.getHttpServer())
      .post('/modificaciones')
      .set('Authorization', `Bearer ${supervisor2Token}`)
      .send(modificacionData)
      .expect(403);
  });
}); 