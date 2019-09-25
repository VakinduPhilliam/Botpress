import React, { Component } from 'react'
import {
  Row,
  Col,
  Button,
  Checkbox,
  Panel,
  Glyphicon
} from 'react-bootstrap'
import axios from 'axios'
import _ from 'lodash'
import classnames from 'classnames'
import moment from 'moment'

import PageHeader from '~/components/Layout/PageHeader'
import ContentWrapper from '~/components/Layout/ContentWrapper'

import styles from './style.scss'

class LoggerView extends Component {

  constructor(props) {
    super(props)
    this.state = { autoRefresh: true, logs: null, limit: 25, hasMore: false }
    this.toggleAutoRefresh = this.toggleAutoRefresh.bind(this)
    this.queryLogs = this.queryLogs.bind(this)
    this.loadMore = this.loadMore.bind(this)
  }

  componentDidMount() {
    if (!this.state.logs) {
      this.getArchiveKey()
      this.queryLogs()
      this.refreshInterval = setInterval(this.queryLogs, 1000)
    }
  }

  componentWillUnmount() {
    clearInterval(this.refreshInterval)
    this.setState({ cancelLoading: true })
  }

  loadMore() {
    this.setState({ limit: this.state.limit + 50, logs: null })
  }

  toggleAutoRefresh() {
    if (this.state.autoRefresh) {
      clearInterval(this.refreshInterval)
    } else {
      this.refreshInterval = setInterval(this.queryLogs, 1000)
    }

    this.setState({ autoRefresh: !this.state.autoRefresh })
  }

  renderLine(line, index) {
    const time = moment(new Date(line.timestamp)).format('MMM DD HH:mm:ss')
    const message = line.message.replace(/\[\d\d?m/ig, '')

    return <li key={`log_event_${index}`} className={styles.line}>
      <span className={styles.time}>{time}</span>
      <span className={styles['level-' + line.level]}>{line.level + ': '}</span>
      <span className={styles.message}>{message}</span>
    </li>
  }

  renderLoading() {
    return <div style={{ marginTop: '20px' }} className="whirl traditional"></div>
  }

  getArchiveKey() {
    axios.get('/api/logs/key')
    .then(({ data }) => this.setState({ archiveUrl: '/logs/archive/' + data.secret }))
  }

  queryLogs() {
    axios.get('/api/logs', {
      params: {
        limit: this.state.limit
      }
    })
    .then((result) => {
      if(this.state.cancelLoading) { return }
      this.setState({
        logs: result.data,
        hasMore: result.data && result.data.length >= this.state.limit
      })
    })
  }

  render() {
    const logs = (this.state.logs && this.state.logs.map(this.renderLine)) || this.renderLoading()
    const logsPanelClassName = classnames('panel', 'panel-default', styles['logs-panel'])
    const canLoadMore = this.state.limit < 500 && this.state.hasMore

    return <ContentWrapper>
      <PageHeader><span> Logs</span></PageHeader>
      <Panel className={styles.panel}>
        <form className="pull-left">
          <Checkbox className={styles['panel-checkbox']}
            checked={this.state.autoRefresh}
            inline onChange={this.toggleAutoRefresh}>
            Auto refresh
          </Checkbox>
        </form>
        <div className="pull-right">
          <Button href={this.state.archiveUrl}>Export logs archive</Button>
        </div>
      </Panel>
      <div className={logsPanelClassName}>
        <div className="panel-body">
          <ul className={styles.events}>
            {logs}
          </ul>
        </div>
        {
          canLoadMore &&
          <div href="#" className={styles['logs-panel-footer']} onClick={this.loadMore}>
            Load more
          </div>
        }
      </div>
    </ContentWrapper>
  }
}

export default LoggerView
