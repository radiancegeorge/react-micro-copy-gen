import wordStore from '../../output-rewrite/wordStore.json';
import { useTranslation } from 'l-min-components/src/components';
function greet(n) {
  return n ? `Hi ${n}` : 'Hi there';
}
export default function Funcs({ user }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <p>{findText(greet(user.firstName))}</p>
    </div>
  );
}
