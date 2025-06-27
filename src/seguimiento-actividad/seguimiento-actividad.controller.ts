import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';
import { SeguimientoActividadService } from './seguimiento-actividad.service';
import { CreateSeguimientoActividadDto } from './dto/create-seguimiento-actividad.dto';
import { SeguimientoActividadResponseDto } from './dto/seguimiento-actividad.response.dto';

/**
 * Controlador para la gestión de seguimientos de actividades.
 * Permite a administradores y supervisores crear y consultar seguimientos de actividades.
 * Los supervisores solo pueden acceder a las actividades de los contratos a los que están asignados.
 */
@ApiTags('Seguimiento de Actividades')
@ApiBearerAuth('access-token')
@Controller('seguimiento-actividad')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeguimientoActividadController {
  constructor(private readonly seguimientoActividadService: SeguimientoActividadService) {}

  /**
   * Crea un nuevo seguimiento de actividad.
   * Los supervisores solo pueden crear seguimientos para actividades de sus contratos asignados.
   */
  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Crear un nuevo seguimiento de actividad',
    description: 'Crea un nuevo seguimiento para una actividad específica. Los supervisores solo pueden crear seguimientos para actividades de sus contratos asignados.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Seguimiento creado exitosamente',
    type: SeguimientoActividadResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos en la solicitud' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tienes permisos para esta actividad' })
  @ApiResponse({ status: 404, description: 'No se encontró la actividad especificada' })
  create(
    @Request() req,
    @Body() createSeguimientoActividadDto: CreateSeguimientoActividadDto
  ): Promise<SeguimientoActividadResponseDto> {
    return this.seguimientoActividadService.create(createSeguimientoActividadDto, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los seguimientos de una actividad específica.
   * Los supervisores solo pueden ver seguimientos de actividades de sus contratos asignados.
   */
  @Get('actividad/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener seguimientos por ID de actividad',
    description: 'Retorna todos los seguimientos de una actividad específica. Los supervisores solo pueden ver seguimientos de sus contratos asignados.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la actividad',
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de seguimientos de la actividad ordenados por fecha descendente',
    type: [SeguimientoActividadResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tienes permisos para esta actividad' })
  @ApiResponse({ status: 404, description: 'No se encontró la actividad o no tiene seguimientos' })
  findByActividad(
    @Request() req,
    @Param('id', ParseIntPipe) actividadId: number
  ): Promise<SeguimientoActividadResponseDto[]> {
    return this.seguimientoActividadService.findByActividad(actividadId, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene un seguimiento específico por su ID.
   * Los supervisores solo pueden ver seguimientos de actividades de sus contratos asignados.
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener un seguimiento por ID',
    description: 'Retorna un seguimiento específico por su ID. Los supervisores solo pueden ver seguimientos de sus contratos asignados.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del seguimiento',
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Seguimiento encontrado',
    type: SeguimientoActividadResponseDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tienes permisos para este seguimiento' })
  @ApiResponse({ status: 404, description: 'Seguimiento no encontrado' })
  findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number
  ): Promise<SeguimientoActividadResponseDto> {
    return this.seguimientoActividadService.findOne(id, req.user.cedula, req.user.rol);
  }
} 