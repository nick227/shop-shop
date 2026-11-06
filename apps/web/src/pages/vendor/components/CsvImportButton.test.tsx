import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CsvImportButton } from './CsvImportButton'
import { MENU_CSV_EXAMPLE } from './menuCsvExample'

const importItems = vi.fn()

vi.mock('../hooks/useCsvImport', () => ({
  useCsvImport: () => ({
    progress: { current: 0, total: 0, isImporting: false, isPaused: false, isCancelled: false, errors: [], importedItems: [] },
    importItems,
    pauseImport: vi.fn(),
    resumeImport: vi.fn(),
    cancelImport: vi.fn(),
    resetImport: vi.fn(),
  }),
}))

describe('CsvImportButton', () => {
  it('opens a dialog that shows the example CSV and accepts a csv file', async () => {
    const user = userEvent.setup()
    render(<CsvImportButton storeId="s1" />)

    await user.click(screen.getByRole('button', { name: 'Import' }))

    expect(screen.getByRole('dialog', { name: 'Import menu' })).toBeInTheDocument()
    expect(document.querySelector('pre')?.textContent).toBe(MENU_CSV_EXAMPLE)
    expect(screen.getByText(/title, description, and price are required/)).toBeInTheDocument()

    const input = screen.getByLabelText('Menu CSV file')
    const file = new File(['title,description,price\nHorchata,Cold,3.50\n'], 'menu.csv', { type: 'text/csv' })
    await user.upload(input, file)

    expect(importItems).toHaveBeenCalledWith(file)
  })

  it('rejects a file that is not a csv', async () => {
    const user = userEvent.setup()
    importItems.mockClear()
    render(<CsvImportButton storeId="s1" />)

    await user.click(screen.getByRole('button', { name: 'Import' }))
    const input = screen.getByLabelText('Menu CSV file')
    fireEvent.change(input, { target: { files: [new File(['nope'], 'menu.txt', { type: 'text/plain' })] } })

    expect(screen.getByText('Choose a .csv file')).toBeInTheDocument()
    expect(importItems).not.toHaveBeenCalled()
  })
})
