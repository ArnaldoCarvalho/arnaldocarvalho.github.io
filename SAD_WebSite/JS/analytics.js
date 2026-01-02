// analytics.js
import { collection, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { db } from '../firebase/firebase.js';
import { translations, setLanguage, currentLanguage } from './translations.js';

// Analytics Dashboard Module - Versão Aprimorada
class AnalyticsDashboard {
  constructor() {
    this.charts = {};
  }

  // obtem dados historico do Firebase
  async fetchAnalyticsData() {
    try {
      const q = query(collection(db, 'recommendations'), orderBy('data', 'desc'));
      const querySnapshot = await getDocs(q);
      const historico = [];
      querySnapshot.forEach((doc) => {
        historico.push({ id: doc.id, ...doc.data() });
      });
      return historico;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return [];
    }
  }

  // Set up real-time listener for analytics data
  setupRealtimeUpdates() {
    const q = query(collection(db, 'recommendations'), orderBy('data', 'desc'));
    this.unsubscribe = onSnapshot(q, (querySnapshot) => {
      const historico = [];
      querySnapshot.forEach((doc) => {
        historico.push({ id: doc.id, ...doc.data() });
      });
      this.updateCharts(historico);
    }, (error) => {
      console.error('Error listening to analytics data:', error);
    });
  }

  // Update charts with new data
  async updateCharts(historico) {
    const locais = {};
    const criterios = {};
    const feedbacks = { positivo: 0, negativo: 0, neutro: 0 };
    const successRates = {};
    const timelineData = {};

    historico.forEach(item => {
      // Count locations
      locais[item.local] = (locais[item.local] || 0) + 1;

      // Count criteria combinations
      const criterioKey = item.criterios.join(' + ');
      criterios[criterioKey] = (criterios[criterioKey] || 0) + 1;

      // Count feedbacks
      console.log('Feedback value:', item.feedback, 'type:', typeof item.feedback);
      let feedback = 'neutro';
      if (typeof item.feedback === 'string') {
        const fb = item.feedback.toLowerCase();
        if (fb === 'sim' || fb === 'positivo' || fb === 'yes' || fb === 'true') feedback = 'positivo';
        else if (fb === 'não' || fb === 'negativo' || fb === 'no' || fb === 'false') feedback = 'negativo';
        else if (fb === 'nenhum' || fb === 'neutro' || fb === 'none' || fb === 'null') feedback = 'neutro';
      } else if (typeof item.feedback === 'boolean') {
        feedback = item.feedback ? 'positivo' : 'negativo';
      } else if (typeof item.feedback === 'number') {
        if (item.feedback === 1 || item.feedback > 0) feedback = 'positivo';
        else if (item.feedback === -1 || item.feedback < 0) feedback = 'negativo';
        else feedback = 'neutro';
      } else if (item.feedback == null || item.feedback === undefined) {
        feedback = 'neutro';
      }
      feedbacks[feedback]++;

      // Calculate success rates per location
      if (!successRates[item.local]) {
        successRates[item.local] = { total: 0, positive: 0, neutro: 0 };
      }
      successRates[item.local].total++;
      (feedback === 'positivo') ? successRates[item.local].positive++ : (feedback === 'neutro') ? successRates[item.local].neutro++ : null;

      const dateObj = item.data.toDate(); // Converte de Timestamp para JS Date
      const date = dateObj.toISOString().split('T')[0];
      timelineData[date] = (timelineData[date] || 0) + 1;
    });

    const data = { locais, criterios, feedbacks, successRates, timelineData, total: historico.length };

    // Update total recommendations display
    const totalElement = document.querySelector('.alert-info p strong');
    if (totalElement) {
      totalElement.textContent = data.total;
    }

    // Destroy existing charts and re-render
    this.destroyCharts();
    this.renderLocationsChart(data.locais);
    this.renderCriteriaChart(data.criterios);
    this.renderFeedbackChart(data.feedbacks);
    this.renderTimelineChart(data.timelineData);
  }

  async getAnalyticsData() {
    const historico = await this.fetchAnalyticsData();
    const locais = {};
    const criterios = {};
    const feedbacks = { positivo: 0, negativo: 0, neutro: 0 };
    const successRates = {};
    const timelineData = {};

    historico.forEach(item => {
      // Count locations
      locais[item.local] = (locais[item.local] || 0) + 1;

      // Count criteria combinations
      const criterioKey = item.criterios.join(' + ');
      criterios[criterioKey] = (criterios[criterioKey] || 0) + 1;

      // Count feedbacks
      let feedback = 'neutro';
      if (typeof item.feedback === 'string') {
        const fb = item.feedback.toLowerCase();
        if (fb === 'sim' || fb === 'positivo' || fb === 'yes' || fb === 'true') feedback = 'positivo';
        else if (fb === 'não' || fb === 'negativo' || fb === 'no' || fb === 'false') feedback = 'negativo';
        else if (fb === 'nenhum' || fb === 'neutro' || fb === 'none' || fb === 'null') feedback = 'neutro';
      } else if (typeof item.feedback === 'boolean') {
        feedback = item.feedback ? 'positivo' : 'negativo';
      } else if (typeof item.feedback === 'number') {
        if (item.feedback === 1 || item.feedback > 0) feedback = 'positivo';
        else if (item.feedback === -1 || item.feedback < 0) feedback = 'negativo';
        else feedback = 'neutro';
      } else if (item.feedback == null || item.feedback === undefined) {
        feedback = 'neutro';
      }
      feedbacks[feedback]++;

      // Calculate success rates per location
      if (!successRates[item.local]) {
        successRates[item.local] = { total: 0, positive: 0, neutro: 0 };
      }
      successRates[item.local].total++;
      (feedback === 'positivo') ? successRates[item.local].positive++ : (feedback === 'neutro') ? successRates[item.local].neutro++ : null;

      const dateObj = item.data.toDate(); // Converte de Timestamp para JS Date
      const date = dateObj.toISOString().split('T')[0];
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
        <div class="col-lg-12 col-md-12 mb-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="card-title mb-0"><i class="fas fa-map-marker-alt"></i> ${translations[currentLanguage].locationsChartTitle}</h5>
            </div>
            <div class="card-body">
              <canvas id="locationsChart" height="300"></canvas>
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
    if (labels.length === 0) {
      ctx.parentNode.innerHTML = '<p>No data available for success rates.</p>';
      return;
    }
    const rates = labels.map(local => {
      const denominator = successRates[local].total - successRates[local].neutro;
      return denominator > 0 ? (successRates[local].positive / denominator) * 100 : 0;
    });

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
                const total = (successRates[context.label].total - successRates[context.label].neutro);
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

    const totalFeedback = feedbacks.positivo + feedbacks.negativo + feedbacks.neutro;
    if (totalFeedback === 0) {
      ctx.parentNode.innerHTML = '<p>No feedback data available.</p>';
      return;
    }

    this.charts.feedback = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [`${translations[currentLanguage].positive}`, `${translations[currentLanguage].negative}`, `${translations[currentLanguage].neutral}`],
        datasets: [{
          label: 'Feedback',
          data: [feedbacks.positivo, feedbacks.negativo, feedbacks.neutro],
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
                const total = feedbacks.positivo + feedbacks.negativo + feedbacks.neutro;
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
    analytics.setupRealtimeUpdates();
  }
});
