/**
 * Labeled text input with arrow-key stepping and drag-to-change support.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/EditableInput.js | react-color's EditableInput}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react'

import type {EditableInputStyles} from './types'

const DEFAULT_ARROW_OFFSET = 1

const getNumberValue = (value: string | number): number => Number(String(value).replace(/%/g, ''))

type EditableInputEvent =
  | ChangeEvent<HTMLInputElement>
  | ReactKeyboardEvent<HTMLInputElement>
  | MouseEvent

export interface EditableInputProps {
  label: string
  value?: string | number | undefined
  style?: EditableInputStyles | undefined
  arrowOffset?: number | undefined
  placeholder?: string | undefined
  hideLabel?: boolean | undefined
  dragLabel?: boolean | undefined
  dragMax?: number | undefined
  onChange?: ((value: Record<string, string>, event: EditableInputEvent) => void) | undefined
}

export function EditableInput({
  label,
  value: valueProp,
  style,
  arrowOffset,
  placeholder,
  hideLabel,
  dragLabel,
  dragMax,
  onChange,
}: EditableInputProps): ReactElement {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const activeListenersRef = useRef<{
    mousemove: (event: MouseEvent) => void
    mouseup: () => void
  } | null>(null)
  const initialValue = String(valueProp ?? '').toUpperCase()
  const [inputValue, setInputValue] = useState(initialValue)
  const [blurValue, setBlurValue] = useState(initialValue)

  const getValueObjectWithLabel = useCallback(
    (value: string | number): Record<string, string> => {
      return {[label]: String(value)}
    },
    [label],
  )

  const getArrowOffset = useCallback(
    (): number => arrowOffset ?? DEFAULT_ARROW_OFFSET,
    [arrowOffset],
  )

  const setUpdatedValue = useCallback(
    (value: string | number, event: EditableInputEvent) => {
      onChange?.(getValueObjectWithLabel(value), event)
      setInputValue(String(value))
    },
    [getValueObjectWithLabel, onChange],
  )

  useEffect(() => {
    if (valueProp === inputValue) {
      return
    }

    const nextValue = String(valueProp ?? '').toUpperCase()
    const isFocused = inputRef.current === document.activeElement

    if (isFocused) {
      setBlurValue(nextValue)
      return
    }

    setInputValue(nextValue)
    setBlurValue((currentBlurValue) => (currentBlurValue ? '' : nextValue))
  }, [inputValue, valueProp])

  const handleBlur = useCallback(() => {
    if (blurValue) {
      setInputValue(blurValue)
      setBlurValue('')
    }
  }, [blurValue])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setUpdatedValue(event.target.value, event)
    },
    [setUpdatedValue],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      const numericValue = getNumberValue(event.currentTarget.value)
      const isUp = event.key === 'ArrowUp'
      const isDown = event.key === 'ArrowDown'
      if (!Number.isNaN(numericValue) && (isUp || isDown)) {
        const offset = getArrowOffset()
        const updatedValue = isUp ? numericValue + offset : numericValue - offset
        setUpdatedValue(updatedValue, event)
      }
    },
    [getArrowOffset, setUpdatedValue],
  )

  const handleDrag = useCallback(
    (event: MouseEvent) => {
      if (!dragLabel) {
        return
      }
      const numericValue = typeof valueProp === 'number' ? valueProp : Number(valueProp)
      const newValue = Math.round(numericValue + event.movementX)
      if (dragMax !== undefined && newValue >= 0 && newValue <= dragMax) {
        onChange?.(getValueObjectWithLabel(newValue), event)
      }
    },
    [dragLabel, dragMax, getValueObjectWithLabel, onChange, valueProp],
  )

  const cleanupActiveListeners = useCallback(() => {
    const listeners = activeListenersRef.current
    if (!listeners) {
      return
    }
    window.removeEventListener('mousemove', listeners.mousemove)
    window.removeEventListener('mouseup', listeners.mouseup)
    activeListenersRef.current = null
  }, [])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLLabelElement>) => {
      if (!dragLabel) {
        return
      }
      event.preventDefault()
      handleDrag(event.nativeEvent)
      cleanupActiveListeners()

      const onMouseUp = () => {
        cleanupActiveListeners()
      }

      activeListenersRef.current = {
        mousemove: handleDrag,
        mouseup: onMouseUp,
      }

      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', onMouseUp)
    },
    [cleanupActiveListeners, dragLabel, handleDrag],
  )

  useEffect(() => {
    return cleanupActiveListeners
  }, [cleanupActiveListeners])

  const resolvedStyle = style ?? {}
  const wrapStyle: CSSProperties = {position: 'relative', ...resolvedStyle.wrap}
  const inputStyle: CSSProperties = {...resolvedStyle.input}
  const labelStyle: CSSProperties = {
    ...resolvedStyle.label,
    ...(dragLabel ? {cursor: 'ew-resize'} : null),
  }

  return (
    <div style={wrapStyle}>
      <input
        id={inputId}
        style={inputStyle}
        ref={inputRef}
        value={inputValue}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        spellCheck="false"
      />
      {label && !hideLabel ? (
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the label is a drag affordance using pointer coordinates; the input also supports arrow-key stepping
        <label htmlFor={inputId} style={labelStyle} onMouseDown={handleMouseDown}>
          {label}
        </label>
      ) : null}
    </div>
  )
}
