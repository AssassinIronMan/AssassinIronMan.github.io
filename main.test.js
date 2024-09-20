// Install dependencies: npm install jest jsdom

// Filename: main.test.js

// Mocking getCookie, setCookie, navigator.mediaDevices and other required objects
const { setCookie, getCookie, loadSettings, saveSettings, resetSettings, startDetection, detectPops } = require('./main.js');  // Assuming you move your JS code to 'main.js'

// Mock DOM functions
document.cookie = '';
document.getElementById = jest.fn().mockReturnValue({
    value: '',
    textContent: '',
    style: {},
    appendChild: jest.fn()
});

beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
});

describe('Cookie Management', () => {
    test('setCookie sets a cookie correctly', () => {
        setCookie('volumeThresholdDB', -25, 7);
        expect(document.cookie).toBe('volumeThresholdDB=-25; path=/');
    });

    test('getCookie retrieves a cookie correctly', () => {
        document.cookie = 'volumeThresholdDB=-25';
        expect(getCookie('volumeThresholdDB')).toBe('-25');
    });

    test('getCookie returns null if cookie not found', () => {
        document.cookie = '';
        expect(getCookie('nonExistentCookie')).toBeNull();
    });
});

describe('Settings Management', () => {
    test('loadSettings loads default values if no cookies are set', () => {
        loadSettings();
        expect(document.getElementById('volumeThreshold').value).toBe(defaultSettings.volumeThresholdDB.toString());
        expect(document.getElementById('sensitivity').value).toBe(defaultSettings.fftSize.toString());
        expect(document.getElementById('smoothingTimeConstant').value).toBe(defaultSettings.smoothingTimeConstant.toString());
        expect(document.getElementById('popInterval').value).toBe(defaultSettings.popInterval.toString());
    });

    test('saveSettings sets the correct cookies', () => {
        volumeThresholdDB = -20;
        fftSize = 512;
        smoothingTimeConstant = 0.5;
        popInterval = 5;

        saveSettings();
        expect(document.cookie).toContain('volumeThresholdDB=-20');
        expect(document.cookie).toContain('fftSize=512');
        expect(document.cookie).toContain('smoothingTimeConstant=0.5');
        expect(document.cookie).toContain('popInterval=5');
    });

    test('resetSettings resets values to defaults', () => {
        resetSettings();
        expect(document.getElementById('volumeThreshold').value).toBe(defaultSettings.volumeThresholdDB.toString());
        expect(document.getElementById('sensitivity').value).toBe(defaultSettings.fftSize.toString());
        expect(document.getElementById('smoothingTimeConstant').value).toBe(defaultSettings.smoothingTimeConstant.toString());
        expect(document.getElementById('popInterval').value).toBe(defaultSettings.popInterval.toString());
    });
});

describe('Microphone Detection', () => {
    test('startDetection initializes microphone and audio context', async () => {
        const mockStream = {}; // Mock audio stream
        global.navigator.mediaDevices = {
            getUserMedia: jest.fn().mockResolvedValue(mockStream),
        };

        await startDetection();

        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: { deviceId: undefined } });
        expect(audioContext).toBeInstanceOf(AudioContext);
    });

    test('detectPops calculates RMS and detects pops', () => {
        analyser = {
            getByteTimeDomainData: jest.fn(() => {
                // Mock a sample with high values to simulate a loud pop
                dataArray = new Uint8Array([255, 255, 255, 255]);
            })
        };
        
        detectPops();
        expect(popCount).toBeGreaterThan(0);
    });
});