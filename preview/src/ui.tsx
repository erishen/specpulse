import { Children, isValidElement, type CSSProperties, type ReactNode } from 'react';
import { sanitizeUrl } from './url.js';

type UIProps = Record<string, unknown> & { children?: ReactNode };

function pick(props: UIProps, key: string, fallback = ''): string {
  const value = props[key];
  return typeof value === 'string' ? value : fallback;
}

function cls(props: UIProps): string | undefined {
  const className = props.className;
  return typeof className === 'string' && className.trim() ? className.trim() : undefined;
}

/** Normalize the `width` prop (number → px) to a CSS width string. */
function widthOf(props: UIProps): string | undefined {
  const v = props.width;
  if (typeof v === 'number') return `${v}px`;
  return typeof v === 'string' && v.trim() ? v : undefined;
}

const THEMES = ['light', 'dark', 'midnight', 'aurora'];

export function Page(props: UIProps) {
  const { children } = props;
  const c = cls(props);
  const theme = THEMES.includes(pick(props, 'theme', 'light')) ? pick(props, 'theme', 'light') : 'light';
  return (
    <div className={c ? `page page-${theme} ${c}` : `page page-${theme}`}>
      {children}
    </div>
  );
}

export function Navbar(props: UIProps) {
  const { children } = props;
  return (
    <nav className="navbar">
      <span className="navbar-brand">{pick(props, 'brand', 'App')}</span>
      <div className="navbar-links">{children}</div>
    </nav>
  );
}

export function Heading(props: UIProps) {
  const level = Number(pick(props, 'level', '1')) as 1 | 2 | 3;
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  const style: CSSProperties =
    level === 1 ? { fontSize: 40, fontWeight: 800 } : { fontSize: 24, fontWeight: 700 };
  return <Tag style={style}>{pick(props, 'text', '')}</Tag>;
}

export function Hero(props: UIProps) {
  const { children } = props;
  const level = Number(pick(props, 'level', '1')) as 1 | 2 | 3;
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  const fontSize = level === 1 ? 40 : level === 2 ? 28 : 22;
  return (
    <div className="hero">
      <Tag className="hero-title" style={{ fontSize, fontWeight: 800, margin: 0 }}>
        {pick(props, 'text', '')}
      </Tag>
      {children && <div className="hero-actions">{children}</div>}
    </div>
  );
}

export function Paragraph(props: UIProps) {
  return <p className="paragraph">{pick(props, 'text', '')}</p>;
}

export function Button(props: UIProps) {
  const variant = pick(props, 'variant', 'secondary');
  return (
    <button className={`button button-${variant}`}>
      {pick(props, 'label', 'Submit')}
    </button>
  );
}

export function Input(props: UIProps) {
  return (
    <label className="field">
      <span>{pick(props, 'label', '')}</span>
      <input
        type={pick(props, 'type', 'text')}
        placeholder={pick(props, 'placeholder', '')}
        defaultValue={pick(props, 'defaultValue', '')}
      />
    </label>
  );
}

export function Textarea(props: UIProps) {
  return (
    <label className="field">
      <span>{pick(props, 'label', '')}</span>
      <textarea placeholder={pick(props, 'placeholder', '')} rows={Number(pick(props, 'rows', '4'))} />
    </label>
  );
}

export function Card(props: UIProps) {
  const { children } = props;
  const c = cls(props);
  return (
    <div className={c ? `card ${c}` : 'card'} style={{ width: widthOf(props) }}>
      <h3>{pick(props, 'title', '')}</h3>
      {children}
    </div>
  );
}

export function List(props: UIProps) {
  const { children } = props;
  const items = props.items;
  const rows = Array.isArray(items) ? items.map((item, i) => <li key={i}>{String(item)}</li>) : children;
  const ordered = props.ordered === true || props.ordered === 'true';
  const Tag = ordered ? 'ol' : 'ul';
  return <Tag className="list">{rows}</Tag>;
}

