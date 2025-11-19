'use client';

import { Search, Plus, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import AddLinkModal from './AddLinkModal';

export default function Header() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);

  return (
    <>
      <AddLinkModal
        isOpen={isAddLinkModalOpen}
        onClose={() => setIsAddLinkModalOpen(false)}
      />
    <header className="w-full h-auto sm:h-auto md:h-auto lg:h-auto xl:h-[232px] bg-white border-b-[3px] border-black">
      <div className="w-full h-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 lg:gap-6 xl:gap-8 mb-3 md:mb-4 lg:mb-6 xl:mb-8">
          <div className="w-full md:flex-1 lg:max-w-[700px] xl:max-w-[903px] relative">
            <div className="absolute left-3 sm:left-4 md:left-5 lg:left-6 xl:left-8 top-1/2 -translate-y-1/2 text-[#636363] w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8">
              <Search className="w-full h-full" strokeWidth={2} />
            </div>
            <input
              type="text"
              placeholder="Rechercher un dossier, une image, un lien"
              className="w-full h-11 sm:h-12 md:h-13 lg:h-16 xl:h-20 pl-11 sm:pl-12 md:pl-13 lg:pl-16 xl:pl-[74px] pr-3 sm:pr-4 md:pr-5 lg:pr-6 xl:pr-8 rounded-xl md:rounded-[16px] lg:rounded-[18px] xl:rounded-[20px] border-2 border-black bg-white text-[#636363] placeholder-[#636363] focus:outline-none text-sm sm:text-base md:text-base lg:text-base xl:text-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] xl:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-ellipsis"
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 md:shrink-0">
            <button className="h-9 sm:h-10 md:h-11 lg:h-12 xl:h-[54px] px-3 sm:px-4 md:px-5 lg:px-6 xl:px-[27px] rounded-lg md:rounded-xl border-2 border-black bg-[#FEF8EE] hover:bg-[#FEF5E6] active:translate-y-[2px] active:shadow-none transition-all font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base whitespace-nowrap">
              <span className="hidden sm:inline">Installer l&apos;extension</span>
              <span className="sm:hidden">Extension</span>
            </button>

            <div className="flex items-center gap-1 xl:gap-1.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 xl:w-[62px] xl:h-[62px] rounded-full border-2 md:border-[3px] border-black overflow-hidden bg-gray-200 shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400" />
              </div>
              <button className="hover:opacity-70 transition-opacity">
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-black" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-3 md:gap-3 lg:gap-3 xl:gap-4 pt-3 sm:pt-3 md:pt-4 lg:pt-6 xl:pt-8">
          <button className="h-9 sm:h-10 md:h-10 lg:h-11 xl:h-12 px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 rounded-lg md:rounded-xl bg-[#FF5070] hover:bg-[#FF3D5F] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 xl:gap-2.5 whitespace-nowrap">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black shrink-0" strokeWidth={2} />
            <span className="text-black font-medium text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base">Créer</span>
          </button>

          <button
            onClick={() => setIsAddLinkModalOpen(true)}
            className="h-9 sm:h-10 md:h-10 lg:h-11 xl:h-12 px-3 sm:px-4 md:px-5 lg:px-5 xl:px-6 rounded-lg md:rounded-xl bg-[#FEF8EE] hover:bg-[#FEF5E6] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 xl:gap-2.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black shrink-0" strokeWidth={2} />
            <span className="text-black font-medium text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base">Ajouter un lien</span>
          </button>
        </div>
      </div>
    </header>
    </>
  );
}
