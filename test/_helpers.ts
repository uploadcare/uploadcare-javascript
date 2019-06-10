const dataUriToBuffer = require('data-uri-to-buffer')
import dataUriToBlob from 'dataurl-to-blob'

export const dataURItoBuffer: (uri: string) => Buffer = dataUriToBuffer
export const dataURItoBlob: (uri: string) => Blob = dataUriToBlob

export const isNode = (): boolean => {
  try {
    return Object.prototype.toString.call(global.process) === '[object process]'
  }
  catch (e) {
    return false
  }
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export enum Environment {
  Testing = 'testing',
  Production = 'production',
}

export const getSettingsForTesting = (settings = {}, environment: Environment | null = null) => {
  const selectedEnvironment = environment || process.env.NODE_ENV || Environment.Testing

  const allEnvironments = {
    testing: {
      baseCDN: 'http://localhost:3000',
      baseURL: 'http://localhost:3000',
      ...settings,
    },
    production: {
      baseCDN: 'https://ucarecdn.com',
      baseURL: 'https://upload.uploadcare.com',
      ...settings,
    }
  }

  return allEnvironments[selectedEnvironment]
}
