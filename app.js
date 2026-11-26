
/* =========================================
   NEONVERSE - COMPLETE GAME ENGINE
   Space Catch + Block World
========================================= */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  /* =====================================
     SPACE GAME
  ===================================== */

  const game = $("game");
  if (game) {
    const ctx = game.getContext("2d");
    const scoreText = $("score");
    const startButton = document.querySelector(
      '[onclick="startGame()"]'
    );

    let score = 0;
    let best = Number(localStorage.getItem("nv_best") || 0);
    let time = 30;
    let active = false;
    let timer = null;
    let raf = null;
    let particles = [];

    const rocket = { x: 300, y: 150 };

    function updateScore() {
      if (scoreText) scoreText.textContent = score;
    }

    function draw() {
      ctx.clearRect(0, 0, 600, 300);

      const bg = ctx.createLinearGradient(0, 0, 600, 300);
      bg.addColorStop(0, "#09091f");
      bg.addColorStop(1, "#25104a");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 600, 300);

      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = (i % 5 + 1) / 8;
        ctx.fillRect((i * 97) % 600, (i * 53) % 300, 2, 2);
      }
      ctx.globalAlpha = 1;

      if (active) {
        ctx.font = "43px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 25;
        ctx.fillText("🚀", rocket.x, rocket.y);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 28px Arial";
        ctx.fillText("SPACE ARCADE", 300, 120);
        ctx.font = "18px Arial";
        ctx.fillStyle = "#c4b5fd";
        ctx.fillText("לחץ על התחל משחק", 300, 165);
      }

      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = "#d8b4fe";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function moveRocket() {
      rocket.x = 45 + Math.random() * 510;
      rocket.y = 45 + Math.random() * 210;
    }

    function finishGame() {
      active = false;
      clearInterval(timer);
      cancelAnimationFrame(raf);

      if (score > best) {
        best = score;
        localStorage.setItem("nv_best", best);
        alert("🏆 שיא חדש! " + best);
      } else {
        alert("המשחק הסתיים! ניקוד: " + score);
      }

      draw();
    }

    function animate() {
      if (!active) return;

      particles = particles.filter(p => p.life > 0);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.035;
      });

      draw();
      raf = requestAnimationFrame(animate);
    }

    function startGame() {
      clearInterval(timer);
      cancelAnimationFrame(raf);

      score = 0;
      time = 30;
      active = true;
      particles = [];

      updateScore();
      moveRocket();
      draw();

      timer = setInterval(() => {
        time--;

        if (time <= 0) {
          finishGame();
        }
      }, 1000);

      animate();
    }

    function hitRocket(e) {
      if (!active) return;

      const rect = game.getBoundingClientRect();
      const x = (e.clientX - rect.left) * 600 / rect.width;
      const y = (e.clientY - rect.top) * 300 / rect.height;

      if (Math.hypot(x - rocket.x, y - rocket.y) < 50) {
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: rocket.x,
            y: rocket.y,
            vx: Math.random() * 8 - 4,
            vy: Math.random() * 8 - 4,
            life: 1
          });
        }

        score++;
        updateScore();
        moveRocket();
      }
    }

    game.addEventListener("pointerdown", hitRocket);

    if (startButton) {
      startButton.addEventListener("click", startGame);
    }

    window.startGame = startGame;
    draw();
  }

  /* =====================================
     BLOCK WORLD
  ===================================== */

  const canvas = $("blockCanvas");

  if (canvas) {
    const ctx = canvas.getContext("2d");

    const SIZE = 40;
    const W = 50;
    const H = 12;

    const colors = {
      grass: "#55b84a",
      dirt: "#986039",
      stone: "#858b99",
      wood: "#a66b36",
      leaf: "#248a43"
    };

    let world = [];
    let camera = 0;
    let selected = "grass";
    let inventory = {
      grass: 20,
      dirt: 20,
      stone: 20,
      wood: 20
    };

    const player = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      w: 25,
      h: 35,
      ground: false
    };

    const keys = { left: false, right: false };

    function message(text) {
      const el = $("blockMessage");
      if (el) el.textContent = text;
    }

    function updateCount() {
      const total = Object.values(inventory)
        .reduce((a, b) => a + b, 0);

      const el = $("blockCount");
      if (el) el.textContent = total;

      try {
        localStorage.setItem(
          "nv_inventory",
          JSON.stringify(inventory)
        );
      } catch {}
    }

    function generate() {
      world = Array.from(
        { length: H },
        () => Array(W).fill("air")
      );

      for (let x = 0; x < W; x++) {
        const ground = Math.max(
          4,
          Math.min(8,
            6 + Math.floor(Math.sin(x * .4) * 1.2 +
            Math.random() * 1.5)
          )
        );

        for (let y = ground; y < H; y++) {
          world[y][x] =
            y === ground ? "grass" :
            y < ground + 3 ? "dirt" : "stone";
        }

        if (x % 8 === 3) {
          world[ground - 1][x] = "wood";
          world[ground - 2][x] = "wood";

          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -4; dy <= -2; dy++) {
              const tx = x + dx;
              const ty = ground + dy;

              if (tx >= 0 && tx < W && ty >= 0) {
                world[ty][tx] = "leaf";
              }
            }
          }
        }
      }

      player.x = 100;
      player.y = 100;
      player.vx = 0;
      player.vy = 0;
      camera = 0;

      inventory = {
        grass: 20,
        dirt: 20,
        stone: 20,
        wood: 20
      };

      updateCount();
      message("🌍 העולם החדש מוכן!");
    }

    function solid(x, y) {
      if (x < 0 || x >= W || y >= H) return true;
      if (y < 0) return false;
      return world[y][x] !== "air";
    }

    function collision(x, y) {
      const left = Math.floor(x / SIZE);
      const right = Math.floor((x + player.w - 1) / SIZE);
      const top = Math.floor(y / SIZE);
      const bottom = Math.floor((y + player.h - 1) / SIZE);

      for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
          if (solid(tx, ty)) return true;
        }
      }

      return false;
    }

    function update() {
      player.vx = 0;

      if (keys.left) player.vx = -3.5;
      if (keys.right) player.vx = 3.5;

      const nx = player.x + player.vx;

      if (!collision(nx, player.y)) {
        player.x = nx;
      }

      player.vy = Math.min(player.vy + .45, 10);

      const ny = player.y + player.vy;

      if (!collision(player.x, ny)) {
        player.y = ny;
        player.ground = false;
      } else {
        if (player.vy > 0) player.ground = true;
        player.vy = 0;
      }

      if (player.y > H * SIZE) {
        player.x = 100;
        player.y = 100;
        player.vy = 0;
      }

      player.x = Math.max(0, Math.min(W * SIZE - player.w, player.x));

      camera = Math.max(
        0,
        Math.min(W * SIZE - 800, player.x - 350)
      );
    }

    function drawBlock(type, x, y) {
      ctx.fillStyle = colors[type];
      ctx.fillRect(x, y, SIZE, SIZE);

      if (type === "grass") {
        ctx.fillStyle = "#8ce66c";
        ctx.fillRect(x, y, SIZE, 8);
      }

      if (type === "wood") {
        ctx.fillStyle = "#704020";
        ctx.fillRect(x + 12, y, 5, SIZE);
      }

      if (type === "stone") {
        ctx.fillStyle = "#b9becb";
        ctx.fillRect(x + 8, y + 8, 5, 5);
      }

      if (type === "leaf") {
        ctx.fillStyle = "#4fc96c";
        ctx.fillRect(x + 7, y + 7, 12, 10);
      }

      ctx.strokeStyle = "#0002";
      ctx.strokeRect(x, y, SIZE, SIZE);
    }

    function draw() {
      const bg = ctx.createLinearGradient(0, 0, 0, 480);
      bg.addColorStop(0, "#65b8ef");
      bg.addColorStop(1, "#b4e1f3");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 800, 480);

      ctx.fillStyle = "#ffe58a";
      ctx.beginPath();
      ctx.arc(690, 75, 35, 0, Math.PI * 2);
      ctx.fill();

      const start = Math.floor(camera / SIZE);

      for (let y = 0; y < H; y++) {
        for (let x = start; x < Math.min(W, start + 22); x++) {
          if (world[y][x] !== "air") {
            drawBlock(
              world[y][x],
              x * SIZE - camera,
              y * SIZE
            );
          }
        }
      }

      const px = player.x - camera;

      ctx.fillStyle = "#edbd8a";
      ctx.fillRect(px + 5, player.y, 18, 13);

      ctx.fillStyle = "#3067c7";
      ctx.fillRect(px + 3, player.y + 13, 22, 14);

      ctx.fillStyle = "#252536";
      ctx.fillRect(px + 4, player.y + 27, 8, 9);
      ctx.fillRect(px + 17, player.y + 27, 8, 9);

      ctx.fillStyle = "#14233d";
      ctx.font = "bold 16px Arial";
      ctx.fillText("BLOCK WORLD", 15, 25);
    }

    let last = 0;

    function loop(now) {
      const dt = Math.min(now - (last || now), 40);
      last = now;

      // Frame-rate independent movement
      const factor = dt / 16.67;

      player.vx = 0;
      if (keys.left) player.vx = -3.5;
      if (keys.right) player.vx = 3.5;

      const nx = player.x + player.vx * factor;
      if (!collision(nx, player.y)) player.x = nx;

      player.vy = Math.min(player.vy + .45 * factor, 10);

      const ny = player.y + player.vy * factor;
      if (!collision(player.x, ny)) {
        player.y = ny;
        player.ground = false;
      } else {
        if (player.vy > 0) player.ground = true;
        player.vy = 0;
      }

      player.x = Math.max(0, Math.min(W * SIZE - player.w, player.x));

      if (player.y > H * SIZE) {
        player.x = 100;
        player.y = 100;
        player.vy = 0;
      }

      camera = Math.max(0, Math.min(
        W * SIZE - 800,
        player.x - 350
      ));

      draw();
      requestAnimationFrame(loop);
    }

    function jump() {
      if (player.ground) {
        player.vy = -10;
        player.ground = false;
      }
    }

    function action(e) {
      const rect = canvas.getBoundingClientRect();

      const tx = Math.floor(
        ((e.clientX - rect.left) * 800 / rect.width + camera) / SIZE
      );

      const ty = Math.floor(
        ((e.clientY - rect.top) * 480 / rect.height) / SIZE
      );

      if (tx < 0 || tx >= W || ty < 0 || ty >= H) return;

      if (e.button === 2) {
        if (world[ty][tx] !== "air") return;
        if (!inventory[selected]) {
          message("אין מספיק בלוקים!");
          return;
        }

        const overlaps =
          tx * SIZE < player.x + player.w &&
          (tx + 1) * SIZE > player.x &&
          ty * SIZE < player.y + player.h &&
          (ty + 1) * SIZE > player.y;

        if (overlaps) return;

        world[ty][tx] = selected;
        inventory[selected]--;
        message("🧱 בנית בלוק!");
      } else {
        const type = world[ty][tx];
        if (type === "air") return;

        world[ty][tx] = "air";

        if (type !== "leaf" && inventory[type] !== undefined) {
          inventory[type]++;
        }

        message("⛏️ חפרת בלוק!");
      }

      updateCount();
    }

    canvas.addEventListener("pointerdown", e => {
      e.preventDefault();

      if (e.pointerType !== "mouse") {
        const rect = canvas.getBoundingClientRect();
        const tx = Math.floor(
          ((e.clientX - rect.left) * 800 / rect.width + camera) / SIZE
        );
        const ty = Math.floor(
          ((e.clientY - rect.top) * 480 / rect.height) / SIZE
        );

        if (tx < 0 || tx >= W || ty < 0 || ty >= H) return;

        if (world[ty][tx] !== "air") {
          const type = world[ty][tx];
          world[ty][tx] = "air";
          if (inventory[type] !== undefined) inventory[type]++;
          updateCount();
        } else if (
          ty < H - 1 &&
          world[ty + 1][tx] !== "air" &&
          inventory[selected] > 0
        ) {
          const overlaps =
            tx * SIZE < player.x + player.w &&
            (tx + 1) * SIZE > player.x &&
            ty * SIZE < player.y + player.h &&
            (ty + 1) * SIZE > player.y;

          if (!overlaps) {
            world[ty][tx] = selected;
            inventory[selected]--;
            updateCount();
          }
        }
      } else {
        action(e);
      }
    });

    canvas.addEventListener("contextmenu", e => e.preventDefault());

    document.querySelectorAll(".blockChoice").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        if (!colors[type] || type === "leaf") return;

        selected = type;

        document.querySelectorAll(".blockChoice").forEach(b => {
          b.style.outline = b === btn ? "3px solid white" : "none";
        });

        message("נבחר בלוק: " + type);
      });
    });

    function hold(id, key) {
      const button = $(id);
      if (!button) return;

      button.addEventListener("pointerdown", e => {
        e.preventDefault();
        keys[key] = true;
      });

      ["pointerup", "pointerleave", "pointercancel"].forEach(event => {
        button.addEventListener(event, () => keys[key] = false);
      });
    }

    hold("blockLeft", "left");
    hold("blockRight", "right");

    window.addEventListener("keydown", e => {
      const key = e.key.toLowerCase();

      if (key === "arrowleft" || key === "a") keys.left = true;
      if (key === "arrowright" || key === "d") keys.right = true;

      if (key === " " || key === "arrowup" || key === "w") {
        e.preventDefault();
        jump();
      }
    });

    window.addEventListener("keyup", e => {
      const key = e.key.toLowerCase();

      if (key === "arrowleft" || key === "a") keys.left = false;
      if (key === "arrowright" || key === "d") keys.right = false;
    });

    window.addEventListener("blur", () => {
      keys.left = false;
      keys.right = false;
    });

    const jumpButton = $("blockJump");
    if (jumpButton) jumpButton.addEventListener("click", jump);

    const resetButton = $("blockReset");
    if (resetButton) resetButton.addEventListener("click", generate);

    generate();
    requestAnimationFrame(loop);
  }

})();
