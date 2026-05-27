import React, { Component } from 'react';
import { apiClient } from '../api/client';

export class ProjectsPage extends Component {
  static displayName = ProjectsPage.name;

  constructor(props) {
    super(props);
    this.state = {
      goals: [],
      projects: [],
      title: '',
      description: '',
      goalId: '',
      loading: true,
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [goals, projects] = await Promise.all([
        apiClient.getGoals(),
        apiClient.getProjects()
      ]);

      this.setState({
        goals,
        projects,
        goalId: goals[0]?.id || '',
        loading: false,
        error: ''
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  async handleCreateProject(event) {
    event.preventDefault();

    const { title, description, goalId } = this.state;
    if (!title.trim() || !goalId) {
      return;
    }

    await apiClient.createProject({
      title: title.trim(),
      description: description.trim() || null,
      goalId: Number(goalId)
    });

    this.setState({ title: '', description: '' });
    await this.loadData();
  }

  render() {
    const { goals, projects, title, description, goalId, loading, error } = this.state;
    const me = this.props.me;
    const isAdmin = me && me.isAuthenticated && me.isAdmin;
    const isLeader = me && me.isAuthenticated && me.role === 'Leader';
    const isExecutor = me && me.isAuthenticated && me.role === 'Executor';
    const canEdit = isLeader || isExecutor || isAdmin;

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Проекты</h1>
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

        <form className="card card-body mb-4" onSubmit={(event) => this.handleCreateProject(event)}>
          <h5 className="mb-3">Новый проект</h5>
          <input
            className="form-control mb-2"
            placeholder="Название проекта"
            value={title}
            onChange={(event) => this.setState({ title: event.target.value })}
            disabled={!canEdit}
          />
          <textarea
            className="form-control mb-2"
            placeholder="Описание"
            value={description}
            onChange={(event) => this.setState({ description: event.target.value })}
            disabled={!canEdit}
          />
          <select
            className="form-select mb-3"
            value={goalId}
            onChange={(event) => this.setState({ goalId: event.target.value })}
            disabled={!canEdit}
          >
            <option value="">Выберите цель</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit" disabled={!canEdit}>Добавить проект</button>
        </form>

        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="list-group">
          {projects.map((project) => (
            <div key={project.id} className="list-group-item">
              <h6 className="mb-1">{project.title}</h6>
              <div className="text-muted">{project.description || 'Без описания'}</div>
              <small>GoalId: {project.goalId}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
