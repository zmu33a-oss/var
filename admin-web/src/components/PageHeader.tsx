type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  phaseLabel?: string;
};

export function PageHeader(props: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="page-eyebrow">{props.eyebrow}</p>
        <h1 className="page-title">{props.title}</h1>
        <p className="page-desc">{props.description}</p>
      </div>
      {props.phaseLabel ? (
        <div className="phase-pill">{props.phaseLabel}</div>
      ) : null}
    </header>
  );
}
