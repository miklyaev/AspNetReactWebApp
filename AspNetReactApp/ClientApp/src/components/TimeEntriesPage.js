import React, { Component } from 'react';
import { apiClient } from '../api/client';

export class TimeEntriesPage extends Component {
  static displayName = TimeEntriesPage.name;

  constructor(props) {
    super(props);
    this.state = {
      timeEntries: [],
      tasks: [],
      executors: [],
      taskItemId: '',
      executorId: '',
      hours: '',
      date: '',
      loading: true,
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [timeEntries, tasks, executors] = await Promise.all([
        apiClient.getTimeEntries(),
        apiClient.getTasks(),
        apiClient.getExecutors()
      ]);

      this.setState({
        timeEntries,
        tasks,
        executors,
        taskItemId: tasks[0]?.id || '',
        executorId: executors[0]?.id || '',
        loading: false,
        error: ''
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  async handleCreateEntry(event) {
    event.preventDefault();

    const { taskItemId, executorId, hours, date } = this.state;
    if (!taskItemId || !executorId || !hours) {
      return;
    }

    await apiClient.createTimeEntry({
      taskItemId: Number(taskItemId),
      executorId: Number(executorId),
      hours: Number(hours),
      date: date || null
    });

    this.setState({ hours: '', date: '' });
    await this.loadData();
  }

  render() {
    const { timeEntries, tasks, executors, taskItemId, executorId, hours, date, loading, error } = this.state;
    const me = this.props.me;
    const isAdmin = me && me.isAuthenticated && me.isAdmin;
    const isAuthenticated = me && me.isAuthenticated;
    const isExecutor = me && me.isAuthenticated && me.role === 'Executor';
    const isLeader = me && me.isAuthenticated && me.role === 'Leader';

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Учёт времени</h1>
          {!isAdmin && !isAuthenticated && (
            <div style={{ color: 'red', fontSize: '14px' }}>
              Редактирование в гостевом профиле запрещено! Войдите в свой профиль.
            </div>
          )}
          {!isAdmin && isExecutor && (
            <div style={{ color: 'orange', fontSize: '14px' }}>
              Вы исполнитель. Ваши права на редактирование ограничены.
            </div>
          )}
        </div>        <form className="card card-body mb-4" onSubmit={(event) => this.handleCreateEntry(event)}>
          <h5 className="mb-3">Добавить запись времени</h5>
          <select
            className="form-select mb-2"
            value={taskItemId}
            onChange={(event) => this.setState({ taskItemId: event.target.value })}
            disabled={!isAuthenticated}
          >
            <option value="">Выберите задачу</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>

          <select
            className="form-select mb-2"
            value={executorId}
            onChange={(event) => this.setState({ executorId: event.target.value })}
            disabled={!isAuthenticated}
          >
            <option value="">Выберите исполнителя</option>
            {executors.map((executor) => (
              <option key={executor.id} value={executor.id}>{executor.name}</option>
            ))}
          </select>

          <input
            className="form-control mb-2"
            type="number"
            step="0.25"
            min="0.25"
            placeholder="Часы"
            value={hours}
            onChange={(event) => this.setState({ hours: event.target.value })}
            disabled={!isAuthenticated}
          />

          <input
            className="form-control mb-3"
            type="datetime-local"
            value={date}
            onChange={(event) => this.setState({ date: event.target.value })}
            disabled={!isAuthenticated}
          />

          <button className="btn btn-primary" type="submit" disabled={!isAuthenticated}>Сохранить</button>
        </form>        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="list-group">
          {timeEntries.map((entry) => {
            const task = tasks.find(t => t.id === entry.taskItemId);
            const executor = executors.find(e => e.id === entry.executorId);
            return (
              <div key={entry.id} className="list-group-item">
                <strong>{entry.hours} ч.</strong>
                <div className="text-muted">
                  Задача: <strong>{task?.title || `ID: ${entry.taskItemId}`}</strong>,
                  Исполнитель: <strong>{executor?.name || `ID: ${entry.executorId}`}</strong>
                </div>
                <small>{new Date(entry.date).toLocaleString('ru-RU')}</small>
              </div>
            );
          })}
        </div>      </div>
    );
  }
}
