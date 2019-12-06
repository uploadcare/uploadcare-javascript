/* Vendors */
import * as FormData from 'form-data'
import axios, {AxiosRequestConfig, AxiosResponse, CancelTokenSource} from 'axios'

import {Thenable} from '../../thenable/Thenable'
import defaultSettings from '../../defaultSettings'
import {isNode} from '../../tools/isNode'
import CancelError from '../../errors/CancelError'
import RequestError from '../../errors/RequestError'
import {addMaxConcurrencyInterceptorsToAxiosInstance} from '../request/interceptors'

/* Types */
import {FileData, SettingsInterface} from '../../types'
import {MultipartPart, MultipartUploadResponse} from './types'
import {BaseThenableInterface} from '../../thenable/types'
import {BaseHooksInterface} from '../../lifecycle/types'

const updateProgress = ({data, loaded = false, onUploadProgress}: {
  data: Buffer;
  loaded: boolean;
  onUploadProgress: (progressEvent: ProgressEvent) => void;
}): void => {
  const formData = new FormData()
  formData.append('data', data)

  const total = formData.getLengthSync()

  onUploadProgress({
    total,
    loaded: loaded ? total : 0,
  } as ProgressEvent)
}

const nodeUploadProgressRequestInterceptor = (config: AxiosRequestConfig): AxiosRequestConfig => {
  const {data, onUploadProgress} = config
  if (!onUploadProgress) {
    return config
  }

  updateProgress({data, loaded: false, onUploadProgress})

  return config
}

const nodeUploadProgressResponseInterceptor = (response: AxiosResponse): AxiosResponse => {
  const {data, onUploadProgress} = response.config
  if (!onUploadProgress) {
    return response
  }

  updateProgress({data, loaded: true, onUploadProgress})

  return response
}

class MultipartUploadPart extends Thenable<MultipartUploadResponse> implements BaseThenableInterface<MultipartUploadResponse> {
  protected readonly promise: Promise<MultipartUploadResponse>
  private readonly cancelController: CancelTokenSource

  constructor(partUrl: MultipartPart, file: FileData, settings: SettingsInterface, hooks?: BaseHooksInterface) {
    super()

    this.cancelController = axios.CancelToken.source()

    const options = {
      data: file,
      url: partUrl,
      method: 'PUT',
      cancelToken: this.cancelController.token,
      maxContentLength: settings.maxContentLength || defaultSettings.maxContentLength,
      onUploadProgress: (progressEvent: ProgressEvent) => {
        if (hooks && typeof hooks.onProgress === 'function') {
          hooks.onProgress(progressEvent)
        }
      },
    }

    const instance = axios.create()
    const maxConcurrentRequestsCount = settings.maxConcurrentRequests || defaultSettings.maxConcurrentRequests

    addMaxConcurrencyInterceptorsToAxiosInstance({instance, maxConcurrentRequestsCount})

    if (isNode()) {
      instance.interceptors.request.use(nodeUploadProgressRequestInterceptor,
        error => {
          return Promise.reject(error)
        }
      )
      instance.interceptors.response.use(nodeUploadProgressResponseInterceptor,
        error => {
          return Promise.reject(error)
        }
      )
    }

    this.promise = instance(options as AxiosRequestConfig)
      .catch(error => {
        const {url} = options

        if (axios.isCancel(error)) {
          throw new CancelError()
        }

        if (error.response) {
          const errorRequestInfo = {
            headers: error.config.headers,
            url: error.config.url || url,
          }
          const errorResponseInfo = {
            status: error.response.status,
            statusText: error.response.statusText,
          }

          throw new RequestError(errorRequestInfo, errorResponseInfo)
        }

        throw error
      })
      .then(response => Promise.resolve({code: response.status}))
      .catch(error => {
        if (error.name === 'CancelError' && hooks && typeof hooks.onCancel === 'function') {
          hooks.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    return this.cancelController.cancel()
  }
}

/**
 * Upload part of multipart file.
 *
 * @param {MultipartPart} partUrl
 * @param {FileData} file
 * @param {SettingsInterface} settings
 * @param {BaseHooksInterface} hooks
 * @return {BaseThenableInterface<MultipartUploadResponse>}
 */
export default function multipartUploadPart(partUrl: MultipartPart, file: FileData, settings: SettingsInterface = {}, hooks?: BaseHooksInterface): BaseThenableInterface<MultipartUploadResponse> {
  return new MultipartUploadPart(partUrl, file, settings, hooks)
}
