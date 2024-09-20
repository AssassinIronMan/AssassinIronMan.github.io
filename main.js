let audioContext, microphone, analyser, dataArray;
let volumeThresholdDB = -30;
let fftSize = 256;
let smoothingTimeConstant = 0.3;
let popCount = 0;
let silenceTimeout;
let canvas, canvasCtx, width, height;
let popInterval = 2; // Default pop interval in seconds
let timerInterval;
let detectionStopped = true; // Default to stopped
let remainingTime = popInterval;
let selectedMicId = null; // Store the selected microphone ID

const defaultSettings = {
    volumeThresholdDB: -30,
    fftSize: 256,
    smoothingTimeConstant: 0.3,
    popInterval: 2
};

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function loadSettings() {
    volumeThresholdDB = parseFloat(getCookie('volumeThresholdDB')) || defaultSettings.volumeThresholdDB;
    fftSize = parseInt(getCookie('fftSize')) || defaultSettings.fftSize;
    smoothingTimeConstant = parseFloat(getCookie('smoothingTimeConstant')) || defaultSettings.smoothingTimeConstant;
    popInterval = parseInt(getCookie('popInterval')) || defaultSettings.popInterval;

    document.getElementById('volumeThreshold').value = volumeThresholdDB;
    document.getElementById('sensitivity').value = fftSize;
    document.getElementById('smoothingTimeConstant').value = smoothingTimeConstant;
    document.getElementById('popInterval').value = popInterval;

    document.getElementById('thresholdValue').textContent = volumeThresholdDB;
    document.getElementById('sensitivityValue').textContent = fftSize;
    document.getElementById('smoothingTimeConstantValue').textContent = smoothingTimeConstant;
    document.getElementById('popIntervalValue').textContent = popInterval;
}

function saveSettings() {
    setCookie('volumeThresholdDB', volumeThresholdDB, 7);
    setCookie('fftSize', fftSize, 7);
    setCookie('smoothingTimeConstant', smoothingTimeConstant, 7);
    setCookie('popInterval', popInterval, 7);
}

function resetSettings() {
    volumeThresholdDB = defaultSettings.volumeThresholdDB;
    fftSize = defaultSettings.fftSize;
    smoothingTimeConstant = defaultSettings.smoothingTimeConstant;
    popInterval = defaultSettings.popInterval;

    document.getElementById('volumeThreshold').value = volumeThresholdDB;
    document.getElementById('sensitivity').value = fftSize;
    document.getElementById('smoothingTimeConstant').value = smoothingTimeConstant;
    document.getElementById('popInterval').value = popInterval;

    document.getElementById('thresholdValue').textContent = volumeThresholdDB;
    document.getElementById('sensitivityValue').textContent = fftSize;
    document.getElementById('smoothingTimeConstantValue').textContent = smoothingTimeConstant;
    document.getElementById('popIntervalValue').textContent = popInterval;
}

async function startDetection() {
    if (detectionStopped) {
        try {
            document.getElementById('status').textContent = "Listening...";
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedMicId ? { exact: selectedMicId } : undefined } });
            audioContext = new AudioContext();
            microphone = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = fftSize;
            analyser.smoothingTimeConstant = smoothingTimeConstant;

            dataArray = new Uint8Array(analyser.frequencyBinCount);
            microphone.connect(analyser);

            visualizeWaveform();
            detectPops();
            detectionStopped = false; // Set to not stopped
            popCount = 0; // Reset pop count on start
            document.getElementById('popCount').textContent = `Count: ${popCount}`;
            resetTimer(); // Reset timer
        } catch (error) {
            document.getElementById('status').textContent = "Error: Unable to access microphone.";
            console.error('Error accessing microphone:', error);
        }
    }
}

function visualizeWaveform() {
    canvas = document.getElementById('waveformCanvas');
    canvasCtx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = 200; // Fix height for clarity
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawWaveform() {
        requestAnimationFrame(drawWaveform);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#007bff';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width / analyser.fftSize;
        let x = 0;

        for (let i = 0; i < analyser.fftSize; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    drawWaveform();
}

function detectPops() {
    analyser.getByteTimeDomainData(dataArray);
    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
        rms += Math.pow(dataArray[i] - 128, 2);
    }
    rms = Math.sqrt(rms / dataArray.length);
    const decibels = 20 * Math.log10(rms / 128);

    if (decibels > volumeThresholdDB) {
        popCount++;
        document.getElementById('popCount').textContent = `Count: ${popCount}`; // Update count on page
        if (silenceTimeout) {
            clearTimeout(silenceTimeout);
        }

        resetTimer();

        silenceTimeout = setTimeout(() => {
            if (!detectionStopped) {
                showPopup('Popcorn DONE!');
                stopDetection();
            }
        }, popInterval * 1000); // Using popInterval
    }

    requestAnimationFrame(detectPops);
}

function stopDetection() {
    if (audioContext) {
        audioContext.close();
        document.getElementById('status').textContent = 'Detection stopped.';
        detectionStopped = true;
        clearTimeout(silenceTimeout);
        clearInterval(timerInterval); // Fixes timer reset
    }
}

function updateSettings() {
    volumeThresholdDB = parseFloat(document.getElementById('volumeThreshold').value);
    fftSize = parseInt(document.getElementById('sensitivity').value);
    smoothingTimeConstant = parseFloat(document.getElementById('smoothingTimeConstant').value);
    popInterval = parseInt(document.getElementById('popInterval').value);
    selectedMicId = document.getElementById('micSelect').value;

    document.getElementById('thresholdValue').textContent = volumeThresholdDB;
    document.getElementById('sensitivityValue').textContent = fftSize;
    document.getElementById('smoothingTimeConstantValue').textContent = smoothingTimeConstant;
    document.getElementById('popIntervalValue').textContent = popInterval;
    resetTimer(); // Reset timer

    if (!detectionStopped) {
        stopDetection();
        startDetection();
    }
}

function showPopup(message) {
    const popup = document.getElementById('popup');
    popup.querySelector('.message').textContent = message;
    popup.style.display = 'block';
}

function closePopup() {
    stopDetection(); // Ensure detection is stopped when closing the popup
    document.getElementById('popup').style.display = 'none';
}

function resetTimer() {
    remainingTime = popInterval;
    document.getElementById('timer').textContent = `Time remaining: ${remainingTime}s`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        remainingTime--;
        document.getElementById('timer').textContent = `Time remaining: ${remainingTime}s`;
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer').textContent = 'Time remaining: 0s';
        }
    }, 1000);
}

async function loadMicOptions() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const micSelect = document.getElementById('micSelect');
    devices.forEach(device => {
        if (device.kind === 'audioinput') {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${micSelect.length + 1}`;
            micSelect.appendChild(option);
        }
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadMicOptions();
    document.getElementById('startButton').addEventListener('click', startDetection);
    document.getElementById('stopButton').addEventListener('click', stopDetection);
    document.getElementById('saveButton').addEventListener('click', saveSettings);
    document.getElementById('resetButton').addEventListener('click', resetSettings);
    document.getElementById('updateButton').addEventListener('click', updateSettings);
    document.getElementById('closePopupButton').addEventListener('click', closePopup);
});
