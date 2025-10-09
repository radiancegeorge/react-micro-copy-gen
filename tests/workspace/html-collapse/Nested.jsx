import wordStore from '../../output-rewrite/wordStore.json';
import { useTranslation } from 'l-min-components/src/components';
export default function Nested({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h3
      dangerouslySetInnerHTML={{
        __html: findText('Welcome {highlight} and thanks', {
          highlight: `<span><em>${child?.highlight}</em></span>`,
        }),
      }}
    ></h3>
  );
}
