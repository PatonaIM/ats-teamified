import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { EmploymentType } from '../utils/employmentTypes';
import { employmentTypeConfigs } from '../utils/employmentTypes';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import JobDescriptionSelector from './JobDescriptionSelector';

type EmploymentTypeOrEmpty = EmploymentType | '';

interface PipelineStage {
  name: string;
  order: number;
}

interface JobFormData {
  title: string;
  description: string;
  keySkills: string;
  experienceLevel: string;
  department: string;
  departmentOther?: string;
  employmentType: EmploymentTypeOrEmpty;
  createdByRole: 'client' | 'recruiter';
  saveAsDraft?: boolean;
  
  city: string;
  country: string;
  remoteOk: boolean;
  salaryMin?: string;
  salaryMax?: string;
  salaryCurrency: string;
  
  contractDuration?: string;
  contractValue?: string;
  serviceScope?: string;
  deliverableMilestones?: string;
  paymentSchedule?: string;
  
  hourlyRate?: string;
  hoursPerWeek?: string;
  maxBudget?: string;
  costCenter?: string;
  
  annualSalary?: string;
  benefitsPackage?: string;
  totalCompensation?: string;
  headcountImpact?: string;
  
  localSalary?: string;
  eorServiceFee?: string;
  complianceCosts?: string;
  timezone?: string;
  remoteCapabilities?: string;
  
  pipelineStages: PipelineStage[];
}

