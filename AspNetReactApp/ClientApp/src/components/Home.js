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
      // Send password as-is: backend treats empty string as "no change",
      // and will hash & save when a value is provided.
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
    return (
      <div className="home-container">
        <h1 className="mb-3 main-title">Simple Jira</h1>
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
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => this.handleDeleteLeader(leader.id, leader.name)}
                    title="Удалить"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>

          <form className="row g-2" onSubmit={(event) => this.handleAddLeader(event)}>
           <div className="col-md-2">
             <input
               className={`form-control ${leaderErrors.name ? 'is-invalid' : ''}`}
               placeholder="Имя ответственного"
               value={responsibleName}
               onChange={(event) => this.setState({ responsibleName: event.target.value })}
             />
             {leaderErrors.name && <div className="invalid-feedback">{leaderErrors.name}</div>}
           </div>
          <div className="col-md-2">
            <input
               className={`form-control ${leaderErrors.email ? 'is-invalid' : ''}`}
              placeholder="Email ответственного"
              value={responsibleEmail}
              onChange={(event) => this.setState({ responsibleEmail: event.target.value })}
            />
             {leaderErrors.email && <div className="invalid-feedback">{leaderErrors.email}</div>}
          </div>
          <div className="col-md-2">
            <input
               className={`form-control ${leaderErrors.login ? 'is-invalid' : ''}`}
              placeholder="Логин"
              maxLength={12}
              value={responsibleLogin}
              onChange={(event) => this.setState({ responsibleLogin: event.target.value })}
            />
             {leaderErrors.login && <div className="invalid-feedback">{leaderErrors.login}</div>}
          </div>
          <div className="col-md-2">
            <input
               className={`form-control ${leaderErrors.password ? 'is-invalid' : ''}`}
              type="password"
              placeholder="Пароль"
              maxLength={12}
              value={responsiblePassword}
              onChange={(event) => this.setState({ responsiblePassword: event.target.value })}
            />
             {leaderErrors.password && <div className="invalid-feedback">{leaderErrors.password}</div>}
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Должность"
              maxLength={128}
              value={responsiblePosition}
              onChange={(event) => this.setState({ responsiblePosition: event.target.value })}
            />
          </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary home-btn-compact">Добавить</button>
            </div>
          </form>
        </div>

        <div className="section-block mt-4">
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
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => this.handleDeleteExecutor(executor.id, executor.name)}
                    title="Удалить"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>

          {this.state.editModalOpen && (
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
                  <button type="button" className="btn btn-primary" onClick={() => this.handleApplyEdit()}>Применить</button>
                </div>
              </div>
            </div>
          </div>
          )}

          {this.state.editModalOpen && <div className="modal-backdrop fade show" />}

          <form className="row g-2" onSubmit={(event) => this.handleAddExecutor(event)}>
          <div className="col-md-3">
            <input
              className={`form-control ${executorErrors.name ? 'is-invalid' : ''}`}
              placeholder="Имя исполнителя"
              value={executorName}
              onChange={(event) => this.setState({ executorName: event.target.value })}
            />
            {executorErrors.name && <div className="invalid-feedback">{executorErrors.name}</div>}
          </div>
          <div className="col-md-3">
            <input
              className={`form-control ${executorErrors.email ? 'is-invalid' : ''}`}
              placeholder="Email исполнителя"
              value={executorEmail}
              onChange={(event) => this.setState({ executorEmail: event.target.value })}
            />
            {executorErrors.email && <div className="invalid-feedback">{executorErrors.email}</div>}
          </div>
          <div className="col-md-2">
            <input
              className={`form-control ${executorErrors.login ? 'is-invalid' : ''}`}
              placeholder="Логин"
              maxLength={12}
              value={executorLogin}
              onChange={(event) => this.setState({ executorLogin: event.target.value })}
            />
            {executorErrors.login && <div className="invalid-feedback">{executorErrors.login}</div>}
          </div>
          <div className="col-md-2">
            <input
              className={`form-control ${executorErrors.password ? 'is-invalid' : ''}`}
              type="password"
              placeholder="Пароль"
              maxLength={12}
              value={executorPassword}
              onChange={(event) => this.setState({ executorPassword: event.target.value })}
            />
            {executorErrors.password && <div className="invalid-feedback">{executorErrors.password}</div>}
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Должность"
              maxLength={128}
              value={executorPosition}
              onChange={(event) => this.setState({ executorPosition: event.target.value })}
            />
          </div>
            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-primary home-btn-compact text-nowrap"
                style={{ width: '150%' }}
              >
                Добавить исполнителя
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
