# UI_spec.md

# Спецификация фронтенда JiraClone (React ClientApp)

## 1. Общая цель интерфейса

Интерфейс должен предоставлять удобную систему управления задачами и временем, где пользователь:

- понимает связь задач с бизнес-целями;
- быстро переключается между задачами;
- фиксирует время прямо внутри задачи;
- видит прогресс проектов и целей;
- использует фильтрацию без перегрузки интерфейса;
- получает современный UX в стиле Windows 11.

Главный принцип:
> Минимум кликов для выполнения ежедневных действий.

---

# 2. UX-принципы

## 2.1 Основные UX-требования

Интерфейс должен:

- быть визуально лёгким;
- использовать карточки и аккордеоны вместо древовидных структур;
- поддерживать responsive layout;
- иметь плавные анимации;
- минимизировать модальные окна;
- обеспечивать inline editing там, где это удобно;
- иметь единый визуальный язык.

---

## 2.2 Стиль интерфейса

### Визуальный стиль

Ориентир:
- Windows 11
- Fluent Design
- мягкие тени;
- полупрозрачные панели;
- скругления;
- лёгкие hover-анимации.

### Основные визуальные характеристики

| Элемент | Требование |
|---|---|
| Скругления | 12–16px |
| Тени | мягкие |
| Анимации | 150–250ms |
| Цвета | нейтральные + акцент |
| Плотность UI | средняя |
| Типографика | Segoe UI / Inter |
| Иконки | Fluent UI Icons / Lucide |

---

## 2.3 Анимации

Использовать:
- fade;
- slide;
- accordion expand;
- hover elevation;
- skeleton loading.

Не использовать:
- резкие transitions;
- bounce;
- heavy motion.

---

# 3. Технологические требования

## 3.1 React stack

Рекомендуется:

| Библиотека | Назначение |
|---|---|
| React 18 | UI |
| React Router DOM | маршрутизация |
| React Query / TanStack Query | API state |
| Zustand или Redux Toolkit | глобальное состояние |
| React Hook Form | формы |
| Zod | валидация |
| Framer Motion | анимации |
| Fluent UI / MUI | базовые компоненты |
| date-fns | работа с датами |

---

# 4. Архитектура фронтенда

## 4.1 Структура ClientApp/src

