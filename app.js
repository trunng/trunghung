/**
 * QuangHungHeart - Phiên bản tối ưu: Gọn gàng, Siêu Mượt (60 FPS), Tự động phát nhạc
 * Dành tặng: Lê Quang Hùng
 */

(function () {
  'use strict';

  // --- 1. KHỞI TẠO CANVAS TRÁI TIM ---
  const canvas = document.getElementById('heartCanvas');
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles();
  });

  // Tọa độ chuột phục vụ hiệu ứng tương tác
  let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
    }
  }, { passive: true });

  // Công thức toán học đường cong hình trái tim (Parametric Heart)
  function heartCurve(t, scale) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * scale, y: y * scale };
  }

  // Danh sách màu sắc hạt neon ngọt ngào
  const COLORS = ['#ff2a85', '#ff69b4', '#ff75a0', '#ff9ebb', '#f43f5e', '#e879f9', '#ffffff'];

  // Hạt trái tim cơ bản (tối ưu hiệu năng, không dùng shadowBlur gây lag)
  class Particle {
    constructor(bx, by, isBorder) {
      this.bx = bx;
      this.by = by;
      this.isBorder = isBorder;
      this.x = bx;
      this.y = by;
      this.size = isBorder ? (Math.random() * 2 + 1.6) : (Math.random() * 1.6 + 0.8);
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.speed = 0.03 + Math.random() * 0.04;
      this.phase = Math.random() * Math.PI * 2;
    }

    update(beatScale, offX, offY) {
      this.phase += this.speed;
      const targetX = this.bx * beatScale + offX;
      const targetY = this.by * beatScale + offY;

      // Di chuyển mượt về vị trí đập
      this.x += (targetX - this.x) * 0.12;
      this.y += (targetY - this.y) * 0.12;
    }

    draw(ctx, cx, cy) {
      const alpha = 0.6 + 0.4 * Math.sin(this.phase);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(cx + this.x, cy + this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hạt sao lung linh bay nền
  class Star {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 1.5 + 0.5;
      this.vy = -(0.2 + Math.random() * 0.6);
      this.alpha = 0.2 + Math.random() * 0.6;
    }
    update() {
      this.y += this.vy;
      if (this.y < 0) this.y = height;
    }
    draw(ctx) {
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = '#ffb3c6';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Trái tim nhỏ bay lên khi click tương tác
  class HeartBurst {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = -(Math.random() * 4 + 2);
      this.size = Math.random() * 12 + 8;
      this.alpha = 1;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.05; // trọng lực nhẹ
      this.alpha -= 0.02;
    }
    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-this.size / 2, -this.size / 2, -this.size, this.size / 3, 0, this.size);
      ctx.bezierCurveTo(this.size, this.size / 3, this.size / 2, -this.size / 2, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  // Khởi tạo các mảng hạt
  let particles = [];
  let stars = [];
  let bursts = [];

  function initParticles() {
    particles = [];
    const scale = Math.min(width, height) / 36;
    const borderCount = 220; // 220 hạt viền sắc nét
    const innerCount = 240;  // 240 hạt rải đều lòng tim

    // Tạo viền trái tim
    for (let i = 0; i < borderCount; i++) {
      const t = (i / borderCount) * Math.PI * 2;
      const pos = heartCurve(t, scale);
      particles.push(new Particle(pos.x, pos.y, true));
    }

    // Tạo độ đầy bên trong trái tim
    for (let i = 0; i < innerCount; i++) {
      const t = Math.random() * Math.PI * 2;
      const factor = Math.sqrt(Math.random());
      const pos = heartCurve(t, scale * factor);
      particles.push(new Particle(pos.x, pos.y, false));
    }

    // 40 ngôi sao nền
    stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push(new Star());
    }
  }

  initParticles();

  // Bắn tim bung nở
  function triggerBurst(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      bursts.push(new HeartBurst(x, y));
    }
  }

  canvas.addEventListener('click', (e) => {
    triggerBurst(e.clientX, e.clientY, 15);
  });

  const sendLoveBtn = document.getElementById('sendLoveBtn');
  if (sendLoveBtn) {
    sendLoveBtn.addEventListener('click', () => {
      triggerBurst(width / 2, height / 2, 35);
    });
  }

  // --- 2. VÒNG LẶP ANIMATION (SIÊU MƯỢT, 60 FPS) ---
  let beatTime = 0;
  function animate() {
    requestAnimationFrame(animate);

    beatTime += 0.035;
    // Nhịp tim đập chuẩn: thình thịch (lub-dub)
    const sin1 = Math.sin(beatTime);
    const beatScale = 1 + 0.08 * Math.pow(Math.max(0, sin1), 3);

    // Di chuyển chuột mượt
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;
    const offX = (mouse.x - width / 2) * 0.04;
    const offY = (mouse.y - height / 2) * 0.04;

    // Xóa nền với hiệu ứng lưu vệt ánh sáng nhẹ
    ctx.fillStyle = 'rgba(7, 3, 13, 0.25)';
    ctx.fillRect(0, 0, width, height);

    // Vẽ sao nền
    for (let s of stars) {
      s.update();
      s.draw(ctx);
    }

    // Vẽ trái tim ở trung tâm
    const cx = width / 2;
    const cy = height / 2;

    // Chế độ hòa trộn 'lighter' giúp hạt phát sáng tự nhiên mà KHÔNG lag
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let p of particles) {
      p.update(beatScale, offX, offY);
      p.draw(ctx, cx, cy);
    }
    ctx.restore();

    // Cập nhật các hạt tim bay khi click
    for (let i = bursts.length - 1; i >= 0; i--) {
      bursts[i].update();
      bursts[i].draw(ctx);
      if (bursts[i].alpha <= 0) bursts.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);

  // --- 3. ÂM NHẠC LÃNG MẠN & TỰ ĐỘNG MỞ NHẠC ---
  let isPlaying = false;
  const audioBtn = document.getElementById('audioBtn');
  const musicIcon = document.getElementById('musicIcon');
  const musicStatus = document.getElementById('musicStatus');
  const bgAudio = document.getElementById('bgAudio');

  // Bộ tổng hợp âm thanh Web Audio (nhẹ, không cần mạng, giai điệu du dương êm dịu)
  class RomanticMelody {
    constructor() {
      this.ctx = null;
      this.timer = null;
      this.chords = [
        [261.63, 329.63, 392.00, 523.25], // C Major
        [220.00, 261.63, 329.63, 440.00], // A Minor
        [174.61, 220.00, 261.63, 349.23], // F Major
        [196.00, 246.94, 293.66, 392.00]  // G Major
      ];
      this.cIdx = 0;
      this.nIdx = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playNote(freq) {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine'; // Sóng sine ấm và trong trẻo như hộp nhạc
        osc.frequency.setValueAtTime(freq, now);

        // Âm lượng nhẹ nhàng, không gây ồn
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      } catch (e) {}
    }

    start() {
      this.init();
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        const chord = this.chords[this.cIdx];
        this.playNote(chord[this.nIdx]);
        this.nIdx++;
        if (this.nIdx >= chord.length) {
          this.nIdx = 0;
          this.cIdx = (this.cIdx + 1) % this.chords.length;
        }
      }, 450);
    }

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend();
      }
    }
  }

  const melody = new RomanticMelody();

  function updateMusicUI(active) {
    isPlaying = active;
    if (active) {
      musicIcon.classList.add('rotating');
      musicIcon.textContent = '🎵';
      musicStatus.textContent = 'Nhạc: Đang phát';
    } else {
      musicIcon.classList.remove('rotating');
      musicIcon.textContent = '🔇';
      musicStatus.textContent = 'Nhạc: Đã tắt';
    }
  }

  function startMusic() {
    if (isPlaying) return;
    // Thử phát audio thẻ local trước (nếu có file music.mp3)
    if (bgAudio && bgAudio.src && !bgAudio.error) {
      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          updateMusicUI(true);
        }).catch(() => {
          // Bị chặn hoặc không có file -> Dùng bộ tổng hợp âm thanh Web Audio
          melody.start();
          updateMusicUI(true);
        });
        return;
      }
    }
    // Mặc định phát giai điệu Web Audio lãng mạn
    melody.start();
    updateMusicUI(true);
  }

  function stopMusic() {
    if (bgAudio) bgAudio.pause();
    melody.stop();
    updateMusicUI(false);
  }

  // Nút bấm Bật / Tắt
  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  // TỰ ĐỘNG PHÁT NHẠC NGAY KHI VÀO TRANG:
  // 1. Cố gắng phát ngay khi tải
  setTimeout(startMusic, 300);

  // 2. Nếu trình duyệt chặn Autoplay khi chưa có thao tác, tự động bật ngay ở cử chỉ đầu tiên (click, chạm, di chuột, bấm phím)
  const autoPlayOnFirstGesture = () => {
    if (!isPlaying) {
      startMusic();
    } else if (melody.ctx && melody.ctx.state === 'suspended') {
      melody.ctx.resume();
    }
  };

  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, autoPlayOnFirstGesture, { once: true, passive: true });
  });

})();
