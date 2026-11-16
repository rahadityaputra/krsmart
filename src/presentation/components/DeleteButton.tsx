export function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="icon-button danger-text" aria-label={label} title={label} onClick={onClick}>
    <span className="trash-icon" aria-hidden="true" />
  </button>
}
