import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
import { ProfilePanel } from './ProfilePanel';

export class Layout extends Component {
  static displayName = Layout.name;

  constructor(props) {
    super(props);

    this.state = {
      isProfileOpen: false,
      me: null
    };

    this.toggleProfile = this.toggleProfile.bind(this);
    this.handleMeChanged = this.handleMeChanged.bind(this);
  }

  toggleProfile() {
    this.setState((prev) => ({ isProfileOpen: !prev.isProfileOpen }));
  }

  handleMeChanged(me) {
    this.setState({ me });
  }

  render() {
    const sidebarWidth = this.state.isProfileOpen ? 240 : 0;

    return (
      <div>
        <NavMenu
          onToggleProfile={this.toggleProfile}
          me={this.state.me}
          isProfileOpen={this.state.isProfileOpen}
        />
        <Container tag="main">
          <div className="d-flex gap-3">
            <div className="flex-grow-1">
              {this.props.children}
            </div>

            <div
              style={{
                width: `${sidebarWidth}px`,
                transition: 'width 150ms ease',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: '240px',
                  borderLeft: '1px solid #e9ecef',
                  paddingLeft: '12px'
                }}
              >
                <ProfilePanel onMeChanged={this.handleMeChanged} />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }
}
