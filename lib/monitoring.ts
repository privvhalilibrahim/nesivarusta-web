/**
 * Monitoring & Performance Tracking
 * Production'da analytics ve performance metrikleri toplamak için
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class Monitoring {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Son 100 metrik

  /**
   * Performance metrik kaydet
   */
  trackPerformance(name: string, value: number) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
    });

    // Eski metrikleri temizle
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Development'da console'a yaz
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}ms`);
    }
  }

  /**
   * API çağrısı süresini ölç
   */
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      this.trackPerformance(`api.${name}`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackPerformance(`api.${name}.error`, duration);
      throw error;
    }
  }

  /**
   * Metrikleri getir
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Metrikleri temizle
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Ortalama süre hesapla
   */
  getAverageTime(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }
}

export const monitoring = new Monitoring();
