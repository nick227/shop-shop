import { useEffect, useState } from 'react'

/** Opens once when `filled` becomes true. Closing stays closed until `filled` flips again. */
export function useOpenWhenFilled(filled: boolean) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (filled) setOpen(true)
  }, [filled])

  return { open, setOpen }
}
