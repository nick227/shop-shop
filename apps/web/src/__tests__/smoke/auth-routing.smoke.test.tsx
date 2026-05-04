import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/router/utils'
import { useAuthStore } from '@/stores/authStore'

function Login() {
  return <div>Login</div>
}

function Secret() {
  return <div>Secret</div>
}

describe('smoke: auth + routing', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: undefined, token: undefined, isAuthenticated: false })
  })

  it('redirects unauthenticated users to /login and renders login screen', async () => {
    render(
      <MemoryRouter initialEntries={['/secret?x=1']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute>
                <Secret />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('renders protected content when authenticated', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 't',
      user: { id: 'u1', email: 'a@b.com', role: 'USER' } as any,
    })

    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute>
                <Secret />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Secret')).toBeInTheDocument()
  })
})

