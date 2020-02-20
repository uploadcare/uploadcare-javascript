import WebSocket from '../tools/sockets.node'

import { FileInfo } from '../api/types'
import { Status } from '../api/fromUrlStatus'
import { Events } from './events'

type AllStatuses =
  | StatusErrorResponse
  | StatusProgressResponse
  | StatusSuccessResponse

type StatusProgressResponse = {
  status: Status.Progress
  done: number
  total: number
}

type StatusErrorResponse = {
  status: Status.Error
  msg: string
  url: string
}

type StatusSuccessResponse = {
  status: Status.Success
} & FileInfo

const response = (
  type: 'progress' | 'success' | 'fail',
  data: any
): AllStatuses => {
  if (type === 'success') {
    return { status: Status.Success, ...data } as StatusSuccessResponse
  }

  if (type === 'progress') {
    return { status: Status.Progress, ...data } as StatusProgressResponse
  }

  return { status: Status.Error, ...data } as StatusErrorResponse
}

type Message = {
  event: string
  data: { channel: string }
}

type EventTypes = {
  [key: string]: AllStatuses
} & {
  connected: undefined
} & {
  error: Error
}

class Pusher {
  key: string
  ws: WebSocket | undefined = undefined
  queue: Message[] = []
  isConnected = false
  subscribers = 0
  emmitter: Events<EventTypes> = new Events()

  constructor(pusherKey: string) {
    this.key = pusherKey
  }

  connect(): void {
    if (!this.isConnected && !this.ws) {
      const pusherUrl = `wss://ws.pusherapp.com/app/${this.key}?protocol=5&client=js&version=1.12.2`

      this.ws = new WebSocket(pusherUrl)

      this.ws.addEventListener('error', error => {
        this.emmitter.emit('error', new Error(error.message))
      })

      this.emmitter.on('connected', () => {
        this.isConnected = true
        this.queue.forEach(message => this.send(message.event, message.data))
        this.queue = []
      })

      this.ws.addEventListener('message', e => {
        const data = JSON.parse(e.data)

        switch (data.event) {
          case 'pusher:connection_established': {
            this.emmitter.emit('connected', undefined)
            break
          }

          case 'pusher:ping': {
            this.send('pusher:pong', {})
            break
          }

          case 'progress':
          case 'success':
          case 'fail': {
            this.emmitter.emit<string>(
              data.channel,
              response(data.event, JSON.parse(data.data))
            )
          }
        }
      })
    }
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = undefined
    this.isConnected = false
  }

  send(event: string, data: any): void {
    const str = JSON.stringify({ event, data })
    this.ws?.send(str)
  }

  subscribe(token: string, handler: (data: AllStatuses) => void): void {
    this.subscribers += 1
    this.connect()

    const channel = `task-status-${token}`
    const message = {
      event: 'pusher:subscribe',
      data: { channel }
    }

    this.emmitter.on(channel, handler)
    if (this.isConnected) {
      this.send(message.event, message.data)
    } else {
      this.queue.push(message)
    }
  }

  unsubscribe(token: string): void {
    this.subscribers -= 1

    const channel = `task-status-${token}`
    const message = {
      event: 'pusher:unsubscribe',
      data: { channel }
    }

    this.emmitter.off(channel)
    if (this.isConnected) {
      this.send(message.event, message.data)
    } else {
      this.queue = this.queue.filter(msg => msg.data.channel !== channel)
    }

    if (this.subscribers === 0) {
      this.disconnect()
    }
  }

  onError(callback: (error: Error) => void): () => void {
    this.emmitter.on('error', callback)

    return (): void => this.emmitter.off('error', callback)
  }
}

export default Pusher
