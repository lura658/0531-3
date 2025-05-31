let video;
let facemesh;
let predictions = [];

let handpose;
let handPredictions = [];

let gameState = "start"; // start, quiz, result
let currentQuestion = 0;
let selectedAnswer = "";
let showResult = false;
let score = 0;
let quizQuestions = [];
let showEffect = false;
let effectType = ""; // "correct" or "wrong"
let effectTimer = 0;

// 題庫（p5.js、教學原理、教育心理、攝影基礎）
const allQuestions = [
  {
    q: "p5.js 中用來建立畫布的函式是？",
    options: ["A. createCanvas", "B. createRect", "C. makeCanvas", "D. setupCanvas"],
    answer: "A"
  },
  {
    q: "皮亞傑認為兒童在什麼階段開始具備抽象思考能力？",
    options: ["A. 感覺動作期", "B. 前運思期", "C. 具體運思期", "D. 形式運思期"],
    answer: "D"
  },
  {
    q: "布魯姆認知領域的最低層次是？",
    options: ["A. 理解", "B. 應用", "C. 記憶", "D. 分析"],
    answer: "C"
  },
  {
    q: "攝影中調整亮度最直接的參數是？",
    options: ["A. 快門速度", "B. 光圈", "C. ISO", "D. 白平衡"],
    answer: "C"
  },
  {
    q: "p5.js 中哪個函式會在每一幀自動執行？",
    options: ["A. setup", "B. draw", "C. loop", "D. frame"],
    answer: "B"
  },
  {
    q: "教學設計三要素不包含下列哪一項？",
    options: ["A. 學習目標", "B. 教學活動", "C. 評量方式", "D. 學生年齡"],
    answer: "D"
  },
  {
    q: "攝影中用來控制景深的主要參數是？",
    options: ["A. 光圈", "B. 快門", "C. ISO", "D. 對焦模式"],
    answer: "A"
  },
  {
    q: "p5.js 中要設定背景顏色應該用哪個函式？",
    options: ["A. fill", "B. stroke", "C. background", "D. color"],
    answer: "C"
  },
  {
    q: "維果斯基強調學習的哪個概念？",
    options: ["A. 操作性條件作用", "B. 區近發展", "C. 自我效能", "D. 觀察學習"],
    answer: "B"
  },
  {
    q: "攝影中，白平衡主要影響什麼？",
    options: ["A. 亮度", "B. 色溫", "C. 對比", "D. 銳利度"],
    answer: "B"
  }
];

// 載入圖示
let checkImg, crossImg;
function preload() {
  checkImg = loadImage('https://i.imgur.com/4L7bYlT.png'); // 綠色勾勾
  crossImg = loadImage('https://i.imgur.com/6YQbQkA.png'); // 紅色叉叉
}

function setup() {
  createCanvas(900, 480).position(
    (windowWidth - 900) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, handModelReady);
  handpose.on('predict', results => {
    handPredictions = results;
  });
}

function modelReady() {}
function handModelReady() {}

function draw() {
  background(255);

  // 左側：攝影機與互動
  image(video, 0, 0, 640, 480);

  // 臉部特效
  if (predictions.length > 0 && showEffect) {
    const keypoints = predictions[0].scaledMesh;
    let headX = keypoints[10][0];
    let headY = keypoints[10][1];
    if (effectType === "correct") {
      // 綠色勾勾在頭頂
      image(checkImg, headX - 30, headY - 100, 60, 60);
      drawFireworks(headX, headY - 100);
    } else if (effectType === "wrong") {
      // 紅色叉叉在頭頂
      image(crossImg, headX - 30, headY - 100, 60, 60);
      drawBlackLines(keypoints);
    }
  }

  // 右側：遊戲內容
  fill(240);
  noStroke();
  rect(640, 0, 260, 480);

  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);

  if (gameState === "start") {
    text("教育科技課程知識大挑戰", 660, 40);
    textSize(16);
    text("歡迎來到知識大亂鬥！\n\n1. 按 Enter 鍵開始隨機五題挑戰\n2. 用手勢選擇答案：\n   - 1 指：A\n   - 2 指：B\n   - 3 指：C\n   - 4 指：D\n3. 答對有特效，全部答完顯示分數\n\n快來挑戰你的教育科技腦力吧！", 660, 90);
  } else if (gameState === "quiz") {
    showQuestion();
    showHandGesture();
  } else if (gameState === "result") {
    text("挑戰結束！", 660, 60);
    text("你的分數：" + score + " / 5", 660, 120);
    text("按 Enter 再來一輪！", 660, 180);
  }
}

