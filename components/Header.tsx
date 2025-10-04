import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-600">
          الحُس لاستخراج النصوص من الصور
        </h1>
        <p className="text-slate-500 mt-1 text-lg">AI-Powered Text & Font Recognition from Images</p>
      </div>
    </header>
  );
};
