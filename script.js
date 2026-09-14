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
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  render(true);
}
window.addEventListener("resize", resizeCanvas);

function render(force = false) {
  const index = Math.min(frameCount - 1, Math.max(0, Math.round(animationObj.frame)));
  
  if (index === activeFrame && !force) return;

  const img = images[index];

  if (img && img.complete && img.naturalWidth !== 0) {
    const w = window.innerWidth;
    const h = window.innerHeight;

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

// 1. SEQUENCE TIMELINE WITH INTRO HOLD / PAUSE ON LAST FRAME
const sequenceTL = gsap.timeline({
  scrollTrigger: {
    trigger: "#scroll-wrapper",
    start: "top top",
    end: "70% bottom", // Finish frame sequence earlier to hold end frame
    scrub: 0.3,
    pin: "#video-container",
    anticipatePin: 1
  }
});

sequenceTL.to(animationObj, {
  frame: frameCount - 1,
  ease: "none",
  duration: 1
});

// 2. INFOGRAPHIC RIBBONS ENTRANCE ANIMATION
gsap.from(".infographic-ribbon", {
  scrollTrigger: {
    trigger: ".about-infographic-section",
    start: "top 70%",
    toggleActions: "play none none reverse"
  },
  x: -100,
  opacity: 0,
  duration: 0.9,
  stagger: 0.2,
  ease: "power3.out"
});

// 3. VERTICAL SHUTTER BARS ENTRANCE ANIMATION
gsap.from(".shutter-bar", {
  scrollTrigger: {
    trigger: ".split-shutter-container",
    start: "top 80%",
    toggleActions: "play none none reverse"
  },
  y: 80,
  opacity: 0,
  duration: 1,
  stagger: 0.15,
  ease: "power4.out"
});

// Fade out scroll hint badge
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