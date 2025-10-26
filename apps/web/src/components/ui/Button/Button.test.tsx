/**
 * Unit Tests: Button Component;
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick} disabled>Click me</Button>)
    await user.click(screen.getByText('Click me'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should render with variant="primary" by default', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = container.querySelector('button') as HTMLElement;
    expect(button.className).toContain('bg-primary')
    expect(button.className).toContain('text-primary-foreground')
  })

  it('should render with secondary variant', () => {
    const { container } = render(<Button variant="secondary">Click me</Button>)
    const button = container.querySelector('button') as HTMLElement;
    expect(button.className).toContain('bg-secondary')
    expect(button.className).toContain('text-secondary-foreground')
  })

  it('should render with danger variant', () => {
    const { container } = render(<Button variant="danger">Click me</Button>)
    const button = container.querySelector('button') as HTMLElement;
    expect(button.className).toContain('bg-destructive')
    expect(button.className).toContain('text-destructive-foreground')
  })

  it('should render with small size', () => {
    const { container } = render(<Button size="small">Click me</Button>)
    const button = container.querySelector('button') as HTMLElement;
    expect(button.className).toContain('h-9')
    expect(button.className).toContain('px-3')
  })

  it('should render with large size', () => {
    const { container } = render(<Button size="large">Click me</Button>)
    const button = container.querySelector('button') as HTMLElement;
    expect(button.className).toContain('h-11')
    expect(button.className).toContain('px-8')
  })

  it('should render as fullWidth', () => {
    const { container } = render(<Button fullWidth>Click me</Button>)
    const button = container.querySelector('button') as HTMLElement;
    expect(button.className).toContain('w-full')
  })

  it('should show loading state', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply custom className', () => {
    const { container } = render(<Button className="custom-class">Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should render as type="submit" when specified', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('should pass through HTML attributes', () => {
    render(<Button data-testid="custom-button" aria-label="Custom button">Click me</Button>)
    expect(screen.getByTestId('custom-button')).toBeInTheDocument()
    expect(screen.getByLabelText('Custom button')).toBeInTheDocument()
  })
})

