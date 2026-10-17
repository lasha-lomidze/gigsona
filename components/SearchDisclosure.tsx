"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FiChevronRight, FiLayers, FiUsers } from "react-icons/fi";
import { motionDuration, motionEase } from "@/components/ui/motion";

type SearchDisclosureProps = {
    section: "groups" | "people";
    title: string;
    count: string;
    initiallyOpen?: boolean;
    children: ReactNode;
};

export function SearchDisclosure({
    section,
    title,
    count,
    initiallyOpen = false,
    children,
}: SearchDisclosureProps) {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    const contentId = useId();
    const headingId = useId();
    const SectionIcon = section === "groups" ? FiLayers : FiUsers;

    return (
        <div>
            <h2>
                <button
                    id={headingId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => setIsOpen((open) => !open)}
                    className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left outline-none transition hover:bg-surface/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                >
                    <span className="flex min-w-0 items-center gap-2.5">
                        <SectionIcon aria-hidden="true" className="shrink-0 text-accent" />
                        <span className="text-sm font-medium text-ink">{title}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                        <span className="text-xs text-faint">{count}</span>
                        <motion.span
                            aria-hidden="true"
                            animate={{ rotate: isOpen ? 90 : 0 }}
                            transition={{ duration: motionDuration.micro, ease: motionEase }}
                            className="text-faint"
                        >
                            <FiChevronRight />
                        </motion.span>
                    </span>
                </button>
            </h2>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        id={contentId}
                        role="region"
                        aria-labelledby={headingId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: motionDuration.page, ease: motionEase }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
