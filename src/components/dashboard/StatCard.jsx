import React from 'react';
import { Link } from 'react-router-dom';
import { injectDashboardTechCss } from './dashboardTechCss.js';

injectDashboardTechCss();

const TONE_COLOR = { success: '#3DD68C', danger: '#FF6A70' };

export function StatCard({ label, value, hint, tone, to }) {
  const ref = React.useRef(null);

  function handleMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }

  const content = (
    <>
      <div className="bd-dash-stat__spotlight" />
      <div className="bd-dash-stat__label">{label}</div>
      <div className="bd-dash-stat__value" style={tone ? { color: TONE_COLOR[tone] } : undefined}>{value}</div>
      {hint && <div className="bd-dash-stat__hint">{hint}</div>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="bd-dash-stat bd-dash-stat--clickable" ref={ref} onMouseMove={handleMouseMove}>
        {content}
      </Link>
    );
  }

  return (
    <div className="bd-dash-stat" ref={ref} onMouseMove={handleMouseMove}>
      {content}
    </div>
  );
}
