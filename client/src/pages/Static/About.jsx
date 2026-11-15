import { useTranslation } from 'react-i18next';
import ImagePlaceholder from '../../components/ui/ImagePlaceholder';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="container-custom section-padding space-y-16">
      <div className="max-w-3xl">
        <p className="font-heading text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">Artisanat Tunisien</p>
        <h1 className="font-heading font-black text-4xl md:text-5xl mb-6">{t('pages.about.title')}</h1>
        <p className="text-gray-700 text-lg leading-relaxed">{t('pages.about.story')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="font-heading font-black text-2xl md:text-3xl mb-4">{t('pages.about.mission')}</h2>
          <p className="text-gray-600 leading-relaxed mb-6">{t('pages.about.missionText')}</p>
          <div className="space-y-4">
            <div className="border-l-2 border-black pl-4">
              <h3 className="font-heading font-bold text-base">{t('pages.about.handmade')}</h3>
              <p className="text-sm text-gray-500">{t('pages.about.handmadeDesc')}</p>
            </div>
            <div className="border-l-2 border-black pl-4">
              <h3 className="font-heading font-bold text-base">{t('pages.about.quality')}</h3>
              <p className="text-sm text-gray-500">{t('pages.about.qualityDesc')}</p>
            </div>
            <div className="border-l-2 border-black pl-4">
              <h3 className="font-heading font-bold text-base">{t('pages.about.local')}</h3>
              <p className="text-sm text-gray-500">{t('pages.about.localDesc')}</p>
            </div>
          </div>
        </div>
        <div>
          {/* PLACEHOLDER: Remplacez par photo de l'atelier ou de l'équipe */}
          <ImagePlaceholder aspectRatio="4/3" text="📷 Photo Atelier LOCO Arts" />
        </div>
      </div>
    </div>
  );
}
