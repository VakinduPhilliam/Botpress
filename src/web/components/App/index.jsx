import React, { Component } from 'react'
import { Provider } from 'nuclear-js-react-addons'

import { authEvents } from '~/util/Auth'
import EventBus from '~/util/EventBus'
import routes from '../Routes'

import reactor from '~/reactor'
import actions from '~/actions'
import {
  ModulesStore,
  NotificationsStore,
  UIStore,
  BotStore,
  LicenseStore,
  UserStore,
  RulesStore
} from '~/stores'

export default class App extends Component {

  constructor(props) {
    super(props)
    reactor.registerStores({
      'modules': ModulesStore,
      'notifications': NotificationsStore,
      'UI': UIStore,
      'botInformation': BotStore,
      'license': LicenseStore,
      'user': UserStore,
      'rules': RulesStore
    })

    this.state = {
      events: EventBus.default
    }

    if (window.APP_NAME) {
      window.document.title = window.APP_NAME
    }

    EventBus.default.setup()
  }

  fetchData() {
    actions.fetchModules()
    actions.fetchNotifications()
    actions.fetchBotInformation()
    actions.fetchLicense()
    
    if (window.AUTH_ENABLED) {
      actions.fetchUser()
      actions.fetchRules()
    }
  }

  componentDidMount() {
    // This acts as the app lifecycle management.
    // If this grows too much, move to a dedicated lifecycle manager.
    this.fetchData()

    authEvents.on('login', this.fetchData)
    authEvents.on('new_token', this.fetchData)

    EventBus.default.on('notifications.all', (notifications) => {
      actions.replaceNotifications(notifications)
    })

    EventBus.default.on('notifications.new', (notification) => {
      actions.addNotifications([notification])
    })

    this.fetchModulesInterval = setInterval(actions.fetchModules, 10000)
  }

  componentWillUnmount() {
    clearInterval(this.fetchModulesInterval)
  }

  render() {
    return (
      <Provider reactor={reactor}>
        {routes()}
      </Provider>
    )
  }
}
