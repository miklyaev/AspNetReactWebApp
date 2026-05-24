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
      executorName: '',
      executorEmail: '',
      executorLogin: '',
      executorPassword: '',
      loading: true,
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  async handleDeleteLeader(id) {
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
    if (!responsibleName.trim() || !responsibleEmail.trim() || !responsibleLogin.trim() || !responsiblePassword.trim()) {
      return;
    }

    await apiClient.createLeader({
      name: responsibleName.trim(),
      email: responsibleEmail.trim(),
      login: responsibleLogin.trim(),
      password: responsiblePassword.trim()
    });

    this.setState({ responsibleName: '', responsibleEmail: '', responsibleLogin: '', responsiblePassword: '' });
    await this.loadData();
  }

  async handleDeleteExecutor(id) {
    await apiClient.deleteExecutor(id);
    await this.loadData();
  }

  async handleAddExecutor(event) {
    event.preventDefault();

    const { executorName, executorEmail, executorLogin, executorPassword } = this.state;
    if (!executorName.trim() || !executorEmail.trim() || !executorLogin.trim() || !executorPassword.trim()) {
      return;
    }

    await apiClient.createExecutor({
      name: executorName.trim(),
      email: executorEmail.trim(),
      login: executorLogin.trim(),
      password: executorPassword.trim()
    });

    this.setState({ executorName: '', executorEmail: '', executorLogin: '', executorPassword: '' });
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
      executorName,
      executorEmail,
      executorLogin,
      executorPassword,
      loading,
      error
    } = this.state;
    return (
      <div className="home-container">
        <h1 className="mb-3 main-title">Simple Jira</h1>
        <p className="mb-4">
          Система управления задачами и временем. Минималистична. Связывает задачи с целями. Учитывает время без friction
        </p>

        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <h3 className="mt-4 section-title">Ответственные лица</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Права</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader) => (
              <tr key={leader.id}>
                <td>{leader.name}</td>
                <td>{leader.email}</td>
                <td>Могут добавлять/редактировать цели, проекты и задачи</td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => this.handleDeleteLeader(leader.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="row g-2" onSubmit={(event) => this.handleAddLeader(event)}>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Имя ответственного"
              value={responsibleName}
              onChange={(event) => this.setState({ responsibleName: event.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Email ответственного"
              value={responsibleEmail}
              onChange={(event) => this.setState({ responsibleEmail: event.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Логин"
              maxLength={12}
              value={responsibleLogin}
              onChange={(event) => this.setState({ responsibleLogin: event.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              type="password"
              placeholder="Пароль"
              maxLength={12}
              value={responsiblePassword}
              onChange={(event) => this.setState({ responsiblePassword: event.target.value })}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary home-btn-compact">Добавить</button>
          </div>
        </form>


        <h3 className="mt-4 section-title">Исполнители</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Права</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {executors.map((executor) => (
              <tr key={executor.id}>
                <td>{executor.name}</td>
                <td>{executor.email}</td>
                <td>Могут менять статус задачи и писать комментарии</td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => this.handleDeleteExecutor(executor.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="row g-2" onSubmit={(event) => this.handleAddExecutor(event)}>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Имя исполнителя"
              value={executorName}
              onChange={(event) => this.setState({ executorName: event.target.value })}
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Email исполнителя"
              value={executorEmail}
              onChange={(event) => this.setState({ executorEmail: event.target.value })}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary home-btn-compact">Добавить исполнителя</button>
          </div>
        </form>
      </div>
    );
  }
}
