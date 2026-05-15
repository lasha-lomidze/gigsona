
type PageTitleProps = {
    title: string,
    description: string
}

export const PageTitle = ({ title, description }: PageTitleProps) => {
    return (
        <div className='mb-9'>
            <h1 className="text-3xl font-bold transition">{title}</h1>
            <div className=" opacity-80">{description}</div>
        </div >

    )
}
