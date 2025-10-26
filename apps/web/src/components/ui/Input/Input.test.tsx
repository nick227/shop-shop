/**
 * Unit Tests: Input Component;
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('should render label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('should render without label', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should show error message', () => {
    render(<Input label="Email" error="Invalid email" />)
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('should show helper text', () => {
    render(<Input label="Email" helperText="Enter your email address" />)
    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('should call onChange when value changes', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    
    render(<Input label="Email" onChange={handleChange} />)
    await user.type(screen.getByLabelText('Email'), 'test')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('should accept value prop', () => {
    render(<Input label="Email" value="test@example.com" onChange={() => {}} />)
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('should render with error styling', () => {
    const { container } = render(<Input label="Email" error="Invalid" />)
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toContain('border-destructive')
  })

  it('should be disabled', () => {
    const { container } = render(<Input label="Email" disabled />)
    const input = container.querySelector('input')
    expect(input).toBeDisabled()
  })

  it('should render as required', () => {
    const { container } = render(<Input label="Email" required />)
    const input = container.querySelector('input')
    expect(input).toBeRequired()
  })

  it('should accept type prop', () => {
    render(<Input label="Password" type="password" />)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('should generate unique ID when not provided', () => {
    const { container } = render(<Input label="Email" />)
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('id')
  })

  it('should use provided ID', () => {
    render(<Input label="Email" id="custom-id" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'custom-id')
  })

  it('should link label to input with aria-describedby for errors', () => {
    render(<Input label="Email" error="Invalid email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('should link label to input with aria-describedby for helper text', () => {
    render(<Input label="Email" helperText="Enter email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('should apply custom className to input', () => {
    const { container } = render(<Input label="Email" className="custom-class" />)
    const input = container.querySelector('input') as HTMLElement;
    expect(input.className).toContain('custom-class')
  })

  it('should pass through HTML attributes', () => {
    render(<Input label="Email" placeholder="Enter email" autoComplete="email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('placeholder', 'Enter email')
    expect(input).toHaveAttribute('autocomplete', 'email')
  })
})

