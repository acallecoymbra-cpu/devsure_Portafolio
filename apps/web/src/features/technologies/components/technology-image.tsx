'use client';

import type { TechnologyCard } from '@devsure/contracts';
import Image from 'next/image';
import { useState } from 'react';
import { TechnologyIcon } from './technology-icon';

export const TECHNOLOGY_IMAGE_BY_SLUG: Readonly<Record<string, string>> = {
  java: '/technologies/java.png',
  'c-sharp': '/technologies/c-sharp.png',
  php: '/technologies/php.png',
  python: '/technologies/python.png',
  javascript: '/technologies/javascript.png',
  typescript: '/technologies/typescript.png',
  appium: '/technologies/appium.webp',
  'selenium-webdriver': '/technologies/selenium.png',
  cypress: '/technologies/cypress.png',
  playwright: '/technologies/playwright.png',
  'serenity-bdd': '/technologies/serenity.png',
  'robot-framework': '/technologies/robot-framework.png',
  winappdriver: '/technologies/winappdriver.jpg',
  robocorp: '/technologies/robocorp.png',
  'microsoft-power-automate': '/technologies/power-automate.png',
  laravel: '/technologies/laravel.jpg',
  'vue-js': '/technologies/vue.webp',
  nestjs: '/technologies/nestjs.svg',
  'next-js': '/technologies/next.jpeg',
  'node-js': '/technologies/node-js.jpg',
  wordpress: '/technologies/wordpress.jpg',
  woocommerce: '/technologies/woocommerce.png',
  microservicios: '/technologies/microservicios.jpg',
  'apis-restful': '/technologies/apis-restful.png',
  'principios-solid': '/technologies/solid.png',
  'clean-code': '/technologies/clean-code.png',
  'model-context-protocol-mcp': '/technologies/mcp.png',
  'jenkins-pipelines': '/technologies/jenkins.webp',
  'github-actions': '/technologies/github-actions.webp',
  docker: '/technologies/docker.png',
  'azure-devops': '/technologies/azure-devops.png',
  'new-relic': '/technologies/newrelic.jpg',
  'cloudflare-essentials': '/technologies/cloudflare.png',
  k6: '/technologies/k6.png',
  jmeter: '/technologies/jmeter.webp',
  artillery: '/technologies/artillery.png',
  scrum: '/technologies/scrum.jpg',
  'jira-agile': '/technologies/jira.webp',
  'estandares-istqb': '/technologies/istqb.png',
  git: '/technologies/git.jpg',
  postman: '/technologies/postman.png',
};

export function TechnologyImage({ technology }: { technology: TechnologyCard }) {
  const image = TECHNOLOGY_IMAGE_BY_SLUG[technology.slug];
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const showImage = image !== undefined && image !== failedImage;

  return (
    <div
      className="technology-image"
      data-testid="technology-image"
      data-image-status={showImage ? 'available' : 'fallback'}
    >
      {showImage ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 7.5rem, 50vw"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <TechnologyIcon iconKey={technology.iconKey} slug={technology.slug} />
      )}
    </div>
  );
}
