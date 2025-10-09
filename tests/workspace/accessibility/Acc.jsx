import wordStore from '../../output-rewrite/wordStore.json';
import { useTranslation } from 'l-min-components/src/components';
function VisuallyHidden({ children }) {
  const { findText } = useTranslation(wordStore);
  return (
    <span
      style={{
        position: 'absolute',
        left: -9999,
      }}
    >
      {findText('{children}', {
        children: children,
      })}
    </span>
  );
}
export default function Acc() {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <VisuallyHidden>{findText('Screen reader only')}</VisuallyHidden>
    </div>
  );
}
