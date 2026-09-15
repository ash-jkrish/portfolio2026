/* =========================================
   GSAP SETUP & CANVAS RENDER ENGINE
========================================= */
gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("sequence-canvas");
const ctx = canvas.getContext("2d");

const frameCount = 239;
const images = [];
const animationObj = { frame: 0 };
let activeFrame = -1;

const currentFrame = (index) => {
  const frameNum = index + 1;
  return `./frames/frame-001 (${frameNum}).png`;
};

function resizeCanvas() {
  const dpr = window.innerWidth <= 768 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  activeFrame = -1;
  render(true);
  ScrollTrigger.refresh();
}

window.addEventListener("resize", resizeCanvas);

function render(force = false) {
  const index = Math.min(
    frameCount - 1,
    Math.max(0, Math.round(animationObj.frame))
  );

  if (index === activeFrame && !force) return;

  const img = images[index];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const imageWidth = img.naturalWidth;
  const imageHeight = img.naturalHeight;

  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, imageWidth, imageHeight, offsetX, offsetY, drawWidth, drawHeight);

  activeFrame = index;
}

/* Preload Frames */
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);

  if (i === 0) {
    img.onload = () => { resizeCanvas(); };
  }

  img.onload = () => {
    if (Math.round(animationObj.frame) === i) {
      render(true);
    }
  };

  img.onerror = () => {
    console.warn("Failed to load:", currentFrame(i));
  };

  images.push(img);
}

/* Scroll Animation Timeline */
gsap.to(animationObj, {
  frame: frameCount - 1,
  ease: "none",
  scrollTrigger: {
    trigger: "#scroll-wrapper",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.3,
    anticipatePin: 1,
    onUpdate: (self) => {
      const progress = self.progress;
      const holdStart = 0.88;

      if (progress >= holdStart) {
        animationObj.frame = frameCount - 1;
      } else {
        const normalizedProgress = progress / holdStart;
        animationObj.frame = normalizedProgress * (frameCount - 1);
      }
    }
  }
});

/* Scroll Hint Fade */
gsap.to("#scroll-hint", {
  opacity: 0,
  ease: "power1.out",
  scrollTrigger: {
    trigger: "#scroll-wrapper",
    start: "top top",
    end: "top -120px",
    scrub: true
  }
});

gsap.ticker.add(() => { render(); });

window.addEventListener("load", () => {
  resizeCanvas();
  ScrollTrigger.refresh();
});

/* =========================================
   INTERACTIVE ICON HOVER BEHAVIOR (Escape + Blink + Smoke)
========================================= */
document.addEventListener("DOMContentLoaded", () => {
  const skillCircles = document.querySelectorAll(".game-skill-circle");

  skillCircles.forEach(circle => {
    circle.addEventListener("mouseenter", () => {
      // 1. Trigger Red-White Blink & Escaping Jump
      circle.classList.add("is-escaping");

      const randomX = (Math.random() - 0.5) * 110;
      const randomY = (Math.random() - 0.5) * 80;
      const randomRotate = (Math.random() - 0.5) * 40;

      circle.style.transform = `translate(${randomX}px, ${randomY}px) scale(1.2) rotate(${randomRotate}deg)`;

      // 2. Trigger Smoke Disappear effect halfway through the hover
      setTimeout(() => {
        if (circle.matches(':hover')) {
          circle.classList.add("is-smoke");
          
          // Reappear back to original place
          setTimeout(() => {
            circle.classList.remove("is-smoke");
            circle.style.transform = "translate(0px, 0px) scale(1) rotate(0deg)";
          }, 400);
        }
      }, 500);
    });

    circle.addEventListener("mouseleave", () => {
      circle.classList.remove("is-escaping");
      circle.classList.remove("is-smoke");
      circle.style.transform = "translate(0px, 0px) scale(1) rotate(0deg)";
    });
  });
});