import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { RolUsuario } from '../src/usuarios/usuario.entity';
import { Repository } from 'typeorm';
import { Usuario } from '../src/usuarios/usuario.entity';
import * as bcrypt from 'bcrypt';

export class E2EUtils {
  constructor(
    private readonly app: INestApplication,
    private readonly jwtService: JwtService,
    private readonly usuarioRepository: Repository<Usuario>
  ) {}

  async loginUser(cedula: string, password: string) {
    const email = `${cedula}@test.com`;
    
    console.log('Intentando login con datos:', { email, password });
    
    const response = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    console.log('Respuesta del login:', { status: response.status, body: response.body });

    if (response.status !== 201 && response.status !== 200) {
      console.log('Login falló:', response.body);
      throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.body)}`);
    }

    console.log('Login exitoso, token obtenido');
    return response.body.access_token;
  }

  async createTestUser(
    cedula: string,
    password: string,
    rol: RolUsuario,
    nombre = 'Test',
    apellido = 'User'
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const email = `${cedula}@test.com`;
    const usuario = await this.usuarioRepository.save({
      cedula,
      password: hashedPassword,
      rol,
      nombre,
      apellido,
      email
    });

    console.log('Usuario creado:', {
      ...usuario,
      password: '[HIDDEN]',
      originalPassword: password
    });

    return usuario;
  }

  async createContrato(token: string, data: any) {
    const response = await request(this.app.getHttpServer())
      .post('/contratos')
      .set('Authorization', `Bearer ${token}`)
      .send(data);

    if (response.status !== 201) {
      console.log('Error al crear contrato:', response.body);
      throw new Error(`Failed to create contract: ${JSON.stringify(response.body)}`);
    }

    return response.body;
  }

  async createCUO(token: string, data: any) {
    const response = await request(this.app.getHttpServer())
      .post('/cuo')
      .set('Authorization', `Bearer ${token}`)
      .send(data);

    return response.body;
  }

  async createActividad(token: string, data: any) {
    const response = await request(this.app.getHttpServer())
      .post('/actividades')
      .set('Authorization', `Bearer ${token}`)
      .send(data);

    return response.body;
  }

  async createSeguimientoActividad(token: string, data: any) {
    const response = await request(this.app.getHttpServer())
      .post('/seguimiento-actividad')
      .set('Authorization', `Bearer ${token}`)
      .send(data);

    return response.body;
  }

  async createSeguimientoGeneral(token: string, data: any) {
    const response = await request(this.app.getHttpServer())
      .post('/seguimiento-general')
      .set('Authorization', `Bearer ${token}`)
      .send(data);

    return response.body;
  }

  async createAdicion(token: string, data: any) {
    const response = await request(this.app.getHttpServer())
      .post('/adiciones')
      .set('Authorization', `Bearer ${token}`)
      .send(data);

    return response.body;
  }

  async createModificacion(token: string, data: any) {
    const response = await request(this.app.getHttpServer())
      .post('/modificaciones')
      .set('Authorization', `Bearer ${token}`)
      .send(data);

    return response.body;
  }

  generateTestData() {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);

    // Generar número de contrato único de 10 dígitos
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const contractNumber = `${timestamp.toString().slice(-7)}${randomSuffix}`;

    return {
      contrato: {
        usuarioCedula: '', // Se asignará dinámicamente en el test
        numeroContrato: contractNumber, // Exactamente 10 dígitos únicos
        anoSuscripcion: new Date().getFullYear(),
        programa: 'Programa de Infraestructura',
        tipoContrato: 'Obra Pública',
        objeto: 'Contrato de prueba E2E para construcción de infraestructura',
        identificadorSimple: `TEST-${Date.now()}`,
        suplentes: 'Suplente de prueba',
        apoyo: 'Personal de apoyo de prueba',
        estado: 'activo',
        contratista: 'Contratista de Prueba S.A.S.',
        numeroProceso: `PROC-${Date.now()}`,
        fechaInicio: today.toISOString().split('T')[0],
        fechaTerminacionInicial: futureDate.toISOString().split('T')[0],
        fechaTerminacionActual: futureDate.toISOString().split('T')[0],
        valorInicial: 1000000000,
        valorTotal: 1000000000,
      },
      cuo: {
        numero: `${Date.now().toString().slice(-8)}`, // Solo dígitos para el número
        latitud: 6.2442,
        longitud: -75.5812,
        comuna: 'Comuna 1',
        barrio: 'Barrio de prueba',
        descripcion: 'Descripción del CUO de prueba para testing E2E'
      },
      actividad: {
        actividad: 'Actividad de construcción de prueba',
        metaFisica: 100, // Corregido el nombre del campo
        proyectadoFinanciero: 100000000,
        unidadesAvance: 'Metros lineales'
      },
      seguimientoActividad: {
        avanceFisico: 50,
        costoAproximado: 50000000,
        descripcionSeguimiento: 'Seguimiento de prueba de la actividad',
        proyeccionActividades: 'Proyección de actividades de prueba'
      },
      seguimientoGeneral: {
        avanceFinanciero: 500000000, // 500 millones de pesos (50% del valor del contrato)
        avanceFisico: 50,
        observaciones: 'Seguimiento general de prueba'
      },
      adicion: {
        valorAdicion: 500000000,
        fecha: today.toISOString().split('T')[0],
        observaciones: 'Adición de prueba'
      },
      modificacion: {
        tipo: 'SUSPENSION',
        fechaInicial: today.toISOString().split('T')[0],
        fechaFinal: futureDate.toISOString().split('T')[0],
        duracion: 30,
        observaciones: 'Modificación de prueba'
      }
    };
  }
} 