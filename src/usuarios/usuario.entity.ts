import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * Roles disponibles en el sistema
 * 
 * ADMIN: Acceso total al sistema y gestión de usuarios
 * SUPERVISOR: Gestión de contratos y seguimiento de obras
 */
export enum RolUsuario {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR'
}

/**
 * Entidad que representa la tabla TBL_USUARIOS
 * 
 * Almacena la información de los usuarios del sistema incluyendo
 * sus credenciales, rol y datos básicos
 */
@Entity({ schema: 'SSC', name: 'TBL_USUARIOS' })
export class Usuario {
  /**
   * Número de cédula del usuario
   * Se usa como identificador principal
   */
  @PrimaryColumn('varchar', { name: 'USU_CEDULA', length: 20 })
  cedula: string;

  /**
   * Correo electrónico del usuario
   * Debe ser único en el sistema
   */
  @Column('varchar', { name: 'USU_EMAIL', unique: true, length: 100 })
  email: string;

  /**
   * Contraseña del usuario
   * Se almacena encriptada
   */
  @Column('varchar', { name: 'USU_PASSWORD', length: 100 })
  password: string;

  /**
   * Rol del usuario en el sistema
   * Define sus permisos y accesos:
   * - ADMIN: Acceso total al sistema
   * - SUPERVISOR: Gestión y seguimiento de obras
   */
  @Column({
    name: 'USU_ROL',
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.SUPERVISOR
  })
  rol: RolUsuario;

  /**
   * Nombre completo del usuario
   */
  @Column('varchar', { name: 'USU_NOMBRE', length: 100 })
  nombre: string;

  /**
   * Fecha de creación del registro
   * Se genera automáticamente
   */
  @CreateDateColumn({ 
    name: 'USU_CREATED_AT',
    type: 'timestamp'
  })
  createdAt: Date;
} 