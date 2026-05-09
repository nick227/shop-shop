import { useRef, useState } from 'react'
import { Button } from '@shared/ui/primitives'
import { Upload, Pause, Play, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { useCsvImport } from '../hooks/useCsvImport'
import type { UseCsvImportOptions } from '../hooks/useCsvImport'

interface CsvImportButtonProps {
  storeId: string
  className?: string
}

export function CsvImportButton({ storeId, className }: CsvImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showErrors, setShowErrors] = useState(false)
  
  const importOptions: UseCsvImportOptions = {
    storeId,
    batchSize: 5,
    delayBetweenBatches: 100
  }

  const { progress, importItems, pauseImport, resumeImport, cancelImport, resetImport } = useCsvImport(importOptions)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    await importItems(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReset = () => {
    resetImport()
    setShowErrors(false)
  }

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0
    return Math.round((progress.current / progress.total) * 100)
  }

  const getButtonText = () => {
    if (progress.isImporting) {
      if (progress.isPaused) return 'Resume'
      if (progress.isCancelled) return 'Cancelled'
      return `${progress.current} / ${progress.total}`
    }
    return 'Import CSV'
  }

  const getButtonIcon = () => {
    if (progress.isImporting) {
      if (progress.isPaused) return <Play className="w-4 h-4" />
      if (progress.isCancelled) return <X className="w-4 h-4" />
      return <Pause className="w-4 h-4" />
    }
    return <Upload className="w-4 h-4" />
  }

  const getButtonVariant = () => {
    if (progress.isImporting && !progress.isPaused && !progress.isCancelled) {
      return 'secondary' as const
    }
    return 'outline' as const
  }

  const handleButtonClick = () => {
    if (progress.isImporting) {
      if (progress.isPaused) {
        resumeImport()
      } else if (!progress.isCancelled) {
        pauseImport()
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2 items-center">
        <Button
          variant={getButtonVariant()}
          size="small"
          onClick={handleButtonClick}
          disabled={progress.isCancelled}
          className="relative"
          title="Fields: title, description, price, category, type, subtype, tags (semicolon separated), imageUrl, isActive, isSoldOut, stockQty"
        >
          {getButtonIcon()}
          <span className="ml-2">{getButtonText()}</span>
          
          {progress.isImporting && !progress.isPaused && !progress.isCancelled && (
            <div className="absolute inset-0 bg-primary/10 rounded-md">
              <div 
                className="h-full bg-primary/20 rounded-md transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          )}
        </Button>

        {progress.isImporting && (
          <Button
            variant="ghost"
            size="small"
            onClick={cancelImport}
            className="text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {!progress.isImporting && (progress.current > 0 || progress.errors.length > 0) && (
          <Button
            variant="ghost"
            size="small"
            onClick={handleReset}
          >
            Reset
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Progress Details */}
      {progress.isImporting && (
        <div className="mt-2 text-sm text-muted-foreground">
          {progress.isPaused && (
            <div className="flex items-center gap-2 text-warning">
              <Pause className="w-3 h-3" />
              Import paused
            </div>
          )}
          {progress.isCancelled && (
            <div className="flex items-center gap-2 text-destructive">
              <X className="w-3 h-3" />
              Import cancelled
            </div>
          )}
          {!progress.isPaused && !progress.isCancelled && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Importing {progress.current} of {progress.total} items...
            </div>
          )}
        </div>
      )}

      {/* Success/Error Summary */}
      {!progress.isImporting && (progress.current > 0 || progress.errors.length > 0) && (
        <div className="mt-2 text-sm">
          <div className="flex items-center gap-4">
            {progress.current > 0 && (
              <div className="flex items-center gap-1 text-success">
                <CheckCircle className="w-3 h-3" />
                {progress.current} imported
              </div>
            )}
            {progress.errors.length > 0 && (
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="flex items-center gap-1 text-destructive hover:underline"
              >
                <AlertCircle className="w-3 h-3" />
                {progress.errors.length} errors
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Details */}
      {showErrors && progress.errors.length > 0 && (
        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="text-sm font-medium text-destructive mb-1">Import Errors:</div>
          <div className="space-y-1">
            {progress.errors.map((error, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                Row {error.row}: {error.error}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
