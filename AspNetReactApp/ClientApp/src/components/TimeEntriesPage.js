import React, { Component } from 'react';
import { apiClient } from '../api/client';

const statusOptions = [
  { value: 0, label: 'К выполнению' },
  { value: 1, label: 'В работе' },
  { value: 2, label: 'Готово' },
  { value: 3, label: 'Отменено' }
];

export class TimeEntriesPage extends Component {
  static displayName = TimeEntriesPage.name;

  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      tasks: [],
      executors: [],
      selectedProjectId: '',
      selectedExecutorId: '',
      loading: true,
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [projects, tasks, executors] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getTasks(),
        apiClient.getExecutors()
      ]);

      this.setState({
        projects,
        tasks,
        executors,
        loading: false,
        error: ''
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  render() {
    const { projects, tasks, executors, selectedProjectId, selectedExecutorId, loading, error } = this.state;

    let filteredTasks = tasks;
    if (selectedProjectId) {
      filteredTasks = filteredTasks.filter(t => t.projectId === Number(selectedProjectId));
    }
    if (selectedExecutorId) {
      filteredTasks = filteredTasks.filter(t => t.executorId === Number(selectedExecutorId));
    }

    const totalPlanned = filteredTasks.reduce((sum, t) => sum + (t.plannedTime || 0), 0);
    const totalSpent = filteredTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
    const totalPercent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

    return (
      <div className='container-fluid'>
        <div className='d-flex justify-content-between align-items-center mb-4'>
          <h1>Анализ времени по задачам</h1>
        </div>

        <div className='row mb-4'>
          <div className='col-md-6'>
            <label className='form-label'>Проект</label>
            <select
              className='form-select'
              value={selectedProjectId}
              onChange={(e) => this.setState({ selectedProjectId: e.target.value })}
            >
              <option value=''>Все проекты</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>          <div className='col-md-6'>
            <label className='form-label'>Исполнитель</label>
            <select
              className='form-select'
              value={selectedExecutorId}
              onChange={(e) => this.setState({ selectedExecutorId: e.target.value })}
            >
              <option value=''>Все исполнители</option>
              {executors.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className='text-center my-5'>
            <div className='spinner-border'></div>
          </div>
        )}
        {error && <div className='alert alert-danger'>{error}</div>}

        {!loading && (
          <>
            <div className='table-responsive card shadow-sm mb-4'>
              <table className='table table-hover mb-0'>
                <thead className='table-light'>
                  <tr>
                    <th>Задача</th>
                    <th>Статус</th>
                    <th>Исполнитель</th>
                    <th className='text-end'>Запланировано (ч)</th>
                    <th className='text-end'>Потрачено (ч)</th>
                    <th className='text-center'>Прогресс</th>
                  </tr>                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan='5' className='text-center py-4 text-muted'>
                        Задачи не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => {
                      const executor = executors.find(e => e.id === task.executorId);
                      const percent = task.plannedTime > 0 ? Math.round((task.timeSpent / task.plannedTime) * 100) : 0;
                      let progressClass = 'bg-primary';
                      if (percent > 100) progressClass = 'bg-danger';
                      else if (percent === 100) progressClass = 'bg-success';

                      return (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>
                            <span className={`badge ${task.status === 1 ? 'bg-primary' :
                                task.status === 2 ? 'bg-success' :
                                  task.status === 3 ? 'bg-secondary' : 'bg-warning text-dark'
                              }`}>
                              {statusOptions.find(o => o.value === task.status)?.label || 'Неизвестно'}
                            </span>
                          </td>
                          <td>{executor?.name || <span className='text-muted'>Не назначен</span>}</td>                          <td className='text-center'>{task.plannedTime}</td>
                          <td className='text-center'>{task.timeSpent}</td>
                          <td style={{ width: '200px' }}>
                            <div className='d-flex align-items-centerя не блядь в процентах'>
                              <div className='progress flex-grow-1' style={{ height: '8px' }}>
                                <div
                                  className={`progress-bar ${progressClass}`}
                                  role='progressbar'
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                                ></div>Я знаю
                              </div>
                              <span className='ms-2 small fw-bold' style={{ minWidth: '40px' }}>
                                {percent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className='card card-body bg-light border-0 shadow-sm'>
              <div className='row text-center'>
                <div className='col-md-4'>
                  <div className='text-muted small text-uppercase'>Общее запланированное время</div>
                  <h3 className='mb-0'>{totalPlanned} ч.</h3>
                </div>
                <div className='col-md-4 border-start border-end'>
                  <div className='text-muted small text-uppercase'>Общее потраченное время</div>
                  <h3 className='mb-0'>{totalSpent} ч.</h3>
                </div>
                <div className='col-md-4'>
                  <div className='text-muted small text-uppercase'>Общий процент выполнения</div>
                  <h3 className={`mb-0 ${totalPercent > 100 ? 'text-danger' : ''}`}>
                    {totalPercent}%
                  </h3>
                </div>
              </div>
            </div>
          </>
        )}      </div>
    );
  }
}