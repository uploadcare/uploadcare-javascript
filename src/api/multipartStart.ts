import { FailedResponse } from '../request/types'
import { Uuid } from './types'

import request from '../request/request.node'
import getFormData from '../tools/buildFormData'
import getUrl from '../tools/getUrl'
import {
  defaultSettings,
  defaultFilename,
  defaultContentType
} from '../defaultSettings'
import { getUserAgent } from '../tools/userAgent'
import camelizeKeys from '../tools/camelizeKeys'
import retryIfThrottled from '../tools/retryIfThrottled'
import { UploadClientError } from '../tools/errors'

export type MultipartStartOptions = {
  publicKey: string
  contentType?: string
  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean
  multipartChunkSize?: number
  signal?: AbortSignal
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
}

export type MultipartPart = string

export type MultipartStartResponse = {
  parts: MultipartPart[]
  uuid: Uuid
}

type Response = MultipartStartResponse | FailedResponse

/**
 * Start multipart uploading.
 */ function multipartStart(
  size: number,
  {
    publicKey,
    contentType,
    fileName,
    multipartChunkSize = defaultSettings.multipartChunkSize,
    baseURL = '',
    secureSignature,
    secureExpire,
    store,
    signal,
    source = 'local',
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: MultipartStartOptions
): Promise<MultipartStartResponse> {
  return retryIfThrottled(
    () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/multipart/start/', { jsonerrors: 1 }),
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
        data: getFormData([
          ['filename', fileName ?? defaultFilename],
          ['size', size],
          ['content_type', contentType ?? defaultContentType],
          ['part_size', multipartChunkSize],
          ['UPLOADCARE_STORE', store ? '' : 'auto'],
          ['UPLOADCARE_PUB_KEY', publicKey],
          ['signature', secureSignature],
          ['expire', secureExpire],
          ['source', source]
        ]),
        signal
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
          // convert to array
          response.parts = Object.keys(response.parts).map(
            key => response.parts[key]
          )

          return response
        }
      }),
    retryThrottledRequestMaxTimes
  )
}

export default multipartStart
