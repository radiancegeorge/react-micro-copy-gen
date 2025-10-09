import { useTranslation } from 'l-min-components/src/components';

export default function Card() {
  const tr = useTranslation(); // missing wordStore and no destruct of findText
  return (
    <div>
      <p>{findText('Hello')}</p>
    </div>
  );
}
