import { Briefcase, Users, Zap, TrendingUp, CheckCircle, ArrowRight, Sparkles, Clock, Target, BarChart3, Shield, Rocket, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-purple/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl animate-float" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-purple/10 via-brand-blue/10 to-brand-purple/10 dark:from-brand-purple/20 dark:via-brand-blue/20 dark:to-brand-purple/20 border border-brand-purple/20 dark:border-brand-purple/30 mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-up">
              <Sparkles className="w-4 h-4 text-brand-purple animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                AI-Powered Hiring Intelligence
              </span>
              <Star className="w-4 h-4 text-brand-blue animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-brand-purple via-purple-500 to-brand-blue bg-clip-text text-transparent leading-tight tracking-tight animate-gradient animate-slide-up delay-100">
              Multi-Employment
              <br />
              ATS Platform
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-medium animate-slide-up delay-200">
              Streamline your hiring process with AI-powered job descriptions, intelligent interview questions, and real-time candidate engagement tracking.
            </p>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 mb-12 text-sm text-gray-600 dark:text-gray-400 animate-slide-up delay-300">
              <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-bounce-subtle" />
                <span className="font-semibold">4.9/5 Rating</span>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                <Users className="w-4 h-4 text-brand-purple animate-bounce-subtle" style={{ animationDelay: '0.3s' }} />
                <span className="font-semibold">10,000+ Recruiters</span>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                <Zap className="w-4 h-4 text-brand-blue animate-bounce-subtle" style={{ animationDelay: '0.6s' }} />
                <span className="font-semibold">60% Faster Hiring</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-400">
              <button 
                onClick={() => navigate('/jobs')}
                className="group relative px-8 py-4 bg-gradient-to-r from-brand-purple via-purple-500 to-brand-blue text-white rounded-xl font-semibold text-lg shadow-[0_4px_20px_rgba(161,106,232,0.4)] hover:shadow-[0_8px_30px_rgba(161,106,232,0.6)] transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden hover:scale-105 animate-gradient"
              >
                <span className="relative z-10">View Jobs</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <button className="group px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-purple/50 dark:hover:border-brand-purple/50 hover:scale-105">
                Watch Demo
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Active Recruiters', icon: <Users className="w-6 h-6" />, delay: '0s' },
              { value: '500K+', label: 'Candidates Hired', icon: <Target className="w-6 h-6" />, delay: '0.1s' },
              { value: '60%', label: 'Time Saved', icon: <Clock className="w-6 h-6" />, delay: '0.2s' },
              { value: '95%', label: 'Satisfaction Rate', icon: <Star className="w-6 h-6" />, delay: '0.3s' }
            ].map((stat, index) => (
              <div key={index} className="text-center group hover:scale-110 transition-all duration-500 animate-scale-in" style={{ animationDelay: stat.delay }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 text-brand-purple mb-3 group-hover:shadow-lg transition-all duration-300 group-hover:rotate-12">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent mb-1 animate-gradient">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block px-4 py-2 rounded-full bg-brand-purple/10 dark:bg-brand-purple/20 border border-brand-purple/20 mb-4 animate-bounce-subtle">
              <span className="text-sm font-semibold text-brand-purple">FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              Intelligent Hiring,{' '}
              <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent animate-gradient">
                Simplified
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to hire top talent across all employment types
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Sparkles className="w-7 h-7" />,
                title: 'AI Job Descriptions',
                description: 'Generate professional, employment type-specific job postings in seconds',
                color: 'from-brand-purple to-purple-400',
                gradient: 'from-brand-purple/5 to-purple-400/5',
                delay: '0s'
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Smart Interview Questions',
                description: 'AI-powered questions tailored to role requirements and candidate experience',
                color: 'from-brand-blue to-blue-400',
                gradient: 'from-brand-blue/5 to-blue-400/5',
                delay: '0.1s'
              },
              {
                icon: <TrendingUp className="w-7 h-7" />,
                title: 'Sentiment Analysis',
                description: 'Real-time candidate engagement tracking to prevent talent loss',
                color: 'from-purple-500 to-brand-purple',
                gradient: 'from-purple-500/5 to-brand-purple/5',
                delay: '0.2s'
              },
              {
                icon: <Briefcase className="w-7 h-7" />,
                title: 'Multi-Employment',
                description: 'Manage contract, part-time, full-time, and EOR positions seamlessly',
                color: 'from-blue-500 to-brand-blue',
                gradient: 'from-blue-500/5 to-brand-blue/5',
                delay: '0.3s'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-slide-up cursor-pointer"
                style={{ animationDelay: feature.delay }}
              >
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute inset-[1px] rounded-2xl bg-white dark:bg-gray-800" />
                
                <div className="relative">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-5 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 animate-float-slow`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-brand-purple transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employment Types Showcase */}
      <section className="py-24 px-6 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block px-4 py-2 rounded-full bg-brand-blue/10 dark:bg-brand-blue/20 border border-brand-blue/20 mb-4 animate-bounce-subtle" style={{ animationDelay: '0.2s' }}>
              <span className="text-sm font-semibold text-brand-blue">EMPLOYMENT TYPES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
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
                borderColor: 'border-employment-contract',
                icon: '💼',
                description: 'Project-based hiring with milestone tracking',
                features: ['Milestone tracking', 'Flexible contracts', 'Payment schedules'],
                delay: '0s'
              },
              {
                type: 'Part-Time',
                color: 'bg-employment-partTime',
                borderColor: 'border-employment-partTime',
                icon: '⏰',
                description: 'Flexible schedules and hour management',
                features: ['Hour tracking', 'Shift scheduling', 'Flexible hours'],
                delay: '0.1s'
              },
              {
                type: 'Full-Time',
                color: 'bg-employment-fullTime',
                borderColor: 'border-employment-fullTime',
                icon: '🏢',
                description: 'Comprehensive benefits and career growth',
                features: ['Full benefits', 'Career paths', 'Onboarding'],
                delay: '0.2s'
              },
              {
                type: 'EOR',
                color: 'bg-employment-eor',
                borderColor: 'border-employment-eor',
                icon: '🌍',
                description: 'Global hiring with compliance support',
                features: ['Global compliance', 'Legal support', 'Multi-currency'],
                delay: '0.3s'
              }
            ].map((employment, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border-2 ${employment.borderColor} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer animate-slide-up`}
                style={{ animationDelay: employment.delay }}
              >
                <div className={`h-3 ${employment.color}`} />
                <div className="p-8">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 animate-bounce-subtle">
                    {employment.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                    {employment.type}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {employment.description}
                  </p>
                  <ul className="space-y-2">
                    {employment.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition-transform duration-300" style={{ transitionDelay: `${idx * 50}ms` }}>
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-in-left">
              <div className="inline-block px-4 py-2 rounded-full bg-brand-purple/10 dark:bg-brand-purple/20 border border-brand-purple/20 mb-6 animate-bounce-subtle">
                <span className="text-sm font-semibold text-brand-purple">WHY CHOOSE US</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                Why Choose Our{' '}
                <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent animate-gradient">
                  ATS Platform?
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                Built for modern recruiting teams who demand efficiency, intelligence, and results
              </p>
              
              <div className="space-y-5">
                {[
                  { icon: <Sparkles className="w-5 h-5" />, text: 'AI-powered job descriptions save 60% creation time', delay: '0s' },
                  { icon: <TrendingUp className="w-5 h-5" />, text: 'Real-time engagement tracking prevents candidate drop-off', delay: '0.1s' },
                  { icon: <Rocket className="w-5 h-5" />, text: 'LinkedIn integration with automatic posting', delay: '0.2s' },
                  { icon: <BarChart3 className="w-5 h-5" />, text: '6-stage customizable pipeline for every job', delay: '0.3s' },
                  { icon: <Target className="w-5 h-5" />, text: 'Hiring funnel analytics for data-driven decisions', delay: '0.4s' },
                  { icon: <Shield className="w-5 h-5" />, text: 'Custom SSO integration for enterprise security', delay: '0.5s' }
                ].map((benefit, index) => (
                  <div key={index} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-brand-purple/5 hover:to-brand-blue/5 transition-all duration-300 hover:translate-x-2 animate-slide-in-left cursor-pointer" style={{ animationDelay: benefit.delay }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      {benefit.icon}
                    </div>
                    <span className="text-lg text-gray-700 dark:text-gray-300 font-medium pt-2">
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-slide-in-right">
              <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-brand-purple/20 via-purple-400/20 to-brand-blue/20 dark:from-brand-purple/30 dark:via-purple-400/30 dark:to-brand-blue/30 p-12 border-2 border-brand-purple/30 dark:border-brand-purple/40 shadow-2xl overflow-hidden animate-gradient">
                {/* Decorative circles */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-brand-purple/20 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-brand-blue/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                
                <div className="relative h-full flex items-center justify-center text-center">
                  <div>
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue text-white shadow-2xl mb-6 animate-float">
                      <Zap className="w-12 h-12" />
                    </div>
                    <p className="text-6xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent mb-4 animate-gradient">
                      10x Faster
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      Hiring Process
                    </p>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
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
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-r from-brand-purple via-purple-500 to-brand-blue p-16 shadow-2xl overflow-hidden animate-gradient animate-slide-up">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float-slow" />
            
            <div className="relative text-center">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
                Ready to Transform
                <br />
                Your Hiring?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join innovative companies using AI-powered recruiting to hire top talent faster
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group px-10 py-5 bg-white text-brand-purple rounded-xl font-semibold text-lg shadow-2xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 animate-bounce-subtle">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105">
                  Schedule Demo
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-10 flex items-center justify-center gap-8 text-white/80">
                <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-medium">No credit card required</span>
                </div>
                <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-5 h-5 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <span className="text-sm font-medium">14-day free trial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-slide-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-purple animate-pulse" />
              <span className="text-lg font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent animate-gradient">
                Multi-Employment ATS
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 Multi-Employment ATS Platform. Powered by AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
