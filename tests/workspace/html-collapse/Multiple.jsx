import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function Multiple({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h2
      dangerouslySetInnerHTML={{
        __html: findText('Hello {arg1} {role} from {site}', {
          arg1: `<strong>dear</strong>`,
          role: `<em>${child?.role}</em>`,
          site: `<a href="${child?.url}" target="_blank" rel="noopener">${child?.site}</a>`,
        }),
      }}
    ></h2>
  );
}
