/**
 * Constantes utilizadas en el módulo de autenticación
 */
export const jwtConstants = {
  // Clave secreta para firmar los tokens JWT
  // En producción, usar una clave más segura y almacenarla en variables de entorno
  secret: 'secretKey',
  
  // Tiempo de expiración del token (24 horas)
  expiresIn: '24h'
};

/**
 * Tipos de estrategias de autenticación
 */
export const STRATEGY_TYPES = {
  LOCAL: 'local',
  JWT: 'jwt'
}; 