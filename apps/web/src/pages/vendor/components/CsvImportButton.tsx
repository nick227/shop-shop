import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { useCsvImport } from '../hooks/useCsvImport'
import { CsvImportDialog } from './CsvImportDialog'

interface CsvImportButtonProps {
  storeId: string
  className?: string
}

export function CsvImportButton({ storeId, className }: CsvImportButtonProps) {
  const [open, setOpen] = useState(false)
  const { progress, importItems, pauseImport, resumeImport, cancelImport, resetImport } = useCsvImport({
    storeId,
    batchSize: 5,
    delayBetweenBatches: 100,
  })

  const label = progress.isImporting ? `${progress.current} / ${progress.total}` : 'Import'

  return (
    <div className={className}>
      <Button variant="outline" size="small" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        {label}
      </Button>
      <CsvImportDialog
        open={open}
        onOpenChange={setOpen}
        progress={progress}
        onFile={importItems}
        onPause={pauseImport}
        onResume={resumeImport}
        onCancel={cancelImport}
        onReset={resetImport}
      />
    </div>
  )
}