interface JobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void;
  isSubmitting?: boolean;
  initialData?: Partial<JobFormData>;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ isOpen, onClose, onSubmit, isSubmitting = false, initialData }) => {
  const { user } = useAuth();
  
  const getDefaultPipelineStages = (): PipelineStage[] => [
    { name: 'Screening', order: 1 },
    { name: 'Shortlist', order: 2 },
    { name: 'Client Endorsement', order: 3 },
    { name: 'Client Interview', order: 4 },
    { name: 'Offer', order: 5 },
    { name: 'Offer Accepted', order: 6 }
  ];
  
  const getUserRole = (): 'client' | 'recruiter' => {
    if (!user) return 'recruiter';
    const role = user.role?.toLowerCase() || '';
    return (role === 'client_admin' || role === 'client_hr') ? 'client' : 'recruiter';
  };
  
  const getInitialFormData = (): JobFormData => ({
    title: '',
    description: '',
    keySkills: '',
    experienceLevel: '',
    department: '',
    employmentType: '',
    createdByRole: getUserRole(),
    city: '',
    country: '',
    remoteOk: false,
    salaryCurrency: 'USD',
    pipelineStages: getDefaultPipelineStages(),
    ...initialData
  });

  const [formData, setFormData] = useState<JobFormData>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [variations, setVariations] = useState<Array<{ id: string; name: string; tone: string; description: string }>>([]);
  const [partialFailure, setPartialFailure] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
      setSelectedTemplateId(null);
    } else {
      fetchTemplates();
    }
  }, [isOpen]);
  
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await fetch('/api/pipeline-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
      
      // Auto-select first non-standard template (exclude "Standard Hiring Pipeline")
      const availableTemplates = data.templates?.filter((t: Template) => t.name !== 'Standard Hiring Pipeline') || [];
      const firstTemplate = availableTemplates[0];
      if (firstTemplate) {
        setSelectedTemplateId(firstTemplate.id);
        await loadTemplateStages(firstTemplate.id);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };
  
  const loadTemplateStages = async (templateId: number) => {
    try {
      const response = await fetch(`/api/pipeline-templates/${templateId}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      
      const data = await response.json();
      const templateStages = data.stages.map((stage: any, index: number) => ({
        name: stage.stage_name,
        order: index + 1
      }));
      
      setFormData(prev => ({ ...prev, pipelineStages: templateStages }));
    } catch (error) {
      console.error('Error fetching template stages:', error);
    }
  };
  
  const handleTemplateChange = async (templateId: string) => {
    const id = parseInt(templateId);
    setSelectedTemplateId(id);
    await loadTemplateStages(id);
  };

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
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (formData.department === 'Other' && !formData.departmentOther?.trim()) newErrors.departmentOther = 'Please specify the department';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

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
      if (!formData.salaryCurrency) newErrors.salaryCurrency = 'Currency is required';
      if (!formData.eorServiceFee) newErrors.eorServiceFee = 'EOR service fee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ ...formData, saveAsDraft });
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.title?.trim()) {
      setErrors(prev => ({ ...prev, title: 'Please enter a job title first' }));
      return;
    }

    setIsGeneratingAI(true);
    setErrors(prev => ({ ...prev, description: '' }));

    try {
      console.log('[JobForm] Calling AI generation API for 3 variations...');
      const response = await apiRequest<{ 
        success: boolean; 
        variations: Array<{ id: string; name: string; tone: string; description: string }>;
        partialFailure?: boolean;
        failedCount?: number;
        message?: string;
      }>('/api/generate-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          city: formData.city,
          remoteOk: formData.remoteOk,
          keySkills: formData.keySkills,
          experienceLevel: formData.experienceLevel,
          userId: user?.id || 'anonymous'
        }),
        timeout: 60000 // 60 seconds for 3 parallel API calls
      });
      console.log('[JobForm] AI generation response received:', response);

      if (response.success && response.variations && response.variations.length > 0) {
        setVariations(response.variations);
        setPartialFailure(response.partialFailure || false);
        setFailedCount(response.failedCount || 0);
        setShowSelector(true);
      }
    } catch (error: unknown) {
      console.error('Error generating job description:', error);
      
      let errorMessage = 'Failed to generate job descriptions. Please try again or write manually.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        const err = error as { message: string; status?: number };
        if (err.status === 429) {
          errorMessage = 'Please wait 30 seconds before generating again.';
        } else if (err.status === 401) {
          errorMessage = 'API key configuration issue. Please contact system administrator.';
        } else if (err.status === 400) {
          errorMessage = 'Invalid request. Please ensure all required fields are filled.';
        } else if (err.message) {
          errorMessage = `AI generation failed: ${err.message}`;
        }
      }
      
      setErrors(prev => ({ ...prev, description: errorMessage }));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSelectDescription = (description: string) => {
    handleChange('description', description);
    setShowSelector(false);
  };

  const renderEmploymentTypeFields = () => {
    switch (formData.employmentType) {
      case 'contract':
        return (
          <div className="space-y-4 p-4 border-2 border-blue-300 bg-blue-50/30 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700 mt-2 mb-2">Contract Details</h3>
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
          </div>
        );

      case 'partTime':
        return (
          <div className="space-y-4 p-4 border-2 border-green-300 bg-green-50/30 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700 mt-2 mb-2">Part-Time Details</h3>
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
          </div>
        );

      case 'fullTime':
        return (
          <div className="space-y-4 p-4 border-2 border-orange-300 bg-orange-50/30 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-700 mt-2 mb-2">Full-Time Details</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Compensation</label>
                <input
                  type="text"
                  value={formData.totalCompensation || ''}
                  onChange={(e) => handleChange('totalCompensation', e.target.value)}
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
        );

      case 'eor':
        return (
          <div className="space-y-4 p-4 border-2 border-purple-300 bg-purple-50/30 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-700 mt-2 mb-2">EOR (Employer of Record) Details</h3>
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
                  value={formData.salaryCurrency}
                  onChange={(e) => handleChange('salaryCurrency', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.salaryCurrency ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="EUR, GBP, JPY"
                />
                {errors.salaryCurrency && <p className="text-red-500 text-sm mt-1">{errors.salaryCurrency}</p>}
              </div>
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

        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Job Title - Top Priority Field */}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Job Description*</label>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                      Generating 3 variations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </>
                  )}
                </button>
              </div>
              
              {/* HTML Preview if content exists */}
              {formData.description && (
                <div className="mb-2 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Preview:</div>
                  <div 
                    className="prose prose-sm max-w-none
                      [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mt-2 [&>h3]:mb-1
                      [&>p]:text-sm [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-2
                      [&>ul]:text-sm [&>ul]:text-gray-700 [&>ul]:my-1
                      [&>li]:ml-4 [&>li]:mb-1
                      [&>strong]:text-gray-900 [&>strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                </div>
              )}
              
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                rows={8}
                placeholder="Select an AI-generated description or write your own HTML..."
              />
              <p className="text-xs text-gray-500 mt-1">
                HTML tags supported: &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;
              </p>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type*</label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.employmentType ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isSubmitting}
              >
                <option value="">Select employment type</option>
                {Object.values(employmentTypeConfigs).map(config => (
                  <option key={config.value} value={config.value}>{config.label}</option>
                ))}
              </select>
              {errors.employmentType && <p className="text-red-500 text-sm mt-1">{errors.employmentType}</p>}
            </div>

            {/* Created By Indicator */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Created By</label>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  formData.createdByRole === 'client' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {formData.createdByRole === 'client' ? 'Client' : 'Recruiter'}
                    <span className="ml-2 text-xs font-normal text-gray-600">
                      ({user?.role || 'Unknown Role'})
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formData.createdByRole === 'client' 
                      ? '🔒 Requires manager approval before going live' 
                      : '✅ Can publish immediately without approval'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                Automatically determined from your account role
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mt-4">Additional Details</h3>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Department*</label>
              <select
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select department</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="HR">Human Resources</option>
                <option value="Other">Other</option>
              </select>
              {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
            </div>

            {formData.department === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Please specify department*</label>
                <input
                  type="text"
                  value={formData.departmentOther || ''}
                  onChange={(e) => handleChange('departmentOther', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.departmentOther ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., Customer Success, Legal, Design"
                />
                {errors.departmentOther && <p className="text-red-500 text-sm mt-1">{errors.departmentOther}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="San Francisco"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="United States"
                />
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.remoteOk}
                onChange={(e) => handleChange('remoteOk', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Remote Work Available</label>
            </div>

            {(formData.employmentType === 'fullTime' || formData.employmentType === 'eor') && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
                  <input
                    type="number"
                    value={formData.salaryMin || ''}
                    onChange={(e) => handleChange('salaryMin', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
                  <input
                    type="number"
                    value={formData.salaryMax || ''}
                    onChange={(e) => handleChange('salaryMax', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="120000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={formData.salaryCurrency}
                    onChange={(e) => handleChange('salaryCurrency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="USD"
                  />
                </div>
              </div>
            )}

            {renderEmploymentTypeFields()}

            <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Hiring Pipeline Configuration</h3>
              
              {/* Pipeline Template Selector */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                  Pipeline Template
                </label>
                <select
                  id="template"
                  value={selectedTemplateId || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={loadingTemplates}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {templates
                    .filter((template) => template.name !== 'Standard Hiring Pipeline')
                    .map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                </select>
                <p className="mt-2 text-xs text-gray-600">
                  {selectedTemplateId && templates.find(t => t.id === selectedTemplateId)?.description || 
                    'Select a pipeline template to use for this job\'s hiring workflow'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="px-6 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                )}
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                {formData.createdByRole === 'client' ? 'Submit for Approval' : 'Publish Job'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Job Description Selector Modal */}
      <JobDescriptionSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        variations={variations}
        onSelect={handleSelectDescription}
        partialFailure={partialFailure}
        failedCount={failedCount}
      />
    </div>
  );
};

export default JobForm;
