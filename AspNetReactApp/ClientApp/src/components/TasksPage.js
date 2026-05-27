import React, { Component } from 'react';
import { apiClient } from '../api/client';
import { TaskDetailModal } from './TaskDetailModal';

const statusOptions = [
  { value: 0, label: 'К выполнению' },
  { value: 1, label: 'В работе' },
  { value: 2, label: 'Готово' },
  { value: 3, label: 'Отменено' }
];

const priorityOptions = [
  { value: 0, label: 'Низкий' },
  { value: 1, label: 'Средний' },
  { value: 2, label: 'Высокий' },
  { value: 3, label: 'Критический' }
];

export class TasksPage extends Component {
  static displayName = TasksPage.name;

  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      goals: [],
      projects: [],
      executors: [],
      title: '',
      description: '',
      selectedGoalId: '',
      selectedProjectId: '',
      projectId: '', // for new task
      executorId: '',
      status: 0,
      priority: 1,
      loading: true,
      error: '',
      selectedTaskId: null,
      detailModalOpen: false
    };

    this.toggleDetailModal = this.toggleDetailModal.bind(this);
    this.openTaskDetail = this.openTaskDetail.bind(this);
  }

  async componentDidMount() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    try {
      const [goals, executors] = await Promise.all([
        apiClient.getGoals(),
        apiClient.getExecutors()
      ]);

      this.setState({
        goals,
        executors,
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  async handleGoalChange(goalId) {
    this.setState({
      selectedGoalId: goalId,
      selectedProjectId: '',
      projects: [],
      tasks: [],
      projectId: ''
    });

    if (goalId) {
      try {
        const projects = await apiClient.getProjects(goalId);
        this.setState({ projects });
      } catch (error) {
        this.setState({ error: error.message });
      }
    }
  }

  async handleProjectChange(projectId) {
    this.setState({
      selectedProjectId: projectId,
      tasks: [],
      projectId: (projectId && projectId !== 'all') ? projectId : ''
    });

    if (projectId === 'all') {
      await this.loadTasks(null, this.state.selectedGoalId);
    } else if (projectId) {
      await this.loadTasks(projectId, null);
    }
  }

  async handleCreateTask(event) {
    event.preventDefault();

    const { title, description, projectId, executorId, status, priority, selectedProjectId, selectedGoalId } = this.state;

    // Если проект выбран в верхнем списке (и это не "все"), используем его
    const finalProjectId = (selectedProjectId && selectedProjectId !== 'all') ? selectedProjectId : projectId;

    if (!title.trim() || !finalProjectId) {
      return;
    }

    try {
      await apiClient.createTask({
        title: title.trim(),
        description: description.trim() || null,
        projectId: Number(finalProjectId),
        executorId: executorId ? Number(executorId) : null,
        status: Number(status),
        priority: Number(priority)
      });

      this.setState({ title: '', description: '' });

      // Refresh task list
      if (selectedProjectId === 'all') {
        await this.loadTasks(null, selectedGoalId);
      } else if (selectedProjectId) {
        await this.loadTasks(selectedProjectId, null);
      }
    } catch (error) {
      this.setState({ error: error.message });
    }
  }

  async loadTasks(projectId, goalId) {
    this.setState({ loading: true });
    try {
      const tasks = await apiClient.getTasks(projectId, goalId);
      this.setState({ tasks, loading: false });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
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
      goals,
      projects,
      executors,
      title,
      description,
      selectedGoalId,
      selectedProjectId,
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
    const isAdmin = me && me.isAuthenticated && me.isAdmin;
    const isLeader = me && me.isAuthenticated && me.role === 'Leader';
    const isExecutor = me && me.isAuthenticated && me.role === 'Executor';
    const canEdit = isLeader || isExecutor || isAdmin;

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Задачи</h1>
          {!isAdmin && !isLeader && !isExecutor && (
            <div style={{ color: 'red', fontSize: '14px' }}>
              Редактирование в гостевом профиле запрещено! Войдите в свой профиль.
            </div>
          )}
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <label className="form-label"><strong>Цели</strong></label>
            <select
              className="form-select"
              value={selectedGoalId}
              onChange={(e) => this.handleGoalChange(e.target.value)}
            >
              <option value="">Выберите цель</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label"><strong>Проекты</strong></label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => this.handleProjectChange(e.target.value)}
              disabled={!selectedGoalId}
            >
              <option value="">Выберите проект</option>
              {selectedGoalId && <option value="all">Все проекты</option>}
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>

        <form className="card card-body mb-4" onSubmit={(event) => this.handleCreateTask(event)}>
          <h5 className="mb-3">Новая задача</h5>
          <div className="mb-2">
            <label className="form-label"><strong>Название задачи</strong></label>
            <input
              className="form-control"
              placeholder="Введите название"
              value={title}
              onChange={(event) => this.setState({ title: event.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="mb-2">
            <label className="form-label"><strong>Описание</strong></label>
            <textarea
              className="form-control"
              placeholder="Введите описание"
              value={description}
              onChange={(event) => this.setState({ description: event.target.value })}
              disabled={!canEdit}
            />
          </div>

          <div className="row g-2 mb-2">
            {(!selectedProjectId || selectedProjectId === 'all') && (
              <div className="col-md-6">
                <label className="form-label"><strong>Проект для задачи</strong></label>
                <select
                  className="form-select"
                  value={projectId}
                  onChange={(event) => this.setState({ projectId: event.target.value })}
                  disabled={!canEdit}
                >
                  <option value="">Выберите проект</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={(!selectedProjectId || selectedProjectId === 'all') ? "col-md-6" : "col-12"}>
              <label className="form-label"><strong>Исполнитель</strong></label>
              <select
                className="form-select"
                value={executorId}
                onChange={(event) => this.setState({ executorId: event.target.value })}
                disabled={!canEdit}
              >
                <option value="">Без исполнителя</option>
                {executors.map((executor) => (
                  <option key={executor.id} value={executor.id}>{executor.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label"><strong>Статус задачи</strong></label>
              <select className="form-select" value={status} onChange={(event) => this.setState({ status: event.target.value })} disabled={!canEdit}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label"><strong>Приоритет</strong></label>
              <select className="form-select" value={priority} onChange={(event) => this.setState({ priority: event.target.value })} disabled={!canEdit}>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={!canEdit || !projectId}>Добавить задачу</button>
        </form>

        {loading && <p>Загрузка...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="list-group">
          {tasks.map((task) => {
            const project = projects.find(p => p.id === task.projectId);
            const executor = executors.find(e => e.id === task.executorId);
            const statusObj = statusOptions.find(o => o.value === task.status);
            const priorityObj = priorityOptions.find(o => o.value === task.priority);

            return (
              <div key={task.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="mb-1"><strong>{task.title}</strong></h6>
                  <div className="text-muted mb-1">{task.description || 'Без описания'}</div>
                  <small className="text-muted">
                    Статус: <strong>{statusObj?.label || task.status}</strong> | Приоритет: <strong>{priorityObj?.label || task.priority}</strong> | Проект: <strong>{project?.title || task.projectId}</strong>
                    {executor && <span> | Исполнитель: <strong>{executor.name}</strong></span>}
                  </small>
                </div>
                {(isLeader || isExecutor || isAdmin) && (
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
