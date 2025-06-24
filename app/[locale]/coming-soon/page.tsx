import Link from "next/link";
import { useTranslations } from 'next-intl';

export default function ComingSoonPage() {
  const t = useTranslations('ComingSoon');
  const tCommon = useTranslations('Common');
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex justify-between items-center px-12 py-10">
        <Link 
          href="https://instagram.com/luzimarket" 
          className="text-sm font-univers text-gray-700 hover:text-black transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </Link>
        <h1 className="text-3xl font-univers tracking-[0.15em] text-black">
          {tCommon('brand')}
        </h1>
        <Link 
          href="mailto:hola@luzimarket.shop" 
          className="text-sm font-univers text-gray-700 hover:text-black transition-colors"
        >
          Contact
        </Link>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Title with oval highlight */}
          <div className="relative mb-6">
            <h2 className="text-7xl md:text-8xl font-times-now leading-tight">
              <span className="relative inline-block">
                Handpicked
                <svg
                  className="absolute inset-0 w-full h-full -z-10 scale-125"
                  viewBox="0 0 400 120"
                  preserveAspectRatio="none"
                >
                  <ellipse
                    cx="200"
                    cy="60"
                    rx="190"
                    ry="55"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-gray-800"
                  />
                </svg>
              </span>
            </h2>
            <h2 className="text-6xl md:text-7xl font-times-now mt-2">
              extraordinary gifts
            </h2>
          </div>
          
          {/* Decorative element */}
          <div className="my-12">
            <div className="relative w-20 h-20 mx-auto">
              {/* Hand gesture with star */}
              <svg 
                viewBox="0 0 80 80" 
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Hand path */}
                <path 
                  d="M40 20 C30 25, 25 35, 25 45 C25 55, 30 60, 40 60 C50 60, 55 55, 55 45 C55 35, 50 25, 40 20" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  className="text-gray-800"
                />
                {/* Star */}
                <path 
                  d="M40 55 L42 60 L47 60 L43 63 L45 68 L40 65 L35 68 L37 63 L33 60 L38 60 Z" 
                  fill="currentColor"
                  className="text-gray-800"
                />
              </svg>
            </div>
          </div>

          <p className="text-base md:text-lg font-univers max-w-3xl mx-auto mb-12 leading-relaxed text-gray-700 px-4">
            {t('description')}
          </p>

          <Link
            href="/vendor/register"
            className="inline-block bg-black text-white px-10 py-4 font-univers text-sm tracking-wider hover:bg-gray-900 transition-colors"
            data-testid="affiliate-button"
          >
            {t('affiliate')}
          </Link>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-r from-green-400 via-yellow-300 to-cyan-400 flex items-center justify-center">
        <div className="flex items-center gap-12 text-sm font-univers tracking-wider text-gray-800 overflow-x-auto whitespace-nowrap px-4">
          <span className="flex-shrink-0">{t('comingSoonEn')}</span>
          <span className="text-gray-600">/</span>
          <span className="flex-shrink-0">{t('comingSoon')}</span>
          <span className="text-gray-600">/</span>
          <span className="flex-shrink-0">{t('comingSoonFr')}</span>
          <span className="text-gray-600">/</span>
          <span className="flex-shrink-0">{t('comingSoonKr')}</span>
        </div>
      </div>
    </div>
  );
}