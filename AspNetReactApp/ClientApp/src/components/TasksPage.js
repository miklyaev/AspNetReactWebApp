import React, { Component } from 'react';
import { apiClient } from '../api/client';

const statusOptions = ['ToDo', 'InProgress', 'Done', 'Canceled'];
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

export class TasksPage extends Component {
  static displayName = TasksPage.name;

  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      projects: [],
      executors: [],
      title: '',
      description: '',
      projectId: '',
      executorId: '',
      status: 'ToDo',
      priority: 'Medium',
      loading: true,
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [tasks, projects, executors] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getProjects(),
        apiClient.getExecutors()
      ]);

      this.setState({
        tasks,
        projects,
        executors,
        projectId: projects[0]?.id || '',
        loading: false,
        error: ''
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  async handleCreateTask(event) {
    event.preventDefault();

    const { title, description, projectId, executorId, status, priority } = this.state;
    if (!title.trim() || !projectId) {
      return;
    }

    await apiClient.createTask({
      title: title.trim(),
      description: description.trim() || null,
      projectId: Number(projectId),
      executorId: executorId ? Number(executorId) : null,
      status,
      priority
    });

    this.setState({ title: '', description: '' });
    await this.loadData();
  }

  render() {
    const {
      tasks,
      projects,
      executors,
      title,
      description,
      projectId,
      executorId,
      status,
      priority,
      loading,
      error
    } = this.state;

    return (
      <div>
        <h1 className="mb-3">Задачи</h1>

        <form className="card card-body mb-4" onSubmit={(event) => this.handleCreateTask(event)}>
          <h5 className="mb-3">Новая задача</h5>
          <input
            className="form-control mb-2"
            placeholder="Название задачи"
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
            className="form-select mb-2"
            value={projectId}
            onChange={(event) => this.setState({ projectId: event.target.value })}
          >
            <option value="">Выберите проект</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>

          <select
            className="form-select mb-2"
            value={executorId}
            onChange={(event) => this.setState({ executorId: event.target.value })}
          >
            <option value="">Без исполнителя</option>
            {executors.map((executor) => (
              <option key={executor.id} value={executor.id}>{executor.name}</option>
            ))}
          </select>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <select className="form-select" value={status} onChange={(event) => this.setState({ status: event.target.value })}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <select className="form-select" value={priority} onChange={(event) => this.setState({ priority: event.target.value })}>
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" type="submit">Добавить задачу</button>
        </form>

        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="list-group">
          {tasks.map((task) => (
            <div key={task.id} className="list-group-item">
              <h6 className="mb-1">{task.title}</h6>
              <div className="text-muted">{task.description || 'Без описания'}</div>
              <small>Status: {task.status} | Priority: {task.priority} | ProjectId: {task.projectId}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
