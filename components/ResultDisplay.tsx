import React, { useState, useRef, useEffect } from 'react';
import type { AnalysisResult, Word } from '../types';
import { 
    DownloadIcon, TashkeelIcon, PlusIcon, MinusIcon, 
    ArrowPathIcon as RefreshIcon, ClipboardIcon, PencilIcon, 
    UndoIcon, RedoIcon, SparklesIcon
} from './icons';
import { ChatComponent } from './Chat';

interface ResultDisplayProps {
  result: AnalysisResult;
  imageSrc: string;
  onDownload: (editedText: string) => void;
  initialZoomState?: { scale: number; position: { x: number; y: number } };
  onZoomChange: (newState: { scale: number; position: { x: number; y: number } }) => void;
}

interface ZoomableImageProps {
    src: string;
    alt: string;
    scale: number;
    position: { x: number; y: number };
    onScaleChange: (scale: number) => void;
    onPositionChange: (position: { x: number; y: number; }) => void;
    onImageLoad: (dimensions: {width: number; height: number}) => void;
    words?: Word[];
    highlightedWord?: Word | null;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, scale, position, onScaleChange, onPositionChange, onImageLoad, words, highlightedWord }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isWheeling, setIsWheeling] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const wheelTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (wheelTimeoutRef.current) {
                clearTimeout(wheelTimeoutRef.current);
            }
        };
    }, []);

    const handleZoomIn = () => onScaleChange(Math.min(scale * 1.2, 5));
    const handleZoomOut = () => onScaleChange(Math.max(scale / 1.2, 0.5));
    const handleReset = () => {
        onScaleChange(1);
        onPositionChange({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setIsWheeling(true);
        if (wheelTimeoutRef.current) {
            clearTimeout(wheelTimeoutRef.current);
        }
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
        wheelTimeoutRef.current = window.setTimeout(() => {
            setIsWheeling(false);
        }, 150);
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        e.preventDefault();
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.clientX - startPos.x;
        const y = e.clientY - startPos.y;
        onPositionChange({ x, y });
    };
    
    const handleMouseUpOrLeave = () => {
        setIsDragging(false);
    };
    
    const handleLoad = () => {
        if (imageRef.current) {
            onImageLoad({ width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight });
        }
    }

    return (
        <div 
          className="relative w-full h-full overflow-hidden cursor-grab"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: (isDragging || isWheeling) ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            <div className="relative inline-block"> {/* This wrapper shrinks to the image's aspect ratio */}
                <img
                  ref={imageRef}
                  src={src}
                  alt={alt}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  onLoad={handleLoad}
                />
                {words && (
                  <div className="absolute inset-0 pointer-events-none">
                    {words.map((word, index) => {
                       const isHighlighted = highlightedWord === word;
                       return (
                         <div
                           key={index}
                           className="transition-all duration-150"
                           style={{
                             position: 'absolute',
                             left: `${word.boundingBox.x * 100}%`,
                             top: `${word.boundingBox.y * 100}%`,
                             width: `${word.boundingBox.width * 100}%`,
                             height: `${word.boundingBox.height * 100}%`,
                             backgroundColor: isHighlighted ? 'rgba(79, 70, 229, 0.4)' : 'transparent',
                             border: isHighlighted ? '2px solid #4f46e5' : 'none',
                             boxSizing: 'border-box',
                           }}
                         />
                       );
                    })}
                  </div>
                )}
            </div>
          </div>
          <div className="absolute bottom-2 right-2 flex gap-1 bg-black/50 p-1 rounded-md">
            <button onClick={handleZoomIn} className="p-1 text-white hover:bg-white/20 rounded" aria-label="Zoom in"><PlusIcon className="w-5 h-5" /></button>
            <button onClick={handleZoomOut} className="p-1 text-white hover:bg-white/20 rounded" aria-label="Zoom out"><MinusIcon className="w-5 h-5" /></button>
            <button onClick={handleReset} className="p-1 text-white hover:bg-white/20 rounded" aria-label="Reset zoom"><RefreshIcon className="w-5 h-5" /></button>
          </div>
        </div>
    );
};

export { ZoomableImage };


const ResultCard: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
  <div className={`bg-slate-50 rounded-lg p-6 border border-slate-200 ${className}`}>
    <h3 className="text-lg font-bold text-indigo-600 mb-4" dir="rtl">{title}</h3>
    {children}
  </div>
);

// Helper function to remove Arabic diacritical marks
const removeDiacritics = (text: string) => {
  return text.replace(/[\u064B-\u0652\u0640]/g, '');
};

