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
  verifyPassword,
  generateJWT,
  toPublicUser,
} from '@packages/db'

export const authRoutes = async (app: FastifyInstance) => {
  // POST /auth/signup - Rate limited to 5 attempts per 15 minutes
  app.post('/auth/signup', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
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
      
      // Create user
      const user = await createUser(input)
      
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

  // POST /auth/login - Rate limited to 5 attempts per 15 minutes
  app.post('/auth/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
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
}

