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
      commentsLoading: false
    };

    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.handleCommentSubmit = this.handleCommentSubmit.bind(this);
    this.handleCommentTextChange = this.handleCommentTextChange.bind(this);
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
      this.setState({ task, comments, loading: false });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  }

  async handleStatusChange(newStatus) {
    const { task } = this.state;
    if (!task) return;

    try {
      const statusValue = Number(newStatus);
      await apiClient.updateTaskStatus(task.id, { status: statusValue });
      this.setState({
        task: { ...task, status: statusValue }
      });
    } catch (error) {
      this.setState({ error: error.message });
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
      this.setState({ newCommentText: '' });
      await this.loadTaskDetails();
    } catch (error) {
      this.setState({ error: error.message, commentsLoading: false });
    }
  }

  render() {
    const { task, comments, newCommentText, loading, error, commentsLoading } = this.state;
    const me = this.props.me;
    const isLeader = me && me.role === 'Leader';
    const isExecutor = me && me.role === 'Executor';

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

    const statusObj = statusOptions.find(o => o.value === task.status);
    const priorityObj = priorityOptions.find(o => o.value === task.priority);
    const statusText = statusObj ? statusObj.label : task.status;
    const priorityText = priorityObj ? priorityObj.label : task.priority;
    const project = this.props.projects?.find(p => p.id === task.projectId);
    const executor = this.props.executors?.find(e => e.id === task.executorId);

    const canEditStatus = isLeader || (isExecutor && task.executorId === me?.employeeId);

    return (
      <Modal isOpen={this.props.isOpen} toggle={this.props.toggle} size="lg">
        <ModalHeader toggle={this.props.toggle}>
          {task.title}
        </ModalHeader>
        <ModalBody>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card card-body mb-4">
            <h6 className="mb-2">Информация о задаче</h6>
            <div className="mb-2">
              <small className="text-muted d-block">Описание</small>
              <div>{task.description || 'Без описания'}</div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Проект</small>
                <div>{project?.title || `ID: ${task.projectId}`}</div>
              </div>
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Исполнитель</small>
                <div>{executor?.name || 'Не назначен'}</div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Приоритет</small>
                <div>{priorityText}</div>
              </div>
              <div className="col-md-6 mb-2">
                <small className="text-muted d-block">Статус</small>
                {canEditStatus ? (
                  <select
                    className="form-select form-select-sm"
                    value={task.status}
                    onChange={(e) => this.handleStatusChange(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <div>{statusText}</div>
                )}
              </div>
            </div>
          </div>
          <div>
            <h6 className="mb-3">Комментарии ({comments.length})</h6>

            {isExecutor && (
              <Form onSubmit={this.handleCommentSubmit} className="mb-3">
                <FormGroup>
                  <Label className="small" for="comment_text">Добавить комментарий</Label>
                  <textarea
                    id="comment_text"
                    className="form-control"
                    rows="3"
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
                  {commentsLoading ? 'Отправка...' : 'Отправить'}
                </Button>
              </Form>
            )}

            {comments.length === 0 ? (
              <div className="alert alert-info small">Комментариев нет</div>
            ) : (
              <div className="list-group">
                {comments.map((comment) => (
                  <div key={comment.id} className="list-group-item">
                    <div className="mb-1">
                      <strong className="small">{comment.author?.name || `Автор #${comment.authorId}`}</strong>
                      <span className="text-muted small ms-2">
                        {new Date(comment.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <div className="small">{comment.text}</div>
                    {isLeader && (
                      <Button
                        close
                        size="sm"
                        className="mt-1"
                        onClick={() => {
                          apiClient.deleteComment(comment.id).then(() => this.loadTaskDetails());
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={this.props.toggle}>Закрыть</Button>
        </ModalFooter>
      </Modal>
    );
  }
}
