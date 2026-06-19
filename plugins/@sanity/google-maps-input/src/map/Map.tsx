import {useCallback, useEffect, useRef, useState, type ReactElement} from 'react'

import type {LatLng} from '../types'
import {MapContainer} from './Map.styles'

interface MapProps {
  api: typeof window.google.maps
  location: LatLng
  bounds?: google.maps.LatLngBounds
  defaultZoom?: number
  mapTypeControl?: boolean
  scrollWheel?: boolean
  controlSize?: number
  onClick?: (event: google.maps.MapMouseEvent) => void
  children?: (map: google.maps.Map) => ReactElement
}

export function GoogleMap({
  api,
  location,
  bounds,
  defaultZoom = 8,
  mapTypeControl,
  scrollWheel = true,
  controlSize,
  onClick,
  children,
}: MapProps) {
  const [map, setMap] = useState<google.maps.Map | undefined>(undefined)
  const clickHandlerRef = useRef<google.maps.MapsEventListener | undefined>(undefined)
  const mapElRef = useRef<HTMLDivElement | null>(null)

  const getCenter = useCallback((): google.maps.LatLng => {
    return new api.LatLng(location.lat, location.lng)
  }, [api, location.lat, location.lng])

  const attachClickHandler = useCallback(
    (mapInstance: google.maps.Map) => {
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove()
        clickHandlerRef.current = undefined
      }

      if (onClick) {
        clickHandlerRef.current = api.event.addListener(mapInstance, 'click', onClick)
      }
    },
    [api, onClick],
  )

  const setMapElement = useCallback(
    (element: HTMLDivElement | null) => {
      if (element && element !== mapElRef.current) {
        const mapInstance = new api.Map(element, {
          zoom: defaultZoom,
          center: getCenter(),
          scrollwheel: scrollWheel,
          streetViewControl: false,
          mapTypeControl,
          controlSize,
        })

        if (bounds) {
          mapInstance.fitBounds(bounds)
        }

        mapElRef.current = element
        setMap(mapInstance)
        attachClickHandler(mapInstance)
      } else {
        mapElRef.current = element
      }
    },
    [
      api,
      attachClickHandler,
      bounds,
      controlSize,
      defaultZoom,
      getCenter,
      mapTypeControl,
      scrollWheel,
    ],
  )

  useEffect(() => {
    if (map) {
      attachClickHandler(map)
    }
  }, [attachClickHandler, map])

  useEffect(() => {
    if (!map) {
      return
    }

    map.panTo(getCenter())
  }, [getCenter, map])

  useEffect(() => {
    if (!map || !bounds) {
      return
    }

    map.fitBounds(bounds)
  }, [bounds, map])

  useEffect(() => {
    return () => {
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove()
      }
    }
  }, [])

  return (
    <>
      <MapContainer ref={setMapElement} />
      {children && map ? children(map) : null}
    </>
  )
}
