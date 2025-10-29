/**
 * Unit Tests: Card Component;
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Card onClick={handleClick}>Card content</Card>)
    await user.click(screen.getByText('Card content'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should have clickable styling when onClick provided', () => {
    const { container } = render(<Card onClick={() => {}}>Content</Card>)
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('clickable')
  })

  it('should not have clickable styling without onClick', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('clickable')
  })

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class')
  })

  it('should render as div when no onClick', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild;
    expect(card?.nodeName).toBe('DIV')
  })

  it('should render as button when onClick provided', () => {
    const { container } = render(<Card onClick={() => {}}>Content</Card>)
    const card = container.firstChild;
    expect(card?.nodeName).toBe('BUTTON')
  })
})

