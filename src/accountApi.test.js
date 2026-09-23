import { placeOrder } from './accountApi';

function mockFetchOnce(body, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
}

const CHECKOUT_INFO = {
  name: 'Test User',
  email: 'user@example.com',
  payment_method: 'paypal',
};

afterEach(() => {
  jest.resetAllMocks();
});

test('authenticated checkout sends the Authorization header and no session_id', async () => {
  mockFetchOnce({ id: 1 });

  await placeOrder('fake-token', CHECKOUT_INFO, 'guest-session-abc');

  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [, options] = global.fetch.mock.calls[0];
  expect(options.headers.Authorization).toBe('Bearer fake-token');

  const sentBody = JSON.parse(options.body);
  expect(sentBody.session_id).toBeUndefined();
});

test('guest checkout (no token) sends session_id and no Authorization header', async () => {
  mockFetchOnce({ id: 2 });

  await placeOrder(null, CHECKOUT_INFO, 'guest-session-abc');

  const [, options] = global.fetch.mock.calls[0];
  expect(options.headers.Authorization).toBeUndefined();

  const sentBody = JSON.parse(options.body);
  expect(sentBody.session_id).toBe('guest-session-abc');
  expect(sentBody.name).toBe('Test User'); // rest of the checkout info still goes through
});

test('sends the Idempotency-Key header when one is provided, and omits it otherwise', async () => {
  mockFetchOnce({ id: 3 });
  await placeOrder('fake-token', CHECKOUT_INFO, 'guest-session-abc', 'attempt-key-123');
  expect(global.fetch.mock.calls[0][1].headers['Idempotency-Key']).toBe('attempt-key-123');

  mockFetchOnce({ id: 4 });
  await placeOrder('fake-token', CHECKOUT_INFO, 'guest-session-abc');
  expect(global.fetch.mock.calls[0][1].headers['Idempotency-Key']).toBeUndefined();
});

test('a failed request throws using the error message from the response body', async () => {
  mockFetchOnce({ detail: 'Cart is empty' }, false);

  await expect(placeOrder(null, CHECKOUT_INFO, 'guest-session-abc')).rejects.toThrow('Cart is empty');
});

test('a structured error (object detail) exposes code and details instead of stringifying', async () => {
  mockFetchOnce({
    detail: {
      code: 'PRICE_CHANGED',
      message: 'The price of one or more items changed. Review and confirm to continue.',
      changes: [{ product_id: 'red-suit', old_price: 220, new_price: 275 }],
    },
  }, false);

  try {
    await placeOrder(null, CHECKOUT_INFO, 'guest-session-abc');
    throw new Error('expected placeOrder to reject');
  } catch (err) {
    expect(err.message).toBe('The price of one or more items changed. Review and confirm to continue.');
    expect(err.code).toBe('PRICE_CHANGED');
    expect(err.details.changes).toEqual([{ product_id: 'red-suit', old_price: 220, new_price: 275 }]);
  }
});
