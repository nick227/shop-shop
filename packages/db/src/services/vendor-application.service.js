import { prisma } from '../client.js';
export async function createVendorApplication(input) {
    return prisma.vendorVerification.create({
        data: {
            userId: input.userId,
            businessName: input.businessName,
            businessType: input.businessType,
            taxId: 'PENDING',
            // For MVP, we'll store contact info in review notes
            reviewNotes: JSON.stringify({
                contactName: input.contactName,
                email: input.email,
                phone: input.phone,
                description: input.description,
            }),
            status: 'PENDING',
        },
    });
}
export async function getVendorApplicationByUserId(userId) {
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
export async function updateVendorApplication(applicationId, input) {
    const existing = await prisma.vendorVerification.findUnique({
        where: { id: applicationId },
    });
    if (!existing) {
        throw new Error('Application not found');
    }
    // Parse existing review notes to update
    let reviewNotes = {};
    try {
        reviewNotes = existing.reviewNotes ? JSON.parse(existing.reviewNotes) : {};
    }
    catch {
        reviewNotes = {};
    }
    const updatedNotes = {
        ...reviewNotes,
        ...input,
    };
    return prisma.vendorVerification.update({
        where: { id: applicationId },
        data: {
            ...input,
            reviewNotes: JSON.stringify(updatedNotes),
        },
    });
}
export async function listVendorApplications(options) {
    const where = options?.status ? { status: options.status } : {};
    const [applications, total] = await Promise.all([
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
    return { applications, total };
}
export async function approveVendorApplication(applicationId) {
    // Get application first
    const application = await prisma.vendorVerification.findUnique({
        where: { id: applicationId },
        include: { user: true },
    });
    if (!application) {
        throw new Error('Application not found');
    }
    // Transactional update: both application status and user role
    const [updatedApplication] = await prisma.$transaction([
        prisma.vendorVerification.update({
            where: { id: applicationId },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
        }),
        prisma.user.update({
            where: { id: application.userId },
            data: { role: 'VENDOR' },
        }),
    ]);
    return updatedApplication;
}
export async function rejectVendorApplication(applicationId, input) {
    return prisma.vendorVerification.update({
        where: { id: applicationId },
        data: {
            status: 'REJECTED',
            rejectionReason: input.rejectionReason,
            reviewedAt: new Date(),
        },
    });
}
