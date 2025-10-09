import wordStore from '../../output-rewrite/wordStore.json';
import { useTranslation } from 'l-min-components/src/components';
export default function Entities() {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <p>{findText('Price is $10')}</p>
      <p>{findText('مرحبا')}</p>
      <p>{findText('Line 1 Line 2')}</p>
    </div>
  );
}
