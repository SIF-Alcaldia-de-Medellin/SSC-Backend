import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrato } from './contrato.entity';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { ContratoResponseDto } from './dto/contrato.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';

/**
 * Servicio para la gestión de contratos
 */
@Injectable()
export class ContratosService {
  constructor(
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
  ) {}

  /**
   * Verifica si un usuario tiene acceso a un contrato
   */
  private verificarAccesoContrato(usuarioCedula: string, usuarioRol: RolUsuario, contrato: Contrato): boolean {
    return usuarioRol === RolUsuario.ADMIN || usuarioRol === RolUsuario.SUPERVISOR;
  }

  /**
   * Transforma una entidad Contrato en un DTO de respuesta
   */
  private toResponseDto(contrato: Contrato): ContratoResponseDto {
    const { supervisor, cuos, ...contratoData } = contrato;
    return {
      ...contratoData,
      supervisor: {
        cedula: supervisor?.cedula || '',
        nombre: supervisor?.nombre || '',
        email: supervisor?.email || ''
      }
    };
  }

  /**
   * Crea un nuevo contrato
   * 
   * @param createContratoDto - Datos del contrato a crear
   * @param usuarioRol - Rol del usuario que crea el contrato
   * @returns El contrato creado
   * @throws ForbiddenException si el usuario no tiene permiso para crear un contrato
   * @throws ConflictException si el número de contrato ya existe
   */
  async create(createContratoDto: CreateContratoDto, usuarioRol: RolUsuario): Promise<ContratoResponseDto> {
    if (usuarioRol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden crear contratos');
    }

    const existingContrato = await this.contratoRepository.findOne({
      where: { numeroContrato: createContratoDto.numeroContrato }
    });

    if (existingContrato) {
      throw new ConflictException('El número de contrato ya existe');
    }

    const contrato = this.contratoRepository.create(createContratoDto);
    const savedContrato = await this.contratoRepository.save(contrato);
    return this.toResponseDto(savedContrato);
  }

  /**
   * Obtiene todos los contratos según el rol del usuario
   * 
   * @param usuarioCedula - Cédula del usuario
   * @param usuarioRol - Rol del usuario
   * @returns Lista de contratos
   */
  async findAll(usuarioCedula: string, usuarioRol: RolUsuario): Promise<ContratoResponseDto[]> {
    const contratos = await this.contratoRepository.find();
    return contratos.map(contrato => this.toResponseDto(contrato));
  }

  /**
   * Obtiene un contrato por su ID
   * 
   * @param id - ID del contrato
   * @param usuarioCedula - Cédula del usuario
   * @param usuarioRol - Rol del usuario
   * @returns El contrato encontrado
   * @throws NotFoundException si el contrato no existe
   * @throws ForbiddenException si el usuario no tiene acceso al contrato
   */
  async findOne(id: number, usuarioCedula: string, usuarioRol: RolUsuario): Promise<ContratoResponseDto> {
    const contrato = await this.contratoRepository.findOne({
      where: { id }
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (!this.verificarAccesoContrato(usuarioCedula, usuarioRol, contrato)) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }

    return this.toResponseDto(contrato);
  }

  /**
   * Obtiene un contrato por su ID sin convertirlo a DTO
   */
  private async findOneEntity(id: number, usuarioCedula: string, usuarioRol: RolUsuario): Promise<Contrato> {
    const contrato = await this.contratoRepository.findOne({
      where: { id }
    });

    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (!this.verificarAccesoContrato(usuarioCedula, usuarioRol, contrato)) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }

    return contrato;
  }

  /**
   * Actualiza un contrato
   * 
   * @param id - ID del contrato a actualizar
   * @param updateContratoDto - Datos actualizados del contrato
   * @param usuarioCedula - Cédula del usuario
   * @param usuarioRol - Rol del usuario
   * @returns El contrato actualizado
   * @throws NotFoundException si el contrato no existe
   * @throws ForbiddenException si el usuario no tiene acceso al contrato
   */
  async update(
    id: number, 
    updateContratoDto: Partial<CreateContratoDto>,
    usuarioCedula: string,
    usuarioRol: RolUsuario
  ): Promise<ContratoResponseDto> {
    const contrato = await this.findOneEntity(id, usuarioCedula, usuarioRol);

    // Si se está actualizando el número de contrato, verificar que no exista
    if (updateContratoDto.numeroContrato && 
        updateContratoDto.numeroContrato !== contrato.numeroContrato) {
      const existingContrato = await this.contratoRepository.findOne({
        where: { numeroContrato: updateContratoDto.numeroContrato }
      });

      if (existingContrato) {
        throw new ConflictException('El número de contrato ya existe');
      }
    }

    Object.assign(contrato, updateContratoDto);
    const updatedContrato = await this.contratoRepository.save(contrato);
    return this.toResponseDto(updatedContrato);
  }

  /**
   * Elimina un contrato
   * 
   * @param id - ID del contrato a eliminar
   * @param usuarioCedula - Cédula del usuario
   * @param usuarioRol - Rol del usuario
   * @throws ForbiddenException si el usuario no tiene permiso para eliminar el contrato
   */
  async remove(id: number, usuarioCedula: string, usuarioRol: RolUsuario): Promise<void> {
    if (usuarioRol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar contratos');
    }

    const contrato = await this.findOneEntity(id, usuarioCedula, usuarioRol);
    await this.contratoRepository.remove(contrato);
  }

  /**
   * Busca contratos por supervisor
   * 
   * @param usuarioCedula - Cédula del supervisor
   * @param usuarioRol - Rol del usuario
   * @returns Lista de contratos asignados al supervisor
   */
  async findByUsuario(usuarioCedula: string, usuarioRol: RolUsuario): Promise<ContratoResponseDto[]> {
    if (usuarioRol === RolUsuario.ADMIN) {
      const contratos = await this.contratoRepository.find();
      return contratos.map(contrato => this.toResponseDto(contrato));
    }

    const contratos = await this.contratoRepository.find({
      where: { usuarioCedula }
    });
    return contratos.map(contrato => this.toResponseDto(contrato));
  }
} 