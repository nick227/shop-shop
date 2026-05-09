import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import type { CreateItemInput } from '@api/types'

export interface CsvImportProgress {
  current: number
  total: number
  isImporting: boolean
  isPaused: boolean
  isCancelled: boolean
  errors: { row: number; error: string }[]
  importedItems: CreateItemInput[]
}

export interface ParsedCsvRow {
  title: string
  description: string
  price: string
  category?: string
  type?: string
  subtype?: string
  tags?: string[]
  imageUrl?: string
  isActive?: boolean
  isSoldOut?: boolean
  sortIndex?: number
  stockQty?: string | undefined
  isVegan?: boolean
  isVegetarian?: boolean
  isGlutenFree?: boolean
  isDairyFree?: boolean
  spicyLevel?: number
}

export interface UseCsvImportOptions {
  storeId: string
  batchSize?: number
  delayBetweenBatches?: number
}

export function useCsvImport({ 
  storeId, 
  batchSize = 5,
  delayBetweenBatches = 100 
}: UseCsvImportOptions) {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<CsvImportProgress>({
    current: 0,
    total: 0,
    isImporting: false,
    isPaused: false,
    isCancelled: false,
    errors: [],
    importedItems: []
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)

  const parseCSV = useCallback((text: string): ParsedCsvRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows: ParsedCsvRow[] = []

    for (let i = 1; i < lines.length; i++) {
      // Robust CSV parser that handles quoted fields
      const values: string[] = []
      let currentValue = ''
      let inQuotes = false
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim())
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      
      // Push the last value
      values.push(currentValue.trim())
      
      const row: any = {}

      for (const [index, header] of headers.entries()) {
        const value = values[index]?.trim() || ''
        
        switch (header) {
          case 'title':
            row.title = value
            break
          case 'description':
            row.description = value
            break
          case 'price':
            row.price = value
            break
          case 'category':
            row.category = value || undefined
            break
          case 'type':
            row.type = value || undefined
            break
          case 'subtype':
            row.subtype = value || undefined
            break
          case 'tags':
            row.tags = value ? value.split(';').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
            break
          case 'imageurl':
          case 'image_url':
          case 'image':
            row.imageUrl = value || undefined
            break
          case 'isactive':
          case 'is_active':
            row.isActive = value.toLowerCase() === 'true' || value === '1'
            break
          case 'issoldout':
          case 'is_sold_out':
            row.isSoldOut = value.toLowerCase() === 'true' || value === '1'
            break
          case 'sortindex':
          case 'sort_index':
            row.sortIndex = parseInt(value) || undefined
            break
          case 'stockqty':
          case 'stock_qty':
            row.stockQty = value || undefined
            break
          case 'isvegan':
          case 'is_vegan':
            row.isVegan = value.toLowerCase() === 'true' || value === '1'
            break
          case 'isvegetarian':
          case 'is_vegetarian':
            row.isVegetarian = value.toLowerCase() === 'true' || value === '1'
            break
          case 'isglutenfree':
          case 'is_gluten_free':
            row.isGlutenFree = value.toLowerCase() === 'true' || value === '1'
            break
          case 'isdairyfree':
          case 'is_dairy_free':
            row.isDairyFree = value.toLowerCase() === 'true' || value === '1'
            break
          case 'spicylevel':
          case 'spicy_level':
            row.spicyLevel = parseInt(value) || undefined
            break
        }
      }

      // Validate required fields
      if (!row.title || !row.description || !row.price) {
        throw new Error(`Row ${i + 1}: Missing required fields (title, description, price)`)
      }

      // Validate price format
      if (!/^\d+(\.\d{1,2})?$/.test(row.price)) {
        throw new Error(`Row ${i + 1}: Invalid price format "${row.price}". Use format like "19.99"`)
      }

      rows.push(row as ParsedCsvRow)
    }

    return rows
  }, [])

  const createItem = useCallback(async (itemData: ParsedCsvRow): Promise<CreateItemInput> => {
    // Build optionsJson with additional fields
    const optionsJson: Record<string, any> = {}
    
    if (itemData.category) optionsJson.category = itemData.category
    if (itemData.type) optionsJson.type = itemData.type
    if (itemData.subtype) optionsJson.subtype = itemData.subtype
    if (itemData.imageUrl) optionsJson.imageUrl = itemData.imageUrl
    
    const createItemRequest: any = {
      storeId,
      title: itemData.title,
      description: itemData.description,
      price: itemData.price,
      isActive: itemData.isActive ?? true,
      isSoldOut: itemData.isSoldOut ?? false,
      sortIndex: itemData.sortIndex,
      stockQty: itemData.stockQty || undefined,
      tags: itemData.tags || [],
      optionsJson: Object.keys(optionsJson).length > 0 ? optionsJson : undefined,
      isVegan: itemData.isVegan,
      isVegetarian: itemData.isVegetarian,
      isGlutenFree: itemData.isGlutenFree,
      isDairyFree: itemData.isDairyFree,
      spicyLevel: itemData.spicyLevel
    }
    
    return createItemRequest
  }, [storeId])

  const importItems = useCallback(async (file: File) => {
    try {
      // Reset state
      setProgress({
        current: 0,
        total: 0,
        isImporting: true,
        isPaused: false,
        isCancelled: false,
        errors: [],
        importedItems: []
      })

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      // Read and parse CSV
      const text = await file.text()
      const parsedRows = parseCSV(text)
      
      setProgress(prev => ({ ...prev, total: parsedRows.length }))

      // Process items in batches
      for (let i = 0; i < parsedRows.length; i += batchSize) {
        // Check if cancelled
        if (abortControllerRef.current?.signal.aborted) {
          setProgress(prev => ({ ...prev, isCancelled: true, isImporting: false }))
          return
        }

        // Check if paused
        while (progress.isPaused && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        const batch = parsedRows.slice(i, i + batchSize)
        const batchPromises = batch.map(async (row, batchIndex) => {
          const globalIndex = i + batchIndex
          
          try {
            const itemData = await createItem(row)
            await apiClient.items().createItem({
              createItemRequest: itemData as any
            })
            
            setProgress(prev => ({
              ...prev,
              current: globalIndex + 1,
              importedItems: [...prev.importedItems, itemData]
            }))
            
            return { success: true, index: globalIndex }
          } catch (error) {
            const appError = await handleApiError(error)
            setProgress(prev => ({
              ...prev,
              errors: [...prev.errors, { row: globalIndex + 2, error: appError.message }]
            }))
            return { success: false, index: globalIndex, error: appError.message }
          }
        })

        await Promise.all(batchPromises)

        // Add delay between batches
        if (i + batchSize < parsedRows.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
        }
      }

      // Refresh the items list
      await queryClient.invalidateQueries({ queryKey: ['store-items', storeId] })

      setProgress(prev => ({ ...prev, isImporting: false }))

      const successCount = parsedRows.length - progress.errors.length
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} items!`)
      }
      
      if (progress.errors.length > 0) {
        toast.error(`${progress.errors.length} items failed to import`)
      }

    } catch (error) {
      setProgress(prev => ({ ...prev, isImporting: false, errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }] }))
      toast.error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [parseCSV, createItem, batchSize, delayBetweenBatches, progress.errors.length, progress.isPaused, queryClient, storeId])

  const pauseImport = useCallback(() => {
    setProgress(prev => ({ ...prev, isPaused: true }))
  }, [])

  const resumeImport = useCallback(() => {
    setProgress(prev => ({ ...prev, isPaused: false }))
  }, [])

  const cancelImport = useCallback(() => {
    abortControllerRef.current?.abort()
    setProgress(prev => ({ ...prev, isCancelled: true, isImporting: false }))
    toast.warning('Import cancelled')
  }, [])

  const resetImport = useCallback(() => {
    setProgress({
      current: 0,
      total: 0,
      isImporting: false,
      isPaused: false,
      isCancelled: false,
      errors: [],
      importedItems: []
    })
  }, [])

  return {
    progress,
    importItems,
    pauseImport,
    resumeImport,
    cancelImport,
    resetImport
  }
}
