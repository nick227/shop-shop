import { prisma } from '../client.js';
export async function createVerification(input) {
    return prisma.vendorVerification.create({
        data: {
            userId: input.userId,
            businessName: input.businessName,
            businessType: input.businessType,
            taxId: input.taxId,
            documentsJson: input.documentsJson,
            status: 'PENDING',
        },
    });
}
export async function getVerificationByUserId(userId) {
    return prisma.vendorVerification.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
}
export async function getVerification(verificationId) {
    return prisma.vendorVerification.findUnique({
        where: { id: verificationId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
}
export async function updateVerification(verificationId, input) {
    return prisma.vendorVerification.update({
        where: { id: verificationId },
        data: input,
    });
}
export async function submitVerification(verificationId) {
    return prisma.vendorVerification.update({
        where: { id: verificationId },
        data: {
            status: 'SUBMITTED',
            submittedAt: new Date(),
        },
    });
}
export async function reviewVerification(verificationId, input) {
    const data = {
        status: input.status,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes,
    };
    if (input.status === 'APPROVED') {
        data.approvedAt = new Date();
        if (input.expiresAt) {
            data.expiresAt = input.expiresAt;
        }
        if (input.stripeAccountId) {
            data.stripeAccountId = input.stripeAccountId;
        }
    }
    else if (input.status === 'REJECTED') {
        data.rejectionReason = input.rejectionReason;
    }
    return prisma.vendorVerification.update({
        where: { id: verificationId },
        data,
    });
}
export async function listVerifications(options) {
    const where = options?.status ? { status: options.status } : {};
    const [verifications, total] = await Promise.all([
        prisma.vendorVerification.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        }),
        prisma.vendorVerification.count({ where }),
    ]);
    return { verifications, total };
}
export async function checkVerificationExpiry(verificationId) {
    const verification = await prisma.vendorVerification.findUnique({
        where: { id: verificationId },
    });
    if (!verification || verification.status !== 'APPROVED') {
        return verification;
    }
    if (verification.expiresAt && verification.expiresAt < new Date()) {
        return prisma.vendorVerification.update({
            where: { id: verificationId },
            data: { status: 'EXPIRED' },
        });
    }
    return verification;
}
export async function isVendorVerified(userId) {
    const verification = await prisma.vendorVerification.findUnique({
        where: { userId },
    });
    if (!verification)
        return false;
    if (verification.status !== 'APPROVED')
        return false;
    if (verification.expiresAt && verification.expiresAt < new Date()) {
        await prisma.vendorVerification.update({
            where: { id: verification.id },
            data: { status: 'EXPIRED' },
        });
        return false;
    }
    return true;
}
export async function getVerificationStats() {
    const [pending, submitted, underReview, approved, rejected, expired] = await Promise.all([
        prisma.vendorVerification.count({ where: { status: 'PENDING' } }),
        prisma.vendorVerification.count({ where: { status: 'SUBMITTED' } }),
        prisma.vendorVerification.count({ where: { status: 'UNDER_REVIEW' } }),
        prisma.vendorVerification.count({ where: { status: 'APPROVED' } }),
        prisma.vendorVerification.count({ where: { status: 'REJECTED' } }),
        prisma.vendorVerification.count({ where: { status: 'EXPIRED' } }),
    ]);
    return {
        pending,
        submitted,
        underReview,
        approved,
        rejected,
        expired,
        total: pending + submitted + underReview + approved + rejected + expired,
    };
}
