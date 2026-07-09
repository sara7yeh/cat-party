"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Minus, Plus, RotateCcw, Shuffle, Sparkles, X } from "lucide-react";

type DontDoTab = "draw" | "records";
type DrawStage = "idle" | "guard" | "reveal";
type PlayerRecord = { task: string; caught: number };
type Records = Record<string, PlayerRecord>;

const DEFAULT_TASKS = [
  "不能说“好”",
  "不能说“谢谢”",
  "不能说数字",
  "不能说“不是”",
  "不能说“我”",
  "不能说“你”",
  "不能说“真的”",
  "不能回答是或不是",
  "不能叫别人名字",
  "不能摸头",
  "不能摸头发",
  "不能翘腿",
  "不能看手机时间",
  "不能双手抱胸",
  "不能用手托脸",
  "不能笑出声",
  "不能喝水前说话",
  "不能指别人",
  "不能说口头禅",
  "不能重复别人刚说的话",
  "不能说英文",
  "不能说“随便”",
  "不能说“等一下”",
  "不能把手放进口袋",
];

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}

const cleanPlayers = (players: string[]) =>
  players.map(name => name.trim()).filter(Boolean);

const emptyRecords = (players: string[]) =>
  cleanPlayers(players).reduce<Records>((all, name) => {
    all[name] = { task: "", caught: 0 };
    return all;
  }, {});

const normalizeTask = (task: string) => {
  const cleaned = task.trim();
  if (!cleaned) return "";
  return cleaned.startsWith("不能") ? cleaned : `不能${cleaned}`;
};

