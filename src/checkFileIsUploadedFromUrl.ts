import {SettingsInterface} from './types'
import poll, {PollPromiseInterface} from './tools/poll'
import fromUrlStatus, {
  isErrorResponse,
  isProgressResponse,
  isSuccessResponse,
  isUnknownResponse, SuccessResponse
} from './api/fromUrlStatus'
import {Uuid} from './api/types'
import {CancelableThenableInterface} from './thenable/types'

type FileIsUploadedParams = {
  token: Uuid;
  timeout?: number;
  onUnknown?: Function;
  onProgress?: Function;
  onError?: Function;
  settings?: SettingsInterface;
}

const checkFileIsUploadedFromUrl = (
  {
    token,
    timeout,
    onUnknown,
    onProgress,
    settings = {}
  }: FileIsUploadedParams): PollPromiseInterface<SuccessResponse> =>
  poll<SuccessResponse>({
    task: fromUrlStatus(token, settings) as CancelableThenableInterface<SuccessResponse>,
    condition: (response) => {
      if (isUnknownResponse(response)) {
        if (onUnknown && typeof onUnknown === 'function') {
          onUnknown(response)
        }
      }

      if (isProgressResponse(response)) {
        if (onProgress && typeof onProgress === 'function') {
          onProgress(response)
        }
      }

      if (isErrorResponse(response)) {
        throw new Error(response.error)
      }

      if (isSuccessResponse(response)) {
        return response
      }

      return false
    },
    taskName: 'checkFileIsUploadedFromUrl',
    timeout,
  })

export default checkFileIsUploadedFromUrl
