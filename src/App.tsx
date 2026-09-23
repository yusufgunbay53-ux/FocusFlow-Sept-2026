import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Clock3,
  CloudRain,
  Headphones,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX
} from "lucide-react";
import { ColumnId, Priority, Task, createId } from "./types";
import { loadState, saveState } from "./lib/storage";
import { getCoachMessage } from "./lib/aiCoach";

const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: "todo", title: "Yapılacaklar" },
  { id: "doing", title: "Yapılıyor" },
  { id: "done", title: "Tamamlandı" }
];

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek"
};

function playBeep() {
  const ctx = new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = 880;
  g.gain.value = 0.08;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  setTimeout(() => {
    o.stop();
    ctx.close();
  }, 420);
}

function notify(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`glass group rounded-2xl p-3.5 transition hover:-translate-y-0.5 hover:shadow-neon ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 h-4 w-4 shrink-0 cursor-grab rounded-sm border border-neon/40"
          aria-label="Surukle"
        />
        <div className="min-w-0 flex-1">
          <button onClick={() => onEdit(task)} className="w-full text-left">
            <h3 className={`text-sm font-medium ${task.column === "done" ? "text-white/50 line-through" : ""}`}>
              {task.title}
            </h3>
            {task.notes ? <p className="mt-1 text-xs text-white/50">{task.notes}</p> : null}
          </button>
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                task.priority === "high"
                  ? "bg-rose-500/20 text-rose-200"
                  : task.priority === "medium"
                    ? "bg-amber-400/15 text-amber-200"
                    : "bg-sky-400/15 text-sky-200"
              }`}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
            <div className="flex gap-1">
              <button onClick={() => onToggle(task.id)} className="rounded-lg p-1.5 text-neon/80 transition hover:bg-white/10" title="Tamamla">
                <Check size={14} />
              </button>
              <button onClick={() => onDelete(task.id)} className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-rose-300" title="Sil">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Column({ id, title, tasks, children }: { id: ColumnId; title: string; tasks: Task[]; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section ref={setNodeRef} className={`glass min-h-[280px] rounded-3xl p-4 transition ${isOver ? "ring-1 ring-neon/50" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-white/80">{title}</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-neon">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">{children}</div>
      </SortableContext>
    </section>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [editing, setEditing] = useState<Task | null>(null);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState<"off" | "rain" | "lofi">("off");
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          playBeep();
          const finished = mode;
          notify(finished === "work" ? "Pomodoro bitti" : "Mola bitti", finished === "work" ? "5 dakikalik mola." : "Yeniden odaklan.");
          if (finished === "work") {
            setState((prev) => ({
              ...prev,
              sessions: [...prev.sessions, { id: createId(), mode: "work", durationSec: 25 * 60, completedAt: new Date().toISOString() }],
              stats: { ...prev.stats, pomodorosToday: prev.stats.pomodorosToday + 1, lastActiveAt: new Date().toISOString() }
            }));
            setMode("break");
            return 5 * 60;
          }
          setMode("work");
          return 25 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, mode]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (sound === "off" || muted) { el.pause(); return; }
    el.src = sound === "rain" ? rainDataUri() : lofiDataUri();
    el.loop = true;
    el.volume = 0.35;
    el.play().catch(() => undefined);
  }, [sound, muted]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const grouped = useMemo(() => ({
    todo: state.tasks.filter((t) => t.column === "todo"),
    doing: state.tasks.filter((t) => t.column === "doing"),
    done: state.tasks.filter((t) => t.column === "done")
  }), [state.tasks]);

  const coach = getCoachMessage(state, running && mode === "work", seconds);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  function addTask() {
    const value = (editing ? editing.title : title).trim();
    if (!value) return;
    if (editing) {
      setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => t.id === editing.id ? { ...editing, title: value, priority, updatedAt: new Date().toISOString() } : t) }));
      setEditing(null); setTitle(""); return;
    }
    const now = new Date().toISOString();
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, { id: createId(), title: value, priority, column: "todo", createdAt: now, updatedAt: now }] }));
    setTitle("");
  }

  function toggleDone(id: string) {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      if (!task) return prev;
      const toDone = task.column !== "done";
      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === id ? { ...t, column: toDone ? "done" : "todo", completedAt: toDone ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() } : t),
        stats: { ...prev.stats, completedToday: Math.max(0, prev.stats.completedToday + (toDone ? 1 : -1)), lastActiveAt: new Date().toISOString() }
      };
    });
  }

  function removeTask(id: string) {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const targetColumn: ColumnId = (["todo", "doing", "done"] as ColumnId[]).includes(overId as ColumnId) ? (overId as ColumnId) : state.tasks.find((t) => t.id === overId)?.column ?? "todo";
    setState((prev) => {
      const current = prev.tasks.find((t) => t.id === active.id);
      if (!current || current.column === targetColumn) return prev;
      const toDone = targetColumn === "done" && current.column !== "done";
      const fromDone = current.column === "done" && targetColumn !== "done";
      return {
        ...prev,
        tasks: prev.tasks.map((t) => t.id === active.id ? { ...t, column: targetColumn, completedAt: targetColumn === "done" ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() } : t),
        stats: { ...prev.stats, completedToday: Math.max(0, prev.stats.completedToday + (toDone ? 1 : fromDone ? -1 : 0)), lastActiveAt: new Date().toISOString() }
      };
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-neon/80">FocusFlow</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Odaklanma asistani</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <span className="rounded-full border border-white/10 px-3 py-1">{state.stats.completedToday} gorev</span>
          <span className="rounded-full border border-white/10 px-3 py-1">{state.stats.pomodorosToday} pomodoro</span>
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="glass rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-neon">
                <Clock3 size={18} />
                <span className="text-sm font-medium">{mode === "work" ? "Calisma" : "Mola"}</span>
              </div>
              <button onClick={() => { setRunning(false); setMode("work"); setSeconds(25 * 60); }} className="text-xs text-white/50 hover:text-white">Sifirla</button>
            </div>
            <div className="mb-5 text-center font-semibold tabular-nums text-5xl tracking-tight text-white">{mm}:{ss}</div>
            <div className="flex gap-2">
              <button onClick={() => setRunning((v) => !v)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neon/90 px-4 py-2.5 font-medium text-night transition hover:bg-neon">
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? "Duraklat" : "Baslat"}
              </button>
              <button onClick={() => { setRunning(false); if (mode === "work") { setMode("break"); setSeconds(5 * 60); } else { setMode("work"); setSeconds(25 * 60); } }} className="rounded-2xl border border-white/10 px-3 text-sm text-white/70 transition hover:border-neon/40">Atla</button>
            </div>
          </section>
          <section className="glass rounded-3xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {sound === "rain" ? <CloudRain size={16} className="text-neon" /> : <Headphones size={16} className="text-neon" />}
                Ortam sesi
              </div>
              <button onClick={() => setMuted((m) => !m)} className="text-white/60 hover:text-white">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["off", "lofi", "rain"] as const).map((opt) => (
                <button key={opt} onClick={() => setSound(opt)} className={`rounded-xl px-2 py-2 text-xs transition ${sound === opt ? "bg-neon/20 text-neon" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                  {opt === "off" ? "Kapali" : opt === "lofi" ? "Lo-Fi" : "Yagmur"}
                </button>
              ))}
            </div>
            <audio ref={audioRef} />
          </section>
          <section className="glass rounded-3xl p-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-neon"><Sparkles size={16} /> AI performans kocu</div>
            <p className="text-sm leading-6 text-white/80">{coach.text}</p>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-white/35">Mock koc — API hazir</p>
          </section>
        </aside>
        <main className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="glass flex flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center">
            <input value={editing ? editing.title : title} onChange={(e) => (editing ? setEditing({ ...editing, title: e.target.value }) : setTitle(e.target.value))} placeholder="Yeni gorev ekle..." className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-neon/50" />
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="rounded-2xl border border-white/10 bg-night px-3 py-2.5 text-sm outline-none">
              <option value="low">Dusuk</option>
              <option value="medium">Orta</option>
              <option value="high">Yuksek</option>
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neon px-4 py-2.5 text-sm font-medium text-night transition hover:shadow-neon"><Plus size={16} />{editing ? "Kaydet" : "Ekle"}</button>
          </form>
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
            <div className="grid gap-4 md:grid-cols-3">
              {COLUMNS.map((col) => (
                <Column key={col.id} id={col.id} title={col.title} tasks={grouped[col.id]}>
                  {grouped[col.id].map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={toggleDone} onDelete={removeTask} onEdit={(t) => { setEditing(t); setPriority(t.priority); }} />
                  ))}
                </Column>
              ))}
            </div>
          </DndContext>
        </main>
      </div>
    </div>
  );
}

function rainDataUri() { return tinyNoiseWav(0.018); }
function lofiDataUri() { return tinyNoiseWav(0.01); }
function tinyNoiseWav(amp: number) {
  const sampleRate = 8000; const seconds = 2; const n = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + n); const view = new DataView(buffer);
  const write = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  write(0, "RIFF"); view.setUint32(4, 36 + n, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true); view.setUint16(34, 8, true); write(36, "data"); view.setUint32(40, n, true);
  let acc = 0;
  for (let i = 0; i < n; i++) { acc = acc * 0.98 + (Math.random() * 2 - 1) * amp * 40; view.setUint8(44 + i, Math.max(0, Math.min(255, 128 + acc))); }
  const bytes = new Uint8Array(buffer); let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}
