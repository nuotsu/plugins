/**
 * `CustomPicker` higher-order component: manages color state and injects the
 * normalized color (`hsl`/`hsv`/`rgb`/`hex`) plus an `onChange` handler into the
 * wrapped picker.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/ColorWrap.js | react-color's ColorWrap}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {useCallback, useState, type ComponentType, type ReactElement} from 'react'

import {simpleCheckForValidColor, toState} from './helpers/color'
import type {Color, ColorState, CustomPickerInjectedProps, CustomPickerProps} from './types'

type Diff<T, U> = Pick<T, Exclude<keyof T, keyof U>>

const DEFAULT_COLOR: Color = {h: 250, s: 0.5, l: 0.2, a: 1}

export function CustomPicker<A extends object>(
  Picker: ComponentType<A & CustomPickerInjectedProps>,
): ComponentType<Diff<A, CustomPickerProps> & CustomPickerProps> {
  type OuterProps = Diff<A, CustomPickerProps> & CustomPickerProps

  function ColorPicker(props: OuterProps): ReactElement {
    const {onChange: onChangeProp, color} = props
    const [oldHue, setOldHue] = useState(() => toState(color ?? DEFAULT_COLOR, 0).oldHue)
    const state: ColorState = toState(color ?? DEFAULT_COLOR, oldHue)

    const handleChange = useCallback(
      (data: Color) => {
        if (!simpleCheckForValidColor(data)) {
          return
        }
        const incomingHue = typeof data === 'string' ? undefined : 'h' in data ? data.h : undefined
        const colors = toState(data, incomingHue || oldHue)
        setOldHue(colors.oldHue)
        onChangeProp?.(colors)
      },
      [oldHue, onChangeProp],
    )

    const injected: CustomPickerInjectedProps = {
      hsl: state.hsl,
      hsv: state.hsv,
      rgb: state.rgb,
      hex: state.hex,
      oldHue: state.oldHue,
      source: state.source,
      onChange: handleChange,
    }
    // The merged props satisfy the wrapped picker's contract at runtime, but the
    // generic `Diff` plumbing can't be expressed to the type-checker.
    // oxlint-disable-next-line no-unsafe-type-assertion
    const pickerProps = {...props, ...injected} as A & CustomPickerInjectedProps
    return <Picker {...pickerProps} />
  }

  return ColorPicker
}