const fontStyleMap: Record<string, string> = {
    'Naskh': 'font-naskh',
    'Ruqah': 'font-ruqah',
    'Diwani': 'font-diwani',
    'Thuluth': 'font-thuluth',
    'Kufi': 'font-kufi',
    'Farsi': 'font-farsi',
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, imageSrc, onDownload, initialZoomState, onZoomChange }) => {
  const [diacriticsVisible, setDiacriticsVisible] = useState(true);
  const [highlightedWord, setHighlightedWord] = useState<Word | null>(null);
  const [history, setHistory] = useState<{stack: string[], index: number}>({ stack: [''], index: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<number | null>(null);
  const hasEditedSinceLoad = useRef(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState<{width: number; height: number} | null>(null);

  const fontClass = fontStyleMap[result.identifiedFontStyle] || 'font-naskh';

  // Derive zoom state from props, making this a controlled component.
  const zoomState = initialZoomState ?? { scale: 1, position: { x: 0, y: 0 } };

  const handleScaleChange = (newScale: number) => {
    onZoomChange({ ...zoomState, scale: newScale });
  };

  const handlePositionChange = (newPosition: { x: number; y: number; }) => {
    onZoomChange({ ...zoomState, position: newPosition });
  };
  
  const handleWordEnter = (word: Word) => {
    if (hasEditedSinceLoad.current) return;
    setHighlightedWord(word);
  };

  const handleWordSpanMouseLeave = () => {
    if (hasEditedSinceLoad.current) return;
    setHighlightedWord(null);
  };

  useEffect(() => {
    if (editorRef.current && result.words) {
      const lines: Word[][] = [];
      if (result.words.length > 0) {
        const sortedWords = [...result.words].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
        let currentLine: Word[] = [sortedWords[0]];
        lines.push(currentLine);
        for (let i = 1; i < sortedWords.length; i++) {
          const word = sortedWords[i];
          const lineReferenceWord = currentLine[0];
          const referenceCenterY = lineReferenceWord.boundingBox.y + lineReferenceWord.boundingBox.height / 2;
          const wordCenterY = word.boundingBox.y + word.boundingBox.height / 2;
          if (Math.abs(wordCenterY - referenceCenterY) < lineReferenceWord.boundingBox.height * 0.7) {
            currentLine.push(word);
          } else {
            currentLine = [word];
            lines.push(currentLine);
          }
        }
      }

      editorRef.current.innerHTML = '';
      lines.forEach((line, lineIndex) => {
        line.sort((a, b) => b.boundingBox.x - a.boundingBox.x);
        line.forEach((word, wordIndex) => {
          const span = document.createElement('span');
          span.textContent = word.text;
          span.onmouseenter = () => handleWordEnter(word);
          span.onmouseleave = handleWordSpanMouseLeave;
          editorRef.current?.appendChild(span);

          if (wordIndex < line.length - 1) {
            editorRef.current?.appendChild(document.createTextNode(' '));
          }
        });

        if (lineIndex < lines.length - 1) {
          editorRef.current?.appendChild(document.createTextNode('\n'));
        }
      });
      const initialText = editorRef.current.innerText;
      setHistory({ stack: [initialText], index: 0 });
      hasEditedSinceLoad.current = false;
    }
  }, [result.words]);

  const handleInput = () => {
    if (!hasEditedSinceLoad.current) {
      hasEditedSinceLoad.current = true;
      setHighlightedWord(null);
    }
    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
        if(editorRef.current) {
            const currentText = editorRef.current.innerText;
            setHistory(prevHistory => {
                if (currentText === prevHistory.stack[prevHistory.index]) {
                    return prevHistory;
                }
                const newStack = prevHistory.stack.slice(0, prevHistory.index + 1);
                newStack.push(currentText);
                return { stack: newStack, index: newStack.length - 1 };
            });
        }
    }, 500);
  };

  const isEdited = history.index > 0;
  const canUndo = history.index > 0;
  const canRedo = history.index < history.stack.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    setHistory(prev => {
        const newIndex = prev.index - 1;
        if (editorRef.current) {
            editorRef.current.innerText = prev.stack[newIndex];
        }
        return { ...prev, index: newIndex };
    });
  };

  const handleRedo = () => {
    if (!canRedo) return;
    setHistory(prev => {
        const newIndex = prev.index + 1;
        if (editorRef.current) {
            editorRef.current.innerText = prev.stack[newIndex];
        }
        return { ...prev, index: newIndex };
    });
  };

  const getTextToProcess = () => {
    const rawText = history.stack[history.index] ?? '';
    return diacriticsVisible ? rawText : removeDiacritics(rawText);
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getTextToProcess()).then(() => {
      alert('Text copied to clipboard!');
    }, (err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in" dir="rtl">
      <div className="text-center p-6 border-b border-slate-200 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-800">Analysis Complete</h2>
        <div className="mt-2 flex items-center justify-center flex-wrap gap-x-4 gap-y-2">
            <p className="text-slate-500 text-lg" dir="ltr">
              Identified Font: <span className="font-bold text-indigo-600">{result.identifiedFontName}</span>
            </p>
            {result.identifiedFontUrl && result.identifiedFontName !== 'N/A' && result.identifiedFontName !== 'Unknown' && (
              <a href={result.identifiedFontUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition text-sm">
                <DownloadIcon className="h-4 w-4" />
                Download Font
              </a>
            )}
          </div>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        {/* Left Column: Image */}
        <div className="flex-shrink-0 lg:w-1/2 flex flex-col h-1/2 lg:h-full">
            <ResultCard title="Uploaded Image" className="flex-grow flex flex-col">
              <div ref={imageContainerRef} className="flex-grow min-h-0 rounded-md bg-slate-100/50">
                  <ZoomableImage 
                    src={imageSrc} 
                    alt="Analyzed"
                    scale={zoomState.scale}
                    position={zoomState.position}
                    onScaleChange={handleScaleChange}
                    onPositionChange={handlePositionChange}
                    onImageLoad={setImageDimensions}
                    words={result.words}
                    highlightedWord={highlightedWord}
                  />
              </div>
            </ResultCard>
        </div>
        
        {/* Right Column: Details */}
        <div className="flex-grow lg:w-1/2 flex flex-col overflow-hidden">
            <div className="flex-grow overflow-y-auto space-y-6 pr-2">
              <ResultCard title="Extracted Text">
                <div className="relative bg-white p-4 rounded-md">
                  <div className="absolute top-3 right-auto left-3 z-20 flex gap-2">
                    {isEdited && (
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full">
                        <PencilIcon className="h-3 w-3" />
                        <span>Edited</span>
                      </div>
                    )}
                    <div className="flex items-center bg-slate-200 rounded-full">
                        <button onClick={handleUndo} disabled={!canUndo} title="Undo" aria-label="Undo" className="p-2 text-slate-600 hover:bg-slate-300 disabled:text-slate-400 disabled:hover:bg-slate-200 disabled:cursor-not-allowed rounded-l-full transition-colors">
                          <UndoIcon className="h-5 w-5" />
                        </button>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <button onClick={handleRedo} disabled={!canRedo} title="Redo" aria-label="Redo" className="p-2 text-slate-600 hover:bg-slate-300 disabled:text-slate-400 disabled:hover:bg-slate-200 disabled:cursor-not-allowed rounded-r-full transition-colors">
                          <RedoIcon className="h-5 w-5" />
                        </button>
                      </div>
                    <button onClick={() => setDiacriticsVisible(!diacriticsVisible)} title={diacriticsVisible ? "Hide Diacritics" : "Show Diacritics"} aria-label={diacriticsVisible ? "Hide Diacritics" : "Show Diacritics"} className={`p-2 rounded-full transition-colors ${diacriticsVisible ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                        <TashkeelIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div ref={editorRef} onInput={handleInput} contentEditable="true" suppressContentEditableWarning={true} dir="rtl" className={`text-right text-lg whitespace-pre-wrap pt-10 pb-2 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md max-h-80 overflow-y-auto ${fontClass}`} style={{ WebkitUserModify: 'read-write-plaintext-only' }}>
                  </div>
                </div>
                <button onClick={copyToClipboard} className="mt-4 w-full flex items-center justify-center gap-2 text-center px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition">
                  <ClipboardIcon className="h-5 w-5" />
                  Copy Text
                </button>
              </ResultCard>

              {result.designBrief && (
                <ResultCard title="ملخص إبداعي للمصمم">
                  <div className="flex items-start gap-4" dir="rtl">
                    <SparklesIcon className="h-8 w-8 text-amber-500 flex-shrink-0 mt-1" />
                    <blockquote className="text-slate-600 text-base">
                      {result.designBrief}
                    </blockquote>
                  </div>
                </ResultCard>
              )}

              <ResultCard title="المساعد الذكي">
                <ChatComponent analysisResult={result} />
              </ResultCard>
            </div>
        </div>
      </div>

      <div className="text-center p-6 border-t border-slate-200 flex-shrink-0">
        <button
          onClick={() => onDownload(getTextToProcess())}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105"
        >
          <DownloadIcon className="h-5 w-5" />
          Download as .txt
        </button>
      </div>
    </div>
  );
};