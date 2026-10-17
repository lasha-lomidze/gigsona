"use client";

import { motion } from "motion/react";

type PageTitleProps = {
    title: string;
    description: string;
};

export const PageTitle = ({ title, description }: PageTitleProps) => {
    return (
        <motion.header
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
        >
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm leading-5 text-muted sm:leading-normal">{description}</p>
        </motion.header>
    );
};
