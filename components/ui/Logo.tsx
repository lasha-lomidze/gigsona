// import Link from "next/link";
// import { cn } from "@/lib/cn";

// export const Logo = ({ compact = false }: { compact?: boolean }) => {
//     return (
//         <Link
//             href="/"
//             className={cn(
//                 "inline-flex items-center gap-1.5 select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
//                 compact ? "text-base" : "text-lg"
//             )}
//         >
//             <svg
//                 viewBox="0 0 40 40"
//                 fill="none"
//                 aria-hidden="true"
//                 className={cn(compact ? "size-9" : "size-10")}
//             >
//                 <defs>
//                     <linearGradient id="gigsona-tile" x1="4" y1="4" x2="36" y2="37" gradientUnits="userSpaceOnUse">
//                         <stop stopColor="#1d2920" />
//                         <stop offset="1" stopColor="#111714" />
//                     </linearGradient>
//                     <linearGradient id="gigsona-eye" x1="9" y1="14" x2="29" y2="28" gradientUnits="userSpaceOnUse">
//                         <stop stopColor="#a3e635" stopOpacity=".16" />
//                         <stop offset="1" stopColor="#2dd4bf" stopOpacity=".12" />
//                     </linearGradient>
//                 </defs>
//                 <rect x=".75" y=".75" width="38.5" height="38.5" rx="11.25" fill="url(#gigsona-tile)" stroke="#78916a" strokeOpacity=".4" strokeWidth="1.5" />
//                 <path
//                     d="M29.5 8.3A15 15 0 1 0 31 29"
//                     stroke="#5eead4"
//                     strokeOpacity=".85"
//                     strokeWidth="1.8"
//                     strokeLinecap="round"
//                 />
//                 <path
//                     d="M8.5 21c5.1-6.6 14.5-9.1 22.7-5.1-3.1 7.4-10.9 12.8-18 11.2C10.2 26.4 8.5 23.9 8.5 21Z"
//                     fill="url(#gigsona-eye)"
//                     stroke="#bef264"
//                     strokeWidth="1.8"
//                     strokeLinejoin="round"
//                 />
//                 <path
//                     d="M20 16.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
//                     fill="#2dd4bf"
//                 />
//                 <path
//                     d="M20 16.9 21.2 18.8 23.1 20 21.2 21.2 20 23.1 18.8 21.2 16.9 20 18.8 18.8 20 16.9Z"
//                     fill="#fef9c3"
//                 />
//                 <circle cx="30.5" cy="8.5" r="1.6" fill="#bef264" />
//                 <circle cx="31.2" cy="29.4" r="1.15" fill="#5eead4" />
//             </svg>

//             <span className="font-semibold tracking-tight text-ink">
//                 Gig<span className="text-accent">sona</span>
//             </span>
//         </Link>
//     );
// };








// import Link from "next/link";
// import { cn } from "@/lib/cn";

// // One spiral arm. The second arm is the same path rotated 180°,
// // so the two interleave into an eye that also reads as an orbit.
// const ARM =
//     "M213 -2C175 -85 105 -130 28 -130C-55 -130 -137 -90 -137 -25C-137 45 -77 80 -7 80C50 80 78 62 90 37";

// export const Logo = ({ compact = false }: { compact?: boolean }) => {
//     return (
//         <Link
//             href="/"
//             className={cn(
//                 "inline-flex items-center gap-1.5 select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
//                 compact ? "text-base" : "text-lg"
//             )}
//         >
//             <svg
//                 viewBox="0 0 40 40"
//                 fill="none"
//                 aria-hidden="true"
//                 className={cn("text-accent", compact ? "size-9" : "size-10")}
//             >
//                 {/* Tile */}
//                 <rect
//                     x=".5"
//                     y=".5"
//                     width="39"
//                     height="39"
//                     rx="11"
//                     fill="#0a120d"
//                     stroke="currentColor"
//                     strokeOpacity=".3"
//                 />

//                 {/* Spiral arms */}
//                 <g
//                     transform="translate(20 20) scale(.078)"
//                     stroke="currentColor"
//                     strokeWidth="26"
//                 >
//                     <path d={ARM} />
//                     <path d={ARM} transform="rotate(180)" />
//                 </g>

//                 {/* Pupil and glint */}
//                 <circle cx="20" cy="20" r="3" fill="currentColor" />
//                 <circle cx="20.9" cy="19" r=".8" fill="#e6ffec" />

//                 {/* Star */}
//                 <path
//                     d="M24.6 15.6 25 16.8 26.2 17.2 25 17.6 24.6 18.8 24.2 17.6 23 17.2 24.2 16.8Z"
//                     fill="#e6ffec"
//                 />
//             </svg>

//             <span className="font-semibold tracking-tight text-ink">
//                 Gig<span className="text-accent">sona</span>
//             </span>
//         </Link>
//     );
// };
import Link from "next/link";
import { cn } from "@/lib/cn";

export const Logo = ({ compact = false }: { compact?: boolean }) => {

    const bg = "bg-lime-900 ";

    // gray , mist, lime,

    return (
        <Link
            href="/"
            className={cn(
                "inline-flex items-center gap-1 select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                compact ? "text-base" : "text-lg"
            )}
        >
            {/* The Logo Container (Subtly reduced by 15%: h-16/w-16 -> h-14/w-14) */}
            <div className={`flex pl-2.5 items-center h-12 w-12 ${bg} overflow-hidden rounded shrink-0`} >

                {/* [o] Outer ring (34px -> 28.9px, 40px -> 34px) */}
                <div className="w-[28.9px] h-8.5 bg-[greenyellow] rounded-[100%] flex justify-center items-center shrink-0">
                    {/* [o] div Inner mask (26px -> 22.1px, 34px -> 28.9px, offsets scaled) */}
                    <div className={`relative left-[1.53px] top-[-0.34px] w-[22.1px] h-[28.9px] ${bg} rounded-[100%]`} />
                </div>

                {/* [gap] (10px -> 8.5px, 20px -> 17px, offsets and border radius scaled) */}
                <div className={`relative right-[8.5px] top-[-5.7px] w-[8.5px] h-4.25 ${bg} rounded-[11.9px_0_0_0] shrink-0`} />

                {/* [arrow a] (1.4px -> 1.19px, 10px -> 8.5px, offsets scaled) */}
                <div className="relative right-[9.5px] top-[7.3px] w-[1.5px] h-[8.5px] bg-[greenyellow] rotate-[-10deg] rounded-b-[1.7px]  shrink-0" />

                {/* [arrow b] (1.2px -> 1.02px, 10px -> 8.5px, offsets scaled) */}
                <div className="relative right-[16.15px] top-1 w-[1.5px] h-[8.5px] bg-[greenyellow] rotate-78 rounded-b-[1.7px] shrink-0" />

            </div>

            <span className="font-semibold text-3xl tracking-tight text-ink">
                ig<span className="text-accent">sona</span>
            </span>
        </Link>
    );
};
