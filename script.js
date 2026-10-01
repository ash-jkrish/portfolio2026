document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const introSection =
        document.querySelector("#intro-section");

    const introStage =
        document.querySelector(".intro-stage");

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


    const aboutSection =
        document.querySelector("#about-section");

    const aboutCard =
        document.querySelector("#about-card");

    const aboutReveal =
        document.querySelectorAll(".about-reveal");


    /* =====================================================
       SETTINGS
    ===================================================== */

    const FRAME_COUNT = 239;

    const FRAME_PATH =
        "./frames/frame-001 (INDEX).png";


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        currentFrame: 0,

        targetFrame: 0

    };


    const images =
        new Array(FRAME_COUNT);

    const loaded =
        new Array(FRAME_COUNT)
            .fill(false);


    let canvasWidth = 0;

    let canvasHeight = 0;

    let resizeTimer = null;


    /* =====================================================
       FRAME PATH
    ===================================================== */

    function getFramePath(index) {

        return FRAME_PATH.replace(
            "INDEX",
            index + 1
        );

    }


    /* =====================================================
       LOAD FRAME
    ===================================================== */

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

                resolve(
                    images[index]
                );

                return;

            }


            const img =
                new Image();


            img.decoding =
                "async";


            img.onload = () => {

                images[index] =
                    img;

                loaded[index] =
                    true;

                resolve(img);

            };


            img.onerror = () => {

                console.warn(
                    "Could not load:",
                    getFramePath(index)
                );

                resolve(null);

            };


            img.src =
                getFramePath(index);

        });

    }


    /* =====================================================
       DRAW COVER
    ===================================================== */

    function drawCover(
        image,
        width,
        height
    ) {

        if (!image) return;


        const imageRatio =
            image.width /
            image.height;


        const canvasRatio =
            width /
            height;


        let drawWidth;

        let drawHeight;

        let offsetX;

        let offsetY;


        if (
            imageRatio >
            canvasRatio
        ) {

            drawHeight =
                height;

            drawWidth =
                height *
                imageRatio;

            offsetX =
                (width -
                    drawWidth) / 2;

            offsetY = 0;

        } else {

            drawWidth =
                width;

            drawHeight =
                width /
                imageRatio;

            offsetX = 0;

            offsetY =
                (height -
                    drawHeight) / 2;

        }


        ctx.drawImage(
            image,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
        );

    }


    /* =====================================================
       RESIZE CANVAS
    ===================================================== */

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


    /* =====================================================
       RENDER FRAME
    ===================================================== */

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


    /* =====================================================
       SMOOTH FRAME LOOP
    ===================================================== */

    function animationLoop() {

        const difference =
            state.targetFrame -
            state.currentFrame;


        if (
            Math.abs(difference) >
            0.01
        ) {

            state.currentFrame +=
                difference *
                0.22;

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


    /* =====================================================
       PRELOAD FRAMES
    ===================================================== */

    async function preloadFrames() {

        const batchSize = 12;

        let completed = 0;


        for (
            let start = 0;
            start < FRAME_COUNT;
            start += batchSize
        ) {

            const batch = [];


            for (
                let i = start;
                i <
                Math.min(
                    start + batchSize,
                    FRAME_COUNT
                );
                i++
            ) {

                batch.push(

                    loadFrame(i)
                        .then(() => {

                            completed++;


                            const percentage =
                                Math.round(
                                    (
                                        completed /
                                        FRAME_COUNT
                                    ) * 100
                                );


                            if (
                                loaderPercent
                            ) {

                                loaderPercent.textContent =
                                    `${percentage}%`;

                            }


                            if (
                                loaderProgress
                            ) {

                                loaderProgress.style.width =
                                    `${percentage}%`;

                            }

                        })

                );

            }


            await Promise.all(
                batch
            );


            await new Promise(
                resolve =>
                    requestAnimationFrame(
                        resolve
                    )
            );


            /* Show first frame immediately */

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


        /* Make absolutely sure first + last exist */

        await Promise.all([

            loadFrame(0),

            loadFrame(
                FRAME_COUNT - 1
            )

        ]);


        loader.classList.add(
            "hidden"
        );


        /*
         * IMPORTANT:
         * Keep final frame available.
         */

        if (
            loaded[
                FRAME_COUNT - 1
            ]
        ) {

            renderFrame(
                FRAME_COUNT - 1
            );

        }

    }


    /* =====================================================
       INTRO SCROLL ANIMATION
    ===================================================== */

    function createIntroAnimation() {

        ScrollTrigger.create({

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


            onUpdate: (self) => {

                /*
                 * 0 → 238
                 */

                state.targetFrame =
                    self.progress *
                    (FRAME_COUNT - 1);


                /*
                 * Hide scroll hint
                 */

                if (
                    self.progress >
                    0.015
                ) {

                    scrollHint.classList.add(
                        "hidden"
                    );

                } else {

                    scrollHint.classList.remove(
                        "hidden"
                    );

                }


                /*
                 * Explicitly lock the final frame
                 */

                if (
                    self.progress >=
                    0.999
                ) {

                    state.targetFrame =
                        FRAME_COUNT - 1;

                }

            }

        });

    }


    /* =====================================================
       ABOUT CARD TRANSITION
    ===================================================== */

    function createAboutTransition() {

        if (
            !aboutSection ||
            !aboutCard
        ) return;


        /* Initial card state */

        gsap.set(
            aboutCard,
            {

                y: 100,

                scale: 0.82,

                opacity: 0,

                rotateX: 8,

                transformOrigin:
                    "center bottom"

            }
        );


        /*
         * Card rises from the final frame
         */

        gsap.to(
            aboutCard,
            {

                y: 0,

                scale: 1,

                opacity: 1,

                rotateX: 0,

                ease:
                    "power3.out",

                scrollTrigger: {

                    trigger:
                        aboutSection,

                    start:
                        "top 95%",

                    end:
                        "top 25%",

                    scrub:
                        1.2,

                    invalidateOnRefresh:
                        true

                }

            }
        );


        /*
         * Final frame subtly pushes backward
         */

        gsap.to(
            introStage,
            {

                scale: 0.94,

                filter:
                    "blur(4px)",

                ease:
                    "none",

                scrollTrigger: {

                    trigger:
                        aboutSection,

                    start:
                        "top bottom",

                    end:
                        "top 25%",

                    scrub:
                        1.2,

                    invalidateOnRefresh:
                        true

                }

            }
        );


        /*
         * Cyan transition glow
         */

        const glow =
            document.querySelector(
                ".about-transition-glow"
            );


        if (glow) {

            gsap.fromTo(

                glow,

                {
                    opacity: 0,

                    scale: .7

                },

                {

                    opacity: 1,

                    scale: 1.1,

                    ease:
                        "none",

                    scrollTrigger: {

                        trigger:
                            aboutSection,

                        start:
                            "top bottom",

                        end:
                            "top 20%",

                        scrub:
                            1

                    }

                }

            );

        }


        /*
         * TEXT STAGGER
         */

        gsap.set(
            aboutReveal,
            {

                opacity: 0,

                y: 45,

                filter:
                    "blur(12px)"

            }
        );


        gsap.to(
            aboutReveal,
            {

                opacity: 1,

                y: 0,

                filter:
                    "blur(0px)",

                duration:
                    .8,

                stagger:
                    .12,

                ease:
                    "power3.out",

                scrollTrigger: {

                    trigger:
                        aboutSection,

                    start:
                        "top 65%",

                    toggleActions:
                        "play none none reverse"

                }

            }
        );

    }


    /* =====================================================
       SKILL INTERACTIONS
    ===================================================== */

    function setupSkillInteractions() {

        const nodes =
            document.querySelectorAll(
                ".orbit-node"
            );


        nodes.forEach(
            node => {

                node.addEventListener(
                    "pointerenter",
                    () => {

                        node.classList.add(
                            "is-active"
                        );

                    }
                );


                node.addEventListener(
                    "pointerleave",
                    () => {

                        node.classList.remove(
                            "is-active"
                        );

                    }
                );

            }
        );

    }
        /* =====================================================
       RESIZE
    ===================================================== */

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


    /* =====================================================
       ORIENTATION
    ===================================================== */

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


    /* =====================================================
       VISUAL VIEWPORT
    ===================================================== */

    if (
        window.visualViewport
    ) {

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


    /* =====================================================
       EXPERIENCE STACK — ONE SCROLL = ONE PAGE
       2 SECOND HOLD BETWEEN PAGE CHANGES
    ===================================================== */

    function createExperienceStack() {

        const experienceSection =
            document.querySelector("#experience-section");

        const experienceStage =
            document.querySelector(".experience-stage");

        const experiencePanels =
            gsap.utils.toArray(".experience-panel");

        const contactSection =
            document.querySelector("#contact-section");

        if (
            !experienceSection ||
            !experienceStage ||
            experiencePanels.length < 1
        ) return;

        const panelCount = experiencePanels.length;
        const TRANSITION_TIME = 0.62;
        const WHEEL_LOCK_TIME = 700;

        let activePanel = 0;
        let isTransitioning = false;
        let wheelLocked = false;

        /*
         * IMPORTANT:
         * This function controls ONLY the Experience section.
         * The original intro / top scroll animation is untouched.
         *
         * The Experience section is one viewport tall and the cards
         * are layered inside it. We explicitly keep the browser at
         * the top of this section while changing cards. At the first
         * and last card we hand scrolling back to the normal document
         * flow and explicitly move to the adjacent section. This avoids
         * the black/empty overscroll seen in the previous version.
         */

        gsap.set(
            experiencePanels,
            {
                yPercent: 100,
                scale: 1,
                opacity: 1,
                zIndex: 1
            }
        );

        gsap.set(
            experiencePanels[0],
            {
                yPercent: 0,
                zIndex: 5
            }
        );

        function getSectionTop() {
            return (
                experienceSection.getBoundingClientRect().top +
                window.scrollY
            );
        }

        function keepExperiencePinned() {
            const top = getSectionTop();

            if (Math.abs(window.scrollY - top) > 1) {
                window.scrollTo(0, top);
            }
        }

        function moveToPanel(targetIndex) {

            if (
                targetIndex < 0 ||
                targetIndex >= panelCount ||
                targetIndex === activePanel ||
                isTransitioning
            ) return;

            const previousPanel =
                experiencePanels[activePanel];

            const nextPanel =
                experiencePanels[targetIndex];

            const movingForward =
                targetIndex > activePanel;

            isTransitioning = true;

            /* Always keep the browser locked to the Experience viewport. */
            keepExperiencePinned();

            gsap.set(
                nextPanel,
                {
                    yPercent:
                        movingForward
                            ? 100
                            : -100,
                    scale: 1,
                    opacity: 1,
                    zIndex: 6
                }
            );

            gsap.to(
                nextPanel,
                {
                    yPercent: 0,
                    duration: TRANSITION_TIME,
                    ease: "power3.inOut",
                    overwrite: true,
                    onComplete: () => {

                        gsap.set(
                            previousPanel,
                            {
                                yPercent:
                                    movingForward
                                        ? -100
                                        : 100,
                                scale: 1,
                                opacity: 1,
                                zIndex: 1
                            }
                        );

                        experiencePanels.forEach(
                            (panel, index) => {

                                if (
                                    index !== targetIndex &&
                                    index !== activePanel
                                ) {

                                    gsap.set(
                                        panel,
                                        {
                                            yPercent:
                                                index < targetIndex
                                                    ? -100
                                                    : 100,
                                            zIndex: 1
                                        }
                                    );

                                }

                            }
                        );

                        activePanel = targetIndex;
                        isTransitioning = false;

                        /* Re-pin after the animation in case browser momentum moved 1–2px. */
                        keepExperiencePinned();

                    }
                }
            );
        }

        function lockWheel() {
            wheelLocked = true;

            window.setTimeout(
                () => {
                    wheelLocked = false;
                },
                WHEEL_LOCK_TIME
            );
        }

        function goToContact() {

            if (!contactSection) return;

            window.scrollTo({
                top:
                    contactSection.getBoundingClientRect().top +
                    window.scrollY,
                behavior: "smooth"
            });
        }

        function goToPreviousSection() {

            const previousSection =
                experienceSection.previousElementSibling;

            if (!previousSection) return;

            window.scrollTo({
                top:
                    previousSection.getBoundingClientRect().top +
                    window.scrollY,
                behavior: "smooth"
            });
        }

        function handleExperienceWheel(event) {

            const rect =
                experienceSection.getBoundingClientRect();

            const viewportHeight =
                window.innerHeight;

            const intersectsViewport =
                rect.top < viewportHeight &&
                rect.bottom > 0;

            if (!intersectsViewport) return;

            /*
             * If the user has just entered Experience, snap the section
             * to the viewport before any card transition. This prevents
             * partial-screen / black-space states.
             */
            const sectionIsAtViewportTop =
                Math.abs(rect.top) <= 8;

            if (!sectionIsAtViewportTop) {

                if (event.deltaY > 0 && rect.top > 0) {
                    event.preventDefault();
                    window.scrollTo(0, getSectionTop());
                    return;
                }

                if (event.deltaY < 0 && rect.bottom < viewportHeight) {
                    event.preventDefault();
                    window.scrollTo(0, getSectionTop());
                    return;
                }

                return;
            }

            /* FIRST CARD + UP → leave Experience normally. */
            if (
                event.deltaY < 0 &&
                activePanel === 0
            ) {
                event.preventDefault();

                if (!wheelLocked && !isTransitioning) {
                    lockWheel();
                    goToPreviousSection();
                }

                return;
            }

            /* LAST CARD + DOWN → go directly to Contact. */
            if (
                event.deltaY > 0 &&
                activePanel === panelCount - 1
            ) {
                event.preventDefault();

                if (!wheelLocked && !isTransitioning) {
                    lockWheel();
                    goToContact();
                }

                return;
            }

            /* Internal Experience navigation. */
            event.preventDefault();

            if (
                wheelLocked ||
                isTransitioning
            ) return;

            lockWheel();
            keepExperiencePinned();

            if (event.deltaY > 0) {
                moveToPanel(activePanel + 1);
            } else {
                moveToPanel(activePanel - 1);
            }
        }

        /*
         * Capture at window level so the transition also works when the
         * wheel starts over text, links, cards, or other child elements.
         */
        window.addEventListener(
            "wheel",
            handleExperienceWheel,
            {
                passive: false,
                capture: true
            }
        );

        /* -------------------------------------------------
           TOUCH / SWIPE
        ------------------------------------------------- */

        let touchStartY = 0;
        let touchLocked = false;

        experienceSection.addEventListener(
            "touchstart",
            event => {

                if (event.touches.length) {
                    touchStartY =
                        event.touches[0].clientY;
                }

            },
            { passive: true }
        );

        experienceSection.addEventListener(
            "touchend",
            event => {

                if (
                    touchLocked ||
                    !event.changedTouches.length
                ) return;

                const touchEndY =
                    event.changedTouches[0].clientY;

                const distance =
                    touchStartY - touchEndY;

                if (Math.abs(distance) < 50) return;

                const rect =
                    experienceSection.getBoundingClientRect();

                if (
                    Math.abs(rect.top) > 8 ||
                    rect.bottom < window.innerHeight - 8
                ) {
                    window.scrollTo(0, getSectionTop());
                    return;
                }

                touchLocked = true;

                window.setTimeout(
                    () => {
                        touchLocked = false;
                    },
                    WHEEL_LOCK_TIME
                );

                if (
                    distance > 0 &&
                    activePanel === panelCount - 1
                ) {
                    goToContact();
                    return;
                }

                if (
                    distance < 0 &&
                    activePanel === 0
                ) {
                    goToPreviousSection();
                    return;
                }

                if (distance > 0) {
                    moveToPanel(activePanel + 1);
                } else {
                    moveToPanel(activePanel - 1);
                }

            },
            { passive: true }
        );

        /* Keep the active card correctly positioned after resize. */
        window.addEventListener(
            "resize",
            () => {

                if (!isTransitioning) {
                    gsap.set(
                        experiencePanels,
                        { scale: 1 }
                    );

                    gsap.set(
                        experiencePanels[activePanel],
                        {
                            yPercent: 0,
                            zIndex: 5
                        }
                    );
                }

            },
            { passive: true }
        );
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        resizeCanvas();


        /*
         * Load first frame
         * immediately.
         */

        await loadFrame(0);


        renderFrame(0);


        /*
         * Start continuous renderer.
         */

        animationLoop();


        /*
         * Start loading remaining frames.
         */

        preloadFrames();


        /*
         * Scroll animation.
         */

        createIntroAnimation();


        /*
         * About transition.
         */

        createAboutTransition();


        /*
         * Icon interactions.
         */

        setupSkillInteractions();


        /*
         * Experience stack.
         */

        createExperienceStack();


        /*
         * Build a real QR code for the live portfolio URL.
         * The fallback QR-style visual remains visible if the
         * QR service is unavailable.
         */

        const portfolioQR =
            document.querySelector("#portfolio-qr");

        if (portfolioQR) {

            portfolioQR.src =
                "https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=0&data=" +
                encodeURIComponent(window.location.href);

            portfolioQR.addEventListener(
                "load",
                () => {

                    const qrMark =
                        document.querySelector(".contact-qr-mark");

                    if (qrMark) {
                        qrMark.style.display = "none";
                    }

                }
            );

        }


        setTimeout(
            () => {

                ScrollTrigger.refresh();

            },
            500
        );

    }


    initialize();

});
