import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../client.js';
const BCRYPT_ROUNDS = 12;
export const createUser = async (input) => {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    return prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            name: input.name,
            phone: input.phone,
            ...(input.referredByAffiliateId
                ? {
                    referredByAffiliateId: input.referredByAffiliateId,
                    referredByReferralCode: input.referredByReferralCode,
                }
                : {}),
        }
    });
};
export const getUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email }
    });
};
export const getUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id }
    });
};
export const verifyPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
export const generateJWT = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET not configured');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
    }, secret, { expiresIn });
};
export const verifyJWT = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET not configured');
    }
    const decoded = jwt.verify(token, secret);
    return decoded;
};
export const toPublicUser = (user) => {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isCompany: user.isCompany,
        companyName: user.companyName,
        createdAt: user.createdAt,
    };
};