export function Badge(props: UIProps) {
  const tone = pick(props, 'tone', 'info');
  const style: Record<string, CSSProperties> = {
    success: { background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#166534' },
    warning: { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e' },
    danger: { background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#991b1b' },
    info: { background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#3730a3' },
  };
  return <span className="badge" style={style[tone] ?? style.info}>{pick(props, 'text', '')}</span>;
}

export function Divider() {
  return <hr className="divider" />;
}

export function Form(props: UIProps) {
  const { children } = props;
  // onSubmitLabel auto-appends a submit Button; don't duplicate one the
  // LLM already placed inside the form's children. In on-page edit mode
  // children arrive wrapped in .editor-node spans carrying data-type.
  const childrenHaveButton = Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      (child.type === Button || (child.props as UIProps)?.['data-type'] === 'Button'),
  );
  return (
    <form className="form" style={{ width: widthOf(props) }} onSubmit={(event) => event.preventDefault()}>
      {children}
      {pick(props, 'onSubmitLabel', '') !== '' && !childrenHaveButton && (
        <Button label={pick(props, 'onSubmitLabel', '')} variant="primary" />
      )}
    </form>
  );
}

export function Link(props: UIProps) {
  const href = sanitizeUrl(pick(props, 'href', '#'));
  return (
    <a className="link" href={href || '#'}>
      {pick(props, 'text', 'Link')}
    </a>
  );
}

export function Image(props: UIProps) {
  const style: CSSProperties = { maxWidth: '100%', borderRadius: pick(props, 'radius', '8px') };
  const width = pick(props, 'width', '');
  const height = pick(props, 'height', '');
  if (width) style.width = width;
  if (height) style.height = height;
  const src = sanitizeUrl(pick(props, 'src', 'https://picsum.photos/640/360'));
  return (
    <img
      className="image"
      src={src || ''}
      alt={pick(props, 'alt', '')}
      style={style}
    />
  );
}

export function Avatar(props: UIProps) {
  const size = pick(props, 'size', '48px');
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#3b82f6',
    color: '#fff',
    fontWeight: 700,
    fontSize: `calc(${size} / 2.4)`,
    overflow: 'hidden',
    verticalAlign: 'middle',
  };
  const src = sanitizeUrl(pick(props, 'src', ''));
  const name = pick(props, 'name', '?');
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return src ? (
    <img className="avatar" src={src} alt={name} style={style} />
  ) : (
    <span className="avatar" style={style}>
      {initials}
    </span>
  );
}

export function Stat(props: UIProps) {
  const tone = pick(props, 'tone', 'info');
  const style: Record<string, CSSProperties> = {
    success: { color: '#16a34a' },
    warning: { color: '#d97706' },
    danger: { color: '#dc2626' },
    info: { color: '#2563eb' },
  };
  return (
    <div className="stat">
      <span className="stat-value" style={style[tone] ?? style.info}>
        {pick(props, 'value', '0')}
        {pick(props, 'unit', '')}
      </span>
      <span className="stat-label">{pick(props, 'label', '')}</span>
    </div>
  );
}

const progressTones: Record<string, string> = {
  success: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
  warning: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
  danger: 'linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)',
  info: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
};

export function Progress(props: UIProps) {
  const value = Math.min(Math.max(Number(pick(props, 'value', '0')) || 0, 0), 100);
  const tone = pick(props, 'tone', 'info');
  return (
    <div className="progress">
      {pick(props, 'label', '') !== '' && (
        <div className="progress-head">
          <span>{pick(props, 'label', '')}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: progressTones[tone] ?? progressTones.info }} />
      </div>
    </div>
  );
}

const alertTones: Record<string, CSSProperties> = {
  success: { background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#166534' },
  warning: { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e' },
  danger: { background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#991b1b' },
  info: { background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#3730a3' },
};

export function Alert(props: UIProps) {
  const tone = pick(props, 'tone', 'info');
  return (
    <div className="alert" style={alertTones[tone] ?? alertTones.info}>
      {pick(props, 'text', '')}
    </div>
  );
}

export function Table(props: UIProps) {
  const headers = Array.isArray(props.headers) ? props.headers.map(String) : [];
  const rows = Array.isArray(props.rows) ? (props.rows as unknown[]).map((row) => (Array.isArray(row) ? row.map(String) : [String(row)])) : [];
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => <td key={c}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Checkbox(props: UIProps) {
  return (
    <label className="field checkbox">
      <input type="checkbox" defaultChecked={props.checked === true} />
      <span>{pick(props, 'label', '')}</span>
    </label>
  );
}

export function Select(props: UIProps) {
  const options = Array.isArray(props.options) ? props.options.map(String) : [];
  return (
    <label className="field">
      <span>{pick(props, 'label', '')}</span>
      <select defaultValue={pick(props, 'defaultValue', '')}>
        {options.map((option, i) => <option key={i} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function Quote(props: UIProps) {
  return (
    <blockquote className="quote">
      <p>“{pick(props, 'text', '')}”</p>
      {pick(props, 'author', '') !== '' && <footer>— {pick(props, 'author', '')}</footer>}
    </blockquote>
  );
}

export function CodeBlock(props: UIProps) {
  return (
    <pre className="codeblock">
      <code>{pick(props, 'code', '')}</code>
    </pre>
  );
}

export function Steps(props: UIProps) {
  const items = Array.isArray(props.items) ? props.items.map(String) : [];
  return (
    <ol className="steps">
      {items.map((item, i) => (
        <li key={i} className="step">
          <span className="step-index">{i + 1}</span>
          <span className="step-text">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function Timeline(props: UIProps) {
  const items = Array.isArray(props.items) ? props.items.map(String) : [];
  return (
    <ul className="timeline">
      {items.map((item, i) => (
        <li key={i} className="timeline-item">
          <span className="timeline-dot" />
          <span className="timeline-text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Footer(props: UIProps) {
  const { children } = props;
  return (
    <footer className="footer">
      {children || pick(props, 'text', '')}
    </footer>
  );
}

export function Row(props: UIProps) {
  const { children } = props;
  const gap = pick(props, 'gap', '16px');
  const align = pick(props, 'align', 'center');
  const wrap = props.wrap === true || props.wrap === 'true';
  const justify = pick(props, 'justify', 'flex-start');
  const c = cls(props);
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : undefined,
    width: widthOf(props),
    marginTop: '8px',
    marginBottom: '8px',
  };
  return (
    <div className={c || undefined} style={style}>
      {children}
    </div>
  );
}

export function Grid(props: UIProps) {
  const { children } = props;
  const cols = pick(props, 'cols', '2');
  const gap = pick(props, 'gap', '20px');
  const c = cls(props);
  const style: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap,
    width: widthOf(props),
    marginTop: '8px',
    marginBottom: '8px',
  };
  return (
    <div className={c || undefined} style={style}>
      {children}
    </div>
  );
}
