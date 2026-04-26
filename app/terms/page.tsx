export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">

            <div className="max-w-3xl mx-auto px-6 pt-16">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">Terms of Service</h1>

                <div className="border-2 border-black bg-white p-6 md:p-12 space-y-8 font-medium text-black/80 text-base md:text-lg leading-relaxed shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using Leank, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">2. Description of Service</h2>
                        <p>
                            Leank provides a web-based, peer-to-peer (P2P) communication platform offering video calls, voice chat, file sharing, and an optional shared YouTube workspace. The service is provided &quot;AS IS&quot; and your use of the service is entirely at your own risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">3. User Conduct</h2>
                        <p>
                            You agree not to use the service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Because Leank is completely P2P, we do not monitor or moderate content shared between users. You are solely responsible for the content you transmit.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">4. Limitation of Liability</h2>
                        <p>
                            In no event shall Leank, its developers, or affiliates be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">5. Third-Party Media Services</h2>
                        <p>
                            The shared YouTube workspace relies on YouTube&apos;s embedded player and YouTube Data API services. Availability of search results, playback, embedding, autoplay behavior, and regional restrictions is controlled by YouTube/Google, not by Leank. By using that workspace, you agree to comply with any applicable YouTube and Google terms.
                        </p>
                    </section>

                    <div className="mt-12 pt-8 border-t-2 border-black/10 text-sm">
                        <p className="uppercase tracking-widest font-bold">Last Updated: April 26, 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
