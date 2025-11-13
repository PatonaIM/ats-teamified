import { Briefcase, Users, Zap, TrendingUp, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-purple/10 to-brand-blue/10 dark:from-brand-purple/20 dark:to-brand-blue/20 border border-brand-purple/20 dark:border-brand-purple/30 mb-8">
              <Sparkles className="w-4 h-4 text-brand-purple" />
              <span className="text-sm font-medium text-brand-purple dark:text-brand-purple">
                AI-Powered Hiring Intelligence
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent leading-tight">
              Multi-Employment
              <br />
              ATS Platform
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Streamline your hiring process with AI-powered job descriptions, intelligent interview questions, and real-time candidate engagement tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Intelligent Hiring,{' '}
              <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                Simplified
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to hire top talent across all employment types
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: 'AI Job Descriptions',
                description: 'Generate professional, employment type-specific job postings in seconds',
                color: 'from-brand-purple to-purple-400'
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Smart Interview Questions',
                description: 'AI-powered questions tailored to role requirements and candidate experience',
                color: 'from-brand-blue to-blue-400'
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Sentiment Analysis',
                description: 'Real-time candidate engagement tracking to prevent talent loss',
                color: 'from-purple-500 to-brand-purple'
              },
              {
                icon: <Briefcase className="w-6 h-6" />,
                title: 'Multi-Employment Support',
                description: 'Manage contract, part-time, full-time, and EOR positions seamlessly',
                color: 'from-blue-500 to-brand-blue'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employment Types Showcase */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Support All Employment Types
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Optimized workflows for every hiring scenario
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                type: 'Contract',
                color: 'bg-employment-contract',
                icon: '💼',
                description: 'Project-based hiring with milestone tracking'
              },
              {
                type: 'Part-Time',
                color: 'bg-employment-partTime',
                icon: '⏰',
                description: 'Flexible schedules and hour management'
              },
              {
                type: 'Full-Time',
                color: 'bg-employment-fullTime',
                icon: '🏢',
                description: 'Comprehensive benefits and career growth'
              },
              {
                type: 'EOR',
                color: 'bg-employment-eor',
                icon: '🌍',
                description: 'Global hiring with compliance support'
              }
            ].map((employment, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
              >
                <div className={`h-2 ${employment.color}`} />
                <div className="p-6">
                  <div className="text-4xl mb-3">{employment.icon}</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    {employment.type}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {employment.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Why Choose Our{' '}
                <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                  ATS Platform?
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Built for modern recruiting teams who demand efficiency, intelligence, and results
              </p>
              
              <div className="space-y-4">
                {[
                  'AI-powered job descriptions save 60% creation time',
                  'Real-time engagement tracking prevents candidate drop-off',
                  'LinkedIn integration with automatic posting',
                  '6-stage customizable pipeline for every job',
                  'Hiring funnel analytics for data-driven decisions',
                  'Custom SSO integration for enterprise security'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700 dark:text-gray-300">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 dark:from-brand-purple/30 dark:to-brand-blue/30 p-8 border border-brand-purple/30 dark:border-brand-purple/40">
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <Zap className="w-20 h-20 text-brand-purple mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      10x Faster Hiring
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      With AI-powered automation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-r from-brand-purple to-brand-blue p-12 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join innovative companies using AI-powered recruiting to hire top talent faster
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group px-8 py-4 bg-white text-brand-purple rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 Multi-Employment ATS Platform. Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
