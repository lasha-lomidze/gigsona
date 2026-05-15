import { PageTitle } from "../components/ui/PageTitle";
import { db } from "../lib/db";
import { groups, users, students } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { IoIosArrowDown as OpenIcon } from "react-icons/io";


export default async function Home() {
  const allGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      createdAt: groups.createdAt,
      mentorName: users.name,
    })
    .from(groups)
    .innerJoin(users, eq(groups.mentorId, users.id))

  const allStudents = await db
    .select({
      id: students.id,
      displayName: students.displayName,
    })
    .from(students)


  const getGroupColor = (name: string) => {
    // A curated palette of "Neon" glows that look great on dark backgrounds
    const palette = [
      { bg: "bg-lime-500", shadow: "shadow-lime-500/50", text: "group-hover:text-lime-400" },
      { bg: "bg-cyan-500", shadow: "shadow-cyan-500/50", text: "group-hover:text-cyan-400" },
      { bg: "bg-fuchsia-500", shadow: "shadow-fuchsia-500/50", text: "group-hover:text-fuchsia-400" },
      { bg: "bg-orange-500", shadow: "shadow-orange-500/50", text: "group-hover:text-orange-400" },
      { bg: "bg-indigo-500", shadow: "shadow-indigo-500/50", text: "group-hover:text-indigo-400" },
    ];

    const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[index % palette.length];
  };

  return (
    <>
      <PageTitle title='Overview' description="Check out latest auras" />
      <div className="flex flex-col gap-5">
        {allGroups.map(group => (
          <div
            key={group.id}
            tabIndex={0}
            className="group relative flex px-10 items-center justify-between cursor-pointer bg-neutral-900/40 backdrop-blur-md p-5 rounded-2xl border border-neutral-800 hover:border-lime-500/40 hover:bg-lime-500/3 hover:shadow-[0_0_30px_-10px_rgba(163,230,53,0.2)] transition-all duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-lime-500/50 active:scale-[0.98]"
          >
            {/* The "Neon Hairline" top highlight */}
            <div className="absolute inset-x-12 -top-px h-px bg-linear-to-r from-transparent via-lime-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-100 group-hover:text-white transition-colors duration-300">
                {group.name}
              </h2>
              <p className="text-sm font-medium text-neutral-500 group-hover:text-lime-400/70 transition-colors duration-300">
                {group.mentorName}
              </p>
            </div>
            <OpenIcon
              size={25}
              className="text-neutral-600 mr-10 group-hover:text-lime-500 group-hover:scale-110 group-hover:-translate-x-2 transition-all duration-300 ease-in-out"
            />
            {/* Subtle bottom glow flare */}
            <div className="absolute inset-x-0 -bottom-px h-5 bg-lime-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
        ))}
      </div >
    </>
  );
}


// can add how many students to each group 
// when opened switch gradient to neon color on top like on study and dropdown backish thing and back glow like sign in


// {allGroups.map(group => (
//       <div
//         key={group.id}
//         className="group relative flex px-10 items-center justify-between
//          bg-neutral-900/50 backdrop-blur-sm
//          p-5 rounded-xl border border-neutral-800
//          hover:border-lime-500/40 hover:bg-lime-500/2
//          transition-all duration-300 ease-out cursor-pointer"
//       >
//         {/* Sublte Inner Glow Line */}
//         <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-lime-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

//         <div className="relative">
//           <h2 className="text-3xl font-bold tracking-tight group-hover:text-lime-400 transition-colors duration-300">
//             {group.name}
//           </h2>
//           <p className="text-sm font-medium text-neutral-500 group-hover:text-neutral-400 transition-colors">
//             {group.mentorName}
//           </p>
//         </div>
//         <OpenIcon
//           size={22}
//           className="text-neutral-600 group-hover:text-lime-500 group-hover:scale-110 group-hover:translate-x-1 transition-all duration-300"
//         />
//       </div >
//     ))}