import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para cambio de contraseña en primer inicio de sesión
 * 
 * Se usa cuando el usuario debe cambiar su contraseña por primera vez
 * o cuando se ha establecido que debe cambiarla obligatoriamente.
 * No requiere la contraseña actual ya que se considera un cambio forzoso.
 */
export class FirstLoginChangePasswordDto {
  /**
   * Nueva contraseña que establecerá el usuario
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