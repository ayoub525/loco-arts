import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const items = t('pages.faq.items', { returnObjects: true }) || [];

  return (
    <div className="container-custom section-padding max-w-3xl mx-auto">
      <h1 className="font-heading font-black text-4xl md:text-5xl mb-8 text-center">{t('pages.faq.title')}</h1>

      <div className="divide-y divide-gray-200 border-y border-gray-200">
        {Array.isArray(items) && items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-4">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex justify-between items-center text-left font-heading font-bold text-base md:text-lg hover:text-gray-600 transition-colors"
              >
                <span>{item.q}</span>
                <span className="text-xl ml-4">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <p className="mt-3 text-sm md:text-base text-gray-600 leading-relaxed animate-fade-in">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
