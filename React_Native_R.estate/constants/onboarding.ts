import icons from './icons';
import images from './images';

export interface OnboardingSlide {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon?: any;
  tipKey?: string;
  image?: any;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    titleKey: 'onboarding.welcome.title',
    descriptionKey: 'onboarding.welcome.description',
    icon: icons.home,
    tipKey: 'onboarding.welcome.tip',
  },
  {
    id: 2,
    titleKey: 'onboarding.search.title',
    descriptionKey: 'onboarding.search.description',
    icon: icons.search,
    tipKey: 'onboarding.search.tip',
  },
  {
    id: 3,
    titleKey: 'onboarding.save.title',
    descriptionKey: 'onboarding.save.description',
    icon: icons.heart,
    tipKey: 'onboarding.save.tip',
  },
  {
    id: 4,
    titleKey: 'onboarding.connect.title',
    descriptionKey: 'onboarding.connect.description',
    icon: icons.chat,
    tipKey: 'onboarding.connect.tip',
  },
  {
    id: 5,
    titleKey: 'onboarding.getStarted.title',
    descriptionKey: 'onboarding.getStarted.description',
    image: images.onboarding,
  },
];
