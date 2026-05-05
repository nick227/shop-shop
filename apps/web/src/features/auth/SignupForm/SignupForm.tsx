/**
 * SignupForm Component - User registration UI
 * Migrated to Tailwind (removed CSS module)
 */
import type { FormEvent } from 'react';
import { useState } from 'react'
import { Button, Input, Alert } from '@shared/ui/primitives'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useFormValidation } from '@shared/hooks/useFormValidation'
import { signupFormSchema, type SignupFormData } from '@/schemas/ConsistentSchemas'

export interface SignupFormProps {
  onSuccess?: () => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { signup, isSigningUp, signupError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const { errors, validate } = useFormValidation(signupFormSchema)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate({ email, password, name })) return

    signup({ email, password, firstName: name?.split(' ')[0], lastName: name?.split(' ').slice(1).join(' ') } as any)
  }

  return (
    <form onSubmit={handleSubmit}>
      {signupError && (
        <Alert variant="error">{signupError}</Alert>
      )}

      <div className="space-y-4">
        <Input
          type="text"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          disabled={isSigningUp}
          helperText="Optional"
        />

        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          autoComplete="email"
          disabled={isSigningUp}
        />

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          autoComplete="new-password"
          disabled={isSigningUp}
          helperText="At least 8 characters"
        />

        <Button
          type="submit"
          isLoading={isSigningUp}
          fullWidth
        >
          {isSigningUp ? 'Creating account...' : 'Sign Up'}
        </Button>
      </div>
    </form>
  )
}

