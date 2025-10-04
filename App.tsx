import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FileUpload } from './components/FileUpload';
import { ResultDisplay, ZoomableImage } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { analyzeArabicFont } from './services/geminiService';
import type { AnalysisResult, ImageState, Word, ExtractionMode } from './types';
import { AnalyzeIcon, ErrorIcon, CheckCircleIcon, XCircleIcon, XMarkIcon, UploadIcon, MagnifyingGlassPlusIcon, ArrowPathIcon } from './components/icons';
import { FontShowcase } from './components/FontShowcase';

// A modal for displaying a zoomable image
const ImageZoomModal: React.FC<{ imageUrl: string; onClose: () => void; }> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="relative w-full h-full" onClick={e => e.stopPropagation()}>
        <ZoomableImage
          src={imageUrl}
          alt="Zoomed preview"
          scale={scale}
          position={position}
          onScaleChange={setScale}
          onPositionChange={setPosition}
          onImageLoad={() => {}}
        />
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-slate-300" aria-label="Close zoom view">
        <XCircleIcon className="h-10 w-10" />
      </button>
    </div>
  );
};


// Component for displaying each image in the gallery
const ImageCard: React.FC<{
  imageState: ImageState;
  isSelected: boolean;
  onAnalyze: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (imageState: ImageState) => void;
  onZoom: (url: string) => void;
}> = ({ imageState, isSelected, onAnalyze, onRemove, onSelect, onZoom }) => {
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      className={`relative group bg-white rounded-lg border shadow-sm overflow-hidden transition-all duration-200 flex flex-col cursor-pointer hover:shadow-md hover:-translate-y-1 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200'}`}
      onClick={() => onSelect(imageState)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <img src={imageState.previewUrl} alt={imageState.file.name} className="w-full h-28 object-cover" />
      
      <button
        onClick={(e) => handleButtonClick(e, () => onZoom(imageState.previewUrl))}
        className="absolute top-1.5 left-1.5 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
        aria-label="Zoom image"
      >
        <MagnifyingGlassPlusIcon className="h-4 w-4" />
      </button>

      {imageState.isLoading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-2">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-xs font-semibold mt-2">Analyzing...</span>
        </div>
      )}

      {imageState.error && !imageState.isLoading && (
         <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center p-2 text-white text-center">
            <ErrorIcon className="h-5 w-5 mb-1" />
            <p className="text-xs font-bold">Analysis Failed</p>
            <p className="text-[10px] mt-1 mb-2 line-clamp-2" title={imageState.error}>{imageState.error}</p>
            <button
                onClick={(e) => handleButtonClick(e, () => onAnalyze(imageState.id))}
                className="text-xs px-3 py-1 bg-white/20 text-white font-semibold rounded-full hover:bg-white/40 transition"
            >
                Retry
            </button>
        </div>
      )}

      <div className="p-2 bg-white flex flex-col flex-grow text-center">
        <p className="text-xs font-medium text-slate-600 truncate">{imageState.file.name}</p>
        
        <div className="mt-auto pt-2 flex gap-2">
          {!imageState.result && !imageState.error ? (
            <button
              onClick={(e) => handleButtonClick(e, () => onAnalyze(imageState.id))}
              disabled={imageState.isLoading}
              className="w-full text-xs flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition"
            >
              <AnalyzeIcon className="h-3 w-3" />
              Analyze
            </button>
          ) : imageState.result ? (
            <>
              <div className="flex-1 text-center text-xs p-1.5 text-green-700 bg-green-100 font-semibold rounded-md flex items-center justify-center gap-1">
                <CheckCircleIcon className="h-4 w-4" />
                Analyzed
              </div>
              <button
                onClick={(e) => handleButtonClick(e, () => onAnalyze(imageState.id))}
                disabled={imageState.isLoading}
                className="flex-shrink-0 text-xs flex items-center justify-center gap-1 p-1.5 bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 disabled:bg-indigo-50 transition"
                title="Re-analyze"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </>
          ) : null }
        </div>
      </div>
      
      <button 
        onClick={(e) => handleButtonClick(e, () => onRemove(imageState.id))}
        className="absolute top-1.5 right-1.5 bg-black/40 text-white rounded-full p-1 hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
        aria-label="Remove image"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </div>
  );
};

