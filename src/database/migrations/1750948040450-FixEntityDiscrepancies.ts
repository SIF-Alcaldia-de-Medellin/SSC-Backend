import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityDiscrepancies1750948040450 implements MigrationInterface {
    name = 'FixEntityDiscrepancies1750948040450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // En entornos de test, omitir esta migración ya que la base de datos se crea limpia
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production';
        
        if (!isDevelopment) {
            console.log('🏃‍♂️ Omitiendo migración de corrección en entorno de test - la base de datos se crea limpia');
            return;
        }

        // Esta migración solo aplica en desarrollo/producción donde puede haber datos inconsistentes
        console.log('🔧 Aplicando corrección de discrepancias en entorno de desarrollo/producción...');
        
        try {
            // 1. Verificar y corregir el enum de roles de usuario si es necesario
            const enumExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'TBL_USUARIOS_usu_rol_enum'
                ) as exists
            `);

            if (!enumExists[0].exists) {
                console.log('⚠️ Tipo ENUM de usuarios no existe - creando...');
                await queryRunner.query(`CREATE TYPE "TBL_USUARIOS_usu_rol_enum" AS ENUM('ADMIN', 'SUPERVISOR')`);
                return;
            }

            const currentEnumValues = await queryRunner.query(`
                SELECT unnest(enum_range(NULL::"TBL_USUARIOS_usu_rol_enum")) as enum_value
            `);
            
            const hasOldValues = currentEnumValues.some(row => 
                row.enum_value === 'admin' || row.enum_value === 'supervisor' || row.enum_value === 'jefe'
            );
            
            if (hasOldValues) {
                console.log('🔧 Corrigiendo enum de roles de usuario...');
                await queryRunner.query(`ALTER TABLE "TBL_USUARIOS" ALTER COLUMN "USU_ROL" DROP DEFAULT`);
                await queryRunner.query(`ALTER TYPE "public"."TBL_USUARIOS_usu_rol_enum" RENAME TO "TBL_USUARIOS_usu_rol_enum_old"`);
                await queryRunner.query(`CREATE TYPE "public"."TBL_USUARIOS_usu_rol_enum" AS ENUM('ADMIN', 'SUPERVISOR')`);
                await queryRunner.query(`UPDATE "TBL_USUARIOS" SET "USU_ROL" = 'ADMIN' WHERE "USU_ROL" = 'admin'`);
                await queryRunner.query(`UPDATE "TBL_USUARIOS" SET "USU_ROL" = 'SUPERVISOR' WHERE "USU_ROL" = 'supervisor'`);
                await queryRunner.query(`ALTER TABLE "TBL_USUARIOS" ALTER COLUMN "USU_ROL" TYPE "public"."TBL_USUARIOS_usu_rol_enum" USING "USU_ROL"::text::"public"."TBL_USUARIOS_usu_rol_enum"`);
                await queryRunner.query(`ALTER TABLE "TBL_USUARIOS" ALTER COLUMN "USU_ROL" SET DEFAULT 'SUPERVISOR'`);
                await queryRunner.query(`DROP TYPE "public"."TBL_USUARIOS_usu_rol_enum_old"`);
            }

            // 2. Verificar y corregir el campo numero de contrato si es INTEGER
            const contratoColumn = await queryRunner.query(`
                SELECT data_type FROM information_schema.columns 
                WHERE table_name = 'TBL_CONTRATOS' AND column_name = 'CON_NRO_CONTRATO'
            `);
            
            if (contratoColumn.length > 0 && contratoColumn[0].data_type === 'integer') {
                console.log('🔧 Corrigiendo tipo de número de contrato...');
                await queryRunner.query(`ALTER TABLE "TBL_CONTRATOS" ALTER COLUMN "CON_NRO_CONTRATO" TYPE character varying(20)`);
            }

            // 3. Verificar y corregir el enum de modificaciones si es necesario
            const modEnumExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'TBL_MODIFICACIONES_mod_tipo_enum'
                ) as exists
            `);

            if (modEnumExists[0].exists) {
                const currentModEnumValues = await queryRunner.query(`
                    SELECT unnest(enum_range(NULL::"TBL_MODIFICACIONES_mod_tipo_enum")) as enum_value
                `);
                
                const hasOldModValues = currentModEnumValues.some(row => 
                    row.enum_value === 'suspension' || row.enum_value === 'reinicio' || row.enum_value === 'prorroga' || row.enum_value === 'otro'
                );
                
                if (hasOldModValues) {
                    console.log('🔧 Corrigiendo enum de tipos de modificación...');
                    await queryRunner.query(`ALTER TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum" RENAME TO "TBL_MODIFICACIONES_mod_tipo_enum_old"`);
                    await queryRunner.query(`CREATE TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum" AS ENUM('SUSPENSION', 'REINICIO')`);
                    await queryRunner.query(`UPDATE "TBL_MODIFICACIONES" SET "MOD_TIPO" = 'SUSPENSION' WHERE "MOD_TIPO" = 'suspension'`);
                    await queryRunner.query(`UPDATE "TBL_MODIFICACIONES" SET "MOD_TIPO" = 'REINICIO' WHERE "MOD_TIPO" = 'reinicio'`);
                    await queryRunner.query(`DELETE FROM "TBL_MODIFICACIONES" WHERE "MOD_TIPO" IN ('prorroga', 'otro')`); // Eliminar registros no válidos
                    await queryRunner.query(`ALTER TABLE "TBL_MODIFICACIONES" ALTER COLUMN "MOD_TIPO" TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum" USING "MOD_TIPO"::text::"public"."TBL_MODIFICACIONES_mod_tipo_enum"`);
                    await queryRunner.query(`DROP TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum_old"`);
                }
            }

            // 4. Verificar y corregir otros campos solo si es necesario
            const fieldsToCheck = [
                {
                    table: 'TBL_MODIFICACIONES',
                    oldColumn: 'MOD_FECHA_INICIO', 
                    newColumn: 'MOD_FECHA_INICIAL',
                    action: 'rename'
                },
                {
                    table: 'TBL_CUO',
                    column: 'CUO_NRO',
                    expectedType: 'character varying',
                    currentType: 'integer',
                    action: 'type_change',
                    newType: 'character varying(20)'
                }
            ];

            for (const field of fieldsToCheck) {
                if (field.action === 'rename') {
                    const hasOldColumn = await queryRunner.query(`
                        SELECT column_name FROM information_schema.columns 
                        WHERE table_name = '${field.table}' AND column_name = '${field.oldColumn}'
                    `);
                    if (hasOldColumn.length > 0) {
                        console.log(`🔧 Renombrando columna ${field.oldColumn} a ${field.newColumn}...`);
                        await queryRunner.query(`ALTER TABLE "${field.table}" RENAME COLUMN "${field.oldColumn}" TO "${field.newColumn}"`);
                    }
                } else if (field.action === 'type_change') {
                    const columnInfo = await queryRunner.query(`
                        SELECT data_type FROM information_schema.columns 
                        WHERE table_name = '${field.table}' AND column_name = '${field.column}'
                    `);
                    if (columnInfo.length > 0 && columnInfo[0].data_type === field.currentType) {
                        console.log(`🔧 Cambiando tipo de ${field.column} de ${field.currentType} a ${field.newType}...`);
                        await queryRunner.query(`ALTER TABLE "${field.table}" ALTER COLUMN "${field.column}" TYPE ${field.newType}`);
                    }
                }
            }

            console.log('✅ Migración completada exitosamente');
            
        } catch (error) {
            console.error('❌ Error en migración:', error.message);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir cambios en orden inverso
        await queryRunner.query(`ALTER TABLE "TBL_SEGUIMIENTOGENERAL" ALTER COLUMN "SEG_AVANCE_FINANCIERO" TYPE decimal(5,2)`);
        await queryRunner.query(`ALTER TABLE "TBL_ADICIONES" ALTER COLUMN "ADI_VALOR_ADICION" TYPE numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "TBL_ACTIVIDADES" ALTER COLUMN "ACT_PROYECTADO_FINANCIERO" TYPE numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "TBL_ACTIVIDADES" ALTER COLUMN "ACT_METAFISICA" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "TBL_ACTIVIDADES" ALTER COLUMN "ACT_ACTIVIDAD" TYPE text`);
        await queryRunner.query(`ALTER TABLE "TBL_CUO" ALTER COLUMN "CUO_NRO" TYPE integer`);
        await queryRunner.query(`ALTER TABLE "TBL_MODIFICACIONES" RENAME COLUMN "MOD_FECHA_INICIAL" TO "MOD_FECHA_INICIO"`);
        
        await queryRunner.query(`CREATE TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum_old" AS ENUM('suspension', 'reinicio', 'prorroga', 'otro')`);
        await queryRunner.query(`ALTER TABLE "TBL_MODIFICACIONES" ALTER COLUMN "MOD_TIPO" TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum_old" USING "MOD_TIPO"::text::"public"."TBL_MODIFICACIONES_mod_tipo_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum_old" RENAME TO "TBL_MODIFICACIONES_mod_tipo_enum"`);

        await queryRunner.query(`ALTER TABLE "TBL_CONTRATOS" ALTER COLUMN "CON_NRO_CONTRATO" TYPE integer`);

        await queryRunner.query(`CREATE TYPE "public"."TBL_USUARIOS_usu_rol_enum_old" AS ENUM('supervisor', 'admin', 'jefe')`);
        await queryRunner.query(`ALTER TABLE "TBL_USUARIOS" ALTER COLUMN "USU_ROL" TYPE "public"."TBL_USUARIOS_usu_rol_enum_old" USING "USU_ROL"::text::"public"."TBL_USUARIOS_usu_rol_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."TBL_USUARIOS_usu_rol_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."TBL_USUARIOS_usu_rol_enum_old" RENAME TO "TBL_USUARIOS_usu_rol_enum"`);
    }
} 