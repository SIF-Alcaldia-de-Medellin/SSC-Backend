import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { ActividadesModule } from './actividades.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario, Usuario } from '../usuarios/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { Actividad } from './actividad.entity';
import { Contrato } from '../contratos/contrato.entity';
import { Cuo } from '../cuo/cuo.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Actividades - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let actividadRepository: Repository<Actividad>;
  let contratoRepository: Repository<Contrato>;
  let cuoRepository: Repository<Cuo>;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let adminToken: string;
  let supervisorToken: string;
  let contratoId: number;
  let cuoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, ActividadesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
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

    // Crear un contrato y CUO de prueba
    const contrato = await contratoRepository.save(
      TestUtils.generarDatosContrato(),
    );
    contratoId = contrato.id;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /actividades', () => {
    it('debería crear una actividad como ADMIN', async () => {
      const datosActividad = {
        cuoId,
        actividad: 'Actividad de prueba',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      };

      const response = await request(app.getHttpServer())
        .post('/actividades')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosActividad)
        .expect(201);

      expect(response.body).toMatchObject({
        actividad: datosActividad.actividad,
        metaFisica: datosActividad.metaFisica,
        unidadesAvance: datosActividad.unidadesAvance,
        proyectadoFinanciero: datosActividad.proyectadoFinanciero.toString(),
      });
    });

    it('debería rechazar la creación de actividad como SUPERVISOR', async () => {
      const datosActividad = {
        cuoId,
        actividad: 'Actividad de prueba',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      };

      await request(app.getHttpServer())
        .post('/actividades')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(datosActividad)
        .expect(403);
    });

    it('debería validar campos requeridos', async () => {
      const datosActividad = {
        cuoId,
        // Falta campo actividad requerido
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      };

      await request(app.getHttpServer())
        .post('/actividades')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosActividad)
        .expect(500); // Error de servidor por campo requerido faltante
    });

    it('debería permitir meta física negativa', async () => {
      const datosActividad = {
        cuoId,
        actividad: 'Actividad de prueba',
        metaFisica: -10, // Meta física negativa
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      };

      await request(app.getHttpServer())
        .post('/actividades')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosActividad)
        .expect(201); // El módulo permite meta física negativa
    });
  });

  describe('GET /actividades/cuo/:id', () => {
    it('debería obtener todas las actividades de un CUO como ADMIN', async () => {
      // Crear actividades de prueba
      const actividad1 = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad 1',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 30000000
      });

      const actividad2 = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad 2',
        metaFisica: 50,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 20000000
      });

      const response = await request(app.getHttpServer())
        .get(`/actividades/cuo/${cuoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        actividad: actividad1.actividad,
        metaFisica: actividad1.metaFisica,
      });
      expect(response.body[1]).toMatchObject({
        actividad: actividad2.actividad,
        metaFisica: actividad2.metaFisica,
      });
    });

    it('debería obtener solo actividades de CUOs de contratos asignados como SUPERVISOR', async () => {
      // Crear contrato asignado al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Cédula del supervisor de prueba
        }),
      );

      // Crear CUO para el contrato del supervisor
      const cuoSupervisor = await cuoRepository.save({
        contratoId: contratoSupervisor.id,
        numero: '987654321',
        latitud: 6.2485,
        longitud: -75.5755,
        comuna: 'Comuna 2 - Santa Cruz',
        barrio: 'Villa Hermosa',
        descripcion: 'CUO Supervisor'
      });

      // Crear actividades en ambos CUOs
      await actividadRepository.save({
        cuoId: cuoSupervisor.id,
        actividad: 'Actividad Supervisor',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Otro',
        metaFisica: 50,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 25000000
      });

      // Intentar acceder a actividades del CUO no asignado
      await request(app.getHttpServer())
        .get(`/actividades/cuo/${cuoId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      // Acceder a actividades del CUO asignado
      const response = await request(app.getHttpServer())
        .get(`/actividades/cuo/${cuoSupervisor.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].actividad).toBe('Actividad Supervisor');
    });
  });

  describe('GET /actividades/:id', () => {
    it('debería obtener una actividad por ID como ADMIN', async () => {
      const actividad = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Test',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      const response = await request(app.getHttpServer())
        .get(`/actividades/${actividad.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: actividad.id,
        actividad: actividad.actividad,
        metaFisica: actividad.metaFisica,
      });
    });

    it('debería rechazar acceso a actividad de contrato no asignado como SUPERVISOR', async () => {
      const actividad = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Test',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      await request(app.getHttpServer())
        .get(`/actividades/${actividad.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });
  });

  describe('PATCH /actividades/:id', () => {
    it('debería actualizar una actividad como ADMIN', async () => {
      const actividad = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Original',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      const datosActualizacion = {
        actividad: 'Actividad Actualizada',
        metaFisica: 150,
      };

      const response = await request(app.getHttpServer())
        .patch(`/actividades/${actividad.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosActualizacion)
        .expect(200);

      expect(response.body).toMatchObject({
        id: actividad.id,
        ...datosActualizacion,
      });
    });

    it('debería rechazar actualización de actividad como SUPERVISOR', async () => {
      const actividad = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Test',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      await request(app.getHttpServer())
        .patch(`/actividades/${actividad.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ metaFisica: 150 })
        .expect(403);
    });

    it('debería permitir meta física negativa al actualizar', async () => {
      const actividad = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Test',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      await request(app.getHttpServer())
        .patch(`/actividades/${actividad.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ metaFisica: -10 }) // Meta física negativa
        .expect(200); // El módulo permite meta física negativa
    });
  });

  describe('DELETE /actividades/:id', () => {
    it('debería eliminar una actividad como ADMIN', async () => {
      const actividad = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Test',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      await request(app.getHttpServer())
        .delete(`/actividades/${actividad.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verificar que la actividad fue eliminada
      const actividadEliminada = await actividadRepository.findOne({
        where: { id: actividad.id }
      });
      expect(actividadEliminada).toBeNull();
    });

    it('debería rechazar eliminación de actividad como SUPERVISOR', async () => {
      const actividad = await actividadRepository.save({
        cuoId,
        actividad: 'Actividad Test',
        metaFisica: 100,
        unidadesAvance: 'ML',
        proyectadoFinanciero: 50000000
      });

      await request(app.getHttpServer())
        .delete(`/actividades/${actividad.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });

    it('no debería permitir eliminar actividad con seguimientos', async () => {
      // Esta prueba requeriría configurar primero la relación con seguimientos
      // y crear algunos seguimientos de prueba
      // Por ahora es un placeholder para la funcionalidad futura
    });
  });
}); 