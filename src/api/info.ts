import request from '../request/request.node'
import getUrl from '../tools/getUrl'
import CancelController from '../tools/CancelController'
import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/userAgent'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../tools/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

/* Types */
import { Uuid, FileInfo } from './types'
import { FailedResponse } from '../request/types'

type Response = FileInfo | FailedResponse

export type InfoOptions = {
  publicKey: string

  baseURL?: string

  cancel?: CancelController
  onProgress?: ({ value: number }) => void

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number
}

/**
 * Returns a JSON dictionary holding file info.
 */
export default function info(
  uuid: Uuid,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: InfoOptions
): Promise<FileInfo> {
  return retryIfThrottled(
    () =>
      request({
        method: 'GET',
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
        url: getUrl(baseURL, '/info/', {
          jsonerrors: 1,
          pub_key: publicKey,
          file_id: uuid,
          source
        }),
        cancel
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys<Response>(JSON.parse(data))

        if ('error' in response) {
          throw new UploadClientError(
            `[${response.error.statusCode}] ${response.error.content}`,
            request,
            response.error,
            headers
          )
        } else {
          return response
        }
      }),
    retryThrottledRequestMaxTimes
  )
}
