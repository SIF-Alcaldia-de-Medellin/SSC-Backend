import { JwtService } from '@nestjs/jwt';
import { RolUsuario } from '../usuarios/usuario.entity';

export class TestUtils {
  /**
   * Genera un token JWT para testing
   */
  static generarToken(jwtService: JwtService, rol: RolUsuario = RolUsuario.ADMIN): string {
    const payload = {
      cedula: '123456789',
      rol: rol,
      sub: 1
    };
    return jwtService.sign(payload);
  }

  /**
   * Genera datos de prueba para un contrato
   */
  static generarDatosContrato(override: any = {}) {
    return {
      numeroContrato: '460000123',
      identificadorSimple: '123-2024',
      objeto: 'Contrato de prueba para testing',
      valorTotal: 328000000,
      fechaInicio: new Date('2024-03-15'),
      fechaTerminacion: new Date('2024-09-15'),
      usuarioCedula: '123456789',
      estado: 'ACTIVO',
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
} 