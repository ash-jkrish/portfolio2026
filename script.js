
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
       EXPERIENCE STACK — TRUE ONE-SCREEN CARD STACK

       IMPORTANT:
       The Experience section itself is only ONE viewport tall.
       The browser is NOT allowed to scroll through four viewport
       heights. JavaScript owns the four card transitions.

       This prevents the page from jumping above/below the Experience
       stack when the user makes a large wheel movement or swipe.
    ===================================================== */

    function createExperienceStack() {

        const experienceSection =
            document.querySelector("#experience-section");

        const experienceStage =
            document.querySelector(".experience-stage");

        const experiencePanels =
            gsap.utils.toArray(".experience-panel");

        if (
            !experienceSection ||
            !experienceStage ||
            experiencePanels.length < 1
        ) return;

        const panelCount = experiencePanels.length;
        const mobileQuery = window.matchMedia("(max-width: 900px)");

        let activePanel = 0;
        let isTransitioning = false;
        let inputLocked = false;
        let touchStartY = 0;
        let touchStartX = 0;

        const INPUT_LOCK_MS = 760;
        const PANEL_DURATION = 0.68;
        const SWIPE_DISTANCE = 50;
        const STACK_REVEAL = 7;


        function getViewportHeight() {
            return window.innerHeight ||
                   document.documentElement.clientHeight ||
                   1;
        }


        function getSectionTop() {
            return (
                experienceSection.getBoundingClientRect().top +
                window.scrollY
            );
        }


        function getContactSection() {
            return document.querySelector("#contact-section") ||
                   document.querySelector(".contact-section");
        }


        function getPreviousSectionTarget() {
            return Math.max(
                0,
                getSectionTop() - getViewportHeight()
            );
        }


        function isSectionActive() {
            const rect =
                experienceSection.getBoundingClientRect();

            const vh = getViewportHeight();

            /* The section is one viewport tall. */
            return (
                rect.top <= 3 &&
                rect.bottom >= vh - 3
            );
        }


        function setPanelState(index) {

            index = Math.max(
                0,
                Math.min(panelCount - 1, index)
            );

            experiencePanels.forEach((panel, panelIndex) => {

                gsap.killTweensOf(panel);

                if (panelIndex < index) {

                    /*
                     * Previous cards stay underneath instead of disappearing.
                     * This is what creates the real card-on-card stack.
                     */
                    gsap.set(panel, {
                        yPercent: 0,
                        zIndex: panelIndex + 1,
                        opacity: 1,
                        scale: 1,
                        borderRadius: 0,
                        filter: "brightness(.94)"
                    });

                } else if (panelIndex === index) {

                    /* Leave a small strip of the previous card visible above. */
                    gsap.set(panel, {
                        yPercent: index === 0 ? 0 : STACK_REVEAL,
                        zIndex: 100,
                        opacity: 1,
                        scale: 1,
                        borderRadius: 0,
                        filter: "brightness(1)"
                    });

                } else {

                    gsap.set(panel, {
                        yPercent: 100,
                        zIndex: 1,
                        opacity: 1,
                        scale: 1,
                        borderRadius: 0,
                        filter: "brightness(1)"
                    });

                }

            });

            activePanel = index;
        }


        function movePageTo(targetY, smooth = true) {

            window.scrollTo({
                top: Math.max(0, targetY),
                behavior: smooth ? "smooth" : "auto"
            });
        }


        function goToContact() {

            const contact = getContactSection();

            if (!contact) return;

            inputLocked = true;

            /* Make the fourth card fully visible before leaving. */
            setPanelState(panelCount - 1);
            activePanel = panelCount - 1;

            const target =
                contact.getBoundingClientRect().top +
                window.scrollY;

            movePageTo(target, true);

            window.setTimeout(() => {
                inputLocked = false;
            }, INPUT_LOCK_MS);
        }


        function leaveExperienceUpward() {

            inputLocked = true;

            const target = getPreviousSectionTarget();

            movePageTo(target, true);

            window.setTimeout(() => {
                inputLocked = false;
            }, INPUT_LOCK_MS);
        }


        function moveToPanel(targetIndex) {

            if (
                targetIndex < 0 ||
                targetIndex >= panelCount ||
                targetIndex === activePanel ||
                isTransitioning
            ) {
                return false;
            }

            const previousIndex = activePanel;
            const previousPanel = experiencePanels[previousIndex];
            const nextPanel = experiencePanels[targetIndex];
            const forward = targetIndex > previousIndex;

            isTransitioning = true;

            gsap.killTweensOf([previousPanel, nextPanel]);

            /* Keep the browser parked on the Experience section. */
            if (!isSectionActive()) {
                movePageTo(getSectionTop(), false);
            }

            if (forward) {

                /*
                 * The current card stays underneath. The next card rises
                 * over it from the bottom and stops slightly below the top,
                 * leaving the previous card's top edge visible.
                 */
                gsap.set(nextPanel, {
                    yPercent: 100,
                    zIndex: 100,
                    opacity: 1,
                    scale: 1,
                    borderRadius: 0,
                    filter: "brightness(1)"
                });

                gsap.to(nextPanel, {
                    yPercent: STACK_REVEAL,
                    duration: PANEL_DURATION,
                    ease: "power3.out",
                    overwrite: true,
                    onComplete: () => {
                        setPanelState(targetIndex);
                        isTransitioning = false;
                    }
                });

            } else {

                /*
                 * Reverse the exact card-on-card motion. The current card
                 * drops toward the bottom, while the previous card is already
                 * sitting at the small STACK_REVEAL offset and rises to 0.
                 * This makes scrolling upward feel like the same physical
                 * stack being opened in reverse.
                 */
                const revealPanel = experiencePanels[targetIndex];

                gsap.set(revealPanel, {
                    yPercent: STACK_REVEAL,
                    zIndex: 100,
                    opacity: 1,
                    scale: 1,
                    borderRadius: 0,
                    filter: "brightness(1)"
                });

                gsap.to(previousPanel, {
                    yPercent: 100,
                    duration: PANEL_DURATION,
                    ease: "power3.inOut",
                    overwrite: true
                });

                gsap.to(revealPanel, {
                    yPercent: 0,
                    duration: PANEL_DURATION,
                    ease: "power3.inOut",
                    overwrite: true,
                    onComplete: () => {
                        setPanelState(targetIndex);
                        isTransitioning = false;
                    }
                });
            }

            activePanel = targetIndex;
            return true;
        }


        function handleDesktopWheel(event) {

            if (mobileQuery.matches) return;

            const rect = experienceSection.getBoundingClientRect();
            const vh = getViewportHeight();
            const delta = event.deltaY;

            if (Math.abs(delta) < 1) return;

            const sectionVisible =
                rect.bottom > 0 &&
                rect.top < vh;

            /*
             * Once the Experience section enters the viewport, take ownership
             * of the wheel immediately. This prevents native scrolling from
             * landing the section between two cards.
             */
            if (!isSectionActive()) {

                if (sectionVisible) {
                    const enteringFromAbove = rect.top > 0 && delta > 0;
                    const enteringFromBelow = rect.bottom < vh && delta < 0;

                    if (enteringFromAbove || enteringFromBelow) {
                        event.preventDefault();

                        if (inputLocked || isTransitioning) return;

                        inputLocked = true;
                        movePageTo(getSectionTop(), false);

                        /* Always begin at the correct end of the stack. */
                        if (enteringFromAbove) {
                            activePanel = 0;
                            setPanelState(0);
                        } else {
                            activePanel = panelCount - 1;
                            setPanelState(panelCount - 1);
                        }

                        window.setTimeout(() => {
                            inputLocked = false;
                        }, 120);
                    }
                }

                return;
            }

            /* Experience owns the wheel while the section is aligned. */
            event.preventDefault();

            if (inputLocked || isTransitioning) return;

            /* Ignore tiny trackpad noise. */
            if (Math.abs(delta) < 8) return;

            inputLocked = true;

            if (delta > 0) {

                if (activePanel < panelCount - 1) {
                    moveToPanel(activePanel + 1);
                } else {
                    goToContact();
                }

            } else {

                if (activePanel > 0) {
                    moveToPanel(activePanel - 1);
                } else {
                    leaveExperienceUpward();
                }
            }

            window.setTimeout(() => {
                inputLocked = false;
            }, INPUT_LOCK_MS);
        }

        window.addEventListener(
            "wheel",
            handleDesktopWheel,
            { passive: false, capture: true }
        );


        /* =================================================
           MOBILE SWIPE
        ================================================= */

        function handleTouchStart(event) {

            if (
                !mobileQuery.matches ||
                !event.touches.length
            ) return;

            touchStartY =
                event.touches[0].clientY;

            touchStartX =
                event.touches[0].clientX;
        }


        function handleTouchMove(event) {

            if (!mobileQuery.matches) return;

            /*
             * Critical: do not allow the document to scroll while
             * the Experience card is being swiped.
             */
            if (isSectionActive()) {
                event.preventDefault();
            }
        }


        function handleTouchEnd(event) {

            if (
                !mobileQuery.matches ||
                inputLocked ||
                isTransitioning ||
                !event.changedTouches.length
            ) return;

            const touchEndY =
                event.changedTouches[0].clientY;

            const touchEndX =
                event.changedTouches[0].clientX;

            const distanceY =
                touchStartY - touchEndY;

            const distanceX =
                touchStartX - touchEndX;

            /* Ignore horizontal movement and tiny taps. */
            if (
                Math.abs(distanceY) < SWIPE_DISTANCE ||
                Math.abs(distanceY) < Math.abs(distanceX)
            ) {
                return;
            }

            inputLocked = true;

            if (distanceY > 0) {

                /* Swipe UP = next experience. */
                if (activePanel < panelCount - 1) {

                    moveToPanel(activePanel + 1);

                } else {

                    goToContact();
                }

            } else {

                /* Swipe DOWN = previous experience. */
                if (activePanel > 0) {

                    moveToPanel(activePanel - 1);

                } else {

                    leaveExperienceUpward();
                }
            }

            window.setTimeout(() => {
                inputLocked = false;
            }, INPUT_LOCK_MS);
        }


        experienceStage.addEventListener(
            "touchstart",
            handleTouchStart,
            { passive: true }
        );

        experienceStage.addEventListener(
            "touchmove",
            handleTouchMove,
            { passive: false }
        );

        experienceStage.addEventListener(
            "touchend",
            handleTouchEnd,
            { passive: true }
        );


        /* =================================================
           INITIAL STATE
        ================================================= */

        gsap.set(experiencePanels, {
            yPercent: 100,
            opacity: 1,
            scale: 1,
            zIndex: 1,
            borderRadius: 0,
            filter: "brightness(1)"
        });

        setPanelState(0);


        function syncMode() {

            isTransitioning = false;
            inputLocked = false;

            gsap.killTweensOf(experiencePanels);
            setPanelState(activePanel);

        }


        if (mobileQuery.addEventListener) {
            mobileQuery.addEventListener("change", syncMode);
        } else {
            mobileQuery.addListener(syncMode);
        }


        window.addEventListener(
            "resize",
            () => {

                if (!isTransitioning && isSectionActive()) {
                    movePageTo(getSectionTop(), false);
                }

                setPanelState(activePanel);
            },
            { passive: true }
        );

        syncMode();
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

