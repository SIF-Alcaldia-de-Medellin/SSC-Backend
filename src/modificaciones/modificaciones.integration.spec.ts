import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { ModificacionesModule } from './modificaciones.module';
import { Repository } from 'typeorm';
import { Modificacion, TipoModificacion } from './modificacion.entity';
import { Contrato } from '../contratos/contrato.entity';
import { Usuario, RolUsuario } from '../usuarios/usuario.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TestUtils } from '../test/test.utils';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

describe('Modificaciones - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let modificacionRepository: Repository<Modificacion>;
  let contratoRepository: Repository<Contrato>;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let contratoIdAdmin: number;
  let contratoIdSupervisor: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, ModificacionesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    modificacionRepository = moduleFixture.get<Repository<Modificacion>>(
      getRepositoryToken(Modificacion),
    );
    contratoRepository = moduleFixture.get<Repository<Contrato>>(
      getRepositoryToken(Contrato),
    );
    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada prueba
    await TestUtils.limpiarBaseDatos(dataSource);

    // Crear usuarios supervisores primero
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

    // Crear contratos de prueba
    const contratoAdmin = await contratoRepository.save({
      numeroContrato: 'CONT-001',
      anoSuscripcion: 2024,
      programa: 'Programa Test',
      tipoContrato: 'Obra',
      objeto: 'Contrato de prueba admin',
      identificadorSimple: 'CONT-001-2024',
      contratista: 'Contratista Test',
      numeroProceso: 'LP-001-2024',
      fechaInicio: new Date('2024-01-01'),
      fechaTerminacionInicial: new Date('2024-12-31'),
      fechaTerminacionActual: new Date('2024-12-31'),
      valorInicial: 100000000,
      valorTotal: 100000000,
      usuarioCedula: '123456789',
    });
    contratoIdAdmin = contratoAdmin.id;

    const contratoSupervisor = await contratoRepository.save({
      numeroContrato: 'CONT-002',
      anoSuscripcion: 2024,
      programa: 'Programa Test',
      tipoContrato: 'Obra',
      objeto: 'Contrato de prueba supervisor',
      identificadorSimple: 'CONT-002-2024',
      contratista: 'Contratista Test 2',
      numeroProceso: 'LP-002-2024',
      fechaInicio: new Date('2024-01-01'),
      fechaTerminacionInicial: new Date('2024-12-31'),
      fechaTerminacionActual: new Date('2024-12-31'),
      valorInicial: 200000000,
      valorTotal: 200000000,
      usuarioCedula: '987654321',
    });
    contratoIdSupervisor = contratoSupervisor.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /modificaciones', () => {
    it('debería crear una modificación como ADMIN', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');
      
      const nuevaModificacion = {
        contratoId: contratoIdAdmin,
        tipo: TipoModificacion.SUSPENSION,
        fechaInicio: '2024-02-01',
        fechaFinal: '2024-02-15',
        observaciones: 'Suspensión por condiciones climáticas'
      };

      const response = await request(app.getHttpServer())
        .post('/modificaciones')
        .set('Authorization', `Bearer ${token}`)
        .send(nuevaModificacion)
        .expect(201);

      expect(response.body).toMatchObject({
        tipo: TipoModificacion.SUSPENSION,
        duracion: 15, // 15 días entre las fechas (inclusivo)
        observaciones: nuevaModificacion.observaciones
      });
    });

    it('debería crear una modificación como SUPERVISOR en su contrato', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');
      
      const nuevaModificacion = {
        contratoId: contratoIdSupervisor,
        tipo: 'PRORROGA' as TipoModificacion,
        fechaInicio: '2024-03-01',
        fechaFinal: '2024-03-31',
        observaciones: 'Prórroga necesaria'
      };

      const response = await request(app.getHttpServer())
        .post('/modificaciones')
        .set('Authorization', `Bearer ${token}`)
        .send(nuevaModificacion)
        .expect(201);

      expect(response.body).toMatchObject({
        tipo: 'PRORROGA' as TipoModificacion,
        duracion: 31
      });
    });

    it('debería rechazar modificación de SUPERVISOR en contrato ajeno', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');
      
      const nuevaModificacion = {
        contratoId: contratoIdAdmin, // Contrato que no le pertenece
        tipo: TipoModificacion.SUSPENSION,
        fechaInicio: '2024-02-01',
        fechaFinal: '2024-02-15'
      };

      await request(app.getHttpServer())
        .post('/modificaciones')
        .set('Authorization', `Bearer ${token}`)
        .send(nuevaModificacion)
        .expect(403);
    });

    it('debería validar fechas de modificación', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');
      
      const modificacionFechasInvalidas = {
        contratoId: contratoIdAdmin,
        tipo: TipoModificacion.SUSPENSION,
        fechaInicio: '2024-02-15',
        fechaFinal: '2024-02-01' // Fecha final antes de la inicial
      };

      await request(app.getHttpServer())
        .post('/modificaciones')
        .set('Authorization', `Bearer ${token}`)
        .send(modificacionFechasInvalidas)
        .expect(400);
    });
  });

  describe('GET /modificaciones', () => {
    beforeEach(async () => {
      // Crear algunas modificaciones de prueba
      await modificacionRepository.save([
        {
          contratoId: contratoIdAdmin,
          tipo: TipoModificacion.SUSPENSION,
          fechaInicio: new Date('2024-02-01'),
          fechaFinal: new Date('2024-02-15'),
          duracion: 14,
          observaciones: 'Suspensión 1'
        },
        {
          contratoId: contratoIdSupervisor,
          tipo: 'PRORROGA' as TipoModificacion,
          fechaInicio: new Date('2024-03-01'),
          fechaFinal: new Date('2024-03-31'),
          duracion: 30,
          observaciones: 'Prórroga 1'
        }
      ]);
    });

    it('debería obtener todas las modificaciones como ADMIN', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');

      const response = await request(app.getHttpServer())
        .get('/modificaciones')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('tipo');
      expect(response.body[0]).toHaveProperty('duracion');
    });

    it('debería obtener solo modificaciones propias como SUPERVISOR', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');

      const response = await request(app.getHttpServer())
        .get('/modificaciones')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].contratoId).toBe(contratoIdSupervisor);
    });
  });

  describe('GET /modificaciones/:id', () => {
    let modificacionId: number;

    beforeEach(async () => {
      const modificacion = await modificacionRepository.save({
        contratoId: contratoIdAdmin,
        tipo: TipoModificacion.SUSPENSION,
        fechaInicio: new Date('2024-02-01'),
        fechaFinal: new Date('2024-02-15'),
        duracion: 14,
        observaciones: 'Suspensión de prueba'
      });
      modificacionId = modificacion.id;
    });

    it('debería obtener una modificación por ID como ADMIN', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');

      const response = await request(app.getHttpServer())
        .get(`/modificaciones/${modificacionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: modificacionId,
        tipo: TipoModificacion.SUSPENSION,
        duracion: 14
      });
    });

    it('debería rechazar acceso a modificación ajena como SUPERVISOR', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');

      await request(app.getHttpServer())
        .get(`/modificaciones/${modificacionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PATCH /modificaciones/:id', () => {
    let modificacionId: number;

    beforeEach(async () => {
      const modificacion = await modificacionRepository.save({
        contratoId: contratoIdAdmin,
        tipo: TipoModificacion.SUSPENSION,
        fechaInicio: new Date('2024-02-01'),
        fechaFinal: new Date('2024-02-15'),
        duracion: 14,
        observaciones: 'Suspensión inicial'
      });
      modificacionId = modificacion.id;
    });

    it('debería actualizar una modificación como ADMIN', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');
      
      const actualizacion = {
        fechaFinal: '2024-02-28',
        observaciones: 'Suspensión extendida'
      };

      const response = await request(app.getHttpServer())
        .patch(`/modificaciones/${modificacionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(actualizacion)
        .expect(200);

      expect(response.body).toMatchObject({
        id: modificacionId,
        observaciones: actualizacion.observaciones,
        duracion: 29 // Nueva duración (inclusivo)
      });
    });

    it('debería rechazar actualización de SUPERVISOR en modificación ajena', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');
      
      const actualizacion = {
        observaciones: 'Intento de modificación'
      };

      await request(app.getHttpServer())
        .patch(`/modificaciones/${modificacionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(actualizacion)
        .expect(403);
    });
  });

  describe('DELETE /modificaciones/:id', () => {
    let modificacionId: number;

    beforeEach(async () => {
      const modificacion = await modificacionRepository.save({
        contratoId: contratoIdAdmin,
        tipo: TipoModificacion.SUSPENSION,
        fechaInicio: new Date('2024-02-01'),
        fechaFinal: new Date('2024-02-15'),
        duracion: 14,
        observaciones: 'Suspensión a eliminar'
      });
      modificacionId = modificacion.id;
    });

    it('debería eliminar una modificación como ADMIN', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');

      await request(app.getHttpServer())
        .delete(`/modificaciones/${modificacionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verificar que fue eliminada
      const modificacionEliminada = await modificacionRepository.findOne({
        where: { id: modificacionId }
      });
      expect(modificacionEliminada).toBeNull();
    });

    it('debería rechazar eliminación como SUPERVISOR', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');

      await request(app.getHttpServer())
        .delete(`/modificaciones/${modificacionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verificar que no fue eliminada
      const modificacionExistente = await modificacionRepository.findOne({
        where: { id: modificacionId }
      });
      expect(modificacionExistente).toBeTruthy();
    });
  });

  describe('GET /modificaciones/contrato/:id', () => {
    beforeEach(async () => {
      // Crear varias modificaciones para un contrato
      await modificacionRepository.save([
        {
          contratoId: contratoIdAdmin,
          tipo: TipoModificacion.SUSPENSION,
          fechaInicio: new Date('2024-02-01'),
          fechaFinal: new Date('2024-02-15'),
          duracion: 14,
          observaciones: 'Suspensión 1'
        },
        {
          contratoId: contratoIdAdmin,
          tipo: 'PRORROGA' as TipoModificacion,
          fechaInicio: new Date('2024-02-15'),
          fechaFinal: new Date('2024-02-28'),
          duracion: 13,
          observaciones: 'Prórroga 1'
        }
      ]);
    });

    it('debería obtener todas las modificaciones de un contrato como ADMIN', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');

      const response = await request(app.getHttpServer())
        .get(`/modificaciones/contrato/${contratoIdAdmin}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].contratoId).toBe(contratoIdAdmin);
      expect(response.body[1].contratoId).toBe(contratoIdAdmin);
    });

    it('debería rechazar acceso a modificaciones de contrato ajeno como SUPERVISOR', async () => {
      const token = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');

      await request(app.getHttpServer())
        .get(`/modificaciones/contrato/${contratoIdAdmin}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
}); 