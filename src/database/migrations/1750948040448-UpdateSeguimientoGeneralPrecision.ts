import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSeguimientoGeneralPrecision1750948040448 implements MigrationInterface {
    name = 'UpdateSeguimientoGeneralPrecision1750948040448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Primero modificamos la columna de avance financiero para manejar valores monetarios
        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FINANCIERO" TYPE decimal(15,2)
        `);

        // Aseguramos que la columna de avance físico mantenga su precisión para porcentajes
        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FISICO" TYPE decimal(5,2)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir los cambios
        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FINANCIERO" TYPE decimal(5,2)
        `);

        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_SEGUIMIENTOGENERAL" 
            ALTER COLUMN "SEG_AVANCE_FISICO" TYPE decimal(5,2)
        `);
    }
} 