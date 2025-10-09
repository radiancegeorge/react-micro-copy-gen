import wordStore from '../../output-rewrite/wordStore.json';
import { useTranslation } from 'l-min-components/src/components';
export default function Calls({ user }) {
  const { findText } = useTranslation(wordStore);
  findText('Plain');
  findText(`Hi ${user.firstName}`);
  findText(messageFromServer);
  return null;
}
