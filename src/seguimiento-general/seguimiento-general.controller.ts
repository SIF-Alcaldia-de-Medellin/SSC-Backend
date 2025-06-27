import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';
import { SeguimientoGeneralService } from './seguimiento-general.service';
import { CreateSeguimientoGeneralDto } from './dto/create-seguimiento-general.dto';
import { SeguimientoGeneralResponseDto } from './dto/seguimiento-general.response.dto';

/**
 * Controlador para la gestión de seguimientos generales de contratos.
 * Permite a administradores y supervisores gestionar el seguimiento general de los contratos.
 * Los supervisores solo pueden acceder y crear seguimientos para sus contratos asignados.
 */
@ApiTags('Seguimiento General')
@ApiBearerAuth('access-token')
@Controller('seguimiento-general')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeguimientoGeneralController {
  constructor(private readonly seguimientoGeneralService: SeguimientoGeneralService) {}

  /**
   * Crea un nuevo seguimiento general.
   * Los supervisores solo pueden crear seguimientos para sus contratos asignados.
   */
  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Crear un nuevo seguimiento general',
    description: 'Crea un nuevo seguimiento general para un contrato. Los supervisores solo pueden crear seguimientos para sus contratos asignados.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Seguimiento general creado exitosamente',
    type: SeguimientoGeneralResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos en la solicitud' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tienes permisos para este contrato' })
  @ApiResponse({ status: 404, description: 'No se encontró el contrato especificado' })
  create(
    @Request() req,
    @Body() createSeguimientoGeneralDto: CreateSeguimientoGeneralDto
  ): Promise<SeguimientoGeneralResponseDto> {
    return this.seguimientoGeneralService.create(createSeguimientoGeneralDto, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene un seguimiento específico por su ID.
   * Los supervisores solo pueden ver seguimientos de sus contratos asignados.
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener un seguimiento por ID',
    description: 'Retorna un seguimiento específico por su ID. Los supervisores solo pueden ver seguimientos de sus contratos asignados.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Seguimiento encontrado',
    type: SeguimientoGeneralResponseDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tienes permisos para este contrato' })
  @ApiResponse({ status: 404, description: 'Seguimiento no encontrado' })
  findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number
  ): Promise<SeguimientoGeneralResponseDto> {
    return this.seguimientoGeneralService.findOne(id, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los seguimientos de un contrato por su ID.
   * Los supervisores solo pueden ver seguimientos de sus contratos asignados.
   */
  @Get('contrato/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener seguimientos por ID de contrato',
    description: 'Retorna todos los seguimientos de un contrato específico. Los supervisores solo pueden ver seguimientos de sus contratos asignados.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato',
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de seguimientos del contrato',
    type: [SeguimientoGeneralResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tienes permisos para este contrato' })
  @ApiResponse({ status: 404, description: 'No se encontraron seguimientos' })
  findByContrato(
    @Request() req,
    @Param('id', ParseIntPipe) contratoId: number
  ): Promise<SeguimientoGeneralResponseDto[]> {
    return this.seguimientoGeneralService.findByContrato(contratoId, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los seguimientos de un contrato por su número.
   * Los supervisores solo pueden ver seguimientos de sus contratos asignados.
   */
  @Get('contrato/numero/:numeroContrato')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener seguimientos por número de contrato',
    description: 'Retorna todos los seguimientos de un contrato específico por su número. Los supervisores solo pueden ver seguimientos de sus contratos asignados.'
  })
  @ApiParam({
    name: 'numeroContrato',
    description: 'Número del contrato (ejemplo: 460000000)',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de seguimientos del contrato',
    type: [SeguimientoGeneralResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - No tienes permisos para este contrato' })
  @ApiResponse({ status: 404, description: 'No se encontraron seguimientos' })
  findByNumeroContrato(
    @Request() req,
    @Param('numeroContrato') numeroContrato: string
  ): Promise<SeguimientoGeneralResponseDto[]> {
    return this.seguimientoGeneralService.findByNumeroContrato(numeroContrato, req.user.cedula, req.user.rol);
  }
} 