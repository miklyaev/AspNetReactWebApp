import React, { Component } from 'react';
import { apiClient } from '../api/client';

export class GoalsPage extends Component {
  static displayName = GoalsPage.name;

  constructor(props) {
    super(props);
    this.state = {
      goals: [],
      loading: true,
      error: '',
      title: '',
      description: ''
    };
  }

  componentDidMount() {
    this.loadGoals();
  }

  async loadGoals() {
    try {
      const goals = await apiClient.getGoals();
      this.setState({ goals, loading: false, error: '' });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  async handleCreateGoal(event) {
    event.preventDefault();

    const { title, description } = this.state;
    if (!title.trim()) {
      return;
    }

    await apiClient.createGoal({
      title: title.trim(),
      description: description.trim() || null
    });

    this.setState({ title: '', description: '' });
    await this.loadGoals();
  }

  render() {
    const { goals, loading, error, title, description } = this.state;
    const me = this.props.me;
    const isAdmin = me && me.isAuthenticated && me.isAdmin;
    const isLeader = me && me.isAuthenticated && me.role === 'Leader';
    const isExecutor = me && me.isAuthenticated && me.role === 'Executor';

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Цели</h1>
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
        <form className="card card-body mb-4" onSubmit={(event) => this.handleCreateGoal(event)}>
          <h5 className="mb-3">Новая цель</h5>
          <input
            className="form-control mb-2"
            placeholder="Название цели"
            value={title}
            onChange={(event) => this.setState({ title: event.target.value })}
            disabled={!isLeader && !isAdmin}
          />
          <textarea
            className="form-control mb-3"
            placeholder="Описание"
            value={description}
            onChange={(event) => this.setState({ description: event.target.value })}
            disabled={!isLeader && !isAdmin}
          />
          <button className="btn btn-primary" type="submit" disabled={!isLeader && !isAdmin}>Добавить цель</button>
        </form>
        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        {goals.map((goal) => (
          <div key={goal.id} className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">{goal.title}</h5>
              <p className="card-text text-muted">{goal.description || 'Без описания'}</p>
              <p className="mb-2">Прогресс: {Number(goal.progress || 0).toFixed(1)}%</p>

              {(goal.projects || []).map((project) => (
                <div key={project.id} className="border rounded p-2 mb-2">
                  <strong>{project.title}</strong>
                  <div className="text-muted">{project.description || 'Без описания'}</div>
                  <div>Прогресс проекта: {Number(project.progress || 0).toFixed(1)}%</div>
                  <ul className="mt-2 mb-0">
                    {(project.tasks || []).map((task) => (
                      <li key={task.id}>
                        {task.title} — {task.status} / {task.priority}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
