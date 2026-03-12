const StatCard = ({ title, value, color, icon }) => {
  return (
    <div className="card h-100" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="card-body">
        <h6 className="text-muted small uppercase fw-bold">{title}</h6>
        <div className="d-flex justify-content-between align-items-center">
          <span className="fs-3 fw-bold">{value}</span>
          <span className="fs-4">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;    