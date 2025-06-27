import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1750948040447 implements MigrationInterface {
    name = 'InitialMigration1750948040447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."TBL_USUARIOS_usu_rol_enum" AS ENUM('supervisor', 'admin', 'jefe')`);
        await queryRunner.query(`CREATE TABLE "TBL_USUARIOS" ("USU_CEDULA" character varying NOT NULL, "USU_EMAIL" character varying NOT NULL, "USU_PASSWORD" character varying NOT NULL, "USU_ROL" "public"."TBL_USUARIOS_usu_rol_enum" NOT NULL DEFAULT 'supervisor', "USU_NOMBRE" character varying NOT NULL, "USU_CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "USU_UPDATED_AT" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_afa3cadb1e822efc2402a94383f" UNIQUE ("USU_EMAIL"), CONSTRAINT "PK_0ce3ff3381a9d331021db4b4cff" PRIMARY KEY ("USU_CEDULA"))`);
        await queryRunner.query(`CREATE TYPE "public"."TBL_CONTRATOS_con_estado_enum" AS ENUM('activo', 'terminado', 'suspendido', 'liquidado')`);
        await queryRunner.query(`CREATE TABLE "TBL_CONTRATOS" ("CON_ID" SERIAL NOT NULL, "CON_USU_CEDULA" character varying NOT NULL, "CON_NRO_CONTRATO" integer NOT NULL, "CON_ANO_SUSCRIPCION" smallint NOT NULL, "CON_PROGRAMA" character varying NOT NULL, "CON_TIPO_CONTRATO" character varying NOT NULL, "CON_OBJETO" text NOT NULL, "CON_IDENTIFICADOR_SIMPLE" character varying NOT NULL, "CON_SUPLENTES" character varying, "CON_APOYO" character varying, "CON_ESTADO" "public"."TBL_CONTRATOS_con_estado_enum" NOT NULL DEFAULT 'activo', "CON_CONTRATISTA" character varying NOT NULL, "CON_NRO_PROCESO" character varying NOT NULL, "CON_FECHA_INI" date NOT NULL, "CON_FECHA_TER_INI" date NOT NULL, "CON_FECHA_TER_ACT" date NOT NULL, "CON_VALOR_INI" bigint NOT NULL, "CON_VALOR_TOTAL" bigint NOT NULL, CONSTRAINT "UQ_3e00e478d435eaae1039af197d8" UNIQUE ("CON_NRO_CONTRATO"), CONSTRAINT "PK_53ca5c79ca69366266fa3ae0ab1" PRIMARY KEY ("CON_ID"))`);
        await queryRunner.query(`CREATE TABLE "TBL_SEGUIMIENTOGENERAL" ("SEG_ID" SERIAL NOT NULL, "SEG_CON_ID" integer NOT NULL, "SEG_AVANCE_FINANCIERO" numeric(5,2) NOT NULL, "SEG_AVANCE_FISICO" numeric(5,2) NOT NULL, "SEG_CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "SEG_OBSERVACIONES" text, CONSTRAINT "PK_40806c77a518ed664c43c757a38" PRIMARY KEY ("SEG_ID"))`);
        await queryRunner.query(`CREATE TABLE "TBL_CUO" ("CUO_ID" SERIAL NOT NULL, "CUO_CON_ID" integer NOT NULL, "CUO_NRO" integer NOT NULL, "CUO_LATITUD" numeric(10,8) NOT NULL, "CUO_LONGITUD" numeric(11,8) NOT NULL, "CUO_COMUNA" character varying(50) NOT NULL, "CUO_BARRIO" character varying(100) NOT NULL, "CUO_DESCRIPCION" text NOT NULL, CONSTRAINT "PK_c7d54950daf98db900c81b591ef" PRIMARY KEY ("CUO_ID"))`);
        await queryRunner.query(`CREATE TABLE "TBL_ACTIVIDADES" ("ACT_ID" SERIAL NOT NULL, "ACT_CUO_ID" integer NOT NULL, "ACT_ACTIVIDAD" text NOT NULL, "ACT_METAFISICA" numeric(10,2) NOT NULL, "ACT_PROYECTADO_FINANCIERO" numeric(15,2) NOT NULL, "ACT_UNIDADES_AVANCE" character varying(50) NOT NULL, CONSTRAINT "PK_3b4cfcb922d9fa5992d02a48ad8" PRIMARY KEY ("ACT_ID"))`);
        await queryRunner.query(`CREATE TABLE "TBL_SEGUIMIENTOACTIVIDAD" ("SEG_ID" SERIAL NOT NULL, "SEG_ACT_ID" integer NOT NULL, "SEG_AVANCE_FISICO" numeric(5,2) NOT NULL, "SEG_COSTO_APROXIMADO" numeric(15,2) NOT NULL, "SEG_CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "SEG_DESCRIPCION_SEGUIMIENTO" text NOT NULL, "SEG_PROYECCION_ACTIVIDADES" text NOT NULL, CONSTRAINT "PK_e9ddc7c0ed646367d83949abf8d" PRIMARY KEY ("SEG_ID"))`);
        await queryRunner.query(`CREATE TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum" AS ENUM('suspension', 'reinicio', 'prorroga', 'otro')`);
        await queryRunner.query(`CREATE TABLE "TBL_MODIFICACIONES" ("MOD_ID" SERIAL NOT NULL, "MOD_CON_ID" integer NOT NULL, "MOD_TIPO" "public"."TBL_MODIFICACIONES_mod_tipo_enum" NOT NULL DEFAULT 'otro', "MOD_FECHA_INICIO" date NOT NULL, "MOD_FECHA_FINAL" date NOT NULL, "MOD_DURACION" integer NOT NULL, "MOD_CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "MOD_OBSERVACIONES" text, CONSTRAINT "PK_99b22ed0da73194d16d260f96ab" PRIMARY KEY ("MOD_ID"))`);
        await queryRunner.query(`CREATE TABLE "TBL_ADICIONES" ("ADI_ID" SERIAL NOT NULL, "ADI_CON_ID" integer NOT NULL, "ADI_VALOR_ADICION" bigint NOT NULL, "ADI_FECHA" date NOT NULL, "ADI_CREATED_AT" TIMESTAMP NOT NULL DEFAULT now(), "ADI_OBSERVACIONES" text, CONSTRAINT "PK_00e2724eaa18bf0ff1b7aafa65a" PRIMARY KEY ("ADI_ID"))`);
        await queryRunner.query(`ALTER TABLE "TBL_CONTRATOS" ADD CONSTRAINT "FK_556768500c0187673a12b267829" FOREIGN KEY ("CON_USU_CEDULA") REFERENCES "TBL_USUARIOS"("USU_CEDULA") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TBL_SEGUIMIENTOGENERAL" ADD CONSTRAINT "FK_8bf4270658ba3aac6288c00623c" FOREIGN KEY ("SEG_CON_ID") REFERENCES "TBL_CONTRATOS"("CON_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TBL_CUO" ADD CONSTRAINT "FK_9f904c641bbf160285bf0789fd3" FOREIGN KEY ("CUO_CON_ID") REFERENCES "TBL_CONTRATOS"("CON_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TBL_ACTIVIDADES" ADD CONSTRAINT "FK_bbde5cbbbeba4bbe556336181c1" FOREIGN KEY ("ACT_CUO_ID") REFERENCES "TBL_CUO"("CUO_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TBL_SEGUIMIENTOACTIVIDAD" ADD CONSTRAINT "FK_c8b88c6d6d8ba6d52028bf64938" FOREIGN KEY ("SEG_ACT_ID") REFERENCES "TBL_ACTIVIDADES"("ACT_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TBL_MODIFICACIONES" ADD CONSTRAINT "FK_3423776d1e7603959bba3ce431e" FOREIGN KEY ("MOD_CON_ID") REFERENCES "TBL_CONTRATOS"("CON_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TBL_ADICIONES" ADD CONSTRAINT "FK_00b5820e5dcf556da40c1eb074a" FOREIGN KEY ("ADI_CON_ID") REFERENCES "TBL_CONTRATOS"("CON_ID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_ADICIONES" DROP CONSTRAINT "FK_00b5820e5dcf556da40c1eb074a"`);
        await queryRunner.query(`ALTER TABLE "TBL_MODIFICACIONES" DROP CONSTRAINT "FK_3423776d1e7603959bba3ce431e"`);
        await queryRunner.query(`ALTER TABLE "TBL_SEGUIMIENTOACTIVIDAD" DROP CONSTRAINT "FK_c8b88c6d6d8ba6d52028bf64938"`);
        await queryRunner.query(`ALTER TABLE "TBL_ACTIVIDADES" DROP CONSTRAINT "FK_bbde5cbbbeba4bbe556336181c1"`);
        await queryRunner.query(`ALTER TABLE "TBL_CUO" DROP CONSTRAINT "FK_9f904c641bbf160285bf0789fd3"`);
        await queryRunner.query(`ALTER TABLE "TBL_SEGUIMIENTOGENERAL" DROP CONSTRAINT "FK_8bf4270658ba3aac6288c00623c"`);
        await queryRunner.query(`ALTER TABLE "TBL_CONTRATOS" DROP CONSTRAINT "FK_556768500c0187673a12b267829"`);
        await queryRunner.query(`DROP TABLE "TBL_ADICIONES"`);
        await queryRunner.query(`DROP TABLE "TBL_MODIFICACIONES"`);
        await queryRunner.query(`DROP TYPE "public"."TBL_MODIFICACIONES_mod_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "TBL_SEGUIMIENTOACTIVIDAD"`);
        await queryRunner.query(`DROP TABLE "TBL_ACTIVIDADES"`);
        await queryRunner.query(`DROP TABLE "TBL_CUO"`);
        await queryRunner.query(`DROP TABLE "TBL_SEGUIMIENTOGENERAL"`);
        await queryRunner.query(`DROP TABLE "TBL_CONTRATOS"`);
        await queryRunner.query(`DROP TYPE "public"."TBL_CONTRATOS_con_estado_enum"`);
        await queryRunner.query(`DROP TABLE "TBL_USUARIOS"`);
        await queryRunner.query(`DROP TYPE "public"."TBL_USUARIOS_usu_rol_enum"`);
    }

}
