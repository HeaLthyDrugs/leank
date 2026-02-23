import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">

            <div className="max-w-3xl mx-auto px-6 pt-16">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">Privacy Policy</h1>

                <div className="border-2 border-black bg-white p-6 md:p-12 space-y-8 font-medium text-black/80 text-base md:text-lg leading-relaxed shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">1. P2P Communication</h2>
                        <p>
                            Leank is a strictly Peer-to-Peer (P2P) communication tool. All audio, video, messages, and files transmitted through our service are routed directly between the connected peers whenever possible using WebRTC.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">2. No Data Storage</h2>
                        <p>
                            We do not utilize any backend servers to record, monitor, or store the contents of your communications. Once a session ends, the connection is severed, and no trace of the data remains on our infrastructure. We do not require accounts, logins, or personal identifiable information to use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">3. Local State</h2>
                        <p>
                            We may utilize standard browser mechanisms (like LocalStorage or SessionStorage) strictly to improve user experience locally on your device (e.g., remembering your preferred theme or camera settings). This information is never transmitted to us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">4. Third Parties</h2>
                        <p>
                            To establish P2P connections successfully across different networks, we utilize standard STUN servers. These servers only facilitate the initial connection handshake by discovering public IP addresses and do not relay your media or messages.
                        </p>
                    </section>

                    <div className="mt-12 pt-8 border-t-2 border-black/10 text-sm">
                        <p className="uppercase tracking-widest font-bold">Last Updated: February 2025</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
