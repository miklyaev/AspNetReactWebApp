import { Component } from 'react';
import { apiClient } from '../api/client';
import './Home.css';
export class Home extends Component {
  static displayName = Home.name;

  constructor(props) {
    super(props);
    this.state = {
      leaders: [],
      executors: [],
      responsibleName: '',
      responsibleEmail: '',
      responsibleLogin: '',
      responsiblePassword: '',
      responsiblePosition: '',
      leaderErrors: {},
      executorName: '',
      executorEmail: '',
      executorLogin: '',
      executorPassword: '',
      executorPosition: '',
      executorErrors: {},
      loading: true,
      error: ''
    };
  }

  validateLeaderForm() {
    const errors = {};
    if (!this.state.responsibleName.trim()) errors.name = 'Имя обязательно';
    if (!this.state.responsibleEmail.trim()) errors.email = 'Email обязателен';
    if (!this.state.responsibleLogin.trim()) errors.login = 'Логин обязателен';
    if (!this.state.responsiblePassword.trim()) errors.password = 'Пароль обязателен';
    return errors;
  }

  validateExecutorForm() {
    const errors = {};
    if (!this.state.executorName.trim()) errors.name = 'Имя обязательно';
    if (!this.state.executorEmail.trim()) errors.email = 'Email обязателен';
    if (!this.state.executorLogin.trim()) errors.login = 'Логин обязателен';
    if (!this.state.executorPassword.trim()) errors.password = 'Пароль обязателен';
    return errors;
  }

  openEditModal(kind, employee) {
    this.setState({
      editModalOpen: true,
      editKind: kind,
      editId: employee.id,
      editName: employee.name ?? '',
      editEmail: employee.email ?? '',
      editLogin: employee.login ?? '',
      editPassword: '',
      editPosition: employee.position ?? '',
      showEditPassword: false,
    });
  }

  closeEditModal() {
    this.setState({
      editModalOpen: false,
      editKind: null,
      editId: null,
      editName: '',
      editEmail: '',
      editLogin: '',
      editPassword: '',
      editPosition: '',
      showEditPassword: false
    });
  }

  async handleApplyEdit() {
    const { editKind, editId, editName, editEmail, editLogin, editPassword, editPosition } = this.state;
    if (!editKind || editId == null) {
      return;
    }

    const payload = {
      name: editName,
      email: editEmail,
      login: editLogin,
      password: editPassword,
      position: editPosition
    };

    if (editKind === 'leader') {
      await apiClient.updateLeader(editId, payload);
    } else if (editKind === 'executor') {
      await apiClient.updateExecutor(editId, payload);
    }

    this.closeEditModal();
    await this.loadData();
  }

  async componentDidMount() {
    await this.loadData();
  }

  async handleDeleteLeader(id, name) {
    const safeName = (name ?? '').toString();
    if (!window.confirm(`Вы уверены что хотите удалить сотрудника ${safeName}?`)) {
      return;
    }
    await apiClient.deleteLeader(id);
    await this.loadData();
  }

