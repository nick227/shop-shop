import type { FastifyInstance } from 'fastify'
import {
  SignupInputSchema,
  LoginInputSchema,
  type SignupInput,
  type LoginInput,
} from '@packages/schemas'
import {
  createUser,
  getUserByEmail,
  getAffiliateByReferralCode,
  verifyPassword,
  generateJWT,
  toPublicUser,
} from '@packages/db'
import { rateLimits } from '../constants/rateLimits.js'
import { authenticate } from '../middleware/auth.js'

export const authRoutes = async (app: FastifyInstance) => {
  // POST /signup — brute-force / signup spam protection
  app.post('/signup', {
    config: {
      rateLimit: rateLimits.authSignup,
    },
  }, async (req, reply) => {
    try {
      const input = SignupInputSchema.parse(req.body) as SignupInput
      
      // Check if email already exists
      const existing = await getUserByEmail(input.email)
      if (existing) {
        return reply.code(409).send({
          error: 'Email already exists'
        })
      }

      let referredByAffiliateId: string | undefined
      let referredByReferralCode: string | undefined
      if (input.affiliateReferralCode) {
        const affiliate = await getAffiliateByReferralCode(input.affiliateReferralCode)
        if (!affiliate || affiliate.status !== 'ACTIVE') {
          return reply.code(400).send({ error: 'Invalid affiliate referral code' })
        }
        referredByAffiliateId = affiliate.id
        referredByReferralCode = affiliate.referralCode
      }
      
      // Create user
      const user = await createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        phone: input.phone,
        referredByAffiliateId,
        referredByReferralCode,
      })
      
      // Log successful signup
      req.log.info({
        event: 'user_signup',
        userId: user.id,
        email: user.email,
        ip: req.ip
      }, 'User signup successful')
      
      // Generate JWT
      const token = generateJWT(user)
      
      // Return public user data + token
      return reply.code(201).send({
        user: toPublicUser(user),
        token,
      })
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
          issues: (error as { issues: unknown[] }).issues,
        })
      }
      throw error
    }
  })

  // POST /login — brute-force protection
  app.post('/login', {
    config: {
      rateLimit: rateLimits.authLogin,
    },
  }, async (req, reply) => {
    try {
      const input = LoginInputSchema.parse(req.body) as LoginInput
      
      // Find user
      const user = await getUserByEmail(input.email)
      
      // Use dummy hash to prevent timing attacks
      // Always hash password even if user doesn't exist
      const dummyHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY0cZ5T8fBiHWla'
      const hashToCompare = user?.passwordHash || dummyHash
      
      // Always verify password (constant time)
      const isValid = await verifyPassword(input.password, hashToCompare)
      
      // Check both conditions together
      if (!user || !isValid) {
        // Log failed attempt
        req.log.warn({
          event: 'login_failed',
          email: input.email,
          ip: req.ip
        }, 'Login attempt failed')
        
        return reply.code(401).send({
          error: 'Invalid credentials'
        })
      }
      
      // Log successful login
      req.log.info({
        event: 'login_success',
        userId: user.id,
        email: user.email,
        ip: req.ip
      }, 'User login successful')
      
      // Generate JWT
      const token = generateJWT(user)
      
      // Return public user data + token
      return reply.code(200).send({
        user: toPublicUser(user),
        token,
      })
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return reply.code(400).send({
          error: 'Validation error',
        })
      }
      throw error
    }
  })

  // GET /me — get current user info
  app.get('/me', {
    preHandler: [authenticate],
  }, async (req, reply) => {
    try {
      // User is attached to request by authenticate middleware
      const user = (req as any).user
      
      if (!user) {
        return reply.code(401).send({
          error: 'User not found'
        })
      }

      return reply.code(200).send({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isCompany: user.isCompany,
        companyName: user.companyName,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })
    } catch (error) {
      req.log.error(error, 'Failed to get user info')
      return reply.code(500).send({
        error: 'Internal server error'
      })
    }
  })
}

