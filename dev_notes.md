# Dev Notes

## 2026-08-14

### Создан файл mimo.md с предложениями по развитию проекта

Проведён полный анализ кодовой базы проекта AspNetReactWebApp (JiraClone). Создан файл `mimo.md` с детальными предложениями по развитию, включающий:

- **4 критических проблемы**: несовпадение БД в docker-compose, несовместимость CI/Dockerfile, мусорный текст в JSX, дублирующие Password-поля
- **5 проблем безопасности**: дефолтный admin-пароль, отсутствие rate limiting, CSRF, авторизация на GET-эндпоинты, SameSite cookie
- **6 архитектурных улучшений backend**: разделение DbService, Application Service Layer, валидация через FluentValidation, Swagger
- **7 улучшений frontend**: миграция на hooks, Context API, разбивка компонентов, React Query, lazy loading, TypeScript
- **4 инфраструктурных улучшения**: docker-compose, CI с тестами, healthchecks, контроль миграций
- **Дорожная карта из 5 этапов** на 8+ недель

#### Выявленные проблемы в коде:
- `docker-compose.yml`: `POSTGRES_DB=TestDb` vs connection string `Database=TestAiNvkzDb`
- `AuthController.cs:37`: дефолтный пароль `SimpleJira`
- `TimeEntriesPage.js:149,155`: случайный мусорный текст в JSX
- `DbService.cs`: God Service на 226 строк
- Все React-компоненты на class components (антипаттерн для React 18)
- 0 backend-тестов, 1 smoke-тест frontend

### Очистка мусорного кода

Удалён мусорный код из проекта:

1. **TimeEntriesPage.js**: удалён случайный текст (строки 149, 155)
2. **setupProxy.js**: удалён неиспользуемый прокси-путь `/weatherforecast`
3. **package.json**: удалены неиспользуемые зависимости:
   - `jquery` (^3.6.4)
   - `oidc-client` (^1.11.5)
   - `merge` (^2.1.1)
4. **FetchData.js и Counter.js**: файлы не найдены (уже удалены ранее)
