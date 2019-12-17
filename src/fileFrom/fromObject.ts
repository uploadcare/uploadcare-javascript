import base, { FileData } from '../api/base'
import info from '../api/info'
import { poll } from '../tools/poller'
import { UploadcareFile } from '../UploadcareFile'
import CancelController from '../CancelController'

const fromObject = (
  file: FileData,
  {
    publicKey,
    fileName,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress,
    source,
    integration,
    retryThrottledRequestMaxTimes,
    baseCDN
  }: {
    publicKey: string

    fileName?: string
    baseURL?: string
    secureSignature?: string
    secureExpire?: string
    store?: boolean

    cancel?: CancelController
    onProgress?: ({ value: number }) => void

    source?: string
    integration?: string

    retryThrottledRequestMaxTimes?: number

    baseCDN?: string
  }
): Promise<UploadcareFile> => {
  let progress: number

  return base(file, {
    publicKey,
    fileName,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress: ({ value }) => {
      progress = value * 0.98
      onProgress && onProgress({ value: progress })
    },
    source,
    integration,
    retryThrottledRequestMaxTimes
  }).then(({ file }) => {
    return poll({
      check: async () => {
        const response = await info(file, {
          publicKey,
          baseURL,
          cancel,
          source,
          integration,
          retryThrottledRequestMaxTimes
        })

        if (response.isReady) {
          onProgress && onProgress({ value: 1 })
          return response
        }

        if (onProgress) {
          const { done, total } = response

          onProgress({
            value: progress + done / total
          })
        }
        return false
      }
    }).then(fileInfo =>
      Promise.resolve(UploadcareFile.fromFileInfo(fileInfo, { baseCDN }))
    )
  })
}

export default fromObject
