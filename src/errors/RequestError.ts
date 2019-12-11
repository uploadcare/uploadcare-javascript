import {ErrorRequestInfo, ErrorResponseInfo} from './types'

export default class RequestError extends Error {
  readonly request: ErrorRequestInfo
  readonly response: ErrorResponseInfo

  constructor(request: ErrorRequestInfo, response: ErrorResponseInfo) {
    super()

    this.name = 'RequestError'
    this.message = `[${response.status}] ${response.statusText}`
    this.request = request
    this.response = response

    Object.setPrototypeOf(this, RequestError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
