import request from './request/request'
import {prepareOptions} from './request/prepareOptions'

/* Types */
import {HandleProgressFunction, RequestInterface} from './request/types'
import {RequestOptions} from './request/types'
import {Settings, FileData} from '../types'
import {Thenable} from '../tools/Thenable'
import {BaseProgress, BaseResponse, DirectUploadInterface} from './types'

class DirectUpload extends Thenable<BaseResponse> implements DirectUploadInterface {
  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<BaseResponse>

  private readonly request: RequestInterface
  private readonly options: RequestOptions

  constructor(options: RequestOptions) {
    super()

    this.options = options
    this.request = request(this.getRequestOptions())
    this.promise = this.request
      .then(response => Promise.resolve(response.data))
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  private getRequestOptions() {
    return {
      ...this.options,
      onUploadProgress: (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      },
    }
  }

  cancel(): void {
    return this.request.cancel()
  }
}

const getRequestBody = (file: FileData, settings: Settings) => ({
  UPLOADCARE_PUB_KEY: settings.publicKey || '',
  signature: settings.secureSignature || '',
  expire: settings.secureExpire || '',
  UPLOADCARE_STORE: settings.doNotStore ? '' : 'auto',
  source: settings.source || 'local',
  file: file,
})

const getRequestOptions = (file: FileData, settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/base/',
    body: getRequestBody(file, settings),
  }, settings)
}

/**
 * Performs file uploading request to Uploadcare Upload API.
 * Can be canceled and has progress.
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {DirectUploadInterface}
 */
export default function base(file: FileData, settings: Settings = {}): DirectUploadInterface {
  const options = getRequestOptions(file, settings)

  return new DirectUpload(options)
}
