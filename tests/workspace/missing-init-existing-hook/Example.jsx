import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
export default function Card() {
  // missing wordStore and no destruct of findText
  const { findText } = tr;
  return (
    <div>
      <p>{findText('Hello')}</p>
    </div>
  );
}
