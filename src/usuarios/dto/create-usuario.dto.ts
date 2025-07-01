import { IsString, IsEmail, IsEnum, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolUsuario } from '../usuario.entity';

/**
 * DTO para la creación de usuarios
 * 
 * Incluye todas las validaciones necesarias para garantizar
 * la integridad de los datos
 */
export class CreateUsuarioDto {
  /**
   * Cédula del usuario
   * Debe ser un número válido de documento colombiano
   */
  @ApiProperty({
    description: 'Cédula del usuario (documento de identidad colombiano)',
    example: '1234567890',
    pattern: '^[0-9]{8,10}$',
    minLength: 8,
    maxLength: 10
  })
  @IsNotEmpty({ message: 'La cédula es requerida' })
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @Matches(/^[0-9]{8,10}$/, { 
    message: 'La cédula debe tener entre 8 y 10 dígitos' 
  })
  cedula: string;

  /**
   * Correo electrónico
   * Debe tener un formato válido
   */
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'supervisor@medellin.gov.co',
    format: 'email'
  })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  email: string;

  /**
   * Contraseña
   * Debe cumplir con requisitos mínimos de seguridad
   */
  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 8 caracteres, debe contener mayúscula, minúscula y número)',
    example: 'MiPassword123',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$'
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
  })
  password: string;

  /**
   * Rol del usuario
   * Debe ser uno de los roles válidos del sistema
   */
  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: RolUsuario,
    example: RolUsuario.SUPERVISOR,
    enumName: 'RolUsuario'
  })
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsEnum(RolUsuario, { 
    message: 'El rol debe ser supervisor, admin o jefe' 
  })
  rol: RolUsuario;

  /**
   * Nombre completo del usuario
   */
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Carlos Pérez',
    minLength: 3
  })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;
} 