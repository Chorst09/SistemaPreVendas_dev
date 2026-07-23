import { 
  ServiceDeskError, 
  ServiceDeskErrorType, 
  ServiceDeskErrorContext,
  ErrorRecoveryOption,
  ErrorHandlingConfig,
  ErrorLog,
  ErrorReporter,
  createServiceDeskError,
  getErrorRecoveryOptions
} from '../types/service-desk-errors'
import { ServiceDeskData, ValidationResult, ValidationError, ValidationWarning } from '../types/service-desk-pricing'

/**
 * Comprehensive error handling service for Service Desk Pricing System
 */
export class ServiceDeskErrorHandler implements ErrorReporter {
  private static instance: ServiceDeskErrorHandler
  private errorLog: ErrorLog[] = []
  private maxLogSize = 100
  private config: ErrorHandlingConfig = {
    enableRetry: true,
    maxRetryAttempts: 3,
    retryDelay: 1000,
    enableFallback: true,
    enableLogging: true,
    enableUserReporting: false
  }

  private constructor() {}

  static getInstance(): ServiceDeskErrorHandler {
    if (!ServiceDeskErrorHandler.instance) {
      ServiceDeskErrorHandler.instance = new ServiceDeskErrorHandler()
    }
    return ServiceDeskErrorHandler.instance
  }

  /**
   * Configure error handling behavior
   */
  configure(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Create and log a service desk error
   */
  createError(
    type: ServiceDeskErrorType,
    message: string,
    context?: ServiceDeskErrorContext,
    details?: any
  ): ServiceDeskError {
    const error = createServiceDeskError(type, message, context, details)
    
    if (this.config.enableLogging) {
      this.logError(error, context || { timestamp: new Date() })
    }

    return error
  }

  /**
   * Log error for debugging and analytics
   */
  logError(error: ServiceDeskError, context: ServiceDeskErrorContext): void {
    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      error,
      context,
      resolved: false
    }

    this.errorLog.unshift(errorLog)
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Service Desk Error:', error, context)
    }

