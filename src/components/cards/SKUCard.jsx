import React from 'react';
import { ChevronRight } from 'lucide-react';

const SKUCard = ({ sku, program, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl cursor-pointer transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-br from-primary/20 to-[#140f2d]/80 border border-primary/50'
          : 'bg-[#140f2d]/40 border border-primary/10 hover:border-primary/30'}
      `}
      style={isSelected ? {
        backgroundImage: `linear-gradient(135deg, ${program.color}20, rgba(20, 15, 45, 0.8))`,
        borderColor: `${program.color}50`
      } : {}}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-lg font-bold ${isSelected ? '' : 'text-slate-400'}`}
          style={isSelected ? { color: program.color } : {}}
        >
          {sku.name}
        </span>
        {isSelected && <ChevronRight size={16} style={{ color: program.color }} />}
      </div>
      <p className="text-sm text-slate-500 m-0 mb-2">
        {sku.fullName}
      </p>
      <div className="flex gap-2">
        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-slate-400">
          {sku.cores}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-slate-400">
          {sku.tdp}
        </span>
      </div>
    </div>
  );
};

export default SKUCard;
