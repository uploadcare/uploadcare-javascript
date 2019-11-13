export default class UnknownFromUrlStatusResponseError extends Error {
  constructor(response) {
    super()

    this.name = 'UnknownFromUrlStatusResponseError'
    this.message = `Unknown "from_url/status/" response: ${response}`

    Object.setPrototypeOf(this, UnknownFromUrlStatusResponseError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnknownFromUrlStatusResponseError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
