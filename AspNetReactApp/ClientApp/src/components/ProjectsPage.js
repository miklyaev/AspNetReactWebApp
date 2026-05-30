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

      this.setState((prevState) => ({
        goals,
        projects,
        goalId: prevState.goalId || goals[0]?.id || '',
        loading: false,
        error: ''
      }));
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
    const isAuthenticated = me && me.isAuthenticated;
    const role = me && me.role;
    const isAdmin = me && me.isAdmin;

    // Только Admin и Leader могут добавлять проекты
    const canCreateProject = isAuthenticated && (isAdmin || role === 'Leader');
    const isExecutor = role === 'Executor';

    const filteredProjects = projects.filter(p => !goalId || p.goalId === Number(goalId));

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Проекты</h1>
          <div className="d-flex align-items-center">
            <span className="me-2 fw-bold">Цели:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={goalId}
              onChange={(event) => this.setState({ goalId: event.target.value })}
            >
              <option value="">Все цели</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          {!canCreateProject && isAuthenticated && !isExecutor && (
            <div style={{ color: 'red', fontSize: '14px' }}>
              Ваша роль не позволяет редактировать проекты.
            </div>
          )}
          {isExecutor && (
            <div style={{ color: 'orange', fontSize: '14px' }}>
              Вы исполнитель. Ваши права на добавление проектов ограничены.
            </div>
          )}
          {!isAuthenticated && (
            <div style={{ color: 'red', fontSize: '14px' }}>
              Редактирование запрещено! Войдите в профиль Admin или Leader.
            </div>
          )}
        </div>
        <form className="card card-body mb-4" onSubmit={(event) => this.handleCreateProject(event)}>
          <h5 className="mb-3">
            Новый проект {goalId
              ? `для цели "${goals.find(g => g.id === Number(goalId))?.title}"`
              : (goals.length > 0 ? `для цели "${goals[0].title}" (по умолчанию)` : '')}
          </h5>
          <input
            className="form-control mb-2"
            placeholder="Название проекта"
            value={title}
            onChange={(event) => this.setState({ title: event.target.value })}
            disabled={!canCreateProject || goals.length === 0}
          />
          <textarea
            className="form-control mb-2"
            placeholder="Описание"
            value={description}
            onChange={(event) => this.setState({ description: event.target.value })}
            disabled={!canCreateProject || goals.length === 0}
          />
          {goals.length === 0 && <div className="text-danger mb-2 small">Нет доступных целей для создания проекта</div>}
          <button className="btn btn-primary" type="submit" disabled={!canCreateProject || !title.trim() || goals.length === 0}>
            Добавить проект
          </button>
        </form>        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="list-group">
          {filteredProjects.map((project) => (
            <div key={project.id} className="list-group-item">
              <h6 className="mb-1">{project.title}</h6>
              <div className="text-muted">{project.description || 'Без описания'}</div>
              <small className="text-secondary">ID: {project.id}</small>
            </div>
          ))}
          {filteredProjects.length === 0 && !loading && (
            <div className="text-center p-4 text-muted">Проектов не найдено</div>
          )}
        </div>
      </div>
    );
  }
}
