
import { Input } from "../../components/ui/Input"
import { PageTitle } from "../../components/ui/PageTitle"
import { createAssistent, createGroup, createStudent } from "./admin"
import { VWrapper } from '../../components/ui/VWrapper';
import { RiEditBoxLine as EditIcon } from "react-icons/ri";
import { RiDeleteBin5Line as DeleteIcon } from "react-icons/ri";



const page = () => {

    const placeholderStudents = [
        // Group 34
        { name: 'giga kochalidze', group: 'group 34' },
        { name: 'lasha lomidze', group: 'group 34' },
        { name: 'giga kochalidze', group: 'group 34' }, // Duplicate
        { name: 'nino tskhadadze', group: 'group 34' },

        // Group 35
        { name: 'giorgi beridze', group: 'group 35' },
        { name: 'anna kapsadze', group: 'group 35' },
        // { name: 'lasha lomidze', group: 'group 35' }, // Same name, different group
        // { name: 'anna kapsadze', group: 'group 35' }, // Duplicate

        // // Group 36
        // { name: 'david kapianidze', group: 'group 36' },
        // { name: 'mariam shengelia', group: 'group 36' },
        // { name: 'giorgi beridze', group: 'group 36' }  // Same name, different group
    ];


    return (
        <div>
            <PageTitle title='Admin' description='Control and see statistics' />
            <div className="grid grid-cols-2 gap-4 pb-15">

                <div className="flex flex-col gap-6">
                    <VWrapper enableDefaultAnimations={false} className="flex w-100 gap-10 items-center rounded-2xl py-2.5 px-2 border-white/5 bg-white/2">
                        <div className="text-[#c0ff00] font-bold tracking-wide drop-shadow-[0_0_8px_rgba(192,255,0,0.5)] cursor-pointer transition-colors">Students</div>
                        <div className="opacity-40 hover:opacity-80 transition-opacity cursor-pointer">Assistants</div>
                        <div className="opacity-40 hover:opacity-80 transition-opacity cursor-pointer">Groups</div>
                    </VWrapper>
                    <VWrapper className="h-140 rounded-3xl p-8 flex flex-col justify-start items-start text-left bg-linear-to-b from-white/4 to-transparent border-white/10 shadow-2xl">
                        <form action={createStudent} className="flex flex-col gap-6 w-full text-left">
                            <h2 className="text-sm font-bold tracking-[0.15em] text-[#c0ff00] uppercase mb-2 drop-shadow-[0_0_10px_rgba(192,255,0,0.2)]">Add Student</h2>
                            <Input name="name" label="name" placeholder='Gigson koch...' />
                            <Input name="groupName" label="group" placeholder="Group 34..." />

                            <VWrapper variant="dark" enableDefaultAnimations={true} as="button" type="submit" className="w-full mt-4 font-bold tracking-wide rounded-xl py-3">
                                Submit Student Record
                            </VWrapper>
                        </form>
                    </VWrapper>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4 justify-end h-13">
                        <VWrapper className="w-17 rounded-xl bg-neutral-900">search</VWrapper>
                        <VWrapper className="w-17 rounded-xl bg-neutral-900">filter</VWrapper>
                    </div>
                    <div className="h-140  rounded-3xl p-4 flex flex-col gap-4">
                        {placeholderStudents.map((student, i) => (

                            // <VWrapper key={i} className="w-full rounded-2xl border-2 flex shadow-xs text-white">
                            //     <div className="flex text-4xl gap-4">
                            //         <DeleteIcon className="bg-red-400  rounded-full p-2 cursor-pointer" />
                            //         <EditIcon className="bg-blue-400 rounded-full p-2 cursor-pointer" />
                            //     </div>
                            //     <div className="ml-auto">
                            //         <div className="font-bold text-xl ml-auto capitalize">{student.name}</div>
                            //         <div className="font-bold opacity-80 text-right">{student.group}</div>
                            //     </div>
                            // </VWrapper>

                            // <VWrapper key={i} className="w-full rounded-2xl p-0 border-2 flex shadow-xs text-white">
                            //     <div className="flex text-2xl gap-4 ">
                            //         <div className="px-5 border-r">
                            //             <DeleteIcon className="rounded-full cursor-pointer " />
                            //         </div>
                            //         <EditIcon className="rounded-full cursor-pointer" />
                            //     </div>
                            //     <div className="ml-auto m-3">
                            //         <div className="font-bold text-xl ml-auto capitalize">{student.name}</div>
                            //         <div className="font-bold opacity-80 text-right">{student.group}</div>
                            //     </div>
                            // </VWrapper>

                            <div key={i} className="w-full bg-neutral-900 rounded-xl p-4  transition-all duration-300 flex items-center justify-between shadow-sm group">
                                {/* Interactive Actions Area */}
                                <div className="flex text-lg gap-2">
                                    <button type="button" className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/20 hover:border-red-500/40 transition-all">
                                        <DeleteIcon />
                                    </button>
                                    <button type="button" className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all">
                                        <EditIcon />
                                    </button>
                                </div>

                                {/* Structural Student Information */}
                                <div className="text-right">
                                    <div className="font-semibold text-base text-white capitalize  transition-colors">{student.name}</div>
                                    <div className="text-xs font-bold opacity-80 uppercase tracking-wider text-white mt-0.5">{student.group}</div>
                                </div>
                            </div>
                        ))}


                    </div>
                </div>
                <div className="col-span-2 w-70 h-20 rounded-xl bg-neutral-900"></div>
                <div className="col-span-2 w-full h-90 rounded-3xl bg-neutral-900"></div>
                <div className="w-full h-90 rounded-3xl bg-neutral-900"></div>
                <div className="w-full h-90 rounded-3xl bg-lime-500"></div>
            </div>

            {/* <form action={createAssistent} className="flex flex-col gap-6">
                <h2>ADD ASSISTENT</h2>
                <Input name="name" label="name" placeholder='Gigson koch...' />
                <Input name="account" label="account" placeholder="Gigson@gmail.com..." />
                <Input name="password" label="password" placeholder="password123..." />
                <button type="submit">Submit</button>
            </form>
            <form action={createGroup} className="flex flex-col gap-6">
                <h2>ADD GROUP</h2>
                <Input name="name" label="name" placeholder='Group 34...' />
                <Input name="mentor" label="mentor" placeholder="Lasha Lomidze..." />
                <button type="submit">Submit</button>
            </form>
            <form action={createStudent} className="flex flex-col gap-6">
                <h2>ADD STUDENT</h2>
                <Input name="name" label="name" placeholder='Gigson koch...' />
                <Input name="groupName" label="group" placeholder="Group 34..." />
                <button type="submit">Submit</button>
            </form> */}
        </div>
    )
}

