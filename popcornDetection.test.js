let mockAudioContext, mockAnalyser, mockMicrophone;

beforeAll(() => {
    global.MediaStream = jest.fn();
    global.AudioContext = jest.fn(() => mockAudioContext);
    global.navigator.mediaDevices = {
        getUserMedia: jest.fn().mockResolvedValue(new global.MediaStream()),
        enumerateDevices: jest.fn().mockResolvedValue([{ kind: 'audioInput', deviceId: '1', label: 'Microphone 1' }]),
    };
});

beforeEach(() => {
    // Reset mocks before each test
    mockAudioContext = {
        createMediaStreamSource: jest.fn().mockReturnValue({ connect: jest.fn() }),
        close: jest.fn(),
    };

    mockAnalyser = {
        fftSize: 256,
        smoothingTimeConstant: 0.3,
        frequencyBinCount: 128,
        getByteTimeDomainData: jest.fn(),
    };
});

// Sample unit tests
describe('Popcorn Detection Functions', () => {
    test('should set default settings correctly', () => {
        loadSettings();
        expect(document.getElementById('volumeThreshold').value).toBe('-30');
        expect(document.getElementById('sensitivity').value).toBe('256');
        expect(document.getElementById('smoothingTimeConstant').value).toBe('0.3');
        expect(document.getElementById('popInterval').value).toBe('2');
    });

    test('should update settings', () => {
        document.getElementById('volumeThreshold').value = '-20';
        updateSettings();
        expect(volumeThresholdDB).toBe(-20);
        expect(document.getElementById('thresholdValue').textContent).toBe('-20');
    });

    test('should start detection', async () => {
        await startDetection();
        expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalled();
        expect(mockAnalyser.fftSize).toBe(256);
    });

    test('should stop detection', () => {
        stopDetection();
        expect(mockAudioContext.close).toHaveBeenCalled();
        expect(detectionStopped).toBe(true);
    });

    test('should correctly detect pops', () => {
        const dataArray = new Uint8Array(mockAnalyser.frequencyBinCount);
        for (let i = 0; i < dataArray.length; i++) {
            dataArray[i] = Math.random() * 255; // Simulate random audio data
        }
        mockAnalyser.getByteTimeDomainData.mockImplementation((array) => {
            array.set(dataArray);
        });

        detectPops();
        expect(popCount).toBeGreaterThan(0); // Adjust this based on your expected results
    });
});
