import React from 'react';
import { ChevronRight } from 'lucide-react';

const SKUCard = ({ sku, program, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isSelected
          ? `linear-gradient(135deg, ${program.color}20, rgba(20, 15, 45, 0.8))`
          : 'rgba(20, 15, 45, 0.4)',
        border: isSelected
          ? `1px solid ${program.color}50`
          : '1px solid rgba(139, 92, 246, 0.1)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          color: isSelected ? program.color : '#94a3b8'
        }}>
          {sku.name}
        </span>
        {isSelected && <ChevronRight size={16} style={{ color: program.color }} />}
      </div>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>
        {sku.fullName}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <span style={{
          fontSize: '12px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(139, 92, 246, 0.1)',
          color: '#94a3b8'
        }}>
          {sku.cores}
        </span>
        <span style={{
          fontSize: '12px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(139, 92, 246, 0.1)',
          color: '#94a3b8'
        }}>
          {sku.tdp}
        </span>
      </div>
    </div>
  );
};

export default SKUCard;
