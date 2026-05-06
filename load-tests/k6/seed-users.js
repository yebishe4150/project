import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERS = Number(__ENV.USERS || '100');
const PREFIX = __ENV.SEED_PREFIX || 'loadtest';
const PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest123';
const REGISTER_DELAY_SECONDS = Number(__ENV.REGISTER_DELAY_SECONDS || '2.2');

const createdUsers = new Counter('created_users');
const existingUsers = new Counter('existing_users');
const failedRegistrations = new Counter('failed_registrations');

export const options = {
  vus: 1,
  iterations: USERS,
  thresholds: {
    failed_registrations: ['count==0'],
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

function userFor(index) {
  const padded = String(index).padStart(3, '0');

  return {
    loginName: `${PREFIX}_${padded}`,
    password: PASSWORD,
    email: `${PREFIX}_${padded}@example.test`,
    phoneNumber: `+7900000${padded}`,
    ip: `10.10.0.${index}`,
  };
}

export default function () {
  const index = __ITER + 1;
  const user = userFor(index);

  const response = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      loginName: user.loginName,
      password: user.password,
      email: user.email,
      phoneNumber: user.phoneNumber,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': user.ip,
      },
      tags: { endpoint: 'register' },
    },
  );

  const ok = check(response, {
    'register created or already exists': (r) => r.status === 200 || r.status === 409,
  });

  if (response.status === 200) {
    createdUsers.add(1);
  } else if (response.status === 409) {
    existingUsers.add(1);
  } else {
    failedRegistrations.add(1);
  }

  if (!ok) {
    console.error(`register failed for ${user.loginName}: status=${response.status} body=${response.body}`);
  }

  sleep(REGISTER_DELAY_SECONDS);
}
