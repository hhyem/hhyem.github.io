document.addEventListener("DOMContentLoaded", function() {
    const SERVER_URL = "https://dory-unbiased-marlin.ngrok-free.app/api/motion-data"; // 외부에서 접근 가능한 서버 URL

    // 모션 센서 데이터 수집 배열
    let motionData = [];

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const restartButton = document.getElementById("restartGame");
    const messageElement = document.getElementById("message");
    let player = { x: 40, y: 40, size: 40, color: "red" };
    const blockSize = canvas.width / 10;
    const maze = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 0, 1, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

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
        if (motionData.length > 50) motionData.shift(); // 데이터 개수 제한
    }
    // 서버로 모션 센서 데이터 전송
    function sendMotionData() {
        if (motionData.length > 0) {
            fetch(SERVER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ motionData })
            })
            .then(response => response.json())
            .then(data => console.log("Data sent to server:", data))
            .catch(error => console.error("Error sending data:", error));

            motionData = []; // 전송 후 배열 초기화
        }
    }

    // 주기적으로 모션 데이터를 서버에 전송
    setInterval(sendMotionData, 3000);

    function startMotionCapture() {
        if (window.DeviceMotionEvent) {
            window.addEventListener("devicemotion", handleMotionEvent);
        } else {
            console.warn("DeviceMotionEvent is not supported on this device.");
        }
    }

    function startGame() {
        document.addEventListener("keydown", movePlayer);
        drawMaze();
        drawPlayer();
        messageElement.textContent = "화면의 미로에서 캐릭터를 움직여 탈출하세요!";
    }

    function drawMaze() {
        for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze[row].length; col++) {
                if (maze[row][col] === 1) {
                    ctx.fillStyle = "#000";
                    ctx.fillRect(col * blockSize, row * blockSize, blockSize, blockSize);
                }
            }
        }
    }

    function drawPlayer() {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }

    function movePlayer(event) {
        let newX = player.x;
        let newY = player.y;
        if (event.key === "ArrowUp") {
            newY -= blockSize;
        } else if (event.key === "ArrowDown") {
            newY += blockSize;
        } else if (event.key === "ArrowLeft") {
            newX -= blockSize;
        } else if (event.key === "ArrowRight") {
            newX += blockSize;
        }

        // Check if the new position is within bounds and not a wall
        const row = Math.floor(newY / blockSize);
        const col = Math.floor(newX / blockSize);
        if (maze[row] && maze[row][col] === 0) {
            player.x = newX;
            player.y = newY;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawMaze();
            drawPlayer();
        }

        // Check if player has reached the exit
        if (row === maze.length - 1 && col === maze[0].length - 1) {
            messageElement.textContent = "축하합니다! 미로를 탈출하셨습니다!";
            document.removeEventListener("keydown", movePlayer); // 게임 종료 후 이동 방지
        }
    }

    restartButton.addEventListener("click", function() {
        player.x = 40;
        player.y = 40;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        startGame();
    });

    startGame();
    startMotionCapture();
});
