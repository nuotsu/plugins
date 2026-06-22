/**
 * Saturation / value box.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Saturation.js | react-color's Saturation}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import throttle from 'lodash-es/throttle'
import {useCallback, useEffect, useMemo, useRef, type CSSProperties, type ReactElement} from 'react'
import {styled} from 'styled-components'

import * as saturation from './helpers/saturation'
import type {
  ColorChangeHandler,
  HSLColor,
  HSVColor,
  PickerEvent,
  SaturationColorResult,
} from './types'

type ThrottledChange = ReturnType<
  typeof throttle<
    (handler: ColorChangeHandler<SaturationColorResult>, data: SaturationColorResult) => void
  >
>

const SaturationWhite = styled.div`
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
`

const SaturationBlack = styled.div`
  background: linear-gradient(to top, #000, rgba(0, 0, 0, 0));
`

export interface SaturationProps {
  hsl: HSLColor
  hsv: HSVColor
  radius?: string | undefined
  shadow?: string | undefined
  onChange?: ColorChangeHandler<SaturationColorResult> | undefined
}

export function Saturation({hsl, hsv, radius, shadow, onChange}: SaturationProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeListenersRef = useRef<{
    renderWindow: Window
    mousemove: (event: PickerEvent) => void
    mouseup: () => void
  } | null>(null)

  const throttledChange = useMemo<ThrottledChange>(
    () =>
      throttle(
        (handler: ColorChangeHandler<SaturationColorResult>, data: SaturationColorResult): void => {
          handler(data)
        },
        50,
      ),
    [],
  )

  const getContainerRenderWindow = useCallback((): Window => {
    const container = containerRef.current
    if (!container) {
      return window
    }

    let renderWindow: Window = window
    while (!renderWindow.document.contains(container) && renderWindow.parent !== renderWindow) {
      renderWindow = renderWindow.parent
    }
    return renderWindow
  }, [])

  const handleChange = useCallback(
    (event: PickerEvent) => {
      const container = containerRef.current
      if (!container || typeof onChange !== 'function') {
        return
      }
      throttledChange(onChange, saturation.calculateChange(event, hsl, container))
    },
    [hsl, onChange, throttledChange],
  )

  const cleanupActiveListeners = useCallback(() => {
    const listeners = activeListenersRef.current
    if (!listeners) {
      return
    }
    listeners.renderWindow.removeEventListener('mousemove', listeners.mousemove)
    listeners.renderWindow.removeEventListener('mouseup', listeners.mouseup)
    activeListenersRef.current = null
  }, [])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      handleChange(event.nativeEvent)
      cleanupActiveListeners()

      const renderWindow = getContainerRenderWindow()
      const onMouseUp = () => {
        cleanupActiveListeners()
      }

      activeListenersRef.current = {
        renderWindow,
        mousemove: handleChange,
        mouseup: onMouseUp,
      }

      renderWindow.addEventListener('mousemove', handleChange)
      renderWindow.addEventListener('mouseup', onMouseUp)
    },
    [cleanupActiveListeners, getContainerRenderWindow, handleChange],
  )

  useEffect(() => {
    return () => {
      throttledChange.cancel()
      cleanupActiveListeners()
    }
  }, [cleanupActiveListeners, throttledChange])

  const pointerStyle: CSSProperties = {
    position: 'absolute',
    top: `${-(hsv.v * 100) + 100}%`,
    left: `${hsv.s * 100}%`,
    cursor: 'default',
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the picker surface is dragged via pointer coordinates, which have no keyboard equivalent
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `hsl(${hsl.h},100%, 50%)`,
        borderRadius: radius,
      }}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchMove={handleChange}
      onTouchStart={handleChange}
    >
      <SaturationWhite style={{position: 'absolute', inset: 0, borderRadius: radius}}>
        <SaturationBlack
          style={{position: 'absolute', inset: 0, boxShadow: shadow, borderRadius: radius}}
        />
        <div style={pointerStyle}>
          <div
            style={{
              width: '4px',
              height: '4px',
              boxShadow:
                '0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3), 0 0 1px 2px rgba(0,0,0,.4)',
              borderRadius: '50%',
              cursor: 'pointer',
              transform: 'translate(-2px, -2px)',
            }}
          />
        </div>
      </SaturationWhite>
    </div>
  )
}
