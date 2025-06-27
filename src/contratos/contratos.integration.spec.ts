import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { ContratosModule } from './contratos.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario } from '../usuarios/usuario.entity';
import { Repository } from 'typeorm';
import { Contrato } from './contrato.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Contratos - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let contratoRepository: Repository<Contrato>;
  let adminToken: string;
  let supervisorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, ContratosModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    contratoRepository = moduleFixture.get<Repository<Contrato>>(
      getRepositoryToken(Contrato),
    );

    // Generar tokens para las pruebas
    adminToken = TestUtils.generarToken(jwtService, RolUsuario.ADMIN);
    supervisorToken = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR);
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada prueba
    await contratoRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /contratos', () => {
    it('debería crear un contrato como ADMIN', async () => {
      const datosContrato = TestUtils.generarDatosContrato();

      const response = await request(app.getHttpServer())
        .post('/contratos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosContrato)
        .expect(201);

      expect(response.body).toMatchObject({
        numeroContrato: datosContrato.numeroContrato,
        identificadorSimple: datosContrato.identificadorSimple,
        valorTotal: datosContrato.valorTotal,
      });
    });

    it('debería rechazar la creación de contrato como SUPERVISOR', async () => {
      const datosContrato = TestUtils.generarDatosContrato();

      await request(app.getHttpServer())
        .post('/contratos')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(datosContrato)
        .expect(403);
    });

    it('debería validar número de contrato duplicado', async () => {
      const datosContrato = TestUtils.generarDatosContrato();

      // Crear primer contrato
      await request(app.getHttpServer())
        .post('/contratos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosContrato)
        .expect(201);

      // Intentar crear segundo contrato con mismo número
      await request(app.getHttpServer())
        .post('/contratos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosContrato)
        .expect(400);
    });
  });

  describe('GET /contratos', () => {
    it('debería obtener todos los contratos como ADMIN', async () => {
      // Crear contratos de prueba
      const contrato1 = await contratoRepository.save(
        TestUtils.generarDatosContrato({ numeroContrato: '460000123' }),
      );
      const contrato2 = await contratoRepository.save(
        TestUtils.generarDatosContrato({ numeroContrato: '460000124' }),
      );

      const response = await request(app.getHttpServer())
        .get('/contratos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        numeroContrato: contrato1.numeroContrato,
      });
      expect(response.body[1]).toMatchObject({
        numeroContrato: contrato2.numeroContrato,
      });
    });

    it('debería obtener solo contratos asignados como SUPERVISOR', async () => {
      // Crear contratos de prueba
      await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000123',
          usuarioCedula: '123456789', // Cédula del supervisor de prueba
        }),
      );
      await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Otra cédula
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/contratos')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].numeroContrato).toBe('460000123');
    });
  });

  describe('GET /contratos/:id', () => {
    it('debería obtener un contrato por ID como ADMIN', async () => {
      const contrato = await contratoRepository.save(
        TestUtils.generarDatosContrato(),
      );

      const response = await request(app.getHttpServer())
        .get(`/contratos/${contrato.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: contrato.id,
        numeroContrato: contrato.numeroContrato,
      });
    });

    it('debería rechazar acceso a contrato no asignado como SUPERVISOR', async () => {
      const contrato = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          usuarioCedula: '987654321', // Diferente a la cédula del supervisor
        }),
      );

      await request(app.getHttpServer())
        .get(`/contratos/${contrato.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });

    it('debería retornar 404 para contrato no existente', async () => {
      await request(app.getHttpServer())
        .get('/contratos/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /contratos/numero/:numeroContrato', () => {
    it('debería obtener un contrato por número como ADMIN', async () => {
      const contrato = await contratoRepository.save(
        TestUtils.generarDatosContrato(),
      );

      const response = await request(app.getHttpServer())
        .get(`/contratos/numero/${contrato.numeroContrato}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        numeroContrato: contrato.numeroContrato,
      });
    });

    it('debería rechazar acceso a contrato no asignado por número como SUPERVISOR', async () => {
      const contrato = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          usuarioCedula: '987654321', // Diferente a la cédula del supervisor
        }),
      );

      await request(app.getHttpServer())
        .get(`/contratos/numero/${contrato.numeroContrato}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });
  });
}); 