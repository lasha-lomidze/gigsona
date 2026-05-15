"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export const useAnimation = () => {
    useLayoutEffect(() => {
        const animated = new WeakSet<HTMLElement>();

        const initAnimations = () => {
            gsap.utils
                .toArray<HTMLElement>(".fade, .slide")
                .forEach((el) => {
                    if (animated.has(el)) return;

                    animated.add(el);

                    const originalTransition =
                        window.getComputedStyle(el).transition;

                    el.style.pointerEvents = "none";
                    el.style.transition = "none";
                    el.style.willChange = "transform, opacity";

                    const isFade = el.classList.contains("fade");

                    const direction = el.dataset.direction || "up";
                    const y = parseFloat(el.dataset.y || "30");
                    const x = parseFloat(el.dataset.x || "30");
                    const duration = parseFloat(el.dataset.duration || "1");
                    const delay = parseFloat(el.dataset.delay || "0");
                    const ease = el.dataset.ease || "expo.out";
                    const start = el.dataset.start || "top 90%";
                    const scrub = el.dataset.scrub === "true";

                    gsap.set(el, {
                        opacity: isFade ? 0 : 1,

                        x:
                            direction === "left"
                                ? x
                                : direction === "right"
                                    ? -x
                                    : 0,

                        y:
                            direction === "up"
                                ? y
                                : direction === "down"
                                    ? -y
                                    : 0,
                    });

                    gsap.to(el, {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        duration,
                        delay,
                        ease,

                        scrollTrigger: {
                            trigger: el,
                            start,
                            scrub,
                            toggleActions: "play reverse play reverse",
                        },

                        // onStart: () => {
                        //     el.classList.remove("gsap-init");
                        // },

                        onComplete: () => {
                            el.style.willChange = "auto";
                            el.style.transition = originalTransition;
                            el.style.pointerEvents = "auto";
                        },
                    });
                });

            ScrollTrigger.refresh();
        };

        const ctx = gsap.context(() => {
            initAnimations();

            let refreshTimeout: NodeJS.Timeout;

            const observer = new MutationObserver((mutations) => {
                let shouldRefresh = false;

                for (const mutation of mutations) {
                    mutation.addedNodes.forEach((node) => {
                        if (!(node instanceof HTMLElement)) return;

                        if (
                            node.matches(".fade, .slide") ||
                            node.querySelector(".fade, .slide")
                        ) {
                            shouldRefresh = true;
                        }
                    });
                }

                if (shouldRefresh) {
                    clearTimeout(refreshTimeout);

                    refreshTimeout = setTimeout(() => {
                        requestAnimationFrame(() => {
                            initAnimations();
                        });
                    }, 50);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            return () => {
                observer.disconnect();
                clearTimeout(refreshTimeout);
            };
        });

        return () => ctx.revert();
    }, []);

    return null;
};

export function AnimationWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    useAnimation();

    return <>{children}</>;
}
// // hooks/useAnimation.ts
// "use client";
// import { useLayoutEffect } from "react";
// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

// if (typeof window !== "undefined") {
//     gsap.registerPlugin(ScrollTrigger);
// }

// export const useAnimation = () => {
//     useLayoutEffect(() => {
//         // Create GSAP context to manage all animations and triggers inside a "trash can"
//         let ctx = gsap.context(() => {
//             console.log("Initializing GSAP animations...");

//             // 1. FADE / SLIDE LOGIC
//             const animateFade = () => {
//                 gsap.utils.toArray<HTMLElement>(".fade, .slide").forEach((el) => {

//                     const originalTransition = window.getComputedStyle(el).transition;

//                     el.style.pointerEvents = "none"; // Prevent interaction during animation
//                     el.style.transition = "none";
//                     el.style.willChange = "transform";
//                     const isFade = el.classList.contains("fade");
//                     const direction = el.dataset.direction || "up";
//                     const y = parseFloat(el.dataset.y || "30");
//                     const x = parseFloat(el.dataset.x || "30");
//                     const duration = parseFloat(el.dataset.duration || "1");
//                     const delay = parseFloat(el.dataset.delay || "0");
//                     const ease = el.dataset.ease || "expo.out";
//                     const start = el.dataset.start || "top 90%";
//                     const scrub = el.dataset.scrub === "true";

//                     const vars: gsap.TweenVars = {
//                         opacity: isFade ? 0 : 1,
//                         duration,
//                         delay,
//                         ease,
//                         scrollTrigger: {
//                             trigger: el,
//                             start,
//                             scrub,
//                             toggleActions: "play reverse play reverse",
//                         },

//                         onComplete: () => {
//                             el.style.willChange = "auto";
//                             el.style.transition = originalTransition;
//                             el.style.pointerEvents = "auto"; // Re-enable interaction after animation
//                         },
//                     };

//                     if (direction === "up") vars.y = y;
//                     else if (direction === "down") vars.y = -y;
//                     else if (direction === "left") vars.x = x;
//                     else if (direction === "right") vars.x = -x;

//                     gsap.from(el, vars);
//                 });
//             };

//             const timeout = setTimeout(() => {
//                 animateFade();
//                 console.log("GSAP animations initialized.");
//             }, 100); // Slight delay for Next.js hydration
//         });

//         // Cleanup function: ctx.revert() kills all ScrollTriggers and resets styles
//         return () => ctx.revert();
//     }, []);

//     return null;
// };

// export function AnimationWrapper({ children }: { children: React.ReactNode }) {
//     useAnimation(); // Initialize the GSAP listeners
//     return <>{children}</>;
// }

