import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
import { ProfilePanel } from './ProfilePanel';

export class Layout extends Component {
  static displayName = Layout.name;

  render() {
    return (
      <div>
        <NavMenu />
        <Container tag="main">
          <div className="d-flex gap-3">
            <div className="flex-grow-1">
              {this.props.children}
            </div>
            <div style={{ width: '300px' }}>
              <ProfilePanel />
            </div>
          </div>
        </Container>
      </div>
    );
  }
}
