import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const CarbonCreditChart = ({ 
  data, 
  title = 'Carbon Credit Trends', 
  height = 300,
  chartType = 'bar', // 'bar' or 'line'
  showLegend = true,
  showGrid = true,
  animate = true,
  timeRange = '1W'
}) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (data && data.length > 0) {
      // Process carbon credit data with time range aware formatting
      const labels = data.map(item => {
        if (item.timestamp) {
          const date = new Date(item.timestamp);
          switch (timeRange) {
            case '1D':
              return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            case '1W':
              return date.toLocaleDateString('en-US', { 
                weekday: 'short' 
              });
            case '1M':
            case '3M':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            case '1Y':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                year: '2-digit' 
              });
            default:
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
          }
        }
        if (item.date) {
          const date = new Date(item.date);
          switch (timeRange) {
            case '1D':
              return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            case '1W':
              return date.toLocaleDateString('en-US', { 
                weekday: 'short' 
              });
            case '1M':
            case '3M':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            case '1Y':
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                year: '2-digit' 
              });
            default:
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
          }
        }
        return item.time || item.period || '';
      });

      const prices = data.map(item => item.price || item.credit_price || item.value || 0);
      const volumes = data.map(item => item.volume || item.credits_issued || item.quantity || 0);
      // Project types could be used for enhanced tooltips or filtering in the future
      // const projectTypes = data.map(item => item.project_type || item.type || item.category || '');

      setChartData({
        labels,
        datasets: [
          {
            label: 'Credit Price ($)',
            data: prices,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
            yAxisID: 'y'
          },
          {
            label: 'Credits Issued',
            data: volumes,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
            yAxisID: 'y1'
          }
        ]
      });
    }
  }, [data, timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: '600'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 0) {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2
                }).format(context.parsed.y);
              } else {
                label += new Intl.NumberFormat('en-US').format(context.parsed.y);
              }
            }
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 11
          },
          color: '#6b7280'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280',
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            }).format(value);
          }
        },
        title: {
          display: true,
          text: 'Price ($)',
          font: {
            size: 12,
            weight: '600'
          },
          color: '#6b7280'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280',
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(value);
          }
        },
        title: {
          display: true,
          text: 'Credits',
          font: {
            size: 12,
            weight: '600'
          },
          color: '#6b7280'
        }
      }
    },
    animation: {
      duration: animate ? 1000 : 0,
      easing: 'easeInOutQuart'
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">🌱</div>
          <p className="text-gray-500 text-sm">No carbon credit data available</p>
        </div>
      </div>
    );
  }

  const ChartComponent = chartType === 'line' ? Line : Bar;

  return (
    <div className="w-full" style={{ height }}>
      <ChartComponent 
        ref={chartRef}
        data={chartData} 
        options={options}
        plugins={[{
          id: 'customCanvasBackgroundColor',
          beforeDraw: (chart) => {
            const { ctx } = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          }
        }]}
      />
    </div>
  );
};

export default CarbonCreditChart;
