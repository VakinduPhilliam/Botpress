import EventEmmiter from 'eventemitter2'
import ms from 'ms'
import _ from 'lodash'
import Promise from 'bluebird'

import { matches } from './listeners'

const INTERVAL_MSGS = 5000

const formatMessage = (msg, initialEvent) => {
  if (typeof msg === 'string') {
    return {
      platform: initialEvent.platform,
      user: initialEvent.user,
      type: 'text',
      text: msg,
      raw: {
        user: initialEvent.user,
        message: msg
      }
    }
  } else if (typeof msg === 'function') {
    // This is a 'wrapped' or 'delayed' execution message
    // It is going to be evaluated at send time, this this has a risk of failing
    // If the function execution fails
    return msg
  } else {
    if (msg && msg.type && msg.platform && msg.text) {
      return msg
    } else {
      throw new Error('Invalid message: ', msg)
    }
  }
}

const formatBloc = (blocName, data = {}) => {
  if (!_.isString(blocName)) {
    throw new Error('Invalid bloc name, espected string')
  }

  return {
    isBloc: true,
    bloc: blocName,
    data: data
  }
}

const isBlocCall = args => {
  return _.isString(args[0]) && args[0].startsWith('#')
}

const validateHandlers = handlers => {
  if (_.isFunction(handlers)) {
    return [{
      default: true,
      callback: handlers
    }]
  }

  if (!_.isArray(handlers)) {
    throw new Error('Invalid handler(s) for question, expected a function or an array of handlers (see doc).')
  }

  return handlers
}

class Thread extends EventEmmiter {

  constructor(name, bp, convo) {
    super()
    this.initialEvent = convo.initialEvent
    this.name = name
    this.bp = bp
    this.convo = convo
    this.queue = [] // Queue of messages and questions to say / ask next
    this.archive = [] // Archive of unqueued questions. We store them so we can re-create (restart) the thread.
    this.waiting = false // Thread is waiting when it asked for a question
    this._last = null
  }

  enqueue(message) {
    this.queue.push(message)
    this.archive.push(message)
  }

  addMessage(msg) {
    if (isBlocCall(arguments)) {
      // Add bloc
      const blocName = arguments[0]
      const blocData = arguments[1]

      return this.enqueue({
        type: 'message',
        message: formatBloc(blocName, blocData)
      })
    }

    // Add raw message
    const message = formatMessage(msg, this.initialEvent)
    this.enqueue({
      type: 'message',
      message: message
    })
  }

  // Two signatures possible:
  // msg, handlers
  // bloc, data, handlers
  addQuestion(msg) {
    const handlers = validateHandlers(_.last(arguments))

    if (isBlocCall(arguments)) {
      // Add bloc question
      const blocName = arguments[0]
      const blocData = arguments.length >= 3 // Because of handlers and data is optional
        ? arguments[1]
        : null

      return this.enqueue({
        type: 'question',
        message: formatBloc(blocName, blocData),
        handlers: handlers
      })
    }
    
    // Add raw message question
    const message = formatMessage(msg, this.initialEvent)

    this.enqueue({
      type: 'question',
      message: message,
      handlers: handlers
    })
  }

  peek() {
    return this.queue.length > 0 ? this.queue[0] : null
  }

  dequeue() {
    const msg = this.queue.shift()

    this._last = msg
    this.waiting = msg && msg.type === 'question'

    if (!msg) {
      this.emit('done')
    }

    return msg
  }

  process(event) {
    const handlers = (this.waiting && this._last && this._last.handlers) || []

    for (let handler of handlers) {
      if (handler.pattern && matches(handler.pattern, event)) {
        if (_.isRegExp(handler.pattern)) {
          const match = handler.pattern.exec(event.text)
          if (match) {
            event.match = match[1]
          }
        }

        handler.callback && handler.callback(event)
        return // Interrupt further processing
      }
    }

    const defaultHandler = _.find(handlers, { default: true })

    defaultHandler && defaultHandler.callback && defaultHandler.callback(event)
  }

  repeat() {
    return this._last && this._last.message
  }

  restart() {
    this.queue = this.archive.map(i => i)
    this._last = null
    this.waiting = false
  }
}

class Conversation extends EventEmmiter {

  constructor({ initialEvent, middleware, logger, messageTypes, clockSpeed = 500 }) {
    super()
    this.logger = logger
    this.middleware = middleware
    this.initialEvent = initialEvent
    this._threads = {}
    this.currentThread = null
    this.defaultThread = this.createThread('default')
    this.status = 'new'
    this.get = this._get
    this.set = this._set
    this._cache = {}
    this.intervalBetweenMessages = INTERVAL_MSGS
    this._timeoutHandle = null
    this._timeoutInterval = ms('5 minutes')
    this._useTimeout = false
    this._clock = setInterval(::this.tick, clockSpeed)
    this._clockSpeed = clockSpeed
    this._processing = false
    this._sendLock = false
    this.messageTypes = messageTypes || ['message', 'text', 'quick_reply']
    this._outgoing = []
    this.endWhenDone = true

    this.sendNext() // Infinite loop. Must be called only once.
  }

  get threads() {
    return Object.assign({}, this._threads)
  }

