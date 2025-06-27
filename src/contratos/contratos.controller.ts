import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { ContratoResponseDto } from './dto/contrato.response.dto';
import { RolUsuario } from '../usuarios/usuario.entity';

/**
 * Controlador para la gestión de contratos
 */
@ApiTags('Contratos')
@ApiBearerAuth('access-token')
@Controller('contratos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  /**
   * Crea un nuevo contrato
   */
  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo contrato' })
  @ApiResponse({ 
    status: 201, 
    description: 'Contrato creado exitosamente',
    type: ContratoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  create(@Request() req, @Body() createContratoDto: CreateContratoDto): Promise<ContratoResponseDto> {
    return this.contratosService.create(createContratoDto, req.user.rol);
  }

  /**
   * Obtiene todos los contratos
   */
  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener todos los contratos' })
  @ApiResponse({ 
    status: 200,
    description: 'Lista de contratos',
    type: [ContratoResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Request() req): Promise<ContratoResponseDto[]> {
    return this.contratosService.findAll(req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene un contrato por su ID
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener un contrato por ID' })
  @ApiResponse({ 
    status: 200,
    description: 'Contrato encontrado',
    type: ContratoResponseDto
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<ContratoResponseDto> {
    return this.contratosService.findOne(id, req.user.cedula, req.user.rol);
  }

  /**
   * Actualiza un contrato
   */
  @Patch(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Actualizar un contrato' })
  @ApiResponse({ 
    status: 200,
    description: 'Contrato actualizado',
    type: ContratoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContratoDto: Partial<CreateContratoDto>,
  ): Promise<ContratoResponseDto> {
    return this.contratosService.update(id, updateContratoDto, req.user.cedula, req.user.rol);
  }

  /**
   * Elimina un contrato
   */
  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Eliminar un contrato' })
  @ApiResponse({ status: 200, description: 'Contrato eliminado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Contrato no encontrado' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.contratosService.remove(id, req.user.cedula, req.user.rol);
  }

  /**
   * Obtiene los contratos asignados a un supervisor
   */
  @Get('supervisor/:cedula')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener contratos por supervisor' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de contratos del supervisor',
    type: [ContratoResponseDto]
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'No se encontraron contratos' })
  findByUsuario(@Request() req, @Param('cedula') usuarioCedula: string): Promise<ContratoResponseDto[]> {
    // Si es supervisor, solo puede ver sus propios contratos
    const cedulaConsulta = req.user.rol === RolUsuario.SUPERVISOR ? req.user.cedula : usuarioCedula;
    return this.contratosService.findByUsuario(cedulaConsulta, req.user.rol);
  }
} 