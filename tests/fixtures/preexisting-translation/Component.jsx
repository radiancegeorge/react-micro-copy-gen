import React from 'react';
import { useTranslation } from 'legacy-lib';
import legacyStore from '../legacyStore';

export default function Component({ user, otherStore }) {
  const { translate } = useTranslation(legacyStore);
  const result = useTranslation(otherStore);
  const { findText } = result;
  return <div>{findText('Welcome {name}', { name: user.name })}</div>;
}
