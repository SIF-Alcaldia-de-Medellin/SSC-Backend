import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para operaciones de cambio de contraseña
 * 
 * Proporciona información sobre el resultado de la operación
 * y tokens actualizados si es necesario
 */
export class ChangePasswordResponseDto {
  /**
   * Indica si el cambio de contraseña fue exitoso
   */
  @ApiProperty({
    description: 'Indica si el cambio de contraseña fue exitoso',
    example: true
  })
  success: boolean;

  /**
   * Mensaje descriptivo del resultado de la operación
   */
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Contraseña cambiada exitosamente'
  })
  message: string;

  /**
   * Nuevo token de acceso (opcional)
   * Se incluye cuando es necesario reflejar cambios en el usuario
   */
  @ApiProperty({
    description: 'Nuevo token de acceso (si es necesario)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false
  })
  access_token?: string;

  /**
   * Fecha del cambio de contraseña
   */
  @ApiProperty({
    description: 'Fecha y hora en que se realizó el cambio',
    example: '2024-01-15T10:30:00.000Z'
  })
  passwordChangedAt: Date;

  /**
   * Información del usuario actualizada (sin contraseña)
   */
  @ApiProperty({
    description: 'Información actualizada del usuario',
    example: {
      cedula: '1234567890',
      email: 'usuario@medellin.gov.co',
      nombre: 'Usuario Prueba',
      rol: 'SUPERVISOR',
      mustChangePassword: false,
      lastPasswordChange: '2024-01-15T10:30:00.000Z'
    }
  })
  user: {
    cedula: string;
    email: string;
    nombre: string;
    rol: string;
    mustChangePassword: boolean;
    lastPasswordChange: Date;
  };
} 