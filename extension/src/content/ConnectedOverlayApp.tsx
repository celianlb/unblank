import {
  X,
  WandSparkles,
  Folder,
  ChevronDown,
  Plus,
  ChevronLeft,
  FolderOpen,
} from "lucide-react";
import { Button } from "../components/Button";
import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { motion } from "framer-motion";
import {
  extractMetadata,
  createLink,
  getFolders,
  getGroupFolders,
  getTagSuggestions,
  type Metadata,
  type Folder as FolderType,
  type TagWithMetadata,
} from "../utils/api";

interface ConnectedOverlayAppProps {
  onClose: () => void;
}

function ConnectedOverlayApp({ onClose }: ConnectedOverlayAppProps) {
  const [url, setUrl] = useState("");
  const [autoTagging, setAutoTagging] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagWithMetadata[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputWidth, setInputWidth] = useState(130);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [groups, setGroups] = useState<FolderType[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tagSuggestionsRef = useRef<HTMLDivElement>(null);

  // Navigation hiérarchique
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<
    Array<{ id: string | null; name: string }>
  >([]);
  const [currentFolders, setCurrentFolders] = useState<FolderType[]>([]);

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        tagSuggestionsRef.current &&
        !tagSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowTagSuggestions(false);
      }
    };

    if (isDropdownOpen || showTagSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, showTagSuggestions]);

  // Fetch tag suggestions when user types
  useEffect(() => {
    const fetchTagSuggestions = async () => {
      if (tagInput.length > 0) {
        try {
          const suggestions = await getTagSuggestions(tagInput);
          setTagSuggestions(suggestions);
          setShowTagSuggestions(suggestions.length > 0);
        } catch (error) {
          console.error("Error fetching tag suggestions:", error);
          setTagSuggestions([]);
          setShowTagSuggestions(false);
        }
      } else {
        setTagSuggestions([]);
        setShowTagSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchTagSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [tagInput]);

  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const { folders: userFolders, groups: userGroups } = await getFolders();
      setGroups(userGroups);
      setFolders(userFolders);
      // Initialize with root level: groups and root folders
      setCurrentFolders([...userGroups, ...userFolders]);
      setCurrentGroupId(null);
      setBreadcrumb([]);
    } catch (error) {
      console.error("Error loading folders:", error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Navigate into a group to see its folders
  const navigateToGroup = async (group: FolderType) => {
    // Update breadcrumb and UI immediately
    setCurrentGroupId(group.id);
    setBreadcrumb([...breadcrumb, { id: group.id, name: group.name }]);
    setSelectedDestination(null);
    setCurrentFolders([]); // Clear folders to show white space

    // Then load folders in background
    setIsLoadingFolders(true);
    try {
      const { folders: groupFolders } = await getGroupFolders(group.id);
      setCurrentFolders(groupFolders);
    } catch (error) {
      console.error("Error loading group folders:", error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Navigate back to the previous level
  const navigateBack = () => {
    if (breadcrumb.length === 0) return;

    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();

    if (newBreadcrumb.length === 0) {
      // Back to root
      setCurrentFolders([...groups, ...folders]);
      setCurrentGroupId(null);
      setBreadcrumb([]);
    } else {
      // Back to previous group level
      const previousLevel = newBreadcrumb[newBreadcrumb.length - 1];
      const previousGroup = groups.find((g) => g.id === previousLevel.id);
      if (previousGroup) {
        navigateToGroup(previousGroup);
      }
    }
  };

  // Handle item selection in dropdown
  const handleItemClick = (item: FolderType) => {
    if (item.is_group && currentGroupId === null) {
      // Clicked on a group at root level - navigate into it
      navigateToGroup(item);
    } else {
      // Clicked on a folder - select it and close dropdown
      setSelectedDestination(item.id);
      setIsDropdownOpen(false);
    }
  };

  // Get the display name for the selected destination
  const getSelectedDestinationName = () => {
    if (!selectedDestination) return "Sélectionner un dossier";

    // Check in current folders first
    const current = currentFolders.find((f) => f.id === selectedDestination);
    if (current) return current.name;

    // Fallback to all folders/groups
    const allItems = [...groups, ...folders];
    const item = allItems.find((f) => f.id === selectedDestination);
    return item?.name || "Sélectionner un dossier";
  };

  useLayoutEffect(() => {
    if (spanRef.current) {
      const newWidth = spanRef.current.offsetWidth + 2; // +2px for cursor
      setInputWidth(newWidth);
    }
    // Reset scroll position to prevent scrolling
    if (inputRef.current) {
      inputRef.current.scrollLeft = 0;
    }
  }, [tagInput]);

  const handleOpenWebApp = () => {
    window.open("https://unblank.app", "_blank");
  };

  const handleClose = () => {
    onClose();
  };

  // Extract metadata when URL is entered
  const handleUrlBlur = async () => {
    if (url && url.startsWith("http") && !metadata) {
      setIsLoadingMetadata(true);
      try {
        const meta = await extractMetadata(url);
        if (meta) {
          setMetadata(meta);
        }
      } catch (error) {
        console.error("Error extracting metadata:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    }
  };

  const handleSave = async () => {
    if (!url.trim()) {
      alert("Veuillez entrer une URL");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createLink({
        url: url.trim(),
        title: metadata?.title,
        description: metadata?.description,
        folderId: selectedDestination || undefined,
        originalImageUrl: metadata?.image || undefined,
        imageFormat: metadata?.imageFormat,
        contentType: metadata?.contentType,
        tags: autoTagging ? undefined : tags.length > 0 ? tags : undefined,
      });

      if (result.success) {
        // Show success message
        console.log("Link saved successfully!");
        // Close the overlay
        onClose();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving link:", error);
      alert("Erreur lors de l'enregistrement du lien");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Styles
  const cardStyle: React.CSSProperties = {
    width: "420px",
    backgroundColor: "#FEF8EE",
    padding: "24px",
    borderRadius: "24px",
    border: "4px solid #0D0D0D",
    boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
    fontFamily:
      'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boxSizing: "border-box",
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "42px",
  };

  const logoStyle: React.CSSProperties = {
    height: "24px",
    display: "block",
  };

  const headerRightStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  };

  const closeButtonStyle: React.CSSProperties = {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
    color: "#0D0D0D",
    cursor: "pointer",
    border: "none",
    background: "none",
    padding: "0",
  };

  const inputContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: "0px",
    gap: "10px",
    background: "#FFFFFF",
    border: "2px solid #000000",
    boxShadow: "4px 4px 0px #000000",
    borderRadius: "12px",
    boxSizing: "border-box",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: "none",
    outline: "none",
    fontFamily: "Heebo",
    fontWeight: 500,
    fontSize: "16px",
    lineHeight: "23px",
    color: "#0D0D0D",
    background: "transparent",
    padding: "14px 12px",
  };

  const toggleSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    gap: "16px",
    background: autoTagging ? "#FFE3E8" : "#FFE3E8",
    borderRadius: "12px",
  };

  const toggleLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "Heebo",
    fontWeight: 500,
    fontSize: "17px",
    lineHeight: "26px",
    color: autoTagging ? "#0D0D0D" : "#8B8B8B",
  };

  const toggleStyle: React.CSSProperties = {
    width: "52px",
    height: "30px",
    borderRadius: "22px",
    padding: "4px",
    cursor: "pointer",
    position: "relative",
    boxSizing: "border-box",
    border: "2px solid",
  };

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "Heebo",
    fontWeight: 600,
    fontSize: "16px",
    lineHeight: "23px",
    letterSpacing: "-0.03em",
    color: "#0D0D0D",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
  };

  const dropdownButtonStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    background: "#FFFFFF",
    border: "2px solid #000000",
    borderRadius: "8px",
    cursor: "pointer",
    boxSizing: "border-box",
  };

  const dropdownContentStyle: React.CSSProperties = {
    fontFamily: "Heebo",
    fontWeight: 600,
    fontSize: "16px",
    lineHeight: "23px",
    color: "#0D0D0D",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  const dropdownMenuStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    background: "#FFFFFF",
    border: "2px solid #000000",
    borderRadius: "8px",
    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
    zIndex: 1000,
    maxHeight: "calc(3 * 43px)", // 3 items max (10px padding top + 23px line + 10px padding bottom)
    overflowY: "auto",
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: "Heebo",
    fontWeight: 600,
    fontSize: "16px",
    lineHeight: "23px",
    color: "#0D0D0D",
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const tagInputContainerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    gap: "15px",
    background: "#FFFFFF",
    border: "1px dashed #8B8B8B",
    borderRadius: "8px",
    boxSizing: "border-box",
    cursor: "pointer",
    minHeight: "36px",
    width: "fit-content",
    maxWidth: "100%",
  };

  const tagInputStyle: React.CSSProperties = {
    border: "none",
    outline: "none",
    fontFamily: "Heebo",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "21px",
    color: "#0D0D0D",
    background: "transparent",
    padding: "0",
    margin: "0",
    width: `${inputWidth}px`,
  };

  const measureSpanStyle: React.CSSProperties = {
    position: "absolute",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: "Heebo",
    fontWeight: 400,
    fontSize: "14px",
    pointerEvents: "none",
  };

  const tagsDisplayStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "10px",
    background: "#FFFFFF",
    border: "1px dashed #8B8B8B",
    borderRadius: "8px",
    minHeight: "74px",
    boxSizing: "border-box",
  };

  const noTagsStyle: React.CSSProperties = {
    fontFamily: "Heebo",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "21px",
    color: "#8B8B8B",
  };

  const tagStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    background: "#FFE3E8",
    border: "1px solid #0D0D0D",
    borderRadius: "8px",
    fontFamily: "Heebo",
    fontWeight: 500,
    fontSize: "14px",
    color: "#0D0D0D",
    maxWidth: "100%",
  };

  const tagTextStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  };

  const tagsListStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    width: "100%",
    maxHeight: "calc(3 * (29px + 10px) - 10px)", // 3 lignes: (hauteur tag + gap) * 3 - gap final
    overflowY: "auto",
  };

  const tagSuggestionsDropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    background: "#FFFFFF",
    border: "2px solid #000000",
    borderRadius: "8px",
    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
    zIndex: 1000,
    maxHeight: "200px",
    overflowY: "auto",
  };

  const tagSuggestionItemStyle: React.CSSProperties = {
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    fontFamily: "Heebo",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "21px",
    color: "#0D0D0D",
    cursor: "pointer",
    transition: "background 0.2s",
  };

  return (
    <div style={cardStyle} onClick={handleCardClick}>
      {/* Header */}
      <div style={headerStyle}>
        <img
          src={chrome.runtime.getURL("UnBlznk.svg")}
          alt="UnBlank"
          style={logoStyle}
        />

        <div style={headerRightStyle}>
          <Button variant="secondary" size="sm" onClick={handleOpenWebApp}>
            Ouvrir l'app web
          </Button>

          <button
            onClick={handleClose}
            style={closeButtonStyle}
            aria-label="Close"
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF2F2F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#0D0D0D")}
          >
            <X style={{ width: "24px", height: "24px" }} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* URL Input */}
      <div style={inputContainerStyle}>
        <input
          type="text"
          placeholder="Coller l'URL de l'élément à sauvegarder"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          style={{
            ...inputStyle,
            color: url ? "#0D0D0D" : "rgba(13, 13, 13, 0.5)",
          }}
        />
        {isLoadingMetadata && (
          <div
            style={{ padding: "0 12px", color: "#8B8B8B", fontSize: "14px" }}
          >
            Chargement...
          </div>
        )}
      </div>

      {/* Auto Tagging Toggle */}
      <div style={toggleSectionStyle}>
        <div style={toggleLabelStyle}>
          <WandSparkles
            size={24}
            color={autoTagging ? "#0D0D0D" : "#8B8B8B"}
            strokeWidth={2}
          />
          <span>Activer le tagging automatique</span>
        </div>
        <motion.div
          style={{ ...toggleStyle, display: "flex", alignItems: "center" }}
          onClick={() => setAutoTagging(!autoTagging)}
          animate={{
            backgroundColor: autoTagging ? "#FF506F" : "#FFE3E8",
            borderColor: autoTagging ? "#0D0D0D" : "#8B8B8B",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <motion.div
            animate={{
              x: autoTagging ? 18 : 0,
              backgroundColor: autoTagging ? "#0D0D0D" : "#8B8B8B",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
            }}
          />
        </motion.div>
      </div>

      {/* Destination Selector */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Choisir la destination</div>
        <div style={dropdownStyle} ref={dropdownRef}>
          <div
            style={dropdownButtonStyle}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div style={dropdownContentStyle}>
              <Folder size={24} color="#000000" strokeWidth={2} />
              <span>
                {selectedDestination
                  ? breadcrumb.length > 0
                    ? `${breadcrumb
                        .map((b) => b.name)
                        .join(" > ")} > ${getSelectedDestinationName()}`
                    : getSelectedDestinationName()
                  : breadcrumb.length > 0
                  ? breadcrumb.map((b) => b.name).join(" > ")
                  : "Sélectionner un dossier"}
              </span>
            </div>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <ChevronDown size={24} color="#000000" strokeWidth={2} />
            </motion.div>
          </div>
          {isDropdownOpen && (
            <div style={dropdownMenuStyle}>
              {breadcrumb.length > 0 && (
                <div
                  key="back"
                  style={{
                    ...dropdownItemStyle,
                    borderBottom: "1px solid #E5E5E5",
                    fontWeight: 700,
                  }}
                  onClick={navigateBack}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#FFE3E8")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#FFFFFF")
                  }
                >
                  <ChevronLeft size={24} color="#000000" strokeWidth={2} />
                  <span>{breadcrumb[breadcrumb.length - 1].name}</span>
                </div>
              )}
              {!isLoadingFolders &&
              currentFolders.length === 0 &&
              breadcrumb.length === 0 ? (
                <div style={{ ...dropdownItemStyle, cursor: "default" }}>
                  <span>Aucun dossier disponible</span>
                </div>
              ) : (
                currentFolders.map((item) => (
                  <div
                    key={item.id}
                    style={dropdownItemStyle}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FFE3E8")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#FFFFFF")
                    }
                  >
                    {item.is_group ? (
                      <FolderOpen size={24} color="#000000" strokeWidth={2} />
                    ) : (
                      <Folder size={24} color="#000000" strokeWidth={2} />
                    )}
                    <span>{item.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags Section */}
      <motion.div
        initial={false}
        animate={{
          height: autoTagging ? 0 : "auto",
          marginTop: autoTagging ? 0 : 16,
          marginBottom: autoTagging ? 0 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            Tags de recherche (mot clé pour retrouver vos rèfs)
          </div>

          {/* Tag Input */}
          <div style={{ position: "relative" }}>
            <div style={tagInputContainerStyle}>
              <span ref={spanRef} style={measureSpanStyle}>
                {tagInput || "Écrire un tag..."}
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Écrire un tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddTag();
                  }
                }}
                onFocus={() => {
                  if (tagInput.length > 0 && tagSuggestions.length > 0) {
                    setShowTagSuggestions(true);
                  }
                }}
                style={tagInputStyle}
              />
              <div
                onClick={handleAddTag}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={16} color="#8B8B8B" strokeWidth={2} />
              </div>
            </div>

            {/* Tag Suggestions Dropdown */}
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <div ref={tagSuggestionsRef} style={tagSuggestionsDropdownStyle}>
                {tagSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    onClick={() => {
                      setTagInput(suggestion.name);
                      setShowTagSuggestions(false);
                      handleAddTag();
                    }}
                    style={tagSuggestionItemStyle}
                  >
                    <span style={{ flex: 1 }}>{suggestion.name}</span>
                    <span style={{ fontSize: "12px", color: "#8B8B8B" }}>
                      {suggestion.usage_count} utilisations
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags Display */}
          <div style={tagsDisplayStyle}>
            {tags.length === 0 ? (
              <div style={noTagsStyle}>Aucun tag pour l'instant.</div>
            ) : (
              <div style={tagsListStyle}>
                {tags.map((tag, index) => (
                  <div key={index} style={tagStyle}>
                    <span style={tagTextStyle}>{tag}</span>
                    <span
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <X size={14} color="#0D0D0D" strokeWidth={2} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
        disabled={isSaving || !url.trim()}
      >
        {isSaving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}

export default ConnectedOverlayApp;
