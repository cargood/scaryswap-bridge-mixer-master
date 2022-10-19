import React, { useState } from 'react'
import './index.scss';

import { useWalletModalToggle } from 'state/application/hooks';
import BridgeModal, { Data } from 'components/BridgeModal';
import { useActiveWeb3React } from 'hooks'

function Bridge() {

    const web3Obj = useActiveWeb3React();
    console.log("web3: ", web3Obj);
    const toggleWalletModal = useWalletModalToggle();
    
    const fromArray: Data[] = [
        {
            "name": "Bitcoin EVM",
            "symbol": "BTC",
            "active": true
        }
    ];

    const toArray: Data[] = [
        {
            name: "Ethereum",
            symbol: "ETH",
            active: true
        },
        {
            name: "Fantom",
            symbol: 'FTM',
            active: false
        }
    ];

    const listArray: Data[] = [
        {
            symbol: "BTC",
            active: true
        },
        {
            symbol: "USDC",
            active: false
        },
        {
            symbol: "PUMPKIN",
            active: false
        }
    ];

    const [fromChain, setFromChain] = useState(fromArray);
    const [toChain, setToChain] = useState(toArray);
    const [tokenList, setTokenList] = useState(listArray);
    
    const [dataModal, setDataModal] = useState(fromArray);
    const [flagModal, setFlagModal] = useState<Number>(1);

    const [fromActiveNum, setFromActiveNum] = useState(0);
    const [toActiveNum, setToActiveNum] = useState(0);
    const [tokenActiveNum, setTokenActiveNum] = useState(0);

    const [isOpen, setIsOpen] = useState(false);

    const isSameNet = (obj1: Data, obj2: Data) => {
        if(obj1.name !== obj2.name) return false;
        if(obj1.symbol !== obj2.symbol) return false;
        return true;
    }

    const isSameToken = (obj1: Data, obj2: Data) => {
        if(obj1.symbol !== obj2.symbol) return false;
        return true;
    }

    const exChain = () => {
        const temp = fromChain;
        const tempNum = fromActiveNum;
        
        setFromChain(toChain);
        setToChain(temp);

        setFromActiveNum(toActiveNum);
        setToActiveNum(tempNum);
    }

    const openFromChain = () => {
        setDataModal(fromChain); 
        setIsOpen(true);
        setFlagModal(1);
    }

    const openToChain = () => {
        setDataModal(toChain);
        setIsOpen(true);
        setFlagModal(2);
    }

    const openTokenList = () => {
        setDataModal(tokenList);
        setIsOpen(true);
        setFlagModal(3);
    }

    const updateBridgeState = (e: any) => {
        console.log("Main bridge page: ", e);
        if(flagModal == 1) {
            const temp = fromChain;
            temp[fromActiveNum].active = false;
            for(let i = 0; i < temp.length; i ++) {
                if(isSameNet(temp[i], e)) 
                {
                    setFromActiveNum(i);
                    temp[i].active = true;
                }
            }
            setFromChain(temp);
            setDataModal(temp);
        }       

        else if(flagModal == 2) {
            const temp = toChain;
            temp[toActiveNum].active = false;
            for(let i = 0; i < temp.length; i ++) {
                if(isSameNet(temp[i], e)) 
                {
                    setToActiveNum(i);
                    temp[i].active = true;
                }
            }
            setToChain(temp);
            setDataModal(temp);
        }

        else if (flagModal == 3) {
            const temp = tokenList;
            temp[tokenActiveNum].active = false;
            for(let i = 0; i < temp.length; i ++) {
                if(isSameToken(temp[i], e)) 
                {
                    setTokenActiveNum(i);
                    temp[i].active = true;
                }
            }
            setTokenList(temp);
            setDataModal(temp);
        }
        
    }

    return (
        <>
            <BridgeModal data={dataModal} datatype={flagModal} open={isOpen} onClose={() => setIsOpen(false)} isClicked={(e) => updateBridgeState(e)}  />
            <div className='brg'>
                <div className='brg-card'>
                    <div className='brg-ch-brand'>
                        <img className='brg-ch-logo' src='/assets/logo1.webp' alt='logo' />
                        <p className='brg-ch-logo-text'>Bitcoin EVM Bridge</p>
                    </div>
                    <div className='brg-ch'>
                        <h1 className='brg-ch-title'>Bridge to and from Bitcoin EVM</h1>
                    </div>
                    <div className='brg-cm'>
                        <div className='brg-cm-card'>
                            <p className='cm-title'>From Chain</p>
                            <span className='cm-logo'>
                                <img className='cm-logo-img' src={`/assets/${fromChain[fromActiveNum].symbol}.svg`} alt='coin' />
                            </span>
                            <button onClick={openFromChain} className="cm-btn">
                                <span className="cm-btn-container">
                                    <span className='cm-btn-logo'>
                                        <img className="cm-btn-logo-img" src={`/assets/${fromChain[fromActiveNum].symbol}.svg`} alt='logo' />
                                    </span>
                                    <span className='cm-btn-text'>
                                        {fromChain[fromActiveNum].name}
                                    </span>
                                    <svg className="drop-theme" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0.75L6 5.25L10.5 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                                </span>
                            </button>
                        </div>
                        <button className="brg-cm-btn" onClick={exChain}>
                            <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.83333 2.5L2.5 5.83333L5.83333 9.16667M14.1667 17.5L17.5 14.1667L14.1667 10.8333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"></path><path d="M2.5 14.1667L17.5 14.1667M17.5 5.83337L2.5 5.83337L17.5 5.83337Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </button>
                        <div className='brg-cm-card'>
                            <p className='cm-title'>To Chain</p>
                            <span className='cm-logo'>
                                <img className='cm-logo-img' src={`/assets/${toChain[toActiveNum].symbol}.svg`} alt='coin' />
                            </span>
                            <button onClick={openToChain} className="cm-btn">
                                <span className="cm-btn-container">
                                    <span className='cm-btn-logo'>
                                        <img className="cm-btn-logo-img" src={`/assets/${toChain[toActiveNum].symbol}.svg`} alt='logo' />
                                    </span>
                                    <span className='cm-btn-text'>
                                        {toChain[toActiveNum].name}
                                    </span>
                                    <svg className="drop-theme" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0.75L6 5.25L10.5 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className='brg-ct'>
                        <div className='brg-ct-tb'>
                            <span className='brg-ct-title'>Token to Bridge</span>
                            <div className='brg-ct-set'>
                                <button className="brg-ct-btn" onClick={openTokenList}>
                                    <span className='brg-ctb-container'>
                                        <span className='brg-ctb-logo'><img className='brg-ctb-img' src={`/assets/${tokenList[tokenActiveNum].symbol}.svg`} alt='bit' /></span>
                                        <span className='brg-ctb-txt'>{tokenList[tokenActiveNum].symbol}</span>
                                        <svg className="drop-theme" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0.75L6 5.25L10.5 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                                    </span>
                                </button>
                                <span className='brg-ct-val'>
                                    <input className='brg-ct-inp' placeholder='0.0'></input>
                                    <button className='brg-ct-max'>MAX</button>
                                </span>
                            </div>
                        </div>
                        <div className='brg-ct-bl'>
                            <div className='brg-ct-bal'>
                                <span className='ct-bal-type'>Balance on Bitcoin EVM</span>
                                <span className='ct-bal-val'>--</span>
                            </div>
                            <div className='brg-ct-bal'>
                                <span className='ct-bal-type'>Balance on Ethereum</span>
                                <span className='ct-bal-val'>--</span>
                            </div>
                        </div>
                    </div>
                    
                    <button className='brg-cb' onClick={toggleWalletModal}>
                        Connect Wallet
                    </button>
                </div>
                <div className='brg-spt'>
                    <p className='brg-spt-content'>1. Bridging could take from a few minutes to a few hours.<br />2. There is a 0.1% fee for bridging to Tomb Chain.<br />3. For any issues, contact <a href="https://discord.gg/pumpkins" target="_blank" rel="noreferrer">Support</a></p>
                </div>
            </div>
        </>
    )
}

export default Bridge;