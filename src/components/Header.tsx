import { Binoculars, List, X } from "@phosphor-icons/react";
import { useState } from "react";

export function Header({ onBrowse }: { onBrowse: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Agent Lost and Found home">
        <span className="brand-mark"><Binoculars weight="bold" /></span>
        <span>Agent Lost <i>&amp;</i> Found</span>
      </a>
      <button className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X /> : <List />}</button>
      <nav className={open ? "nav open" : "nav"}>
        <button onClick={onBrowse}>Browse items</button>
        <a href="#how-it-works">How it works</a>
        <span className="agent-ready"><span /> Agent-ready</span>
      </nav>
    </header>
  );
}
