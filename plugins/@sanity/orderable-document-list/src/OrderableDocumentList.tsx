import type {SanityClient} from '@sanity/client'
import type {ToastParams} from '@sanity/ui'
import {forwardRef, useImperativeHandle, useState} from 'react'

import {DocumentListWrapper} from './DocumentListWrapper'
import {resetOrder} from './helpers/resetOrder'

export interface OrderableDocumentListProps {
  options: {
    type: string
    client: SanityClient
    filter?: string
    params?: Record<string, unknown>
    currentVersion?: string
  }
}

export const OrderableDocumentList = forwardRef<unknown, OrderableDocumentListProps>(
  function OrderableDocumentList({options}, ref) {
    const [showIncrements, setShowIncrements] = useState(false)
    const [resetOrderTransaction, setResetOrderTransaction] = useState<ToastParams>({})

    useImperativeHandle(ref, () => ({
      actionHandlers: {
        showIncrements: () => {
          setShowIncrements((state) => !state)
        },

        resetOrder: async () => {
          setResetOrderTransaction({
            status: `info`,
            title: `Reordering started...`,
            closable: true,
          })

          const update = await resetOrder(options)

          const reorderWasSuccessful = update?.results?.length

          setResetOrderTransaction({
            status: reorderWasSuccessful ? `success` : `info`,
            title: reorderWasSuccessful
              ? `Reordered ${update.results.length === 1 ? `Document` : `Documents`}`
              : `Reordering failed`,
            closable: true,
          })
        },
      },
    }))

    const {type, filter, params, currentVersion} = options

    if (!type) {
      return null
    }

    return (
      <DocumentListWrapper
        filter={filter}
        params={params}
        type={type}
        showIncrements={showIncrements}
        resetOrderTransaction={resetOrderTransaction}
        currentVersion={currentVersion}
      />
    )
  },
)
