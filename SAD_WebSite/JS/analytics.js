// Analytics Dashboard Module - Versão Aprimorada
class AnalyticsDashboard {
  constructor() {
    this.charts = {};
  }

  // chama api para obter dados historico
  async fetchAnalyticsData() {
    try {
      const response = await fetch('api.php?action=getHistorico');
      const result = await response.json();

      if (!result.success || !result.historico) {
        throw new Error('Failed to fetch analytics data');
      }
      return result.historico;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return [];
    }
  }

  async getAnalyticsData() {
    const historico = await this.fetchAnalyticsData();
    const locais = {};
    const criterios = {};
    const feedbacks = { sim: 0, não: 0, nenhum: 0 };
    const successRates = {};
    const timelineData = {};

    historico.forEach(item => {
      // Count locations
      locais[item.local] = (locais[item.local] || 0) + 1;

      // Count criteria combinations
      const criterioKey = item.criterios.join(' + ');
      criterios[criterioKey] = (criterios[criterioKey] || 0) + 1;

      // Count feedbacks
      const feedback = item.feedback ? item.feedback.toLowerCase() : 'nenhum';
      feedbacks[feedback]++;

      // Calculate success rates per location
      if (!successRates[item.local]) {
        successRates[item.local] = { total: 0, positive: 0, nenhum: 0 };
      }
      successRates[item.local].total++;
      (feedback === 'sim') ? successRates[item.local].positive++ : (feedback === 'nenhum') ? successRates[item.local].nenhum++ : null;

      // Timeline data
      const date = new Date(item.data).toISOString().split('T')[0];
      timelineData[date] = (timelineData[date] || 0) + 1;
    });

    return { locais, criterios, feedbacks, successRates, timelineData, total: historico.length };
  }

  // Render analytics dashboard
  async renderDashboard() {
    const data = await this.getAnalyticsData();
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="row mb-4">
        <div class="col-12">
          <div class="alert alert-info">
            <h6 class="alert-heading"><i class="fas fa-chart-line"></i> ${translations[currentLanguage].analyticsTitle}</h6>
            <p class="mb-0">${translations[currentLanguage].totalRecommendation}<strong>${data.total}</strong></p>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="card-title mb-0"><i class="fas fa-map-marker-alt"></i> ${translations[currentLanguage].locationsChartTitle}</h5>
            </div>
            <div class="card-body">
              <canvas id="locationsChart" height="300"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card h-100">
            <div class="card-header bg-success text-white">
              <h5 class="card-title mb-0"><i class="fas fa-trophy"></i> ${translations[currentLanguage].successRateChartTitle}</h5>
            </div>
            <div class="card-body">
              <canvas id="successRateChart" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card h-100">
            <div class="card-header bg-warning text-dark">
              <h5 class="card-title mb-0"><i class="fas fa-cogs"></i> ${translations[currentLanguage].criteriaChartTitle}</h5>
            </div>
            <div class="card-body">
              <canvas id="criteriaChart" height="300"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-6 col-md-12 mb-4">
          <div class="card h-100">
            <div class="card-header bg-info text-white">
              <h5 class="card-title mb-0"><i class="fas fa-comments"></i> ${translations[currentLanguage].feedbackChartTitle}</h5>
            </div>
            <div class="card-body">
              <canvas id="feedbackChart" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-header bg-secondary text-white">
              <h5 class="card-title mb-0"><i class="fas fa-calendar-alt"></i> ${translations[currentLanguage].timelineChartTitle}</h5>
            </div>
            <div class="card-body">
              <canvas id="timelineChart" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderLocationsChart(data.locais);
    this.renderSuccessRateChart(data.successRates);
    this.renderCriteriaChart(data.criterios);
    this.renderFeedbackChart(data.feedbacks);
    this.renderTimelineChart(data.timelineData);
  }

