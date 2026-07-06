import { PrismaClient } from '@prisma/client';

export async function checkOrderCompletion(prisma: PrismaClient, orderId: string, workerName: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { emailSentAt: true, invoiceGeneratedAt: true, analyticsUpdatedAt: true, warehouseNotifiedAt: true },
  });
  if (order?.emailSentAt && order?.invoiceGeneratedAt && order?.analyticsUpdatedAt && order?.warehouseNotifiedAt) {
    await prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETED' } });
    console.log(`[${workerName}] Order ${orderId} fully completed`);
  }
}