const extractionOptions: { id: ExtractionMode; arabicLabel: string }[] = [
    { id: 'all', arabicLabel: 'الكل' },
    { id: 'arabic', arabicLabel: 'عربي فقط' },
    { id: 'foreign', arabicLabel: 'أجنبي فقط' },
    { id: 'numbers', arabicLabel: 'أرقام فقط' },
];
  
const ExtractionModeSelector: React.FC<{
    selectedModes: ExtractionMode[];
    onModeChange: (mode: ExtractionMode) => void;
}> = ({ selectedModes, onModeChange }) => {
    return (
      <div className="w-full mx-auto animate-fade-in" dir="rtl">
        <h3 className="text-sm font-semibold text-slate-700 text-center mb-2">
          اختر نوع النص المراد استخراجه
        </h3>
        <div className="flex flex-col sm:flex-row justify-center bg-slate-200/70 p-1 rounded-full shadow-inner gap-1">
          {extractionOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onModeChange(option.id)}
              className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
                ${selectedModes.includes(option.id)
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-transparent text-slate-600 hover:bg-slate-300/60'
                }`
              }
              aria-pressed={selectedModes.includes(option.id)}
            >
              {option.arabicLabel}
            </button>
          ))}
        </div>
      </div>
    );
};

const App: React.FC = () => {
  const [images, setImages] = useState<ImageState[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageState | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [extractionModes, setExtractionModes] = useState<ExtractionMode[]>(['all']);

  // Effect to keep selectedImage in sync with the main images array
  useEffect(() => {
    if (selectedImage) {
      const updatedVersion = images.find(img => img.id === selectedImage.id);
      if (updatedVersion && updatedVersion !== selectedImage) {
        setSelectedImage(updatedVersion);
      }
    }
  }, [images, selectedImage]);

  const handleModeChange = (mode: ExtractionMode) => {
    setExtractionModes(prevModes => {
      if (mode === 'all') return ['all'];
      let newModes = prevModes.filter(m => m !== 'all');
      if (newModes.includes(mode)) {
        newModes = newModes.filter(m => m !== mode);
      } else {
        newModes.push(mode);
      }
      if (newModes.length === 0) return ['all'];
      const granularOptions: ExtractionMode[] = ['arabic', 'foreign', 'numbers'];
      if (granularOptions.every(opt => newModes.includes(opt))) return ['all'];
      return newModes;
    });
  };
  
  const handleImageUpload = useCallback((uploads: { file: File; previewUrl: string }[]) => {
    const newImages: ImageState[] = uploads.map((upload, index) => ({
      id: `${Date.now()}-${index}`,
      file: upload.file,
      previewUrl: upload.previewUrl,
      result: null,
      isLoading: false,
      error: null,
    }));
    setImages(prev => [...prev, ...newImages]);
    // If no image is selected, select the first of the new uploads
    if (!selectedImage) {
      setSelectedImage(newImages[0]);
    }
  }, [selectedImage]);
  
  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validImageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      alert("Please upload valid image files (PNG, JPG).");
      return;
    }
    const uploads: { file: File; previewUrl: string }[] = [];
    let processedCount = 0;
    const MAX_DIMENSION = 1920; // Define a max dimension for resizing large images.

    validImageFiles.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Could not get canvas context");
            processedCount++;
            if (processedCount === validImageFiles.length) handleImageUpload(uploads);
            URL.revokeObjectURL(objectUrl);
            return;
        }

        let { width, height } = img;
        // Resize image if it's too large, preserving aspect ratio
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
                height = Math.round((height * MAX_DIMENSION) / width);
                width = MAX_DIMENSION;
            } else {
                width = Math.round((width * MAX_DIMENSION) / height);
                height = MAX_DIMENSION;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Standardize to JPEG format to ensure compatibility with the API
        const standardizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // We still need the original file for its name, so we just pass it along.
        // The mime type will be extracted from the data URL later.
        uploads.push({ file, previewUrl: standardizedDataUrl });
        
        processedCount++;
        if (processedCount === validImageFiles.length) {
          handleImageUpload(uploads);
        }
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        console.error("Failed to load image:", file.name);
        processedCount++;
        if (processedCount === validImageFiles.length) handleImageUpload(uploads);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    });
  }, [handleImageUpload]);

  const handleAnalyze = async (id: string) => {
    const imageToAnalyze = images.find(img => img.id === id);
    if (!imageToAnalyze || imageToAnalyze.isLoading) return;
    
    setImages(prev => prev.map(img => img.id === id ? { ...img, isLoading: true, error: null, result: null } : img));
    
    try {
      const dataUrlParts = imageToAnalyze.previewUrl.split(',');
      if (dataUrlParts.length !== 2) throw new Error("Invalid image data URL.");
      
      const mimeTypeMatch = dataUrlParts[0].match(/:(.*?);/);
      if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error("Could not determine image MIME type.");

      const mimeType = mimeTypeMatch[1];
      const base64Image = dataUrlParts[1];

      const analysisResult = await analyzeArabicFont(base64Image, mimeType, extractionModes);

      if (!analysisResult.words || analysisResult.words.length === 0) {
        throw new Error('Could not detect text in the image. Please try a different image.');
      }
      const updatedImage = { ...imageToAnalyze, result: analysisResult, isLoading: false, error: null };
      setImages(prev => prev.map(img => (img.id === id ? updatedImage : img)));
      // Auto-select if nothing is selected or if the currently selected image was just analyzed
      setSelectedImage(current => (!current || current.id === id) ? updatedImage : current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred.';
      setImages(prev => prev.map(img => img.id === id ? { ...img, error: errorMessage, isLoading: false } : img));
    }
  };
  
  const handleAnalyzeAll = async () => {
    setIsAnalyzingAll(true);
    const imagesToAnalyze = images.filter(img => !img.result && !img.isLoading);
    for (const image of imagesToAnalyze) {
      await handleAnalyze(image.id);
    }
    setIsAnalyzingAll(false);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    // If the removed image was the selected one, clear the selection
    if (selectedImage?.id === id) {
      setSelectedImage(images.length > 1 ? images.find(img => img.id !== id) || null : null);
    }
  };
  
  const clearAll = () => {
    setImages([]);
    setSelectedImage(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };
  
  const handleZoomChange = useCallback((id: string, newZoomState: { scale: number; position: { x: number; y: number } }) => {
    setImages(prevImages => prevImages.map(img => img.id === id ? { ...img, zoomState: newZoomState } : img));
  }, []);

  const handleDownload = (editedText: string) => {
    if (!selectedImage?.result || !selectedImage?.file) return;
    const { result, file } = selectedImage;
    const similarFontsText = result.similarFonts?.length > 0
      ? result.similarFonts.map(font => `- ${font.name}: ${font.url}`).join('\n')
      : 'No similar fonts were found.';
    const content = `Analysis Result\n================\nFile: ${file.name}\nFont: ${result.identifiedFontName}\n\nSimilar Fonts\n-------------\n${similarFontsText}\n\nExtracted Text\n--------------\n${editedText}`;
    const blob = new Blob([content.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${file.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Header />
      <main 
        className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center relative"
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-500/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl border-4 border-dashed border-white pointer-events-none">
            <UploadIcon className="h-24 w-24 text-white mb-4" />
            <p className="text-3xl font-bold text-white">Drop images to upload</p>
          </div>
        )}

        {images.length === 0 ? (
          <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-slate-200">
            <FileUpload onFilesSelected={processFiles} />
            <div className="my-6"><ExtractionModeSelector selectedModes={extractionModes} onModeChange={handleModeChange} /></div>
            <FontShowcase />
          </div>
        ) : (
          <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-6 animate-fade-in">
            <aside className="lg:w-1/3 xl:w-1/4 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-200 lg:sticky lg:top-24">
                <h2 className="text-lg font-bold text-slate-700 mb-3 text-center">Your Images ({images.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 max-h-[40vh] lg:max-h-[calc(100vh-22rem)] overflow-y-auto mb-4 p-1">
                  {images.map(img => (
                    <ImageCard key={img.id} imageState={img} isSelected={selectedImage?.id === img.id}
                      onAnalyze={handleAnalyze} onRemove={handleRemoveImage} onSelect={setSelectedImage} onZoom={setZoomedImageUrl}
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  <ExtractionModeSelector selectedModes={extractionModes} onModeChange={handleModeChange} />
                  <button onClick={handleAnalyzeAll} disabled={isAnalyzingAll || images.every(img => img.result || img.isLoading)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                    <AnalyzeIcon className="h-5 w-5" />
                    {isAnalyzingAll ? 'Analyzing...' : `Analyze Unprocessed (${images.filter(img => !img.result).length})`}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <FileUpload onFilesSelected={processFiles}>
                      <div className="w-full px-4 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 text-center cursor-pointer">Upload More</div>
                    </FileUpload>
                    <button onClick={clearAll} className="w-full px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200">Clear All</button>
                  </div>
                </div>
              </div>
            </aside>
            <section className="lg:w-2/3 xl:w-3/4 flex-grow min-h-[70vh]">
              {selectedImage ? (
                selectedImage.result ? (
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 h-full lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 overflow-hidden">
                    <ResultDisplay result={selectedImage.result} imageSrc={selectedImage.previewUrl}
                      onDownload={handleDownload} initialZoomState={selectedImage.zoomState}
                      onZoomChange={(newState) => handleZoomChange(selectedImage.id, newState)}
                    />
                  </div>
                ) : selectedImage.error ? (
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 h-full lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                      <div className="bg-red-100 p-4 rounded-full mb-4">
                          <ErrorIcon className="h-12 w-12 text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800">Analysis Failed</h3>
                      <p className="text-slate-500 mt-2 mb-6 max-w-lg">{selectedImage.error}</p>
                      <button 
                          onClick={() => handleAnalyze(selectedImage.id)} 
                          disabled={selectedImage.isLoading}
                          className="w-48 flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105 disabled:bg-indigo-300 disabled:scale-100">
                          {selectedImage.isLoading ? <Loader /> : <><ArrowPathIcon className="h-5 w-5" /> Retry Analysis</>}
                      </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 h-full lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 flex flex-col items-center justify-center p-8 text-center">
                    <img src={selectedImage.previewUrl} alt="Preview" className="max-h-60 rounded-lg mb-6 shadow-md border" />
                    <h3 className="text-2xl font-bold text-slate-700">Image Ready for Analysis</h3>
                    <p className="text-slate-500 mt-2 mb-6 max-w-md">Click the "Analyze" button to extract text, identify fonts, and get creative insights for your design.</p>
                    <button onClick={() => handleAnalyze(selectedImage.id)} disabled={selectedImage.isLoading}
                      className="w-48 flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105 disabled:bg-indigo-300 disabled:scale-100">
                      {selectedImage.isLoading ? <Loader /> : <><AnalyzeIcon className="h-5 w-5" /> Analyze Now</>}
                    </button>
                  </div>
                )
              ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 h-full lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 flex flex-col items-center justify-center p-8 text-center">
                  <AnalyzeIcon className="h-20 w-20 text-slate-300 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-700">Select an Image</h3>
                  <p className="text-slate-500 mt-2 max-w-md">Click an image from the list on the left to begin the analysis or view its details here.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
      {zoomedImageUrl && <ImageZoomModal imageUrl={zoomedImageUrl} onClose={() => setZoomedImageUrl(null)} />}
    </div>
  );
};

export default App;