import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordControlFields1751550400000 implements MigrationInterface {
    name = 'AddPasswordControlFields1751550400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar campo para indicar si el usuario debe cambiar su contraseña
        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_USUARIOS" 
            ADD COLUMN "USU_MUST_CHANGE_PASSWORD" boolean NOT NULL DEFAULT true
        `);

        // Agregar campo para almacenar la fecha del último cambio de contraseña
        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_USUARIOS" 
            ADD COLUMN "USU_LAST_PASSWORD_CHANGE" timestamp NULL
        `);

        // Agregar comentarios descriptivos para documentar los campos
        await queryRunner.query(`
            COMMENT ON COLUMN "SSC"."TBL_USUARIOS"."USU_MUST_CHANGE_PASSWORD" 
            IS 'Indica si el usuario debe cambiar su contraseña en el próximo login'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "SSC"."TBL_USUARIOS"."USU_LAST_PASSWORD_CHANGE" 
            IS 'Fecha y hora del último cambio de contraseña'
        `);

        // Crear índice para mejorar consultas por usuarios que deben cambiar contraseña
        await queryRunner.query(`
            CREATE INDEX "idx_usuarios_must_change_password" 
            ON "SSC"."TBL_USUARIOS" ("USU_MUST_CHANGE_PASSWORD")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índice
        await queryRunner.query(`DROP INDEX "SSC"."idx_usuarios_must_change_password"`);
        
        // Eliminar comentarios
        await queryRunner.query(`
            COMMENT ON COLUMN "SSC"."TBL_USUARIOS"."USU_LAST_PASSWORD_CHANGE" IS NULL
        `);
        
        await queryRunner.query(`
            COMMENT ON COLUMN "SSC"."TBL_USUARIOS"."USU_MUST_CHANGE_PASSWORD" IS NULL
        `);
        
        // Eliminar campos
        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_USUARIOS" 
            DROP COLUMN "USU_LAST_PASSWORD_CHANGE"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "SSC"."TBL_USUARIOS" 
            DROP COLUMN "USU_MUST_CHANGE_PASSWORD"
        `);
    }
} 