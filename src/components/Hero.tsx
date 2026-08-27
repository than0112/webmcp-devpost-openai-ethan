import { ArrowDown, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";

export function Hero({ onBrowse, onDemo }: { onBrowse: () => void; onDemo: () => void }) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkle weight="fill" /> A better way to look</span>
        <h1>Lost something?<br /><em>Let your agent help.</em></h1>
        <p>Describe what you remember. Your agent can search and compare reported items directly—without scrolling through every card.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onBrowse}><MagnifyingGlass weight="bold" /> Browse found items</button>
          <button className="text-button" onClick={onDemo}>Watch agent demo <ArrowDown /></button>
        </div>
      </div>
      <div className="hero-art" aria-label="Featured yellow duck umbrella">
        <div className="sunburst" />
        <img src="/items/LF-003.png" alt="Yellow umbrella with a duck illustration" />
        <div className="found-note"><small>Best match</small><strong>LF-003</strong><span>Yellow Duck Umbrella</span></div>
      </div>
      <p className="tagline">Agents search. <strong>Humans decide.</strong></p>
    </section>
  );
}
