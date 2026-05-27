import React, { Component } from 'react';
import { apiClient } from '../api/client';
import { TaskDetailModal } from './TaskDetailModal';

const statusOptions = ['К выполнению', 'В работе', 'Готово', 'Отменено'];
const priorityOptions = ['Низкий', 'Средний', 'Высокий', 'Критический'];

const statusMap = {
  'ToDo': 'К выполнению',
  'InProgress': 'В работе',
  'Done': 'Готово',
  'Canceled': 'Отменено'
};

const priorityMap = {
  'Low': 'Низкий',
  'Medium': 'Средний',
  'High': 'Высокий',
  'Critical': 'Критический'
};

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
      error: '',
      selectedTaskId: null,
      detailModalOpen: false
    };

    this.toggleDetailModal = this.toggleDetailModal.bind(this);
    this.openTaskDetail = this.openTaskDetail.bind(this);
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

  toggleDetailModal() {
    this.setState({ detailModalOpen: !this.state.detailModalOpen });
  }

  openTaskDetail(taskId) {
    this.setState({ selectedTaskId: taskId, detailModalOpen: true });
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
      error,
      selectedTaskId,
      detailModalOpen
    } = this.state;

    const me = this.props.me;
    console.log('TasksPage.render() - me:', me);
    const isLeader = me && me.isAuthenticated && me.role === 'Leader';
    const isExecutor = me && me.isAuthenticated && me.role === 'Executor';
    console.log('TasksPage.render() - isLeader:', isLeader, ', isExecutor:', isExecutor);

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
            disabled={!isLeader}
          />
          <textarea
            className="form-control mb-2"
            placeholder="Описание"
            value={description}
            onChange={(event) => this.setState({ description: event.target.value })}
            disabled={!isLeader}
          />

          <select
            className="form-select mb-2"
            value={projectId}
            onChange={(event) => this.setState({ projectId: event.target.value })}
            disabled={!isLeader}
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
            disabled={!isLeader}
          >
            <option value="">Без исполнителя</option>
            {executors.map((executor) => (
              <option key={executor.id} value={executor.id}>{executor.name}</option>
            ))}
          </select>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <select className="form-select" value={status} onChange={(event) => this.setState({ status: event.target.value })} disabled={!isLeader}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <select className="form-select" value={priority} onChange={(event) => this.setState({ priority: event.target.value })} disabled={!isLeader}>
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={!isLeader}>Добавить задачу</button>
        </form>

        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="list-group">
          {tasks.map((task) => {
            const project = projects.find(p => p.id === task.projectId);
            const executor = executors.find(e => e.id === task.executorId);
            const statusText = typeof task.status === 'number' ? statusOptions[task.status] : (statusMap[task.status] || task.status);
            const priorityText = typeof task.priority === 'number' ? priorityOptions[task.priority] : (priorityMap[task.priority] || task.priority);

            return (
              <div key={task.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="mb-1"><strong>{task.title}</strong></h6>
                  <div className="text-muted mb-1">{task.description || 'Без описания'}</div>
                  <small className="text-muted">
                    Статус: <strong>{statusText}</strong> | Приоритет: <strong>{priorityText}</strong> | Проект: <strong>{project?.title || task.projectId}</strong>
                    {executor && <span> | Исполнитель: <strong>{executor.name}</strong></span>}
                  </small>
                </div>
                {(isLeader || isExecutor) && (
                  <button
                    className="btn btn-sm btn-outline-primary ms-2"
                    onClick={() => this.openTaskDetail(task.id)}
                  >
                    Подробнее
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {selectedTaskId && (
          <TaskDetailModal
            isOpen={detailModalOpen}
            toggle={this.toggleDetailModal}
            taskId={selectedTaskId}
            me={me}
            projects={projects}
            executors={executors}
          />
        )}
      </div>
    );
  }
}
