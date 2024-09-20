// popcornHelper.test.js
// Jest test suite for the Popcorn Pop Detection JavaScript functions

// Mocking document.cookie for tests
let mockCookies = {};

beforeEach(() => {
  mockCookies = {};
  Object.defineProperty(document, 'cookie', {
    get: jest.fn(() => {
      return Object.entries(mockCookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }),
    set: jest.fn((cookieString) => {
      const [cookie] = cookieString.split(';');
      const [key, value] = cookie.split('=');
      mockCookies[key] = value;
    }),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// Unit tests for the setCookie function
test('setCookie sets a cookie with a name, value, and expiration', () => {
  setCookie('volumeThresholdDB', '-20', 7);
  expect(document.cookie).toBe('volumeThresholdDB=-20');
});

// Unit tests for the getCookie function
test('getCookie returns the correct cookie value', () => {
  document.cookie = 'volumeThresholdDB=-20';
  const value = getCookie('volumeThresholdDB');
  expect(value).toBe('-20');
});

test('getCookie returns null if the cookie does not exist', () => {
  const value = getCookie('nonExistentCookie');
  expect(value).toBeNull();
});

// Unit tests for loadSettings function
test('loadSettings loads settings from cookies and updates the DOM', () => {
  document.body.innerHTML = `
    <input id="volumeThreshold" value="">
    <input id="sensitivity" value="">
    <input id="smoothingTimeConstant" value="">
    <input id="popInterval" value="">
    <span id="thresholdValue"></span>
    <span id="sensitivityValue"></span>
    <span id="smoothingTimeConstantValue"></span>
    <span id="popIntervalValue"></span>
  `;

  document.cookie = 'volumeThresholdDB=-25';
  document.cookie = 'fftSize=512';
  document.cookie = 'smoothingTimeConstant=0.5';
  document.cookie = 'popInterval=3';

  loadSettings();

  expect(document.getElementById('volumeThreshold').value).toBe('-25');
  expect(document.getElementById('sensitivity').value).toBe('512');
  expect(document.getElementById('smoothingTimeConstant').value).toBe('0.5');
  expect(document.getElementById('popInterval').value).toBe('3');

  expect(document.getElementById('thresholdValue').textContent).toBe('-25');
  expect(document.getElementById('sensitivityValue').textContent).toBe('512');
  expect(document.getElementById('smoothingTimeConstantValue').textContent).toBe('0.5');
  expect(document.getElementById('popIntervalValue').textContent).toBe('3');
});

// Unit tests for saveSettings function
test('saveSettings saves settings to cookies', () => {
  document.body.innerHTML = `
    <input id="volumeThreshold" value="-40">
    <input id="sensitivity" value="256">
    <input id="smoothingTimeConstant" value="0.2">
    <input id="popInterval" value="4">
  `;

  saveSettings();

  expect(document.cookie).toContain('volumeThresholdDB=-40');
  expect(document.cookie).toContain('fftSize=256');
  expect(document.cookie).toContain('smoothingTimeConstant=0.2');
  expect(document.cookie).toContain('popInterval=4');
});

// Unit tests for resetSettings function
test('resetSettings resets settings to default values and updates the DOM', () => {
  document.body.innerHTML = `
    <input id="volumeThreshold" value="-40">
    <input id="sensitivity" value="512">
    <input id="smoothingTimeConstant" value="0.7">
    <input id="popInterval" value="10">
    <span id="thresholdValue"></span>
    <span id="sensitivityValue"></span>
    <span id="smoothingTimeConstantValue"></span>
    <span id="popIntervalValue"></span>
  `;

  resetSettings();

  expect(document.getElementById('volumeThreshold').value).toBe('-30');
  expect(document.getElementById('sensitivity').value).toBe('256');
  expect(document.getElementById('smoothingTimeConstant').value).toBe('0.3');
  expect(document.getElementById('popInterval').value).toBe('2');

  expect(document.getElementById('thresholdValue').textContent).toBe('-30');
  expect(document.getElementById('sensitivityValue').textContent).toBe('256');
  expect(document.getElementById('smoothingTimeConstantValue').textContent).toBe('0.3');
  expect(document.getElementById('popIntervalValue').textContent).toBe('2');
});
