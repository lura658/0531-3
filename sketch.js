let video;
let facemesh;
let predictions = [];

let handpose;
let handPredictions = [];

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  // 加入 handpose
  handpose = ml5.handpose(video, handModelReady);
  handpose.on('predict', results => {
    handPredictions = results;
  });
}

function modelReady() {
  // 臉部模型載入完成
}

function handModelReady() {
  // 手部模型載入完成
}

function draw() {
  image(video, 0, 0, width, height);

  let gesture = "";
  if (handPredictions.length > 0) {
    const hand = handPredictions[0];
    for (let i = 0; i < hand.landmarks.length; i++) {
      const [x, y, z] = hand.landmarks[i];
      fill(0, 255, 0);
      noStroke();
      ellipse(x, y, 10, 10);
    }
    // 剪刀石頭布判斷
    gesture = detectGesture(hand.landmarks);
    fill(0);
    textSize(32);
    text(gesture, 20, 50);
  }

  // 臉部關鍵點
  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;
    let idx = 94; // 預設額頭
    if (gesture === "石頭") idx = 1;      // 鼻子
    else if (gesture === "剪刀") idx = 33; // 右眼
    else if (gesture === "布") idx = 152;  // 下巴
    console.log("手勢:", gesture, "關鍵點idx:", idx);
    const [x, y] = keypoints[idx];
    noFill();
    stroke(255, 0, 0);
    strokeWeight(4);
    ellipse(x, y, 50, 50);
  }
}

// 簡單判斷剪刀石頭布
function detectGesture(landmarks) {
  // tips: [8, 12, 16, 20] 分別為食指、中指、無名指、小指
  // 判斷食指和中指是否伸直
  let isIndexExtended = landmarks[8][1] < landmarks[6][1];
  let isMiddleExtended = landmarks[12][1] < landmarks[10][1];
  let isRingExtended = landmarks[16][1] < landmarks[14][1];
  let isPinkyExtended = landmarks[20][1] < landmarks[18][1];
  let thumbExtended = landmarks[4][0] > landmarks[3][0];

  // 石頭：全部彎曲
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && !thumbExtended) {
    return "石頭";
  }
  // 剪刀：食指和中指伸直，其餘彎曲
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended && !thumbExtended) {
    return "剪刀";
  }
  // 布：全部伸直
  if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    return "布";
  }
  return "";
}
