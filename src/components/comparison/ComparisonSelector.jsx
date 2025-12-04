import React, { useState } from 'react';
import { ChevronDown, Gamepad2, Cpu, GitBranch } from 'lucide-react';
import { programs, builds, games, getGameImageUrl } from '../../data';

const Dropdown = ({ label, icon: Icon, value, options, onChange, renderOption, color = '#a855f7' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
        <Icon size={12} style={{ color }} />
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border bg-[#140f2d]/80 cursor-pointer transition-all duration-200"
        style={{ borderColor: `${color}30` }}
      >
        <span className="text-sm text-slate-50 font-medium">
          {renderOption ? renderOption(value) : value}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-[#140f2d]/98 border rounded-xl max-h-60 overflow-y-auto z-[51] shadow-2xl"
            style={{ borderColor: `${color}30` }}
          >
            {options.map((option, i) => (
              <div
                key={i}
                onClick={() => { onChange(option); setIsOpen(false); }}
                className={`
                  px-3 py-2.5 cursor-pointer transition-colors duration-150
                  ${i < options.length - 1 ? 'border-b border-primary/10' : ''}
                `}
                style={{
                  background: (renderOption ? renderOption(option) : option) === (renderOption ? renderOption(value) : value)
                    ? `${color}20`
                    : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${color}15`}
                onMouseLeave={(e) => e.currentTarget.style.background =
                  (renderOption ? renderOption(option) : option) === (renderOption ? renderOption(value) : value) ? `${color}20` : 'transparent'
                }
              >
                <span className="text-sm text-slate-200">
                  {renderOption ? renderOption(option) : option}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ComparisonSelector = ({ side, selection, onChange, color }) => {
  const { program, sku, build, game } = selection;

  const handleProgramChange = (newProgram) => {
    onChange({
      program: newProgram,
      sku: newProgram.skus[0],
      build,
      game
    });
  };

  const handleSkuChange = (newSku) => {
    onChange({ ...selection, sku: newSku });
  };

  const handleBuildChange = (newBuild) => {
    onChange({ ...selection, build: newBuild });
  };

  const handleGameChange = (newGame) => {
    onChange({ ...selection, game: newGame });
  };

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: `linear-gradient(135deg, ${color}10, rgba(15, 10, 35, 0.9))`,
        borderColor: `${color}30`
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>
          {side}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Program */}
        <Dropdown
          label="Program"
          icon={Cpu}
          value={program}
          options={programs}
          onChange={handleProgramChange}
          renderOption={(p) => `${p.icon} ${p.name}`}
          color={color}
        />

        {/* SKU */}
        <Dropdown
          label="SKU"
          icon={Cpu}
          value={sku}
          options={program.skus}
          onChange={handleSkuChange}
          renderOption={(s) => `${s.name} - ${s.cores}`}
          color={color}
        />

        {/* Build */}
        <Dropdown
          label="Build"
          icon={GitBranch}
          value={build}
          options={builds}
          onChange={handleBuildChange}
          color={color}
        />

        {/* Game */}
        <Dropdown
          label="Game"
          icon={Gamepad2}
          value={game}
          options={games}
          onChange={handleGameChange}
          renderOption={(g) => g.name}
          color={color}
        />
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-black/30 rounded-xl">
        <div className="text-xs text-slate-500 mb-2">Selected</div>
        <div className="flex items-center gap-3">
          {getGameImageUrl(game) ? (
            <img
              src={getGameImageUrl(game, 'header')}
              alt={game.name}
              className="w-[60px] h-7 rounded-md object-cover"
            />
          ) : (
            <div className="w-[60px] h-7 rounded-md bg-primary/20 flex items-center justify-center text-sm">
              🎮
            </div>
          )}
          <div>
            <div className="text-[15px] font-semibold text-slate-50">
              {game.name}
            </div>
            <div className="text-[13px] text-slate-400">
              {sku.name} · Build {build}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonSelector;
