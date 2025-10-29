/**
 * Tip Prompt Component - Shows after successful delivery;
 */
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Input, Card } from '@shared/ui/primitives'
import { styles } from '@shared/lib/tailwind-classes'

export interface TipPromptProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  storeName: string;
  onTipSubmit: (amount: number) => Promise<void>
  isProcessing?: boolean;
}

export function TipPrompt({
  isOpen,
  onClose,
  orderId: _orderId,
  storeName,
  onTipSubmit,
  isProcessing = false}: TipPromptProps) {
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>()

  const presetAmounts = [5, 10, 15, 20, 25]

  const handlePresetClick = (preset: number) => {
    setAmount(preset.toString())
    setCustomAmount('')
    setSelectedPreset(preset.toString())
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setAmount(value)
    setSelectedPreset(undefined)
  }

  const handleSubmit = async () => {
    const tipAmount = Number.parseFloat(amount)
    if (tipAmount > 0 && tipAmount <= 1000) {
      await onTipSubmit(tipAmount)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const isValidAmount = () => {
    const tipAmount = Number.parseFloat(amount)
    return tipAmount > 0 && tipAmount <= 1000;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tip Your Driver</DialogTitle>
        </DialogHeader>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Thank you for your order!</h2>
          <p>Your order from <strong>{storeName}</strong> has been delivered.</p>
          <p>Would you like to leave a tip for your driver?</p>
        </div>

        <Card className={styles.tipCard}>
          <div className={styles.presetAmounts}>
            <h3>Quick tip amounts:</h3>
            <div className={styles.presetGrid}>
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={selectedPreset === preset.toString() ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => handlePresetClick(preset)}
                  disabled={isProcessing}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.customAmount}>
            <h3>Or enter a custom amount:</h3>
            <div className={styles.inputGroup}>
              <span className={styles.dollarSign}>$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                min="0"
                max="1000"
                step="0.01"
                disabled={isProcessing}
                className={styles.amountInput}
              />
            </div>
            <p className={styles.helpText}>
              Tips are optional and go directly to your driver
            </p>
          </div>
        </Card>

        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isProcessing}
          >
            Skip Tip
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValidAmount() || isProcessing}
            isLoading={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Tip $' + (amount || '0.00')}
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
