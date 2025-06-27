import { IsString, IsEmail, IsEnum, MinLength, Matches, IsNotEmpty } from 'class-validator';
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
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  email: string;

  /**
   * Contraseña
   * Debe cumplir con requisitos mínimos de seguridad
   */
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
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsEnum(RolUsuario, { 
    message: 'El rol debe ser supervisor, admin o jefe' 
  })
  rol: RolUsuario;

  /**
   * Nombre completo del usuario
   */
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;
} 