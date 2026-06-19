import {TextInput} from '@sanity/ui'
import {useEffect, useRef} from 'react'

import {WrapperContainer} from './SearchInput.styles'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  onChange: (result: google.maps.places.PlaceResult) => void
}

export function SearchInput({api, map, onChange}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autoCompleteRef = useRef<google.maps.places.Autocomplete | undefined>(undefined)

  useEffect(() => {
    const input = searchInputRef.current
    if (!input) {
      return () => {}
    }

    const handleChange = () => {
      const autoComplete = autoCompleteRef.current
      if (!autoComplete) {
        return
      }

      onChange(autoComplete.getPlace())

      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
    }

    const {Circle, places, event} = api
    const searchBounds = new Circle({center: map.getCenter(), radius: 100}).getBounds()!
    const autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: [],
    })

    autoCompleteRef.current = autoComplete
    const listener = event.addListener(autoComplete, 'place_changed', handleChange)

    return () => {
      listener.remove()
      autoCompleteRef.current = undefined
    }
  }, [api, map, onChange])

  return (
    <WrapperContainer>
      <TextInput
        name="place"
        ref={searchInputRef}
        placeholder="Search for place or address"
        padding={4}
      />
    </WrapperContainer>
  )
}