export default page




// import { Input } from "../../components/ui/Input"
// import { PageTitle } from "../../components/ui/PageTitle"
// import { createAssistent, createGroup, createStudent } from "./admin"
// import { VWrapper } from '../../components/ui/VWrapper';
// import { RiEditBoxLine as EditIcon } from "react-icons/ri";
// import { RiDeleteBin5Line as DeleteIcon } from "react-icons/ri";

// const page = () => {
//     const placeholderStudents = [
//         { name: 'giga kochalidze', group: 'group 34' },
//         { name: 'lasha lomidze', group: 'group 34' },
//         { name: 'giga kochalidze', group: 'group 34' },
//     ];

//     return (
//         <div className="min-h-screen text-slate-100 p-6 max-w-7xl mx-auto">
//             <PageTitle title='Admin' description='Control and see statistics' />

//             <div className="grid grid-cols-2 gap-6 pb-15">

//                 {/* LEFT COLUMN: Controls & Input Forms */}
//                 <div className="flex flex-col gap-6">
//                     {/* Navigation Tabs - Switched to clean glassmorphic selection wrapper */}
//                     <VWrapper enableDefaultAnimations={false} className="flex justify-around items-center rounded-2xl py-3 px-2 border-white/5 bg-white/[0.02]">
//                         <div className="text-[#c0ff00] font-bold tracking-wide drop-shadow-[0_0_8px_rgba(192,255,0,0.5)] cursor-pointer transition-colors">Students</div>
//                         <div className="opacity-40 hover:opacity-80 transition-opacity cursor-pointer">Assistants</div>
//                         <div className="opacity-40 hover:opacity-80 transition-opacity cursor-pointer">Groups</div>
//                     </VWrapper>

