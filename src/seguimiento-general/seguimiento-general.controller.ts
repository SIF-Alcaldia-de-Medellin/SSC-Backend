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
 * 
 * Este módulo maneja el seguimiento del avance general de contratos, calculando automáticamente
 * valores acumulados y porcentajes de progreso. Cada seguimiento muestra tanto el avance 
 * individual del período como el progreso total acumulado hasta esa fecha.
 * 
 * Características principales:
 * - Valores individuales: Lo reportado en ese seguimiento específico
 * - Valores acumulados: Suma total desde el inicio del contrato hasta esa fecha
 * - Porcentajes automáticos: Basados en el valor total del contrato
 * - Control de acceso: Los supervisores solo acceden a sus contratos asignados
 */
@ApiTags('Seguimiento General')
@ApiBearerAuth('access-token')
@Controller('seguimiento-general')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeguimientoGeneralController {
  constructor(private readonly seguimientoGeneralService: SeguimientoGeneralService) {}

  /**
   * Crea un nuevo seguimiento general con cálculo automático de valores acumulados.
   * Los supervisores solo pueden crear seguimientos para sus contratos asignados.
   */
  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Crear un nuevo seguimiento general',
    description: `Crea un nuevo seguimiento general para un contrato. 
    
    **Características:**
    - Calcula automáticamente valores acumulados (suma de todos los seguimientos hasta la fecha)
    - Determina porcentajes de avance basados en el valor total del contrato
    - Evalúa el estado del avance (ATRASADO/NORMAL/ADELANTADO)
    - Los supervisores solo pueden crear seguimientos para sus contratos asignados
    
    **Datos de entrada:**
    - avanceFinanciero: Valor ejecutado en este período específico (se suma al acumulado)
    - avanceFisico: Porcentaje de avance físico de este período (se suma al acumulado)
    
    **Validaciones automáticas:**
    - El avance físico individual debe estar entre 0% y 100%
    - El avance físico acumulado total no puede superar el 100%
    - Si ya existe un 80% acumulado, solo se puede agregar máximo 20% adicional
    - Los valores financieros deben ser positivos
    
    **Datos de salida:**
    - Valores individuales del período + valores acumulados totales
    - Porcentajes calculados automáticamente
    - Estado y resumen del avance`
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Seguimiento general creado exitosamente con valores acumulados calculados',
    type: SeguimientoGeneralResponseDto,
    schema: {
      example: {
        "id": 1,
        "contratoId": 1,
        "valorEjecutadoIndividual": 150000000,
        "valorEjecutado": 250000000,
        "avanceFisicoIndividual": 15.5,
        "avanceFisico": 45.5,
        "avanceFinanciero": 76.22,
        "diferenciaAvance": -30.72,
        "estadoAvance": "ATRASADO",
        "observaciones": "Avance del segundo trimestre",
        "resumenEstado": "ATRASADO: Avance físico 45.50% vs. financiero 76.22% (diferencia: -30.72%). Valor ejecutado acumulado: $250.000.000 de $328.000.000",
        "contrato": {
          "numeroContrato": "460000001",
          "identificadorSimple": "INFRA-2024-001",
          "objeto": "Construcción de infraestructura vial",
          "valorTotal": 328000000
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos en la solicitud',
    schema: {
      examples: {
        "limite_100_porciento": {
          summary: "Avance físico acumulado supera 100%",
          value: {
            "statusCode": 400,
            "message": "El avance físico acumulado no puede superar el 100%. Avance actual: 85.50%, Nuevo avance: 20.00%, Total resultante: 105.50%. Máximo permitido: 14.50%",
            "error": "Bad Request"
          }
        },
        "valor_invalido": {
          summary: "Valores fuera de rango",
          value: {
            "statusCode": 400,
            "message": "El porcentaje de avance físico debe estar entre 0 y 100",
            "error": "Bad Request"
          }
        }
      }
    }
  })
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
   * Obtiene todos los seguimientos de un contrato por su ID con valores acumulados.
   * Los supervisores solo pueden ver seguimientos de sus contratos asignados.
   */
  @Get('contrato/:id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener seguimientos por ID de contrato',
    description: `Retorna todos los seguimientos de un contrato específico con valores acumulados calculados.
    
    **Características de la respuesta:**
    - Lista ordenada por fecha (más reciente primero)
    - Cada seguimiento incluye valores individuales y acumulados
    - Valores acumulados representan el progreso total hasta esa fecha
    - Porcentajes calculados automáticamente basados en el valor total del contrato
    - Estado de avance evaluado (ATRASADO/NORMAL/ADELANTADO)
    
    **Estructura de cada seguimiento:**
    - valorEjecutadoIndividual: Lo ejecutado en ese período específico
    - valorEjecutado: Total acumulado hasta esa fecha
    - avanceFisicoIndividual: Avance físico de ese período
    - avanceFisico: Avance físico total acumulado
    - avanceFinanciero: % financiero basado en acumulado
    
    Los supervisores solo pueden ver seguimientos de sus contratos asignados.`
  })
  @ApiParam({
    name: 'id',
    description: 'ID del contrato para obtener sus seguimientos',
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de seguimientos del contrato con valores acumulados',
    type: [SeguimientoGeneralResponseDto],
    schema: {
      example: [
        {
          "id": 2,
          "valorEjecutadoIndividual": 150000000,
          "valorEjecutado": 250000000,
          "avanceFisicoIndividual": 15.5,
          "avanceFisico": 45.5,
          "avanceFinanciero": 76.22,
          "estadoAvance": "ATRASADO",
          "createdAt": "2024-01-20T10:30:00Z"
        },
        {
          "id": 1,
          "valorEjecutadoIndividual": 100000000,
          "valorEjecutado": 100000000,
          "avanceFisicoIndividual": 30.0,
          "avanceFisico": 30.0,
          "avanceFinanciero": 30.49,
          "estadoAvance": "NORMAL",
          "createdAt": "2024-01-15T09:15:00Z"
        }
      ]
    }
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
   * Obtiene todos los seguimientos de un contrato por su número con valores acumulados.
   * Los supervisores solo pueden ver seguimientos de sus contratos asignados.
   */
  @Get('contrato/numero/:numeroContrato')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener seguimientos por número de contrato',
    description: `Retorna todos los seguimientos de un contrato específico por su número con valores acumulados.
    
    **Similar al endpoint por ID pero busca el contrato por su número:**
    - Busca el contrato por numeroContrato (ej: "460000001")
    - Retorna la misma estructura con valores acumulados
    - Útil cuando solo se conoce el número de contrato
    - Mantiene las mismas validaciones de permisos
    
    **Valores devueltos:**
    - Lista ordenada cronológicamente (más reciente primero)  
    - Valores individuales + acumulados para cada seguimiento
    - Cálculos automáticos de porcentajes y estados`
  })
  @ApiParam({
    name: 'numeroContrato',
    description: 'Número del contrato (ejemplo: 460000000)',
    type: 'string',
    example: '460000001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de seguimientos del contrato con valores acumulados',
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

  /**
   * Obtiene un seguimiento específico por su ID con valores acumulados calculados.
   * Los supervisores solo pueden ver seguimientos de sus contratos asignados.
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Obtener un seguimiento por ID',
    description: `Retorna un seguimiento específico por su ID con todos los valores acumulados calculados.
    
    **Información incluida:**
    - Datos individuales del seguimiento consultado
    - Valores acumulados hasta la fecha de ese seguimiento
    - Porcentajes de avance financiero calculados automáticamente
    - Estado del avance (ATRASADO/NORMAL/ADELANTADO)
    - Resumen textual del estado
    - Información básica del contrato asociado
    
    **Casos de uso:**
    - Consultar el estado específico en un momento determinado
    - Revisar el progreso acumulado hasta una fecha específica
    - Analizar la evolución del avance en un punto específico
    
    Los supervisores solo pueden ver seguimientos de sus contratos asignados.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Seguimiento encontrado con valores acumulados',
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


} 