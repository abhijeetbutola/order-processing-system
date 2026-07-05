-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "analyticsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "invoiceGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "warehouseNotifiedAt" TIMESTAMP(3);