export default function DontDoGame({ players, setPlayers, onClose }: { players: string[]; setPlayers: Dispatch<SetStateAction<string[]>>; onClose: () => void }) {
  const roster = useMemo(() => cleanPlayers(players), [players]);
  const [started, setStarted] = useLocalState("dontdo_started_v1", false);
  const [tab, setTab] = useLocalState<DontDoTab>("dontdo_tab_v1", "draw");
  const [selfName, setSelfName] = useLocalState("dontdo_self_name_v1", roster[0] || "");
  const [records, setRecords] = useLocalState<Records>("dontdo_records_v1", emptyRecords(roster));
  const [customTasks, setCustomTasks] = useLocalState<string[]>("dontdo_custom_tasks_v1", []);
  const [removedDefaultTasks, setRemovedDefaultTasks] = useLocalState<string[]>("dontdo_removed_default_tasks_v1", []);
  const [newPlayer, setNewPlayer] = useState("");
  const [customTask, setCustomTask] = useState("");
  const [poolOpen, setPoolOpen] = useState(false);
  const [stage, setStage] = useState<DrawStage>("idle");
  const [drawnTask, setDrawnTask] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);

  const defaultTasks = useMemo(() => DEFAULT_TASKS.filter(task => !removedDefaultTasks.includes(task)), [removedDefaultTasks]);
  const taskPool = useMemo(() => [...defaultTasks, ...customTasks], [customTasks, defaultTasks]);

  useEffect(() => {
    if (!roster.length) return;
    setSelfName(current => (roster.includes(current) ? current : roster[0]));
    setRecords(current => {
      const next = { ...current };
      roster.forEach(name => {
        if (!next[name]) next[name] = { task: "", caught: 0 };
      });
      Object.keys(next).forEach(name => {
        if (!roster.includes(name)) delete next[name];
      });
      return next;
    });
  }, [roster, setRecords, setSelfName]);

  const activePlayer = roster.includes(selfName) ? selfName : roster[0] || "";
  const currentRecord = (name: string) => records[name] || { task: "", caught: 0 };
  const totalCaught = roster.reduce((sum, name) => sum + currentRecord(name).caught, 0);

  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name || roster.includes(name)) return;
    setPlayers(current => [...current, name]);
    setSelfName(current => current || name);
    setNewPlayer("");
  };

  const removePlayer = (name: string) => {
    setPlayers(current => current.filter(player => player.trim() !== name));
    setRecords(current => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const addCustomTask = () => {
    const task = normalizeTask(customTask);
    if (!task || taskPool.includes(task)) return;
    setCustomTasks(tasks => [...tasks, task]);
    setCustomTask("");
    setNotice(`已加入抽奖池：${task}`);
  };

  const removeCustomTask = (task: string) => {
    setCustomTasks(tasks => tasks.filter(item => item !== task));
  };

  const removeDefaultTask = (task: string) => {
    setRemovedDefaultTasks(tasks => tasks.includes(task) ? tasks : [...tasks, task]);
  };

  const draw = () => {
    if (!activePlayer || !taskPool.length) return;
    const task = taskPool[Math.floor(Math.random() * taskPool.length)];
    setDrawnTask(task);
    setNotice("");
    setStage("guard");
  };

  const finishReveal = () => {
    setStage("idle");
    setDrawnTask("");
    setTab("records");
  };

  const setTask = (name: string, task: string) => {
    setRecords(all => {
      const old = all[name] || { task: "", caught: 0 };
      return { ...all, [name]: { ...old, task } };
    });
  };

  const changeCaught = (name: string, delta: number) => {
    setRecords(all => {
      const old = all[name] || { task: "", caught: 0 };
      return { ...all, [name]: { ...old, caught: Math.max(0, old.caught + delta) } };
    });
  };

  const catchPlayer = (name: string) => {
    changeCaught(name, 1);
    setNotice(`${name} 被抓到啦：先执行现场约定惩罚，再重新抽一个新任务。`);
  };

  const resetRound = () => {
    setRecords(emptyRecords(roster));
    setStage("idle");
    setDrawnTask("");
    setNotice("本局任务和被抓次数已清空。");
  };

  return <div className="fullscreen dontdo-screen">
    <DontDoHead onClose={() => setConfirmExit(true)} title="🚫 不要做挑战" />
    <main className="dontdo-shell">
      {!started ? <section className="dontdo-start">
        <div className="dontdo-hero">
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icons/games/dontdo.png`} alt="不要做挑战" />
          <div><span>DON'T DO</span><h1>设下小陷阱，等朋友自己踩进来。</h1><p>每个人抽自己的秘密禁忌，但任务只给别人看。手机负责遮挡、记录和计分。</p></div>
        </div>
        <section className="dontdo-phone-note"><b>每位玩家都要进入游戏</b><p>每个人用自己的手机打开这个游戏，并在本机视角里选择自己。这样自己的任务会被隐藏，只能看到其他人的记录。</p></section>
        <section className="dontdo-panel">
          <div className="dontdo-section-head split"><div><span>本局玩家</span><h2>设置玩家</h2></div><strong>{roster.length} 人</strong></div>
          <div className="dontdo-edit-roster">{roster.map(name => <span key={name}>{name}<button onClick={() => removePlayer(name)} aria-label={`删除 ${name}`}><X /></button></span>)}</div>
          <div className="dontdo-add-row"><input value={newPlayer} onChange={event => setNewPlayer(event.target.value)} onKeyDown={event => event.key === "Enter" && addPlayer()} placeholder="输入玩家名字" /><button disabled={!newPlayer.trim() || roster.includes(newPlayer.trim())} onClick={addPlayer}><Plus />加入玩家</button></div>
          <button className="primary full" disabled={roster.length < 4} onClick={() => setStarted(true)}><Sparkles />开始本局</button>
          {roster.length < 4 && <p className="dontdo-warning">建议至少 4 人一起玩，诱导和抓人会更有趣。</p>}
        </section>
      </section> : <>
        <section className="dontdo-score-strip">
          <div><small>本局已抓到</small><b>{totalCaught}</b></div>
          <div><small>玩家</small><b>{roster.length}</b></div>
          <button onClick={resetRound}><RotateCcw />重置本局</button>
        </section>

        <div className="dontdo-tabs">
          <button className={tab === "draw" ? "on" : ""} onClick={() => setTab("draw")}>🎲 抽取任务</button>
          <button className={tab === "records" ? "on" : ""} onClick={() => setTab("records")}>👀 秘密记录</button>
        </div>

        {notice && <div className="dontdo-notice"><Sparkles />{notice}</div>}

        {tab === "draw" ? <section className="dontdo-panel">
          <div className="dontdo-section-head split">
            <div><span>当前本机玩家</span><h2>抽取自己的秘密任务</h2></div>
            <select value={activePlayer} onChange={event => setSelfName(event.target.value)}>{roster.map(name => <option key={name} value={name}>{name}</option>)}</select>
          </div>
          <button className="primary full dontdo-draw-button" disabled={!activePlayer} onClick={draw}><Shuffle />抽取任务</button>
          <p className="dontdo-help">抽到后先遮挡屏幕，当前玩家不要偷看，再交给其他玩家记录。</p>
          <section className="dontdo-task-pool">
            <div><b>加入自定义任务</b><small>当前抽奖池 {taskPool.length} 条 · 自定义 {customTasks.length} 条</small></div>
            <div className="dontdo-add-row"><input value={customTask} onChange={event => setCustomTask(event.target.value)} onKeyDown={event => event.key === "Enter" && addCustomTask()} placeholder="例如：不能说“然后”" /><button disabled={!normalizeTask(customTask) || taskPool.includes(normalizeTask(customTask))} onClick={addCustomTask}><Plus />加入抽奖池</button></div>
            <button className="dontdo-pool-toggle" onClick={() => setPoolOpen(open => !open)}><span><b>查看抽奖池</b><small>默认 {defaultTasks.length} 条 · 自定义 {customTasks.length} 条</small></span><ChevronRight className={poolOpen ? "open" : ""} /></button>
            {poolOpen && <div className="dontdo-pool-list">
              {taskPool.length ? <>
                {defaultTasks.length > 0 && <section><b>默认任务</b><div>{defaultTasks.map(task => <span key={task}>{task}<button onClick={() => removeDefaultTask(task)} aria-label={`删除 ${task}`}><X /></button></span>)}</div></section>}
                {customTasks.length > 0 && <section><b>自定义任务</b><div>{customTasks.map(task => <span key={task}>{task}<button onClick={() => removeCustomTask(task)} aria-label={`删除 ${task}`}><X /></button></span>)}</div></section>}
              </> : <p>抽奖池空了，先加入一个自定义任务再抽。</p>}
            </div>}
          </section>
        </section> : <section className="dontdo-panel compact-panel">
          <div className="dontdo-section-head split">
            <div><span>本机视角</span><h2>谁正在拿这台手机？</h2></div>
            <select value={activePlayer} onChange={event => setSelfName(event.target.value)}>{roster.map(name => <option key={name} value={name}>{name}</option>)}</select>
          </div>
          <div className="dontdo-record-list">{roster.map(name => {
            const record = currentRecord(name);
            const hidden = name === activePlayer;
            return <article key={name} className={hidden ? "self" : ""}>
              <header><div><span>{name.slice(0, 1)}</span><b>{name}</b></div><strong>×{record.caught}</strong></header>
              {hidden ? <div className="dontdo-hidden-task">🙈 你的任务由别人保管</div> : <label><small>当前秘密任务</small><input value={record.task} onChange={event => setTask(name, event.target.value)} placeholder="🚫 不能摸头" /></label>}
              <footer>
                <button onClick={() => changeCaught(name, -1)} aria-label={`${name} 被抓次数减一`}><Minus /></button>
                <button className="catch" onClick={() => catchPlayer(name)}>抓到！</button>
                <button onClick={() => changeCaught(name, 1)} aria-label={`${name} 被抓次数加一`}><Plus /></button>
              </footer>
            </article>;
          })}</div>
        </section>}
      </>}
    </main>

    {stage !== "idle" && <div className="dontdo-modal" role="dialog" aria-modal="true">
      <section className={stage === "guard" ? "dontdo-reveal-card guard" : "dontdo-reveal-card"}>
        {stage === "guard" ? <>
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icons/games/dontdo.png`} alt="" />
          <span>小猫在盯着你！</span>
          <h2>不要偷看，把手机递给其他玩家。</h2>
          <p>只有其他玩家可以看到 {activePlayer} 的本局禁忌任务。</p>
          <button className="primary full" onClick={() => setStage("reveal")}>给其他玩家看</button>
        </> : <>
          <small>只有其他玩家看到</small>
          <h2>🚫 {activePlayer} 本局不能：</h2>
          <strong>{drawnTask.replace(/^不能/, "")}</strong>
          <p>请把这条任务手动记录到每个人的“秘密记录”里。</p>
          <button className="primary full" onClick={finishReveal}>所有玩家已记录</button>
        </>}
      </section>
    </div>}

    {confirmExit && <div className="dontdo-modal" role="dialog" aria-modal="true">
      <section className="dontdo-exit-card">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icons/games/dontdo.png`} alt="" />
        <h2>要退出不要做挑战吗？</h2>
        <p>本局记录、自定义任务和玩家名单会继续保存在本机，下次进入还能接着看。</p>
        <div><button className="secondary" onClick={() => setConfirmExit(false)}>继续游戏</button><button className="dontdo-exit-danger" onClick={onClose}>确认退出</button></div>
      </section>
    </div>}
  </div>;
}

function DontDoHead({ title, onClose }: { title: string; onClose: () => void }) {
  return <header className="play-head"><button onClick={onClose} aria-label="关闭"><X /></button><div>{title}<small>半手动秘密任务</small></div><span /></header>;
}
