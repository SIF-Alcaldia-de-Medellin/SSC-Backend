import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { TestModule } from '../test/test.module';
import { AdicionesModule } from './adiciones.module';
import { TestUtils } from '../test/test.utils';
import { RolUsuario, Usuario } from '../usuarios/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import { Adicion } from './adicion.entity';
import { Contrato } from '../contratos/contrato.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Adiciones - Pruebas de Integración', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adicionRepository: Repository<Adicion>;
  let contratoRepository: Repository<Contrato>;
  let usuarioRepository: Repository<Usuario>;
  let dataSource: DataSource;
  let adminToken: string;
  let supervisorToken: string;
  let contratoId: number;
  let valorInicialContrato: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, AdicionesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    adicionRepository = moduleFixture.get<Repository<Adicion>>(
      getRepositoryToken(Adicion),
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
    valorInicialContrato = contrato.valorTotal;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /adiciones', () => {
    it('debería crear una adición como ADMIN', async () => {
      const datosAdicion = {
        contratoId,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20').toISOString(),
        observaciones: 'Adición para mayores cantidades'
      };

      const response = await request(app.getHttpServer())
        .post('/adiciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosAdicion)
        .expect(201);

      expect(response.body).toMatchObject({
        valorAdicion: datosAdicion.valorAdicion.toString(),
        observaciones: datosAdicion.observaciones,
      });

      // Verificar que el valor total del contrato se actualizó
      const contratoActualizado = await contratoRepository.findOne({
        where: { id: contratoId }
      });
      expect(contratoActualizado).not.toBeNull();
      expect(contratoActualizado!.valorTotal.toString()).toBe((valorInicialContrato + datosAdicion.valorAdicion).toString());
    });

    it('debería crear una adición como SUPERVISOR del contrato', async () => {
      // Crear contrato asignado al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Cédula del supervisor de prueba
        }),
      );

      const datosAdicion = {
        contratoId: contratoSupervisor.id,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20').toISOString(),
        observaciones: 'Adición supervisor'
      };

      const response = await request(app.getHttpServer())
        .post('/adiciones')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(datosAdicion)
        .expect(201);

      expect(response.body.valorAdicion).toBe(datosAdicion.valorAdicion.toString());
    });

    it('debería permitir adición con valor negativo', async () => {
      const datosAdicion = {
        contratoId,
        valorAdicion: -50000000,
        fecha: new Date('2024-03-20').toISOString(),
        observaciones: 'Adición negativa'
      };

      await request(app.getHttpServer())
        .post('/adiciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosAdicion)
        .expect(201); // El módulo permite valores negativos
    });

    it('debería mantener consistencia en caso de error', async () => {
      // Crear una adición con un contratoId inválido para forzar un error
      const datosAdicion = {
        contratoId: 99999,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20').toISOString(),
        observaciones: 'Adición con error'
      };

      await request(app.getHttpServer())
        .post('/adiciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosAdicion)
        .expect(500); // El módulo devuelve error de servidor para FK inválida

      // Verificar que no se creó la adición
      const adiciones = await adicionRepository.find();
      expect(adiciones).toHaveLength(0);
    });
  });

  describe('GET /adiciones/contrato/:id', () => {
    it('debería obtener todas las adiciones de un contrato como ADMIN', async () => {
      // Crear adiciones de prueba
      const adicion1 = await adicionRepository.save({
        contratoId,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20'),
        observaciones: 'Primera adición'
      });

      const adicion2 = await adicionRepository.save({
        contratoId,
        valorAdicion: 30000000,
        fecha: new Date('2024-03-25'),
        observaciones: 'Segunda adición'
      });

      const response = await request(app.getHttpServer())
        .get(`/adiciones/contrato/${contratoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].valorAdicion).toBe(adicion2.valorAdicion.toString());
      expect(response.body[1].valorAdicion).toBe(adicion1.valorAdicion.toString());
    });

    it('debería obtener solo adiciones de contratos asignados como SUPERVISOR', async () => {
      // Crear contrato asignado al supervisor
      const contratoSupervisor = await contratoRepository.save(
        TestUtils.generarDatosContrato({
          numeroContrato: '460000124',
          usuarioCedula: '987654321', // Cédula del supervisor de prueba
        }),
      );

      // Crear adiciones en ambos contratos
      await adicionRepository.save({
        contratoId: contratoSupervisor.id,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20'),
        observaciones: 'Adición supervisor'
      });

      await adicionRepository.save({
        contratoId,
        valorAdicion: 30000000,
        fecha: new Date('2024-03-25'),
        observaciones: 'Adición otro contrato'
      });

      // Intentar acceder a adiciones del contrato no asignado
      await request(app.getHttpServer())
        .get(`/adiciones/contrato/${contratoId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      // Acceder a adiciones del contrato asignado
      const response = await request(app.getHttpServer())
        .get(`/adiciones/contrato/${contratoSupervisor.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].valorAdicion).toBe("50000000");
    });
  });

  describe('PATCH /adiciones/:id', () => {
    it('debería actualizar una adición y el valor del contrato como ADMIN', async () => {
      const adicion = await adicionRepository.save({
        contratoId,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20'),
        observaciones: 'Adición original'
      });

      // Actualizar el valor total del contrato manualmente
      await contratoRepository.update(contratoId, {
        valorTotal: valorInicialContrato + 50000000
      });

      const datosActualizacion = {
        valorAdicion: 60000000,
        observaciones: 'Adición actualizada'
      };

      const response = await request(app.getHttpServer())
        .patch(`/adiciones/${adicion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(datosActualizacion)
        .expect(200);

      expect(response.body).toMatchObject({
        id: adicion.id,
        valorAdicion: datosActualizacion.valorAdicion.toString(),
        observaciones: datosActualizacion.observaciones,
      });

      // Verificar que el valor total del contrato se actualizó correctamente
      const contratoActualizado = await contratoRepository.findOne({
        where: { id: contratoId }
      });
      expect(contratoActualizado).not.toBeNull();
      expect(contratoActualizado!.valorTotal.toString()).toBe((valorInicialContrato + datosActualizacion.valorAdicion).toString());
    });

    it('debería rechazar actualización de adición como SUPERVISOR', async () => {
      const adicion = await adicionRepository.save({
        contratoId,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20'),
        observaciones: 'Adición test'
      });

      await request(app.getHttpServer())
        .patch(`/adiciones/${adicion.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ valorAdicion: 60000000 })
        .expect(403);
    });
  });

  describe('DELETE /adiciones/:id', () => {
    it('debería eliminar una adición y actualizar el valor del contrato como ADMIN', async () => {
      const adicion = await adicionRepository.save({
        contratoId,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20'),
        observaciones: 'Adición a eliminar'
      });

      // Actualizar el valor total del contrato manualmente
      await contratoRepository.update(contratoId, {
        valorTotal: valorInicialContrato + 50000000
      });

      await request(app.getHttpServer())
        .delete(`/adiciones/${adicion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verificar que la adición fue eliminada
      const adicionEliminada = await adicionRepository.findOne({
        where: { id: adicion.id }
      });
      expect(adicionEliminada).toBeNull();

      // Verificar que el valor total del contrato se restauró
      const contratoActualizado = await contratoRepository.findOne({
        where: { id: contratoId }
      });
      expect(contratoActualizado).not.toBeNull();
      expect(contratoActualizado!.valorTotal.toString()).toBe(valorInicialContrato.toString());
    });

    it('debería rechazar eliminación de adición como SUPERVISOR', async () => {
      const adicion = await adicionRepository.save({
        contratoId,
        valorAdicion: 50000000,
        fecha: new Date('2024-03-20'),
        observaciones: 'Adición test'
      });

      await request(app.getHttpServer())
        .delete(`/adiciones/${adicion.id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });

    it('debería mantener consistencia al fallar la eliminación', async () => {
      // Intentar eliminar una adición que no existe
      await request(app.getHttpServer())
        .delete('/adiciones/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Verificar que el valor del contrato no cambió
      const contratoActualizado = await contratoRepository.findOne({
        where: { id: contratoId }
      });
      expect(contratoActualizado).not.toBeNull();
      expect(contratoActualizado!.valorTotal.toString()).toBe(valorInicialContrato.toString());
    });
  });
}); 