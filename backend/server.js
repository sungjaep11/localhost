const express = require('express'); // 설치한 express 라이브러리를 불러옵니다.
const cors = require('cors');
const app = express(); // express 객체를 하나 만듭니다.
const port = 8080; // 서버가 실행될 포트 번호입니다. (3000, 5000 등도 가능)

app.use(cors());

// 1. 누군가 내 서버 메인 주소('/')로 접속하면 실행될 코드
app.get('/', (req, res) => {
  res.send('축하합니다! Node.js 백엔드 서버가 성공적으로 실행되었습니다!');
});

// 2. 서버 실행 시작 (귀를 열고 대기)
app.listen(port, () => {
  console.log(`서버가 켜졌습니다! 주소: http://localhost:${port}`);
});