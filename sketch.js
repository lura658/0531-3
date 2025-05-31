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

// p5.js 問答題庫
const questions = [
  {
    q: "p5.js 中用來建立畫布的函式是？",
    options: ["A. createCanvas", "B. createRect", "C. makeCanvas", "D. setupCanvas"],
    answer: "A"
  },
  {
    q: "哪個函式會在每一幀自動執行？",
    options: ["A. setup", "B. draw", "C. loop", "D. frame"],
    answer: "B"
  },
  {
    q: "要設定背景顏色應該用哪個函式？",
    options: ["A. fill", "B. stroke", "C. background", "D. color"],
    answer: "C"
  }
];

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

  // 臉部裝飾
  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    ellipse(keypoints[1][0], keypoints[1][1], 50, 50); // 鼻子
  }

  // 右側：遊戲內容
  fill(240);
  noStroke();
  rect(640, 0, 260, 480);

  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);

  if (gameState === "start") {
    text("p5.js 基礎知識問答遊戲", 660, 40);
    textSize(16);
    text("操作說明：\n\n1. 按 Enter 鍵開始遊戲\n2. 用手勢選擇答案：\n   - 1 指：A\n   - 2 指：B\n   - 3 指：C\n   - 4 指：D\n3. 答對得 1 分，全部答完顯示分數", 660, 90);
  } else if (gameState === "quiz") {
    showQuestion();
    showHandGesture();
  } else if (gameState === "result") {
    text("遊戲結束！", 660, 60);
    text("你的分數：" + score + " / " + questions.length, 660, 120);
    text("按 Enter 重新開始", 660, 180);
  }
}

function showQuestion() {
  let q = questions[currentQuestion];
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
      if (answer === questions[currentQuestion].answer) score++;
      setTimeout(() => {
        selectedAnswer = "";
        showResult = false;
        currentQuestion++;
        if (currentQuestion >= questions.length) {
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
    gameState = "quiz";
    currentQuestion = 0;
    score = 0;
    selectedAnswer = "";
    showResult = false;
  }
  if (gameState === "result" && keyCode === ENTER) {
    gameState = "start";
  }
}
