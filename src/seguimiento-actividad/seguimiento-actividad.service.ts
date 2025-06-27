import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { SeguimientoActividad } from './seguimiento-actividad.entity';
import { Actividad } from '../actividades/actividad.entity';
import { Contrato } from '../contratos/contrato.entity';
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
    private actividadRepository: Repository<Actividad>,
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>
  ) {}

  /**
   * Verifica si un usuario tiene acceso a una actividad y su contrato relacionado.
   * @throws NotFoundException si la actividad no existe
   * @throws ForbiddenException si el usuario no tiene acceso al contrato relacionado
   */
  private async verificarAccesoActividad(
    actividadId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<Actividad> {
    const actividad = await this.actividadRepository.findOne({
      where: { id: actividadId },
      relations: ['cuo', 'cuo.contrato']
    });

    if (!actividad) {
      throw new NotFoundException(`No se encontró la actividad con ID ${actividadId}`);
    }

    if (!actividad.cuo || !actividad.cuo.contrato) {
      throw new NotFoundException(`La actividad ${actividadId} no tiene un contrato relacionado válido`);
    }

    // Verificar acceso al contrato relacionado
    await PermissionUtils.verificarAccesoContratoById(
      actividad.cuo.contrato.id,
      usuarioCedula,
      usuarioRol,
      this.contratoRepository
    );

    return actividad;
  }

  /**
   * Calcula el avance físico acumulado hasta un seguimiento específico
   * @param actividadId ID de la actividad
   * @param fechaLimite Fecha límite para el cálculo (opcional)
   * @param seguimientoActual Seguimiento actual para incluir en el cálculo (opcional)
   */
  private async calcularAvanceAcumulado(
    actividadId: number, 
    fechaLimite?: Date,
    seguimientoActual?: SeguimientoActividad
  ): Promise<number> {
    const seguimientosAnteriores = await this.seguimientoActividadRepository.find({
      where: {
        actividadId,
        ...(fechaLimite && { createdAt: LessThanOrEqual(fechaLimite) })
      },
      order: {
        createdAt: 'ASC'
      }
    });

    // Asegurarse de que el resultado sea un número
    const avanceTotal = seguimientosAnteriores.reduce((sum, seg) => {
      const avance = typeof seg.avanceFisico === 'string' ? 
        parseFloat(seg.avanceFisico) : 
        Number(seg.avanceFisico);
      return sum + (isNaN(avance) ? 0 : avance);
    }, 0);

    // Si hay un seguimiento actual, incluirlo en el cálculo
    if (seguimientoActual) {
      const avanceActual = typeof seguimientoActual.avanceFisico === 'string' ?
        parseFloat(seguimientoActual.avanceFisico) :
        Number(seguimientoActual.avanceFisico);
      return avanceTotal + (isNaN(avanceActual) ? 0 : avanceActual);
    }

    return avanceTotal;
  }

  /**
   * Calcula el costo aproximado acumulado hasta un seguimiento específico
   * @param actividadId ID de la actividad
   * @param fechaLimite Fecha límite para el cálculo (opcional)
   * @param seguimientoActual Seguimiento actual para incluir en el cálculo (opcional)
   */
  private async calcularCostoAcumulado(
    actividadId: number, 
    fechaLimite?: Date,
    seguimientoActual?: SeguimientoActividad
  ): Promise<number> {
    const seguimientosAnteriores = await this.seguimientoActividadRepository.find({
      where: {
        actividadId,
        ...(fechaLimite && { createdAt: LessThanOrEqual(fechaLimite) })
      },
      order: {
        createdAt: 'ASC'
      }
    });

    // Asegurarse de que el resultado sea un número
    const costoTotal = seguimientosAnteriores.reduce((sum, seg) => {
      const costo = typeof seg.costoAproximado === 'string' ? 
        parseFloat(seg.costoAproximado) : 
        Number(seg.costoAproximado);
      return sum + (isNaN(costo) ? 0 : costo);
    }, 0);

    // Si hay un seguimiento actual, incluirlo en el cálculo
    if (seguimientoActual) {
      const costoActual = typeof seguimientoActual.costoAproximado === 'string' ?
        parseFloat(seguimientoActual.costoAproximado) :
        Number(seguimientoActual.costoAproximado);
      return costoTotal + (isNaN(costoActual) ? 0 : costoActual);
    }

    return costoTotal;
  }

  /**
   * Transforma una entidad SeguimientoActividad en un DTO de respuesta
   * @throws NotFoundException si el seguimiento es nulo
   */
  private async toResponseDto(seguimiento: SeguimientoActividad): Promise<SeguimientoActividadResponseDto> {
    if (!seguimiento) {
      throw new NotFoundException('No se puede convertir un seguimiento nulo a DTO');
    }

    const { actividad, ...seguimientoData } = seguimiento;

    // Calcular avances acumulados incluyendo el seguimiento actual
    const avanceAcumulado = await this.calcularAvanceAcumulado(
      seguimiento.actividadId, 
      seguimiento.createdAt,
      seguimiento
    );
    
    const costoAcumulado = await this.calcularCostoAcumulado(
      seguimiento.actividadId, 
      seguimiento.createdAt,
      seguimiento
    );

    // Asegurarse de que los valores sean números
    const avanceFisico = typeof seguimiento.avanceFisico === 'string' ? 
      parseFloat(seguimiento.avanceFisico) : 
      Number(seguimiento.avanceFisico);

    const costoAproximado = typeof seguimiento.costoAproximado === 'string' ? 
      parseFloat(seguimiento.costoAproximado) : 
      Number(seguimiento.costoAproximado);

    // Calcular porcentajes acumulados
    const metaFisica = actividad ? Number(actividad.metaFisica) : 0;
    const proyectadoFinanciero = actividad ? Number(actividad.proyectadoFinanciero) : 0;

    const porcentajeAvance = metaFisica > 0 ? 
      (avanceAcumulado / metaFisica) * 100 : 0;

    const porcentajeEjecucionFinanciera = proyectadoFinanciero > 0 ? 
      (costoAcumulado / proyectadoFinanciero) * 100 : 0;

    return {
      ...seguimientoData,
      avanceFisico: Number(avanceFisico.toFixed(2)),
      costoAproximado: Number(costoAproximado.toFixed(2)),
      actividad: actividad ? {
        descripcion: actividad.actividad,
        metaFisica: metaFisica,
        unidadesAvance: actividad.unidadesAvance,
        proyectadoFinanciero: proyectadoFinanciero,
        cuoId: actividad.cuoId
      } : undefined,
      avanceAcumulado: Number(avanceAcumulado.toFixed(2)),
      costoAcumulado: Number(costoAcumulado.toFixed(2)),
      porcentajeAvance: Number(porcentajeAvance.toFixed(2)),
      porcentajeEjecucionFinanciera: Number(porcentajeEjecucionFinanciera.toFixed(2))
    };
  }

  /**
   * Crea un nuevo seguimiento de actividad.
   * @throws ForbiddenException si el usuario no tiene permisos de creación
   * @throws NotFoundException si la actividad no existe
   * @throws ForbiddenException si el usuario no tiene acceso al contrato relacionado
   */
  async create(
    createSeguimientoActividadDto: CreateSeguimientoActividadDto,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoActividadResponseDto> {
    // Verificar permiso de creación
    PermissionUtils.verificarPermisoCreacion(usuarioRol);

    // Verificar acceso a la actividad y obtener sus datos
    const actividad = await this.verificarAccesoActividad(
      createSeguimientoActividadDto.actividadId,
      usuarioCedula,
      usuarioRol
    );

    // Asegurarse de que los valores sean números
    const nuevoAvance = typeof createSeguimientoActividadDto.avanceFisico === 'string' ? 
      parseFloat(createSeguimientoActividadDto.avanceFisico) : 
      Number(createSeguimientoActividadDto.avanceFisico);

    const metaFisica = Number(actividad.metaFisica);

    // Calcular el avance acumulado actual (sin incluir el nuevo seguimiento)
    const avanceAcumuladoActual = await this.calcularAvanceAcumulado(
      createSeguimientoActividadDto.actividadId
    );

    // Validar que el avance físico acumulado no exceda la meta física
    const nuevoAvanceAcumulado = avanceAcumuladoActual + nuevoAvance;
    if (nuevoAvanceAcumulado > metaFisica) {
      throw new ForbiddenException(
        `El avance físico acumulado (${nuevoAvanceAcumulado.toFixed(2)}) no puede superar la meta física (${metaFisica.toFixed(2)})`
      );
    }

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
   * Obtiene todos los seguimientos de una actividad específica.
   * @throws ForbiddenException si el usuario no tiene permisos de visualización
   * @throws NotFoundException si la actividad no existe o no tiene seguimientos
   * @throws ForbiddenException si el usuario no tiene acceso al contrato relacionado
   */
  async findByActividad(
    actividadId: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoActividadResponseDto[]> {
    // Verificar permiso de visualización
    PermissionUtils.verificarPermisoVisualizacion(usuarioRol);

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

    // Transformar cada seguimiento a DTO con valores acumulados
    return Promise.all(seguimientos.map(seguimiento => this.toResponseDto(seguimiento)));
  }

  /**
   * Obtiene un seguimiento específico por su ID.
   * @throws ForbiddenException si el usuario no tiene permisos de visualización
   * @throws NotFoundException si el seguimiento no existe
   * @throws ForbiddenException si el usuario no tiene acceso al contrato relacionado
   */
  async findOne(
    id: number,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<SeguimientoActividadResponseDto> {
    // Verificar permiso de visualización
    PermissionUtils.verificarPermisoVisualizacion(usuarioRol);

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