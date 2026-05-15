
export const Logo = () => {
    return (
        <div data-x="100" data-delay="1" data-direction="right" className="fade text-lg inline-flex uppercase items-center gap-1 relative h-fit">
            <div className=" bg-lime-400 text-3xl shadow-[0_0_10px_#A3E635] rounded-[100px] w-10 flex justify-center items-center aspect-square font-bold text-black">G</div>
            igsona
            {/* <div className="h-1 rounded bg-lime-400 absolute w-full bottom-[0.32px] left-[13.9px]"></div> */}
            <div className="h-1 rounded bg-lime-400 absolute w-[calc(100%-100px)] bottom-[0.32px] left-[13.9px] shadow-[0_0_15px_#A3E635]"></div>
        </div>
    )
}
