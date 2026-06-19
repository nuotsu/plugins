import {type MutableRefObject, useEffect, useRef} from 'react'

import type {LatLng} from '../types'
import {latLngAreEqual} from './util'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  from: LatLng
  to: LatLng
  color?: {background: string; border: string; text: string}
  zIndex?: number
  arrowRef?: MutableRefObject<google.maps.Polyline | undefined>
  onClick?: (event: google.maps.MapMouseEvent) => void
}

export function Arrow({from, to, api, map, zIndex, onClick, color, arrowRef}: Props) {
  const lineRef = useRef<google.maps.Polyline | undefined>(undefined)
  const clickHandlerRef = useRef<google.maps.MapsEventListener | undefined>(undefined)
  const prevFromRef = useRef(from)
  const prevToRef = useRef(to)
  const prevMapRef = useRef(map)

  useEffect(() => {
    const lineSymbol = {
      path: api.SymbolPath.FORWARD_OPEN_ARROW,
    }

    const line = new api.Polyline({
      map,
      zIndex,
      path: [from, to],
      icons: [{icon: lineSymbol, offset: '50%'}],
      strokeOpacity: 0.55,
      strokeColor: color ? color.text : 'black',
    })

    lineRef.current = line

    if (arrowRef) {
      arrowRef.current = line
    }

    return () => {
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove()
        clickHandlerRef.current = undefined
      }

      line.setMap(null)
      lineRef.current = undefined

      if (arrowRef?.current === line) {
        arrowRef.current = undefined
      }
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- path updates are handled in a separate effect
  }, [api, arrowRef, color, map, zIndex])

  useEffect(() => {
    const line = lineRef.current
    if (!line) {
      return
    }

    if (!latLngAreEqual(prevFromRef.current, from) || !latLngAreEqual(prevToRef.current, to)) {
      line.setPath([from, to])
      prevFromRef.current = from
      prevToRef.current = to
    }

    if (prevMapRef.current !== map) {
      line.setMap(map)
      prevMapRef.current = map
    }
  }, [from, map, to])

  useEffect(() => {
    const line = lineRef.current

    if (line) {
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove()
        clickHandlerRef.current = undefined
      }

      if (onClick) {
        clickHandlerRef.current = api.event.addListener(line, 'click', onClick)
      }
    }

    return () => {
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove()
        clickHandlerRef.current = undefined
      }
    }
  }, [api, onClick])

  return null
}