  renderLocationsChart(locais) {
    const ctx = document.getElementById('locationsChart');
    const sortedLocais = Object.entries(locais).sort(([,a], [,b]) => b - a);

    this.charts.locations = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedLocais.map(([key]) => key),
        datasets: [{
          label: 'Número de Recomendações',
          data: sortedLocais.map(([,value]) => value),
          backgroundColor: 'rgba(13, 110, 253, 0.8)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            callbacks: {
              label: function(context) {
                return `${translations[currentLanguage].recommendations} ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              precision: 0
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  renderSuccessRateChart(successRates) {

    const ctx = document.getElementById('successRateChart');
    const labels = Object.keys(successRates);
    const rates = labels.map(local => (successRates[local].positive / (successRates[local].total-successRates[local].nenhum)) * 100);

    const colors = [
      'rgba(25, 135, 84, 0.8)',
      'rgba(220, 53, 69, 0.8)',
      'rgba(255, 193, 7, 0.8)',
      'rgba(13, 202, 240, 0.8)',
      'rgba(111, 66, 193, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];

    this.charts.successRate = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Taxa de Sucesso (%)',
          data: rates,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '1')),
          borderWidth: 2,
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            callbacks: {
              label: function(context) {
                const total = (successRates[context.label].total - successRates[context.label].nenhum);
                const positive = successRates[context.label].positive;
                return [
                  `${translations[currentLanguage].rate}: ${context.parsed.toFixed(1)}%`,
                  `${translations[currentLanguage].positive}: ${positive}/${total}`
                ];
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  renderCriteriaChart(criterios) {
    const ctx = document.getElementById('criteriaChart');
    const topCriteria = Object.entries(criterios)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8); // Mostrar top 8

    this.charts.criteria = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topCriteria.map(([key]) => key.length > 20 ? key.substring(0, 20) + '...' : key),
        datasets: [{
          label: `${translations[currentLanguage].frequency}`,
          data: topCriteria.map(([,value]) => value),
          backgroundColor: 'rgba(255, 193, 7, 0.8)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            callbacks: {
              title: function(context) {
                return topCriteria[context[0].dataIndex][0];
              },
              label: function(context) {
                return `${translations[currentLanguage].frequency}: ${context.parsed.x}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              precision: 0
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  renderFeedbackChart(feedbacks) {
    const ctx = document.getElementById('feedbackChart');

    this.charts.feedback = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [`${translations[currentLanguage].positive}`, `${translations[currentLanguage].negative}`, `${translations[currentLanguage].none}`],
        datasets: [{
          label: 'Feedback',
          data: [feedbacks.sim, feedbacks.não, feedbacks.nenhum],
          backgroundColor: [
            'rgba(25, 135, 84, 0.8)',
            'rgba(220, 53, 69, 0.8)',
            'rgba(108, 117, 125, 0.8)'
          ],
          borderColor: [
            'rgba(25, 135, 84, 1)',
            'rgba(220, 53, 69, 1)',
            'rgba(108, 117, 125, 1)'
          ],
          borderWidth: 2,
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            callbacks: {
              label: function(context) {
                const total = feedbacks.sim + feedbacks.não + feedbacks.nenhum;
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  renderTimelineChart(timelineData) {
    const ctx = document.getElementById('timelineChart');
    const sortedDates = Object.keys(timelineData).sort();
    const cumulativeData = [];
    let cumulative = 0;

    sortedDates.forEach(date => {
      cumulative += timelineData[date];
      cumulativeData.push(cumulative);
    });

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedDates,
        datasets: [{
          label: 'Recomendações Acumuladas',
          data: cumulativeData,
          borderColor: 'rgba(108, 117, 125, 1)',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(108, 117, 125, 1)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            callbacks: {
              title: function(context) {
                return `${translations[currentLanguage].date} ${context[0].label}`;
              },
              label: function(context) {
                return `${translations[currentLanguage].cumulativeTotal} ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              precision: 0
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 7
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  // Destroy all charts
  destroyCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }
}

// Initialize analytics when page loads
document.addEventListener('DOMContentLoaded', function() {
  const analytics = new AnalyticsDashboard();
  // Expose for global access
  window.analyticsDashboard = analytics;
  // Render dashboard if container exists
  if (document.getElementById('analyticsContainer')) {
    analytics.renderDashboard();
  }
});
