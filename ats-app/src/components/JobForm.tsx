import React, { useState } from 'react';
import { X } from 'lucide-react';

type EmploymentType = 'fullTime' | 'partTime' | 'contract' | 'eor' | '';

interface JobFormData {
  title: string;
  description: string;
  keySkills: string;
  experienceLevel: string;
  companyInfo: string;
  specialRequirements: string;
  employmentType: EmploymentType;
  
  contractDuration?: string;
  contractValue?: string;
  serviceScope?: string;
  deliverableMilestones?: string;
  paymentSchedule?: string;
  legalReviewRequired?: boolean;
  
  hourlyRate?: string;
  hoursPerWeek?: string;
  maxBudget?: string;
  costCenter?: string;
  durationType?: string;
  
  annualSalary?: string;
  benefitsPackage?: string;
  totalCost?: string;
  budgetYear?: string;
  headcountImpact?: string;
  performanceExpectations?: string;
  
  localSalary?: string;
  localBenefits?: string;
  eorServiceFee?: string;
  complianceCosts?: string;
  currency?: string;
  timezone?: string;
  remoteCapabilities?: string;
}

interface JobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void;
}

const JobForm: React.FC<JobFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    keySkills: '',
    experienceLevel: '',
    companyInfo: '',
    specialRequirements: '',
    employmentType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof JobFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
    if (!formData.keySkills.trim()) newErrors.keySkills = 'Key skills are required';
    if (!formData.experienceLevel.trim()) newErrors.experienceLevel = 'Experience level is required';

    if (formData.employmentType === 'contract') {
      if (!formData.contractDuration) newErrors.contractDuration = 'Contract duration is required';
      if (!formData.contractValue) newErrors.contractValue = 'Contract value is required';
      if (!formData.serviceScope) newErrors.serviceScope = 'Service scope is required';
    }

    if (formData.employmentType === 'partTime') {
      if (!formData.hourlyRate) newErrors.hourlyRate = 'Hourly rate is required';
      if (!formData.hoursPerWeek) newErrors.hoursPerWeek = 'Hours per week is required';
      if (!formData.maxBudget) newErrors.maxBudget = 'Maximum budget is required';
    }

    if (formData.employmentType === 'fullTime') {
      if (!formData.annualSalary) newErrors.annualSalary = 'Annual salary is required';
      if (!formData.benefitsPackage) newErrors.benefitsPackage = 'Benefits package is required';
    }

    if (formData.employmentType === 'eor') {
      if (!formData.localSalary) newErrors.localSalary = 'Local salary is required';
      if (!formData.currency) newErrors.currency = 'Currency is required';
      if (!formData.eorServiceFee) newErrors.eorServiceFee = 'EOR service fee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderEmploymentTypeFields = () => {
    switch (formData.employmentType) {
      case 'contract':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Contract Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Duration* <span className="text-gray-500">(months)</span>
                </label>
                <input
                  type="text"
                  value={formData.contractDuration || ''}
                  onChange={(e) => handleChange('contractDuration', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.contractDuration ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 6, 12, 24"
                />
                {errors.contractDuration && <p className="text-red-500 text-sm mt-1">{errors.contractDuration}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Contract Value*</label>
                <input
                  type="text"
                  value={formData.contractValue || ''}
                  onChange={(e) => handleChange('contractValue', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.contractValue ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="$50,000"
                />
                {errors.contractValue && <p className="text-red-500 text-sm mt-1">{errors.contractValue}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Scope Definition*</label>
              <textarea
                value={formData.serviceScope || ''}
                onChange={(e) => handleChange('serviceScope', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.serviceScope ? 'border-red-500' : 'border-gray-300'}`}
                rows={3}
                placeholder="Define the scope of services to be delivered"
              />
              {errors.serviceScope && <p className="text-red-500 text-sm mt-1">{errors.serviceScope}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deliverable Milestones</label>
              <textarea
                value={formData.deliverableMilestones || ''}
                onChange={(e) => handleChange('deliverableMilestones', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="Milestone 1: ..., Milestone 2: ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Schedule</label>
              <input
                type="text"
                value={formData.paymentSchedule || ''}
                onChange={(e) => handleChange('paymentSchedule', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Monthly, upon milestones"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.legalReviewRequired || false}
                onChange={(e) => handleChange('legalReviewRequired', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Legal Review Required</label>
            </div>
          </div>
        );

      case 'partTime':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Part-Time Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate*</label>
                <input
                  type="text"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => handleChange('hourlyRate', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.hourlyRate ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="$45/hour"
                />
                {errors.hourlyRate && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Hours per Week*</label>
                <input
                  type="text"
                  value={formData.hoursPerWeek || ''}
                  onChange={(e) => handleChange('hoursPerWeek', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.hoursPerWeek ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="20"
                />
                {errors.hoursPerWeek && <p className="text-red-500 text-sm mt-1">{errors.hoursPerWeek}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Budget Allocation*</label>
                <input
                  type="text"
                  value={formData.maxBudget || ''}
                  onChange={(e) => handleChange('maxBudget', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.maxBudget ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="$50,000/year"
                />
                {errors.maxBudget && <p className="text-red-500 text-sm mt-1">{errors.maxBudget}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Cost Center</label>
                <input
                  type="text"
                  value={formData.costCenter || ''}
                  onChange={(e) => handleChange('costCenter', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Engineering - CC-001"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration Type</label>
              <select
                value={formData.durationType || ''}
                onChange={(e) => handleChange('durationType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select duration type</option>
                <option value="fixed">Fixed-term</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
          </div>
        );

      case 'fullTime':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Full-Time Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Salary*</label>
                <input
                  type="text"
                  value={formData.annualSalary || ''}
                  onChange={(e) => handleChange('annualSalary', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.annualSalary ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="$120,000"
                />
                {errors.annualSalary && <p className="text-red-500 text-sm mt-1">{errors.annualSalary}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost of Employment</label>
                <input
                  type="text"
                  value={formData.totalCost || ''}
                  onChange={(e) => handleChange('totalCost', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="$156,000 (including overhead)"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits Package Details*</label>
              <textarea
                value={formData.benefitsPackage || ''}
                onChange={(e) => handleChange('benefitsPackage', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.benefitsPackage ? 'border-red-500' : 'border-gray-300'}`}
                rows={3}
                placeholder="Health insurance, 401k matching, PTO, etc."
              />
              {errors.benefitsPackage && <p className="text-red-500 text-sm mt-1">{errors.benefitsPackage}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Year Allocation</label>
                <input
                  type="text"
                  value={formData.budgetYear || ''}
                  onChange={(e) => handleChange('budgetYear', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Headcount Impact</label>
                <input
                  type="text"
                  value={formData.headcountImpact || ''}
                  onChange={(e) => handleChange('headcountImpact', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 Engineering"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Performance Expectations</label>
              <textarea
                value={formData.performanceExpectations || ''}
                onChange={(e) => handleChange('performanceExpectations', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="Key performance indicators and goals"
              />
            </div>
          </div>
        );

      case 'eor':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">EOR (Employer of Record) Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local Salary*</label>
                <input
                  type="text"
                  value={formData.localSalary || ''}
                  onChange={(e) => handleChange('localSalary', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.localSalary ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="80,000"
                />
                {errors.localSalary && <p className="text-red-500 text-sm mt-1">{errors.localSalary}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency*</label>
                <input
                  type="text"
                  value={formData.currency || ''}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.currency ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="EUR, GBP, JPY"
                />
                {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Benefits (Country-Specific)</label>
              <textarea
                value={formData.localBenefits || ''}
                onChange={(e) => handleChange('localBenefits', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="Health insurance, pension, mandatory benefits"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EOR Service Fee*</label>
                <input
                  type="text"
                  value={formData.eorServiceFee || ''}
                  onChange={(e) => handleChange('eorServiceFee', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.eorServiceFee ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="10% of salary"
                />
                {errors.eorServiceFee && <p className="text-red-500 text-sm mt-1">{errors.eorServiceFee}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Costs</label>
                <input
                  type="text"
                  value={formData.complianceCosts || ''}
                  onChange={(e) => handleChange('complianceCosts', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Legal, taxes, local employment law"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={formData.timezone || ''}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="UTC+1, PST, JST"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remote Work Capabilities</label>
                <select
                  value={formData.remoteCapabilities || ''}
                  onChange={(e) => handleChange('remoteCapabilities', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="full">Fully Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite Required</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Create New Job
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type*</label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.employmentType ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select employment type</option>
                <option value="fullTime">Full-Time</option>
                <option value="partTime">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="eor">EOR (Employer of Record)</option>
              </select>
              {errors.employmentType && <p className="text-red-500 text-sm mt-1">{errors.employmentType}</p>}
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Common Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title*</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Senior Software Engineer"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description*</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                rows={4}
                placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Skills*</label>
                <input
                  type="text"
                  value={formData.keySkills}
                  onChange={(e) => handleChange('keySkills', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.keySkills ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="React, TypeScript, Node.js"
                />
                {errors.keySkills && <p className="text-red-500 text-sm mt-1">{errors.keySkills}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level*</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleChange('experienceLevel', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.experienceLevel ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead/Principal</option>
                  <option value="executive">Executive</option>
                </select>
                {errors.experienceLevel && <p className="text-red-500 text-sm mt-1">{errors.experienceLevel}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Information</label>
              <textarea
                value={formData.companyInfo}
                onChange={(e) => handleChange('companyInfo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="Brief overview of the company and team culture"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => handleChange('specialRequirements', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="Security clearance, certifications, etc."
              />
            </div>

            {renderEmploymentTypeFields()}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
