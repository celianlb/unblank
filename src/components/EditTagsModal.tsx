"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useTagSuggestions } from "@/hooks/useTags";
import { useAuthContext } from "@/contexts/AuthContext";

interface EditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTags: string[];
  onSave: (tags: string[]) => void;
}

export default function EditTagsModal({
  isOpen,
  onClose,
  initialTags,
  onSave,
}: EditTagsModalProps) {
  const { session } = useAuthContext();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch tag suggestions when user types
  const { data: suggestions = [] } = useTagSuggestions(
    session?.user?.id,
    inputValue,
    10
  );

  useEffect(() => {
    setShowSuggestions(inputValue.length > 0 && suggestions.length > 0);
  }, [inputValue, suggestions]);

  if (!isOpen) return null;

  const handleAddTag = (tagName?: string) => {
    const tagToAdd = tagName || inputValue.trim();
    if (tagToAdd && !tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col p-8 gap-6">
            {/* Header */}
            <div className="flex items-center justify-center w-full mb-2 relative">
              <h2 className="text-3xl font-bold text-black">Éditer les tags</h2>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-[#FF506F] transition-colors cursor-pointer absolute right-0"
              >
                <X className="w-8 h-8" strokeWidth={2} />
              </button>
            </div>

            {/* Input Section */}
            <div className="flex flex-col items-start p-0 gap-1.5 w-full relative">
              <div className="flex flex-row items-center px-3 gap-4 w-full h-14 bg-white border border-dashed border-[#8B8B8B] rounded-xl">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Taper pour chercher ou ajouter un tag"
                  className="flex-1 h-full bg-transparent border-none text-[#0D0D0D] placeholder-gray-400 focus:outline-none text-lg font-[Heebo] font-normal"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="flex items-center justify-center gap-2.5 px-[18px] h-10 bg-[#FF506F] border-2 border-[#0D0D0D] rounded-lg hover:bg-[#FF6080] transition-colors cursor-pointer"
                >
                  <Plus className="w-6 h-6 text-[#0D0D0D]" strokeWidth={2} />
                  <span className="text-base font-bold leading-[23px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo]">
                    Ajouter
                  </span>
                </button>
              </div>

              {/* Tag Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000000] max-h-[200px] overflow-y-auto z-50">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => handleAddTag(suggestion.name)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium text-[#0D0D0D] font-[Heebo]">
                        #{suggestion.name}
                      </span>
                      <span className="text-xs text-[#8B8B8B] font-[Heebo]">
                        {suggestion.usage_count} utilisations
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags Display Section */}
              <div className="min-h-[134px] w-full p-2.5 bg-white border border-dashed border-[#8B8B8B] rounded-xl flex flex-wrap gap-2.5">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center gap-2.5 px-2 h-8 bg-[#FFE3E8] rounded"
                  >
                    <span className="text-sm leading-[21px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo]">
                      #{tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <X
                        className="w-3.5 h-3.5 text-[#FF2F2F]"
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full h-14 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base cursor-pointer font-[Heebo]"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
