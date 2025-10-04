// Define the enum here to break the circular dependency.
export enum ArabicFont {
  NASKH = 'Naskh',
  RUQAH = 'Ruqah',
  DIWANI = 'Diwani',
  THULUTH = 'Thuluth',
  KUFI = 'Kufi',
  FARSI = 'Farsi',
}

export interface SimilarFont {
  name: string;
  url: string;
  source: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Word {
  text: string;
  boundingBox: BoundingBox;
}

export interface AnalysisResult {
  words: Word[];
  identifiedFontName: string;
  identifiedFontStyle: string;
  identifiedFontUrl: string | null;
  similarFonts: SimilarFont[];
  designBrief: string;
}

// Add a new type for managing individual image state
export interface ImageState {
  id: string;
  file: File;
  previewUrl: string;
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  zoomState?: {
    scale: number;
    position: { x: number; y: number };
  };
}

export type ExtractionMode = 'all' | 'arabic' | 'foreign' | 'numbers';