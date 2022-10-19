import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react'
import ChainButton from 'components/ChainButton';
import { callAllHandlers } from '@blockstack/ui/dist/ui/src/utils';

export interface Data {
  name?: string;
  symbol: string;
  active: boolean;
}

interface ComponentProps {
  data: Data[],
  datatype: any,
  open: boolean,
  onClose: () => void,
  isClicked: (e: any) => void
}
const BridgeModal: React.FC<ComponentProps> = ({ data, datatype, open, onClose, isClicked }) => {

  console.log("data: ", data);
  console.log("flag: ", datatype);
  console.log("open: ", open);

  const updateModal = (e: any) => {
      console.log("modal event: ", e);
      onClose();
      isClicked(e);
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 z-70 overflow-y-auto backdrop-blur-[20px]">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="flex flex-row items-center text-lg font-medium leading-6 px-3 py-5 text-gray-900"
                >
                  <button className='w-[30px] h-[30px] text-black/25 outline-none rounded-full mr-3' onClick={onClose}>
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 27.5C21.9036 27.5 27.5 21.9036 27.5 15C27.5 8.09644 21.9036 2.5 15 2.5C8.09644 2.5 2.5 8.09644 2.5 15C2.5 21.9036 8.09644 27.5 15 27.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8.75 15L13.75 20M8.75 15H21.25H8.75ZM8.75 15L13.75 10L8.75 15Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  </button>
                  { (datatype == 1) && "From Chain" }
                  { (datatype == 2) && "To Chain" }
                  { (datatype == 3) && "Select a token" }
                </Dialog.Title>
                <div className='px-0 py-5'>
                  {
                    data.map((item, index) => <ChainButton key={index} item={item} isClicked={(e)=> updateModal(e)}/>)
                  }
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default BridgeModal;