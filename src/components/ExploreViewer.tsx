import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SpaceObject } from '../types/game';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  HelpCircle,
  Loader2,
  Maximize2,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import { SPACE_OBJECTS } from '../data/spaceObjects';
import { CELESTIAL_SUBJECTS } from '../utils/celestialDictionary';
import { sound } from '../utils/audio';

interface ExploreViewerProps {
  target: SpaceObject;
  onGuessSubmitted: (guess: string, hintsUsed: number, zoomUsed: boolean) => void;
  isGuessed: boolean;
  userResult?: {
    isCorrect: boolean;
    isPartial?: boolean;
    partialCategory?: string;
    pointsEarned: number;
    submittedName: string;
  };
  onNextTarget?: () => void;
  titleHeading?: string;
}

export const ExploreViewer: React.FC<ExploreViewerProps> = ({
  target,
  onGuessSubmitted,
  isGuessed,
  userResult,
  onNextTarget,
  titleHeading,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState<'normal' | 'infrared' | 'contrast' | 'invert'>('normal');
  const [isLoupeActive, setIsLoupeActive] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, visible: false });
  const [guessInput, setGuessInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSugIndex, setSelectedSugIndex] = useState(-1);
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [hasInteractedZoom, setHasInteractedZoom] = useState(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Fast image loading state with fallback handling
  const [imgSrc, setImgSrc] = useState(target.imageUrl);
  const [imgLoading, setImgLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveFilter('normal');
    setUnlockedHints([]);
    setGuessInput('');
    setShowSuggestions(false);
    setSelectedSugIndex(-1);
    setHasInteractedZoom(false);
    setImgLoading(true);
    setImgSrc(target.imageUrl);

    // Safety timeout ensures user is never blocked by slow network loading
    const timer = setTimeout(() => {
      setImgLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [target.id, target.imageUrl]);

  const handleZoom = useCallback((delta: number) => {
    setZoom((prev) => {
      const next = Math.min(4, Math.max(1, Math.round((prev + delta) * 10) / 10));
      if (next !== 1) {
        setHasInteractedZoom(true);
      }
      return next;
    });
    sound.playWhoosh();
  }, []);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    sound.playWhoosh();
  };

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playSuccessChime();
    }
  };

  // Double click on viewport to zoom in at point or reset
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (zoom > 1) {
      handleReset();
    } else {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;
      setZoom(2.5);
      setPan({ x: -clickX * 0.8, y: -clickY * 0.8 });
      setHasInteractedZoom(true);
      sound.playWhoosh();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isLoupeActive) {
      setLoupePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    }

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      setHasInteractedZoom(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    handleZoom(delta);
  };

  const unlockHint = (index: number) => {
    if (!unlockedHints.includes(index)) {
      setUnlockedHints([...unlockedHints, index]);
      sound.playHintBlip();
    }
  };

  const handleSubmitGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guessInput.trim() || isGuessed) return;
    onGuessSubmitted(guessInput.trim(), unlockedHints.length, hasInteractedZoom);
  };

  // Keyboard navigation & comfort listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input box, only handle arrow keys / enter for suggestions
      const isInputFocused = document.activeElement === inputRef.current;

      // When round is finished, pressing Space or Enter or ArrowRight advances to next target
      if (isGuessed && onNextTarget && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')) {
        if (!isInputFocused) {
          e.preventDefault();
          sound.playWhoosh();
          onNextTarget();
          return;
        }
      }

      if (!isInputFocused) {
        // Hotkeys for comfortable hands-on-keyboard play
        if (e.key === '1') {
          e.preventDefault();
          unlockHint(0);
        } else if (e.key === '2') {
          e.preventDefault();
          unlockHint(1);
        } else if (e.key === '3') {
          e.preventDefault();
          unlockHint(2);
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoom(0.3);
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          handleZoom(-0.3);
        } else if (e.key === '0' || e.key === 'r') {
          e.preventDefault();
          handleReset();
        } else if (e.key === 'f') {
          e.preventDefault();
          setActiveFilter((prev) => {
            const sequence: ('normal' | 'infrared' | 'contrast' | 'invert')[] = [
              'normal',
              'infrared',
              'contrast',
              'invert',
            ];
            const nextIdx = (sequence.indexOf(prev) + 1) % sequence.length;
            sound.playWhoosh();
            return sequence[nextIdx];
          });
        } else if (e.key === 'm') {
          e.preventDefault();
          handleToggleSound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuessed, onNextTarget, unlockedHints, handleZoom]);

  // Autocomplete matching suggestions with clear category vs exact labels
  const matchingSuggestions = React.useMemo(() => {
    if (!guessInput.trim()) return [];
    const q = guessInput.toLowerCase().trim();

    const results: { id: string; name: string; category: string; isCategoryPick?: boolean }[] = [];

    // Category suggestions (e.g. typing "nebula" shows category quick pick)
    const categoryKeywords = [
      { id: 'cat-nebula', name: 'nebula', category: 'category', trigger: 'neb' },
      { id: 'cat-galaxy', name: 'galaxy', category: 'category', trigger: 'gal' },
      { id: 'cat-planet', name: 'planet', category: 'category', trigger: 'pla' },
      { id: 'cat-moon', name: 'moon', category: 'category', trigger: 'moo' },
    ];

    for (const c of categoryKeywords) {
      if (c.name.includes(q) || q.includes(c.trigger)) {
        results.push({ id: c.id, name: c.name, category: c.category, isCategoryPick: true });
      }
    }

    // Check celestial subjects dictionary
    for (const sub of CELESTIAL_SUBJECTS) {
      if (sub.canonical.includes(q) || sub.aliases.some((a) => a.includes(q))) {
        if (!results.some((r) => r.name === sub.canonical)) {
          results.push({
            id: sub.canonical,
            name: sub.canonical,
            category: `${sub.category} · exact (300 pts)`,
          });
        }
      }
    }

    // Check space objects
    for (const obj of SPACE_OBJECTS) {
      if (obj.name.toLowerCase().includes(q) || obj.aliases.some((a) => a.toLowerCase().includes(q))) {
        if (!results.some((r) => r.name.toLowerCase() === obj.name.toLowerCase())) {
          results.push({
            id: obj.id,
            name: obj.name.toLowerCase(),
            category: `${obj.category} · exact (300 pts)`,
          });
        }
      }
    }

    return results.slice(0, 6);
  }, [guessInput]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && matchingSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSugIndex((prev) => (prev + 1) % matchingSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSugIndex((prev) => (prev - 1 + matchingSuggestions.length) % matchingSuggestions.length);
        return;
      }
      if (e.key === 'Enter' && selectedSugIndex >= 0) {
        e.preventDefault();
        setGuessInput(matchingSuggestions[selectedSugIndex].name);
        setShowSuggestions(false);
        setSelectedSugIndex(-1);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSugIndex(-1);
        return;
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 max-w-6xl mx-auto px-4 py-4 select-none">
      {/* Visualizer viewport */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Top header row */}
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-mono text-neutral-300 flex items-center gap-2">
            <span>{titleHeading || 'deep space visualization'}</span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] text-neutral-500 font-mono">
              {Math.round(zoom * 100)}% {zoom > 1 ? '(drag to pan)' : ''}
            </span>
          </span>

          <div className="flex items-center gap-3">
            {/* Audio toggle button */}
            <button
              onClick={handleToggleSound}
              title={isMuted ? 'unmute cosmic sound (m)' : 'mute cosmic sound (m)'}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            >
              {isMuted ? <VolumeX size={14} className="text-neutral-500" /> : <Volume2 size={14} className="text-sky-400" />}
              <span className="font-mono text-[10px] hidden sm:inline">{isMuted ? 'muted' : 'sound on'}</span>
            </button>

            {/* High-res fullscreen viewer */}
            <button
              onClick={() => setIsFullscreenModalOpen(true)}
              title="view original high-resolution photo"
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <Maximize2 size={13} />
              <span className="font-mono text-[10px] hidden sm:inline">full-res</span>
            </button>
          </div>
        </div>

        {/* Viewport canvas box */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className={`relative w-full h-[400px] sm:h-[480px] bg-neutral-950 sketch-border overflow-hidden select-none ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
          }`}
        >
          {/* Background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {/* Loader */}
          {imgLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 gap-2.5">
              <Loader2 className="animate-spin text-sky-400" size={26} />
              <span className="text-xs text-neutral-400 font-mono tracking-wide">
                transmitting telemetry from deep space...
              </span>
            </div>
          )}

          {/* Celestial image with smooth transforms */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            }}
          >
            <img
              src={imgSrc}
              alt="Deep space target"
              draggable={false}
              onLoad={() => setImgLoading(false)}
              onError={() => {
                if (target.nasaId && !imgSrc.includes(`${target.nasaId}~small.jpg`)) {
                  setImgSrc(`https://images-assets.nasa.gov/image/${target.nasaId}/${target.nasaId}~small.jpg`);
                } else if (target.fallbackImageUrl && imgSrc !== target.fallbackImageUrl) {
                  setImgSrc(target.fallbackImageUrl);
                }
                setImgLoading(false);
              }}
              className={`max-w-full max-h-full object-contain pointer-events-none select-none transition-all duration-300 ${
                activeFilter === 'infrared'
                  ? 'hue-rotate-180 saturate-200 contrast-125'
                  : activeFilter === 'contrast'
                  ? 'contrast-200 brightness-110'
                  : activeFilter === 'invert'
                  ? 'invert brightness-90'
                  : ''
              }`}
            />
          </div>

          {/* Magnifier Loupe */}
          {isLoupeActive && loupePos.visible && (
            <div
              className="absolute pointer-events-none border-2 border-sky-400/80 rounded-full overflow-hidden shadow-2xl bg-black"
              style={{
                width: 140,
                height: 140,
                left: loupePos.x - 70,
                top: loupePos.y - 70,
              }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  backgroundImage: `url(${imgSrc})`,
                  backgroundSize: `${100 * zoom * 2.2}%`,
                  backgroundPosition: `${(loupePos.x / (containerRef.current?.clientWidth || 1)) * 100}% ${(loupePos.y / (containerRef.current?.clientHeight || 1)) * 100}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="absolute inset-0 border border-white/20 rounded-full" />
            </div>
          )}

          {/* Controls overlay in bottom left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 sketch-border-subtle z-10">
            <button
              onClick={() => handleZoom(0.3)}
              title="zoom in (+)"
              className="p-1.5 text-neutral-400 hover:text-white rounded cursor-pointer transition-colors"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => handleZoom(-0.3)}
              title="zoom out (-)"
              className="p-1.5 text-neutral-400 hover:text-white rounded cursor-pointer transition-colors"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={handleReset}
              title="reset zoom/pan (r / 0)"
              className="p-1.5 text-neutral-400 hover:text-white rounded cursor-pointer transition-colors"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => {
                setIsLoupeActive(!isLoupeActive);
                sound.playWhoosh();
              }}
              title="magnifier loupe"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                isLoupeActive ? 'text-white border border-sky-400/60 bg-sky-950/40' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        {/* Spectral filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 font-mono mr-1">spectral:</span>
            {(['normal', 'infrared', 'contrast', 'invert'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  sound.playWhoosh();
                }}
                className={`px-2.5 py-0.5 text-xs sketch-border cursor-pointer transition-all ${
                  activeFilter === filter
                    ? 'border-white text-white bg-neutral-900 font-medium'
                    : 'border-neutral-800 text-neutral-500 hover:text-white'
                }`}
              >
                {filter === 'normal' ? 'natural' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input / result side panel */}
      <div className="w-full lg:w-92 flex flex-col gap-3">
        {/* Hints */}
        <div className="p-3.5 sketch-border border-neutral-800 bg-neutral-950/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <HelpCircle size={13} className="text-neutral-500" />
              telemetry clues ({unlockedHints.length}/3)
            </span>
          </div>

          <div className="space-y-1.5">
            {target.hints.map((hint, idx) => {
              const isUnlocked = unlockedHints.includes(idx);
              return (
                <div key={idx} className="text-xs">
                  {isUnlocked ? (
                    <div className="p-2.5 bg-neutral-900/90 border border-neutral-700/60 text-neutral-200 rounded leading-relaxed">
                      <span className="text-sky-400 font-mono mr-1.5 text-[11px]">hint {idx + 1}:</span>
                      {hint}
                    </div>
                  ) : (
                    <button
                      onClick={() => unlockHint(idx)}
                      disabled={isGuessed}
                      className="w-full text-left p-2 border border-dashed border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors rounded cursor-pointer"
                    >
                      hint {idx + 1} ({idx === 0 ? 'distance' : idx === 1 ? 'telescope' : 'nature'})
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input form */}
        {!isGuessed ? (
          <div className="p-4 sketch-border border-neutral-800 bg-neutral-950/90 relative">
            <form onSubmit={handleSubmitGuess} className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  id="guess-input"
                  type="text"
                  value={guessInput}
                  onChange={(e) => {
                    setGuessInput(e.target.value);
                    setShowSuggestions(true);
                    setSelectedSugIndex(-1);
                    sound.playKeyBlip();
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="type celestial name or category..."
                  autoComplete="off"
                  className="w-full px-3.5 py-2.5 bg-black border border-neutral-700 focus:border-white text-white placeholder-neutral-500 rounded text-base outline-none transition-colors pr-8"
                />

                {guessInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setGuessInput('');
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-3 text-neutral-500 hover:text-white cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}

                {/* Suggestions popup */}
                {showSuggestions && matchingSuggestions.length > 0 && (
                  <div className="absolute bottom-full mb-1 left-0 right-0 bg-neutral-900 border border-neutral-700 rounded shadow-2xl z-30 overflow-hidden divide-y divide-neutral-800">
                    {matchingSuggestions.map((sug, index) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => {
                          setGuessInput(sug.name);
                          setShowSuggestions(false);
                          setSelectedSugIndex(-1);
                          sound.playKeyBlip();
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                          index === selectedSugIndex
                            ? 'bg-sky-950/70 text-white'
                            : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        <span className="capitalize">{sug.name}</span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {sug.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!guessInput.trim()}
                  className="flex-1 py-2 px-4 sketch-border bg-white text-black text-base font-semibold hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
                >
                  enter guess
                </button>
                <button
                  type="button"
                  onClick={() => onGuessSubmitted('pass', unlockedHints.length, hasInteractedZoom)}
                  className="py-2 px-3 sketch-border border-neutral-800 text-neutral-400 hover:text-white text-sm transition-colors cursor-pointer"
                >
                  pass
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div
            className={`p-4 sketch-border space-y-3.5 transition-all ${
              userResult?.isCorrect
                ? 'border-neutral-700 bg-neutral-900/80'
                : 'border-neutral-800 bg-neutral-950'
            }`}
          >
            {/* Result Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-mono">celestial target</span>
                <h3 className="text-2xl font-heading text-white pt-1">{target.name}</h3>
                {userResult?.submittedName && userResult.submittedName !== target.name.toLowerCase() && (
                  <p className="text-xs text-neutral-400 font-mono">
                    your entry: <span className="text-neutral-200">"{userResult.submittedName}"</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`text-2xl font-heading ${
                    userResult?.isCorrect ? 'text-white' : 'text-neutral-500'
                  }`}
                >
                  +{userResult?.pointsEarned || 0} pts
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 italic leading-relaxed">
              "{target.story}"
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
              <div>
                <span className="text-neutral-500 block">instrument:</span>
                <span className="text-neutral-200">{target.missionOrTelescope}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">distance:</span>
                <span className="text-neutral-200">{target.distance}</span>
              </div>
            </div>

            {onNextTarget && (
              <div className="pt-2">
                <button
                  onClick={onNextTarget}
                  className="w-full py-2.5 px-4 sketch-border bg-white text-black text-base font-semibold hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 group shadow-lg"
                >
                  <span>continue to next map</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* High resolution full-screen image modal */}
      {isFullscreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <div>
              <h2 className="text-lg text-white font-heading">{target.name}</h2>
              <span className="text-xs font-mono text-neutral-500">
                NASA archive · {target.missionOrTelescope}
              </span>
            </div>
            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="p-2 text-neutral-400 hover:text-white sketch-border bg-neutral-900 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <img
              src={imgSrc}
              alt={target.name}
              className="max-w-full max-h-[82vh] object-contain rounded shadow-2xl"
            />
          </div>

          <div className="text-center text-xs text-neutral-500 font-mono pt-2">
            press [esc] or click × to return
          </div>
        </div>
      )}
    </div>
  );
};
