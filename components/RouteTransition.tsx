"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { transitions } from "./ui/motion";

// Keyed by path + query so the reveal replays on page changes and on tab-style query switches (e.g. ?group=, ?role=).
export function RouteTransition({ children, className }: { children: React.ReactNode; className?: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const routeKey = `${pathname}?${searchParams.toString()}`;

    return (
        <motion.div
            key={routeKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.smooth}
            className={className}
        >
            {children}
        </motion.div>
    );
}
