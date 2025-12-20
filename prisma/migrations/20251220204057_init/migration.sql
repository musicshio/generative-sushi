-- CreateTable
CREATE TABLE "SharedSushi" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedSushi_pkey" PRIMARY KEY ("id")
);
