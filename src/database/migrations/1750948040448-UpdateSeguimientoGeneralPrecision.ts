import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSeguimientoGeneralPrecision1750948040448 implements MigrationInterface {
    name = 'UpdateSeguimientoGeneralPrecision1750948040448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar en qué schema está la tabla
        const tableSchema = await queryRunner.query(`
            SELECT table_schema 
            FROM information_schema.tables 
            WHERE table_name = 'TBL_SEGUIMIENTOGENERAL'
            LIMIT 1
        `);
        
        const schema = tableSchema.length > 0 ? tableSchema[0].table_schema : 'SSC';
        console.log(`Actualizando tabla en schema: ${schema}`);
        
        // Primero modificamos la columna de avance financiero para manejar valores monetarios
        await queryRunner.query(`
            ALTER TABLE "${schema}"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FINANCIERO" TYPE decimal(15,2)
        `);

        // Aseguramos que la columna de avance físico mantenga su precisión para porcentajes
        await queryRunner.query(`
            ALTER TABLE "${schema}"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FISICO" TYPE decimal(5,2)
        `);
        
        console.log('Columnas actualizadas exitosamente');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Verificar en qué schema está la tabla
        const tableSchema = await queryRunner.query(`
            SELECT table_schema 
            FROM information_schema.tables 
            WHERE table_name = 'TBL_SEGUIMIENTOGENERAL'
            LIMIT 1
        `);
        
        const schema = tableSchema.length > 0 ? tableSchema[0].table_schema : 'SSC';
        
        // Revertir los cambios
        await queryRunner.query(`
            ALTER TABLE "${schema}"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FINANCIERO" TYPE decimal(5,2)
        `);

        await queryRunner.query(`
            ALTER TABLE "${schema}"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FISICO" TYPE decimal(5,2)
        `);
    }
} 