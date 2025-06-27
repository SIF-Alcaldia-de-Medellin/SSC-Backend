import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeguimientoActividad } from './seguimiento-actividad.entity';
import { Actividad } from '../actividades/actividad.entity';
import { CreateSeguimientoActividadDto } from './dto/create-seguimiento-actividad.dto';
import { SeguimientoActividadResponseDto } from './dto/seguimiento-actividad.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';
import { PermissionUtils } from '../auth/utils/permission.utils';

@Injectable()
export class SeguimientoActividadService {
  constructor(
    @InjectRepository(SeguimientoActividad)
    private seguimientoActividadRepository: Repository<SeguimientoActividad>,
    @InjectRepository(Actividad)
    private actividadRepository: Repository<Actividad>
  ) {}

  /**
   * Verifica si un usuario tiene acceso a una actividad
   */
  private async verificarAccesoActividad(
    actividadId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<void> {
    const actividad = await this.actividadRepository.findOne({
      where: { id: actividadId },
      relations: ['cuo', 'cuo.contrato']
    });

    if (!actividad) {
      throw new NotFoundException(`No se encontró la actividad con ID ${actividadId}`);
    }

    if (usuarioRol === RolUsuario.ADMIN) {
      return;
    }

    if (actividad.cuo.contrato.usuarioCedula !== usuarioCedula) {
      throw new ForbiddenException('No tiene acceso a esta actividad');
    }
  }

  /**
   * Transforma una entidad SeguimientoActividad en un DTO de respuesta
   */
  private toResponseDto(seguimiento: SeguimientoActividad): SeguimientoActividadResponseDto {
    if (!seguimiento) {
      throw new NotFoundException('No se puede convertir un seguimiento nulo a DTO');
    }

    const { actividad, ...seguimientoData } = seguimiento;

    // Calcular porcentajes solo si tenemos la información de la actividad
    const porcentajeAvance = actividad ? 
      (seguimiento.avanceFisico / actividad.metaFisica) * 100 : undefined;

    const porcentajeEjecucionFinanciera = actividad ? 
      (seguimiento.costoAproximado / actividad.proyectadoFinanciero) * 100 : undefined;

    return {
      ...seguimientoData,
      actividad: actividad ? {
        descripcion: actividad.actividad,
        metaFisica: actividad.metaFisica,
        unidadesAvance: actividad.unidadesAvance,
        proyectadoFinanciero: actividad.proyectadoFinanciero,
        cuoId: actividad.cuoId
      } : undefined,
      porcentajeAvance: porcentajeAvance ? Number(porcentajeAvance.toFixed(2)) : undefined,
      porcentajeEjecucionFinanciera: porcentajeEjecucionFinanciera ? 
        Number(porcentajeEjecucionFinanciera.toFixed(2)) : undefined
    };
  }

  /**
   * Crea un nuevo seguimiento de actividad
   */
  async create(
    createSeguimientoActividadDto: CreateSeguimientoActividadDto,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoActividadResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(usuarioRol);

    // Verificar acceso a la actividad
    await this.verificarAccesoActividad(
      createSeguimientoActividadDto.actividadId,
      usuarioCedula,
      usuarioRol
    );

    const seguimiento = this.seguimientoActividadRepository.create(createSeguimientoActividadDto);
    const savedSeguimiento = await this.seguimientoActividadRepository.save(seguimiento);
    
    // Cargar la relación con actividad para el DTO de respuesta
    const seguimientoConActividad = await this.seguimientoActividadRepository.findOne({
      where: { id: savedSeguimiento.id },
      relations: ['actividad']
    });

    if (!seguimientoConActividad) {
      throw new NotFoundException(`Error al cargar el seguimiento creado con ID ${savedSeguimiento.id}`);
    }

    return this.toResponseDto(seguimientoConActividad);
  }

  /**
   * Obtiene todos los seguimientos de una actividad específica
   * 
   * @param actividadId - ID de la actividad
   * @param usuarioCedula - Cédula del usuario que realiza la consulta
   * @param usuarioRol - Rol del usuario que realiza la consulta
   * @returns Lista de seguimientos ordenados por fecha descendente
   * @throws NotFoundException si no se encuentran seguimientos o si la actividad no existe
   * @throws ForbiddenException si el usuario no tiene acceso a la actividad
   */
  async findByActividad(
    actividadId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoActividadResponseDto[]> {
    // Verificar acceso a la actividad
    await this.verificarAccesoActividad(actividadId, usuarioCedula, usuarioRol);

    // Obtenemos los seguimientos con toda la información necesaria
    const seguimientos = await this.seguimientoActividadRepository.find({
      where: { actividadId },
      relations: ['actividad'],
      order: { 
        createdAt: 'DESC'
      }
    });

    if (!seguimientos.length) {
      throw new NotFoundException(`No se encontraron seguimientos para la actividad ${actividadId}`);
    }

    return seguimientos.map(seguimiento => this.toResponseDto(seguimiento));
  }

  /**
   * Obtiene un seguimiento específico por su ID
   * 
   * @param id - ID del seguimiento
   * @param usuarioCedula - Cédula del usuario que realiza la consulta
   * @param usuarioRol - Rol del usuario que realiza la consulta
   * @returns El seguimiento encontrado
   * @throws NotFoundException si el seguimiento no existe
   * @throws ForbiddenException si el usuario no tiene acceso al seguimiento
   */
  async findOne(
    id: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoActividadResponseDto> {
    const seguimiento = await this.seguimientoActividadRepository.findOne({
      where: { id },
      relations: ['actividad']
    });

    if (!seguimiento) {
      throw new NotFoundException(`No se encontró el seguimiento con ID ${id}`);
    }

    // Verificar acceso a la actividad relacionada
    await this.verificarAccesoActividad(seguimiento.actividadId, usuarioCedula, usuarioRol);

    return this.toResponseDto(seguimiento);
  }
} 