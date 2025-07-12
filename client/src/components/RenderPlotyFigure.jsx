import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

const baseURL = "http://localhost:8080";
const RenderPlotlyFigure = ({ jsonUrl }) => {
  const [plotData, setPlotData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlot = async () => {
      try {
        const response = await fetch(`${baseURL}/plotly?plotlyPath=${jsonUrl}`, {
          method: 'GET',
          mode: 'cors',
        });

        if (!response.ok) throw new Error('Failed to load plot JSON');

        const data = await response.json();
        setPlotData(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      }
    };

    fetchPlot();
  }, [jsonUrl]); // re-run if jsonUrl changes

  if (error) return <div>Error loading plot: {error}</div>;

  if (!plotData) return <div>Loading plot...</div>;

  return (
    <Plot
      data={plotData.data}
      layout={plotData.layout}
      config={plotData.config || {}}
      useResizeHandler
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default RenderPlotlyFigure;