//                     {/* Add Student Glassmorphic Card */}
//                     <VWrapper  className="h-[420px] rounded-3xl p-8 flex flex-col justify-start items-start text-left bg-gradient-to-b from-white/[0.04] to-transparent border-white/10 shadow-2xl">
//                         <form action={createStudent} className="flex flex-col gap-6 w-full text-left">
//                             <h2 className="text-sm font-bold tracking-[0.15em] text-[#c0ff00] uppercase mb-2 drop-shadow-[0_0_10px_rgba(192,255,0,0.2)]">Add Student</h2>
//                             <Input name="name" label="name" placeholder='Gigson koch...' />
//                             <Input name="groupName" label="group" placeholder="Group 34..." />

//                             {/* Converted submit button to your neon variant framework */}
//                             <VWrapper variant="neon" enableDefaultAnimations={true} as="button" type="submit" className="w-full mt-4 font-bold tracking-wide rounded-xl py-3">
//                                 Submit Student Record
//                             </VWrapper>
//                         </form>
//                     </VWrapper>
//                 </div>

//                 {/* RIGHT COLUMN: Search and Streaming Data Feed */}
//                 <div className="flex flex-col gap-6">
//                     {/* Utility Controls */}
//                     <div className="flex gap-3 justify-end">
//                         <VWrapper variant="dark" enableDefaultAnimations={true} className="px-5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase text-slate-400 border-white/5 hover:text-white">Search</VWrapper>
//                         <VWrapper variant="dark" enableDefaultAnimations={true} className="px-5 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase text-slate-400 border-white/5 hover:text-white">Filter</VWrapper>
//                     </div>

//                     {/* FIX: Student Data Feed Container. Replaced harsh bright lime with elegant cyber-glass bounding box */}
//                     <div className="h-[420px] overflow-y-auto bg-gradient-to-b from-[#091202] to-[#030601] border border-[rgba(192,255,0,0.18)] rounded-3xl p-5 flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(192,255,0,0.05)] custom-scrollbar">
//                         {placeholderStudents.map((student, i) => (
//                             <VWrapper key={i} variant="dark" className="w-full rounded-xl p-4 border-white/5 bg-white/[0.01] hover:border-[rgba(192,255,0,0.3)] transition-all duration-300 flex items-center justify-between shadow-sm group">
//                                 {/* Interactive Actions Area */}
//                                 <div className="flex text-lg gap-2">
//                                     <button type="button" className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/20 hover:border-red-500/40 transition-all">
//                                         <DeleteIcon />
//                                     </button>
//                                     <button type="button" className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all">
//                                         <EditIcon />
//                                     </button>
//                                 </div>

//                                 {/* Structural Student Information */}
//                                 <div className="text-right">
//                                     <div className="font-semibold text-base text-white capitalize group-hover:text-[#c0ff00] transition-colors">{student.name}</div>
//                                     <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">{student.group}</div>
//                                 </div>
//                             </VWrapper>
//                         ))}
//                     </div>
//                 </div>

//                 {/* BOTTOM LAYOUT GRID BLOCKS: Keeping them coherent with the dark glass dashboard layout */}
//                 <div className="col-span-2 h-20 rounded-xl border border-white/5 bg-white/[0.02] shadow-sm"></div>
//                 <div className="col-span-2 w-full h-90 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shadow-lg"></div>
//                 <div className="w-full h-90 rounded-3xl border border-white/5 bg-white/[0.01]"></div>

//                 {/* Changed last block from solid blinding lime to a balanced neon highlight container */}
//                 <div className="w-full h-90 rounded-3xl border border-[rgba(192,255,0,0.2)] bg-gradient-to-br from-[#0c1a03] to-black p-6 shadow-md">
//                     <div className="text-[#c0ff00] text-xs font-black tracking-widest uppercase">System Activity Metrics</div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default page;



// // add remove see group, add remove see assistent, add remove see students ? see statistics, ? control auras