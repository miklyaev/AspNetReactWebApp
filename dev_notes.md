# Dev Notes

## 2026-09-29

### Понятное сообщение при неудачном входе

**Область:** Frontend

**Что изменилось:**
- `client.js`: `request()` теперь прикрепляет HTTP-статус к ошибке (`error.status`)
- `ProfilePanel.js`: при 401 от `/api/auth/login` в форме логина выводится «Пользователь с таким логином и паролем не найден.» вместо технического «Request failed with status 401»; другие ошибки показываются как раньше

**Затронутые пути:**
- `AspNetReactApp/ClientApp/src/api/client.js`
- `AspNetReactApp/ClientApp/src/components/ProfilePanel.js`

## 2026-09-28

### Валидация формата email сотрудников (Leaders/Executors)

**Область:** Backend | Frontend

**Что изменилось:**
- Backend: новый хелпер `AspNetReactApp/Validation/EmailValidator.cs` (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
- `LeadersController`/`ExecutorsController`: POST и PUT возвращают 400 `Invalid email format.` при неверном формате email (раньше PUT вообще не проверял email и падал в 500 на null/пустой строке)
- `Home.js`: формы добавления Leader/Executor и модалка редактирования проверяют формат email (хелпер `isValidEmail`, тот же regex) и показывают текст «Некорректный формат email» через `invalid-feedback` (раньше ошибки задавались, но не выводились)

**Затронутые пути:**
- `AspNetReactApp/Validation/EmailValidator.cs` (новый)
- `AspNetReactApp/Controllers/LeadersController.cs`
- `AspNetReactApp/Controllers/ExecutorsController.cs`
- `AspNetReactApp/ClientApp/src/components/Home.js`


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
