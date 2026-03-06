import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import styles from './Form.module.css';

// Form Context
interface FormContextValue {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldValue: (name: string, value: unknown) => void;
  setFieldError: (name: string, error: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (
    name: string,
    value: unknown,
    rules?: ValidationRule[]
  ) => string;
  resetForm: (initialValues?: Record<string, unknown>) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | true;
  message?: string;
}

export interface FieldProps {
  name: string;
  label?: string;
  hint?: string;
  rules?: ValidationRule[];
  children?:
    | React.ReactNode
    | ((props: {
        value: unknown;
        error?: string;
        onChange: (value: unknown) => void;
        onBlur: () => void;
      }) => React.ReactNode);
}

// Form Component
export interface FormProps {
  initialValues?: Record<string, unknown>;
  validationSchema?: Record<string, ValidationRule>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
  className?: string;
  children?: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({
  initialValues = {},
  validationSchema = {},
  onSubmit,
  className = '',
  children,
}) => {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setFieldTouched = useCallback((name: string, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  const validateField = useCallback(
    (name: string, value: unknown, rules?: ValidationRule[]): string => {
      const fieldRules = rules || validationSchema[name];
      if (!fieldRules) return '';

      const rule = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

      for (const r of rule) {
        if (
          r.required &&
          (value === undefined || value === null || value === '')
        ) {
          return r.message || 'This field is required';
        }

        if (
          r.minLength &&
          typeof value === 'string' &&
          value.length < r.minLength
        ) {
          return r.message || `Minimum length is ${r.minLength}`;
        }

        if (
          r.maxLength &&
          typeof value === 'string' &&
          value.length > r.maxLength
        ) {
          return r.message || `Maximum length is ${r.maxLength}`;
        }

        if (r.pattern && typeof value === 'string' && !r.pattern.test(value)) {
          return r.message || 'Invalid format';
        }

        if (r.custom) {
          const result = r.custom(value);
          if (result !== true) {
            return result;
          }
        }
      }

      return '';
    },
    [validationSchema]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const name of Object.keys(validationSchema)) {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, values, validateField]);

  const resetForm = useCallback(
    (newInitialValues?: Record<string, unknown>) => {
      setValues(newInitialValues || initialValues);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    const isValid = validateAll();

    if (isValid && onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const contextValue: FormContextValue = {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    resetForm,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        className={`${styles.form} ${className}`}
        onSubmit={handleSubmit}
        noValidate
      >
        {children}
      </form>
    </FormContext.Provider>
  );
};

// Field Component
export const Field: React.FC<FieldProps> = ({
  name,
  label,
  hint,
  rules,
  children,
}) => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Field must be used within a Form component');
  }

  const {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
  } = context;
  const error = errors[name];
  const isTouched = touched[name];
  const value = values[name];

  const handleBlur = useCallback(() => {
    setFieldTouched(name, true);
    if (rules) {
      const error = validateField(name, value, rules);
      setFieldError(name, error);
    }
  }, [name, value, rules, setFieldTouched, validateField, setFieldError]);

  const handleChange = useCallback(
    (newValue: unknown) => {
      setFieldValue(name, newValue);
      // Validate on change if already touched
      if (isTouched && rules) {
        const error = validateField(name, newValue, rules);
        setFieldError(name, error);
      }
    },
    [name, isTouched, rules, setFieldValue, validateField, setFieldError]
  );

  return (
    <div
      className={`${styles.field} ${error && isTouched ? styles.hasError : ''}`}
    >
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {rules?.some((r) => r.required) && (
            <span className={styles.required}>*</span>
          )}
        </label>
      )}
      <div className={styles.fieldContent}>
        {typeof children === 'function'
          ? children({
              value,
              error: isTouched ? error : undefined,
              onChange: handleChange,
              onBlur: handleBlur,
            })
          : children}
      </div>
      {(error && isTouched) || hint ? (
        <span
          className={`${styles.hint} ${error && isTouched ? styles.errorHint : ''}`}
        >
          {error && isTouched ? error : hint}
        </span>
      ) : null}
    </div>
  );
};

// FormField - Simple wrapper for native form elements
export interface FormFieldProps extends FieldProps {
  component?: 'input' | 'textarea' | 'select';
  type?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  hint,
  rules,
  component = 'input',
  type = 'text',
  placeholder,
  options = [],
  disabled = false,
  rows = 3,
  className,
}) => {
  return (
    <Field name={name} label={label} hint={hint} rules={rules}>
      {({ value, error, onChange, onBlur }) => {
        const inputClassName = `${styles.input} ${error ? styles.inputError : ''} ${className || ''}`;

        const handleChange = (
          e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >
        ) => {
          const newValue =
            component === 'input' && type === 'checkbox'
              ? (e.target as HTMLInputElement).checked
              : e.target.value;
          onChange(newValue);
        };

        if (component === 'textarea') {
          return (
            <textarea
              id={name}
              name={name}
              value={value as string}
              onChange={handleChange}
              onBlur={onBlur}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className={inputClassName}
            />
          );
        }

        if (component === 'select') {
          return (
            <select
              id={name}
              name={name}
              value={value as string}
              onChange={handleChange}
              onBlur={onBlur}
              disabled={disabled}
              className={inputClassName}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }

        if (type === 'checkbox') {
          return (
            <div className={styles.checkboxWrapper}>
              <input
                id={name}
                name={name}
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className={inputClassName}
              />
              {label && (
                <label htmlFor={name} className={styles.checkboxLabel}>
                  {label}
                </label>
              )}
            </div>
          );
        }

        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value as string}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
          />
        );
      }}
    </Field>
  );
};

// FormActions - Submit and reset buttons
export interface FormActionsProps {
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
  loading?: boolean;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  submitText = 'Submit',
  resetText = 'Reset',
  showReset = false,
  loading = false,
  className = '',
}) => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('FormActions must be used within a Form component');
  }

  const { resetForm } = context;

  return (
    <div className={`${styles.actions} ${className}`}>
      {showReset && (
        <button
          type="reset"
          className={styles.resetButton}
          onClick={() => resetForm()}
          disabled={loading}
        >
          {resetText}
        </button>
      )}
      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? (
          <span className={styles.spinner}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                strokeDasharray="32"
                strokeDashoffset="32"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  dur="1s"
                  repeatCount="indefinite"
                  values="32;0"
                />
              </circle>
            </svg>
          </span>
        ) : (
          submitText
        )}
      </button>
    </div>
  );
};

// useForm hook
export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a Form component');
  }
  return context;
};

// useFormContext hook - alias for useForm
export const useFormContext = useForm;

// Display names
Form.displayName = 'Form';
Field.displayName = 'Field';
FormActions.displayName = 'FormActions';

// Export
export default Form;
