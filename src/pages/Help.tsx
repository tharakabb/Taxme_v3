import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Info, Shield, Calendar, BarChart3, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const Help = () => {
  const sections = [
    {
      id: 'eligibility',
      title: 'Eligibility & Responsibility',
      icon: Shield,
      color: 'bg-blue-100 text-blue-600',
      content: [
        {
          subtitle: 'Who must pay tax?',
          text: 'Any individual or entity earning income above the tax-free threshold in Sri Lanka is legally responsible for paying income tax.'
        },
        {
          subtitle: 'Tax-Free Allowance',
          text: 'Effective April 1, 2025, the personal relief threshold is Rs. 1,800,000 per year. If your annual income is below this, you are not liable for income tax.'
        },
        {
          subtitle: 'Your Responsibility',
          text: 'It is the taxpayer\'s responsibility to register for a TIN (Taxpayer Identification Number), maintain accurate financial records, and file returns on time.'
        }
      ]
    },
    {
      id: 'rates',
      title: 'Tax Rates & Brackets',
      icon: BarChart3,
      color: 'bg-indigo-100 text-indigo-600',
      content: [
        {
          subtitle: 'Progressive Tiers (Individual)',
          text: 'Income above the Rs. 1.8M allowance is taxed in blocks of Rs. 500,000 at progressive rates: 6%, 12%, 18%, 24%, 30%, and any balance at 36%.'
        },
        {
          subtitle: 'Corporate Rates',
          text: 'Standard corporate income tax is generally 30%. Concessionary rates may apply to specific sectors like exports or agriculture (often 15%).'
        }
      ]
    },
    {
      id: 'process',
      title: 'Income Tax Process',
      icon: FileText,
      color: 'bg-emerald-100 text-emerald-600',
      content: [
        {
          subtitle: 'Step 1: Registration',
          text: 'Obtain your TIN and e-Services PIN from the Inland Revenue Department (IRD) website.'
        },
        {
          subtitle: 'Step 2: Record Keeping',
          text: 'Maintain digital or physical copies of all revenue, expenses, and asset documents throughout the year.'
        },
        {
          subtitle: 'Step 3: Quarterly Payments',
          text: 'Pay estimated taxes in four installments based on your projected annual income.'
        },
        {
          subtitle: 'Step 4: Annual Filing',
          text: 'Submit your final Return of Income via the IRD e-Services portal by the deadline.'
        }
      ]
    },
    {
      id: 'deadlines',
      title: 'Important Deadlines',
      icon: Calendar,
      color: 'bg-orange-100 text-orange-600',
      content: [
        {
          subtitle: 'Quarterly Installments',
          text: 'Due on the 15th of August, November, February, and May each year.'
        },
        {
          subtitle: 'Annual Return Filing',
          text: 'The final deadline is November 30th following the end of the assessment year (March 31st).'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Tax Help Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Everything you need to know about Sri Lankan Income Tax</p>
        </div>
      </div>

      {/* Quick Links / Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sections.map((s) => (
          <a 
            key={s.id} 
            href={`#${s.id}`}
            className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors group"
          >
            <s.icon className={`w-6 h-6 ${s.color.split(' ')[1]} mb-2`} />
            <span className="text-sm font-bold text-gray-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{s.title}</span>
          </a>
        ))}
      </div>

      {/* Content Sections */}
      <div className="space-y-12">
        {sections.map((section, idx) => (
          <motion.section 
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${section.color}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.content.map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {item.subtitle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Warning / Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 flex gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0" />
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Disclaimer</h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            The information provided here is for general guidance only and does not constitute professional tax or legal advice. 
            Tax laws in Sri Lanka are subject to change. Always consult with a qualified tax professional or refer to the 
            official Inland Revenue Department (IRD) guidelines for your specific situation.
          </p>
        </div>
      </div>

      {/* External Resources */}
      <div className="bg-indigo-900 dark:bg-indigo-950 rounded-3xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">Need more help?</h3>
            <p className="text-indigo-200">Visit the official Inland Revenue Department portal for detailed guides and e-services.</p>
          </div>
          <a 
            href="http://www.ird.gov.lk" 
            target="_blank" 
            rel="noreferrer"
            className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors"
          >
            Visit IRD Website
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
