export default function Comp() {
  function helper() {
    // Pre-existing findText without any initialization
    return <span>{'Inner'}</span>;
  }
  return <div>{helper()}</div>;
}
