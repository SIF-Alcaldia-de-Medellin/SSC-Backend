import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CuoService } from './cuo.service';
import { CreateCuoDto } from './dto/create-cuo.dto';
import { CuoResponseDto } from './dto/cuo.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';

/**
 * Controlador para la gestión de CUO (Centro Único de Obra)
 */
@ApiTags('CUO')
@ApiBearerAuth('access-token')
@Controller('cuo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CuoController {
  constructor(private readonly cuoService: CuoService) {}

  /**
   * Crea un nuevo CUO
   */
  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Crear un nuevo CUO' })
  @ApiResponse({ 
    status: 201, 
    description: 'CUO creado exitosamente',
    type: CuoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso al contrato especificado' })
  create(@Request() req, @Body() createCuoDto: CreateCuoDto): Promise<CuoResponseDto> {
    return this.cuoService.create(createCuoDto, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los CUO
   */
  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener todos los CUO' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de CUO. Para supervisores, solo muestra los CUO de sus contratos.',
    type: [CuoResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Request() req): Promise<CuoResponseDto[]> {
    return this.cuoService.findAll(req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene un CUO por su ID
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener un CUO por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'CUO encontrado',
    type: CuoResponseDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este CUO' })
  @ApiResponse({ status: 404, description: 'CUO no encontrado' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<CuoResponseDto> {
    return this.cuoService.findOne(id, req.user.cedula, req.user.rol);
  }

  /**
   * Actualiza un CUO
   */
  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar un CUO' })
  @ApiResponse({ 
    status: 200, 
    description: 'CUO actualizado',
    type: CuoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este CUO' })
  @ApiResponse({ status: 404, description: 'CUO no encontrado' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCuoDto: Partial<CreateCuoDto>,
  ): Promise<CuoResponseDto> {
    return this.cuoService.update(id, updateCuoDto, req.user.cedula, req.user.rol);
  }

  /**
   * Elimina un CUO
   */
  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Eliminar un CUO' })
  @ApiResponse({ status: 200, description: 'CUO eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo los administradores pueden eliminar CUOs' })
  @ApiResponse({ status: 404, description: 'CUO no encontrado' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cuoService.remove(id, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los CUO de un contrato
   */
  @Get('contrato/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener CUOs por contrato' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de CUO del contrato',
    type: [CuoResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este contrato' })
  @ApiResponse({ status: 404, description: 'No se encontraron CUOs' })
  findByContrato(@Request() req, @Param('id', ParseIntPipe) contratoId: number): Promise<CuoResponseDto[]> {
    return this.cuoService.findByContrato(contratoId, req.user.cedula, req.user.rol);
  }
} 