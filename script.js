/* =========================================
   GSAP
========================================= */

gsap.registerPlugin(ScrollTrigger);


/* =========================================
   CANVAS
========================================= */

const canvas =
  document.getElementById(
    "sequence-canvas"
  );

const ctx =
  canvas.getContext("2d");


/* =========================================
   SETTINGS
========================================= */

const frameCount = 239;


/* =========================================
   FRAME PATH
========================================= */

const currentFrame = (index) => {

  const frameNum = index + 1;

  return `./frames/frame-001 (${frameNum}).png`;
};


/* =========================================
   IMAGE STORAGE
========================================= */

const images = [];


/* =========================================
   ANIMATION OBJECT
========================================= */

const animationObj = {
  frame: 0
};


/* =========================================
   CURRENT RENDERED FRAME
========================================= */

let activeFrame = -1;


/* =========================================
   CANVAS RESIZE
========================================= */

function resizeCanvas() {

  /*
    Lower DPR on mobile to improve
    performance and reduce memory usage.
  */

  const dpr =
    window.innerWidth <= 768
      ? 1
      : Math.min(
          window.devicePixelRatio || 1,
          2
        );


  const width =
    window.innerWidth;


  const height =
    window.innerHeight;


  /*
    Internal canvas resolution
  */

  canvas.width =
    width * dpr;

  canvas.height =
    height * dpr;


  /*
    CSS size
  */

  canvas.style.width =
    "100%";

  canvas.style.height =
    "100%";


  /*
    Scale drawing coordinates
  */

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  /*
    Force redraw after resize
  */

  activeFrame = -1;

  render(true);


  /*
    Recalculate ScrollTrigger
  */

  ScrollTrigger.refresh();
}


window.addEventListener(
  "resize",
  resizeCanvas
);


/* =========================================
   RENDER FRAME
========================================= */

function render(force = false) {

  /*
    Always keep frame within
    0 → 238
  */

  const index =
    Math.min(
      frameCount - 1,

      Math.max(
        0,
        Math.round(
          animationObj.frame
        )
      )
    );


  /*
    Prevent unnecessary redraws
  */

  if (
    index === activeFrame &&
    !force
  ) {
    return;
  }


  const img =
    images[index];


  /*
    Image not ready yet
  */

  if (
    !img ||
    !img.complete ||
    img.naturalWidth === 0
  ) {
    return;
  }


  const width =
    window.innerWidth;


  const height =
    window.innerHeight;


  const imageWidth =
    img.naturalWidth;


  const imageHeight =
    img.naturalHeight;


  /*
    COVER calculation

    This fills the entire viewport
    without stretching the image.
  */

  const scale =
    Math.max(
      width / imageWidth,
      height / imageHeight
    );


  const drawWidth =
    imageWidth * scale;


  const drawHeight =
    imageHeight * scale;


  /*
    Center image
  */

  const offsetX =
    (width - drawWidth) / 2;


  const offsetY =
    (height - drawHeight) / 2;


  /*
    Clear canvas
  */

  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  /*
    Draw frame
  */

  ctx.drawImage(

    img,

    0,
    0,
    imageWidth,
    imageHeight,

    offsetX,
    offsetY,

    drawWidth,
    drawHeight
  );


  activeFrame =
    index;
}


/* =========================================
   PRELOAD ALL 239 FRAMES
========================================= */

for (
  let i = 0;
  i < frameCount;
  i++
) {

  const img =
    new Image();


  /*
    Load frame
  */

  img.src =
    currentFrame(i);


  /*
    First frame
  */

  if (i === 0) {

    img.onload = () => {

      resizeCanvas();

    };

  }


  /*
    Render loaded frame
    if it is currently needed.
  */

  img.onload = () => {

    if (
      Math.round(
        animationObj.frame
      ) === i
    ) {

      render(true);

    }

  };


  /*
    Error handling
  */

  img.onerror = () => {

    console.warn(
      "Failed to load:",
      currentFrame(i)
    );

  };


  images.push(img);
}


/* =========================================
   SCROLL FRAME ANIMATION
========================================= */

gsap.to(
  animationObj,
  {

    frame:
      frameCount - 1,

    ease:
      "none",

    scrollTrigger: {

      trigger:
        "#scroll-wrapper",

      start:
        "top top",

      end:
        "bottom bottom",

      scrub:
        0.3,

      anticipatePin:
        1,


      /*
        Hold Frame 239 during
        final 12% of scrolling.
      */

      onUpdate:
        (self) => {

          const progress =
            self.progress;


          const holdStart =
            0.88;


          if (
            progress >=
            holdStart
          ) {

            animationObj.frame =
              frameCount - 1;

          } else {

            const normalizedProgress =
              progress /
              holdStart;


            animationObj.frame =
              normalizedProgress *
              (frameCount - 1);
          }

        }
    }

  }
);


/* =========================================
   SCROLL HINT FADE
========================================= */

gsap.to(
  "#scroll-hint",
  {

    opacity: 0,

    ease:
      "power1.out",

    scrollTrigger: {

      trigger:
        "#scroll-wrapper",

      start:
        "top top",

      end:
        "top -120px",

      scrub:
        true

    }

  }
);


/* =========================================
   RENDER LOOP
========================================= */

gsap.ticker.add(
  () => {

    render();

  }
);


/* =========================================
   INITIALIZE
========================================= */

window.addEventListener(
  "load",
  () => {

    resizeCanvas();

    ScrollTrigger.refresh();

  }
);