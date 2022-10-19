import React, {useEffect, useState} from 'react';

interface Data{
    name?: string,
    symbol: string,
    active: boolean
}

interface ComponentProps {
    item: Data,
    isClicked: (item: Data) => void
}



const ChainButton: React.FC<ComponentProps> =({item, isClicked}) => {
    const [isHover, setIsHover] = useState<Boolean>(false);
    
    const activeStyle = {
        width: "100%",
        height: "46px",
        outline: "none",
        backgroundColor: isHover ? "#afafaf" : (item.active ? "#f3f4f6" : "white")
    }
    
    const hoverOn = () => {
        setIsHover(true);
    }

    const hoverOff = () => {
        setIsHover(false);
    }


    return (
        <button style={activeStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff} onClick={() => isClicked(item)}>
            <span className='w-full px-3 py-2 flex justify-between items-center'>
                <span className='flex flex-row justify-between items-center'>
                    <span className='w-[30px] h-[30px] mr-2 rounded-full bg-white flex flex-row justify-center items-center'><img src={`/assets/${item.symbol}.svg`} style={{borderRadius: '50%'}} width='24px' height='24px'/></span>
                    { item.name && (<span>{item.name}</span>)}
                    { !item.name && (<span>{item.symbol}</span>)}
                </span>
                <span>
                    {item.active && (<img className='text-white' width='20px' height='20px' src='/assets/tick.svg' />)}
                </span>
            </span>
        </button>
    );
}

export default ChainButton;
