import { JwtService } from '@nestjs/jwt';
import { RolUsuario } from '../usuarios/usuario.entity';
import { EstadoContrato } from '../contratos/contrato.entity';
import { DataSource } from 'typeorm';

export class TestUtils {
  /**
   * Genera un token JWT para testing
   * @param jwtService Servicio JWT
   * @param rol Rol del usuario
   * @param cedula Cédula del usuario (opcional)
   */
  static generarToken(
    jwtService: JwtService, 
    rol: RolUsuario = RolUsuario.ADMIN,
    cedula: string = '123456789'
  ): string {
    const payload = {
      sub: cedula,
      email: `${cedula}@test.com`,
      rol
    };
    return jwtService.sign(payload);
  }

  /**
   * Genera datos de prueba para un contrato
   */
  static generarDatosContrato(override: any = {}) {
    return {
      usuarioCedula: '123456789',
      numeroContrato: '1234567890',
      anoSuscripcion: 2024,
      programa: 'Programa de Infraestructura Vial',
      tipoContrato: 'Obra Pública',
      objeto: 'Contrato de prueba para testing - construcción de vía urbana',
      identificadorSimple: '123-2024',
      contratista: 'Constructora Test S.A.S.',
      numeroProceso: 'LP-001-2024',
      fechaInicio: new Date('2024-03-15'),
      fechaTerminacionInicial: new Date('2024-09-15'),
      fechaTerminacionActual: new Date('2024-09-15'),
      valorInicial: 1000000000,
      valorTotal: 1000000000,
      estado: EstadoContrato.ACTIVO,
      ...override
    };
  }

  /**
   * Genera datos de prueba para un seguimiento general
   */
  static generarDatosSeguimientoGeneral(contratoId: number, override: any = {}) {
    return {
      contratoId,
      avanceFinanciero: 150000000,
      avanceFisico: 45.5,
      observaciones: 'Seguimiento de prueba para testing',
      ...override
    };
  }

  /**
   * Genera datos de prueba para una actividad
   */
  static generarDatosActividad(cuoId: number, override: any = {}) {
    return {
      cuoId,
      actividad: 'Actividad de prueba para testing',
      metaFisica: 100,
      unidadesAvance: 'ML',
      proyectadoFinanciero: 50000000,
      ...override
    };
  }

  /**
   * Genera datos de prueba para un seguimiento de actividad
   */
  static generarDatosSeguimientoActividad(actividadId: number, override: any = {}) {
    return {
      actividadId,
      avanceFisico: 25.5,
      costoAproximado: 15000000,
      descripcionSeguimiento: 'Seguimiento de actividad de prueba',
      proyeccionActividades: 'Proyección de prueba',
      ...override
    };
  }

  /**
   * Genera datos de prueba para una adición
   */
  static generarDatosAdicion(contratoId: number, override: any = {}) {
    return {
      contratoId,
      valorAdicion: 50000000,
      fecha: new Date('2024-03-20'),
      observaciones: 'Adición de prueba para testing',
      ...override
    };
  }

  /**
   * Limpia datos de fechas para comparaciones en tests
   */
  static limpiarFechas(objeto: any): any {
    const limpio = { ...objeto };
    for (const key in limpio) {
      if (limpio[key] instanceof Date) {
        limpio[key] = limpio[key].toISOString();
      } else if (typeof limpio[key] === 'object' && limpio[key] !== null) {
        limpio[key] = this.limpiarFechas(limpio[key]);
      }
    }
    return limpio;
  }

  /**
   * Limpia todas las tablas de la base de datos de test de forma segura
   * maneja las foreign key constraints correctamente
   */
  static async limpiarBaseDatos(dataSource: DataSource): Promise<void> {
    try {
      const schemaName = process.env.TEST_DB_SCHEMA || 'SSC';
      
      // Establecer el schema por defecto
      await dataSource.query(`SET search_path TO "${schemaName}"`);
      
      // Lista de tablas en orden correcto (hijos primero, padres después)
      const tables = [
        'TBL_SEGUIMIENTOACTIVIDAD',
        'TBL_SEGUIMIENTOGENERAL', 
        'TBL_ACTIVIDADES',
        'TBL_ADICIONES',
        'TBL_MODIFICACIONES',
        'TBL_CUO',
        'TBL_CONTRATOS',
        'TBL_USUARIOS'
      ];
      
      // Deshabilitar checks de foreign key temporalmente
      await dataSource.query('SET session_replication_role = replica;');
      
      // Limpiar todas las tablas
      for (const table of tables) {
        await dataSource.query(`TRUNCATE TABLE "${schemaName}"."${table}" RESTART IDENTITY CASCADE;`);
      }
      
      // Rehabilitar checks de foreign key
      await dataSource.query('SET session_replication_role = DEFAULT;');
      
    } catch (error) {
      console.error('Error limpiando base de datos:', error);
      throw error;
    }
  }
} 