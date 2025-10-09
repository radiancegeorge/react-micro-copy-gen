import wordStore from '../../output-rewrite/wordStore.json';
import { useTranslation } from 'l-min-components/src/components';
export default function Cond({ flag }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      {flag && findText('Shown when true')}
      {flag ? findText('A') : findText('B')}
      {findText('a') || findText('b')}
    </div>
  );
}
