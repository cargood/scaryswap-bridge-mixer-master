import React from 'react'
import './index.scss';

function Bridge() {
    return (
            <div className='brg'>
                <div className='brg-card'>
                    <div className='brg-ch-brand'>
                        <img className='brg-ch-logo' src='/assets/logo1.webp' alt='logo'/>
                        <p className='brg-ch-logo-text'>Bitcoin EVM Bridge</p>
                    </div>
                    <div className='brg-ch'>
                        <h1 className='brg-ch-title'>Bridge to and from Bitcoin EVM</h1>
                    </div>
                    <div className='brg-cm'>
                        <div className='brg-cm-card'>
                            <p className='cm-title'>From Chain</p>
                            <span className='cm-logo'>
                                <img className='cm-logo-img' src='/assets/logo1.webp' alt='coin'/>
                            </span>
                            <button className="cm-btn">
                                <span className="cm-btn-container">
                                    <span className='cm-btn-logo'>
                                        <img className="cm-btn-logo-img" src='/assets/logo1.webp' alt='logo'/>
                                    </span>
                                    <span className='cm-btn-text'>
                                        Bitcoin EVM
                                    </span>
                                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0.75L6 5.25L10.5 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                                </span>
                            </button>
                        </div>
                        <button className="brg-cm-btn">
                            <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.83333 2.5L2.5 5.83333L5.83333 9.16667M14.1667 17.5L17.5 14.1667L14.1667 10.8333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"></path><path d="M2.5 14.1667L17.5 14.1667M17.5 5.83337L2.5 5.83337L17.5 5.83337Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </button>
                        <div className='brg-cm-card'>
                            <p className='cm-title'>To Chain</p>
                            <span className='cm-logo'>
                                <img className='cm-logo-img' src='/assets/logo-eth.png' alt='coin'/>
                            </span>
                            <button className="cm-btn">
                                <span className="cm-btn-container">
                                    <span className='cm-btn-logo'>
                                        <img className="cm-btn-logo-img" src='/assets/logo-eth.png' alt='logo'/>
                                    </span>
                                    <span className='cm-btn-text'>
                                        Ethereum
                                    </span>
                                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0.75L6 5.25L10.5 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"></path></svg>
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className='brg-ct'>
                        <div className='brg-ct-tb'>
                            <span className='brg-ct-title'>Token to Bridge</span>
                            <div className='brg-ct-set'>
                                <button className="brg-ct-btn">
                                    <span className='brg-ctb-container'>
                                        <span className='brg-ctb-logo'><img className='brg-ctb-img' src='/assets/logo1.webp' alt='bit'/></span>
                                        <span className='brg-ctb-txt'>BTC</span>
                                        <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0.75L6 5.25L10.5 0.75" stroke="white" strokeWidth="1.5" strokeLinecap="round"></path></svg>
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
                    <button className='brg-cb'>Connect Wallet</button>
                </div>
                <div className='brg-spt'>
                    <p className='brg-spt-content'>1. Bridging could take from a few minutes to a few hours.<br/>2. There is a 0.1% fee for bridging to Tomb Chain.<br/>3. For any issues, contact <a href="https://t.me/Lif3_Official" target="_blank" rel="noreferrer">Support</a></p>
                </div>
            </div>
    )
}

export default Bridge;