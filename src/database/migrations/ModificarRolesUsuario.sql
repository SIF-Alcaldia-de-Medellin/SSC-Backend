-- Primero, asegurarse de que no hay usuarios con rol CONTRATISTA
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "SSC"."TBL_USUARIOS" WHERE "USU_ROL" = 'CONTRATISTA') THEN
        RAISE EXCEPTION 'No se puede proceder con la migración: Existen usuarios con rol CONTRATISTA';
    END IF;
END $$;

-- Crear un tipo ENUM temporal con los nuevos roles
CREATE TYPE "SSC"."USUARIO_ROL_NEW" AS ENUM ('ADMIN', 'SUPERVISOR');

-- Actualizar la columna USU_ROL para usar el nuevo tipo ENUM
ALTER TABLE "SSC"."TBL_USUARIOS" 
    ALTER COLUMN "USU_ROL" TYPE "SSC"."USUARIO_ROL_NEW" 
    USING ("USU_ROL"::text::"SSC"."USUARIO_ROL_NEW");

-- Eliminar el tipo ENUM antiguo
DROP TYPE "SSC"."USUARIO_ROL";

-- Renombrar el nuevo tipo ENUM
ALTER TYPE "SSC"."USUARIO_ROL_NEW" RENAME TO "USUARIO_ROL";

-- Establecer el valor por defecto para nuevos usuarios
ALTER TABLE "SSC"."TBL_USUARIOS" 
    ALTER COLUMN "USU_ROL" SET DEFAULT 'SUPERVISOR';

-- Agregar un comentario a la columna para documentar los roles disponibles
COMMENT ON COLUMN "SSC"."TBL_USUARIOS"."USU_ROL" IS 'Roles disponibles: ADMIN (acceso total), SUPERVISOR (gestión de contratos asignados)';

-- Crear una vista para facilitar la auditoría de roles
CREATE OR REPLACE VIEW "SSC"."VW_USUARIOS_ROLES" AS
SELECT 
    "USU_CEDULA" as cedula,
    "USU_NOMBRE" as nombre,
    "USU_EMAIL" as email,
    "USU_ROL" as rol,
    "USU_CREATED_AT" as fecha_creacion
FROM "SSC"."TBL_USUARIOS"
ORDER BY "USU_ROL", "USU_NOMBRE";

-- Agregar un índice para mejorar las búsquedas por rol
CREATE INDEX IF NOT EXISTS "idx_usuarios_rol" ON "SSC"."TBL_USUARIOS"("USU_ROL"); 