    // In production, you might want to send to analytics service
    if (process.env.NODE_ENV === 'production' && this.config.enableUserReporting) {
      this.sendToAnalytics(error, context)
    }
  }

  /**
   * Get recent error log
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLog]
  }

  /**
   * Mark error as resolved
   */
  markErrorResolved(errorId: string, resolution: string): void {
    const errorLog = this.errorLog.find(log => log.id === errorId)
    if (errorLog) {
      errorLog.resolved = true
      errorLog.resolvedAt = new Date()
      errorLog.resolution = resolution
    }
  }

  /**
   * Clear error log
   */
  clearErrorLogs(): void {
    this.errorLog = []
  }

  /**
   * Validate service desk data comprehensively
   */
  validateServiceDeskData(data: ServiceDeskData, tabId?: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // Validate project data
      if (!data.project) {
        errors.push({
          field: 'project',
          message: 'Dados do projeto são obrigatórios',
          code: 'REQUIRED_PROJECT_DATA'
        })
      } else {
        const projectValidation = this.validateProjectData(data.project)
        errors.push(...projectValidation.errors)
        warnings.push(...projectValidation.warnings)
      }

      // Validate team data
      if (!data.team || data.team.length === 0) {
        errors.push({
          field: 'team',
          message: 'Pelo menos um membro da equipe é obrigatório',
          code: 'REQUIRED_TEAM_MEMBER'
        })
      } else {
        const teamValidation = this.validateTeamData(data.team)
        errors.push(...teamValidation.errors)
        warnings.push(...teamValidation.warnings)
      }

      // Validate schedules
      if (data.schedules && data.schedules.length > 0) {
        const scheduleValidation = this.validateScheduleData(data.schedules)
        errors.push(...scheduleValidation.errors)
        warnings.push(...scheduleValidation.warnings)
      }

      // Validate tax configuration
      if (data.taxes) {
        const taxValidation = this.validateTaxConfiguration(data.taxes)
        errors.push(...taxValidation.errors)
        warnings.push(...taxValidation.warnings)
      }

      // Validate budget consistency
      if (data.budget) {
        const budgetValidation = this.validateBudgetConsistency(data.budget, data.team, data.otherCosts)
        errors.push(...budgetValidation.errors)
        warnings.push(...budgetValidation.warnings)
      }

    } catch (error) {
      const serviceDeskError = this.createError(
        ServiceDeskErrorType.VALIDATION_ERROR,
        'Erro durante validação dos dados',
        { tabId, timestamp: new Date() },
        error
      )
      
      errors.push({
        field: 'system',
        message: serviceDeskError.message,
        code: 'VALIDATION_SYSTEM_ERROR'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate project data
   */
  private validateProjectData(project: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!project.name || project.name.trim() === '') {
      errors.push({
        field: 'project.name',
        message: 'Nome do projeto é obrigatório',
        code: 'REQUIRED_PROJECT_NAME'
      })
    }

    if (!project.client) {
      errors.push({
        field: 'project.client',
        message: 'Dados do cliente são obrigatórios',
        code: 'REQUIRED_CLIENT_DATA'
      })
    } else {
      if (!project.client.name || project.client.name.trim() === '') {
        errors.push({
          field: 'project.client.name',
          message: 'Nome do cliente é obrigatório',
          code: 'REQUIRED_CLIENT_NAME'
        })
      }

      if (project.client.email && !this.isValidEmail(project.client.email)) {
        errors.push({
          field: 'project.client.email',
          message: 'Email do cliente inválido',
          code: 'INVALID_CLIENT_EMAIL'
        })
      }

      if (project.client.phone && !this.isValidPhone(project.client.phone)) {
        warnings.push({
          field: 'project.client.phone',
          message: 'Formato do telefone pode estar incorreto'
        })
      }
    }

    if (!project.contractPeriod) {
      errors.push({
        field: 'project.contractPeriod',
        message: 'Período do contrato é obrigatório',
        code: 'REQUIRED_CONTRACT_PERIOD'
      })
    } else {
      if (!project.contractPeriod.startDate) {
        errors.push({
          field: 'project.contractPeriod.startDate',
          message: 'Data de início do contrato é obrigatória',
          code: 'REQUIRED_START_DATE'
        })
      }

      if (!project.contractPeriod.endDate) {
        errors.push({
          field: 'project.contractPeriod.endDate',
          message: 'Data de fim do contrato é obrigatória',
          code: 'REQUIRED_END_DATE'
        })
      }

      if (project.contractPeriod.startDate && project.contractPeriod.endDate) {
        const startDate = new Date(project.contractPeriod.startDate)
        const endDate = new Date(project.contractPeriod.endDate)
        
        if (startDate >= endDate) {
          errors.push({
            field: 'project.contractPeriod',
            message: 'Data de início deve ser anterior à data de fim',
            code: 'INVALID_DATE_RANGE'
          })
        }

        const durationMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        if (durationMonths < 1) {
          warnings.push({
            field: 'project.contractPeriod',
            message: 'Contrato muito curto (menos de 1 mês)'
          })
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate team data
   */
  private validateTeamData(team: any[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    team.forEach((member, index) => {
      const prefix = `team[${index}]`

      if (!member.name || member.name.trim() === '') {
        errors.push({
          field: `${prefix}.name`,
          message: `Nome do membro ${index + 1} é obrigatório`,
          code: 'REQUIRED_MEMBER_NAME'
        })
      }

      if (!member.role || member.role.trim() === '') {
        errors.push({
          field: `${prefix}.role`,
          message: `Cargo do membro ${index + 1} é obrigatório`,
          code: 'REQUIRED_MEMBER_ROLE'
        })
      }

      if (typeof member.salary !== 'number' || member.salary <= 0) {
        errors.push({
          field: `${prefix}.salary`,
          message: `Salário do membro ${index + 1} deve ser um valor positivo`,
          code: 'INVALID_SALARY'
        })
      }

      if (typeof member.workload !== 'number' || member.workload <= 0 || member.workload > 168) {
        errors.push({
          field: `${prefix}.workload`,
          message: `Carga horária do membro ${index + 1} deve estar entre 1 e 168 horas por semana`,
          code: 'INVALID_WORKLOAD'
        })
      }

      if (member.workload > 44) {
        warnings.push({
          field: `${prefix}.workload`,
          message: `Carga horária do membro ${index + 1} excede 44 horas semanais`
        })
      }

      if (member.startDate) {
        const startDate = new Date(member.startDate)
        const now = new Date()
        
        if (startDate > now) {
          warnings.push({
            field: `${prefix}.startDate`,
            message: `Data de início do membro ${index + 1} é futura`
          })
        }
      }
    })

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate schedule data
   */
  private validateScheduleData(schedules: any[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    schedules.forEach((schedule, index) => {
      const prefix = `schedules[${index}]`

      if (!schedule.name || schedule.name.trim() === '') {
        errors.push({
          field: `${prefix}.name`,
          message: `Nome da escala ${index + 1} é obrigatório`,
          code: 'REQUIRED_SCHEDULE_NAME'
        })
      }

      if (!schedule.shifts || schedule.shifts.length === 0) {
        errors.push({
          field: `${prefix}.shifts`,
          message: `Escala ${index + 1} deve ter pelo menos um turno`,
          code: 'REQUIRED_SHIFTS'
        })
      } else {
        schedule.shifts.forEach((shift: any, shiftIndex: number) => {
          const shiftPrefix = `${prefix}.shifts[${shiftIndex}]`

          if (!shift.startTime || !shift.endTime) {
            errors.push({
              field: `${shiftPrefix}.time`,
              message: `Horários do turno ${shiftIndex + 1} são obrigatórios`,
              code: 'REQUIRED_SHIFT_TIME'
            })
          }

          if (!shift.daysOfWeek || shift.daysOfWeek.length === 0) {
            errors.push({
              field: `${shiftPrefix}.daysOfWeek`,
              message: `Dias da semana do turno ${shiftIndex + 1} são obrigatórios`,
              code: 'REQUIRED_DAYS_OF_WEEK'
            })
          }
        })
      }
    })

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate tax configuration
   */
  private validateTaxConfiguration(taxes: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const taxFields = ['icms', 'pis', 'cofins', 'iss', 'ir', 'csll']
    
    taxFields.forEach(field => {
      const value = taxes[field]
      if (typeof value === 'number') {
        if (value < 0 || value > 100) {
          errors.push({
            field: `taxes.${field}`,
            message: `${field.toUpperCase()} deve estar entre 0% e 100%`,
            code: 'INVALID_TAX_RATE'
          })
        }
      }
    })

    // Check for unrealistic tax combinations
    const totalTaxRate = taxFields.reduce((sum, field) => {
      const value = taxes[field]
      return sum + (typeof value === 'number' ? value : 0)
    }, 0)

    if (totalTaxRate > 50) {
      warnings.push({
        field: 'taxes',
        message: 'Carga tributária total muito alta (acima de 50%)'
      })
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate budget consistency
   */
  private validateBudgetConsistency(budget: any, _team: any[], _otherCosts: any[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (typeof budget.totalCosts !== 'number' || budget.totalCosts <= 0) {
      errors.push({
        field: 'budget.totalCosts',
        message: 'Custo total deve ser um valor positivo',
        code: 'INVALID_TOTAL_COSTS'
      })
    }

    if (typeof budget.totalPrice !== 'number' || budget.totalPrice <= 0) {
      errors.push({
        field: 'budget.totalPrice',
        message: 'Preço total deve ser um valor positivo',
        code: 'INVALID_TOTAL_PRICE'
      })
    }

    if (budget.totalPrice && budget.totalCosts && budget.totalPrice < budget.totalCosts) {
      warnings.push({
        field: 'budget',
        message: 'Preço total é menor que o custo total (margem negativa)'
      })
    }

    // Validate margin configuration
    if (budget.margin) {
      if (budget.margin.type === 'percentage') {
        if (budget.margin.value < 0 || budget.margin.value > 100) {
          errors.push({
            field: 'budget.margin.value',
            message: 'Margem percentual deve estar entre 0% e 100%',
            code: 'INVALID_MARGIN_PERCENTAGE'
          })
        }
      } else if (budget.margin.type === 'fixed') {
        if (budget.margin.value < 0) {
          errors.push({
            field: 'budget.margin.value',
            message: 'Margem fixa deve ser um valor positivo',
            code: 'INVALID_MARGIN_FIXED'
          })
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Handle calculation errors with retry mechanism
   */
  async handleCalculationError<T>(
    operation: () => Promise<T> | T,
    context: ServiceDeskErrorContext,
    maxRetries: number = this.config.maxRetryAttempts
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.resolve(operation())
        
        // If we had previous errors but succeeded, log the recovery
        if (lastError && attempt > 0) {
          this.logError(
            this.createError(
              ServiceDeskErrorType.CALCULATION_ERROR,
              `Cálculo recuperado após ${attempt} tentativas`,
              context,
              { previousError: lastError, attempt }
            ),
            context
          )
        }
        
        return result
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)))
        }
      }
    }

    // All retries failed, create and throw service desk error
    const serviceDeskError = this.createError(
      ServiceDeskErrorType.CALCULATION_ERROR,
      `Falha no cálculo após ${maxRetries + 1} tentativas: ${lastError?.message}`,
      context,
      { originalError: lastError, attempts: maxRetries + 1 }
    )

    throw serviceDeskError
  }

  /**
   * Handle data persistence errors with fallback strategies
   */
  async handleDataPersistenceError<T>(
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>,
    context?: ServiceDeskErrorContext
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      const serviceDeskError = this.createError(
        ServiceDeskErrorType.DATA_PERSISTENCE_ERROR,
        `Erro na persistência de dados: ${(error as Error).message}`,
        context,
        error
      )

      if (fallbackOperation && this.config.enableFallback) {
        try {
          const result = await fallbackOperation()
          
          // Log successful fallback
          this.logError(
            this.createError(
              ServiceDeskErrorType.DATA_PERSISTENCE_ERROR,
              'Dados salvos usando método alternativo',
              context,
              { originalError: error, fallbackUsed: true }
            ),
            context || { timestamp: new Date() }
          )
          
          return result
        } catch (fallbackError) {
          // Both operations failed
          throw this.createError(
            ServiceDeskErrorType.DATA_PERSISTENCE_ERROR,
            'Falha na operação principal e no fallback',
            context,
            { originalError: error, fallbackError }
          )
        }
      }

      throw serviceDeskError
    }
  }

  /**
   * Get recovery options for a specific error
   */
  getRecoveryOptions(error: ServiceDeskError): ErrorRecoveryOption[] {
    return getErrorRecoveryOptions(error)
  }

  /**
   * Attempt automatic recovery for recoverable errors
   */
  async attemptRecovery(
    error: ServiceDeskError,
    recoveryAction: string,
    context?: any
  ): Promise<{ success: boolean; result?: any; newError?: ServiceDeskError }> {
    try {
      switch (recoveryAction) {
        case 'recalculate':
          return await this.recoverCalculation(error, context)
        
        case 'retry_save':
          return await this.retryDataPersistence(error, context)
        
        case 'use_defaults':
          return this.useDefaultValues(error, context)
        
        case 'fix_validation':
          return this.suggestValidationFixes(error, context)
        
        case 'clear_cache':
          return this.clearCache(error, context)
        
        case 'export_backup':
          return this.exportBackup(error, context)
        
        default:
          return {
            success: false,
            newError: this.createError(
              ServiceDeskErrorType.SYSTEM_ERROR,
              `Ação de recuperação não reconhecida: ${recoveryAction}`,
              { timestamp: new Date() }
            )
          }
      }
    } catch (recoveryError) {
      return {
        success: false,
        newError: this.createError(
          ServiceDeskErrorType.SYSTEM_ERROR,
          `Falha na tentativa de recuperação: ${(recoveryError as Error).message}`,
          { timestamp: new Date() },
          recoveryError
        )
      }
    }
  }

  /**
   * Recovery methods
   */
  private async recoverCalculation(_error: ServiceDeskError, _context: any): Promise<{ success: boolean; result?: any }> {
    return { success: false }
  }

  private async retryDataPersistence(_error: ServiceDeskError, _context: any): Promise<{ success: boolean; result?: any }> {
    return { success: false }
  }

  private useDefaultValues(_error: ServiceDeskError, _context: any): { success: boolean; result?: any } {
    return { success: false }
  }

  private suggestValidationFixes(_error: ServiceDeskError, _context: any): { success: boolean; result?: any } {
    return { success: false }
  }

  private clearCache(_error: ServiceDeskError, _context: any): { success: boolean; result?: any } {
    try {
      localStorage.clear()
      sessionStorage.clear()
      
      return { 
        success: true, 
        result: 'Cache limpo com sucesso' 
      }
    } catch (_clearError) {
      return { success: false }
    }
  }

  private exportBackup(error: ServiceDeskError, context: any): { success: boolean; result?: any } {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        error: error,
        context: context,
        data: context?.data || {}
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `service-desk-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return { 
        success: true, 
        result: 'Backup exportado com sucesso' 
      }
    } catch (exportError) {
      return { success: false }
    }
  }

  /**
   * Utility methods
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 11
  }

  private async sendToAnalytics(error: ServiceDeskError, context: ServiceDeskErrorContext): Promise<void> {
    // Implement analytics reporting
    // This would send error data to your analytics service
    console.log('Analytics reporting not implemented', { error, context })
  }
}

// Export singleton instance
export const serviceDeskErrorHandler = ServiceDeskErrorHandler.getInstance()

// Export utility functions
export const validateServiceDeskData = (data: ServiceDeskData, tabId?: string): ValidationResult => {
  return serviceDeskErrorHandler.validateServiceDeskData(data, tabId)
}

export const handleCalculationError = async <T>(
  operation: () => Promise<T> | T,
  context: ServiceDeskErrorContext,
  maxRetries?: number
): Promise<T> => {
  return serviceDeskErrorHandler.handleCalculationError(operation, context, maxRetries)
}

export const handleDataPersistenceError = async <T>(
  operation: () => Promise<T>,
  fallbackOperation?: () => Promise<T>,
  context?: ServiceDeskErrorContext
): Promise<T> => {
  return serviceDeskErrorHandler.handleDataPersistenceError(operation, fallbackOperation, context)
}