-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_title" TEXT NOT NULL,
    "service_price_label" TEXT NOT NULL,
    "extras" TEXT[],
    "pet_name" TEXT NOT NULL,
    "pet_breed" TEXT NOT NULL,
    "pet_size" TEXT NOT NULL,
    "pet_notes" TEXT,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" UUID NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservations_idempotency_key_key" ON "reservations"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_date_time_key" ON "reservations"("date", "time");
