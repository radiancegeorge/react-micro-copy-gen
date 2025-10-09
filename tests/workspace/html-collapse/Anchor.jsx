import React from 'react';
export default function Anchor({ child }) {
  return (
    <h4
      dangerouslySetInnerHTML={{
        __html: findText('Visit {site} now', {
          site: `<a href="${child?.url}" title="${`Go to ${child?.site}`}">${child?.site}</a>`,
        }),
      }}
    ></h4>
  );
}
