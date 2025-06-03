import React from 'react';

const CardDashboard = ({ title, title2, text, ChartComponent }) => {
  return (
    <div
      className="card rounded-3"
      style={{ width: "100%", height: "100%" }}
    >
      <div className="card-body">
        <h4 className="card-title">{title}</h4>
        {title2 && <h1 className="card-title display-5">{title2}</h1>}
        <div className="card-subtitle text-body-tertiary">{text}</div>
        {ChartComponent && (
          <div className="chart-container mt-3">
            <ChartComponent />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDashboard;
