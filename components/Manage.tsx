"use client"
import { students, groups } from '@/lib/schema';
import { InferSelectModel } from 'drizzle-orm';
import { Input } from './ui/Input';
import { useState } from 'react';
import { giveAura } from '@/actions/actions';

// Inferred types from your DB schema
type Student = InferSelectModel<typeof students>;
type Group = InferSelectModel<typeof groups>;

interface ManageProps {
    allStudents: Student[];
    allGroups: Group[];
}

export const Manage = ({ allStudents, allGroups }: ManageProps) => {

    const [nameInput, setNameInput] = useState('');
    const [auraInput, setAuraInput] = useState('');

    const handleAuraForm = () => {
        const matches = allStudents.filter(s =>
            s.displayName?.toLowerCase().includes(nameInput.toLowerCase())
        );
        if (matches.length === 0) return 'error'
        if (matches.length > 1) return 'not implemented yet'

        console.log(matches, matches[0].id.toString())
        giveAura({ id: matches[0].id, aura: Number(auraInput) });
    }

    return (
        <div className='grid grid-cols-3 gap-5 h-full grid-rows-[auto_1fr]'>
            <div className='col-span-3 flex gap-3'>
                {allGroups.map((el, i) => (
                    <div className='h-9 flex cursor-pointer justify-center items-center bg-neutral-900 rounded min-w-24' key={i}>{el.name}</div>
                ))}
            </div>
            <div className='bg-neutral-900 col-span-2 min-h-full rounded flex flex-col p-5'>
                {allStudents.map(el => (
                    <div key={el.id}>{el.displayName}</div>
                ))}
            </div>
            <div className='flex flex-col gap-5 h-full'>
                <div className='bg-neutral-900 h-32 rounded flex-2'></div>
                <div className='bg-neutral-900 p-4 py-7 rounded flex-1 flex flex-col gap-5'>
                    <div>
                        <h2 className='font-bold text-xl'>Aura Form</h2>
                        <p className='opacity-60 text-sm'>for any group</p>
                    </div>
                    <Input value={nameInput} onChange={e => { e.preventDefault(); setNameInput(e.target.value) }} placeholder='name' />
                    <Input value={auraInput} onChange={e => { e.preventDefault(); setAuraInput(e.target.value) }} placeholder='aura' />
                    <button onClick={handleAuraForm}>Submit</button>
                </div>
            </div>
        </div>
    )
}


// config/other modal
// rulebook
// screenshot
// commit button 
// 

// 1st modal input for name and aura and submit button , can and should be filtered by group
// 


// other functionality:
// button to take screenshot of the table
// some other stuff
// aura is commitet to db if: end button is selected, it crossed 12am, tab was closed without saving

// rulebook (interact to table):
// you can use arrow keys to move thru the table
// you can use shift on selected block(s) (tow, col) to give [selected aura] (configed in setting, default 20), same logic (maybe) for double shift
// one click to choose a block, opt click clicks to chooose many
// opt a to choose all
// opt b to reverse chosen non chosen ones
// click column to select every student in that column (category)
// typeing letter automaticcly selects those starting with it - (for example 'l' selects everyone starting with 'l', 'lash' only sleect' lasha lomidze; if there arent any other lash)
// esc to undo aura operation
// opt esc to undo select operation
// typing  number and then enter automaticcly gives aura to selected blocks
// double click for hard select (for accesing old aura and inputting new one) you cant have one double and one single selcted block, if one is chosen others dissaepar
// clicking the selected box unselects it
// a shortcut for commiting too




// ui one bento - input aura
// one bento - choose group 
