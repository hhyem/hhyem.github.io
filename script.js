let randomNumber = Math.floor(Math.random() * 500) + 1;
let attempts = 0;
let maxAttempts = 20;
let sensorData = { acceleration: { x: 0, y: 0, z: 0 }, rotationRate: { alpha: 0, beta: 0, gamma: 0 } };
let deviceInfo = navigator.userAgent;
let motionData = []; // 모션 센서 데이터 수집 배열

const SERVER_URL = "https://7c6e-1-232-39-83.ngrok-free.app/";

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

// 페이지 로드 시 권한 요청
window.onload = function() {
    requestMotionPermission();
};

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
        },
    };
    motionData.push(data);
    
    // 데이터 개수 제한
    if (motionData.length > 50) motionData.shift();
    
    // 센서 데이터 콘솔에 출력
    console.log("센서 데이터:", data);
}

function sendMotionData(acceleration, rotationRate) {
    const data = {
        acceleration: acceleration,
        rotationRate: rotationRate,
        deviceInfo: navigator.userAgent,  // 기기 정보
        numberValue: document.getElementById("guess").value  // 입력된 숫자 값
    };

    console.log('보내는 센서 데이터:', data);  // 센서 데이터를 콘솔에 출력

    fetch(SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)  // 데이터를 JSON 형식으로 전송
    })
    .then(response => response.json())
    .then(data => {
        console.log('서버 응답:', data);
    })
    .catch(error => console.error('에러:', error));
}

// 주기적으로 모션 데이터를 서버에 전송
setInterval(sendMotionData, 5000);  //5초마다 전송

function startMotionCapture() {
    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleMotionEvent);
    } else {
        console.warn("DeviceMotionEvent is not supported on this device.");
    }
}

// 페이지 로드 시 권한 요청 및 기기 정보 출력
window.onload = function() {
    requestMotionPermission();  // 권한 요청 시작
    console.log("기기 정보:", deviceInfo);
};

// 게임 로직
document.getElementById('submitGuess').addEventListener('click', function() {
    const guessInput = document.getElementById('guess').value.trim();
    const guess = Number(guessInput);  // 사용자가 입력한 값
    attempts++;
    let resultText = '';
    let attemptsLeft = maxAttempts - attempts;
    // 사용자가 입력한 숫자 값을 가져오기
    const userInput = document.getElementById("guess").value;
    
    // 입력값이 비어 있지 않은지 확인하고, 숫자 형태로 변환
    if (userInput) {
        const guessNumber = parseInt(userInput);
        
        console.log("사용자가 입력한 숫자: ", guessNumber); // 입력된 숫자 출력
        // 서버로 입력된 숫자 값을 전송
        // sendNumberToServer(guess);
    } else {
        console.log("숫자가 입력되지 않았습니다.");
    }

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
        resultText = '축하합니다 ${attempts}번 만에 맞추셨습니다';
        document.getElementById('result').innerText = resultText;
        document.getElementById('attemptsLeft').style.display = 'none';
        document.getElementById('restart').style.display = 'block';
        document.getElementById('submitGuess').disabled = true;
        return;
    }

    if (attempts >= 5 && attempts < 10) {
        resultText +=  \n(힌트 : ${randomNumber.toString().length}자리 숫자입니다.);
    } else if (attempts >= 10 && attempts < 15) {
        const lastDigit = randomNumber % 10;
        resultText +=  \n(힌트 : 마지막 자리 숫자는 ${lastDigit}입니다.);
    } else if (attempts >= 15 && attempts < 20) {
        const secondDigit = Math.floor((randomNumber % 100) / 10);
        resultText +=  \n(힌트 : 두 번째 자리 숫자는 ${secondDigit}입니다.);
    }

    if (attemptsLeft > 0 && resultText.includes('시도해 보세요.')) {
        document.getElementById('result').innerText = resultText;
        document.getElementById('attemptsLeft').innerText = 남은 횟수: ${attemptsLeft};
    } else if (attemptsLeft === 0 && !resultText.includes('축하합니다!')) {
        resultText = '모든 횟수를 다 사용했습니다. 다시 시도해 보세요!';
        document.getElementById('restart').style.display = 'block';
        document.getElementById('submitGuess').disabled = true;
        document.getElementById('attemptsLeft').innerText = 남은 횟수: 0;
    }

    document.getElementById('result').innerText = resultText;
});

document.getElementById('restart').addEventListener('click', function() {
    randomNumber = Math.floor(Math.random() * 500) + 1;
    attempts = 0;
    document.getElementById('result').innerText = '';
    document.getElementById('guess').value = '';
    document.getElementById('attemptsLeft').innerText = 남은 횟수: ${maxAttempts};
    document.getElementById('attemptsLeft').style.display = 'block';
    document.getElementById('restart').style.display = 'none';
    document.getElementById('submitGuess').disabled = false;
});
