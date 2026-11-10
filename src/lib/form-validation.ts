/**
 * Form Validation Helpers
 * Sistema de validação não-bloqueante para formulários
 */

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
};

export type FieldValidator = (value: any) => string | null;

// ============================================================================
// VALIDATORS BÁSICOS
// ============================================================================

export const validators = {
  required: (message = 'Este campo é obrigatório'): FieldValidator => {
    return (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    };
  },

  minLength: (min: number, message?: string): FieldValidator => {
    return (value) => {
      if (typeof value === 'string' && value.length < min) {
        return message || `Mínimo de ${min} caracteres`;
      }
      return null;
    };
  },

  maxLength: (max: number, message?: string): FieldValidator => {
    return (value) => {
      if (typeof value === 'string' && value.length > max) {
        return message || `Máximo de ${max} caracteres`;
      }
      return null;
    };
  },

  min: (min: number, message?: string): FieldValidator => {
    return (value) => {
      const num = Number(value);
      if (!isNaN(num) && num < min) {
        return message || `Valor mínimo é ${min}`;
      }
      return null;
    };
  },

  max: (max: number, message?: string): FieldValidator => {
    return (value) => {
      const num = Number(value);
      if (!isNaN(num) && num > max) {
        return message || `Valor máximo é ${max}`;
      }
      return null;
    };
  },

  email: (message = 'E-mail inválido'): FieldValidator => {
    return (value) => {
      if (typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return message;
        }
      }
      return null;
    };
  },

  phone: (message = 'Telefone inválido'): FieldValidator => {
    return (value) => {
      if (typeof value === 'string') {
        const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
        if (!phoneRegex.test(value.replace(/\D/g, ''))) {
          return message;
        }
      }
      return null;
    };
  },

  cnpj: (message = 'CNPJ inválido'): FieldValidator => {
    return (value) => {
      if (typeof value === 'string') {
        const cnpj = value.replace(/\D/g, '');
        if (cnpj.length !== 14) {
          return message;
        }
        // Validação básica de CNPJ
        if (/^(\d)\1+$/.test(cnpj)) {
          return message;
        }
      }
      return null;
    };
  },

  cpf: (message = 'CPF inválido'): FieldValidator => {
    return (value) => {
      if (typeof value === 'string') {
        const cpf = value.replace(/\D/g, '');
        if (cpf.length !== 11) {
          return message;
        }
        // Validação básica de CPF
        if (/^(\d)\1+$/.test(cpf)) {
          return message;
        }
      }
      return null;
    };
  },

  url: (message = 'URL inválida'): FieldValidator => {
    return (value) => {
      if (typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          return message;
        }
      }
      return null;
    };
  },

  pattern: (regex: RegExp, message = 'Formato inválido'): FieldValidator => {
    return (value) => {
      if (typeof value === 'string' && !regex.test(value)) {
        return message;
      }
      return null;
    };
  },

  custom: (validatorFn: (value: any) => boolean, message: string): FieldValidator => {
    return (value) => {
      if (!validatorFn(value)) {
        return message;
      }
      return null;
    };
  },
};

// ============================================================================
// VALIDAÇÃO DE FORMULÁRIO
// ============================================================================

export function validateForm(
  data: Record<string, any>,
  rules: Record<string, FieldValidator[]>
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  Object.keys(rules).forEach((fieldName) => {
    const fieldValidators = rules[fieldName];
    const fieldValue = data[fieldName];

    for (const validator of fieldValidators) {
      const error = validator(fieldValue);
      if (error) {
        errors[fieldName] = error;
        break; // Para no primeiro erro
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// VALIDAÇÃO NÃO-BLOQUEANTE
// ============================================================================

export function validateField(
  value: any,
  validators: FieldValidator[],
  mode: 'error' | 'warning' = 'error'
): { error?: string; warning?: string } {
  for (const validator of validators) {
    const message = validator(value);
    if (message) {
      return mode === 'error' ? { error: message } : { warning: message };
    }
  }
  return {};
}

// ============================================================================
// HELPERS PARA VALIDAÇÃO EM TEMPO REAL
// ============================================================================

export function createFieldValidation(validators: FieldValidator[]) {
  return {
    validate: (value: any) => validateField(value, validators),
    required: validators.some((v) => v.toString().includes('obrigatório')),
  };
}

// ============================================================================
// MÁSCARAS COMUNS
// ============================================================================

export const masks = {
  phone: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  },

  cnpj: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  },

  cpf: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  cep: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  },

  currency: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = Number(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  },

  percentage: (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return `${numbers}%`;
  },
};
