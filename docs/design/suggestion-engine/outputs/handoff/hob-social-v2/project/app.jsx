// Hob app — catalog → overview → cooking, with Tweaks.
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ============ TOKENS (persisted via EDITMODE block) ============
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "paper",
  "type": "serif-grotesk",
  "dark": false,
  "energyFilter": "all",
  "overviewMode": "relaxed",
  "seedTimer": false,
  "toneKernel": true
}/*EDITMODE-END*/;

// ============ HELPERS ============
function fmtTime(total) {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${String(s).padStart(2,'0')}`;
}
function fmtDur(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ============ SVG icons (tiny, minimal) ============
const Icon = {
  chevron: (p) => <svg className="icon" viewBox="0 0 24 24" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  arrow:   (p) => <svg className="icon" viewBox="0 0 24 24" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back:    (p) => <svg className="icon" viewBox="0 0 24 24" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  close:   (p) => <svg className="icon" viewBox="0 0 24 24" {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>,
  dot:     (p) => <svg className="icon" viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>,
  sliders: (p) => <svg className="icon" viewBox="0 0 24 24" {...p}><line x1="4" y1="7" x2="14" y2="7"/><circle cx="17" cy="7" r="2"/><line x1="20" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="8" y2="17"/><circle cx="11" cy="17" r="2"/><line x1="14" y1="17" x2="20" y2="17"/></svg>,
};

// ============ TWEAKS STATE ============
function useTweaks() {
  const [tweaks, setTweaks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hob-tweaks") || "null");
      return saved ? { ...TWEAK_DEFAULTS, ...saved } : { ...TWEAK_DEFAULTS };
    } catch { return { ...TWEAK_DEFAULTS }; }
  });
  useEffect(() => {
    localStorage.setItem("hob-tweaks", JSON.stringify(tweaks));
    // parent postMessage (host persistence)
    try { window.parent.postMessage({type:"__edit_mode_set_keys", edits: tweaks}, "*"); } catch(e){}
    // apply tokens
    const root = document.documentElement;
    root.setAttribute("data-theme", tweaks.dark ? "dark" : "light");
    const pal = window.PALETTES[tweaks.palette] || window.PALETTES.paper;
    const mode = tweaks.dark ? pal.dark : pal.light;
    Object.entries(mode).forEach(([k,v]) => root.style.setProperty(k, v));
    const type = window.TYPE_PAIRS[tweaks.type] || window.TYPE_PAIRS["serif-grotesk"];
    Object.entries(type).forEach(([k,v]) => root.style.setProperty(k, v));
  }, [tweaks]);
  const set = (key, val) => setTweaks(t => ({...t, [key]: val}));
  return [tweaks, set];
}

// ============ NAV STATE ============
function useNav() {
  const [screen, setScreen] = useState(() => localStorage.getItem("hob-screen") || "catalog");
  const [recipeId, setRecipeId] = useState(() => localStorage.getItem("hob-recipe") || "bolognese");
  const [step, setStep] = useState(() => Number(localStorage.getItem("hob-step") || 0));
  useEffect(() => { localStorage.setItem("hob-screen", screen); }, [screen]);
  useEffect(() => { localStorage.setItem("hob-recipe", recipeId); }, [recipeId]);
  useEffect(() => { localStorage.setItem("hob-step", step); }, [step]);
  return { screen, setScreen, recipeId, setRecipeId, step, setStep };
}

// ============ GLOBAL TIMERS ============
function useTimers() {
  // timers are keyed by step index; {id, label, total, remaining, status, startedAt}
  const [timers, setTimers] = useState({});
  const ticker = useRef(null);

  useEffect(() => {
    ticker.current = setInterval(() => {
      setTimers(prev => {
        const out = {...prev};
        let changed = false;
        for (const k of Object.keys(out)) {
          const t = out[k];
          if (t.status !== "running") continue;
          const elapsed = (Date.now() - t.startedAt) / 1000;
          const rem = Math.max(0, t.total - elapsed);
          if (Math.floor(rem) !== Math.floor(t.remaining)) {
            out[k] = {...t, remaining: rem, status: rem <= 0 ? "done" : "running"};
            changed = true;
          }
        }
        return changed ? out : prev;
      });
    }, 250);
    return () => clearInterval(ticker.current);
  }, []);

  const start = (key, label, totalSeconds) => {
    setTimers(prev => ({
      ...prev,
      [key]: { id: key, label, total: totalSeconds, remaining: totalSeconds, status: "running", startedAt: Date.now() }
    }));
  };
  const pause = (key) => setTimers(prev => {
    const t = prev[key]; if (!t) return prev;
    return {...prev, [key]: {...t, status: "paused", pausedRemaining: t.remaining}};
  });
  const resume = (key) => setTimers(prev => {
    const t = prev[key]; if (!t) return prev;
    const rem = t.pausedRemaining ?? t.remaining;
    return {...prev, [key]: {...t, status:"running", total: rem, remaining: rem, startedAt: Date.now()}};
  });
  const dismiss = (key) => setTimers(prev => {
    const out = {...prev}; delete out[key]; return out;
  });

  return { timers, start, pause, resume, dismiss };
}

// ============ TOP BAR ============
function TopBar({ tweaks, onOpenTweaks, copy }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true"></div>
        <div className="brand-name">hob</div>
      </div>
      <div className="topbar-right">
        <button className="chip-btn" onClick={onOpenTweaks} aria-label="Open tweaks">
          <Icon.sliders style={{verticalAlign:"-2px", marginRight:6}}/> Tweaks
        </button>
      </div>
    </header>
  );
}

// ============ CATALOG SCREEN ============
function CatalogScreen({ tweaks, setTweak, nav, copy }) {
  const [dismissed, setDismissed] = useState([]);

  const energyTiers = [
    { id: "all",      label: "Any energy" },
    { id: "zombie",   label: "Low" },
    { id: "moderate", label: "Moderate" },
    { id: "project",  label: "Project" },
  ];

  const pool = useMemo(() => {
    return window.RECIPES.filter(r =>
      (tweaks.energyFilter === "all" || r.tier === tweaks.energyFilter) &&
      !dismissed.includes(r.id)
    );
  }, [tweaks.energyFilter, dismissed]);

  const suggestions = pool.slice(0, 3);
  const catalog = window.RECIPES; // full list always

  return (
    <div className="app">
      <TopBar tweaks={tweaks} onOpenTweaks={() => setTweak("__open", true)} copy={copy}/>

      {/* Suggestion engine */}
      <section className="section">
        <div className="suggest-head">
          <h1 className="suggest-q">{copy.hubGreeting}</h1>
        </div>
        <div className="suggest-filters" style={{marginBottom:18}}>
          {energyTiers.map(t => (
            <button
              key={t.id}
              className={"chip-btn " + (tweaks.energyFilter === t.id ? "active" : "")}
              onClick={() => setTweak("energyFilter", t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {suggestions.length === 3 ? (
          <div className="suggest-grid">
            {suggestions.map((r, i) => (
              <button
                key={r.id}
                className="sug-card"
                onClick={() => { nav.setRecipeId(r.id); nav.setStep(0); nav.setScreen("overview"); }}
                aria-label={`Suggestion ${i+1} of 3: ${r.title}, ${fmtDur(r.timeRelaxed)}`}
              >
                <div className="sug-tier" data-tier={r.tier}>
                  <span className="sug-tier-dot" aria-hidden="true"/>
                  {r.tier === "zombie" ? "low energy" : r.tier === "project" ? "project" : "moderate"}
                </div>
                <h3 className="sug-title serif">{r.title}</h3>
                <div className="sug-meta">
                  <div className="sug-time">
                    <span className="num">{r.timeRelaxed}</span> min
                  </div>
                  <div style={{fontSize:13, color:"var(--ink-3)"}}>
                    serves <span className="num">{r.servings}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{padding: "40px 20px", textAlign:"center", color:"var(--ink-2)", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:14}}>
            {copy.emptyCatalog}
          </div>
        )}

        <div className="suggest-footer">
          <button className="ghost-btn" onClick={() => setDismissed(d => [...d, ...suggestions.map(s => s.id)])}>
            {copy.notThese}
          </button>
          <button className="ghost-btn" onClick={() => setTweak("energyFilter", "zombie")}>
            {copy.notTonight}
          </button>
        </div>
      </section>

      {/* Full catalog */}
      <section className="section">
        <h2 className="section-title">{copy.allCatalog}</h2>
        <div className="catalog">
          {catalog.map(r => (
            <button
              key={r.id}
              className="cat-row"
              onClick={() => { nav.setRecipeId(r.id); nav.setStep(0); nav.setScreen("overview"); }}
            >
              <div className="cat-thumb img-ph" data-label=""/>
              <div className="cat-meta">
                <div className="cat-title">{r.title}</div>
                <div className="cat-sub">
                  <span>{r.tier === "zombie" ? "low energy" : r.tier === "project" ? "project" : "moderate"}</span>
                  <span aria-hidden="true">·</span>
                  <span>serves <span className="num">{r.servings}</span></span>
                </div>
              </div>
              <div className="cat-time num">{r.timeRelaxed} min</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============ OVERVIEW SCREEN ============
function OverviewScreen({ tweaks, setTweak, nav, copy }) {
  const recipe = window.RECIPES.find(r => r.id === nav.recipeId) || window.RECIPES[0];
  const mode = tweaks.overviewMode;
  const phases = mode === "optimized" ? recipe.phasesOptimized : recipe.phases;
  const totalTime = mode === "optimized" ? recipe.timeOptimized : recipe.timeRelaxed;
  const stepsCount = recipe.steps.length;

  return (
    <div className="app">
      <div style={{display:"flex", alignItems:"center", gap:14, padding:"8px 0 16px"}}>
        <button className="chip-btn" onClick={() => nav.setScreen("catalog")} aria-label="Back to catalog">
          <Icon.back style={{verticalAlign:"-2px", marginRight:6}}/> Catalog
        </button>
        <div style={{flex:1}}/>
        <button className="chip-btn" onClick={() => setTweak("__open", true)}>
          <Icon.sliders style={{verticalAlign:"-2px", marginRight:6}}/> Tweaks
        </button>
      </div>

      <div className="hero">
        <div className="hero-img img-ph" data-label="hero photo · finished dish"/>
        <div className="hero-body">
          <div>
            <h1 className="hero-title">{recipe.title}</h1>
            <div className="hero-sub">
              <span className="num">{totalTime}</span> min · <span className="num">{stepsCount}</span> steps · serves <span className="num">{recipe.servings}</span>
            </div>
          </div>
          <div className="mode-toggle" role="tablist" aria-label="Schedule mode">
            <button role="tab" aria-selected={mode==="relaxed"} className={mode==="relaxed" ? "active":""}
              onClick={() => setTweak("overviewMode","relaxed")}>{copy.relaxedLabel}</button>
            <button role="tab" aria-selected={mode==="optimized"} className={mode==="optimized" ? "active":""}
              onClick={() => setTweak("overviewMode","optimized")}>{copy.optimizedLabel}</button>
          </div>
        </div>
      </div>

      <h2 className="section-title">{copy.phaseHeader}</h2>
      <div className="phase-list">
        {phases.map((p, i) => (
          <div key={i} className={"phase-card " + (mode==="optimized" ? "optimized-highlight" : "")}>
            <div className="phase-index num">{i+1}</div>
            <div>
              <div className="phase-title">{p.label}</div>
              <div className="phase-steps"><span className="num">{p.steps}</span> steps</div>
              {p.product && (
                <div className="phase-product">Produces <strong>{p.product}</strong></div>
              )}
            </div>
            <div className="phase-time">
              {p.time}
              <small>min</small>
            </div>
          </div>
        ))}
      </div>

      {mode === "optimized" && (
        <div className="note">
          Prep is woven into simmer time. Total drops from <span className="num">{recipe.timeRelaxed}</span> to <span className="num">{recipe.timeOptimized}</span> minutes.
        </div>
      )}

      <button className="primary-cta" onClick={() => { nav.setStep(0); nav.setScreen("cook"); }}>
        <span>{copy.startCooking}</span>
        <span><span className="num">{stepsCount}</span> steps &nbsp;<Icon.arrow style={{verticalAlign:"-2px"}}/></span>
      </button>
    </div>
  );
}

// ============ COOKING VIEW ============
function CookingScreen({ tweaks, setTweak, nav, timers, copy }) {
  const recipe = window.RECIPES.find(r => r.id === nav.recipeId) || window.RECIPES[0];
  const steps = recipe.steps;
  const idx = Math.min(Math.max(0, nav.step), steps.length); // allow == length for complete
  const isComplete = idx >= steps.length;
  const current = isComplete ? null : steps[idx];

  // Seed-timer effect
  useEffect(() => {
    if (tweaks.seedTimer && !timers.timers["__seed"]) {
      timers.start("__seed", "Simmer sauce", 30 * 60);
    }
    if (!tweaks.seedTimer && timers.timers["__seed"]) {
      timers.dismiss("__seed");
    }
  }, [tweaks.seedTimer]);

  // Keyboard nav
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); prev(); }
      if (e.key === "Escape") { nav.setScreen("overview"); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const prev = () => nav.setStep(Math.max(0, nav.step - 1));
  const next = () => { if (nav.step < steps.length) nav.setStep(nav.step + 1); };

  const stepKey = `step-${idx}`;
  const currentTimer = timers.timers[stepKey];
  const activeTimers = Object.values(timers.timers);

  if (isComplete) {
    return (
      <div className="cook">
        <div className="cook-inner">
          <div className="cook-top">
            <button className="cook-exit" onClick={() => nav.setScreen("overview")} aria-label="Back to overview">
              <Icon.close/>
            </button>
            <div className="cook-recipe-name"><strong>{recipe.title}</strong></div>
            <button className="chip-btn" onClick={() => setTweak("__open", true)}>
              <Icon.sliders style={{verticalAlign:"-2px"}}/>
            </button>
          </div>
          <div className="complete">
            <h1 className="complete-title">{copy.completeTitle}</h1>
            <div className="complete-sub">{copy.completeSub}</div>
            <div style={{display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap"}}>
              <button className="chip-btn" onClick={() => { nav.setStep(0); nav.setScreen("catalog"); }}>
                Back to catalog
              </button>
              <button className="chip-btn active" onClick={() => { nav.setStep(0); }}>
                Cook again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cook">
      <div className="cook-inner">
        <div className="cook-top">
          <button className="cook-exit" onClick={() => nav.setScreen("overview")} aria-label="Back to overview">
            <Icon.close/>
          </button>
          <div className="cook-recipe-name">
            <strong>{recipe.title}</strong>
            <span className="cook-servings"> · <span className="num">{recipe.servings}</span> servings</span>
          </div>
          <button className="chip-btn" onClick={() => setTweak("__open", true)} aria-label="Open tweaks">
            <Icon.sliders style={{verticalAlign:"-2px"}}/>
          </button>
        </div>

        <div className="step-counter" role="progressbar" aria-valuemin="1" aria-valuemax={steps.length} aria-valuenow={idx+1}>
          {steps.map((_, i) => (
            <div key={i} className={"step-counter-dot " + (i < idx ? "filled" : i === idx ? "active" : "")} />
          ))}
          <span className="step-counter-label">Step <span className="num">{idx+1}</span> of <span className="num">{steps.length}</span></span>
        </div>

        <div className="focus" key={idx} aria-live="polite">
          <div className="focus-phase">{current.phase}</div>
          <h1 className="focus-action serif">{current.action}</h1>

          <div className="focus-meta">
            {current.heat && (
              <div className="meta-pill">
                <span className="label">Heat</span>
                <span className="val">{current.heat}</span>
              </div>
            )}
            {current.equipment && (
              <div className="meta-pill">
                <span className="label">Equipment</span>
                <span className="val">{current.equipment}</span>
              </div>
            )}
          </div>

          {current.ingredients && current.ingredients.length > 0 && (
            <div className="ingredients">
              <div className="ingredients-title">For this step</div>
              {current.ingredients.map((ing, i) => (
                <div key={i} className="ing-row">
                  <span className="ing-qty">{ing.qty}</span>
                  <span className="ing-name">{ing.name}</span>
                </div>
              ))}
            </div>
          )}

          {current.detail && <div className="focus-detail">{current.detail}</div>}

          {current.timer && (
            <TimerBlock
              stepKey={stepKey}
              spec={current.timer}
              timer={currentTimer}
              onStart={() => timers.start(stepKey, current.timer.label, current.timer.seconds)}
              onPause={() => timers.pause(stepKey)}
              onResume={() => timers.resume(stepKey)}
              onDismiss={() => timers.dismiss(stepKey)}
            />
          )}
        </div>
      </div>

      {/* Awareness bar */}
      {activeTimers.length > 0 && (
        <div className="awareness" role="region" aria-label="Active timers">
          {activeTimers.map(t => (
            <div key={t.id} className={"awareness-pill " + (t.status === "done" ? "done":"")}
                 onClick={() => { /* could jump to step */ }}>
              <span className="dot"/>
              <span className="label">{t.label}</span>
              <span className="time num">
                {t.status === "done" ? "Done!" : fmtTime(t.remaining)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cook nav */}
      <nav className="cook-nav">
        <div className="cook-nav-inner">
          <button className="nav-btn" disabled={idx === 0} onClick={prev} aria-label="Previous step">
            <Icon.back/> <span style={{marginLeft:4}}>Back</span>
          </button>
          <button className="nav-btn primary" onClick={next} aria-label={idx === steps.length-1 ? "Finish recipe" : "Next step"}>
            <span>{idx === steps.length-1 ? "Finish" : "Next"}</span>
            <Icon.arrow/>
          </button>
        </div>
      </nav>
    </div>
  );
}

// ============ TIMER BLOCK ============
function TimerBlock({ stepKey, spec, timer, onStart, onPause, onResume, onDismiss }) {
  const total = spec.seconds;
  const remaining = timer ? timer.remaining : total;
  const status = timer ? timer.status : "idle";
  const pct = Math.max(0, Math.min(1, remaining / total));
  const R = 38;
  const C = 2 * Math.PI * R;

  return (
    <div className="timer-block">
      <div className="timer-ring" aria-hidden="true">
        <svg viewBox="0 0 84 84">
          <circle className="ring-track" cx="42" cy="42" r={R}/>
          <circle
            className="ring-fill"
            cx="42" cy="42" r={R}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
      </div>
      <div>
        <div className={"timer-num " + (status === "done" ? "done" : "")}>
          {status === "done" ? "0:00" : fmtTime(remaining)}
        </div>
        <div className="timer-label">{spec.label}</div>
      </div>
      <div className="timer-actions">
        {status === "idle"    && <button className="timer-btn primary" onClick={onStart}>Start</button>}
        {status === "running" && <button className="timer-btn" onClick={onPause}>Pause</button>}
        {status === "paused"  && <button className="timer-btn primary" onClick={onResume}>Resume</button>}
        {status === "done"    && <button className="timer-btn primary" onClick={onDismiss}>Dismiss</button>}
        {(status === "running" || status === "paused") && (
          <button className="timer-btn" onClick={onDismiss}>Cancel</button>
        )}
      </div>
    </div>
  );
}

// ============ TWEAKS PANEL ============
function TweaksPanel({ open, setOpen, tweaks, setTweak }) {
  if (!open) {
    return (
      <button className="tweaks-fab" onClick={() => setOpen(true)}>
        <Icon.sliders/> Tweaks
      </button>
    );
  }
  const palettes = Object.keys(window.PALETTES);
  const typeOpts = [
    { id: "single-grotesk", label: "One family (Inter)" },
    { id: "serif-grotesk",  label: "Serif + grotesk" },
    { id: "serif-only",     label: "Serif everywhere" },
  ];
  return (
    <div className="tweaks" role="dialog" aria-label="Tweaks">
      <div className="tweaks-head">
        <div className="tweaks-title">Tweaks</div>
        <button className="chip-btn" style={{padding:"6px 10px", fontSize:11}} onClick={() => setOpen(false)} aria-label="Close tweaks">
          <Icon.close/>
        </button>
      </div>
      <div className="tweaks-body">
        {/* Palette */}
        <div className="tweak-row">
          <div className="tweak-label">Palette</div>
          <div className="swatches">
            {palettes.map(p => {
              const pal = window.PALETTES[p];
              const m = tweaks.dark ? pal.dark : pal.light;
              return (
                <button
                  key={p}
                  className={"swatch " + (tweaks.palette === p ? "active" : "")}
                  onClick={() => setTweak("palette", p)}
                  title={pal.name}
                  aria-label={`Palette: ${pal.name}`}
                >
                  <div className="swatch-preview">
                    <div style={{background: m["--bg"]}}/>
                    <div style={{background: m["--surface"]}}/>
                    <div style={{background: m["--ink"]}}/>
                    <div style={{background: m["--accent"]}}/>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Type */}
        <div className="tweak-row">
          <div className="tweak-label">Typography</div>
          <div className="tweak-opts" style={{gridTemplateColumns:"1fr"}}>
            {typeOpts.map(o => (
              <button key={o.id}
                className={tweaks.type === o.id ? "active" : ""}
                onClick={() => setTweak("type", o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark mode */}
        <div className="tweak-row">
          <div className="tweak-flex">
            <span>Dark mode</span>
            <div className={"tweak-toggle " + (tweaks.dark ? "on":"")}
                 onClick={() => setTweak("dark", !tweaks.dark)}
                 role="switch" aria-checked={tweaks.dark} tabIndex={0}
                 onKeyDown={(e) => e.key===" " && setTweak("dark", !tweaks.dark)}/>
          </div>
        </div>

        {/* Energy tier (catalog) */}
        <div className="tweak-row">
          <div className="tweak-label">Energy filter</div>
          <div className="tweak-opts">
            {["all","zombie","moderate","project"].map(t => (
              <button key={t}
                className={tweaks.energyFilter === t ? "active" : ""}
                onClick={() => setTweak("energyFilter", t)}>
                {t === "all" ? "Any" : t === "zombie" ? "Low" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Overview mode */}
        <div className="tweak-row">
          <div className="tweak-label">Overview schedule</div>
          <div className="tweak-opts">
            <button className={tweaks.overviewMode==="relaxed" ? "active":""} onClick={() => setTweak("overviewMode","relaxed")}>Relaxed</button>
            <button className={tweaks.overviewMode==="optimized" ? "active":""} onClick={() => setTweak("overviewMode","optimized")}>Optimized</button>
          </div>
        </div>

        {/* Seed timer */}
        <div className="tweak-row">
          <div className="tweak-flex">
            <span>Seed running timer<br/><span style={{fontSize:11, color:"var(--ink-3)"}}>Simmer sauce · 30:00</span></span>
            <div className={"tweak-toggle " + (tweaks.seedTimer ? "on":"")}
                 onClick={() => setTweak("seedTimer", !tweaks.seedTimer)}
                 role="switch" aria-checked={tweaks.seedTimer} tabIndex={0}/>
          </div>
        </div>

        {/* Tone */}
        <div className="tweak-row">
          <div className="tweak-label">
            <span>Copy tone</span>
            <span style={{color: tweaks.toneKernel ? "var(--accent)" : "var(--ink-3)"}}>{tweaks.toneKernel ? "kernel" : "normal"}</span>
          </div>
          <div className="tweak-opts">
            <button className={tweaks.toneKernel ? "active":""} onClick={() => setTweak("toneKernel", true)}>Hob voice</button>
            <button className={!tweaks.toneKernel ? "active":""} onClick={() => setTweak("toneKernel", false)}>Typical app</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ROOT ============
function App() {
  const [tweaks, setTweakRaw] = useTweaks();
  const [panelOpen, setPanelOpen] = useState(false);
  const nav = useNav();
  const timers = useTimers();

  // Wrap setTweak to also handle "__open" meta-key
  const setTweak = (k, v) => {
    if (k === "__open") { setPanelOpen(Boolean(v)); return; }
    setTweakRaw(k, v);
  };

  const copy = tweaks.toneKernel ? window.COPY.kernel : window.COPY.normal;

  // Host-mode integration
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "__activate_edit_mode") setPanelOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setPanelOpen(false);
    };
    window.addEventListener("message", handler);
    try { window.parent.postMessage({type:"__edit_mode_available"}, "*"); } catch {}
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <>
      <div data-screen-label={nav.screen === "catalog" ? "Catalog" : nav.screen === "overview" ? "Overview" : "Cooking"}>
        {nav.screen === "catalog" && <CatalogScreen tweaks={tweaks} setTweak={setTweak} nav={nav} copy={copy}/>}
        {nav.screen === "overview" && <OverviewScreen tweaks={tweaks} setTweak={setTweak} nav={nav} copy={copy}/>}
        {nav.screen === "cook" && <CookingScreen tweaks={tweaks} setTweak={setTweak} nav={nav} timers={timers} copy={copy}/>}
      </div>
      <TweaksPanel open={panelOpen} setOpen={setPanelOpen} tweaks={tweaks} setTweak={setTweak}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