```text
src/
├── api/
├── app/
├── components/
├── features/
│   ├── goals/
│   ├── projects/
│   ├── tasks/
│   ├── timeTracking/
│   ├── executors/
│   └── comments/
├── layouts/
├── pages/
├── routes/
├── shared/
├── styles/
└── utils/
5. Основные сущности UI
5.1 Goal (Цель)
Отображение
Карточка цели должна содержать:

название;
описание;
прогресс;
количество проектов;
количество задач;
индикатор активности.
Поведение
При раскрытии аккордеона:

отображаются проекты;
отображается агрегированный прогресс;
доступны быстрые действия.
Прогресс
Прогресс цели вычисляется:

как средний Progress проектов;
отображается progress bar;
цвет:
серый: 0%
синий: 1–79%
зелёный: 80–100%

5.2 Project (Проект)
Карточка проекта:

title;
description;
progress;
tasks count;
completed tasks;
кнопка добавления задачи.
Раскрытие проекта
Внутри:

список задач;
фильтры;
быстрый поиск;
группировка.

5.3 TaskItem (Задача)
Главная рабочая сущность интерфейса.

Карточка задачи
Должна содержать:

Поле	Отображение
Title	крупный текст
Status	цветной badge
Priority	badge
Executor	avatar/name
Time spent	часы
Comments count	иконка
Timer state	running/stopped

5.4 Executor
Отображение:

avatar;
name;
email;
текущие активные задачи.

5.5 Comment
Комментарии:

inline;
без отдельной страницы;
markdown-lite;
поддержка enter submit.

5.6 TimeEntry
Отображение:

duration;
date;
executor;
linked task.

6. Главные экраны
6.1 Dashboard
Назначение
Главный рабочий экран.

Layout

┌───────────────────────────────┐
│ TopBar                        │
├───────────────┬───────────────┤
│ Sidebar       │ Main Content  │
│               │               │
│               │ Dashboard     │
│               │ Widgets       │
└───────────────┴───────────────┘
Виджеты Dashboard
1. My Active Tasks
Список активных задач:

статус;
таймер;
быстрый старт.
2. Goal Progress
Карточки целей:

progress;
overdue indicators.
3. Time Today
Показывает:

суммарные часы;
active timer;
timeline.
4. Recent Activity
Лента:

комментарии;
создание задач;
изменение статусов;
логирование времени.

6.2 Goals Page
Основной UX
Использовать:

accordion goals;
projects внутри;
задачи внутри проекта.
Не использовать:

tree view.
Структура

Goal Accordion
 ├─ Project Accordion
 │   ├─ Task Cards
 │   ├─ Filters
 │   └─ Quick Actions
Функции
Goal actions
create;
edit;
archive;
delete.
Project actions
create task;
filter tasks;
view analytics.
6.3 Task Board
Назначение
Основной экран управления задачами.

Режимы отображения
Board View
Kanban:

ToDo;
InProgress;
Done;
Canceled.
List View
Табличный compact режим.

Drag & Drop
Поддерживается:

изменение статуса;
reorder.
6.4 Task Details Page
Layout

┌─────────────────────────────┐
│ Header                      │
├─────────────┬───────────────┤
│ Main        │ Right Panel   │
│             │               │
│ Description │ Timer         │
│ Comments    │ Time entries  │
│ Activity    │ Meta info     │
└─────────────┴───────────────┘
Header
Содержит:

title;
status;
priority;
executor;
actions.
Timer panel
Ключевая часть UX.

Возможности
Start timer;
Pause;
Stop;
Add manual entry;
Continue previous timer.
Требования
Таймер должен:

работать без переходов;
быть доступным из любой страницы;
поддерживать persistence;
сохраняться после refresh.
6.5 Time Tracking Page
Назначение
Просмотр учёта времени.

Компоненты
Timeline
Дневная временная шкала.

Calendar
Просмотр:

day;
week;
month.
Reports
total hours;
by project;
by executor;
by goal.
7. Навигация
7.1 Sidebar
Пункты:

Dashboard
Goals
Projects
Tasks
Time Tracking
Executors
Settings
7.2 TopBar
Содержит:

global search;
active timer;
notifications;
profile menu.
8. Поиск и фильтрация
8.1 Глобальный поиск
Поиск:

задач;
проектов;
целей;
исполнителей.
8.2 Фильтры задач
Поддерживать:

Фильтр	Тип
Status	multi-select
Priority	multi-select
Executor	select
Date	range
Goal	select
Project	select
8.3 UX фильтров
Использовать:

chips;
dropdown;
accordion filter panels.
Не использовать:

сложные nested trees.
9. Компоненты интерфейса
9.1 Reusable Components
TaskCard
Состояния:

hover;
selected;
dragging;
active timer.
ProgressBar
Поддержка:

animation;
segmented state.
TimerWidget
Режимы:

compact;
expanded;
floating.
AccordionSection
Главный контейнер иерархий.

10. Работа с API
10.1 API структура

/api/goals
/api/projects
/api/tasks
/api/executors
/api/comments
/api/timeentries
10.2 React Query
Использовать:

caching;
optimistic updates;
background refetch;
stale management.
11. Управление состоянием
Global state
Хранить:

active timer;
auth;
ui settings;
filters.
12. Формы
Требования
Все формы:

inline validation;
optimistic UX;
autosave где уместно.
Создание задачи
Поля:

title;
description;
status;
priority;
executor;
project.
13. Responsive Design
Desktop
Основной режим.

Tablet
Sidebar collapse.

Mobile
Использовать:

bottom navigation;
full-screen overlays;
stacked layout.
14. Accessibility
Требования:

keyboard navigation;
aria labels;
contrast AA;
focus states.
15. Темы
Поддержка:

light;
dark;
system mode.
16. Производительность
Требования
lazy loading routes;
code splitting;
virtualization для длинных списков;
debounce search;
memoization.
17. Ошибки и состояния
Loading
Использовать:

skeletons;
shimmer.
Empty states
Показывать:

CTA;
подсказки.
Error states
Использовать:

toast;
retry.
18. Безопасность
Требования
sanitize markdown;
CSRF protection;
secure token storage;
role-aware UI.
19. Будущие расширения
Подготовить архитектуру для:

realtime updates;
notifications;
AI summaries;
calendar integrations;
sprint planning;
analytics dashboard.
20. Приоритет реализации
Phase 1
Layout
Navigation
Goals
Projects
Tasks
Timer
Basic filters
Phase 2
Reports
Advanced filtering
Dashboard widgets
Comments
Activity feed
Phase 3
Realtime
Notifications
PWA
Analytics

21. Ключевые UX-акценты
Главное отличие продукта
Система должна:

связывать задачи с целями;
делать time tracking естественной частью workflow;
не перегружать интерфейс;
давать быстрый доступ к актуальной работе.

22. Основные сценарии пользователя
Сценарий 1 — Работа над задачей
Пользователь открывает Dashboard
Выбирает активную задачу
Запускает таймер
Работает
Добавляет комментарий
Переводит задачу в Done
Сценарий 2 — Планирование
Создание Goal
Добавление Projects
Добавление Tasks
Назначение исполнителей
Отслеживание progress
Сценарий 3 — Анализ времени
Открытие Time Tracking
Просмотр timeline
Анализ часов по проектам
Поиск узких мест
23. Definition of Done (Frontend)
Фронтенд считается завершённым если:

все сущности доменной модели поддерживаются UI;
задачи и цели связаны визуально;
таймер работает глобально;
интерфейс responsive;
присутствуют фильтры;
SPA корректно работает через ASP.NET fallback routing;
поддерживаются light/dark темы;
отсутствуют tree views;
используется accordion-first UX.

23. Взаимодействие с базой данных PostgreSql идёт через сборку JiraClone.Data