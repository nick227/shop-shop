import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface HeaderAddressExtras {
  readonly locationDisplayName: string
  readonly currentRadius: number
  readonly citiesContextResult: { readonly short?: string }
  readonly onClearLocation: () => void
}

interface HeaderAddressExtrasContextValue {
  readonly extras: HeaderAddressExtras | undefined
  readonly setExtras: (value: HeaderAddressExtras | undefined) => void
}

const HeaderAddressExtrasContext = createContext<HeaderAddressExtrasContextValue | null>(null)

export function HeaderAddressExtrasProvider({ children }: { readonly children: ReactNode }) {
  const [extras, setExtrasState] = useState<HeaderAddressExtras | undefined>()
  const setExtras = useCallback((value: HeaderAddressExtras | undefined) => {
    setExtrasState(value)
  }, [])
  const value = useMemo(
    () => ({ extras, setExtras }),
    [extras, setExtras],
  )
  return (
    <HeaderAddressExtrasContext.Provider value={value}>{children}</HeaderAddressExtrasContext.Provider>
  )
}

export function useHeaderAddressExtrasForMerge(): HeaderAddressExtras | undefined {
  return useContext(HeaderAddressExtrasContext)?.extras
}

export function useSetHeaderAddressExtras():
  | ((value: HeaderAddressExtras | undefined) => void)
  | undefined {
  return useContext(HeaderAddressExtrasContext)?.setExtras
}
