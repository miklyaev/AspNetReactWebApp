import React, { Component } from 'react';
import { apiClient } from '../api/client';

export class GuestModeBlocker extends Component {
  static displayName = GuestModeBlocker.name;

  componentDidMount() {
    this.applyGuestMode();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.enabled !== this.props.enabled) {
      this.applyGuestMode();
    }
  }

  applyGuestMode() {
    const enabled = !!this.props.enabled;

    if (enabled) {
      window.__guestMode = true;
      apiClient.setGuestMode(true);
    } else {
      window.__guestMode = false;
      apiClient.setGuestMode(false);
    }
  }

  render() {
    return null;
  }
}
