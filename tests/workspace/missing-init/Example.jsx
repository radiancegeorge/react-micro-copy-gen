import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
export default function Button() {
  const { findText } = useTranslation(wordStore);
  return <button title={findText('Submit')}>{findText('Save')}</button>;
}
