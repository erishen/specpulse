import React, { useState } from 'react';
import { SpecRenderer } from './SpecRenderer.js';
import type { UISpec } from './types.js';
import landingSpec from './pages/landing.json';
import dashboardSpec from './pages/dashboard.json';
import settingsSpec from './pages/settings.json';

const PAGES: Record<string, UISpec> = {
  '产品落地页': landingSpec as UISpec,
  '数据仪表盘': dashboardSpec as UISpec,
  '设置页面': settingsSpec as UISpec,
};

export default function DynamicApp() {
  const [currentPage, setCurrentPage] = useState(Object.keys(PAGES)[0]);
  const spec = PAGES[currentPage];

  return (
    <div>
      {/* Page selector bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>
          JSON 页面：
        </span>
        {Object.keys(PAGES).map((name) => (
          <button
            key={name}
            onClick={() => setCurrentPage(name)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: currentPage === name ? '#667eea' : '#e2e8f0',
              background: currentPage === name
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#fff',
              color: currentPage === name ? '#fff' : '#374151',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {name}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
          数据驱动 · 从 JSON 渲染
        </span>
      </div>

      {/* Render the selected page */}
      <SpecRenderer spec={spec} />
    </div>
  );
}
