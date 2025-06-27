import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para el inicio de sesión
 */
export class LoginDto {
  /**
   * Correo electrónico del usuario
   * @example "usuario@medellin.gov.co"
   */
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@medellin.gov.co'
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  /**
   * Contraseña del usuario
   * Mínimo 6 caracteres
   */
  @ApiProperty({
    description: 'Contraseña del usuario',
    minLength: 6
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
} 