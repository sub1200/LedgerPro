import { prisma } from '../prisma';

export async function createJournalEntry(input, userId, companyId) {
  const totalDebit = input.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = input.lines.reduce((s, l) => s + Number(l.credit || 0), 0);

  if (totalDebit !== totalCredit) {
    throw new Error('Journal entry must balance');
  }

  return prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        companyId,
        entryNo: input.entryNo,
        entryDate: new Date(input.entryDate),
        description: input.description,
        status: 'DRAFT',
        createdById: userId,
        lines: {
          create: input.lines.map((line) => ({
            accountId: line.accountId,
            memo: line.memo,
            debit: line.debit || 0,
            credit: line.credit || 0,
            currencyCode: line.currencyCode,
            fxRate: line.fxRate,
            baseDebit: line.baseDebit || 0,
            baseCredit: line.baseCredit || 0,
          })),
        },
      },
      include: { lines: true },
    });

    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'CREATE',
        entityType: 'JournalEntry',
        entityId: entry.id,
        after: entry,
      },
    });

    return entry;
  });
}