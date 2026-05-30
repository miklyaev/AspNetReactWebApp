import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input, Spinner } from 'reactstrap';
import { apiClient } from '../api/client';

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

export class TaskDetailModal extends Component {
  static displayName = TaskDetailModal.name;

  constructor(props) {
    super(props);
    this.state = {
      task: null,
      comments: [],
      newCommentText: '',
      loading: true,
      error: null,
      commentsLoading: false,
      saving: false,
      // Поля для редактирования
      editTitle: '',
      editDescription: '',
      editPriority: 0,
      editStatus: 0,
      editTimeSpent: 0,
      editPlannedTime: 0
    };
    this.handleCommentSubmit = this.handleCommentSubmit.bind(this);
    this.handleCommentTextChange = this.handleCommentTextChange.bind(this);
    this.handleSave = this.handleSave.bind(this);
  }

  componentDidMount() {
    this.loadTaskDetails();
  }

  async loadTaskDetails() {
    try {
      this.setState({ loading: true, error: null });
      const taskId = this.props.taskId;
      const [task, comments] = await Promise.all([
        apiClient.getTask(taskId),
        apiClient.getComments(taskId)
      ]);
      this.setState({
        task,
        comments,
        loading: false,
        editTitle: task.title || '',
        editDescription: task.description || '',
        editPriority: task.priority,
        editStatus: task.status,
        editTimeSpent: task.timeSpent || 0,
        editPlannedTime: task.plannedTime || 0
      });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  async handleSave() {
    const { task, editTitle, editDescription, editPriority, editStatus, editTimeSpent, editPlannedTime } = this.state;
    if (!task) return;

    try {
      this.setState({ saving: true, error: null });
      await apiClient.updateTask(task.id, {
        title: editTitle,
        description: editDescription,
        priority: Number(editPriority),
        status: Number(editStatus),
        timeSpent: Number(editTimeSpent),
        plannedTime: Number(editPlannedTime),
        projectId: task.projectId,
        executorId: task.executorId
      }); this.setState({ saving: false });
      this.loadTaskDetails();
    } catch (error) {
      this.setState({ error: error.message, saving: false });
    }
  }

  handleCommentTextChange(e) {
    this.setState({ newCommentText: e.target.value });
  }

  async handleCommentSubmit(e) {
    e.preventDefault();
    const { newCommentText, task } = this.state;
    const me = this.props.me;

    if (!newCommentText.trim() || !me || !me.employeeId) {
      return;
    }

    try {
      this.setState({ commentsLoading: true });
      await apiClient.createComment({
        text: newCommentText.trim(),
        taskItemId: task.id,
        authorId: me.employeeId
      });
      this.setState({ newCommentText: '', commentsLoading: false });
      await this.loadTaskDetails();
    } catch (error) {
      this.setState({ error: error.message, commentsLoading: false });
    }
  }

  render() {
    const {
      task, comments, newCommentText, loading, error, commentsLoading, saving,
      editTitle, editDescription, editPriority, editStatus, editTimeSpent, editPlannedTime
    } = this.state;

    if (loading) {
      return (
        <Modal isOpen={this.props.isOpen} toggle={this.props.toggle} size="lg">
          <ModalHeader toggle={this.props.toggle}>Загрузка...</ModalHeader>
          <ModalBody className="text-center">
            <Spinner />
          </ModalBody>
        </Modal>
      );
    }

    if (!task) {
      return null;
    }

    const project = this.props.projects?.find(p => p.id === task.projectId);
    const executor = this.props.executors?.find(e => e.id === task.executorId);

    const me = this.props.me;
    const isAdmin = me && me.isAuthenticated && me.isAdmin;
    const isLeader = me && me.isAuthenticated && me.role === 'Leader';
    const canSetPlannedTime = isAdmin || isLeader;

    return (
      <Modal isOpen={this.props.isOpen} toggle={this.props.toggle} size="lg">
        <ModalHeader toggle={this.props.toggle}>
          Редактирование задачи
        </ModalHeader>
        <ModalBody>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card card-body mb-4">
            <FormGroup>
              <Label className="fw-bold mb-1">Название задачи</Label>
              <Input
                type="text"
                value={editTitle}
                onChange={(e) => this.setState({ editTitle: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <Label className="fw-bold mb-1">Описание</Label>
              <Input
                type="textarea"
                rows="3"
                value={editDescription}
                onChange={(e) => this.setState({ editDescription: e.target.value })}
              />
            </FormGroup>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Label className="fw-bold mb-1 d-block">Исполнитель</Label>
                <div className="py-2">{executor?.name || 'Не назначен'}</div>
              </div>
              {canSetPlannedTime && (
                <div className="col-md-6 mb-3">
                  <Label className="fw-bold mb-1">Планируемое время (ч)</Label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={editPlannedTime}
                    onChange={(e) => this.setState({ editPlannedTime: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="row align-items-end">
              <div className="col-md-4 mb-3">
                <Label className="fw-bold mb-1">Потраченное время<br />(в часах)</Label>
                <div style={{ width: '75%' }}>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editTimeSpent}
                    onChange={(e) => this.setState({ editTimeSpent: e.target.value })}
                  />
                </div>
              </div>              <div className="col-md-4 mb-3">
                <Label className="fw-bold mb-1">Приоритет</Label>
                <div style={{ width: '75%' }}>
                  <Input
                    type="select"
                    value={editPriority}
                    onChange={(e) => this.setState({ editPriority: e.target.value })}
                  >
                    {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Input>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <Label className="fw-bold mb-1">Статус</Label>
                <div style={{ width: '75%' }}>
                  <Input
                    type="select"
                    value={editStatus}
                    onChange={(e) => this.setState({ editStatus: e.target.value })}
                  >
                    {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Input>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <Label className="fw-bold d-block mb-1">Проект</Label>
              <div>{project?.title || `ID: ${task.projectId}`}</div>
            </div>
          </div>

          <div>
            <h6 className="mb-3">Комментарии ({comments.length})</h6>
            <Form onSubmit={this.handleCommentSubmit} className="mb-3">
              <FormGroup>
                <Label className="small" for="comment_text">Добавить комментарий</Label>
                <textarea
                  id="comment_text"
                  className="form-control"
                  rows="2"
                  value={newCommentText}
                  onChange={this.handleCommentTextChange}
                  placeholder="Введите комментарий..."
                  disabled={commentsLoading}
                />
              </FormGroup>
              <Button
                color="primary"
                size="sm"
                type="submit"
                disabled={!newCommentText.trim() || commentsLoading}
              >
                {commentsLoading ? 'Отправка...' : 'Добавить'}
              </Button>
            </Form>

            <div
              className="list-group"
              style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}
            >
              {comments.length === 0 ? (
                <div className="p-3 text-center text-muted small">Комментариев нет</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="list-group-item list-group-item-action flex-column align-items-start border-0 border-bottom">
                    <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                      <strong className="small">{comment.author?.name || `Автор #${comment.authorId}`}</strong>
                      <div className="d-flex align-items-center">
                        <span className="text-muted small me-2">
                          {new Date(comment.createdAt).toLocaleString('ru-RU')}
                        </span>
                        <Button
                          close
                          size="sm"
                          style={{ fontSize: '1rem' }}
                          onClick={() => {
                            if (window.confirm('Удалить комментарий?')) {
                              apiClient.deleteComment(comment.id).then(() => this.loadTaskDetails());
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="small text-break">{comment.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button color="secondary" onClick={this.props.toggle}>Закрыть</Button>
        </ModalFooter>
      </Modal >
    );
  }
}
