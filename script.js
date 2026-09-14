gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("sequence-canvas");
const ctx = canvas.getContext("2d");

const frameCount = 239;

const currentFrame = (index) => {
  const frameNum = index + 1;
  return `./frames/frame-001 (${frameNum}).png`;
};

const images = [];
const animationObj = { frame: 0 };
let activeFrame = -1;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  
  // Real layout dimensions
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Set internal canvas pixel grid to physical device resolution
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  
  // CSS display size
  canvas.style.width = displayWidth + "px";
  canvas.style.height = displayHeight + "px";

  // Reset transform matrix before applying high-DPI scaling
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  
  render(true);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

function render(force = false) {
  const index = Math.min(frameCount - 1, Math.max(0, Math.round(animationObj.frame)));
  
  if (index === activeFrame && !force) return;

  const img = images[index];

  if (img && img.complete && img.naturalWidth !== 0) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Forces cover ratio across portrait mobile & landscape desktop displays
    const hRatio = w / img.width;
    const vRatio = h / img.height;
    const ratio = Math.max(hRatio, vRatio);

    const centerShiftX = (w - img.width * ratio) / 2;
    const centerShiftY = (h - img.height * ratio) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      centerShiftX, centerShiftY, img.width * ratio, img.height * ratio
    );
    activeFrame = index;
  }
}

// Preload sequence frames
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  if (i === 0) {
    img.onload = () => resizeCanvas();
  }
  images.push(img);
}

// Bind GSAP ScrollTrigger to frame sequence
gsap.to(animationObj, {
  frame: frameCount - 1,
  ease: "none",
  scrollTrigger: {
    trigger: "#scroll-wrapper",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.2,
    pin: "#video-container",
    anticipatePin: 1
  }
});

// Fade out scroll indicator on touch scroll
gsap.to("#scroll-hint", {
  opacity: 0,
  ease: "power1.out",
  scrollTrigger: {
    trigger: "#scroll-wrapper",
    start: "top top",
    end: "top -50px",
    scrub: true
  }
});

gsap.ticker.add(() => render());

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
  resizeCanvas();
});