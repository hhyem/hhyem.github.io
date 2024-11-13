let randomNumber = Math.floor(Math.random() * 500) + 1;
let attempts = 0;
let maxAttempts = 20;
let motionData = []; // 모션 센서 데이터 수집 배열
const SERVER_URL = "https://b7dd-1-232-39-83.ngrok-free.app/";

// 모션 데이터 수집 권한 요청
async function requestMotionPermission() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState === 'granted') {
                startMotionCapture(); // 권한이 허용되면 데이터 수집 시작
            } else {
                console.warn('모션 데이터 수집 권한이 거부되었습니다.');
            }
        } catch (error) {
            console.error('모션 데이터 권한 요청 오류:', error);
        }
    } else {
        startMotionCapture(); // 권한 요청이 필요하지 않으면 바로 시작
    }
}

// DeviceMotionEvent로 가속도 및 회전 속도 데이터 수집
function handleMotionEvent(event) {
    const { acceleration, rotationRate } = event;
    const data = {
        timestamp: Date.now(),
        acceleration: {
            x: acceleration.x || 0,
            y: acceleration.y || 0,
            z: acceleration.z || 0
        },
        rotationRate: {
            alpha: rotationRate.alpha || 0,
            beta: rotationRate.beta || 0,
            gamma: rotationRate.gamma || 0
        }
    };
    motionData.push(data);

    // 데이터 개수 제한 (50개 초과 시 가장 오래된 데이터 제거)
    if (motionData.length > 50) motionData.shift();

    console.log("센서 데이터:", data);
}

// 주기적으로 모션 데이터를 서버에 전송
function sendMotionData() {
    if (motionData.length > 0) {
        fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motionData })
        })
        .then(response => response.json())
        .then(data => {
            console.log("서버 응답:", data);
        })
        .catch(error => console.error("서버 전송 에러:", error));

        motionData = []; // 전송 후 배열 초기화
    }
}

// 모션 데이터 수집 시작
function startMotionCapture() {
    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleMotionEvent);
    } else {
        console.warn("DeviceMotionEvent is not supported on this device.");
    }
}

// 페이지 로드 시 권한 요청
window.onload = function() {
    requestMotionPermission();
};

// 게임 로직과 관련된 코드
document.getElementById('submitGuess').addEventListener('click', function() {
    const guessInput = document.getElementById('guess').value.trim();
    const guess = Number(guessInput);
    attempts++;
    let resultText = '';
    let attemptsLeft = maxAttempts - attempts;

    if (guessInput === '') {
        alert('숫자를 입력하세요.');
        attempts--;
        return;
    } else if (guess < 1 || guess > 500) {
        resultText = '1부터 500 사이의 숫자를 입력하세요.';
    } else if (guess > randomNumber) {
        resultText = '더 작은 숫자를 시도해 보세요.';
    } else if (guess < randomNumber) {
        resultText = '더 큰 숫자를 시도해 보세요.';
    } else {
        resultText = `축하합니다! ${attempts}번 만에 맞추셨습니다!`;
        document.getElementById('result').innerText = resultText;
        document.getElementById('attemptsLeft').style.display = 'none';
        document.getElementById('restart').style.display = 'block';
        document.getElementById('submitGuess').disabled = true;
        return;
    }

    if (attemptsLeft > 0) {
        document.getElementById('result').innerText = resultText;
        document.getElementById('attemptsLeft').innerText = `남은 횟수: ${attemptsLeft}`;
    } else {
        resultText = '모든 횟수를 다 사용했습니다. 다시 시도해 보세요!';
        document.getElementById('restart').style.display = 'block';
        document.getElementById('submitGuess').disabled = true;
    }
    document.getElementById('result').innerText = resultText;
});

// 주기적으로 모션 데이터를 서버에 전송 (3초마다 전송)
setInterval(sendMotionData, 3000);
