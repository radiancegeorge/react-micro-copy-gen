import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Calls({ user }) {
  const { findText } = useTranslation(wordStore);
  findText('Plain');
  findText(`Hi ${user.firstName}`);
  findText(messageFromServer);
  return null;
}
