"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FEF8EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-4 border-black rounded-[24px] shadow-[8px_8px_0px_#000000] p-8 sm:p-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <Image
              src="/Mascottt.svg"
              alt="Mascotte UnBlank"
              width={160}
              height={160}
              className="w-32 h-32 sm:w-40 sm:h-40"
            />

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0D0D0D]">
                En construction
              </h1>
              <p className="text-lg text-[#636363]">
                Cette page est en cours de développement
              </p>
            </div>

            <Link href="/app">
              <button className="mt-4 px-8 py-4 bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-3 border-black rounded-xl shadow-[4px_4px_0px_#000000] text-black font-bold text-lg cursor-pointer">
                Accéder à l&apos;app
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
