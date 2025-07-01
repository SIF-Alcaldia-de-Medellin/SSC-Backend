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
 * Controlador para la gestión de CUO (Código Único de Obra)
 * 
 * Maneja las peticiones HTTP relacionadas con la administración de códigos únicos
 * de obra, incluyendo operaciones CRUD y consultas específicas.
 */
@ApiTags('CUO')
@ApiBearerAuth('access-token')
@Controller('cuo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CuoController {
  constructor(private readonly cuoService: CuoService) {}

  /**
   * Crea un nuevo Código Único de Obra (CUO)
   */
  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Crear un nuevo Código Único de Obra (CUO)',
    description: 'Permite crear un nuevo código único de obra asociado a un contrato específico'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Código Único de Obra creado exitosamente',
    type: CuoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso al contrato especificado' })
  create(@Request() req, @Body() createCuoDto: CreateCuoDto): Promise<CuoResponseDto> {
    return this.cuoService.create(createCuoDto, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los Códigos Únicos de Obra (CUO)
   */
  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener todos los Códigos Únicos de Obra (CUO)',
    description: 'Lista todos los códigos únicos de obra. Los supervisores solo ven los de sus contratos asignados'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de Códigos Únicos de Obra. Para supervisores, solo muestra los CUO de sus contratos.',
    type: [CuoResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Request() req): Promise<CuoResponseDto[]> {
    return this.cuoService.findAll(req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene un Código Único de Obra (CUO) por su ID
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener un Código Único de Obra (CUO) por ID',
    description: 'Consulta un código único de obra específico mediante su identificador'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Código Único de Obra encontrado',
    type: CuoResponseDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este Código Único de Obra' })
  @ApiResponse({ status: 404, description: 'Código Único de Obra no encontrado' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<CuoResponseDto> {
    return this.cuoService.findOne(id, req.user.cedula, req.user.rol);
  }

  /**
   * Actualiza un Código Único de Obra (CUO)
   */
  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Actualizar un Código Único de Obra (CUO)',
    description: 'Modifica los datos de un código único de obra existente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Código Único de Obra actualizado exitosamente',
    type: CuoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este Código Único de Obra' })
  @ApiResponse({ status: 404, description: 'Código Único de Obra no encontrado' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCuoDto: Partial<CreateCuoDto>,
  ): Promise<CuoResponseDto> {
    return this.cuoService.update(id, updateCuoDto, req.user.cedula, req.user.rol);
  }

  /**
   * Elimina un Código Único de Obra (CUO)
   */
  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ 
    summary: 'Eliminar un Código Único de Obra (CUO)',
    description: 'Elimina permanentemente un código único de obra del sistema'
  })
  @ApiResponse({ status: 200, description: 'Código Único de Obra eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo los administradores pueden eliminar Códigos Únicos de Obra' })
  @ApiResponse({ status: 404, description: 'Código Único de Obra no encontrado' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cuoService.remove(id, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene todos los Códigos Únicos de Obra (CUO) de un contrato
   */
  @Get('contrato/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener Códigos Únicos de Obra por contrato',
    description: 'Lista todos los códigos únicos de obra asociados a un contrato específico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de Códigos Únicos de Obra del contrato especificado',
    type: [CuoResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a este contrato' })
  @ApiResponse({ status: 404, description: 'No se encontraron Códigos Únicos de Obra para este contrato' })
  findByContrato(@Request() req, @Param('id', ParseIntPipe) contratoId: number): Promise<CuoResponseDto[]> {
    return this.cuoService.findByContrato(contratoId, req.user.cedula, req.user.rol);
  }
} 