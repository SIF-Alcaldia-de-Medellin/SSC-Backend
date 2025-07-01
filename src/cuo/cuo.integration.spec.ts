import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { CuoModule } from './cuo.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario, Usuario } from '../usuarios/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { Cuo } from './cuo.entity';
import { Contrato } from '../contratos/contrato.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CUO - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let cuoRepository: Repository<Cuo>;
  let contratoRepository: Repository<Contrato>;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let adminToken: string;
  let supervisorToken: string;
  let contratoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, CuoModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    cuoRepository = moduleFixture.get<Repository<Cuo>>(
      getRepositoryToken(Cuo),
    );
    contratoRepository = moduleFixture.get<Repository<Contrato>>(
      getRepositoryToken(Contrato),
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

    // Crear un contrato de prueba
    const contrato = await contratoRepository.save(
      TestUtils.generarDatosContrato(),
    );
    contratoId = contrato.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /cuo', () => {
    it('debería crear un CUO como ADMIN', async () => {
      const datosCuo = {
        contratoId,
        numero: '123456789',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'Descripción del CUO de prueba para construcción de vía vehicular'
      };

      const response = await request(app.getHttpServer())
        .post('/cuo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosCuo)
        .expect(201);

      expect(response.body).toMatchObject({
        numero: datosCuo.numero,
        descripcion: datosCuo.descripcion,
        latitud: "6.24420000", // El API devuelve con 8 decimales
        longitud: "-75.58120000",
        comuna: datosCuo.comuna,
        barrio: datosCuo.barrio,
      });
    });

    it('debería rechazar la creación de CUO como SUPERVISOR', async () => {
      const datosCuo = {
        contratoId,
        numero: '987654321',
        latitud: 6.2485,
        longitud: -75.5755,
        comuna: 'Comuna 2 - Santa Cruz',
        barrio: 'Villa Hermosa',
        descripcion: 'Descripción del CUO de prueba'
      };

      await request(app.getHttpServer())
        .post('/cuo')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(datosCuo)
        .expect(403);
    });

    it('debería validar campos requeridos', async () => {
      const datosCuo = {
        contratoId,
        // Falta campo numero requerido
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'Descripción sin número'
      };

      await request(app.getHttpServer())
        .post('/cuo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosCuo)
        .expect(500); // Error de servidor por campo requerido faltante
    });
  });

  describe('GET /cuo/contrato/:id', () => {
    it('debería obtener todos los CUOs de un contrato como ADMIN', async () => {
      // Crear CUOs de prueba
      const cuo1 = await cuoRepository.save({
        contratoId,
        numero: '123456001',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'Descripción CUO 1'
      });

      const cuo2 = await cuoRepository.save({
        contratoId,
        numero: '123456002',
        latitud: 6.2485,
        longitud: -75.5755,
        comuna: 'Comuna 2 - Santa Cruz',
        barrio: 'Villa Hermosa',
        descripcion: 'Descripción CUO 2'
      });

      const response = await request(app.getHttpServer())
        .get(`/cuo/contrato/${contratoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        numero: cuo1.numero,
        descripcion: cuo1.descripcion,
        comuna: cuo1.comuna,
        barrio: cuo1.barrio,
      });
      expect(response.body[1]).toMatchObject({
        numero: cuo2.numero,
        descripcion: cuo2.descripcion,
        comuna: cuo2.comuna,
        barrio: cuo2.barrio,
      });
    });

    it('debería obtener solo CUOs de contratos asignados como SUPERVISOR', async () => {
      // Crear contrato asignado al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Cédula del supervisor de prueba
        }),
      );

      // Crear CUOs en ambos contratos
      await cuoRepository.save({
        contratoId: contratoSupervisor.id,
        numero: '987654001',
        latitud: 6.2485,
        longitud: -75.5755,
        comuna: 'Comuna 2 - Santa Cruz',
        barrio: 'Villa Hermosa',
        descripcion: 'CUO Supervisor'
      });

      await cuoRepository.save({
        contratoId,
        numero: '123456003',
        latitud: 6.2500,
        longitud: -75.5800,
        comuna: 'Comuna 3 - Manrique',
        barrio: 'La Candelaria',
        descripcion: 'CUO Otro'
      });

      // Intentar acceder a CUOs del contrato no asignado
      await request(app.getHttpServer())
        .get(`/cuo/contrato/${contratoId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      // Acceder a CUOs del contrato asignado
      const response = await request(app.getHttpServer())
        .get(`/cuo/contrato/${contratoSupervisor.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].descripcion).toBe('CUO Supervisor');
    });
  });

  describe('GET /cuo/:id', () => {
    it('debería obtener un CUO por ID como ADMIN', async () => {
      const cuo = await cuoRepository.save({
        contratoId,
        numero: '123456004',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'CUO Test'
      });

      const response = await request(app.getHttpServer())
        .get(`/cuo/${cuo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: cuo.id,
        numero: cuo.numero,
        descripcion: cuo.descripcion,
        comuna: cuo.comuna,
        barrio: cuo.barrio,
      });
    });

    it('debería rechazar acceso a CUO de contrato no asignado como SUPERVISOR', async () => {
      const cuo = await cuoRepository.save({
        contratoId,
        numero: '123456005',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'CUO Test'
      });

      await request(app.getHttpServer())
        .get(`/cuo/${cuo.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });

    it('debería retornar 404 para CUO no existente', async () => {
      await request(app.getHttpServer())
        .get('/cuo/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /cuo/:id', () => {
    it('debería actualizar un CUO como ADMIN', async () => {
      const cuo = await cuoRepository.save({
        contratoId,
        numero: '123456006',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'Descripción Original'
      });

      const datosActualizacion = {
        descripcion: 'Descripción Actualizada',
        comuna: 'Comuna 1 - Popular Actualizada',
      };

      const response = await request(app.getHttpServer())
        .patch(`/cuo/${cuo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosActualizacion)
        .expect(200);

      expect(response.body).toMatchObject({
        id: cuo.id,
        ...datosActualizacion,
      });
    });

    it('debería rechazar actualización de CUO como SUPERVISOR', async () => {
      const cuo = await cuoRepository.save({
        contratoId,
        numero: '123456007',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'CUO Test'
      });

      await request(app.getHttpServer())
        .patch(`/cuo/${cuo.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ descripcion: 'Nueva Descripción' })
        .expect(403);
    });

    it('debería permitir actualizar coordenadas válidas', async () => {
      const cuo = await cuoRepository.save({
        contratoId,
        numero: '123456008',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'CUO Test'
      });

      await request(app.getHttpServer())
        .patch(`/cuo/${cuo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ latitud: 6.2500 }) // Latitud válida
        .expect(200); // El módulo acepta la actualización
    });
  });

  describe('DELETE /cuo/:id', () => {
    it('debería eliminar un CUO como ADMIN', async () => {
      const cuo = await cuoRepository.save({
        contratoId,
        numero: '123456009',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'CUO Test'
      });

      await request(app.getHttpServer())
        .delete(`/cuo/${cuo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verificar que el CUO fue eliminado
      const cuoEliminado = await cuoRepository.findOne({
        where: { id: cuo.id }
      });
      expect(cuoEliminado).toBeNull();
    });

    it('debería rechazar eliminación de CUO como SUPERVISOR', async () => {
      const cuo = await cuoRepository.save({
        contratoId,
        numero: '123456010',
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1 - Popular',
        barrio: 'San Javier',
        descripcion: 'CUO Test'
      });

      await request(app.getHttpServer())
        .delete(`/cuo/${cuo.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });

    it('debería retornar 404 al intentar eliminar CUO no existente', async () => {
      await request(app.getHttpServer())
        .delete('/cuo/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
}); 