/**
 * LoginForm Component - User login UI;
 * Migrated to Tailwind (removed CSS module)
 */
import type { FormEvent } from 'react';
import { useState } from 'react'
import { Button, Input, Alert } from '@shared/ui/primitives'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useFormValidation } from '@shared/hooks/useFormValidation'
import { loginFormSchema, type LoginFormData } from '@/schemas/ConsistentSchemas'

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoggingIn, loginError } = useAuth({ onSuccess })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { errors, validate } = useFormValidation(loginFormSchema)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate({ email, password })) return;
    void login({ email, password }).catch(() => {
      // useAuth owns the rendered login error.
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {loginError && (
        <Alert variant="error">{loginError}</Alert>
      )}

      <div className="space-y-4">
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          autoComplete="email"
          disabled={isLoggingIn}
        />

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          autoComplete="current-password"
          disabled={isLoggingIn}
        />

        <Button
          type="submit"
          isLoading={isLoggingIn}
          fullWidth
        >
          {isLoggingIn ? 'Logging in...' : 'Log In'}
        </Button>
      </div>
    </form>
  )
}

