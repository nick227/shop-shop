import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../client.js'
import type { User, Role } from '../generated/client/index.js'

const BCRYPT_ROUNDS = 12

// ========================================
// User Service
// Pure functions for user management
// ========================================

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  phone?: string
}

export interface UserPublic {
  id: string
  email: string
  name: string | null
  role: Role
  phone: string | null
  isCompany: boolean
  companyName: string | null
  createdAt: Date
}

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
    }
  })
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email }
  })
}

export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id }
  })
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateJWT = (user: User): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn } as jwt.SignOptions
  )
}

export const verifyJWT = (token: string): { userId: string; email: string; role: string } => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }
  
  const decoded = jwt.verify(token, secret) as {
    userId: string
    email: string
    role: string
  }
  
  return decoded
}

export const toPublicUser = (user: User): UserPublic => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    isCompany: user.isCompany,
    companyName: user.companyName,
    createdAt: user.createdAt,
  }
}

