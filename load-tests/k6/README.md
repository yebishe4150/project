# k6 load tests

Нагрузочные сценарии для локального backend через gateway.

## Что нужно

- Запущенная локальная инфраструктура и сервисы.
- `k6` в PATH.
- Gateway по умолчанию на `http://localhost:8080`.

Проверка:

```powershell
k6 version
```

## Seed пользователей

Сначала создай тестовых пользователей. Скрипт идет медленно специально: `user-service` ограничивает internal create до `30/min`, поэтому 50 регистраций занимают около двух минут.

```powershell
k6 run load-tests/k6/seed-users.js
```

Переменные:

```powershell
$env:BASE_URL = "http://localhost:8080"
$env:USERS = "100"
$env:SEED_PREFIX = "loadtest"
k6 run load-tests/k6/seed-users.js
```

Скрипт идемпотентный для практики: `409 Conflict` при повторном запуске считается нормальным результатом.

## 100 одновременных пользователей

Основной сценарий логинит 100 пользователей в `setup()`, затем каждый VU работает со своим access token и своим `X-Forwarded-For`.

```powershell
k6 run load-tests/k6/mixed-100-users.js
```

Переменные:

```powershell
$env:BASE_URL = "http://localhost:8080"
$env:USERS = "100"
$env:DURATION = "5m"
$env:SEED_PREFIX = "loadtest"
k6 run load-tests/k6/mixed-100-users.js
```

Сценарий:

- `GET /api/v1/content/public/feed`
- `GET /api/v1/content` с JWT
- `GET /api/v1/content/search` с JWT
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `GET /api/v1/content/images/user/uploads`
- `GET /api/v1/content/gallery/tags`, затем `GET /api/v1/content/gallery/tags/{tagId}/images`
- редкий `POST /api/v1/auth/refresh`
- редкий session recycle: `POST /api/v1/auth/logout`, затем `POST /api/v1/auth/login`

Rate limit остается включенным. Каждый виртуальный пользователь получает отдельный `X-Forwarded-For`, чтобы тест был похож на 100 разных клиентов, а не на один IP.

## Как читать результат

Смотри:

- `http_req_duration`: общий p95/p99.
- `feed_duration`, `public_content_duration`, `search_duration`: публичные read endpoints.
- `me_duration`, `uploads_duration`: авторизованные endpoints.
- `refresh_duration`, `logout_duration`, `login_duration`: auth-cycle.
- `update_me_duration`: обновление профиля.
- `gallery_tags_duration`, `gallery_images_duration`: галерея.
- `rate_limited_responses`: сколько было `429`.
- `unexpected_statuses`: все не-2xx и не-429.

Первый ориентир для локалки:

- read p95 до `300-500ms`;
- read p99 до `1000ms`;
- `429` в mixed-сценарии должен быть нулевым или объяснимым.
