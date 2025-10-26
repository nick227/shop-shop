/**
 * Unit Tests: useImageLoader Hook;
 */
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useImageLoader } from './useImageLoader'

describe('useImageLoader', () => {
  it('should initialize with loading=true and error=false', () => {
    const { result } = renderHook(() => useImageLoader('test.jpg'))
    
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(false)
  })

  it('should set loading=false when handleLoad is called', () => {
    const { result } = renderHook(() => useImageLoader('test.jpg'))
    
    act(() => {
      result.current.handleLoad()
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
  })

  it('should set loading=false and error=true when handleError is called', () => {
    const { result } = renderHook(() => useImageLoader('test.jpg'))
    
    act(() => {
      result.current.handleError()
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(true)
  })

  it('should have stable function references', () => {
    const { result, rerender } = renderHook(() => useImageLoader('test.jpg'))
    
    const firstHandleLoad = result.current.handleLoad;
    const firstHandleError = result.current.handleError;
    rerender()
    
    expect(result.current.handleLoad).toBe(firstHandleLoad)
    expect(result.current.handleError).toBe(firstHandleError)
  })

  it('should not change error state after handleLoad is called', () => {
    const { result } = renderHook(() => useImageLoader('test.jpg'))
    
    act(() => {
      result.current.handleLoad()
    })
    
    expect(result.current.error).toBe(false)
  })

  it('should handle multiple handleLoad calls', () => {
    const { result } = renderHook(() => useImageLoader('test.jpg'))
    
    act(() => {
      result.current.handleLoad()
      result.current.handleLoad()
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
  })

  it('should handle multiple handleError calls', () => {
    const { result } = renderHook(() => useImageLoader('test.jpg'))
    
    act(() => {
      result.current.handleError()
      result.current.handleError()
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(true)
  })

  it('should reset state when src changes', () => {
    const { result, rerender } = renderHook(
      ({ src }) => useImageLoader(src),
      { initialProps: { src: 'test1.jpg' } }
    )
    
    // Simulate loaded state;
    act(() => {
      result.current.handleLoad()
    })
    expect(result.current.loading).toBe(false)
    
    // Change src - should reset to loading;
    rerender({ src: 'test2.jpg' })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(false)
  })

  it('should reset error state when src changes', () => {
    const { result, rerender } = renderHook(
      ({ src }) => useImageLoader(src),
      { initialProps: { src: 'test1.jpg' } }
    )
    
    // Simulate error state;
    act(() => {
      result.current.handleError()
    })
    expect(result.current.error).toBe(true)
    
    // Change src - should reset error;
    rerender({ src: 'test2.jpg' })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(false)
  })
})

