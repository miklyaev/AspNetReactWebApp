import React, { Component } from 'react';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import { apiClient } from '../api/client';

export class ProfilePanel extends Component {
  static displayName = ProfilePanel.name;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      me: null,
      profile: null,
      login: '',
      password: '',
      error: null
    };

    this.onLoginChange = this.onLoginChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  componentDidMount() {
    this.load();
  }

  notifyMeChanged(me) {
    if (this.props.onMeChanged) {
      this.props.onMeChanged(me);
    }
  }

  async load() {
    try {
      const me = await apiClient.me();
      console.log('ProfilePanel.load() - me:', me);
      let profile = null;
      if (me && me.isAuthenticated) {
        try {
          profile = await apiClient.getProfile();
        } catch (e) {
          profile = null;
        }
      }

      this.setState({ loading: false, me, profile, error: null }, () => {
        console.log('ProfilePanel after setState - me:', this.state.me);
        this.notifyMeChanged(me);
      });
    } catch (e) {
      console.error('ProfilePanel.load() error:', e);
      this.setState({ loading: false, error: e.message });
    }
  }

  onLoginChange(e) {
    this.setState({ login: e.target.value });
  }

  onPasswordChange(e) {
    this.setState({ password: e.target.value });
  }

  async onSubmit(e) {
    e.preventDefault();
    this.setState({ error: null });

    try {
      await apiClient.login({ login: this.state.login, password: this.state.password });
      this.setState({ login: '', password: '' });
      await this.load();
    } catch (err) {
      this.setState({ error: err.message || 'Login failed' });
    }
  }

  async onLogout() {
    this.setState({ error: null });
    try {
      await apiClient.logout();
      await this.load();
    } catch (err) {
      this.setState({ error: err.message || 'Logout failed' });
    }
  }

  renderLogin() {
    return (
      <div>
        <div className="fw-semibold mb-2">Профиль</div>
        <Form onSubmit={this.onSubmit}>
          <FormGroup className="mb-2">
            <Label className="small" for="profile_login">Логин</Label>
            <Input id="profile_login" value={this.state.login} onChange={this.onLoginChange} />
          </FormGroup>
          <FormGroup className="mb-2">
            <Label className="small" for="profile_password">Пароль</Label>
            <Input id="profile_password" type="password" value={this.state.password} onChange={this.onPasswordChange} />
          </FormGroup>
          <Button color="primary" size="sm" type="submit">Войти</Button>
        </Form>
        {this.state.error ? <div className="text-danger small mt-2">{this.state.error}</div> : null}
      </div>
    );
  }

  renderMe() {
    const me = this.state.me;
    if (!me) {
      return null;
    }

    return (
      <div>
        <div className="fw-semibold mb-2">Профиль</div>
        <div className="small">{me.name} ({me.login})</div>
        <div className="small">Роль: {me.role}{me.isAdmin ? ' (admin profile)' : ''}</div>
        <div className="mt-2">
          <Button color="secondary" size="sm" onClick={this.onLogout}>Выйти</Button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.loading) {
      return <div className="small text-muted">Загрузка...</div>;
    }

    const me = this.state.me;
    if (!me || !me.isAuthenticated) {
      return this.renderLogin();
    }

    return this.renderMe();
  }
}
