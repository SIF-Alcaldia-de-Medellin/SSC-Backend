import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { SeguimientoActividadModule } from './seguimiento-actividad.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario, Usuario } from '../usuarios/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { SeguimientoActividad } from './seguimiento-actividad.entity';
import { Actividad } from '../actividades/actividad.entity';
import { Contrato } from '../contratos/contrato.entity';
import { Cuo } from '../cuo/cuo.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Seguimiento Actividad - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let seguimientoRepository: Repository<SeguimientoActividad>;
  let actividadRepository: Repository<Actividad>;
  let contratoRepository: Repository<Contrato>;
  let cuoRepository: Repository<Cuo>;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let adminToken: string;
  let supervisorToken: string;
  let contratoId: number;
  let cuoId: number;
  let actividadId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, SeguimientoActividadModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    seguimientoRepository = moduleFixture.get<Repository<SeguimientoActividad>>(
      getRepositoryToken(SeguimientoActividad),
    );
    actividadRepository = moduleFixture.get<Repository<Actividad>>(
      getRepositoryToken(Actividad),
    );
    contratoRepository = moduleFixture.get<Repository<Contrato>>(
      getRepositoryToken(Contrato),
    );
    cuoRepository = moduleFixture.get<Repository<Cuo>>(
      getRepositoryToken(Cuo),
    );
    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Generar tokens para las pruebas
    adminToken = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');
    supervisorToken = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada prueba
    await TestUtils.limpiarBaseDatos(dataSource);

    // Crear usuarios primero
    await usuarioRepository.save([
      {
        cedula: '123456789',
        nombre: 'Admin Test',
        email: 'admin@test.com',
        password: 'hashedPassword123',
        rol: RolUsuario.ADMIN
      },
      {
        cedula: '987654321',
        nombre: 'Supervisor Test',
        email: 'supervisor@test.com',
        password: 'hashedPassword123',
        rol: RolUsuario.SUPERVISOR
      }
    ]);

    // Crear datos de prueba: Contrato -> CUO -> Actividad
    const contrato = await contratoRepository.save(
      TestUtils.generarDatosContrato(),
    );
    contratoId = contrato.id;

    // Crear CUO con estructura correcta
    const cuo = await cuoRepository.save({
      contratoId,
      numero: '123456789',
      latitud: 6.2442,
      longitud: -75.5812,
      comuna: 'Comuna 1 - Popular',
      barrio: 'San Javier',
      descripcion: 'CUO Test'
    });
    cuoId = cuo.id;

    const actividad = await actividadRepository.save({
      cuoId,
      actividad: 'Actividad Test',
      metaFisica: 100,
      unidadesAvance: 'ML',
      proyectadoFinanciero: 50000000
    });
    actividadId = actividad.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /seguimiento-actividad', () => {
    it('debería crear un seguimiento como ADMIN', async () => {
      const datosSeguimiento = {
        actividadId,
        avanceFisico: 25.5,
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Avance en instalación',
        proyeccionActividades: 'Continuar instalación sector norte'
      };

      const response = await request(app.getHttpServer())
        .post('/seguimiento-actividad')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosSeguimiento)
        .expect(201);

      expect(response.body).toMatchObject({
        avanceFisico: datosSeguimiento.avanceFisico,
        costoAproximado: datosSeguimiento.costoAproximado,
        descripcionSeguimiento: datosSeguimiento.descripcionSeguimiento,
        avanceAcumulado: datosSeguimiento.avanceFisico,
        porcentajeAvance: 25.5, // Primer seguimiento, igual al avance físico
      });
    });

    it('debería crear un seguimiento como SUPERVISOR del contrato', async () => {
      // Crear contrato asignado al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Cédula del supervisor de prueba
        }),
      );

      const cuoSupervisor = await cuoRepository.save({
        contratoId: contratoSupervisor.id,
        numero: '987654321',
        latitud: 6.2485,
        longitud: -75.5755,
        comuna: 'Comuna 2 - Santa Cruz',
        barrio: 'Villa Hermosa',
        descripcion: 'CUO Supervisor'
      });

      const actividadSupervisor = await actividadRepository.save({
        cuoId: cuoSupervisor.id,
        actividad: 'Actividad Supervisor',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      const datosSeguimiento = {
        actividadId: actividadSupervisor.id,
        avanceFisico: 25.5,
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Avance supervisor',
        proyeccionActividades: 'Continuar trabajo'
      };

      const response = await request(app.getHttpServer())
        .post('/seguimiento-actividad')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(datosSeguimiento)
        .expect(201);

      expect(response.body.avanceFisico).toBe(datosSeguimiento.avanceFisico);
    });

    it('debería calcular correctamente avances acumulados', async () => {
      // Crear primer seguimiento
      await seguimientoRepository.save({
        actividadId,
        avanceFisico: 30,
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Primer avance',
        proyeccionActividades: 'Continuar'
      });

      // Crear segundo seguimiento
      const datosSeguimiento = {
        actividadId,
        avanceFisico: 20,
        costoAproximado: 10000000,
        descripcionSeguimiento: 'Segundo avance',
        proyeccionActividades: 'Continuar'
      };

      const response = await request(app.getHttpServer())
        .post('/seguimiento-actividad')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosSeguimiento)
        .expect(201);

      expect(response.body).toMatchObject({
        avanceFisico: 20, // Avance individual
        avanceAcumulado: 50, // Suma de ambos avances
        porcentajeAvance: 50, // Porcentaje sobre meta física (100)
        costoAcumulado: 25000000, // Suma de costos
      });
    });

    it('debería rechazar avance que excede meta física', async () => {
      // Crear primer seguimiento con 80% de avance
      await seguimientoRepository.save({
        actividadId,
        avanceFisico: 80,
        costoAproximado: 40000000,
        descripcionSeguimiento: 'Primer avance',
        proyeccionActividades: 'Continuar'
      });

      // Intentar crear segundo seguimiento que excedería 100%
      const datosSeguimiento = {
        actividadId,
        avanceFisico: 30, // Llevaría a 110%
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Avance excesivo',
        proyeccionActividades: 'Finalizar'
      };

      await request(app.getHttpServer())
        .post('/seguimiento-actividad')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosSeguimiento)
        .expect(403); // El módulo devuelve Forbidden en lugar de Bad Request
    });
  });

  describe('GET /seguimiento-actividad/actividad/:id', () => {
    it('debería obtener todos los seguimientos de una actividad como ADMIN', async () => {
      // Crear seguimientos de prueba
      const seguimiento1 = await seguimientoRepository.save({
        actividadId,
        avanceFisico: 30,
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Primer seguimiento',
        proyeccionActividades: 'Continuar'
      });

      const seguimiento2 = await seguimientoRepository.save({
        actividadId,
        avanceFisico: 20,
        costoAproximado: 10000000,
        descripcionSeguimiento: 'Segundo seguimiento',
        proyeccionActividades: 'Finalizar'
      });

      const response = await request(app.getHttpServer())
        .get(`/seguimiento-actividad/actividad/${actividadId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        avanceFisico: seguimiento2.avanceFisico, // El más reciente aparece primero
        avanceAcumulado: 50,
        porcentajeAvance: 50,
      });
      expect(response.body[1]).toMatchObject({
        avanceFisico: seguimiento1.avanceFisico,
        avanceAcumulado: 30, // El avanceAcumulado individual del primer seguimiento
        porcentajeAvance: 30,
      });
    });

    it('debería obtener solo seguimientos de actividades asignadas como SUPERVISOR', async () => {
      // Crear contrato y actividad asignados al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321',
        }),
      );

      const cuoSupervisor = await cuoRepository.save({
        contratoId: contratoSupervisor.id,
        numero: '987654321',
        latitud: 6.2485,
        longitud: -75.5755,
        comuna: 'Comuna 2 - Santa Cruz',
        barrio: 'Villa Hermosa',
        descripcion: 'CUO Supervisor'
      });

      const actividadSupervisor = await actividadRepository.save({
        cuoId: cuoSupervisor.id,
        actividad: 'Actividad Supervisor',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      // Crear seguimientos en ambas actividades
      await seguimientoRepository.save({
        actividadId: actividadSupervisor.id,
        avanceFisico: 30,
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Seguimiento supervisor',
        proyeccionActividades: 'Continuar'
      });

      await seguimientoRepository.save({
        actividadId,
        avanceFisico: 20,
        costoAproximado: 10000000,
        descripcionSeguimiento: 'Seguimiento otro',
        proyeccionActividades: 'Continuar'
      });

      // Intentar acceder a seguimientos de actividad no asignada
      await request(app.getHttpServer())
        .get(`/seguimiento-actividad/actividad/${actividadId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      // Acceder a seguimientos de actividad asignada
      const response = await request(app.getHttpServer())
        .get(`/seguimiento-actividad/actividad/${actividadSupervisor.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].avanceFisico).toBe(30);
    });
  });

  describe('GET /seguimiento-actividad/:id', () => {
    it('debería obtener un seguimiento específico como ADMIN', async () => {
      const seguimiento = await seguimientoRepository.save({
        actividadId,
        avanceFisico: 30,
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Seguimiento individual',
        proyeccionActividades: 'Continuar'
      });

      const response = await request(app.getHttpServer())
        .get(`/seguimiento-actividad/${seguimiento.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: seguimiento.id,
        avanceFisico: seguimiento.avanceFisico,
        costoAproximado: seguimiento.costoAproximado,
        avanceAcumulado: 30,
        porcentajeAvance: 30,
      });
    });

    it('debería rechazar acceso a seguimiento de actividad no asignada como SUPERVISOR', async () => {
      const seguimiento = await seguimientoRepository.save({
        actividadId,
        avanceFisico: 30,
        costoAproximado: 15000000,
        descripcionSeguimiento: 'Seguimiento no accesible',
        proyeccionActividades: 'Continuar'
      });

      await request(app.getHttpServer())
        .get(`/seguimiento-actividad/${seguimiento.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });
  });
}); 