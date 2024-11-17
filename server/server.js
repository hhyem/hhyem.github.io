const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require("cors");
const path = require('path');
const port = 3000;
app.use(cors()); // 모든 출처에서의 요청 허용

app.use(express.json()); // JSON 파싱 미들웨어

// MongoDB Atlas 설정 
const mongoURI ='mongodb+srv://privacy:YAdL8GKCGZXinHjz@privacy.8c1ya.mongodb.net/?retryWrites=true&w=majority&appName=privacy';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Atlas에 연결되었습니다.'))
  .catch(err => console.error('MongoDB Atlas 연결 실패:', err));

// 정적 파일 서빙을 위한 미들웨어 설정 (client 폴더의 정적 파일 서빙)
app.use(express.static(path.join(__dirname, '../client')));

// 기본 경로 '/'에 대한 요청 처리 - index.html을 직접 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Mongoose 스키마 정의
const motionDataSchema = new mongoose.Schema({
    sensorId: String,  // 어떤 센서에서 오는 데이터인지 식별할 수 있도록
    timestamp: { type: Date, default: Date.now },  // 수집된 시간
    acceleration: {
      x: Number,
      y: Number,
      z: Number
    },
    rotationRate: {
      alpha: Number,
      beta: Number,
      gamma: Number
    }
  });

const MotionData = mongoose.model('MotionData', motionDataSchema);

// 데이터 저장 엔드포인트
app.post('/api/motion-data', async (req, res) => {
  const data = req.body.motionData || [];
  if (data.length > 0) {
    // 데이터에 타임스탬프 추가
    const motionDataEntries = data.map(entry => ({
      ...entry,
      received_at: new Date()
    }));

    try {
      // MongoDB Atlas에 데이터 저장
      await MotionData.insertMany(motionDataEntries);
      res.status(200).json({ status: 'success', message: 'Data saved' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'Database error', error: err.message });
    }
  } else {
    res.status(400).json({ status: 'error', message: 'No data received' });
  }
});

// 서버 실행
app.listen(3000, () => {
  console.log('서버가 3000번 포트에서 실행 중입니다.');
});
