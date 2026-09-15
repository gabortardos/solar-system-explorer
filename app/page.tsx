"use client";
/* eslint-disable react-hooks/set-state-in-effect -- these effects hydrate browser state and initialize the imperative scene adapter */
import { useEffect, useRef, useState } from "react";
import type { GuideResponse } from './guide-assistant';
import Link from "next/link";
import {MinorBodyPanel} from './minor-body-panel';
import type {MinorBody} from './minor-bodies';
import './minor-bodies.css';
import {
  Orbit,
  Search,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Maximize2,
  Compass,
  SlidersHorizontal,
  HelpCircle,
  Pause,
  Play,
  Send,
  BookOpen,
  MoveUpRight,
  Navigation,
  ArrowLeftRight,
  Check,
  X,
  RotateCcw,
  Menu,
  EyeOff,
  Eye,
  Info,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import { bodies, primaryBodies } from "./astronomy";
import { DataProvenance } from "./data-provenance";
import {
  buildObjectInformation,
  ObjectInformation,
} from "./object-information";
import {
  buildDistanceComparison,
  defaultDistanceTarget,
  distanceTargets,
  DistanceComparison,
  type SpacecraftDistance,
} from "./distance-comparison";
import type { SearchResponse, SearchResult } from "./search";
import {
  formatSimulationTime,
  parseSimulationRate,
  SIMULATION_RATES,
  type SimulationRate,
} from "./simulation-clock";
import type { createScene, SceneOptions } from "./scene";
function Picker({
  value,
  onChange,
  items,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
const rateLabel = (rate: SimulationRate) =>
  rate === 0
    ? "Paused"
    : rate === 1
      ? "Real time"
      : rate===86400 ? '1 day / second' : rate===2592000 ? '30 days / second' : `${rate.toLocaleString()}×`;
function ClockControls({
  rate,
  time,
  onRateChange,
  compact = false,
}: {
  rate: SimulationRate;
  time: number;
  onRateChange: (rate: SimulationRate) => void;
  compact?: boolean;
}) {
  const iso = Number.isFinite(time) ? new Date(time).toISOString() : undefined;
  return (
    <div
      className={"time-controls " + (compact ? "is-compact" : "")}
      aria-label="Simulation clock"
    >
      <button
        aria-label={rate ? "Pause simulation" : "Resume at real time"}
        onClick={() => onRateChange(rate ? 0 : 1)}
      >
        {rate ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <select
        className="time-rate-select"
        aria-label="Simulation speed"
        value={String(rate)}
        onChange={(event) => onRateChange(parseSimulationRate(event.target.value))}
      >
        {SIMULATION_RATES.map((value) => (
          <option key={value} value={value}>{rateLabel(value)}</option>
        ))}
      </select>
      <time dateTime={iso}>{formatSimulationTime(time)}</time>
      {rate>=86400&&<span className="timelapse-note">Timelapse · fast moons may skip between frames</span>}
    </div>
  );
}
function SearchResultRow({
  result,
  onShow,
  onTravel,
  onInfo,
}: {
  result: SearchResult;
  onShow: () => void;
  onTravel: () => void;
  onInfo: () => void;
}) {
  const stop = (event: { stopPropagation: () => void }) =>
    event.stopPropagation();
  return (
    <CommandItem
      className="catalog-search-result"
      value={`${result.name} ${result.aliases.join(" ")} ${result.type} ${result.context}`}
      onSelect={() => (result.sceneAvailable ? onShow() : onInfo())}
    >
      <div className="search-result-copy">
        <strong>{result.name}</strong>
        <span>
          {result.type} · {result.context}
          {result.matchedAlias
            ? ` · matched “${result.matchedAlias}”`
            : result.aliases[0]
              ? ` · aka ${result.aliases[0]}`
              : ""}
        </span>
      </div>
      <div
        className="search-result-actions"
        onPointerDown={stop}
        onClick={stop}
      >
        <button
          disabled={!result.sceneAvailable}
          title={
            result.sceneAvailable
              ? "Show in the 3D scene"
              : "3D position and assets are not available yet"
          }
          onClick={onShow}
        >
          <Eye size={14} />
          Show
        </button>
        <button
          disabled={!result.sceneAvailable}
          title={
            result.sceneAvailable
              ? "Travel to this destination"
              : "Travel is unavailable until its position and assets are validated"
          }
          onClick={onTravel}
        >
          <Navigation size={14} />
          Travel to
        </button>
        <button onClick={onInfo}>
          <BookOpen size={14} />
          Information
        </button>
      </div>
    </CommandItem>
  );
}
export default function Home() {
  const [minorView,setMinorView]=useState<MinorBody|null>(null);
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<ReturnType<typeof createScene> | null>(null);
  const [selected, setSelected] = useState("earth"),
    [status, setStatus] = useState("Preparing your spacecraft"),
    [time, setTime] = useState<number>(0),
    [ready, setReady] = useState(false),
    [compatibility, setCompatibility] = useState(false),
    [error, setError] = useState("");
  const [search, setSearch] = useState(false),
    [searchQuery, setSearchQuery] = useState(""),
    [searchData, setSearchData] = useState<SearchResponse>({
      results: [],
      total: 0,
      hasMore: false,
    }),
    [searchBusy, setSearchBusy] = useState(false);
  const [panel, setPanel] = useState<
      "details" | "guide" | "settings" | "help" | "menu" | "minor" | null
    >(null),
    [detailsId, setDetailsId] = useState("earth"),
    [compare, setCompare] = useState("moon"),
    [visited, setVisited] = useState<string[]>(["earth"]),
    [progressReady, setProgressReady] = useState(false);
  const [mobileFlight, setMobileFlight] = useState(false),
    [mobileHudHidden, setMobileHudHidden] = useState(false);
  const [spacecraftDistance, setSpacecraftDistance] =
    useState<SpacecraftDistance | null>(null);
  const [options, setOptions] = useState<SceneOptions>({
    scientific: false,
    orbits: false,
    populations: true,
    labels: true,
    reduced: false,
    rate: 1,
  });
  const [question, setQuestion] = useState(""),
    [guideResult, setGuideResult] = useState<GuideResponse|null>(null),
    [guideBusy, setGuideBusy] = useState(false);
  const b = bodies.find((b) => b.id === selected)!,
    detailsBody = bodies.find((body) => body.id === detailsId),
    objectInfo = buildObjectInformation(detailsId)!;
  useEffect(() => {
    let alive = true;
    setTime(Date.now());
    setOptions((o) => ({
      ...o,
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    }));
    import("./scene").then(({ createScene }) => {
      if (!alive || !host.current) return;
      try {
        engine.current = createScene(
          host.current,
          (id)=>{setSelected(id);setMinorView(null);},
          (message)=>{setStatus(message);if(message==='Target locked'||message==='Solar system overview'||message==='Small-body regions overview')setMinorView(null);},
          setTime,
          (id) => setVisited((v) => (v.includes(id) ? v : [...v, id])),
          setError,
        );
        setCompatibility(host.current.dataset.renderer === "compatibility");
        setReady(true);
      } catch (cause) {
        console.error("Solar system scene failed to start", cause);
        setError(
          "3D graphics could not start. Try a desktop browser with hardware acceleration enabled. You can still browse world facts below.",
        );
      }
    });
    return () => {
      alive = false;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    engine.current?.setOptions(options);
  }, [options, ready]);
  useEffect(() => {
    if (compare === "spacecraft" && ready)
      setSpacecraftDistance(
        engine.current?.getSpacecraftDistance(detailsId) ?? null,
      );
  }, [compare, detailsId, ready, time]);
  useEffect(() => {
    if (panel || search) engine.current?.brake();
  }, [panel, search]);
  useEffect(() => {
    setQuestion("");
  }, [selected]);
  useEffect(() => {
    setSpacecraftDistance(null);
    setCompare(defaultDistanceTarget(detailsId));
  }, [detailsId]);
  useEffect(() => {
    if (!search) return;
    let current = true;
    setSearchBusy(true);
    const timer = window.setTimeout(() => {
      import("./search")
        .then(({ catalogSearchProvider }) =>
          catalogSearchProvider.search(searchQuery, { limit: 20 }),
        )
        .then((result) => {
          if (current) setSearchData(result);
        })
        .finally(() => {
          if (current) setSearchBusy(false);
        });
    }, 80);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [search, searchQuery]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("solar-explorer-progress-v1") || "null",
      );
      if (Array.isArray(saved?.visited)) {
        const valid = saved.visited.filter(
          (id: unknown) =>
            typeof id === "string" && bodies.some((b) => b.id === id),
        );
        setVisited(Array.from(new Set(["earth", ...valid])));
      }
    } catch {
    } finally {
      setProgressReady(true);
    }
  }, []);
  useEffect(() => {
    if (progressReady)
      localStorage.setItem(
        "solar-explorer-progress-v1",
        JSON.stringify({ visited, updatedAt: Date.now() }),
      );
  }, [visited, progressReady]);
  const travelTo = (id: string) => {
    setMinorView(null);
    if (!bodies.some((body) => body.id === id)) return;
    engine.current?.preload(id);
    setSelected(id);
    engine.current?.focus(id);
    setMobileFlight(false);
    setSearch(false);
    setPanel(null);
  };
  const travel = () => travelTo(selected);
  const choose = (id: string) => {
    setMinorView(null);
    engine.current?.preload(id);
    setSelected(id);
    setSearch(false);
  };
  const showObject = (id: string) => {
    setMinorView(null);
    if (!bodies.some((body) => body.id === id)) return;
    engine.current?.preload(id);
    setSelected(id);
    engine.current?.focus(id, true);
    setSearch(false);
  };
  const openInformation = (id: string) => {
    setDetailsId(id);
    setSearch(false);
    setPanel("details");
  };
  const ask = async (q: string) => {
    if(guideBusy)return;
    const selectedId=b.id;
    const navigation=engine.current?.getGuideNavigation();
    setQuestion(q);
    setGuideBusy(true);
    try {
      const [{answerContextGuide},{buildGuideContext}]=await Promise.all([import('./guide-assistant'),import('./guide-context')]);
      if(!navigation)throw new Error('The scene is not ready. Please try again.');
      setGuideResult(answerContextGuide(buildGuideContext(selectedId,navigation),q));
    } catch(error) {
      setGuideResult({subject:'Guide unavailable',atUtcMs:time,explanation:error instanceof Error?error.message:'Please retry.',evidence:[],contextNote:'No answer was generated.',mode:'local'});
    } finally {
      setGuideBusy(false);
    }
  };
  const touchMove = (code: string, active: boolean) =>
    engine.current?.setMovement(code, active);
  const comparison = buildDistanceComparison(
    detailsId,
    compare,
    time,
    spacecraftDistance,
  );
  const mobileAction = (action: () => void) => {
    action();
    setPanel(null);
  };
  return (
    <main
      className={
        "explorer " +
        (mobileHudHidden ? "mobile-hud-hidden " : "") +
        (mobileFlight ? "mobile-flight-open" : "")
      }
    >
      <div ref={host} className="universe" />
      <div className="vignette" />
      <header className="topbar">
        <Link
          className="brand"
          href="/"
          aria-label="Solar System Explorer home"
        >
          <Orbit size={28} />
          <span>
            SOLAR SYSTEM<span className="brand-sub">EXPLORER / STEP 18</span>
          </span>
        </Link>
        <button className="search-button" onClick={() => setSearch(true)}>
          <Search size={17} />
          <span>Find a world</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className="header-actions">
          <button onClick={() => setPanel("help")} aria-label="Flight controls">
            <HelpCircle size={19} />
          </button>
          <button
            onClick={() => setPanel("settings")}
            aria-label="View settings"
          >
            <SlidersHorizontal size={19} />
          </button>
          <button
            aria-label="Toggle fullscreen"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else
                document.documentElement
                  .requestFullscreen?.()
                  .catch(() =>
                    setError("Fullscreen is unavailable in this browser view."),
                  );
            }}
          >
            <Maximize2 size={18} />
          </button>
          <button aria-label="Hide desktop interface" title="Hide interface" onClick={()=>{setPanel(null);setSearch(false);setMobileHudHidden(true);}}><EyeOff size={18}/></button>
        </div>
        <div className="mobile-header-actions">
          <button onClick={() => setSearch(true)} aria-label="Find a world">
            <Search size={19} />
          </button>
          <button
            onClick={() => setPanel("menu")}
            aria-label="Open exploration menu"
          >
            <Menu size={20} />
          </button>
          <button
            onClick={() => setMobileHudHidden(true)}
            aria-label="Hide interface"
          >
            <EyeOff size={19} />
          </button>
        </div>
      </header>
      <section className="flight-heading">
        <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
        <h1>
          Where do you
          <br />
          want to go?
        </h1>
        <p>{bodies.length} destinations. Endless perspective.</p>
      </section>
      <div className="view-tools">
        <button
          aria-label="System view"
          onClick={() => {
            engine.current?.overview();
            setOptions((o) => ({ ...o, orbits: true }));
          }}
        >
          <Orbit size={17} />
          <span>System view</span>
        </button>
        <div className="small-body-control">
          <button
            aria-label="Small-body regions overview"
            onClick={() => {
              setOptions((o) => ({ ...o, populations: true, orbits: true }));
              engine.current?.populationOverview();
            }}
          >
            <Orbit size={17} />
            <span>Small-body regions</span>
          </button>
          <details className="population-info">
            <summary aria-label="About small-body region markers" title="About small-body region markers">
              <Info size={14} />
            </summary>
            <aside className="population-info-card" aria-label="Small-body region information">
              <strong>SMALL-BODY REGIONS</strong>
              <span><i className="asteroid-dot" />Asteroid Belt</span>
              <span><i className="trojan-dot" />Jupiter Trojans (L4 / L5)</span>
              <span><i className="kuiper-dot" />Kuiper Belt</span>
              <p>Representative markers only. Use Small-body regions view; size and density greatly enhanced.</p>
            </aside>
          </details>
        </div>
        <button
          aria-label="Focus target"
          onClick={() => engine.current?.focus(selected, true)}
        >
          <Compass size={17} />
          <span>Focus target</span>
        </button>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}
      {!ready && !error && (
        <div className="loading">Bringing the solar system into view…</div>
      )}
      {minorView ? <aside className="target-card" aria-label="Selected small body"><span className="eyebrow">SMALL BODY</span><div className="world-title"><h2>{minorView.name}</h2></div><p className="kind">{minorView.context}</p><p className="description">Illustrative orbit · enlarged marker</p><button className="details-button" onClick={()=>setPanel('minor')}>Object information <ChevronRight size={17}/></button></aside> : <aside className="target-card" aria-label="Selected world">
        <div className="target-meta">
          <span className="eyebrow">SELECTED DESTINATION</span>
          <span className="object-index">
            {String(bodies.indexOf(b) + 1).padStart(2, "0")} / {bodies.length}
          </span>
        </div>
        <div className="world-title">
          <h2>{b.name}</h2>
          <span className="body-marker" style={{ background: b.color }} />
        </div>
        <p className="kind">{b.kind}</p>
        <p className="description">{b.description}</p>
        <div className="quick-facts">
          <div>
            <span>{b.id === "sun" ? "Nominal diameter" : "Mean diameter"}</span>
            <strong>
              {Math.round(b.radius * 2).toLocaleString()} <small>km</small>
            </strong>
          </div>
          {b.year !== null && (
            <div>
              <span>
                {b.parentId
                  ? `Orbit around ${bodies.find((body) => body.id === b.parentId)?.name ?? b.parentId}`
                  : "Orbit"}
              </span>
              <strong>
                {b.year < 1
                  ? (b.year * 365.25).toFixed(2)
                  : b.year.toFixed(1)}{" "}
                <small>{b.year < 1 ? "days" : "years"}</small>
              </strong>
            </div>
          )}
        </div>
        <button className="travel-button" disabled={!ready} onClick={travel}>
          <Navigation size={18} />
          Travel to {b.name}
          <ArrowUpRight size={19} />
        </button>
        <button
          className="details-button"
          onClick={() => openInformation(selected)}
        >
          Explore this world
          <ChevronRight size={17} />
        </button>
      </aside>}
      <aside className="mobile-target-dock" aria-label="Selected world">
        <span className="mobile-body-marker" style={{ background: b.color }} />
        <button
          className="mobile-world-summary"
          onClick={() => setPanel(minorView ? 'minor' : "menu")}
        >
          <strong>{minorView?.name??b.name}</strong>
          <span>{minorView?.context??b.kind}</span>
        </button>
        <button className="mobile-travel" disabled={!ready} onClick={()=>minorView?engine.current?.showMinorBody(minorView,true):travel()}>
          <Navigation size={18} />
          <span>Travel</span>
        </button>
        <button
          className={"mobile-fly " + (mobileFlight ? "active" : "")}
          onClick={() => setMobileFlight((v) => !v)}
          aria-label={
            mobileFlight ? "Hide flight controls" : "Show flight controls"
          }
        >
          <Navigation size={18} />
          <span className="sr-only">Flight controls</span>
        </button>
        <button
          onClick={() => setPanel("menu")}
          aria-label="Open exploration menu"
        >
          <Menu size={19} />
        </button>
      </aside>
      <div className="flight-status">
        <span className="status-icon">
          <Navigation size={16} />
        </span>
        <div>
          <span className="eyebrow">SPACECRAFT</span>
          <strong role="status">{status}</strong>
        </div>
        <button
          onClick={() => engine.current?.brake()}
          aria-label="Brake spacecraft"
        >
          Brake <kbd>Space</kbd>
        </button>
      </div>
      <div className="bottom-area">
        <div className="navigation-top">
          <div>
            <span className="eyebrow">CHOOSE YOUR NEXT DESTINATION</span>
            <span className="visit-count">
              {visited.length} / {bodies.length} visited · saved on this device
            </span>
          </div>
          <button className="guide-launch" onClick={() => setPanel("guide")}>
            <BookOpen size={16} />
            Astronomy guide
            <ArrowUpRight size={16} />
          </button>
        </div>
        <nav className="world-strip" aria-label="Worlds">
          {primaryBodies.map((p, i) => (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              className={"world-button " + (selected === p.id ? "active" : "")}
              aria-pressed={selected === p.id}
            >
              <span className="world-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="swatch" style={{ backgroundColor: p.color }} />
              <span>{p.name}</span>
              {visited.includes(p.id) && (
                <Check className="visited-check" size={12} />
              )}
            </button>
          ))}
        </nav>
        <footer className="bottom-bar">
          <div className="scale-note">
            {compatibility && (
              <span title="WebGL is unavailable. A reduced-detail 3D renderer is active.">
                Compatibility view ·
              </span>
            )}
            <span>
              {options.scientific ? "Scientific scale" : "Exploration scale"}
            </span>
            <span>·</span>
            <span>
              {options.scientific
                ? "Bodies enlarged for visibility"
                : "Distances compressed · bodies enlarged"}
            </span>
            {options.populations && <span>· Region markers exaggerated</span>}
          </div>
          <ClockControls
            rate={options.rate}
            time={time}
            onRateChange={(rate) => setOptions((o) => ({ ...o, rate }))}
          />
        </footer>
      </div>
      <div className="control-hint">
        <span>Drag to orbit</span>
        <span>Scroll to approach</span>
        <span>
          <kbd>W A S D</kbd> fly
        </span>
        <button onClick={() => setPanel("help")}>All controls</button>
      </div>
      <div
        className={"touch-flight " + (mobileFlight ? "is-open" : "")}
        aria-label="Touch flight controls"
      >
        <button
          className="touch-forward"
          aria-label="Fly forward"
          onPointerDown={() => touchMove("KeyW", true)}
          onPointerUp={() => touchMove("KeyW", false)}
          onPointerCancel={() => touchMove("KeyW", false)}
          onPointerLeave={() => touchMove("KeyW", false)}
        >
          <ArrowUp />
        </button>
        <button
          className="touch-left"
          aria-label="Fly left"
          onPointerDown={() => touchMove("KeyA", true)}
          onPointerUp={() => touchMove("KeyA", false)}
          onPointerCancel={() => touchMove("KeyA", false)}
          onPointerLeave={() => touchMove("KeyA", false)}
        >
          <ArrowLeft />
        </button>
        <button
          className="touch-brake"
          aria-label="Brake touch flight"
          onClick={() => engine.current?.brake()}
        >
          <span>STOP</span>
        </button>
        <button
          className="touch-right"
          aria-label="Fly right"
          onPointerDown={() => touchMove("KeyD", true)}
          onPointerUp={() => touchMove("KeyD", false)}
          onPointerCancel={() => touchMove("KeyD", false)}
          onPointerLeave={() => touchMove("KeyD", false)}
        >
          <ArrowRight />
        </button>
        <button
          className="touch-back"
          aria-label="Fly backward"
          onPointerDown={() => touchMove("KeyS", true)}
          onPointerUp={() => touchMove("KeyS", false)}
          onPointerCancel={() => touchMove("KeyS", false)}
          onPointerLeave={() => touchMove("KeyS", false)}
        >
          <ArrowDown />
        </button>
      </div>
      {mobileHudHidden && (
        <button
          className="hud-restore"
          onClick={() => setMobileHudHidden(false)}
          aria-label="Show interface"
        >
          <Eye size={20} />
          <span>Show controls</span>
        </button>
      )}
      <CommandDialog
        className="catalog-search-dialog"
        open={search}
        onOpenChange={setSearch}
        title="Search the Solar System"
        description="Search names, aliases, object types and parent context across the current catalogue."
      >
        <CommandInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search names, aliases or object types…"
        />
        <CommandList className="catalog-search-list">
          <CommandGroup heading="Small-body catalogue"><CommandItem onSelect={()=>{setSearch(false);setPanel('minor');}}>Explore asteroids, comets and distant objects</CommandItem></CommandGroup>
          {searchBusy && (
            <div className="search-loading">Searching catalogue…</div>
          )}
          <CommandEmpty>No matching catalogue object.</CommandEmpty>
          <CommandGroup
            heading={`Solar System catalogue · ${searchData.total} result${searchData.total === 1 ? "" : "s"}`}
          >
            {searchData.results.map((result) => (
              <SearchResultRow
                key={result.id}
                result={result}
                onShow={() => showObject(result.id)}
                onTravel={() => travelTo(result.id)}
                onInfo={() => openInformation(result.id)}
              />
            ))}
          </CommandGroup>
          {searchData.hasMore && (
            <p className="search-limit">
              Showing the first 20 matches. Refine your search.
            </p>
          )}
        </CommandList>
      </CommandDialog>
      <Sheet
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent
          side={panel === "menu" ? "bottom" : "right"}
          className={panel === "menu" ? "mobile-menu-sheet" : "info-sheet"}
        >
          <button className="panel-exit" onClick={()=>{setPanel(null);setSearch(false);}}>Back to space</button>
          <SheetTitle
            className={panel === "menu" || panel === "details" ? "sr-only" : ""}
          >
            {panel === "minor" ? "Asteroids & comets" : panel === "details"
              ? objectInfo.name
              : panel === "guide"
                ? "Astronomy guide"
                : panel === "settings"
                  ? "Your view"
                  : panel === "menu"
                    ? "Exploration menu"
                    : "Flight controls"}
          </SheetTitle>
          <SheetDescription
            className={panel === "menu" || panel === "details" ? "sr-only" : ""}
          >
            {panel === "details"
              ? objectInfo.type
              : panel === "guide"
                ? `Selected: ${minorView?.name??b.name} · Free local prototype`
                : panel === "settings"
                  ? "A clear distinction between the model and the view."
                  : panel === "menu"
                    ? `Actions for ${b.name}`
                    : panel === 'minor' ? "A locally stored NASA/JPL catalogue sample." : "Start with assisted travel, then take the controls."}
          </SheetDescription>
          {panel === 'minor' && <MinorBodyPanel initialBody={minorView} time={time} onClear={()=>{engine.current?.clearMinorBodies();setMinorView(null);}} onShow={(body,travel)=>{engine.current?.showMinorBody(body,travel);setMinorView(body);setPanel(null);}}/>}
          {panel === "menu" && (
            <div className="mobile-menu-content">
              <div className="mobile-menu-handle" />
              <div className="mobile-menu-world">
                <span
                  className="mobile-menu-marker"
                  style={{ background: b.color }}
                />
                <div>
                  <strong>{b.name}</strong>
                  <span>{b.kind}</span>
                </div>
              </div>
              <button
                className="mobile-menu-travel"
                disabled={!ready}
                onClick={travel}
              >
                <Navigation size={19} />
                Travel to {b.name}
                <ArrowUpRight size={19} />
              </button>
              <div className="mobile-action-grid">
                <button onClick={() => openInformation(selected)}>
                  <Compass size={18} />
                  <span>Explore this world</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => mobileAction(() => setMobileFlight(true))}
                >
                  <Navigation size={18} />
                  <span>Flight controls</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() =>
                    mobileAction(() => {
                      engine.current?.overview();
                      setOptions((o) => ({ ...o, orbits: true }));
                    })
                  }
                >
                  <Orbit size={18} />
                  <span>System view</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() =>
                    mobileAction(() => engine.current?.focus(selected, true))
                  }
                >
                  <Compass size={18} />
                  <span>Focus target</span>
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => setPanel("guide")}>
                  <BookOpen size={18} />
                  <span>Astronomy guide</span>
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => setPanel("settings")}>
                  <SlidersHorizontal size={18} />
                  <span>Settings</span>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="mobile-scale">
                <span>Scale</span>
                <div role="group" aria-label="Visualization scale">
                  <button
                    className={!options.scientific ? "active" : ""}
                    aria-pressed={!options.scientific}
                    onClick={() =>
                      setOptions((o) => ({ ...o, scientific: false }))
                    }
                  >
                    Exploration
                  </button>
                  <button
                    className={options.scientific ? "active" : ""}
                    aria-pressed={options.scientific}
                    onClick={() =>
                      setOptions((o) => ({ ...o, scientific: true }))
                    }
                  >
                    Scientific
                  </button>
                </div>
              </div>
              <div className="mobile-clock">
                <span>Simulation clock</span>
                <ClockControls
                  compact
                  rate={options.rate}
                  time={time}
                  onRateChange={(rate) => setOptions((o) => ({ ...o, rate }))}
                />
              </div>
            </div>
          )}
          {panel === "details" && (
            <>
              <ObjectInformation model={objectInfo} />
              <h3>
                <ArrowLeftRight size={18} />
                Compare distances
              </h3>
              <DistanceComparison
                model={comparison}
                selector={
                  <Picker
                    label="Compare distance with"
                    value={compare}
                    onChange={setCompare}
                    items={distanceTargets(detailsId)}
                  />
                }
              />
              {objectInfo.source && (
                <a
                  className="source-link"
                  href={objectInfo.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read more at NASA
                  <ArrowUpRight size={15} />
                </a>
              )}
              <DataProvenance id={detailsId} />
              {detailsBody && (
                <button
                  className="travel-button"
                  disabled={!ready}
                  onClick={() => travelTo(detailsId)}
                >
                  <Navigation size={17} />
                  Travel to {objectInfo.name}
                  <ArrowUpRight size={17} />
                </button>
              )}
            </>
          )}
          {panel === "guide" && (
            <>
              <div className="guide-note">
                Offline educational summaries and sourced physical data. Modeled
                distances are approximate; no live observations are connected.
                Nothing is sent to an AI service, so it has no usage cost.
                “Here” means the selected object, not your spacecraft location.
              </div>
              <h3>What would you like to know?</h3>
              <div className="suggestions">
                {[
                  "Could humans live here?",
                  "How hot or cold is it?",
                  "What missions explored it?",
                  "Does it have water?",
                  "How long are its day and year?",
                  "How far is it from Earth?",
                  "What objects are nearest to me?",
                  "Where am I?",
                  "What is the simulated date and time?",
                ].map((q) => (
                  <button key={q} disabled={guideBusy} onClick={() => ask(q)}>
                    {q}
                    <MoveUpRight size={15} />
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (question.trim()) ask(question);
                }}
                className="ask-form"
              >
                <input
                  aria-label="Ask about selected world"
                  placeholder={`Ask about ${minorView?.name??b.name}…`}
                  maxLength={600}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                  aria-label="Ask guide"
                  disabled={!question.trim() || guideBusy}
                >
                  {guideBusy ? (
                    <span className="guide-loading">…</span>
                  ) : (
                    <Send size={17} />
                  )}
                </button>
              </form>
              {guideResult && (
                <div className="guide-answer" aria-live="polite">
                  <span className="eyebrow">ABOUT {guideResult.subject.toUpperCase()}</span>
                  <p>{guideResult.contextNote}</p>
                  <p>Snapshot: {Number.isFinite(guideResult.atUtcMs)?new Date(guideResult.atUtcMs).toISOString():'Time unavailable'}</p>
                  <p>{guideResult.explanation}</p>
                  {guideResult.evidence.map(f=><div key={f.id} className="guide-note"><strong>{f.label}: {f.value}</strong><p>{f.quality} · {f.note}</p>{f.sources.map(s=><a key={s.url} className="source-link" href={s.url} target="_blank" rel="noreferrer">{s.title}<ArrowUpRight size={15}/></a>)}</div>)}
                </div>
              )}
            </>
          )}
          {panel === "settings" && (
            <>
              <div className="setting-row">
                <div>
                  <strong>Scientific scale</strong>
                  <p>
                    On: uncompressed center distances. Off: exploration
                    distances. Bodies stay enlarged; all displayed measurements
                    use real units and the documented astronomy model.
                  </p>
                </div>
                <Switch
                  checked={options.scientific}
                  onCheckedChange={(v) =>
                    setOptions((o) => ({ ...o, scientific: v }))
                  }
                  aria-label="Scientific scale"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Orbital paths</strong>
                  <p>
                    Trace the approximate paths of the planets and the currently
                    relevant moon system.
                  </p>
                </div>
                <Switch
                  checked={options.orbits}
                  onCheckedChange={(v) =>
                    setOptions((o) => ({ ...o, orbits: v }))
                  }
                  aria-label="Orbital paths"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Small-body regions</strong>
                  <p>
                    Show representative markers for the Asteroid Belt, Kuiper
                    Belt, and Jupiter&apos;s leading and trailing Trojan regions.
                    Marker size and density are greatly enhanced for visibility;
                    dots are not object counts or precise current positions.
                  </p>
                </div>
                <Switch
                  checked={options.populations}
                  onCheckedChange={(v) =>
                    setOptions((o) => ({ ...o, populations: v }))
                  }
                  aria-label="Small-body regions"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>World labels</strong>
                  <p>Select a visible name to target a world.</p>
                </div>
                <Switch
                  checked={options.labels}
                  onCheckedChange={(v) =>
                    setOptions((o) => ({ ...o, labels: v }))
                  }
                  aria-label="World labels"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Reduced motion</strong>
                  <p>Instant assisted travel and no surface rotation.</p>
                </div>
                <Switch
                  checked={options.reduced}
                  onCheckedChange={(v) =>
                    setOptions((o) => ({ ...o, reduced: v }))
                  }
                  aria-label="Reduced motion"
                />
              </div>
              <div className="progress-setting">
                <div>
                  <strong>Journey progress</strong>
                  <p>
                    {visited.length} of {bodies.length} destinations visited.
                    Saved in this browser on this device.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setVisited(["earth"]);
                    localStorage.removeItem("solar-explorer-progress-v1");
                  }}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
              <h3>Simulation clock</h3>
              <p className="fineprint">
                The displayed UTC time drives orbital positions continuously at
                pause, real time, 10×, 100× or 1,000×. The scene updates every
                rendered frame while this text display updates twice per second
                to avoid unnecessary interface work.
              </p>
              <h3>About this simulation</h3>
              <p className="fineprint">
                Planet positions follow JPL’s 1800–2050 approximate Keplerian
                model, using UTC as an approximation to dynamical time. Orbital
                speed varies naturally along each ellipse, and body rotation
                follows the displayed simulation time. JPL’s nominal radial
                errors for this compact model range from about 1,000 km for
                Mercury to 1,500,000 km for Saturn. The simulation stops at the
                end of 2049.
              </p>
              <p className="fineprint">
                Earth represents the Earth–Moon barycenter. Major moons use
                sourced J2000 mean ellipses transformed from their published
                reference planes. Their propagated positions remain illustrative
                and have no validated error bounds. Positions are geometric and
                simultaneous: there is no light-time, relativistic, precession or
                perturbation correction. This is an educational system view, not
                a sky-pointing or mission-navigation ephemeris.
              </p>
              <p className="fineprint">
                Atmospheres, lighting, star positions and the curved
                assisted-travel route are visual approximations. No surface
                landing or collision physics is simulated.
              </p>
              <a
                className="source-link"
                href="https://ssd.jpl.nasa.gov/planets/approx_pos.html"
                target="_blank"
                rel="noreferrer"
              >
                JPL position model
                <ArrowUpRight size={15} />
              </a>
              <h3>Surface imagery</h3>
              <p className="fineprint">
                Maps by Solar System Scope / INOVE, based on NASA imagery; CC BY
                4.0. Colors are enhanced and unmapped regions may contain
                illustrative terrain. Surface maps load only when needed.
              </p>
              <a
                className="source-link"
                href="https://www.solarsystemscope.com/textures/"
                target="_blank"
                rel="noreferrer"
              >
                Texture credits
                <ArrowUpRight size={15} />
              </a>
              <a
                className="source-link"
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0 license
                <ArrowUpRight size={15} />
              </a>
            </>
          )}
          {panel === "help" && (
            <>
              <p>
                Choose a world along the bottom, then select <b>Travel to</b>.
                Your spacecraft follows a curved approach whose duration depends
                on the visual journey, not physical travel time.
              </p>
              <dl className="controls-list">
                {[
                  ["Drag", "Orbit the focused world"],
                  ["Scroll / pinch", "Approach or move away"],
                  ["Touch arrows", "Hold to fly on a phone or tablet"],
                  ["W / S", "Fly forward / backward"],
                  ["A / D", "Move left / right"],
                  ["Q / E", "Move down / up"],
                  ["Arrow keys", "Turn your view"],
                  ["Shift + movement", "Fly faster"],
                  ["Space / Esc", "Brake or cancel travel"],
                  ["⌘ / Ctrl + K", "Find a world"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>
                      <kbd>{k}</kbd>
                    </dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p>
                Use <b>Focus target</b> if you lose your bearings.{" "}
                <b>System view</b> shows the entire planetary system. Selecting
                a world changes your target; travel begins only when you request
                it.
              </p>
              <p className="fineprint">
                On touchscreens, drag to orbit, pinch to zoom, or hold the
                on-screen flight arrows. Visited worlds are saved in this
                browser on this device.
              </p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
