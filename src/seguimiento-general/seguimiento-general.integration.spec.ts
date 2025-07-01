import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { SeguimientoGeneralModule } from './seguimiento-general.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario, Usuario } from '../usuarios/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { SeguimientoGeneral } from './seguimiento-general.entity';
import { Contrato } from '../contratos/contrato.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Seguimiento General - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let seguimientoRepository: Repository<SeguimientoGeneral>;
  let contratoRepository: Repository<Contrato>;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let adminToken: string;
  let supervisorToken: string;
  let contratoId: number;
  let valorTotalContrato: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, SeguimientoGeneralModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    seguimientoRepository = moduleFixture.get<Repository<SeguimientoGeneral>>(
      getRepositoryToken(SeguimientoGeneral),
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
    valorTotalContrato = contrato.valorTotal;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /seguimiento-general', () => {
    it('debería crear un seguimiento general como ADMIN', async () => {
      const datosSeguimiento = {
        contratoId,
        avanceFinanciero: 150000000, // Valor monetario
        avanceFisico: 45.5, // Porcentaje
        observaciones: 'Seguimiento de prueba'
      };

      const response = await request(app.getHttpServer())
        .post('/seguimiento-general')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosSeguimiento)
        .expect(201);

      expect(response.body).toMatchObject({
        valorEjecutado: datosSeguimiento.avanceFinanciero,
        avanceFisico: datosSeguimiento.avanceFisico,
        avanceFinanciero: Number((datosSeguimiento.avanceFinanciero / valorTotalContrato * 100).toFixed(2)),
        observaciones: datosSeguimiento.observaciones,
      });
    });

    it('debería crear un seguimiento general como SUPERVISOR del contrato', async () => {
      // Crear contrato asignado al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Cédula del supervisor de prueba
        }),
      );

      const datosSeguimiento = {
        contratoId: contratoSupervisor.id,
        avanceFinanciero: 150000000,
        avanceFisico: 45.5,
        observaciones: 'Seguimiento de prueba supervisor'
      };

      const response = await request(app.getHttpServer())
        .post('/seguimiento-general')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(datosSeguimiento)
        .expect(201);

      expect(response.body.valorEjecutado).toBe(datosSeguimiento.avanceFinanciero);
    });

    it('debería permitir seguimiento con valor ejecutado mayor al valor del contrato', async () => {
      const datosSeguimiento = {
        contratoId,
        avanceFinanciero: 500000000, // Mayor que el valor del contrato
        avanceFisico: 45.5,
        observaciones: 'Seguimiento de prueba'
      };

      await request(app.getHttpServer())
        .post('/seguimiento-general')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosSeguimiento)
        .expect(201); // El módulo actualmente permite valores mayores al contrato
    });

    it('debería rechazar seguimiento con porcentaje de avance físico inválido', async () => {
      const datosSeguimiento = {
        contratoId,
        avanceFinanciero: 150000000,
        avanceFisico: 120, // Mayor que 100%
        observaciones: 'Seguimiento de prueba'
      };

      await request(app.getHttpServer())
        .post('/seguimiento-general')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosSeguimiento)
        .expect(400);
    });
  });

  describe('GET /seguimiento-general/contrato/:id', () => {
    it('debería obtener todos los seguimientos de un contrato como ADMIN', async () => {
      // Crear seguimientos de prueba
      const seguimiento1 = await seguimientoRepository.save({
        contratoId,
        avanceFinanciero: 100000000,
        avanceFisico: 30.5,
        observaciones: 'Primer seguimiento'
      });

      const seguimiento2 = await seguimientoRepository.save({
        contratoId,
        avanceFinanciero: 150000000,
        avanceFisico: 45.5,
        observaciones: 'Segundo seguimiento'
      });

      const response = await request(app.getHttpServer())
        .get(`/seguimiento-general/contrato/${contratoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].valorEjecutado).toBe(seguimiento2.avanceFinanciero);
      expect(response.body[1].valorEjecutado).toBe(seguimiento1.avanceFinanciero);
    });

    it('debería obtener solo seguimientos de contratos asignados como SUPERVISOR', async () => {
      // Crear contrato asignado al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Cédula del supervisor de prueba
        }),
      );

      // Crear seguimientos en ambos contratos
      await seguimientoRepository.save({
        contratoId: contratoSupervisor.id,
        avanceFinanciero: 100000000,
        avanceFisico: 30.5,
        observaciones: 'Seguimiento supervisor'
      });

      await seguimientoRepository.save({
        contratoId,
        avanceFinanciero: 150000000,
        avanceFisico: 45.5,
        observaciones: 'Seguimiento otro contrato'
      });

      // Intentar acceder a seguimientos del contrato no asignado
      await request(app.getHttpServer())
        .get(`/seguimiento-general/contrato/${contratoId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      // Acceder a seguimientos del contrato asignado
      const response = await request(app.getHttpServer())
        .get(`/seguimiento-general/contrato/${contratoSupervisor.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].avanceFisico).toBe(30.5);
    });
  });

  describe('GET /seguimiento-general/contrato/numero/:numeroContrato', () => {
    it('debería obtener seguimientos por número de contrato como ADMIN', async () => {
      const contrato = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000123',
        }),
      );

      await seguimientoRepository.save({
        contratoId: contrato.id,
        avanceFinanciero: 100000000,
        avanceFisico: 30.5,
        observaciones: 'Seguimiento por número'
      });

      const response = await request(app.getHttpServer())
        .get('/seguimiento-general/contrato/numero/460000123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].avanceFisico).toBe(30.5);
    });

    it('debería rechazar acceso a contrato no asignado por número como SUPERVISOR', async () => {
      await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000123',
          usuarioCedula: '123456789', // Diferente a la cédula del supervisor
        }),
      );

      await request(app.getHttpServer())
        .get('/seguimiento-general/contrato/numero/460000123')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });
  });

  describe('GET /seguimiento-general/:id', () => {
    it('debería obtener un seguimiento específico como ADMIN', async () => {
      const seguimiento = await seguimientoRepository.save({
        contratoId,
        avanceFinanciero: 100000000,
        avanceFisico: 30.5,
        observaciones: 'Seguimiento individual'
      });

      const response = await request(app.getHttpServer())
        .get(`/seguimiento-general/${seguimiento.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: seguimiento.id,
        valorEjecutado: seguimiento.avanceFinanciero,
        avanceFisico: seguimiento.avanceFisico,
      });
    });

    it('debería incluir información calculada en la respuesta', async () => {
      const seguimiento = await seguimientoRepository.save({
        contratoId,
        avanceFinanciero: 100000000,
        avanceFisico: 30.5,
        observaciones: 'Seguimiento con cálculos'
      });

      const response = await request(app.getHttpServer())
        .get(`/seguimiento-general/${seguimiento.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        valorEjecutado: seguimiento.avanceFinanciero,
        avanceFinanciero: Number((seguimiento.avanceFinanciero / valorTotalContrato * 100).toFixed(2)),
        diferenciaAvance: Number((seguimiento.avanceFisico - (seguimiento.avanceFinanciero / valorTotalContrato * 100)).toFixed(2)),
      });

      // Verificar que incluye el estado del avance
      expect(response.body.estadoAvance).toMatch(/^(ATRASADO|NORMAL|ADELANTADO)$/);
      expect(response.body.resumenEstado).toContain(response.body.estadoAvance);
    });

    it('debería rechazar acceso a seguimiento de contrato no asignado como SUPERVISOR', async () => {
      const seguimiento = await seguimientoRepository.save({
        contratoId,
        avanceFinanciero: 100000000,
        avanceFisico: 30.5,
        observaciones: 'Seguimiento no accesible'
      });

      await request(app.getHttpServer())
        .get(`/seguimiento-general/${seguimiento.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });
  });
}); 