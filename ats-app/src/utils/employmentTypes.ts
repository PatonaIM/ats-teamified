export type EmploymentType = 'fullTime' | 'partTime' | 'contract' | 'eor';

export interface EmploymentTypeConfig {
  value: EmploymentType;
  label: string;
  colors: {
    bg: string;
    border: string;
    text: string;
  };
  requiredFields: string[];
}

export const employmentTypeConfigs: Record<EmploymentType, EmploymentTypeConfig> = {
  fullTime: {
    value: 'fullTime',
    label: 'Full-Time',
    colors: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      border: 'border-orange-500',
      text: 'text-orange-700 dark:text-orange-300'
    },
    requiredFields: ['title', 'description', 'keySkills', 'experienceLevel', 'annualSalary', 'benefitsPackage']
  },
  partTime: {
    value: 'partTime',
    label: 'Part-Time',
    colors: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-500',
      text: 'text-green-700 dark:text-green-300'
    },
    requiredFields: ['title', 'description', 'keySkills', 'experienceLevel', 'hourlyRate', 'hoursPerWeek', 'maxBudget']
  },
  contract: {
    value: 'contract',
    label: 'Contract',
    colors: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-500',
      text: 'text-blue-700 dark:text-blue-300'
    },
    requiredFields: ['title', 'description', 'keySkills', 'experienceLevel', 'contractDuration', 'contractValue', 'serviceScope']
  },
  eor: {
    value: 'eor',
    label: 'EOR',
    colors: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      border: 'border-purple-500',
      text: 'text-purple-700 dark:text-purple-300'
    },
    requiredFields: ['title', 'description', 'keySkills', 'experienceLevel', 'localSalary', 'currency', 'eorServiceFee']
  }
};

export const defaultColors = {
  bg: 'bg-gray-100 dark:bg-gray-900/30',
  border: 'border-gray-500',
  text: 'text-gray-700 dark:text-gray-300'
};

export const getEmploymentTypeConfig = (type: string): EmploymentTypeConfig | undefined => {
  return employmentTypeConfigs[type as EmploymentType];
};

export const getEmploymentTypeColors = (type: string) => {
  const config = getEmploymentTypeConfig(type);
  return config ? config.colors : defaultColors;
};

export const getEmploymentTypeLabel = (type: string): string => {
  const config = getEmploymentTypeConfig(type);
  return config ? config.label : type;
};
