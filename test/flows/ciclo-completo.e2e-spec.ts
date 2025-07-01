import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestModule } from '../../src/test/test.module';
import { Usuario, RolUsuario } from '../../src/usuarios/usuario.entity';
import { E2EUtils } from '../e2e-utils';
import { TipoModificacion } from '../../src/modificaciones/modificacion.entity';
import { ensureSchema } from '../../src/test/test-config';

describe('Flujo: Ciclo Completo de Contrato (e2e)', () => {
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
    cedula: '444444444',
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

  it('debería completar el ciclo de vida de un contrato exitosamente', async () => {
    // 1. Login como admin
    const adminToken = await utils.loginUser(
      adminData.cedula,
      adminData.password
    );

    // 2. Login como supervisor
    const supervisorToken = await utils.loginUser(
      supervisorData.cedula,
      supervisorData.password
    );

    // 3. Crear contrato y asignar supervisor
    const testData = utils.generateTestData();
    const contratoData = {
      ...testData.contrato,
      usuarioCedula: supervisorData.cedula
    };
    const contrato = await utils.createContrato(adminToken, contratoData);
    expect(contrato).toHaveProperty('id');
    expect(contrato.usuarioCedula).toBe(supervisorData.cedula);

    // 4. Crear CUO
    const cuoData = {
      ...testData.cuo,
      contratoId: contrato.id
    };
    const cuo = await utils.createCUO(supervisorToken, cuoData);
    expect(cuo).toHaveProperty('id');

    // 5. Crear actividades
    const actividadData = {
      ...testData.actividad,
      cuoId: cuo.id
    };
    const actividad = await utils.createActividad(supervisorToken, actividadData);
    expect(actividad).toHaveProperty('id');

    // 6. Registrar primer seguimiento
    const seguimientoData = {
      ...testData.seguimientoActividad,
      actividadId: actividad.id,
      avanceFisico: 30 // 30% inicial
    };
    const seguimiento = await utils.createSeguimientoActividad(supervisorToken, seguimientoData);
    expect(seguimiento).toHaveProperty('id');

    // 7. Crear suspensión
    const fechaInicio = new Date();
    const fechaFinal = new Date();
    fechaFinal.setDate(fechaFinal.getDate() + 15); // 15 días de suspensión

    const suspensionData = {
      contratoId: contrato.id,
      tipo: TipoModificacion.SUSPENSION,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFinal: fechaFinal.toISOString().split('T')[0],
      observaciones: 'Suspensión por condiciones climáticas'
    };
    const suspension = await utils.createModificacion(supervisorToken, suspensionData);
    expect(suspension).toHaveProperty('id');

    // 8. Registrar seguimiento general durante suspensión
    const seguimientoSuspension = {
      ...testData.seguimientoGeneral,
      contratoId: contrato.id,
      avanceFinanciero: 30,
      avanceFisico: 30,
      observaciones: 'Contrato suspendido por lluvias'
    };
    await utils.createSeguimientoGeneral(supervisorToken, seguimientoSuspension);

    // 9. Crear prórroga
    const fechaInicioProrra = new Date(contrato.fechaTerminacionActual);
    const fechaFinProrroga = new Date(fechaInicioProrra);
    fechaFinProrroga.setMonth(fechaFinProrroga.getMonth() + 1);

    const prorrogaData = {
      contratoId: contrato.id,
      tipo: TipoModificacion.PRORROGA,
      fechaInicio: fechaInicioProrra.toISOString().split('T')[0],
      fechaFinal: fechaFinProrroga.toISOString().split('T')[0],
      observaciones: 'Prórroga por retrasos causados por el clima'
    };
    const prorroga = await utils.createModificacion(supervisorToken, prorrogaData);
    expect(prorroga).toHaveProperty('id');

    // 10. Crear adición
    const adicionData = {
      contratoId: contrato.id,
      valorAdicion: 500000000,
      fecha: new Date().toISOString().split('T')[0],
      observaciones: 'Adición por mayores cantidades de obra'
    };
    const adicion = await utils.createAdicion(adminToken, adicionData);
    expect(adicion).toHaveProperty('id');

    // 11. Registrar más avance en actividades
    const seguimientoFinal = {
      ...testData.seguimientoActividad,
      actividadId: actividad.id,
      avanceFisico: 100, // Completar la actividad
      observaciones: 'Actividad completada'
    };
    await utils.createSeguimientoActividad(supervisorToken, seguimientoFinal);

    // 12. Registrar seguimiento general final
    const seguimientoFinalGeneral = {
      ...testData.seguimientoGeneral,
      contratoId: contrato.id,
      avanceFinanciero: 100,
      avanceFisico: 100,
      observaciones: 'Contrato completado exitosamente'
    };
    await utils.createSeguimientoGeneral(supervisorToken, seguimientoFinalGeneral);

    // 13. Verificar estado final del contrato
    const responseContrato = await request(app.getHttpServer())
      .get(`/contratos/${contrato.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(responseContrato.status).toBe(200);
    const contratoFinal = responseContrato.body;
    expect(contratoFinal.id).toBe(contrato.id);
    
    // Verificar que el valor total incluye la adición
    expect(parseInt(contratoFinal.valorTotal)).toBe(parseInt(contrato.valorTotal) + parseInt(adicion.valorAdicion));

    // 14. Verificar que se crearon las modificaciones
    expect(suspension.id).toBeDefined();
    expect(prorroga.id).toBeDefined();
    expect(adicion.id).toBeDefined();
  });
}); 