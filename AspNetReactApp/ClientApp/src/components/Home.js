import React, { Component } from 'react';
import { apiClient } from '../api/client';

export class Home extends Component {
  static displayName = Home.name;

  constructor(props) {
    super(props);
    this.state = {
      responsiblePersons: [],
      executors: [],
      responsibleName: '',
      responsibleEmail: '',
      executorName: '',
      executorEmail: '',
      loading: true,
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [responsiblePersons, executors] = await Promise.all([
        apiClient.getResponsiblePersons(),
        apiClient.getExecutors()
      ]);

      this.setState({
        responsiblePersons,
        executors,
        loading: false,
        error: ''
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  async handleAddResponsiblePerson(event) {
    event.preventDefault();

    const { responsibleName, responsibleEmail } = this.state;
    if (!responsibleName.trim() || !responsibleEmail.trim()) {
      return;
    }

    await apiClient.createResponsiblePerson({
      name: responsibleName.trim(),
      email: responsibleEmail.trim()
    });

    this.setState({ responsibleName: '', responsibleEmail: '' });
    await this.loadData();
  }

  async handleAddExecutor(event) {
    event.preventDefault();

    const { executorName, executorEmail } = this.state;
    if (!executorName.trim() || !executorEmail.trim()) {
      return;
    }

    await apiClient.createExecutor({
      name: executorName.trim(),
      email: executorEmail.trim()
    });

    this.setState({ executorName: '', executorEmail: '' });
    await this.loadData();
  }

  render() {
    const {
      responsiblePersons,
      executors,
      responsibleName,
      responsibleEmail,
      executorName,
      executorEmail,
      loading,
      error
    } = this.state;

    return (
      <div>
        <h1 className="mb-3">Home</h1>
        <p className="mb-4">
          Система управления задачами и временем. Минималистична. Связывает задачи с целями. Учитывает время без friction
        </p>

        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <h3 className="mt-4">Ответственные лица</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Права</th>
            </tr>
          </thead>
          <tbody>
            {responsiblePersons.map((person) => (
              <tr key={person.id}>
                <td>{person.name}</td>
                <td>{person.email}</td>
                <td>Полные права на все сущности</td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="row g-2 mb-4" onSubmit={(event) => this.handleAddResponsiblePerson(event)}>
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Имя ответственного"
              value={responsibleName}
              onChange={(event) => this.setState({ responsibleName: event.target.value })}
            />
          </div>
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Email ответственного"
              value={responsibleEmail}
              onChange={(event) => this.setState({ responsibleEmail: event.target.value })}
            />
          </div>
          <div className="col-md-4">
            <button type="submit" className="btn btn-primary w-100">Добавить ответственного</button>
          </div>
        </form>

        <h3 className="mt-4">Исполнители</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Права</th>
            </tr>
          </thead>
          <tbody>
            {executors.map((executor) => (
              <tr key={executor.id}>
                <td>{executor.name}</td>
                <td>{executor.email}</td>
                <td>Могут менять статус задачи и писать комментарии</td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="row g-2" onSubmit={(event) => this.handleAddExecutor(event)}>
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Имя исполнителя"
              value={executorName}
              onChange={(event) => this.setState({ executorName: event.target.value })}
            />
          </div>
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Email исполнителя"
              value={executorEmail}
              onChange={(event) => this.setState({ executorEmail: event.target.value })}
            />
          </div>
          <div className="col-md-4">
            <button type="submit" className="btn btn-primary w-100">Добавить исполнителя</button>
          </div>
        </form>
      </div>
    );
  }
}
