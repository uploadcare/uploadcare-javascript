import { cancelError } from '../../errors/errors'
import { RequestOptions, RequestResponse } from './types'

const request = ({
  method,
  url,
  data,
  headers = {},
  cancel,
  onProgress
}: RequestOptions): Promise<RequestResponse> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const requestMethod = method?.toUpperCase() || 'GET'
    let aborted = false

    xhr.open(requestMethod, url)

    if (headers) {
      Object.entries(headers).forEach(entry => {
        const [key, value] = entry
        typeof value !== 'undefined' &&
          !Array.isArray(value) &&
          xhr.setRequestHeader(key, value)
      })
    }

    xhr.responseType = 'json'

    if (cancel) {
      cancel.onCancel(() => {
        aborted = true
        xhr.abort()

        reject(cancelError())
      })
    }

    if (data) {
      xhr.send(data as FormData)
    } else {
      xhr.send()
    }

    xhr.onload = (): void => {
      if (xhr.status != 200) {
        // analyze HTTP status of the response
        reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`)) // e.g. 404: Not Found
      } else {
        const request = {
          method: requestMethod,
          url,
          data,
          headers: headers || undefined,
          cancel,
          onProgress
        }

        // Convert the header string into an array
        // of individual headers
        const headersArray = xhr
          .getAllResponseHeaders()
          .trim()
          .split(/[\r\n]+/)

        // Create a map of header names to values
        const responseHeaders = {}
        headersArray.forEach(function(line) {
          const parts = line.split(': ')
          const header = parts.shift()
          const value = parts.join(': ')

          if (header && typeof header !== 'undefined') {
            responseHeaders[header] = value
          }
        })
        resolve({
          request,
          data: xhr.response,
          headers: responseHeaders,
          status: xhr.status
        })
      }
    }

    xhr.onerror = (): void => {
      if (aborted) return

      // only triggers if the request couldn't be made at all
      reject(new Error('Network error'))
    }

    if (onProgress && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event: ProgressEvent): void => {
        const value = Math.round(event.loaded / event.total)
        onProgress(value)
      }
    }
  })

export default request
