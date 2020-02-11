import fromUrl, { TypeEnum } from '../api/fromUrl'
import fromUrlStatus, { Status } from '../api/fromUrlStatus'
import { poll } from '../tools/poll'
import { UploadClientError } from '../tools/errors'

/* Types */
import { FileInfo } from '../api/types'
import CancelController from '../tools/CancelController'
import { UploadcareFile } from '../tools/UploadcareFile'

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
  cancel?: CancelController
  onProgress?: ({ value: number }) => void
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
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
    cancel,
    onProgress,
    source,
    integration,
    retryThrottledRequestMaxTimes
  }: FromUrlOptions
): Promise<UploadcareFile> =>
  fromUrl(sourceUrl, {
    publicKey,
    fileName,
    baseURL,
    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    secureSignature,
    secureExpire,
    store,
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes
  })
    .then(urlResponse => {
      if (urlResponse.type === TypeEnum.FileInfo) {
        return urlResponse
      } else {
        return poll<FileInfo>({
          check: cancel =>
            fromUrlStatus(urlResponse.token, {
              publicKey,
              baseURL,
              integration,
              retryThrottledRequestMaxTimes,
              cancel
            }).then(response => {
              switch (response.status) {
                case Status.Error: {
                  throw new UploadClientError(response.error)
                }
                case Status.Waiting: {
                  return false
                }
                case Status.Unknown: {
                  throw new UploadClientError(
                    `Token "${urlResponse.token}" was not found.`
                  )
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
                  throw new UploadClientError('Unknown status')
                }
              }
            }),
          cancel
        })
      }
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))

export default uploadFromUrl
