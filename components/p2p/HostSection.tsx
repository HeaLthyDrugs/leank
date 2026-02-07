import React, { useState } from 'react'
import { useRoomContext } from '@/contexts/RoomContext';
import { ToggleLeft, ToggleRight, MicOff, Check, Copy } from 'lucide-react';

interface HostPanelProps {
    onClose?: () => void;
    ishosttag: boolean;
}
const HostSection = ({ onClose, ishosttag }: HostPanelProps) => {
    // Use shared room context
    const {
        room,
        roomId,
        peers,
        isConnected,
        isReconnecting,
        connectionAttempts,
        updatePeerStream,
        joinRoom,
        leaveRoom,
        forceReconnect
    } = useRoomContext();
    const [islocked, setIslocked] = useState(false);


    if (ishosttag) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-lg uppercase tracking-wide text-black">Host Controls</h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="md:hidden px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
                <div className="flex flex-col h-full bg-gray-200">
                    <div className="p-4 my-1 border-b-2 border-black bg-gray-50 flex items-center justify-between">
                        Lock Room <span className='text-cyan-400'>({islocked ? "unlocked" : "locked"})</span>
                        <button
                            onClick={() => { setIslocked(!islocked) }}
                            className="">
                            {islocked ? <ToggleLeft size={30} /> : <ToggleRight size={30} />}
                        </button>
                    </div>
                    <div className="p-4 my-1 border-b-2 border-black bg-gray-50 flex items-center justify-between">
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Mute All
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                            End Session
                        </button>
                    </div>
                    <div className="p-4 my-1 border-b-2 border-black bg-gray-50 flex flex-col gap-2 items-center justify-between">
                        {!peers.size && (<div>No Peers</div>)}
                        {Array.from(peers).map((p, i) => {
                            return (
                                <div key={i} className='flex justify-between items-center w-full border' >
                                    <span className='p-1 inline-block max-w-3/5 overflow-clip '>{p[1].id.slice(0, 6)}</span>
                                    <button
                                        className=" bg-amber-400 hover:bg-amber-300 font-bold py-1 px-2 ">
                                        Remove
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                </div>
            </div>
        )
    } else {
        return <div></div>;
    }
}

export default HostSection