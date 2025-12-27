'use client';

import { X, Search, Loader2, XCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useInfiniteSearch, useUserTags, useRecentLinks } from '@/hooks/useSearch';
import { useDebounce } from '@/utils/useDebounce';
import SearchResultItem from './SearchResultItem';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch search results (only when there's a query or tags)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteSearch({
    query: debouncedQuery,
    tagNames: selectedTags.length > 0 ? selectedTags : undefined,
  });

  // Fetch recent links for initial state
  const { data: recentLinks = [], isLoading: isLoadingRecent } = useRecentLinks(5);

  // Fetch available tags for autocomplete
  const { data: allTags = [] } = useUserTags();

  // Filter tags for autocomplete
  const filteredTags = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(tagInputValue.toLowerCase()) &&
      !selectedTags.includes(tag.name)
  );

  // Auto-focus input when modal opens & block body scroll
  useEffect(() => {
    if (isOpen) {
      // Focus input
      if (inputRef.current) {
        inputRef.current.focus();
      }

      // Block body scroll - save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore body scroll and position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Auto-focus tag input when dropdown opens
  useEffect(() => {
    if (isTagDropdownOpen && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isTagDropdownOpen]);

  // Handle Escape key to close dropdown/modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTagDropdownOpen) {
          setIsTagDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isTagDropdownOpen, onClose]);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is outside both the dropdown and the button
      const isClickOutsideDropdown = tagDropdownRef.current && !tagDropdownRef.current.contains(target);
      const isClickOutsideButton = tagButtonRef.current && !tagButtonRef.current.contains(target);

      if (isTagDropdownOpen && isClickOutsideDropdown && isClickOutsideButton) {
        setIsTagDropdownOpen(false);
      }
    };

    if (isOpen && isTagDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isTagDropdownOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedTags([]);
      setTagInputValue('');
      setIsTagDropdownOpen(false);
    }
  }, [isOpen]);

  // Infinite scroll handler
  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isOpen) return null;

  const addTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
    setTagInputValue('');
    // Keep dropdown open after adding a tag
  };

  const removeTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Get all results from pages
  const allResults = data?.pages.flatMap((page) => page.links) || [];
  const hasResults = allResults.length > 0;
  const showEmptyState = !isLoading && !hasResults && (query.trim().length >= 2 || selectedTags.length > 0);
  const showInitialState = !isLoading && query.trim().length < 2 && selectedTags.length === 0;

  const handleOverlayClick = () => {
    // If tag dropdown is open, close it first instead of closing the modal
    if (isTagDropdownOpen) {
      setIsTagDropdownOpen(false);
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={handleOverlayClick}
        data-overlay="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[800px] h-[600px] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Search Input */}
          <div className="p-6 border-b-2 border-black">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="hover:text-[#FF506F] transition-colors cursor-pointer"
              >
                <X className="w-7 h-7" strokeWidth={2} />
              </button>
            </div>

            {/* Spacer */}
            <div className="h-6" />

            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636363]">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" strokeWidth={2} />
                ) : (
                  <Search className="w-6 h-6" strokeWidth={2} />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher un lien, dossier ou tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-12 rounded-xl border-2 border-black bg-white text-black placeholder-[#636363] focus:outline-none focus:border-black text-base font-[Heebo] font-normal"
              />
              {query && (
                <button
                  onClick={clearQuery}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636363] hover:text-black transition-colors"
                >
                  <XCircle className="w-6 h-6" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Spacer */}
            <div className="h-6" />

            {/* Tag Filter Section */}
            <div className="relative w-1/2">
              {/* Tag Button */}
              <button
                ref={tagButtonRef}
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-white hover:bg-[#FFE3E8] focus:outline-none transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-black font-[Heebo]">
                  Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </span>
                <ChevronDown className={`w-4 h-4 text-black transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
              </button>

              {/* Combined Dropdown: Search Input + Available Tags + Selected Tags */}
              {isTagDropdownOpen && (
                <div
                  ref={tagDropdownRef}
                  className="absolute top-full left-0 right-0 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] z-10 max-h-[300px] flex flex-col overflow-hidden"
                  style={{ marginTop: '0.75rem' }}
                >
                  {/* Search Input inside dropdown */}
                  <div className="p-3 border-b-2 border-black">
                    <input
                      ref={tagInputRef}
                      type="text"
                      placeholder="Rechercher un tag..."
                      value={tagInputValue}
                      onChange={(e) => setTagInputValue(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border-2 border-black bg-white text-black placeholder-[#636363] focus:outline-none text-sm font-[Heebo]"
                    />
                  </div>

                  <div className="overflow-y-auto">
                    {/* Selected Tags Section */}
                    {selectedTags.length > 0 && (
                      <div className="border-b-2 border-black p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-[#636363] font-[Heebo]">
                            Tags sélectionnés
                          </span>
                          {selectedTags.length > 1 && (
                            <button
                              onClick={clearAllTags}
                              className="text-xs text-[#636363] hover:text-black font-medium font-[Heebo] underline"
                            >
                              Tout effacer
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedTags.map((tagName) => (
                            <div
                              key={tagName}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF506F] rounded-lg border-2 border-black"
                            >
                              <span className="text-sm font-medium text-black font-[Heebo]">
                                {tagName}
                              </span>
                              <button
                                onClick={() => removeTag(tagName)}
                                className="hover:text-white focus:outline-none focus:text-white transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" strokeWidth={2} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Tags Section */}
                    {filteredTags.length > 0 ? (
                      <>
                        {selectedTags.length > 0 && (
                          <div className="px-4 pt-3 pb-1">
                            <span className="text-xs font-medium text-[#636363] font-[Heebo]">
                              Tags disponibles
                            </span>
                          </div>
                        )}
                        {filteredTags.map((tag) => (
                          <div
                            key={tag.id}
                            onClick={() => addTag(tag.name)}
                            className="px-4 py-2 hover:bg-[#FFE3E8] cursor-pointer transition-colors border-b border-gray-200 last:border-b-0"
                          >
                            <span className="text-sm font-medium text-black font-[Heebo]">
                              {tag.name}
                            </span>
                            <span className="text-xs text-[#636363] ml-2">
                              ({tag.usage_count})
                            </span>
                          </div>
                        ))}
                      </>
                    ) : selectedTags.length === 0 ? (
                      <div className="px-4 py-3 text-center">
                        <span className="text-sm text-[#636363] font-[Heebo]">
                          Aucun tag disponible
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div
            ref={resultsContainerRef}
            className="flex-1 overflow-y-auto p-6"
          >
            {/* Initial State - Show recent links */}
            {showInitialState && (
              <div className="flex flex-col gap-3">
                {isLoadingRecent ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#636363]" strokeWidth={2} />
                  </div>
                ) : recentLinks.length > 0 ? (
                  <>
                    <h3 className="text-sm font-medium text-[#636363] font-[Heebo] mb-2">Liens récents</h3>
                    {recentLinks.map((link) => (
                      <SearchResultItem
                        key={link.id}
                        link={link}
                        folderName={(link as any).folder_name}
                      />
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Search className="w-16 h-16 text-[#636363] mb-4" strokeWidth={2} />
                    <p className="text-base text-[#636363] font-[Heebo]">
                      Commencez à taper pour rechercher dans vos liens
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {showEmptyState && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Search className="w-16 h-16 text-[#636363] mb-4" strokeWidth={2} />
                <p className="text-base text-[#636363] font-[Heebo]">
                  Aucun résultat trouvé
                </p>
                <p className="text-sm text-[#636363] font-[Heebo] mt-2">
                  Essayez avec d&apos;autres mots-clés ou tags
                </p>
              </div>
            )}

            {/* Results List */}
            {hasResults && (
              <div className="flex flex-col gap-3">
                {allResults.map((link) => (
                  <SearchResultItem
                    key={link.id}
                    link={link}
                    folderName={(link as any).folder_name}
                  />
                ))}

                {/* Loading more indicator */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-[#636363]" strokeWidth={2} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
