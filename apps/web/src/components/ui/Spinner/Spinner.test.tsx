/**
 * Unit Tests: Spinner Component;
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('should render', () => {
    const { container } = render(<Spinner />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should have role="status"', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should have aria-label', () => {
    render(<Spinner />)
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
  })

  it('should render with small size', () => {
    const { container } = render(<Spinner size="small" />)
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('small')
  })

  it('should render with large size', () => {
    const { container } = render(<Spinner size="large" />)
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('large')
  })

  it('should render with medium size by default', () => {
    const { container } = render(<Spinner />)
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain('medium')
  })

  it('should apply custom className', () => {
    const { container } = render(<Spinner className="custom-class" />)
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('custom-class')
  })
})

