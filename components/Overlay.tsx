"use client";
import { motionDuration, motionEase } from "@/components/ui/motion";
import { useStore } from "../store/store";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export const Overlay = () => {
    const { modalOpen, setModal } = useStore();
    const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        if (modalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [modalOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {modalOpen && (
                <motion.div
                    key="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: motionDuration.standard, ease: motionEase }}
                    onClick={() => setModal(null)}
                    className="fixed inset-0 z-100 backdrop-blur-md"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                />
            )}
        </AnimatePresence>,
        document.body
    );
};