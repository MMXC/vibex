import React, { createContext, useContext, useCallback, forwardRef, useImperativeHandle } from 'react';
import styles from './Field.module.css';

// Field Context for standalone usage
interface FieldContextValue {
  name: string;
  value: unknown;
  error?: string;
  touched: boolean;
  disabled?: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

const FieldContext = createContext<FieldContextValue | null>(null);

// Validation Rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: unknown) => string | true;
  message?: string;
}

// Field Props
export interface FieldProps {
  /** Field name for form binding */
  name: string;
  /** Field label */
  label?: string;
  /** Hint text displayed below the field */
  hint?: string;
  /** Error message (controlled) */
  error?: string;
  /** Whether the field has been touched */
  touched?: boolean;
  /** Validation rules */
  rules?: ValidationRule[];
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required (visual indicator) */
  required?: boolean;
  /** Field layout direction */
  direction?: 'vertical' | 'horizontal';
  /** CSS class name */
  className?: string;
  /** Children render function or node */
  children?: React.ReactNode | ((props: FieldRenderProps) => React.ReactNode);
}

export interface FieldRenderProps {
  value: unknown;
  error?: string;
  touched: boolean;
  disabled?: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  name: string;
}

// Create the Field component
export const Field = forwardRef<HTMLDivElement, FieldProps>(({
  name,
  label,
  hint,
  error: controlledError,
  touched: controlledTouched,
  rules,
  disabled = false,
  required = false,
  direction = 'vertical',
  className = '',
  children,
}, ref) => {
  // Check if used within a Form context
  const formContext = useContext(FormFieldContext);
  
  const [internalTouched, setInternalTouched] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<unknown>(undefined);
  const [internalError, setInternalError] = React.useState<string>('');

  // Get values from context or internal state
  const isInForm = !!formContext;
  const value = isInForm ? formContext.value : internalValue;
  const touched = isInForm ? formContext.touched : controlledTouched ?? internalTouched;
  const error = isInForm ? formContext.error : controlledError ?? internalError;

  // Validation function
  const validate = useCallback((val: unknown, fieldRules?: ValidationRule[]): string => {
    const fieldRule = fieldRules || rules;
    if (!fieldRule) return '';

    const rule = Array.isArray(fieldRule) ? fieldRule : [fieldRule];
    
    for (const r of rule) {
      // Required validation
      if (r.required && (val === undefined || val === null || val === '')) {
        return r.message || 'This field is required';
      }
      
      // Skip other validations if empty and not required
      if (val === undefined || val === null || val === '') {
        continue;
      }

      // String validations
      if (typeof val === 'string') {
        if (r.minLength && val.length < r.minLength) {
          return r.message || `Minimum length is ${r.minLength}`;
        }
        
        if (r.maxLength && val.length > r.maxLength) {
          return r.message || `Maximum length is ${r.maxLength}`;
        }
        
        if (r.pattern && !r.pattern.test(val)) {
          return r.message || 'Invalid format';
        }
        
        if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return r.message || 'Invalid email address';
        }
      }

      // Number validations
      if (typeof val === 'number') {
        if (r.min !== undefined && val < r.min) {
          return r.message || `Minimum value is ${r.min}`;
        }
        
        if (r.max !== undefined && val > r.max) {
          return r.message || `Maximum value is ${r.max}`;
        }
      }

      // Custom validation
      if (r.custom) {
        const result = r.custom(val);
        if (result !== true) {
          return result;
        }
      }
    }
    
    return '';
  }, [rules]);

  // Handle change
  const handleChange = useCallback((newValue: unknown) => {
    if (isInForm) {
      formContext.onChange(newValue);
    } else {
      setInternalValue(newValue);
      // Validate on change if touched
      if (touched && rules) {
        const error = validate(newValue);
        setInternalError(error);
      }
    }
  }, [isInForm, formContext, touched, rules, validate]);

  // Handle blur
  const handleBlur = useCallback(() => {
    if (isInForm) {
      formContext.onBlur();
    } else {
      setInternalTouched(true);
      if (rules) {
        const error = validate(value);
        setInternalError(error);
      }
    }
  }, [isInForm, formContext, value, rules, validate]);

  // Determine if field has error
  const hasError = touched && error;

  // Check if required from rules
  const isRequired = required || rules?.some(r => r.required);

  const fieldContextValue: FieldContextValue = {
    name,
    value,
    error: hasError ? error : undefined,
    touched,
    disabled,
    onChange: handleChange,
    onBlur: handleBlur,
  };

  return (
    <FieldContext.Provider value={fieldContextValue}>
      <div
        ref={ref}
        className={`
          ${styles.field} 
          ${styles[direction]} 
          ${hasError ? styles.hasError : ''} 
          ${className}
        `}
        data-field-name={name}
      >
        {label && (
          <label htmlFor={name} className={styles.label}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.fieldContent}>
          {typeof children === 'function' ? (
            children({
              value,
              error: hasError ? error : undefined,
              touched,
              disabled,
              onChange: handleChange,
              onBlur: handleBlur,
              name,
            })
          ) : (
            children
          )}
        </div>
        {(hasError || hint) && (
          <span className={`${styles.hint} ${hasError ? styles.errorHint : ''}`}>
            {hasError ? error : hint}
          </span>
        )}
      </div>
    </FieldContext.Provider>
  );
});

// Form Field Context (used by Form.tsx)
const FormFieldContext = createContext<{
  value: unknown;
  error?: string;
  touched: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
} | null>(null);

// Export FormFieldContext for use by Form component
export { FormFieldContext };

// useField hook - for accessing field context
export const useField = (fieldName?: string) => {
  const context = useContext(FieldContext);
  
  if (!context && !fieldName) {
    // Return a no-op if no context and no name provided
    return {
      value: undefined,
      error: undefined,
      touched: false,
      disabled: false,
      onChange: () => {},
      onBlur: () => {},
    };
  }
  
  return context || {
    value: undefined,
    error: undefined,
    touched: false,
    disabled: false,
    onChange: () => {},
    onBlur: () => {},
  };
};

// Field.displayName
Field.displayName = 'Field';

export default Field;
