// audioDetection.test.js

const { setCookie, getCookie, loadSettings, saveSettings, resetSettings } = require('./audioDetection'); // Adjust the import based on your structure

describe('Audio Detection Settings', () => {
    beforeEach(() => {
        // Clear cookies before each test
        document.cookie = '';
        // Reset settings
        resetSettings();
    });

    test('setCookie sets a cookie with correct name and value', () => {
        setCookie('testCookie', 'testValue', 7);
        expect(getCookie('testCookie')).toBe('testValue');
    });

    test('getCookie returns null for a non-existing cookie', () => {
        expect(getCookie('nonExisting')).toBeNull();
    });

    test('loadSettings loads default settings when cookies are not set', () => {
        loadSettings();
        expect(volumeThresholdDB).toBe(-30);
        expect(fftSize).toBe(256);
        expect(smoothingTimeConstant).toBe(0.3);
        expect(popInterval).toBe(2);
    });

    test('saveSettings saves settings to cookies', () => {
        volumeThresholdDB = -20;
        fftSize = 512;
        smoothingTimeConstant = 0.5;
        popInterval = 3;
        saveSettings();
        
        expect(getCookie('volumeThresholdDB')).toBe('-20');
        expect(getCookie('fftSize')).toBe('512');
        expect(getCookie('smoothingTimeConstant')).toBe('0.5');
        expect(getCookie('popInterval')).toBe('3');
    });

    test('resetSettings resets settings to defaults', () => {
        volumeThresholdDB = -10; // Change to non-default
        resetSettings();
        expect(volumeThresholdDB).toBe(-30);
        expect(fftSize).toBe(256);
        expect(smoothingTimeConstant).toBe(0.3);
        expect(popInterval).toBe(2);
    });
});
