"use client";

import { Wrench } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[#FEF8EE] flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 bg-[#FFE3E8] border-4 border-black rounded-full flex items-center justify-center shadow-[8px_8px_0px_#000000]">
            <Wrench className="w-16 h-16 text-[#FF506F]" strokeWidth={2.5} />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#0D0D0D] mb-4">
          UnBlank
        </h1>
        
        <div className="bg-white border-4 border-black rounded-[24px] p-8 shadow-[6px_6px_0px_#000000] mb-8">
          <h2 className="text-3xl font-bold text-[#0D0D0D] mb-4">
            Site en construction
          </h2>
          <p className="text-xl text-[#636363] mb-2">
            Nous travaillons dur pour vous offrir la meilleure expérience.
          </p>
          <p className="text-lg text-[#636363]">
            Le site vitrine arrive bientôt !
          </p>
        </div>
        
        <a
          href="/app"
          className="inline-block h-14 px-8 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-white text-lg"
        >
          Accéder à l&apos;application
        </a>
      </div>
    </div>
  );
}
