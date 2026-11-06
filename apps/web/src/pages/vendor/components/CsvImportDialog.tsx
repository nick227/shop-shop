import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Pause, Play, Upload, X } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/primitives/ui/Dialog'
import type { CsvImportProgress } from '../hooks/useCsvImport'
import { MENU_CSV_EXAMPLE, MENU_CSV_FILENAME } from './menuCsvExample'

interface CsvImportDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly progress: CsvImportProgress
  readonly onFile: (file: File) => Promise<void>
  readonly onPause: () => void
  readonly onResume: () => void
  readonly onCancel: () => void
  readonly onReset: () => void
}

function downloadExample() {
  const url = URL.createObjectURL(new Blob([MENU_CSV_EXAMPLE], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = MENU_CSV_FILENAME
  link.click()
  URL.revokeObjectURL(url)
}

export function CsvImportDialog({
  open,
  onOpenChange,
  progress,
  onFile,
  onPause,
  onResume,
  onCancel,
  onReset,
}: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const percent = progress.total === 0 ? 0 : Math.round((progress.current / progress.total) * 100)

  const chooseFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Choose a .csv file')
      return
    }
    setFileError(null)
    setShowErrors(false)
    await onFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import menu</DialogTitle>
          <DialogDescription>
            Each row is one item. title, description, and price are required. category is the section name —
            a section that does not exist yet is created. Separate tags with semicolons. Price looks like 4.00.
          </DialogDescription>
        </DialogHeader>

        <pre className="max-h-40 overflow-auto whitespace-pre rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">{MENU_CSV_EXAMPLE}</pre>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="small" onClick={downloadExample}>
            Download example
          </Button>
          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={progress.isImporting}
          >
            <Upload className="h-4 w-4" />
            Choose CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            aria-label="Menu CSV file"
            onChange={(event) => void chooseFile(event.target.files?.[0])}
          />
        </div>
        {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}

        {progress.isImporting ? (
          <div className="space-y-2 text-sm">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {progress.isPaused ? 'Paused' : `Importing ${progress.current} of ${progress.total}`}
              </span>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="small" onClick={progress.isPaused ? onResume : onPause}>
                  {progress.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {progress.isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button type="button" variant="ghost" size="small" onClick={onCancel} className="text-destructive">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {!progress.isImporting && (progress.current > 0 || progress.errors.length > 0) ? (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              {progress.current > 0 ? (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle className="h-3 w-3" />
                  {progress.current} imported
                </span>
              ) : null}
              {progress.errors.length > 0 ? (
                <button type="button" className="flex items-center gap-1 text-destructive hover:underline" onClick={() => setShowErrors((v) => !v)}>
                  <AlertCircle className="h-3 w-3" />
                  {progress.errors.length} errors
                </button>
              ) : null}
              <Button type="button" variant="ghost" size="small" onClick={onReset}>
                Reset
              </Button>
            </div>
            {showErrors
              ? progress.errors.map((error) => (
                  <p key={`${error.row}-${error.error}`} className="text-xs text-muted-foreground">
                    {error.row > 0 ? `Row ${error.row}: ` : ''}
                    {error.error}
                  </p>
                ))
              : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
