/**
 * DualAuthWidget Component - Combined Login/Register UI
 * Minimal, professional design with clear visual distinction between modes
 */
import type { FormEvent } from 'react';
import { useState } from 'react'
import { Button, Input, Alert } from '@shared/ui/primitives'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useFormValidation } from '@shared/hooks/useFormValidation'
import { loginFormSchema, signupFormSchema, type LoginFormData, type SignupFormData } from '@/schemas/ConsistentSchemas'

export interface DualAuthWidgetProps {
  onSuccess?: () => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'register'

export function DualAuthWidget({ onSuccess, initialMode = 'login' }: DualAuthWidgetProps) {
  const { login, signup, isLoggingIn, isSigningUp, loginError, signupError } = useAuth({ onSuccess })
  const [mode, setMode] = useState<AuthMode>(initialMode)
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Register form state  
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  
  const loginValidate = useFormValidation(loginFormSchema)
  const registerValidate = useFormValidation(signupFormSchema)

  const handleLogin = (e: FormEvent) => {
    e.preventDefault()
    if (!loginValidate.validate({ email: loginEmail, password: loginPassword })) return;
    
    void login({ email: loginEmail, password: loginPassword }).catch(() => {
      // useAuth owns the rendered login error.
    })
  }

  const handleRegister = (e: FormEvent) => {
    e.preventDefault()
    if (!registerValidate.validate({ email: registerEmail, password: registerPassword, name: registerName })) return;
    
    void signup({ email: registerEmail, password: registerPassword, name: registerName } as any).catch(() => {
      // useAuth owns the rendered signup error.
    })
  }

  const isLoading = isLoggingIn || isSigningUp
  const currentError = mode === 'login' ? loginError : signupError

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            mode === 'login'
              ? 'bg-primary text-primary-foreground border-b-2 border-primary'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            mode === 'register'
              ? 'bg-primary text-primary-foreground border-b-2 border-primary'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Register
        </button>
      </div>

      <div className="p-6">
        {currentError && (
          <Alert variant="error" className="mb-4">
            {currentError}
          </Alert>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4" name="login" autoComplete="on">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Welcome Back</h2>
              <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
            </div>

            <Input
              type="email"
              label="Email Address"
              name="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              error={loginValidate.errors.email}
              required
              autoComplete="email"
              disabled={isLoading}
              placeholder="you@example.com"
            />

            <Input
              type="password"
              label="Password"
              name="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              error={loginValidate.errors.password}
              required
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              isLoading={isLoggingIn}
              fullWidth
              size="large"
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4" name="register" autoComplete="on">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create Account</h2>
              <p className="text-sm text-gray-600 mt-1">Join us today</p>
            </div>

            <Input
              type="text"
              label="Full Name"
              name="name"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              error={registerValidate.errors.name}
              required
              autoComplete="name"
              disabled={isLoading}
              placeholder="John Doe"
            />

            <Input
              type="email"
              label="Email Address"
              name="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              error={registerValidate.errors.email}
              required
              autoComplete="email"
              disabled={isLoading}
              placeholder="you@example.com"
            />

            <Input
              type="password"
              label="Password"
              name="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              error={registerValidate.errors.password}
              required
              autoComplete="new-password"
              disabled={isLoading}
              placeholder="Create a strong password"
            />

            <Button
              type="submit"
              isLoading={isSigningUp}
              fullWidth
              size="large"
            >
              {isSigningUp ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By creating an account, you'll be automatically signed in
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
