import React from 'react';
import { ArabicFont } from '../types';

const fontData: { name: ArabicFont; arabicName: string; className: string }[] = [
  { name: ArabicFont.NASKH, arabicName: 'نسخ', className: 'font-naskh' },
  { name: ArabicFont.RUQAH, arabicName: 'رقعة', className: 'font-ruqah' },
  { name: ArabicFont.DIWANI, arabicName: 'ديواني', className: 'font-diwani' },
  { name: ArabicFont.THULUTH, arabicName: 'ثلث', className: 'font-thuluth' },
  { name: ArabicFont.KUFI, arabicName: 'كوفي', className: 'font-kufi' },
  { name: ArabicFont.FARSI, arabicName: 'فارسي', className: 'font-farsi' },
];

const FontCard: React.FC<{ font: typeof fontData[0] }> = ({ font }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center transition-transform transform hover:scale-105 hover:shadow-md">
    <p className={`text-4xl ${font.className}`} dir="rtl">{font.arabicName}</p>
    <p className="mt-2 text-sm text-slate-600 font-semibold">{font.name}</p>
  </div>
);

export const FontShowcase: React.FC = () => {
  return (
    <div className="mt-12 animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-slate-700 mb-2">Supported Font Styles</h2>
      <p className="text-center text-slate-500 mb-8">Our AI can identify the following Arabic font styles.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {fontData.map(font => (
          <FontCard key={font.name} font={font} />
        ))}
      </div>
    </div>
  );
};
