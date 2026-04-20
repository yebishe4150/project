# Backend Microservices

Репозиторий содержит backend-часть проекта на Spring Boot с микросервисной архитектурой.

## Структура

Основной код находится в папке `backend/`.

- `backend/auth-service` — сервис аутентификации и refresh/access token логики
- `backend/user-service` — сервис пользователей
- `backend/content-service` — сервис контента и изображений
- `backend/gateway-service` — API Gateway на Spring Cloud Gateway
- `backend/common-logging-starter` — общий logging starter
- `backend/docker-compose.yml` — локальная инфраструктура и контейнерный запуск

## Технологии

- Java 21
- Spring Boot
- Spring Security
- Spring Cloud Gateway
- OpenFeign
- PostgreSQL
- Liquibase
- MinIO
- Maven

## Сервисы и порты

- Gateway: `8080`
- Auth Service: `8081`
- User Service: `8082`
- Content Service: `8083`
- MinIO API: `9000`
- MinIO Console: `9001`
- PostgreSQL Auth: `5433`
- PostgreSQL User: `5434`
- PostgreSQL Content: `5435`

## Запуск локально

Запускать сервисы можно отдельно через Maven wrapper внутри каждого модуля.

Примеры:

```powershell
cd backend/auth-service
.\mvnw.cmd spring-boot:run
```

```powershell
cd backend/user-service
.\mvnw.cmd spring-boot:run
```

```powershell
cd backend/content-service
.\mvnw.cmd spring-boot:run
```

```powershell
cd backend/gateway-service
.\mvnw.cmd spring-boot:run
```

## Docker Compose

Инфраструктура и контейнерный запуск описаны в:

- [backend/docker-compose.yml](G:\project\backend\backend\docker-compose.yml)

На текущий момент после рефакторинга структуры стоит проверить пути `build:` в compose-файле: файл находится уже внутри `backend/`, а пути всё ещё выглядят как `./backend/...`.

## Документация API

В `auth-service` включён SpringDoc:

- docs: `/docs`
- swagger-ui: `/swagger`

Остальные сервисы также используют стандартную Spring Boot структуру и конфиги в `src/main/resources/application.yml`.

## Логирование

Общий логирующий стартер расположен в:

- `backend/common-logging-starter`

Он содержит общий `logback-spring.xml` и фильтр логирования HTTP-запросов/ответов с маскированием чувствительных данных.

## Тесты

В проекте есть unit/integration test классы для сервисов, включая интеграционные тесты `auth-service` с WireMock.

Примеры запуска:

```powershell
cd backend/auth-service
.\mvnw.cmd test
```

## Замечания

- Конфигурации сервисов и `docker-compose.yml` стоит держать синхронизированными по локальным портам и путям.
- В репозитории есть локальный Maven cache `.m2/`, но он исключён из git через корневой `.gitignore`.
