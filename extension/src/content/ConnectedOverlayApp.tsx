import { X, WandSparkles, Folder, ChevronDown, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { useState, useRef, useEffect } from 'react';

interface ConnectedOverlayAppProps {
  onClose: () => void;
}

function ConnectedOverlayApp({ onClose }: ConnectedOverlayAppProps) {
  const [url, setUrl] = useState('');
  const [autoTagging, setAutoTagging] = useState(false);
  const [selectedDestination] = useState('Récents');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputWidth, setInputWidth] = useState(130);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      setInputWidth(spanRef.current.offsetWidth || 130);
    }
  }, [tagInput]);

  const handleOpenWebApp = () => {
    window.open('https://unblank.app', '_blank');
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Save clicked', { url, autoTagging, selectedDestination, tags });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Styles
  const cardStyle: React.CSSProperties = {
    width: '420px',
    backgroundColor: '#FEF8EE',
    padding: '24px',
    borderRadius: '24px',
    border: '4px solid #0D0D0D',
    boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
    fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '42px',
  };

  const logoStyle: React.CSSProperties = {
    height: '24px',
    display: 'block',
  };

  const headerRightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const closeButtonStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    color: '#0D0D0D',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '0',
  };

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0px',
    gap: '10px',
    background: '#FFFFFF',
    border: '2px solid #000000',
    boxShadow: '4px 4px 0px #000000',
    borderRadius: '12px',
    boxSizing: 'border-box',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontFamily: 'Heebo',
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: '23px',
    color: '#0D0D0D',
    background: 'transparent',
    padding: '14px 12px',
  };

  const toggleSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    gap: '16px',
    background: autoTagging ? '#FFE3E8' : '#FFE3E8',
    borderRadius: '12px',
  };

  const toggleLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'Heebo',
    fontWeight: 500,
    fontSize: '17px',
    lineHeight: '26px',
    color: autoTagging ? '#0D0D0D' : '#8B8B8B',
  };

  const toggleStyle: React.CSSProperties = {
    width: '52px',
    height: '30px',
    background: autoTagging ? '#FF506F' : '#FFE3E8',
    border: `2px solid ${autoTagging ? '#0D0D0D' : '#8B8B8B'}`,
    borderRadius: '22px',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: autoTagging ? 'flex-end' : 'flex-start',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
  };

  const toggleKnobStyle: React.CSSProperties = {
    width: '22px',
    height: '22px',
    background: autoTagging ? '#0D0D0D' : '#8B8B8B',
    borderRadius: '50%',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'Heebo',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '23px',
    letterSpacing: '-0.03em',
    color: '#0D0D0D',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const dropdownButtonStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    background: '#FFFFFF',
    border: '2px solid #000000',
    borderRadius: '8px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  const dropdownContentStyle: React.CSSProperties = {
    fontFamily: 'Heebo',
    fontWeight: 600,
    fontSize: '16px',
    lineHeight: '23px',
    color: '#0D0D0D',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const tagInputContainerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    gap: '15px',
    background: '#FFFFFF',
    border: '1px dashed #8B8B8B',
    borderRadius: '8px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    minHeight: '36px',
    width: 'fit-content',
    maxWidth: '100%',
  };

  const tagInputStyle: React.CSSProperties = {
    border: 'none',
    outline: 'none',
    fontFamily: 'Heebo',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '21px',
    color: '#0D0D0D',
    background: 'transparent',
    padding: '0',
    margin: '0',
    width: `${inputWidth}px`,
  };

  const measureSpanStyle: React.CSSProperties = {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
    fontFamily: 'Heebo',
    fontWeight: 400,
    fontSize: '14px',
    pointerEvents: 'none',
  };

  const tagsDisplayStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    background: '#FFFFFF',
    border: '1px dashed #8B8B8B',
    borderRadius: '8px',
    minHeight: '74px',
    boxSizing: 'border-box',
  };

  const noTagsStyle: React.CSSProperties = {
    fontFamily: 'Heebo',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '21px',
    color: '#8B8B8B',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: '#FFE3E8',
    border: '1px solid #0D0D0D',
    borderRadius: '8px',
    fontFamily: 'Heebo',
    fontWeight: 500,
    fontSize: '14px',
    color: '#0D0D0D',
    maxWidth: '100%',
  };

  const tagTextStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  };

  const tagsListStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    width: '100%',
  };

  return (
    <div style={cardStyle} onClick={handleCardClick}>
      {/* Header */}
      <div style={headerStyle}>
        <img
          src={chrome.runtime.getURL('UnBlznk.svg')}
          alt="UnBlank"
          style={logoStyle}
        />

        <div style={headerRightStyle}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenWebApp}
          >
            Ouvrir l'app web
          </Button>

          <button
            onClick={handleClose}
            style={closeButtonStyle}
            aria-label="Close"
            onMouseEnter={(e) => e.currentTarget.style.color = '#FF2F2F'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#0D0D0D'}
          >
            <X style={{ width: '24px', height: '24px' }} strokeWidth={2} />
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
          style={{
            ...inputStyle,
            color: url ? '#0D0D0D' : 'rgba(13, 13, 13, 0.5)',
          }}
        />
      </div>

      {/* Auto Tagging Toggle */}
      <div style={toggleSectionStyle}>
        <div style={toggleLabelStyle}>
          <WandSparkles
            size={24}
            color={autoTagging ? '#0D0D0D' : '#8B8B8B'}
            strokeWidth={2}
          />
          <span>Activer le tagging automatique</span>
        </div>
        <div
          style={toggleStyle}
          onClick={() => setAutoTagging(!autoTagging)}
        >
          <div style={toggleKnobStyle}></div>
        </div>
      </div>

      {/* Destination Selector */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Choisir la destination</div>
        <div style={dropdownStyle}>
          <div
            style={dropdownButtonStyle}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div style={dropdownContentStyle}>
              <Folder size={24} color="#000000" strokeWidth={2} />
              <span>{selectedDestination}</span>
            </div>
            <ChevronDown size={24} color="#000000" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Tags Section */}
      {!autoTagging && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Tags de recherche (mot clé pour retrouver vos rèfs)</div>

          {/* Tag Input */}
          <div style={tagInputContainerStyle}>
          <span ref={spanRef} style={measureSpanStyle}>
            {tagInput || 'Écrire un tag...'}
          </span>
          <input
            type="text"
            placeholder={isInputFocused ? '' : 'Écrire un tag...'}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            }}
            style={tagInputStyle}
          />
          <div onClick={handleAddTag} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={16} color="#8B8B8B" strokeWidth={2} />
          </div>
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
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <X size={14} color="#0D0D0D" strokeWidth={2} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Save Button */}
      <Button
        variant="primary"
        size="md"
        onClick={handleSave}
      >
        Enregistrer
      </Button>
    </div>
  );
}

export default ConnectedOverlayApp;
