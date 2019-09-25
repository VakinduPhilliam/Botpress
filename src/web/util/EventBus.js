/* global io */

import EventEmitter2 from 'eventemitter2'

import { getToken, authEvents } from '~/util/Auth'

class EventBus extends EventEmitter2 {

  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })

    this.dispatchSocketEvent = this.dispatchSocketEvent.bind(this)
    this.setup = this.setup.bind(this)

    this.onAny(this.dispatchClientEvent)

    authEvents.on('new_token', this.setup)
  }

  dispatchSocketEvent(event) {
    this.emit(event.name, event.data, 'server')
  }

  dispatchClientEvent(name, data, from) {
    if (from === 'server') {
      // we sent this event ourselves
      return
    }

    if (this.socket) {
      this.socket.emit('event', { name, data: data })
    }
  }

  setup() {
    let query = ''
    if (window.AUTH_ENABLED) {
      const token = getToken()
      if (!!token) {
        query = 'token=' + token.token
      }
    }

    if (this.socket) {
      this.socket.off('event', this.dispatchEvent)
      this.socket.disconnect()
    }

    let socketUrl = window.location.origin
    const socket = this.socket = io.connect(socketUrl, { query })
    socket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
