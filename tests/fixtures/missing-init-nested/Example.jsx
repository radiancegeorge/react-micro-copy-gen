export default function Comp() {
  function helper() {
    // Pre-existing findText without any initialization
    return <span>{findText('Inner')}</span>;
  }
  return <div>{helper()}</div>;
}
