import { FileInfo } from './base-types'
import request from './request/request.node'
import getUrl from './request/getUrl'

import CancelController from '../CancelController'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../errors/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

type Url = string

export enum TypeEnum {
  Token = 'token',
  FileInfo = 'file_info'
}

type TokenResponse = {
  type: TypeEnum.Token
  token: string
}

type FileInfoResponse = {
  type: TypeEnum.FileInfo
} & FileInfo

type SuccessResponse = FileInfoResponse | TokenResponse

type FailedResponse = {
  error: {
    content: string
    statusCode: number
  }
}

type Response = FailedResponse | SuccessResponse

/**
 * TokenResponse Type Guard.
 */
export const isTokenResponse = (
  response: SuccessResponse
): response is TokenResponse => {
  return response.type !== undefined && response.type === TypeEnum.Token
}

/**
 * FileInfoResponse Type Guard.
 */
export const isFileInfoResponse = (
  response: SuccessResponse
): response is FileInfoResponse => {
  return response.type !== undefined && response.type === TypeEnum.FileInfo
}

type Options = {
  publicKey: string

  baseURL?: string
  store?: boolean
  fileName?: string
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  secureSignature?: string
  secureExpire?: string

  cancel?: CancelController

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number
}

/**
 * Uploading files from URL.
 */

/* eslint @typescript-eslint/camelcase: [2, {allow: ["pub_key", "source_url", "check_URL_duplicates", "save_URL_duplicates"]}] */

export default function fromUrl(
  sourceUrl: Url,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    store,
    fileName,
    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    secureSignature,
    secureExpire,
    source = 'url',
    cancel,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: Options
): Promise<SuccessResponse> {
  return retryIfThrottled(
    () =>
      request({
        method: 'POST',
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
        url: getUrl(baseURL, '/from_url/', {
          jsonerrors: 1,
          pub_key: publicKey,
          source_url: sourceUrl,
          store: typeof store === 'undefined' ? 'auto' : store ? 1 : undefined,
          filename: fileName,
          check_URL_duplicates: checkForUrlDuplicates ? 1 : undefined,
          save_URL_duplicates: saveUrlForRecurrentUploads ? 1 : undefined,
          signature: secureSignature,
          expire: secureExpire,
          source: source
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
