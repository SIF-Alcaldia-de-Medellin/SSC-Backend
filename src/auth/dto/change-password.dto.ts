import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para cambio de contraseña estándar
 * 
 * Se usa cuando el usuario ya tiene una contraseña establecida
 * y quiere cambiarla. Requiere la contraseña actual para validación.
 */
export class ChangePasswordDto {
  /**
   * Contraseña actual del usuario
   * Se requiere para validar la identidad antes del cambio
   */
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'MiPasswordAnterior123',
    minLength: 1
  })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  currentPassword: string;

  /**
   * Nueva contraseña que quiere establecer el usuario
   * Debe cumplir con las políticas de seguridad del sistema
   */
  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres, debe contener mayúscula, minúscula y número)',
    example: 'MiNuevaPassword123',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'
  })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message: 'La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y puede incluir caracteres especiales (@$!%*?&)'
  })
  newPassword: string;
} 