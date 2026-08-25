import type { TechnologyCard } from '@devsure/contracts';
import { TechnologyIcon } from './technology-icon';

const imageBySlug: Record<string, string> = {
  java: '/technologies/java.png',
  'c-sharp': '/technologies/c-sharp.png',
  php: '/technologies/php.png',
  python: '/technologies/python.png',
  javascript: '/technologies/javascript.png',
  appium: '/technologies/appium.webp',
  'selenium-webdriver': '/technologies/selenium.png',
  playwright: '/technologies/playwright.png',
  'serenity-bdd': '/technologies/serenity.png',
  'robot-framework': '/technologies/robot-framework.png',
  winappdriver: '/technologies/winappdriver.jpg',
  'microsoft-power-automate': '/technologies/power-automate.png',
  laravel: '/technologies/laravel.jpg',
  'vue-js': '/technologies/vue.webp',
  nestjs: '/technologies/nestjs.svg',
  'next-js': '/technologies/next.jpeg',
  wordpress: '/technologies/wordpress.jpg',
  'jenkins-pipelines': '/technologies/jenkins.webp',
  docker: '/technologies/docker.Default',
  'new-relic': '/technologies/newrelic.jpg',
};

export function TechnologyImage({ technology }: { technology: TechnologyCard }) {
  const image = imageBySlug[technology.slug];

  return (
    <div className="technology-image" data-testid="technology-image">
      {image ? (
        <img src={image} alt="" loading="lazy" decoding="async" />
      ) : (
        <TechnologyIcon iconKey={technology.iconKey} slug={technology.slug} />
      )}
    </div>
  );
}
