## Цель

Создать упрощённый аналог Jira на платформе ASP.NET Core с использованием:

- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Подхода Code First
- Миграций EF Core

На первом этапе необходимо:

1. Спроектировать доменную модель
2. Описать связи между сущностями
3. Подготовить Entity Framework Core модели
4. Подготовить DbContext
5. Подготовить команды Package Manager Console для генерации миграции и базы данных

---

# Основные бизнес-сущности

## Пользователь (User)

Пользователь системы.

### Поля

| Поле | Тип | Описание |
|---|---|---|
| Id | Guid | Идентификатор |
| UserName | string | Логин |
| Email | string | Email |
| DisplayName | string | Отображаемое имя |
| CreatedAt | DateTime | Дата создания |

---

## Проект (Project)

Проект объединяет задачи.

### Поля

| Поле | Тип | Описание |
|---|---|---|
| Id | Guid | Идентификатор |
| Name | string | Название проекта |
| Key | string | Короткий код проекта |
| Description | string | Описание |
| CreatedAt | DateTime | Дата создания |
| OwnerId | Guid | Владелец проекта |

### Связи

- Один Project имеет одного Owner (User)
- Один Project содержит много Issues

---

## Задача (Issue)

Основная рабочая сущность.

### Поля

| Поле | Тип | Описание |
|---|---|---|
| Id | Guid | Идентификатор |
| Title | string | Заголовок |
| Description | string | Описание |
| Status | IssueStatus | Статус |
| Priority | IssuePriority | Приоритет |
| CreatedAt | DateTime | Дата создания |
| UpdatedAt | DateTime | Дата обновления |
| ProjectId | Guid | Проект |
| AssigneeId | Guid? | Исполнитель |
| ReporterId | Guid | Автор |

### Связи

- Один Issue принадлежит одному Project
- Один Issue имеет одного Assignee
- Один Issue имеет одного Reporter
- Один Issue содержит много Comments

---

## Комментарий (Comment)

Комментарии к задаче.

### Поля

| Поле | Тип | Описание |
|---|---|---|
| Id | Guid | Идентификатор |
| Content | string | Текст |
| CreatedAt | DateTime | Дата создания |
| AuthorId | Guid | Автор |
| IssueId | Guid | З