function showQuestion() {
  let q = quizQuestions[currentQuestion];
  fill(0);
  textSize(18);
  text("第 " + (currentQuestion + 1) + " 題：", 660, 40);
  text(q.q, 660, 70);
  textSize(16);
  for (let i = 0; i < q.options.length; i++) {
    let y = 120 + i * 40;
    let opt = q.options[i];
    if (selectedAnswer === String.fromCharCode(65 + i)) {
      fill(0, 150, 255);
      rect(655, y - 5, 240, 35, 8);
      fill(255);
    } else {
      fill(0);
    }
    text(opt, 670, y);
  }
  if (showResult) {
    fill(q.answer === selectedAnswer ? "green" : "red");
    text(q.answer === selectedAnswer ? "答對了！" : "答錯了！正確答案：" + q.answer, 660, 320);
    text("3 秒後自動進入下一題...", 660, 350);
  }
}

function showHandGesture() {
  if (handPredictions.length > 0 && !showResult) {
    const hand = handPredictions[0];
    let count = countExtendedFingers(hand.landmarks);
    let answer = "";
    if (count >= 1 && count <= 4) {
      answer = String.fromCharCode(64 + count); // 1->A, 2->B, 3->C, 4->D
      selectedAnswer = answer;
      showResult = true;
      showEffect = true;
      effectType = (answer === quizQuestions[currentQuestion].answer) ? "correct" : "wrong";
      if (effectType === "correct") score++;
      effectTimer = millis();
      setTimeout(() => {
        selectedAnswer = "";
        showResult = false;
        showEffect = false;
        currentQuestion++;
        if (currentQuestion >= 5) {
          gameState = "result";
        }
      }, 3000);
    }
  }
}

// 計算伸出的手指數量
function countExtendedFingers(landmarks) {
  let tips = [8, 12, 16, 20]; // 食指、中指、無名指、小指
  let count = 0;
  for (let i = 0; i < tips.length; i++) {
    if (landmarks[tips[i]][1] < landmarks[tips[i] - 2][1]) count++;
  }
  // 拇指判斷
  if (landmarks[4][0] > landmarks[3][0]) count++;
  return count;
}

function keyPressed() {
  if (gameState === "start" && keyCode === ENTER) {
    quizQuestions = shuffle(allQuestions).slice(0, 5);
    gameState = "quiz";
    currentQuestion = 0;
    score = 0;
    selectedAnswer = "";
    showResult = false;
    showEffect = false;
  }
  if (gameState === "result" && keyCode === ENTER) {
    gameState = "start";
  }
}

// 煙火特效
function drawFireworks(x, y) {
  push();
  for (let i = 0; i < 12; i++) {
    let angle = TWO_PI / 12 * i;
    let len = 40 + 10 * sin((millis() - effectTimer) / 200 + i);
    stroke(0, 200 + random(-30, 30), 0);
    strokeWeight(3);
    line(x, y, x + len * cos(angle), y + len * sin(angle));
  }
  pop();
}

// 答錯黑線特效
function drawBlackLines(keypoints) {
  let x = keypoints[10][0];
  let y = keypoints[10][1] - 20;
  push();
  stroke(0);
  strokeWeight(5);
  for (let i = -30; i <= 30; i += 20) {
    line(x + i, y, x + i + random(-5, 5), y + 30 + random(0, 10));
  }
  pop();
}
