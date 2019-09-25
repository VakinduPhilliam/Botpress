import React, { Component } from 'react'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import classnames from 'classnames'

import headerStyle from './Header.scss'
import style from './SidebarHeader.scss'

export default class SidebarHeader extends Component {
  render() {
    const headerClass = classnames(style.header, headerStyle.navbar, 'bp-sidebar-header')

    return <Navbar inverse className={headerClass}>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="/" className={classnames(style.logo, 'bp-logo')}>
            <img src="/img/logo.png" alt="Botpress Logo"/>
          </a>
        </Navbar.Brand>
        <Navbar.Toggle/>
      </Navbar.Header>
    </Navbar>
  }
}
