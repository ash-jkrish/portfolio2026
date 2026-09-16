document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       GSAP
    ========================================================= */

    gsap.registerPlugin(ScrollTrigger);


    /* =========================================================
       INTRO ELEMENTS
    ========================================================= */

    const introSection =
        document.querySelector("#intro-section");

    const canvas =
        document.querySelector("#sequence-canvas");

    const ctx =
        canvas.getContext("2d", {
            alpha: false
        });

    const loader =
        document.querySelector("#loader");

    const loaderPercent =
        document.querySelector("#loader-percent");

    const loaderProgress =
        document.querySelector("#loader-progress");

    const scrollHint =
        document.querySelector("#scroll-hint");


    /* =========================================================
       FRAME SETTINGS
    ========================================================= */

    const FRAME_COUNT = 239;

    const FRAME_PATH =
        "./frames/frame-001 (INDEX).png";


    /* =========================================================
       STATE
    ========================================================= */

    const state = {
        currentFrame: 0,
        targetFrame: 0
    };


    /* =========================================================
       IMAGE STORAGE
    ========================================================= */

    const images =
        new Array(FRAME_COUNT);

    const loaded =
        new Array(FRAME_COUNT).fill(false);


    let canvasWidth = 0;
    let canvasHeight = 0;

    let resizeTimer = null;


    /* =========================================================
       FRAME PATH
    ========================================================= */

    function getFramePath(index) {

        return FRAME_PATH.replace(
            "INDEX",
            index + 1
        );

    }


    /* =========================================================
       LOAD IMAGE
    ========================================================= */

    function loadFrame(index) {

        return new Promise((resolve) => {

            if (
                index < 0 ||
                index >= FRAME_COUNT
            ) {
                resolve(null);
                return;
            }

            if (loaded[index]) {

                resolve(images[index]);

                return;
            }


            const img = new Image();

            img.decoding = "async";

            img.onload = () => {

                images[index] = img;

                loaded[index] = true;

                resolve(img);
            };

            img.onerror = () => {

                console.warn(
                    "Could not load frame:",
                    getFramePath(index)
                );

                resolve(null);
            };

            img.src = getFramePath(index);

        });

    }


    /* =========================================================
       DRAW IMAGE WITH COVER
    ========================================================= */

    function drawCover(
        image,
        width,
        height
    ) {

        if (!image) return;

        const imageRatio =
            image.width / image.height;

        const canvasRatio =
            width / height;

        let drawWidth;
        let drawHeight;

        let offsetX;
        let offsetY;


        if (imageRatio > canvasRatio) {

            drawHeight = height;

            drawWidth =
                height * imageRatio;

            offsetX =
                (width - drawWidth) / 2;

            offsetY = 0;

        } else {

            drawWidth = width;

            drawHeight =
                width / imageRatio;

            offsetX = 0;

            offsetY =
                (height - drawHeight) / 2;
        }


        ctx.drawImage(
            image,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
        );
    }


    /* =========================================================
       RESIZE CANVAS
    ========================================================= */

    function resizeCanvas() {

        const rect =
            canvas.getBoundingClientRect();

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                1.75
            );


        canvasWidth =
            rect.width;

        canvasHeight =
            rect.height;


        canvas.width =
            Math.round(
                canvasWidth * dpr
            );

        canvas.height =
            Math.round(
                canvasHeight * dpr
            );


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        renderFrame(
            Math.round(
                state.currentFrame
            )
        );
    }


    /* =========================================================
       RENDER FRAME
    ========================================================= */

    function renderFrame(index) {

        index =
            Math.max(
                0,
                Math.min(
                    FRAME_COUNT - 1,
                    index
                )
            );


        const image =
            images[index];


        if (!image) return;


        ctx.clearRect(
            0,
            0,
            canvasWidth,
            canvasHeight
        );


        drawCover(
            image,
            canvasWidth,
            canvasHeight
        );
    }


    /* =========================================================
       ANIMATION LOOP
    ========================================================= */

    function animationLoop() {

        const difference =
            state.targetFrame -
            state.currentFrame;


        if (Math.abs(difference) > 0.01) {

            state.currentFrame +=
                difference * 0.22;

        } else {

            state.currentFrame =
                state.targetFrame;
        }


        renderFrame(
            Math.round(
                state.currentFrame
            )
        );


        requestAnimationFrame(
            animationLoop
        );
    }


    /* =========================================================
       PROGRESSIVE PRELOADING
    ========================================================= */

    async function preloadFrames() {

        const batchSize = 8;

        let loadedCount = 0;


        for (
            let start = 0;
            start < FRAME_COUNT;
            start += batchSize
        ) {

            const batch = [];


            for (
                let i = start;
                i < Math.min(
                    start + batchSize,
                    FRAME_COUNT
                );
                i++
            ) {

                batch.push(
                    loadFrame(i).then(() => {

                        loadedCount++;


                        const percentage =
                            Math.round(
                                (
                                    loadedCount /
                                    FRAME_COUNT
                                ) * 100
                            );


                        loaderPercent.textContent =
                            `${percentage}%`;

                        loaderProgress.style.width =
                            `${percentage}%`;

                    })
                );

            }


            await Promise.all(batch);


            /*
             * Give the browser a tiny break.
             * This helps mobile devices.
             */

            await new Promise(
                resolve =>
                    requestAnimationFrame(resolve)
            );


            /*
             * As soon as the first frame exists,
             * display it.
             */

            if (
                start === 0 &&
                loaded[0]
            ) {

                renderFrame(0);

                loader.classList.add(
                    "hidden"
                );
            }

        }


        /*
         * Make absolutely sure
         * first and last frame exist.
         */

        await Promise.all([
            loadFrame(0),
            loadFrame(FRAME_COUNT - 1)
        ]);


        loader.classList.add(
            "hidden"
        );

    }


    /* =========================================================
       SCROLL ANIMATION
    ========================================================= */

    function createScrollAnimation() {

        gsap.to(
            state,
            {
                targetFrame:
                    FRAME_COUNT - 1,

                ease: "none",

                scrollTrigger: {

                    trigger:
                        introSection,

                    start: "top top",

                    end: "bottom bottom",

                    scrub: 0.12,

                    invalidateOnRefresh: true,


                    onUpdate: self => {

                        /*
                         * Convert scroll progress
                         * into frame number.
                         */

                        state.targetFrame =
                            self.progress *
                            (FRAME_COUNT - 1);


                        /*
                         * Hide scroll hint
                         * after scrolling starts.
                         */

                        if (
                            self.progress > 0.015
                        ) {

                            scrollHint.classList.add(
                                "hidden"
                            );

                        } else {

                            scrollHint.classList.remove(
                                "hidden"
                            );

                        }

                    }

                }

            }
        );

    }


    /* =========================================================
       INITIALIZE INTRO
    ========================================================= */

    async function initializeIntro() {

        resizeCanvas();

        /*
         * Load first frame immediately.
         */

        await loadFrame(0);

        renderFrame(0);

        /*
         * Start render loop.
         */

        animationLoop();

        /*
         * Start loading remaining frames.
         */

        preloadFrames();

        /*
         * Create ScrollTrigger.
         */

        createScrollAnimation();

    }


    /* =========================================================
       WINDOW RESIZE
    ========================================================= */

    window.addEventListener(
        "resize",
        () => {

            clearTimeout(
                resizeTimer
            );


            resizeTimer =
                setTimeout(
                    () => {

                        resizeCanvas();

                        ScrollTrigger.refresh();

                    },
                    150
                );

        },
        {
            passive: true
        }
    );


    /* =========================================================
       ORIENTATION CHANGE
    ========================================================= */

    window.addEventListener(
        "orientationchange",
        () => {

            setTimeout(
                () => {

                    resizeCanvas();

                    ScrollTrigger.refresh();

                },
                350
            );

        },
        {
            passive: true
        }
    );


    /* =========================================================
       VISUAL VIEWPORT
       Helps mobile browsers.
    ========================================================= */

    if (window.visualViewport) {

        window.visualViewport.addEventListener(
            "resize",
            () => {

                clearTimeout(
                    resizeTimer
                );


                resizeTimer =
                    setTimeout(
                        () => {

                            resizeCanvas();

                        },
                        120
                    );

            }
        );

    }


    /* =========================================================
       SKILL ICONS
    ========================================================= */

    const skillCircles =
        document.querySelectorAll(
            ".game-skill-circle"
        );


    /*
     * Add a small pointer-based interaction.
     *
     * This does NOT move the hyperlink away from
     * the cursor, so clicking remains easy.
     */

    skillCircles.forEach((circle) => {


        circle.addEventListener(
            "pointerenter",
            () => {

                circle.classList.add(
                    "is-active"
                );

            }
        );


        circle.addEventListener(
            "pointerleave",
            () => {

                circle.classList.remove(
                    "is-active"
                );

            }
        );


        /*
         * Small press feedback for touch.
         */

        circle.addEventListener(
            "pointerdown",
            () => {

                circle.classList.add(
                    "is-pressed"
                );

            }
        );


        circle.addEventListener(
            "pointerup",
            () => {

                circle.classList.remove(
                    "is-pressed"
                );

            }
        );


        circle.addEventListener(
            "pointercancel",
            () => {

                circle.classList.remove(
                    "is-pressed"
                );

            }
        );

    });


    /* =========================================================
       START
    ========================================================= */

    initializeIntro();

});