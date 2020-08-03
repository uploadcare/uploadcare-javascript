import fromUrlStatus, { Status } from '../api/fromUrlStatus'
import fromUrl, { TypeEnum } from '../api/fromUrl'
import { UploadClientError, cancelError } from '../tools/errors'
import { poll } from '../tools/poll'
import { race } from '../tools/race'
import { isReadyPoll } from '../tools/isReadyPoll'
import defaultSettings from '../defaultSettings'
import { onCancel } from '../tools/onCancel'

import { getPusher, preconnect } from './pusher'

/* Types */
import { FileInfo } from '../api/types'
import { UploadcareFile } from '../tools/UploadcareFile'

function pollStrategy({
  token,
  publicKey,
  baseURL,
  integration,
  retryThrottledRequestMaxTimes,
  onProgress,
  signal
}: {
  token: string
  publicKey: string
  baseURL?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  onProgress?: (info: { value: number }) => void
  signal?: AbortSignal
}): Promise<FileInfo | UploadClientError> {
  return poll<FileInfo | UploadClientError>({
    check: signal =>
      fromUrlStatus(token, {
        publicKey,
        baseURL,
        integration,
        retryThrottledRequestMaxTimes,
        signal
      }).then(response => {
        switch (response.status) {
          case Status.Error: {
            return new UploadClientError(response.error)
          }
          case Status.Waiting: {
            return false
          }
          case Status.Unknown: {
            return new UploadClientError(`Token "${token}" was not found.`)
          }
          case Status.Progress: {
            if (onProgress)
              onProgress({ value: response.done / response.total })
            return false
          }
          case Status.Success: {
            if (onProgress)
              onProgress({ value: response.done / response.total })
            return response
          }
          default: {
            throw new Error('Unknown status')
          }
        }
      }),
    signal
  })
}

const pushStrategy = ({
  token,
  pusherKey,
  signal,
  stopRace,
  onProgress
}: {
  token: string
  pusherKey: string
  signal: AbortSignal
  stopRace: () => void
  onProgress?: (info: { value: number }) => void
}): Promise<FileInfo | UploadClientError> =>
  new Promise((resolve, reject) => {
    const pusher = getPusher(pusherKey)
    const unsubErrorHandler = pusher.onError(reject)
    const destroy = (): void => {
      unsubErrorHandler()
      pusher.unsubscribe(token)
    }

    onCancel(signal, () => {
      destroy()
      reject(cancelError('pisher cancelled'))
    })

    pusher.subscribe(token, result => {
      stopRace()

      switch (result.status) {
        case Status.Progress: {
          if (onProgress) {
            onProgress({ value: result.done / result.total })
          }
          break
        }

        case Status.Success: {
          destroy()
          if (onProgress) onProgress({ value: result.done / result.total })
          resolve(result)
          break
        }

        case Status.Error: {
          destroy()
          reject(new UploadClientError(result.msg))
        }
      }
    })
  })

type FromUrlOptions = {
  publicKey: string
  fileName?: string
  baseURL?: string
  baseCDN?: string
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  secureSignature?: string
  secureExpire?: string
  store?: boolean
  signal?: AbortSignal
  onProgress?: ({ value: number }) => void
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  pusherKey?: string
}

const uploadFromUrl = (
  sourceUrl: string,
  {
    publicKey,
    fileName,
    baseURL,
    baseCDN,
    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    secureSignature,
    secureExpire,
    store,
    signal,
    onProgress,
    source,
    integration,
    retryThrottledRequestMaxTimes,
    pusherKey = defaultSettings.pusherKey
  }: FromUrlOptions
): Promise<UploadcareFile> =>
  Promise.resolve(preconnect(pusherKey))
    .then(() =>
      fromUrl(sourceUrl, {
        publicKey,
        fileName,
        baseURL,
        checkForUrlDuplicates,
        saveUrlForRecurrentUploads,
        secureSignature,
        secureExpire,
        store,
        signal,
        source,
        integration,
        retryThrottledRequestMaxTimes
      })
    )
    .then(urlResponse => {
      if (urlResponse.type === TypeEnum.FileInfo) {
        return urlResponse
      } else {
        return race<FileInfo | UploadClientError>(
          [
            ({ signal }): Promise<FileInfo | UploadClientError> =>
              pollStrategy({
                token: urlResponse.token,
                publicKey,
                baseURL,
                integration,
                retryThrottledRequestMaxTimes,
                onProgress,
                signal
              }),
            ({ stopRace, signal }): Promise<FileInfo | UploadClientError> =>
              pushStrategy({
                token: urlResponse.token,
                pusherKey,
                stopRace,
                signal,
                onProgress
              })
          ],
          { signal }
        )
      }
    })
    .then(result => {
      if (result instanceof UploadClientError) throw result

      return result
    })
    .then(result =>
      isReadyPoll({
        file: result.uuid,
        publicKey,
        baseURL,
        integration,
        retryThrottledRequestMaxTimes,
        onProgress,
        signal
      })
    )
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))

export default uploadFromUrl
