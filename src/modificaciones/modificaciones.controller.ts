import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';
import { ModificacionesService } from './modificaciones.service';
import { CreateModificacionDto } from './dto/create-modificacion.dto';
import { ModificacionResponseDto } from './dto/modificacion.response.dto';

/**
 * Controlador para la gestión de modificaciones contractuales
 */
@ApiTags('Modificaciones')
@ApiBearerAuth('access-token')
@Controller('modificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModificacionesController {
  constructor(private readonly modificacionesService: ModificacionesService) {}

  /**
   * Crea una nueva modificación contractual
   * 
   * @param createModificacionDto - Datos de la modificación a crear
   * @returns La modificación creada
   */
  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva modificación contractual' })
  @ApiResponse({ 
    status: 201, 
    description: 'Modificación creada exitosamente',
    type: ModificacionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  async create(
    @Body() createModificacionDto: CreateModificacionDto,
    @Request() req
  ): Promise<ModificacionResponseDto> {
    return await this.modificacionesService.create(createModificacionDto, req.user);
  }

  /**
   * Obtiene todas las modificaciones
   * 
   * @returns Lista de modificaciones
   */
  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener todas las modificaciones' })
  @ApiResponse({ 
    status: 200,
    description: 'Lista de modificaciones',
    type: [ModificacionResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  findAll(@Request() req): Promise<ModificacionResponseDto[]> {
    return this.modificacionesService.findAll(req.user);
  }

  /**
   * Obtiene una modificación por su ID
   * 
   * @param id - ID de la modificación
   * @returns La modificación encontrada
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener una modificación por ID' })
  @ApiResponse({ 
    status: 200,
    description: 'Modificación encontrada',
    type: ModificacionResponseDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'Modificación no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<ModificacionResponseDto> {
    return this.modificacionesService.findOne(id, req.user);
  }

  /**
   * Actualiza una modificación
   * 
   * @param id - ID de la modificación a actualizar
   * @param updateModificacionDto - Datos actualizados de la modificación
   * @returns La modificación actualizada
   */
  @Patch(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Actualizar una modificación' })
  @ApiResponse({ 
    status: 200,
    description: 'Modificación actualizada',
    type: ModificacionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'Modificación no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModificacionDto: Partial<CreateModificacionDto>,
    @Request() req
  ): Promise<ModificacionResponseDto> {
    return this.modificacionesService.update(id, updateModificacionDto, req.user);
  }

  /**
   * Elimina una modificación
   * 
   * @param id - ID de la modificación a eliminar
   */
  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Eliminar una modificación' })
  @ApiResponse({ status: 200, description: 'Modificación eliminada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'Modificación no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<void> {
    return this.modificacionesService.remove(id, req.user);
  }

  /**
   * Obtiene todas las modificaciones de un contrato
   * 
   * @param contratoId - ID del contrato
   * @returns Lista de modificaciones del contrato
   */
  @Get('contrato/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener modificaciones por contrato' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de modificaciones del contrato',
    type: [ModificacionResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'No se encontraron modificaciones' })
  async findByContrato(
    @Param('id') contratoId: number,
    @Request() req
  ): Promise<ModificacionResponseDto[]> {
    return await this.modificacionesService.findByContrato(contratoId, req.user);
  }
} 