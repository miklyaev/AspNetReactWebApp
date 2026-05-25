import React, { Component } from 'react';
import { apiClient } from '../api/client';
import { GuestButton } from './GuestButton';

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

    return (
      <div>
        <h1 className="mb-3">Проекты</h1>

        <form className="card card-body mb-4" onSubmit={(event) => this.handleCreateProject(event)}>
          <h5 className="mb-3">Новый проект</h5>
          <input
            className="form-control mb-2"
            placeholder="Название проекта"
            value={title}
            onChange={(event) => this.setState({ title: event.target.value })}
          />
          <textarea
            className="form-control mb-2"
            placeholder="Описание"
            value={description}
            onChange={(event) => this.setState({ description: event.target.value })}
          />
          <select
            className="form-select mb-3"
            value={goalId}
            onChange={(event) => this.setState({ goalId: event.target.value })}
          >
            <option value="">Выберите цель</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
          <GuestButton className="btn btn-primary" type="submit">Добавить проект</GuestButton>
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
