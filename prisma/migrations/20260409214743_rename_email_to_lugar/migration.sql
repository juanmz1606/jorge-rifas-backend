ALTER TABLE "Customer" RENAME COLUMN "email" TO "lugar";
UPDATE "Customer" SET "lugar" = 'Sin especificar' WHERE "lugar" IS NULL;
ALTER TABLE "Customer" ALTER COLUMN "lugar" SET NOT NULL;