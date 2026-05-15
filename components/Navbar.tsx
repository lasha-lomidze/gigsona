import { Logo } from './ui/Logo';
import Link from 'next/link';
import { PiDiamondsFourLight as OverviewIcon } from "react-icons/pi";
import { CiSettings as SettingsIcon } from "react-icons/ci";
import { CiLock as AdminIcon } from "react-icons/ci";
import { CiViewTable as ManageIcon } from "react-icons/ci";
import { IconType } from 'react-icons';


type NavLink = {
    href: string,
    label: string,
    icon: IconType,
    animation?: string
    id?: number
}

const links: NavLink[] = [
    { href: '/', label: 'overview', icon: OverviewIcon, id: 1 },
    { href: '/manage', label: 'manage', icon: ManageIcon, id: 2 },
    { href: '/admin', label: 'admin', icon: AdminIcon, id: 3 },
    { href: '/settings', label: 'settings', icon: SettingsIcon, id: 4 },
];

export const Navbar = () => {
    return (
        <div className='flex flex-col gap-10 p-4.5 h-screen bg-blackish w-63 border-neutral-900 border-r'>
            <Logo />
            <ul className='flex flex-col gap-2'>
                {links.map((el, i) => {
                    const Icon = el.icon as IconType
                    return (
                        <li data-power="none" data-delay={0.3 + i * 0.2} className=' fade text-lg opacity-80 hover:opacity-100 hover:bg-neutral-800/40 rounded-xl transition cursor-pointer capitalize' key={el.id || i + 1}>
                            <Link className='flex gap-2.5 items-center py-1.5 px-2.5' href={el.href}>
                                <Icon size={25} />
                                <div>{el.label}</div>
                            </Link>
                        </li>
                    )
                })}
            </ul>
            <div className='hidden md:block text-xs text-gray-600 mt-auto pt-4 border-t border-gray-700'>Local • NOT Secure</div>
        </div>
    )
}
