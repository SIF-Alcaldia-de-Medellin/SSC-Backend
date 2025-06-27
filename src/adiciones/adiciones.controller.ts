import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuarios/usuario.entity';
import { AdicionesService } from './adiciones.service';
import { CreateAdicionDto } from './dto/create-adicion.dto';
import { AdicionResponseDto } from './dto/adicion.response.dto';

/**
 * Controlador para la gestión de adiciones presupuestales
 */
@ApiTags('Adiciones')
@ApiBearerAuth('access-token')
@Controller('adiciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdicionesController {
  constructor(private readonly adicionesService: AdicionesService) {}

  /**
   * Crea una nueva adición presupuestal
   * 
   * @param createAdicionDto - Datos de la adición a crear
   * @returns La adición creada
   */
  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva adición presupuestal' })
  @ApiResponse({ 
    status: 201, 
    description: 'Adición creada exitosamente',
    type: AdicionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  async create(
    @Body() createAdicionDto: CreateAdicionDto,
    @Request() req
  ): Promise<AdicionResponseDto> {
    return await this.adicionesService.create(createAdicionDto, req.user);
  }

  /**
   * Obtiene todas las adiciones
   * 
   * @returns Lista de adiciones
   */
  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener todas las adiciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de adiciones',
    type: [AdicionResponseDto]
  })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  findAll(@Request() req): Promise<AdicionResponseDto[]> {
    return this.adicionesService.findAll(req.user);
  }

  /**
   * Obtiene una adición por su ID
   * 
   * @param id - ID de la adición
   * @returns La adición encontrada
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener una adición por ID' })
  @ApiResponse({
    status: 200,
    description: 'Adición encontrada',
    type: AdicionResponseDto
  })
  @ApiResponse({ status: 404, description: 'Adición no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<AdicionResponseDto> {
    return this.adicionesService.findOne(id, req.user);
  }

  /**
   * Actualiza una adición
   * 
   * @param id - ID de la adición a actualizar
   * @param updateAdicionDto - Datos actualizados de la adición
   * @returns La adición actualizada
   */
  @Patch(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Actualizar una adición' })
  @ApiResponse({
    status: 200,
    description: 'Adición actualizada',
    type: AdicionResponseDto
  })
  @ApiResponse({ status: 404, description: 'Adición no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdicionDto: Partial<CreateAdicionDto>,
    @Request() req
  ): Promise<AdicionResponseDto> {
    return this.adicionesService.update(id, updateAdicionDto, req.user);
  }

  /**
   * Elimina una adición
   * 
   * @param id - ID de la adición a eliminar
   */
  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Eliminar una adición' })
  @ApiResponse({ status: 200, description: 'Adición eliminada' })
  @ApiResponse({ status: 404, description: 'Adición no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<void> {
    return this.adicionesService.remove(id, req.user);
  }

  /**
   * Obtiene todas las adiciones de un contrato
   * 
   * @param contratoId - ID del contrato
   * @returns Lista de adiciones del contrato
   */
  @Get('contrato/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener adiciones por contrato' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de adiciones del contrato',
    type: [AdicionResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Rol no autorizado' })
  @ApiResponse({ status: 404, description: 'No se encontraron adiciones' })
  async findByContrato(
    @Param('id') contratoId: number,
    @Request() req
  ): Promise<AdicionResponseDto[]> {
    return await this.adicionesService.findByContrato(contratoId, req.user);
  }
} 