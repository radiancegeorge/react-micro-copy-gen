import wordStore from '../../output-rewrite/wordStore.json';
import { useTranslation } from 'l-min-components/src/components';
export default function ThirdParty() {
  const { findText } = useTranslation(wordStore);
  const copy = {
    empty: {
      title: 'No items yet',
      description: 'Add your first item',
    },
  };
  return (
    <div>
      <Empty
        title={findText('No items yet')}
        description={findText('Add your first item')}
      />
    </div>
  );
}
function Empty(props) {
  return <div {...props} />;
}