  async sendNext() {
    if (this._sendLock) {
      return
    } else {
      this._sendLock = true
    }

    try {
      const msg = this._outgoing.shift()

      if (msg) {

        if (msg.isBloc === true) {
          // Send bloc
          if (!this.initialEvent || !this.initialEvent.reply) {
            throw new Error("Convo doesn't have default event or does not support UMM")
          }

          let data = msg.data

          if (_.isFunction(data)) {
            data = await Promise.resolve(data())
          }

          await Promise.resolve(this.initialEvent.reply(msg.bloc, data))
        } else {
          // Raw message
          await Promise.resolve(this.middleware
          && this.middleware.sendOutgoing 
          && this.middleware.sendOutgoing(msg))
        }
      }

      await Promise.delay(this._clockSpeed)
      
      if (this.status === 'active' || this._outgoing.length > 0) {
        setImmediate(::this.sendNext)
      }
    } finally {
      this._sendLock = false
    }
  }

  teardown() {
    // Dispose of timeouts and intervals
    clearInterval(this._clock)
    this.clearTimeout()
    this.status = 'destroyed'
  }

  getCurrentThread() {
    return this._threads[this.currentThread]
  }

  tick() {
    const thread = this.getCurrentThread()
    if (this.status === 'active' && !thread.waiting && !!thread.peek()) {
      this.next()
    }
  }

  clearTimeout() {
    if (this._timeoutHandle) {
      this.clearTimeout(this._timeoutHandle)
    }
  }

  resetTimeout() {
    this.clearTimeout()

    this._timeoutHandle = this._useTimeout && setTimeout(() => {
      // TODO If there's a timeout thread, switch to it
      this.emit('timeout')
    }, this._timeoutInterval)
  }

  createThread(name) {
    const thread = new Thread(name, this.bp, this)
    this._threads[name] = thread

    if (!this.currentThread) {
      this.currentThread = name
    }

    return thread
  }

  async switchTo(name, restart = true) {
    if (this.currentThread === name) {
      return // Don't switch if it's already the current thread
    }

    if (!this._threads[name]) {
      throw new Error(`Thread "${name}" doesn't exist`)
    }

    const before = await this.emitAsync('beforeSwitch', name)
    if (_.some(before, a => a === false)) {
      return // Aborted thread switch
    }

    this.currentThread = name

    if (restart) {
      const thread = this.getCurrentThread()
      thread && thread.restart()
    }

    this.emit('switched', name)
  }

  next() {
    const thread = this.getCurrentThread()
    const msg = thread.dequeue()
    if (msg) {
      let message = msg.message

      if (typeof message === 'function') {
        // Executes (unwrap) the message on the fly
        message = msg.message()
      }

      this.say(message, this.initialEvent)
    } else {
      this.endWhenDone && this.stop('done')
    }
  }

  async processIncoming(event) {

    if (!_.includes(this.messageTypes, event.type)) {
      return
    }

    this._timeoutHandle && this.resetTimeout()
    const before = await this.emitAsync('beforeProcessing', event)
    if (_.some(before, a => a === false)) {
      return
    }

    const thread = this.getCurrentThread()
    thread && thread.waiting && thread.process(event)
  }

  setTimeout(timeout) {
    this._useTimeout = true
    this._timeoutInterval = typeof timeout === 'number' ? timeout : ms(timeout)
    this.resetTimeout()
  }

  async say(msg) {
    let message = null

    if (msg && msg.isBloc === true) {
      message = msg
    } else {
      message = isBlocCall(arguments)
        ? formatBloc(...arguments)
        : formatMessage(msg)
    }

    this._outgoing.push(message)

    if (this.status !== 'active') {
      this.sendNext() // restart sending process once
    }
  }

  activate() {
    if (this.status === 'new') {
      this.status = 'active'
      this.emit('activated')
    } else {
      throw new Error('Conversation was already activated')
    }
  }

  getStatus() {
    return this.status
  }

  _get(name) {
    return this._cache[name]
  }

  _set(name, value) {
    this._cache[name] = value
  }

  async repeat() {
    const thread = this._threads[this.currentThread]
    const msg = thread && thread.repeat()

    if (msg) {
      return this.say(msg)
    }
  }

  stop(reason) {
    this.status = reason
    this.emit(reason)

    if (reason !== 'stop') {
      this.emit('stop', reason)
    }
    this.teardown()
  }
}

module.exports = ({ logger, middleware, clockSpeed = 500 }) => {
  let convos = []

  const belongsToConvo = (convo, event) => {
    const initial = convo.initialEvent

    return convo.initialEvent.platform === event.platform
      && _.get(initial, 'user.id', '') === _.get(event, 'user.id', '')
  }

  middleware.register({
    name: 'conversations',
    type: 'incoming',
    order: 25,
    module: 'botpress',
    description: 'Built-in conversation flow manager',
    handler: function(event, next) {

      // Clean up and free from memory ended conversations
      convos = _.filter(convos, c => {
        return _.includes(['new', 'active'], c.status)
      })

      for (let convo of convos) {
        if (belongsToConvo(convo, event) && convo.status === 'active') {
          convo.processIncoming(event)
          return // Stop the processing, only one convo per event. Swallow the event
        }
      }

      next && next() // Don't swallow the event
    }
  })

  const validateEvent = event => {
    if (!event || !event.type || !event.platform) {
      throw new Error('You need to pass an original incoming event to start a conversation')
    }
  }

  function start(event, callback) {
    const convo = create(event)
    callback && callback(convo)

    convo.activate()
    return convo
  }

  function create(event) {
    validateEvent(event)
    const convo = new Conversation({
      logger,
      middleware,
      clockSpeed,
      initialEvent: event
    })
    convos.push(convo)
    return convo
  }

  function find(event) {
    for (let convo of convos) {
      if (belongsToConvo(convo, event) && convo.status === 'active') {
        return convo
      }
    }
  }

  function destroy() {
    for (let convo of convos) {
      convo.teardown()
    }

    convos = []
  }

  return { start, create, find, destroy }
}
