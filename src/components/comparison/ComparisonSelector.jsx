import React, { useState } from 'react';
import { ChevronDown, Gamepad2, Cpu, GitBranch } from 'lucide-react';
import { programs, builds, games, getSteamImageUrl } from '../../data';

const Dropdown = ({ label, icon: Icon, value, options, onChange, renderOption, color = '#a855f7' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px'
      }}>
        <Icon size={12} style={{ color }} />
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: '10px',
          border: `1px solid ${color}30`,
          background: 'rgba(20, 15, 45, 0.8)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: 500 }}>
          {renderOption ? renderOption(value) : value}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'rgba(20, 15, 45, 0.98)',
            border: `1px solid ${color}30`,
            borderRadius: '10px',
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 101,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            {options.map((option, i) => (
              <div
                key={i}
                onClick={() => { onChange(option); setIsOpen(false); }}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: i < options.length - 1 ? '1px solid rgba(139, 92, 246, 0.1)' : 'none',
                  background: (renderOption ? renderOption(option) : option) === (renderOption ? renderOption(value) : value)
                    ? `${color}20`
                    : 'transparent',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${color}15`}
                onMouseLeave={(e) => e.currentTarget.style.background = 
                  (renderOption ? renderOption(option) : option) === (renderOption ? renderOption(value) : value) ? `${color}20` : 'transparent'
                }
              >
                <span style={{ fontSize: '14px', color: '#e2e8f0' }}>
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
    <div style={{
      background: `linear-gradient(135deg, ${color}10, rgba(15, 10, 35, 0.9))`,
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${color}30`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color
        }} />
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {side}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px'
      }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Selected</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {game.steamId ? (
            <img
              src={getSteamImageUrl(game.steamId, 'header')}
              alt={game.name}
              style={{
                width: '60px',
                height: '28px',
                borderRadius: '6px',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '60px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              {game.fallback || '🎮'}
            </div>
          )}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>
              {game.name}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              {sku.name} · Build {build}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonSelector;
