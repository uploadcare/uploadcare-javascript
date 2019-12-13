import { prepareOptions } from '../request/prepareOptions'
import { getFileSize } from './getFileSize'
import defaultSettings from '../../defaultSettings'

/* Types */
import { Body, RequestOptionsInterface } from '../request/types'
import { FileData, SettingsInterface } from '../../types'
import { MultipartStartResponse } from './types'
import { CancelableThenableInterface } from '../../thenable/types'
import { CancelableThenable } from '../../thenable/CancelableThenable'
import { CancelHookInterface } from '../../lifecycle/types'

const getRequestBody = (file: FileData, settings: SettingsInterface): Body => {
  const size: number = getFileSize(file)

  return {
    filename: settings.fileName || defaultSettings.fileName,
    size,
    partSize: settings.multipartChunkSize || defaultSettings.multipartChunkSize,
    content_type: 'application/octet-stream',
    UPLOADCARE_STORE:
      typeof settings.store === 'undefined'
        ? 'auto'
        : settings.store
        ? 1
        : undefined,
    UPLOADCARE_PUB_KEY: settings.publicKey || '',
    signature: settings.secureSignature || '',
    expire: settings.secureExpire || '',
    source: 'local'
  }
}

const getRequestOptions = (
  file: FileData,
  settings: SettingsInterface
): RequestOptionsInterface => {
  return prepareOptions(
    {
      method: 'POST',
      path: '/multipart/start/',
      body: getRequestBody(file, settings)
    },
    settings
  )
}

/**
 * Start multipart uploading.
 *
 * @param {FileData} file
 * @param {SettingsInterface} settings
 * @param {CancelHookInterface} hooks
 * @return {CancelableThenableInterface<MultipartStartResponse>}
 */
export default function multipartStart(
  file: FileData,
  settings: SettingsInterface = {},
  hooks?: CancelHookInterface
): CancelableThenableInterface<MultipartStartResponse> {
  const options = getRequestOptions(file, settings)

  return new CancelableThenable<MultipartStartResponse>(options, hooks)
}
