
import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import MiddlewaresComponent from '~/components/Middlewares'

import Markdown from 'react-markdown'

import { Grid, Row, Col, Panel } from 'react-bootstrap'

const style = require('./style.scss')

const documentation = `
  #### **Documentation**

  A middleware chain is simply a collection of middleware functions that are called in a predertermined order.
  
  Every middleware has to be registered to appear and you will be able to  do so with the \`bp.middlewares.register()\` method.

  For more details about middleware, look at the [documentation](https://docs.botpress.io/creating-your-bot/understanding-the-middlewares.html).
  
  ##### **Ordering middleware**

  All middleware functions that are registered (usually every modules are registered in their initialization). You must load them using \`bp.middlewares.load()\` in your \`index.js\`, which will create the incoming and outgoing chains automatically.

  By default, middleware functions are ordered by ascending order according to their \`order\` property set on registration. The order can then be manually overwritten here by using **drag-n-drop**.

  You can also re-order them programmatically using middleware function customizations.
  `

export default class ManageView extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      collapse: true
    }
  }

  getDocumentation() {
    if (this.state.collapse) {
      return documentation.substring(0, 194) + "..."
    }
    return documentation
  }

  getReadMore() {
    return this.state.collapse ? 'Read more' : 'Hide'
  }

  handleReadMore(event) {
    this.setState({
      collapse: !this.state.collapse
    })

    event.preventDefault()
    event.stopPropagation()
  }

  render() {
    return (
      <ContentWrapper>
        <PageHeader><span> Middleware</span></PageHeader>
        <Grid fluid>
          <Row>
            <Panel className={style.documentation}>
              <Row className={style.explication}>
                <Col sm={12}>
                  <Markdown source={this.getDocumentation()} />
                  <div>
                    <a href="#" onClick={::this.handleReadMore}>{this.getReadMore()}</a>
                  </div>
                </Col>
              </Row>
            </Panel>
          </Row>
          <Row>
            <Col sm={12} md={6} mdOffset={0}>
              <MiddlewaresComponent type="incoming"/>
            </Col>
            <Col sm={12} md={6} mdOffset={0}>
              <MiddlewaresComponent type="outgoing"/>
            </Col>
          </Row>
        </Grid>
      </ContentWrapper>
    )
  }
}
