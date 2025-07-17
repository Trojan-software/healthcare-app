/**
 * Comprehensive Error Handling System
 * Replaces console.error with structured error logging
 */

export interface ErrorReport {
  timestamp: string;
  component: string;
  operation: string;
  error: Error;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

class ErrorHandler {
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;

  logError(
    component: string,
    operation: string,
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>
  ): void {
    const errorReport: ErrorReport = {
      timestamp: new Date().toISOString(),
      component,
      operation,
      error,
      severity,
      context
    };

    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] ${component} - ${operation}:`, error);
      if (context) {
        console.error('Context:', context);
      }
    }

    // Handle critical errors
    if (severity === 'critical') {
      this.handleCriticalError(errorReport);
    }
  }

  private handleCriticalError(errorReport: ErrorReport): void {
    // In production, you could send to error tracking service
    // For now, we'll store in localStorage for debugging
    try {
      const criticalErrors = JSON.parse(localStorage.getItem('criticalErrors') || '[]');
      criticalErrors.push(errorReport);
      localStorage.setItem('criticalErrors', JSON.stringify(criticalErrors.slice(-10)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  getErrorQueue(): ErrorReport[] {
    return [...this.errorQueue];
  }

  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  exportErrorReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.errorQueue.length,
      errorsByComponent: this.groupErrorsByComponent(),
      errorsBySeverity: this.groupErrorsBySeverity(),
      recentErrors: this.errorQueue.slice(-10)
    };

    return JSON.stringify(report, null, 2);
  }

  private groupErrorsByComponent(): Record<string, number> {
    return this.errorQueue.reduce((acc, error) => {
      acc[error.component] = (acc[error.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupErrorsBySeverity(): Record<string, number> {
    return this.errorQueue.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const errorHandler = new ErrorHandler();

// Helper functions for common error scenarios
export const handleApiError = (component: string, operation: string, error: Error, context?: Record<string, any>) => {
  errorHandler.logError(component, operation, error, 'high', context);
};

export const handleComponentError = (component: string, operation: string, error: Error, context?: Record<string, any>) => {
  errorHandler.logError(component, operation, error, 'medium', context);
};

export const handleDeviceError = (component: string, operation: string, error: Error, context?: Record<string, any>) => {
  errorHandler.logError(component, operation, error, 'high', context);
};

export const handleCriticalError = (component: string, operation: string, error: Error, context?: Record<string, any>) => {
  errorHandler.logError(component, operation, error, 'critical', context);
};