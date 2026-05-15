"use client"
import { useStore } from '../store/store'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export const Overlay = () => {
    const { modalOpen, setModal } = useStore()

    const [shouldRender, setShouldRender] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false); // New state to trigger CSS
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (modalOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';

            // Wait 10ms to let the DOM mount before starting the "in" animation
            const timer = setTimeout(() => setIsAnimating(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false); // Start "out" animation
            document.body.style.overflow = '';

            // Wait for animation to finish before unmounting
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [modalOpen]);

    if (!mounted || !shouldRender) return null;

    return createPortal(
        <div
            onClick={() => setModal(null)}
            className={`
                fixed inset-0 z-100 transition-all duration-300 ease-in-out
                ${isAnimating
                    ? "opacity-100 backdrop-blur-md pointer-events-auto"
                    : "opacity-0 backdrop-blur-none pointer-events-none"}
            `}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        />,
        document.body
    );
};