/**
 * ColorService Unit Tests;
 */
import { ColorService } from '../colorService'

// Mock getComputedStyle;
const mockGetComputedStyle = jest.fn()
Object.defineProperty(window, 'getComputedStyle', {
  value: mockGetComputedStyle,
  writable: true
})

describe('ColorService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset cached values;
    ;(ColorService as any).cachedSuccessColor = undefined;
    ;(ColorService as any).cachedCircleOptions.clear()
  })

  describe('getSuccessColor', () => {
    it('should return cached color on subsequent calls', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: jest.fn().mockReturnValue(' #ff0000 ')
      })

      const color1 = ColorService.getSuccessColor()
      const color2 = ColorService.getSuccessColor()

      expect(color1).toBe(color2)
      expect(mockGetComputedStyle).toHaveBeenCalledTimes(1)
    })

    it('should return default color when CSS variable is not found', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: jest.fn().mockReturnValue('')
      })

      const color = ColorService.getSuccessColor()

      expect(color).toBe('#10b981')
    })

    it('should return default color when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore;
      delete global.window;
      const color = ColorService.getSuccessColor()

      expect(color).toBe('#10b981')

      global.window = originalWindow;
    })

    it('should trim whitespace from CSS variable value', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: jest.fn().mockReturnValue(' #00ff00 ')
      })

      const color = ColorService.getSuccessColor()

      expect(color).toBe('#00ff00')
    })
  })

  describe('getCircleOptions', () => {
    it('should return cached options on subsequent calls', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: jest.fn().mockReturnValue('#ff0000')
      })

      const options1 = ColorService.getCircleOptions()
      const options2 = ColorService.getCircleOptions()

      expect(options1).toBe(options2)
    })

    it('should use provided color', () => {
      const customColor = '#00ff00'
      const options = ColorService.getCircleOptions(customColor)

      expect(options.color).toBe(customColor)
      expect(options.fillColor).toBe(customColor)
      expect(options.fillOpacity).toBe(0.1)
      expect(options.weight).toBe(2)
    })

    it('should use success color when no color provided', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: jest.fn().mockReturnValue('#ff0000')
      })

      const options = ColorService.getCircleOptions()

      expect(options.color).toBe('#ff0000')
      expect(options.fillColor).toBe('#ff0000')
      expect(options.fillOpacity).toBe(0.1)
      expect(options.weight).toBe(2)
    })

    it('should cache options by color', () => {
      const options1 = ColorService.getCircleOptions('#ff0000')
      const options2 = ColorService.getCircleOptions('#00ff00')
      const options3 = ColorService.getCircleOptions('#ff0000')

      expect(options1).toBe(options3)
      expect(options1).not.toBe(options2)
    })
  })
})
