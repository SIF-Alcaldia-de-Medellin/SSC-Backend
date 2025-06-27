import { config } from 'dotenv';

// Cargar variables de entorno de prueba
config({ path: '.env.test' });

// Aumentar el timeout para pruebas de integración
jest.setTimeout(30000); 