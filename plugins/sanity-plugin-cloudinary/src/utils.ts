import type {
  CloudinaryAsset,
  CloudinaryAssetResponse,
  CloudinaryMediaLibrary,
  InsertHandlerParams,
} from './types'

const widgetSrc = 'https://media-library.cloudinary.com/global/all.js'

export function assetUrl(asset: Partial<Pick<CloudinaryAsset, 'url' | 'secure_url' | 'derived'>>) {
  const [derived] = asset.derived ?? []
  if (derived) {
    if (derived.secure_url) {
      return derived.secure_url
    }
    return derived.url
  }
  if (asset.secure_url) {
    return asset.secure_url
  }
  return asset.url
}

export const openMediaSelector = (
  cloudName: string,
  apiKey: string,
  multiple: boolean,
  insertHandler: (params: InsertHandlerParams) => void,
  selectedAsset?: CloudinaryAsset,
) => {
  loadJS(widgetSrc, (cloudinary) => {
    const options: Record<string, any> = {
      cloud_name: cloudName,
      api_key: apiKey,
      insert_caption: 'Select',
      multiple,
    }

    if (selectedAsset) {
      options['asset'] = {
        public_id: selectedAsset.public_id,
        type: selectedAsset.type,
        resource_type: selectedAsset.resource_type,
      }
    }

    cloudinary.openMediaLibrary(options, {insertHandler})
  })
}

export const createMediaLibrary = ({
  cloudName,
  apiKey,
  inlineContainer,
  libraryCreated,
  insertHandler,
}: {
  cloudName: string
  apiKey: string
  inlineContainer: string
  libraryCreated: (library: CloudinaryMediaLibrary) => void
  insertHandler: (params: InsertHandlerParams) => void
}) => {
  loadJS(widgetSrc, (cloudinary) => {
    const options: Record<string, any> = {
      cloud_name: cloudName,
      api_key: apiKey,
      insert_caption: 'Select',
      inline_container: inlineContainer,
      remove_header: true,
    }

    libraryCreated(cloudinary.createMediaLibrary(options, {insertHandler}))
  })
}

function loadJS(url: string, callback: (cloudinary: NonNullable<Window['cloudinary']>) => void) {
  // The widget exposes `window.cloudinary` only once the script has finished
  // loading. When it's already available, run the callback right away.
  if (window.cloudinary) {
    callback(window.cloudinary)
    return
  }

  const handleLoad = () => {
    if (window.cloudinary) {
      callback(window.cloudinary)
    }
  }

  const existingScript = document.getElementById('damWidget')
  if (existingScript) {
    // Another input already injected the script, but it hasn't finished
    // loading yet (the global isn't ready). Wait for the load event instead
    // of invoking the callback too early.
    existingScript.addEventListener('load', handleLoad, {once: true})
    return
  }

  const script = document.createElement('script')
  script.src = url
  script.id = 'damWidget'
  script.addEventListener('load', handleLoad, {once: true})
  document.body.appendChild(script)
}

export function encodeSourceId(asset: CloudinaryAssetResponse): string {
  const {resource_type, public_id, type} = asset
  return btoa(JSON.stringify({public_id, resource_type, type})) // Sort keys alphabetically!
}

export function encodeFilename(asset: CloudinaryAssetResponse) {
  return `${asset.public_id.split('/').slice(-1)[0]}.${asset.format}`
}

export function decodeSourceId(sourceId: string): CloudinaryAssetResponse | undefined {
  let sourceIdDecoded: any
  try {
    sourceIdDecoded = JSON.parse(atob(sourceId))
  } catch {
    // Do nothing
  }
  return sourceIdDecoded
}
