import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Modal,
  Button
} from 'react-bootstrap'

import { connect } from 'nuclear-js-react-addons'

import getters from '~/stores/getters'
import actions from '~/actions'

import style from './style.scss'

@connect(props => ({
  license : getters.license
}))

class License extends Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = { loading: true }
    
    this.handleClose = this.handleClose.bind(this)
  }

  componentDidMount () {
    this.setState({
      loading: false
    })
  }

  handleClose() {
    actions.toggleLicenseModal()
  }


  renderLicenseTextArea() {
    return (
      <div>
        <textarea readOnly={true} className={style.textArea} value={this.props.license.get('text')}/>
      </div>
    )
  }

  renderCancelButton() {
    return <Button onClick={this.handleClose}>Close</Button>
  }

  render() {
    if(this.state.loading) {
      return null
    }

    return (
      <Modal show={this.props.opened} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.license.get('name')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderLicenseTextArea()}
        </Modal.Body>
        <Modal.Footer>
          {this.renderCancelButton()}
        </Modal.Footer>
      </Modal>
    )
  }
}

License.contextTypes = {
  reactor: PropTypes.object.isRequired
}

export default License
