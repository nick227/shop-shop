import type { User, Role } from '../generated/client/index.js';
export interface CreateUserInput {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    referredByAffiliateId?: string;
    referredByReferralCode?: string;
}
export interface UserPublic {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    phone: string | null;
    isCompany: boolean;
    companyName: string | null;
    createdAt: Date;
}
export declare const createUser: (input: CreateUserInput) => Promise<User>;
export declare const getUserByEmail: (email: string) => Promise<User | null>;
export declare const getUserById: (id: string) => Promise<User | null>;
export declare const verifyPassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateJWT: (user: User) => string;
export declare const verifyJWT: (token: string) => {
    userId: string;
    email: string;
    role: string;
};
export declare const toPublicUser: (user: User) => UserPublic;
//# sourceMappingURL=user.service.d.ts.map