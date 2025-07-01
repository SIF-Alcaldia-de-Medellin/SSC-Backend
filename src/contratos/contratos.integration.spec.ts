import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { ContratosModule } from './contratos.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario } from '../usuarios/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { Contrato } from './contrato.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ensureSchema } from '../test/test-config';
import * as bcrypt from 'bcrypt';

describe('Contratos - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let contratoRepository: Repository<Contrato>;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let adminToken: string;
  let supervisorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, ContratosModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    contratoRepository = moduleFixture.get<Repository<Contrato>>(
      getRepositoryToken(Contrato),
    );
    usuarioRepository = moduleFixture.get<Repository<Usuario>>(
      getRepositoryToken(Usuario),
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Inicializar la base de datos
    await ensureSchema(dataSource);

    // Generar tokens para las pruebas
    adminToken = TestUtils.generarToken(jwtService, RolUsuario.ADMIN, '123456789');
    supervisorToken = TestUtils.generarToken(jwtService, RolUsuario.SUPERVISOR, '987654321');
  }, 60000); // Timeout de 60 segundos

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada prueba
    await TestUtils.limpiarBaseDatos(dataSource);

    // Crear usuarios necesarios para los tests
    const hashedPassword = await bcrypt.hash('Test123', 10);
    await usuarioRepository.save([
      {
        cedula: '123456789',
        nombre: 'Admin Test',
        email: 'admin@test.com', 
        password: hashedPassword,
        rol: RolUsuario.ADMIN
      },
      {
        cedula: '987654321',
        nombre: 'Supervisor Test',
        email: 'supervisor@test.com',
        password: hashedPassword,
        rol: RolUsuario.SUPERVISOR
      }
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /contratos', () => {
    it('debería crear un contrato como ADMIN', async () => {
      const datosContrato = TestUtils.generarDatosContrato();

      console.log('🔍 Datos del contrato a enviar:', JSON.stringify(datosContrato, null, 2));

      const response = await request(app.getHttpServer())
        .post('/contratos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosContrato);

      if (response.status !== 201) {
        console.log('❌ Error en respuesta:', response.status, response.body);
      }

      expect(response.status).toBe(201);

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
        .expect(409); // Conflict para contrato duplicado
    });
  });

  describe('GET /contratos', () => {
    it('debería obtener todos los contratos como ADMIN', async () => {
      // Crear contratos de prueba
      const contrato1 = await contratoRepository.save(
        TestUtils.generarDatosContrato({ numeroContrato: '1111111111' }),
      );
      const contrato2 = await contratoRepository.save(
        TestUtils.generarDatosContrato({ numeroContrato: '2222222222' }),
      );

      const response = await request(app.getHttpServer())
        .get('/contratos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      
      // Verificar que ambos contratos están en la respuesta sin asumir orden
      const numerosContratos = response.body.map(c => c.numeroContrato);
      expect(numerosContratos).toContain(contrato1.numeroContrato);
      expect(numerosContratos).toContain(contrato2.numeroContrato);
    });

    it('debería obtener solo los contratos asignados como SUPERVISOR', async () => {
      // Crear contratos de prueba - uno asignado al supervisor y otro no
      await contratoRepository.save(
        TestUtils.generarDatosContrato({ 
          numeroContrato: '1111111111',
          usuarioCedula: '987654321' // Asignado al supervisor
        }),
      );
      await contratoRepository.save(
        TestUtils.generarDatosContrato({ 
          numeroContrato: '2222222222',
          usuarioCedula: '123456789' // Asignado al admin (no al supervisor)
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/contratos')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      // El supervisor debe ver solo 1 contrato (el suyo)
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        numeroContrato: '1111111111',
        usuarioCedula: '987654321'
      });
    });
  });

  describe('GET /contratos/:id', () => {
    it('debería obtener un contrato específico como ADMIN', async () => {
      const contrato = await contratoRepository.save(
        TestUtils.generarDatosContrato({ numeroContrato: '3333333333' }),
      );

      const response = await request(app.getHttpServer())
        .get(`/contratos/${contrato.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: contrato.id,
        numeroContrato: '3333333333',
      });
    });

    it('debería rechazar el acceso a contrato no asignado como SUPERVISOR', async () => {
      const contrato = await contratoRepository.save(
        TestUtils.generarDatosContrato({ 
          numeroContrato: '4444444444',
          usuarioCedula: '123456789' // Asignado al admin, no al supervisor
        }),
      );

      await request(app.getHttpServer())
        .get(`/contratos/${contrato.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
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
          usuarioCedula: '123456789', // Asignado al admin, no al supervisor (987654321)
        }),
      );

      await request(app.getHttpServer())
        .get(`/contratos/numero/${contrato.numeroContrato}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });
  });
}); 