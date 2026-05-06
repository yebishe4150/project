import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERS = Number(__ENV.USERS || '100');
const DURATION = __ENV.DURATION || '5m';
const PREFIX = __ENV.SEED_PREFIX || 'loadtest';
const PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest123';

const feedDuration = new Trend('feed_duration', true);
const publicContentDuration = new Trend('public_content_duration', true);
const searchDuration = new Trend('search_duration', true);
const meDuration = new Trend('me_duration', true);
const uploadsDuration = new Trend('uploads_duration', true);
const updateMeDuration = new Trend('update_me_duration', true);
const galleryTagsDuration = new Trend('gallery_tags_duration', true);
const galleryImagesDuration = new Trend('gallery_images_duration', true);
const refreshDuration = new Trend('refresh_duration', true);
const logoutDuration = new Trend('logout_duration', true);
const loginDuration = new Trend('login_duration', true);
const rateLimitedResponses = new Counter('rate_limited_responses');
const unexpectedStatuses = new Counter('unexpected_statuses');

export const options = {
  scenarios: {
    mixed_50_users: {
      executor: 'constant-vus',
      vus: USERS,
      duration: DURATION,
      gracefulStop: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    feed_duration: ['p(95)<500', 'p(99)<1000'],
    public_content_duration: ['p(95)<500', 'p(99)<1000'],
    search_duration: ['p(95)<500', 'p(99)<1000'],
    me_duration: ['p(95)<500', 'p(99)<1000'],
    uploads_duration: ['p(95)<500', 'p(99)<1000'],
    update_me_duration: ['p(95)<500', 'p(99)<1000'],
    gallery_tags_duration: ['p(95)<500', 'p(99)<1000'],
    gallery_images_duration: ['p(95)<500', 'p(99)<1000'],
    refresh_duration: ['p(95)<1000', 'p(99)<2000'],
    logout_duration: ['p(95)<500', 'p(99)<1000'],
    login_duration: ['p(95)<1000', 'p(99)<2000'],
    rate_limited_responses: ['count==0'],
    unexpected_statuses: ['count==0'],
  },
};

function userFor(index) {
  const padded = String(index).padStart(3, '0');

  return {
    loginName: `${PREFIX}_${padded}`,
    password: PASSWORD,
    ip: `10.10.0.${index}`,
  };
}

function headersFor(user, token) {
  const headers = {
    'X-Forwarded-For': user.ip,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function jsonHeadersFor(user, token) {
  return {
    ...headersFor(user, token),
    'Content-Type': 'application/json',
  };
}

function cookieHeadersFor(user, cookie, token) {
  return {
    ...headersFor(user, token),
    Cookie: cookie,
  };
}

function extractRefreshCookie(response) {
  const setCookie = response.headers['Set-Cookie'];

  if (!setCookie) {
    return null;
  }

  const match = setCookie.match(/refreshToken=[^;]*/);
  return match ? match[0] : null;
}

function record(response, trend) {
  trend.add(response.timings.duration);

  if (response.status === 429) {
    rateLimitedResponses.add(1);
  } else if (response.status < 200 || response.status >= 300) {
    unexpectedStatuses.add(1);
  }
}

function get(path, user, token, trend, endpoint) {
  const response = http.get(`${BASE_URL}${path}`, {
    headers: headersFor(user, token),
    tags: { endpoint },
  });

  record(response, trend);

  check(response, {
    [`${endpoint} returned 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

function login(session) {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      loginName: session.user.loginName,
      password: session.user.password,
    }),
    {
      headers: jsonHeadersFor(session.user, null),
      tags: { endpoint: 'login' },
    },
  );

  record(response, loginDuration);

  check(response, {
    'login returned 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  if (response.status >= 200 && response.status < 300) {
    const body = response.json();
    const token = body?.data?.accessToken;
    const cookie = extractRefreshCookie(response);

    if (token) {
      session.token = token;
    }

    if (cookie) {
      session.refreshCookie = cookie;
    }
  }
}

function refresh(session) {
  if (!session.refreshCookie) {
    login(session);
    return;
  }

  const response = http.post(`${BASE_URL}/api/v1/auth/refresh`, null, {
    headers: cookieHeadersFor(session.user, session.refreshCookie, null),
    tags: { endpoint: 'refresh' },
  });

  record(response, refreshDuration);

  check(response, {
    'refresh returned 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  if (response.status >= 200 && response.status < 300) {
    const body = response.json();
    const token = body?.data?.accessToken;
    const cookie = extractRefreshCookie(response);

    if (token) {
      session.token = token;
    }

    if (cookie) {
      session.refreshCookie = cookie;
    }
  }
}

function logout(session) {
  const response = http.post(`${BASE_URL}/api/v1/auth/logout`, null, {
    headers: cookieHeadersFor(session.user, session.refreshCookie, null),
    tags: { endpoint: 'logout' },
  });

  record(response, logoutDuration);

  check(response, {
    'logout returned 2xx': (r) => r.status >= 200 && r.status < 300,
  });
}

function updateMe(session) {
  const response = http.put(
    `${BASE_URL}/api/v1/users/me`,
    JSON.stringify({
      firstName: `Load${__VU}`,
    }),
    {
      headers: jsonHeadersFor(session.user, session.token),
      tags: { endpoint: 'update_me' },
    },
  );

  record(response, updateMeDuration);

  check(response, {
    'update_me returned 2xx': (r) => r.status >= 200 && r.status < 300,
  });
}

function galleryFlow(session) {
  const tagsResponse = http.get(`${BASE_URL}/api/v1/content/gallery/tags`, {
    headers: headersFor(session.user, session.token),
    tags: { endpoint: 'gallery_tags' },
  });

  record(tagsResponse, galleryTagsDuration);

  check(tagsResponse, {
    'gallery_tags returned 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  if (tagsResponse.status < 200 || tagsResponse.status >= 300) {
    return;
  }

  const tags = tagsResponse.json()?.data || [];
  if (tags.length === 0 || !tags[0]?.id) {
    return;
  }

  const tag = tags[Math.floor(Math.random() * tags.length)];
  const imagesResponse = http.get(`${BASE_URL}/api/v1/content/gallery/tags/${tag.id}/images`, {
    headers: headersFor(session.user, session.token),
    tags: { endpoint: 'gallery_images' },
  });

  record(imagesResponse, galleryImagesDuration);

  check(imagesResponse, {
    'gallery_images returned 2xx': (r) => r.status >= 200 && r.status < 300,
  });
}

export function setup() {
  const sessions = [];

  for (let i = 1; i <= USERS; i += 1) {
    const user = userFor(i);
    const response = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        loginName: user.loginName,
        password: user.password,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': user.ip,
        },
        tags: { endpoint: 'login_setup' },
      },
    );

    if (response.status !== 200) {
      throw new Error(`login failed for ${user.loginName}: status=${response.status} body=${response.body}`);
    }

    const body = response.json();
    const token = body?.data?.accessToken;
    const refreshCookie = extractRefreshCookie(response);

    if (!token) {
      throw new Error(`login did not return accessToken for ${user.loginName}: body=${response.body}`);
    }

    if (!refreshCookie) {
      throw new Error(`login did not return refreshToken cookie for ${user.loginName}: headers=${JSON.stringify(response.headers)}`);
    }

    sessions.push({ user, token, refreshCookie });
    sleep(0.05);
  }

  return { sessions };
}

export default function (data) {
  const session = data.sessions[(__VU - 1) % data.sessions.length];
  const roll = Math.random();

  if (roll < 0.36) {
    get('/api/v1/content/public/feed', session.user, null, feedDuration, 'public_feed');
  } else if (roll < 0.54) {
    get('/api/v1/content', session.user, session.token, publicContentDuration, 'content_all');
  } else if (roll < 0.68) {
    get('/api/v1/content/search?tags=test', session.user, session.token, searchDuration, 'search');
  } else if (roll < 0.78) {
    get('/api/v1/users/me', session.user, session.token, meDuration, 'me');
  } else if (roll < 0.88) {
    get('/api/v1/content/images/user/uploads', session.user, session.token, uploadsDuration, 'uploads');
  } else if (roll < 0.95) {
    galleryFlow(session);
  } else if (roll < 0.98) {
    updateMe(session);
  } else if (roll < 0.99) {
    refresh(session);
  } else {
    logout(session);
    login(session);
  }

  sleep(Math.random() * 0.2 + 0.5);
}
