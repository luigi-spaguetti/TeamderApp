import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import es from './locales/es.json';
import en from './locales/en.json';

const i18n = new I18n({ es, en });
i18n.defaultLocale = 'es';
i18n.locale = getLocales()[0]?.languageCode ?? 'es';
i18n.enableFallback = true;

export default i18n;
