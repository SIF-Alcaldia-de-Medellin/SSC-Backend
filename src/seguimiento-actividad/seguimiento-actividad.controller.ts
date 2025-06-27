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
 * Controlador para la gestión de seguimientos de actividades
 */
@ApiTags('Seguimiento de Actividades')
@ApiBearerAuth('access-token')
@Controller('seguimiento-actividad')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeguimientoActividadController {
  constructor(private readonly seguimientoActividadService: SeguimientoActividadService) {}

  /**
   * Crea un nuevo seguimiento de actividad
   */
  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo seguimiento de actividad' })
  @ApiResponse({ 
    status: 201, 
    description: 'Seguimiento creado exitosamente',
    type: SeguimientoActividadResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  create(
    @Request() req,
    @Body() createSeguimientoActividadDto: CreateSeguimientoActividadDto
  ): Promise<SeguimientoActividadResponseDto> {
    return this.seguimientoActividadService.create(createSeguimientoActividadDto, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los seguimientos de una actividad
   */
  @Get('actividad/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener seguimientos por ID de actividad' })
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
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'No se encontraron seguimientos para la actividad' })
  findByActividad(
    @Request() req,
    @Param('id', ParseIntPipe) actividadId: number
  ): Promise<SeguimientoActividadResponseDto[]> {
    return this.seguimientoActividadService.findByActividad(actividadId, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene un seguimiento específico por su ID
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener un seguimiento por ID' })
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
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'Seguimiento no encontrado' })
  findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number
  ): Promise<SeguimientoActividadResponseDto> {
    return this.seguimientoActividadService.findOne(id, req.user.cedula, req.user.rol);
  }
} 