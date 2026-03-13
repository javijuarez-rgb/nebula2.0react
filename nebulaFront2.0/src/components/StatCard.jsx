const StatCard = ({ title, value, color, icon }) => {
  return (
    <div 
      className="card h-100 border-0 transition-all shadow-sm" 
      style={{ 
        borderLeft: `4px solid ${color}`,
        backgroundColor: 'var(--bg-card)',
        borderRadius: '1rem'
      }}
    >
      <div className="card-body p-4">
        <h6 className="text-white opacity-50 extreme-small fw-bold text-uppercase tracking-wider mb-2">{title}</h6>
        <div className="d-flex justify-content-between align-items-center">
          <span className="fs-3 fw-bold text-white">{value}</span>
          <span style={{ color: color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;    