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

  renderHideHint() {
    return (
      <div className="d-flex align-items-start mb-2" style={{ cursor: 'default' }}>
        <div className="fw-semibold me-3">Профиль</div>
        <div className="d-flex align-items-start" style={{ color: 'blue', fontSize: '10px', lineHeight: '1.2' }}>
          <span className="me-1" style={{ fontSize: '22px', fontWeight: 'bold', lineHeight: '1' }}>↑</span>
          <span>нажми чтобы<br />скрыть панель</span>
        </div>
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
        {this.renderHideHint()}
        <div className="small">{me.name} ({me.login})</div>
        <div className="small">Роль: {me.role}{me.isAdmin ? ' (admin profile)' : ''}</div>
        <div className="mt-2">
          <Button color="secondary" size="sm" onClick={this.onLogout}>Выйти</Button>
        </div>
      </div>
    );
  }

  renderLogin() {
    return (
      <div>
        {this.renderHideHint()}
        <Form onSubmit={this.onSubmit}>
          <FormGroup className="mb-2">
            <Label for="login" hidden>Логин</Label>
            <Input
              type="text"
              name="login"
              id="login"
              placeholder="Логин"
              size="sm"
              value={this.state.login}
              onChange={this.onLoginChange}
              required
            />
          </FormGroup>
          <FormGroup className="mb-2">
            <Label for="password" hidden>Пароль</Label>
            <Input
              type="password"
              name="password"
              id="password"
              placeholder="Пароль"
              size="sm"
              value={this.state.password}
              onChange={this.onPasswordChange}
              required
            />
          </FormGroup>
          {this.state.error && <div className="text-danger small mb-2">{this.state.error}</div>}
          <Button color="primary" size="sm" block type="submit">Войти</Button>
        </Form>
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
