import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActividadesService } from './actividades.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { ActividadResponseDto } from './dto/actividad.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';

/**
 * Controlador para la gestión de actividades
 */
@ApiTags('Actividades')
@ApiBearerAuth('access-token')
@Controller('actividades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  /**
   * Crea una nueva actividad
   */
  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Crear una nueva actividad' })
  @ApiResponse({ 
    status: 201, 
    description: 'Actividad creada exitosamente',
    type: ActividadResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso al Código Único de Obra especificado' })
  create(@Request() req, @Body() createActividadDto: CreateActividadDto): Promise<ActividadResponseDto> {
    return this.actividadesService.create(createActividadDto, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todas las actividades
   */
  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener todas las actividades' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de actividades. Para supervisores, solo muestra las actividades de sus contratos.',
    type: [ActividadResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Request() req): Promise<ActividadResponseDto[]> {
    return this.actividadesService.findAll(req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene una actividad por su ID
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener una actividad por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Actividad encontrada',
    type: ActividadResponseDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta actividad' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<ActividadResponseDto> {
    return this.actividadesService.findOne(id, req.user.cedula, req.user.rol);
  }

  /**
   * Actualiza una actividad
   */
  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar una actividad' })
  @ApiResponse({ 
    status: 200, 
    description: 'Actividad actualizada',
    type: ActividadResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta actividad' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActividadDto: Partial<CreateActividadDto>,
  ): Promise<ActividadResponseDto> {
    return this.actividadesService.update(id, updateActividadDto, req.user.cedula, req.user.rol);
  }

  /**
   * Elimina una actividad
   */
  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Eliminar una actividad' })
  @ApiResponse({ status: 200, description: 'Actividad eliminada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo los administradores pueden eliminar actividades' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.actividadesService.remove(id, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todas las actividades de un Código Único de Obra (CUO)
   */
  @Get('cuo/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener actividades por Código Único de Obra (CUO)',
    description: 'Lista todas las actividades asociadas a un código único de obra específico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de actividades del Código Único de Obra especificado',
    type: [ActividadResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este Código Único de Obra' })
  @ApiResponse({ status: 404, description: 'No se encontraron actividades para este Código Único de Obra' })
  findByCuo(@Request() req, @Param('id', ParseIntPipe) cuoId: number): Promise<ActividadResponseDto[]> {
    return this.actividadesService.findByCuo(cuoId, req.user.cedula, req.user.rol);
  }
} 