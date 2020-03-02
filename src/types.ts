/**
 * Make all properties in T optional
 */
type Partial<T> = {
  [P in keyof T]?: T[P]
}

export interface DefaultSettings {
  baseCDN: string
  baseURL: string
  maxContentLength: number
  retryThrottledRequestMaxTimes: number
  multipartMinFileSize: number
  multipartChunkSize: number
  multipartMinLastPartSize: number
  maxConcurrentRequests: number
  pollingTimeoutMilliseconds: number
  contentType: string
  pusherKey: string
}

export interface Settings extends Partial<DefaultSettings> {
  publicKey?: string
  fileName?: string
  store?: boolean
  secureSignature?: string
  secureExpire?: string
  integration?: string
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  source?: string
  jsonpCallback?: string
}
