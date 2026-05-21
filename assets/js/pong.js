/* AICS pong — pixel-art ping-pong game on the home page. */
(function () {
  'use strict';

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const context = canvas.getContext('2d');

  function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const aspectRatio = 1.5;

    let newWidth, newHeight;
    if (containerWidth / containerHeight > aspectRatio) {
      newHeight = containerHeight;
      newWidth = newHeight * aspectRatio;
    } else {
      newWidth = containerWidth;
      newHeight = newWidth / aspectRatio;
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
    updateGameParameters();
  }
  window.addEventListener('load', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);

  let grid, paddleHeight, maxPaddleY, paddleSpeed, ballSpeed;
  let leftScore = 0;
  let rightScore = 0;
  let particles = [];

  function updateGameParameters() {
    grid = Math.max(15, Math.floor(canvas.width / 40));
    paddleHeight = grid * 6;
    maxPaddleY = canvas.height - paddleHeight;
    paddleSpeed = Math.max(5, Math.floor(canvas.width / 120));
    ballSpeed = Math.max(4, Math.floor(canvas.width / 150));

    leftPaddle.width = grid;
    leftPaddle.height = paddleHeight;
    leftPaddle.x = grid * 2;
    leftPaddle.y = canvas.height / 2 - paddleHeight / 2;

    rightPaddle.width = grid;
    rightPaddle.height = paddleHeight;
    rightPaddle.x = canvas.width - grid * 3;
    rightPaddle.y = canvas.height / 2 - paddleHeight / 2;

    ball.width = grid;
    ball.height = grid;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ball.dx > 0 ? ballSpeed : -ballSpeed;
    ball.dy = ball.dy > 0 ? ballSpeed : -ballSpeed;
  }

  grid = 25;
  paddleHeight = grid * 6;
  maxPaddleY = canvas.height - paddleHeight;
  paddleSpeed = 8;
  ballSpeed = 6;

  const leftPaddle = {
    x: grid * 2,
    y: canvas.height / 2 - paddleHeight / 2,
    width: grid,
    height: paddleHeight,
    dy: 0
  };
  const rightPaddle = {
    x: canvas.width - grid * 3,
    y: canvas.height / 2 - paddleHeight / 2,
    width: grid,
    height: paddleHeight,
    dy: 0
  };
  const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: grid,
    height: grid,
    resetting: false,
    dx: ballSpeed,
    dy: -ballSpeed
  };

  class Particle {
    constructor(x, y, dx, dy, size, life) {
      this.x = x; this.y = y; this.dx = dx; this.dy = dy;
      this.size = size; this.life = life; this.maxLife = life;
    }
    update() {
      this.x += this.dx; this.y += this.dy; this.life--;
      return this.life > 0;
    }
    draw() {
      const alpha = this.life / this.maxLife;
      context.fillStyle = `rgba(254, 216, 2, ${alpha})`;
      context.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  let screenShake = 0;
  function applyScreenShake() {
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      context.translate(shakeX, shakeY);
      screenShake *= 0.9;
      if (screenShake < 0.5) screenShake = 0;
    }
  }

  let slowMotion = 0;
  function updateSlowMotion() { if (slowMotion > 0) slowMotion--; }

  function createHitParticles(x, y, direction) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI - Math.PI / 2;
      const speed = Math.random() * 3 + 2;
      const dx = Math.cos(angle) * speed * direction;
      const dy = Math.sin(angle) * speed;
      const size = Math.random() * 3 + 1;
      const life = Math.random() * 20 + 10;
      particles.push(new Particle(x, y, dx, dy, size, life));
    }
  }

  function collides(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function updatePaddleAI() {
    const leftCenter = leftPaddle.y + paddleHeight / 2;
    if (ball.dx < 0) {
      if (leftCenter < ball.y - paddleHeight / 4) leftPaddle.dy = paddleSpeed;
      else if (leftCenter > ball.y + paddleHeight / 4) leftPaddle.dy = -paddleSpeed;
      else leftPaddle.dy = 0;
    } else {
      if (leftCenter < canvas.height / 2 - paddleHeight / 4) leftPaddle.dy = paddleSpeed / 2;
      else if (leftCenter > canvas.height / 2 + paddleHeight / 4) leftPaddle.dy = -paddleSpeed / 2;
      else leftPaddle.dy = 0;
    }
    const rightCenter = rightPaddle.y + paddleHeight / 2;
    if (ball.dx > 0) {
      if (rightCenter < ball.y - paddleHeight / 4) rightPaddle.dy = paddleSpeed;
      else if (rightCenter > ball.y + paddleHeight / 4) rightPaddle.dy = -paddleSpeed;
      else rightPaddle.dy = 0;
    } else {
      if (rightCenter < canvas.height / 2 - paddleHeight / 4) rightPaddle.dy = paddleSpeed / 2;
      else if (rightCenter > canvas.height / 2 + paddleHeight / 4) rightPaddle.dy = -paddleSpeed / 2;
      else rightPaddle.dy = 0;
    }
  }

  function drawBall() {
    const pixelSize = 2;
    const ballRadius = grid / 1.4;
    const cx = ball.x + ball.width / 2;
    const cy = ball.y + ball.height / 2;

    // shadow
    context.fillStyle = '#3a3a3a';
    for (let y = -ballRadius; y <= ballRadius; y += pixelSize) {
      for (let x = -ballRadius; x <= ballRadius; x += pixelSize) {
        if (x * x + y * y <= ballRadius * ballRadius) {
          context.fillRect(Math.floor(cx + x + 4), Math.floor(cy + y + 4), pixelSize, pixelSize);
        }
      }
    }
    // ball
    context.fillStyle = '#fed802';
    for (let y = -ballRadius; y <= ballRadius; y += pixelSize) {
      for (let x = -ballRadius; x <= ballRadius; x += pixelSize) {
        if (x * x + y * y <= ballRadius * ballRadius) {
          context.fillRect(Math.floor(cx + x), Math.floor(cy + y), pixelSize, pixelSize);
        }
      }
    }
  }

  function drawPixelText(text, x, y) {
    const pixelSize = 10;
    const letters = {
      'A': [[0,1,1,0],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1]],
      'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
      'C': [[0,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,0,0],[0,1,1,1]],
      'S': [[0,1,1,1],[1,0,0,0],[0,1,1,0],[0,0,0,1],[1,1,1,0]]
    };
    // shadow
    context.fillStyle = '#222';
    let sx = x + 3, sy = y + 3;
    for (const ch of text) {
      const p = letters[ch]; if (!p) continue;
      for (let r = 0; r < p.length; r++)
        for (let c = 0; c < p[r].length; c++)
          if (p[r][c]) context.fillRect(sx + c * pixelSize, sy + r * pixelSize, pixelSize, pixelSize);
      sx += (p[0].length + 2) * pixelSize;
    }
    // text
    context.fillStyle = '#eaeaea';
    let cx = x;
    for (const ch of text) {
      const p = letters[ch]; if (!p) continue;
      for (let r = 0; r < p.length; r++)
        for (let c = 0; c < p[r].length; c++)
          if (p[r][c]) context.fillRect(cx + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
      cx += (p[0].length + 2) * pixelSize;
    }
  }

  function drawCourt() {
    const dashHeight = grid / 2;
    const gapHeight = grid;
    context.fillStyle = '#2a2a2a';
    for (let y = grid * 1.5; y < canvas.height - grid * 1.5; y += dashHeight + gapHeight) {
      for (let py = 0; py < dashHeight; py += 3) {
        context.fillRect(canvas.width / 2 - 2, y + py, 4, 3);
      }
    }
    drawPixelText("AI", canvas.width / 4 - 60, 70);
    drawPixelText("CS", canvas.width * 3 / 4 - 60, 70);
  }

  function drawPaddle(paddle) {
    context.fillStyle = '#333';
    for (let y = 0; y < paddle.height; y += 3)
      for (let x = 0; x < paddle.width; x += 3)
        context.fillRect(paddle.x + x + 3, paddle.y + y + 3, 3, 3);
    context.fillStyle = '#eaeaea';
    for (let y = 0; y < paddle.height; y += 3)
      for (let x = 0; x < paddle.width; x += 3)
        context.fillRect(paddle.x + x, paddle.y + y, 3, 3);
  }

  function loop() {
    requestAnimationFrame(loop);
    context.fillStyle = '#000';
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();

    context.save();
    applyScreenShake();
    updatePaddleAI();
    updateSlowMotion();

    const gameSpeed = slowMotion > 0 ? 0.3 : 1;
    leftPaddle.y += leftPaddle.dy * gameSpeed;
    rightPaddle.y += rightPaddle.dy * gameSpeed;

    if (leftPaddle.y < 0) leftPaddle.y = 0;
    else if (leftPaddle.y > maxPaddleY) leftPaddle.y = maxPaddleY;
    if (rightPaddle.y < 0) rightPaddle.y = 0;
    else if (rightPaddle.y > maxPaddleY) rightPaddle.y = maxPaddleY;

    drawPaddle(leftPaddle);
    drawPaddle(rightPaddle);
    drawCourt();

    ball.x += ball.dx * gameSpeed;
    ball.y += ball.dy * gameSpeed;

    if (ball.y < 0) {
      ball.y = 0; ball.dy *= -1; screenShake = 3;
    } else if (ball.y + ball.height > canvas.height) {
      ball.y = canvas.height - ball.height; ball.dy *= -1; screenShake = 3;
    }

    if (!ball.resetting &&
        ((ball.dx < 0 && ball.x < 100) ||
         (ball.dx > 0 && ball.x > canvas.width - 100))) {
      slowMotion = 30;
    }

    if (ball.x < 0 && !ball.resetting) {
      rightScore++; ball.resetting = true; screenShake = 10;
      setTimeout(() => {
        ball.resetting = false;
        ball.x = canvas.width / 2; ball.y = canvas.height / 2;
        ball.dx = ballSpeed * (rightScore % 2 === 0 ? 1 : -1);
        ball.dy = (Math.random() * 2 - 1) * ballSpeed / 2;
      }, 1000);
    } else if (ball.x > canvas.width && !ball.resetting) {
      leftScore++; ball.resetting = true; screenShake = 10;
      setTimeout(() => {
        ball.resetting = false;
        ball.x = canvas.width / 2; ball.y = canvas.height / 2;
        ball.dx = ballSpeed * (leftScore % 2 === 0 ? -1 : 1);
        ball.dy = (Math.random() * 2 - 1) * ballSpeed / 2;
      }, 1000);
    }

    if (collides(ball, leftPaddle)) {
      ball.dx *= -1;
      ball.x = leftPaddle.x + leftPaddle.width;
      ball.dy = (Math.random() * 10 - 5) * 0.5;
      createHitParticles(ball.x, ball.y, 1);
      screenShake = 5;
      ball.dx *= 1.05;
      if (Math.abs(ball.dx) > ballSpeed * 2) ball.dx = (ball.dx > 0 ? 1 : -1) * ballSpeed * 2;
    } else if (collides(ball, rightPaddle)) {
      ball.dx *= -1;
      ball.x = rightPaddle.x - ball.width;
      ball.dy = (Math.random() * 10 - 5) * 0.5;
      createHitParticles(ball.x, ball.y, -1);
      screenShake = 5;
      ball.dx *= 1.05;
      if (Math.abs(ball.dx) > ballSpeed * 2) ball.dx = (ball.dx > 0 ? 1 : -1) * ballSpeed * 2;
    }

    particles = particles.filter((p) => {
      const alive = p.update();
      if (alive) p.draw();
      return alive;
    });

    drawBall();
    context.restore();
  }

  requestAnimationFrame(loop);
})();