  async loadData() {
    try {
      const [leaders, executors] = await Promise.all([
        apiClient.getLeaders(),
        apiClient.getExecutors()
      ]);

      this.setState({
        leaders,
        executors,
        loading: false,
        error: ''
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }
  async handleAddLeader(event) {
    event.preventDefault();

    const { responsibleName, responsibleEmail, responsibleLogin, responsiblePassword } = this.state;
    const { responsiblePosition } = this.state;
    const leaderErrors = this.validateLeaderForm();
    this.setState({ leaderErrors });
    if (Object.keys(leaderErrors).length > 0) return;

    await apiClient.createLeader({
      name: responsibleName.trim(),
      email: responsibleEmail.trim(),
      login: responsibleLogin.trim(),
      password: responsiblePassword.trim(),
      position: responsiblePosition.trim()
    });

    this.setState({ responsibleName: '', responsibleEmail: '', responsibleLogin: '', responsiblePassword: '', responsiblePosition: '', leaderErrors: {} });
    await this.loadData();
  }

  async handleDeleteExecutor(id, name) {
    const safeName = (name ?? '').toString();
    if (!window.confirm(`Вы уверены что хотите удалить сотрудника ${safeName}?`)) {
      return;
    }
    await apiClient.deleteExecutor(id);
    await this.loadData();
  }

  async handleAddExecutor(event) {
    event.preventDefault();

    const { executorName, executorEmail, executorLogin, executorPassword } = this.state;
    const { executorPosition } = this.state;
    const executorErrors = this.validateExecutorForm();
    this.setState({ executorErrors });
    if (Object.keys(executorErrors).length > 0) return;

    await apiClient.createExecutor({
      name: executorName.trim(),
      email: executorEmail.trim(),
      login: executorLogin.trim(),
      password: executorPassword.trim(),
      position: executorPosition.trim()
    });

    this.setState({ executorName: '', executorEmail: '', executorLogin: '', executorPassword: '', executorPosition: '', executorErrors: {} });
    await this.loadData();
  }

  render() {
    const {
      leaders,
      executors,
      responsibleName,
      responsibleEmail,
      responsibleLogin,
      responsiblePassword,
      responsiblePosition,
      executorName,
      executorEmail,
      executorLogin,
      executorPassword,
      executorPosition,
      loading,
      error
    } = this.state;

    const leaderErrors = this.state.leaderErrors || {};
    const executorErrors = this.state.executorErrors || {};
    const me = this.props.me;
    const isAdmin = me && me.isAuthenticated && me.isAdmin;
    const isLeader = me && me.isAuthenticated && me.role === 'Leader';
    const isExecutor = me && me.isAuthenticated && me.role === 'Executor';
    const canEditAll = isLeader || isAdmin;
    const canEditExecutors = isLeader || isExecutor || isAdmin;

    return (
      <div className="home-container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="main-title">Simple Jira</h1>
          {!isAdmin && !isLeader && !isExecutor && (
            <div style={{ color: 'red', fontSize: '14px' }}>
              Редактирование в гостевом профиле запрещено! Войдите в свой профиль.
            </div>
          )}
          {!isAdmin && isExecutor && (
            <div style={{ color: 'orange', fontSize: '14px' }}>
              Вы исполнитель. Ваши права на редактирование ограничены.
            </div>
          )}
        </div>
        <p className="mb-4 lead-text">
          Система управления задачами и временем. Минималистична. Связывает задачи с целями. Учитывает время без friction
        </p>
        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="section-block mt-4 leaders-block">
          <h3 className="section-title">Ответственные лица</h3>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Должность</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader) => (
                <tr key={leader.id}>
                  <td>{leader.name}</td>
                  <td>{leader.position}</td>
                  <td>{leader.email}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm me-2"
                      title="Редактировать"
                      onClick={() => this.openEditModal('leader', leader)}
                      disabled={!canEditAll}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      title="Удалить"
                      onClick={() => this.handleDeleteLeader(leader.id, leader.name)}
                      disabled={!canEditAll}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form className="row g-2 align-items-start mt-3" onSubmit={(e) => this.handleAddLeader(e)}>
            <div className="col-md-2">
              <input
                className={`form-control form-control-sm ${leaderErrors.name ? 'is-invalid' : ''}`}
                placeholder="Имя"
                value={responsibleName}
                onChange={(e) => this.setState({ responsibleName: e.target.value })}
                disabled={!canEditAll}
              />
            </div>
            <div className="col-md-2">
              <input
                className="form-control form-control-sm"
                placeholder="Должность"
                value={responsiblePosition}
                onChange={(e) => this.setState({ responsiblePosition: e.target.value })}
                disabled={!canEditAll}
              />
            </div>
            <div className="col-md-2">
              <input
                className={`form-control form-control-sm ${leaderErrors.email ? 'is-invalid' : ''}`}
                placeholder="Email"
                value={responsibleEmail}
                onChange={(e) => this.setState({ responsibleEmail: e.target.value })}
                disabled={!canEditAll}
              />
            </div>
            <div className="col-md-2">
              <input
                className={`form-control form-control-sm ${leaderErrors.login ? 'is-invalid' : ''}`}
                placeholder="Логин"
                value={responsibleLogin}
                onChange={(e) => this.setState({ responsibleLogin: e.target.value })}
                disabled={!canEditAll}
              />
            </div>
            <div className="col-md-2">
              <input
                type="password"
                className={`form-control form-control-sm ${leaderErrors.password ? 'is-invalid' : ''}`}
                placeholder="Пароль"
                value={responsiblePassword}
                onChange={(e) => this.setState({ responsiblePassword: e.target.value })}
                disabled={!canEditAll}
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary btn-sm w-100" disabled={!canEditAll}>Добавить</button>
            </div>
          </form>
        </div>

        <div className="section-block mt-5 executors-block">
          <h3 className="section-title">Исполнители</h3>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Должность</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {executors.map((executor) => (
                <tr key={executor.id}>
                  <td>{executor.name}</td>
                  <td>{executor.position}</td>
                  <td>{executor.email}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm me-2"
                      title="Редактировать"
                      onClick={() => this.openEditModal('executor', executor)}
                      disabled={!canEditExecutors}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      title="Удалить"
                      onClick={() => this.handleDeleteExecutor(executor.id, executor.name)}
                      disabled={!canEditExecutors}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form className="row g-2 align-items-start mt-3" onSubmit={(e) => this.handleAddExecutor(e)}>
            <div className="col-md-2">
              <input
                className={`form-control form-control-sm ${executorErrors.name ? 'is-invalid' : ''}`}
                placeholder="Имя"
                value={executorName}
                onChange={(e) => this.setState({ executorName: e.target.value })}
                disabled={!canEditExecutors}
              />
            </div>
            <div className="col-md-2">
              <input
                className="form-control form-control-sm"
                placeholder="Должность"
                value={executorPosition}
                onChange={(e) => this.setState({ executorPosition: e.target.value })}
                disabled={!canEditExecutors}
              />
            </div>
            <div className="col-md-2">
              <input
                className={`form-control form-control-sm ${executorErrors.email ? 'is-invalid' : ''}`}
                placeholder="Email"
                value={executorEmail}
                onChange={(e) => this.setState({ executorEmail: e.target.value })}
                disabled={!canEditExecutors}
              />
            </div>
            <div className="col-md-2">
              <input
                className={`form-control form-control-sm ${executorErrors.login ? 'is-invalid' : ''}`}
                placeholder="Логин"
                value={executorLogin}
                onChange={(e) => this.setState({ executorLogin: e.target.value })}
                disabled={!canEditExecutors}
              />
            </div>
            <div className="col-md-2">
              <input
                type="password"
                className={`form-control form-control-sm ${executorErrors.password ? 'is-invalid' : ''}`}
                placeholder="Пароль"
                value={executorPassword}
                onChange={(e) => this.setState({ executorPassword: e.target.value })}
                disabled={!canEditExecutors}
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary btn-sm w-100" disabled={!canEditExecutors}>Добавить</button>
            </div>
          </form>
        </div>

        {
          this.state.editModalOpen && (
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Редактирование сотрудника</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => this.closeEditModal()} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Имя</label>
                      <input className="form-control" value={this.state.editName} onChange={(e) => this.setState({ editName: e.target.value })} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Email</label>
                      <input className="form-control" value={this.state.editEmail} onChange={(e) => this.setState({ editEmail: e.target.value })} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Должность</label>
                      <input className="form-control" maxLength={128} value={this.state.editPosition} onChange={(e) => this.setState({ editPosition: e.target.value })} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Логин</label>
                      <input className="form-control" maxLength={12} value={this.state.editLogin} onChange={(e) => this.setState({ editLogin: e.target.value })} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Пароль</label>
                      <div className="input-group">
                        <input
                          className="form-control"
                          type={this.state.showEditPassword ? 'text' : 'password'}
                          maxLength={12}
                          value={this.state.editPassword}
                          onChange={(e) => this.setState({ editPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => this.setState({ showEditPassword: !this.state.showEditPassword })}
                          title={this.state.showEditPassword ? 'Скрыть пароль' : 'Показать пароль'}
                        >
                          {this.state.showEditPassword ? '🙈' : '👁'}
                        </button>
                      </div>
                      <div className="form-text">Оставьте пустым, чтобы не менять пароль</div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => this.closeEditModal()}>Отмена</button>
                    <button type="button" className="btn btn-primary" onClick={() => this.handleApplyEdit()} disabled={!canEditExecutors}>Применить</button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        {this.state.editModalOpen && <div className="modal-backdrop fade show" />}
      </div >
    );
  }
}
