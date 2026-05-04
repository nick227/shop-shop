// @ts-nocheck
/**
 * Submit Button Component
 * Extracted submit button with micro-interactions
 */
import { MicroInteraction } from '../../Enhancements/MicroInteractions'
import { RippleEffect } from '../../Enhancements/MicroInteractions'
import { Button } from '../../Button'

interface SubmitButtonProps {
  disabled?: boolean
  isLoading?: boolean
  canSubmit: boolean
}

export function SubmitButton({ disabled, isLoading, canSubmit }: SubmitButtonProps) {
  return (
    <MicroInteraction variant="click" intensity="strong">
      <RippleEffect color="primary" duration={600}>
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={!canSubmit || disabled}
          isLoading={isLoading}
          className="h-12 text-base font-semibold"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </RippleEffect>
    </MicroInteraction>
  )
}
