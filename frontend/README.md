# PinPet Frontend

Фронтенд PinPet на React. Приложение работает с лентой изображений,
профилями пользователей, галереей коллекций, загрузкой фотографий,
AI-генерацией изображений, поиском по тегам и лайками.

## Стек

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- CSS Modules
- Axios и Fetch API helpers
- Lucide React

## Требования

- Node.js 20 или новее
- npm
- запущенный backend gateway для сценариев с авторизацией

## Запуск

Установить зависимости:

```bash
npm install
```

При необходимости создать локальный `.env` из примера:

```bash
copy .env.example .env
```

Запустить dev-сервер:

```bash
npm run dev
```

Собрать production-бандл:

```bash
npm run build
```

Запустить ESLint:

```bash
npm run lint
```

Открыть preview production-сборки:

```bash
npm run preview
```

## Структура проекта

```text
frontend/
  public/       статические браузерные файлы
  src/
    app/        оболочка приложения, роутинг, провайдеры, глобальные стили
    pages/      страницы верхнего уровня
    widgets/    крупные составные UI-блоки
    features/   пользовательские сценарии и feature-логика
    entities/   доменные UI- и data-модули
    shared/     общие API helpers, конфиги и утилиты
```

## Маршруты

- `/` - главная лента
- `/gallery` - коллекции галереи с поиском по тегам и раскрывающимися сетками изображений
- `/profile/:nickname` - публичная страница профиля
- `/profile/:nickname/me` - приватная страница профиля

## Основные возможности

- модальное окно авторизации, refresh-сессии, logout и helpers для защищенных API-запросов
- главная лента с карточками пинов
- публичный и приватный профиль пользователя
- загрузка изображений и входная точка для AI-генерации
- вкладки контента профиля и empty states
- коллекции галереи, загружаемые по тегам
- отдельная коллекция изображений без тегов
- поиск тегов с debounce и синхронизацией с query-параметрами URL
- ленивая загрузка изображений в галерее с ограничением параллельных запросов
- карточки изображений с лайками и снятием лайков
- dev fallback-данные для галереи, если backend временно недоступен

## API

Фронтовые API-запросы идут через `/api/v1` в `src/shared/api/apiClient.ts`.
В локальной разработке proxy Vite должен направлять `/api` на backend gateway.
Авторизованные запросы добавляют access token, если он есть, и один раз
повторяются после успешного refresh.

Эндпоинты галереи, которые использует фронтенд:

- `GET /content/tags`
- `GET /content/tag/{tagId}`
- `GET /content`
- `GET /content/search`
- `PUT /content/images/{imageId}/like`
- `DELETE /content/images/{imageId}/like`

## Переменные окружения

В `.env.example` лежат опциональные dev-флаги:

```text
VITE_ENABLE_DEV_PROFILE_MOCK=false
VITE_ENABLE_DEV_PROFILE_404_MOCK=false
```

## Заметки

- Проект следует облегченной Feature-Sliced Design структуре.
- CSS изолирован через CSS Modules, кроме глобальных стилей приложения.
- Неиспользуемые шаблонные assets от Vite удалены.
- Часть dev fallback-данных галереи использует Picsum images и состояние
  лайков в localStorage, чтобы UI можно было проверять без полностью
  доступного backend.
