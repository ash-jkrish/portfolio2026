/* =========================================================
   ASHLY PORTFOLIO
   RESPONSIVE 239-FRAME SCROLL ENGINE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     GSAP
  ======================================================== */

  gsap.registerPlugin(ScrollTrigger);


  /* =======================================================
     ELEMENTS
  ======================================================== */

  const introSection =
    document.getElementById("intro-section");

  const introStage =
    document.getElementById("intro-stage");

  const canvas =
    document.getElementById("sequence-canvas");

  const ctx =
    canvas.getContext("2d", {
      alpha: false,
      desynchronized: true
    });

  const loader =
    document.getElementById("loader");

  const loaderNumber =
    document.getElementById("loader-number");

  const loaderProgress =
    document.getElementById("loader-progress");

  const scrollHint =
    document.getElementById("scroll-hint");


  /* =======================================================
     SETTINGS
  ======================================================== */

  const FRAME_COUNT = 239;

  const FRAME_PATH = "./frames/frame-001 (INDEX).png";

  /*
    Maximum DPR.

    Limiting DPR is important on high-density phones.
    Rendering a 4x canvas can be unnecessarily expensive.
  */

  const MAX_DPR = 1.75;


  /*
    Animation state.
  */

  const state = {

    frame: 0,

    targetFrame: 0,

    currentFrame: -1,

    isReady: false,

    isRendering: false,

    viewportWidth: 0,

    viewportHeight: 0,

    dpr: 1,

    imageScale: 1,

    offsetX: 0,

    offsetY: 0

  };


  /* =======================================================
     IMAGE STORAGE
  ======================================================== */

  const images =
    new Array(FRAME_COUNT);

  const loaded =
    new Uint8Array(FRAME_COUNT);

  let loadedCount = 0;


  /* =======================================================
     FRAME PATH
  ======================================================== */

  function framePath(index) {

    const frameNumber =
      index + 1;

    return FRAME_PATH.replace(
      "INDEX",
      frameNumber
    );
  }


  /* =======================================================
     UPDATE LOADER
  ======================================================== */

  function updateLoader() {

    const percentage =
      Math.round(
        (loadedCount / FRAME_COUNT) * 100
      );

    loaderNumber.textContent =
      `${percentage}%`;

    loaderProgress.style.width =
      `${percentage}%`;

  }


  /* =======================================================
     LOAD SINGLE IMAGE
  ======================================================== */

  function loadImage(index) {

    return new Promise((resolve) => {

      const img = new Image();

      img.decoding = "async";

      img.onload = () => {

        images[index] = img;

        if (!loaded[index]) {

          loaded[index] = 1;

          loadedCount++;

          updateLoader();

        }

        resolve(img);

      };


      img.onerror = () => {

        console.warn(
          "Could not load:",
          framePath(index)
        );

        resolve(null);

      };


      img.src =
        framePath(index);

    });

  }


  /* =======================================================
     LOAD FIRST FRAME
  ======================================================== */

  async function loadFirstFrame() {

    await loadImage(0);

    state.isReady = true;

    resizeCanvas();

    renderFrame(0);

  }


  /* =======================================================
     PROGRESSIVE PRELOAD
  ======================================================== */

  async function preloadFrames() {

    /*
      First load the first frame immediately.
      This allows the page to become visually useful
      without waiting for all 239 images.
    */

    await loadFirstFrame();


    /*
      Load remaining images in small batches.

      This prevents the browser from attempting to
      decode 239 images simultaneously.
    */

    const BATCH_SIZE = 8;

    for (
      let start = 1;
      start < FRAME_COUNT;
      start += BATCH_SIZE
    ) {

      const batch = [];

      const end =
        Math.min(
          start + BATCH_SIZE,
          FRAME_COUNT
        );

      for (
        let i = start;
        i < end;
        i++
      ) {

        batch.push(
          loadImage(i)
        );

      }

      await Promise.all(batch);

      /*
        Allow the browser a tiny opportunity
        to breathe between batches.
      */

      await new Promise(
        resolve =>
          requestAnimationFrame(resolve)
      );

    }

  }


  /* =======================================================
     CANVAS RESIZE
  ======================================================== */

  function resizeCanvas() {

    const width =
      window.visualViewport
        ? window.visualViewport.width
        : window.innerWidth;

    const height =
      window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;


    state.viewportWidth = width;
    state.viewportHeight = height;


    /*
      Reduce DPR on very small devices.

      This is important for performance.
    */

    const rawDpr =
      window.devicePixelRatio || 1;

    state.dpr =
      Math.min(
        rawDpr,
        MAX_DPR
      );


    /*
      Actual internal canvas resolution.
    */

    canvas.width =
      Math.round(
        width * state.dpr
      );

    canvas.height =
      Math.round(
        height * state.dpr
      );


    /*
      CSS resolution.
    */

    canvas.style.width =
      `${width}px`;

    canvas.style.height =
      `${height}px`;


    /*
      Reset transform.

      Everything below this point uses
      CSS-pixel coordinates.
    */

    ctx.setTransform(
      state.dpr,
      0,
      0,
      state.dpr,
      0,
      0
    );


    /*
      Recalculate image geometry.
    */

    calculateImageGeometry();


    /*
      Force current frame render.
    */

    state.currentFrame = -1;

    requestRender();

  }


  /* =======================================================
     IMAGE GEOMETRY
  ======================================================== */

  function calculateImageGeometry() {

    const img =
      images[
        Math.round(state.frame)
      ] ||
      images[0];


    if (
      !img ||
      !img.naturalWidth ||
      !img.naturalHeight
    ) {

      return;

    }


    const viewportWidth =
      state.viewportWidth;

    const viewportHeight =
      state.viewportHeight;

    const imageWidth =
      img.naturalWidth;

    const imageHeight =
      img.naturalHeight;


    /*
      Cover scaling.

      This ensures the frame always fills
      the entire viewport.
    */

    const scale =
      Math.max(
        viewportWidth / imageWidth,
        viewportHeight / imageHeight
      );


    const drawWidth =
      imageWidth * scale;

    const drawHeight =
      imageHeight * scale;


    /*
      Center the image.
    */

    const offsetX =
      (viewportWidth - drawWidth) / 2;

    const offsetY =
      (viewportHeight - drawHeight) / 2;


    state.imageScale =
      scale;

    state.offsetX =
      offsetX;

    state.offsetY =
      offsetY;

  }


  /* =======================================================
     DRAW FRAME
  ======================================================== */

  function renderFrame(frameIndex) {

    if (!state.isReady) {
      return;
    }


    /*
      Clamp frame.
    */

    const index =
      Math.max(
        0,
        Math.min(
          FRAME_COUNT - 1,
          Math.round(frameIndex)
        )
      );


    /*
      If the requested frame isn't loaded yet,
      use the nearest loaded frame.
    */

    let img =
      images[index];


    if (
      !img ||
      !img.complete ||
      !img.naturalWidth
    ) {

      /*
        Search backwards for the closest loaded frame.
      */

      for (
        let i = index;
        i >= 0;
        i--
      ) {

        if (
          images[i] &&
          images[i].complete &&
          images[i].naturalWidth
        ) {

          img =
            images[i];

          break;

        }

      }

    }


    if (
      !img ||
      !img.naturalWidth
    ) {

      return;

    }


    /*
      Recalculate geometry using
      the actual frame being drawn.
    */

    const width =
      state.viewportWidth;

    const height =
      state.viewportHeight;

    const imageWidth =
      img.naturalWidth;

    const imageHeight =
      img.naturalHeight;


    const scale =
      Math.max(
        width / imageWidth,
        height / imageHeight
      );


    const drawWidth =
      imageWidth * scale;

    const drawHeight =
      imageHeight * scale;


    const offsetX =
      (width - drawWidth) / 2;

    const offsetY =
      (height - drawHeight) / 2;


    /*
      Clear canvas.
    */

    ctx.clearRect(
      0,
      0,
      width,
      height
    );


    /*
      Draw frame.
    */

    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );


    state.currentFrame =
      index;

  }


  /* =======================================================
     REQUEST RENDER
  ======================================================== */

  function requestRender() {

    if (state.isRendering) {
      return;
    }

    state.isRendering = true;


    requestAnimationFrame(() => {

      state.isRendering = false;

      const target =
        Math.round(
          state.targetFrame
        );


      if (
        target !== state.currentFrame
      ) {

        renderFrame(target);

      }

    });

  }


  /* =======================================================
     RESPONSIVE INTRO HEIGHT
  ======================================================== */

  function getIntroHeight() {

    const width =
      window.innerWidth;

    /*
      Desktop
    */

    if (width > 1200) {

      return "500vh";

    }


    /*
      Laptop / large tablet
    */

    if (width > 768) {

      return "450vh";

    }


    /*
      Mobile
    */

    if (width > 430) {

      return "400vh";

    }


    /*
      Small phones
    */

    return "380vh";

  }


  function updateIntroHeight() {

    introSection.style.height =
      getIntroHeight();

  }


  /* =======================================================
     SCROLL → FRAME
  ======================================================== */

  function createScrollAnimation() {

    /*
      Kill existing triggers if this function
      is called again after resize.
    */

    ScrollTrigger.getAll().forEach(
      trigger => {

        if (
          trigger.vars &&
          trigger.vars.id ===
          "frameSequence"
        ) {

          trigger.kill();

        }

      }
    );


    /*
      Reset frame.
    */

    state.targetFrame = 0;


    gsap.to(state, {

      targetFrame:
        FRAME_COUNT - 1,

      ease: "none",

      scrollTrigger: {

        id: "frameSequence",

        trigger:
          introSection,

        start:
          "top top",

        end:
          "bottom bottom",

        scrub:
          0.12,

        invalidateOnRefresh:
          true,

        onUpdate(self) {

          /*
            Direct 0 → 238 mapping.
          */

          state.targetFrame =
            self.progress *
            (FRAME_COUNT - 1);


          requestRender();


          /*
            Hide scroll hint after
            user starts scrolling.
          */

          if (
            self.progress > 0.015
          ) {

            gsap.to(
              scrollHint,
              {
                opacity: 0,
                duration: 0.25,
                overwrite: true
              }
            );

          }

        },

        onLeave() {

          state.targetFrame =
            FRAME_COUNT - 1;

          requestRender();

        },

        onEnterBack() {

          gsap.to(
            scrollHint,
            {
              opacity: 0,
              duration: 0.2
            }
          );

        }

      }

    });

  }


  /* =======================================================
     INITIALIZE
  ======================================================== */

  async function initialize() {

    updateIntroHeight();

    await preloadFrames();

    /*
      Fade loader out once enough of the sequence
      is available.

      The entire sequence continues loading
      in the background.
    */

    gsap.to(
      loader,
      {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete() {

          loader.classList.add(
            "is-hidden"
          );

        }
      }
    );


    createScrollAnimation();

    ScrollTrigger.refresh();


    /*
      Make sure first frame is visible.
    */

    state.targetFrame = 0;

    renderFrame(0);

  }


  /* =======================================================
     RESIZE HANDLING
  ======================================================== */

  let resizeTimer = null;

  function handleResize() {

    clearTimeout(resizeTimer);

    resizeTimer =
      setTimeout(() => {

        updateIntroHeight();

        resizeCanvas();

        ScrollTrigger.refresh();

      }, 150);

  }


  window.addEventListener(
    "resize",
    handleResize,
    {
      passive: true
    }
  );


  /*
    Mobile browsers can change visualViewport
    when their address bar appears/disappears.
  */

  if (window.visualViewport) {

    window.visualViewport.addEventListener(
      "resize",
      handleResize,
      {
        passive: true
      }
    );

  }


  /* =======================================================
     ORIENTATION CHANGE
  ======================================================== */

  window.addEventListener(
    "orientationchange",
    () => {

      setTimeout(() => {

        updateIntroHeight();

        resizeCanvas();

        ScrollTrigger.refresh();

      }, 400);

    }
  );


  /* =======================================================
     SKILL ICON INTERACTION
  ======================================================== */

  const skillCircles =
    document.querySelectorAll(
      ".game-skill-circle"
    );


  skillCircles.forEach(
    circle => {

      let smokeTimer =
        null;

      let returnTimer =
        null;


      function escapeCircle() {

        /*
          Don't run this interaction
          on touch devices.
        */

        if (
          window.matchMedia(
            "(hover: none)"
          ).matches
        ) {

          return;

        }


        circle.classList.add(
          "is-escaping"
        );


        const randomX =
          (Math.random() - 0.5) * 110;

        const randomY =
          (Math.random() - 0.5) * 80;

        const randomRotate =
          (Math.random() - 0.5) * 40;


        circle.style.transform =
          `
          translate(
            ${randomX}px,
            ${randomY}px
          )
          scale(1.2)
          rotate(${randomRotate}deg)
          `;


        clearTimeout(
          smokeTimer
        );

        clearTimeout(
          returnTimer
        );


        smokeTimer =
          setTimeout(() => {

            circle.classList.add(
              "is-smoke"
            );


            returnTimer =
              setTimeout(() => {

                circle.classList.remove(
                  "is-smoke"
                );

                circle.classList.remove(
                  "is-escaping"
                );

                circle.style.transform =
                  "translate(0,0) scale(1) rotate(0deg)";

              }, 400);


          }, 500);

      }


      function resetCircle() {

        clearTimeout(
          smokeTimer
        );

        clearTimeout(
          returnTimer
        );


        circle.classList.remove(
          "is-escaping"
        );

        circle.classList.remove(
          "is-smoke"
        );


        circle.style.transform =
          "translate(0,0) scale(1) rotate(0deg)";

      }


      circle.addEventListener(
        "mouseenter",
        escapeCircle
      );


      circle.addEventListener(
        "mouseleave",
        resetCircle
      );

    }
  );


  /* =======================================================
     START
  ======================================================== */

  initialize();

});