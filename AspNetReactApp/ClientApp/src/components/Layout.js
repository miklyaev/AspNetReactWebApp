import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
import { ProfilePanel } from './ProfilePanel';
import { apiClient } from '../api/client';
export class Layout extends Component {
  static displayName = Layout.name;

  constructor(props) {
    super(props);

    this.state = {
      isProfileOpen: false,
      me: null,
      renderTick: 0
    };

    this.toggleProfile = this.toggleProfile.bind(this);
    this.handleMeChanged = this.handleMeChanged.bind(this);
  }

  componentDidMount() {
    this.refreshMe();
  }

  async refreshMe() {
    try {
      const me = await apiClient.me();
      this.setState({ me });
    } catch (e) {
      this.setState({ me: null });
    }
  }

  toggleProfile() {
    this.setState((prev) => ({ isProfileOpen: !prev.isProfileOpen }));
  }

  handleMeChanged(me) {
    console.log('Layout.handleMeChanged - me:', me);
    this.setState((prev) => ({ me, renderTick: (prev.renderTick || 0) + 1 }), () => {
      console.log('Layout after setState - me:', this.state.me, 'renderTick:', this.state.renderTick);
      try {
        this.forceUpdate();
      } catch (e) {
        console.error('forceUpdate error', e);
      }
    });
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
              {React.Children.map(this.props.children, (child, idx) => {
                if (!React.isValidElement(child)) return child;

                // If child has route children (Routes), clone each Route and inject `me` into its `element` prop.
                if (child.props && child.props.children) {
                  const newChildren = React.Children.map(child.props.children, (routeChild) => {
                    if (!React.isValidElement(routeChild)) return routeChild;
                    // For <Route ... element={...} /> inject me into element
                    if (routeChild.props && routeChild.props.element) {
                      const element = routeChild.props.element;
                      const newElement = React.isValidElement(element)
                        ? React.cloneElement(element, { me: this.state.me })
                        : element;
                      return React.cloneElement(routeChild, { element: newElement });
                    }
                    return routeChild;
                  });

                  return React.cloneElement(child, { children: newChildren, key: `child-${idx}-tick-${this.state.renderTick}` });
                }

                // Fallback: clone element and attach me directly
                return React.cloneElement(child, { me: this.state.me, key: `child-${idx}-tick-${this.state.renderTick}` });
              })}
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
