"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// --- SVG Icons ---
const Icons = {
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>,
  Clock: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
  Target: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
};

const categoryMap: { [key: string]: { icon: string, color: string } } = {
  "開發": { icon: "💻", color: "bg-indigo-50 text-indigo-600" },
  "會議": { icon: "🤝", color: "bg-amber-50 text-amber-600" },
  "行政": { icon: "📋", color: "bg-slate-100 text-slate-600" },
  "學習": { icon: "📖", color: "bg-emerald-50 text-emerald-600" },
  "緊急": { icon: "🚨", color: "bg-rose-50 text-rose-600" },
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WorkProgressHub() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [workData, setWorkData] = useState<any>({});
  
  // 表單狀態
  const [category, setCategory] = useState('開發');
  const [taskName, setTaskName] = useState('');
  const [estTime, setEstTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "trackers", "my-work-tracker"), (docSnap) => {
      if (docSnap.exists()) setWorkData(docSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const syncData = async (newData: any) => {
    await setDoc(doc(db, "trackers", "my-work-tracker"), newData);
  };

  const dayData = workData[selectedDate] || { tasks: [], plan: '' };

  // 計算當日完成度
  const stats = useMemo(() => {
    const tasks = dayData.tasks || [];
    if (tasks.length === 0) return { percent: 0, completed: 0, total: 0 };
    const completed = tasks.filter((t: any) => t.completed).length;
    return {
      percent: Math.round((completed / tasks.length) * 100),
      completed,
      total: tasks.length
    };
  }, [dayData]);

  const saveTask = async () => {
    if (!taskName) return;
    const newTask = {
      id: Date.now(),
      name: taskName,
      category,
      estTime: Number(estTime) || 0,
      note,
      completed: false,
    };

    const updatedTasks = [...(dayData.tasks || []), newTask];
    const newData = { ...workData, [selectedDate]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
    setTaskName(''); setEstTime(''); setNote('');
  };

  const toggleTask = async (taskId: number) => {
    const updatedTasks = dayData.tasks.map((t: any) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const newData = { ...workData, [selectedDate]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
  };

  const deleteTask = async (taskId: number) => {
    const updatedTasks = dayData.tasks.filter((t: any) => t.id !== taskId);
    const newData = { ...workData, [selectedDate]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 italic uppercase">Syncing Progress...</div>;

  return (
    <main className="bg-[#FBFBFE] min-h-screen text-slate-800 p-4 pb-20 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* Header & Overall Progress */}
        <header className="mb-8 pt-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none mb-1">
                Project <span className="text-indigo-600">Velocity</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Efficiency tracking system</p>
            </div>
            <input 
              type="date" 
              className="bg-white border-none shadow-sm rounded-full px-4 py-2 text-[11px] font-black text-indigo-600 outline-none" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-indigo-100/20 border border-white flex items-center gap-6 relative overflow-hidden">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray={`${stats.percent * 2.26} 226`} strokeLinecap="round" className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black leading-none">{stats.percent}%</span>
              </div>
            </div>
            <div>
              <h2 className="font-black italic text-slate-700 uppercase text-sm mb-1">今日進度掌控</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已完成 {stats.completed} / 總計 {stats.total} 任務</p>
            </div>
          </div>
        </header>

        {/* 新增任務區 */}
        <section className="bg-slate-900 rounded-[2.5rem] p-6 mb-8 shadow-2xl">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {Object.keys(categoryMap).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className={`flex flex-col items-center py-3 rounded-2xl transition-all ${category === cat ? 'bg-white/10 text-white ring-1 ring-white/20' : 'text-slate-500 hover:text-slate-300'}`}>
                <span className="text-xl mb-1">{categoryMap[cat].icon}</span>
                <span className="text-[9px] font-black uppercase">{cat}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-slate-600 outline-none focus:bg-white/10 transition-all" placeholder="輸入任務標題..." value={taskName} onChange={e => setTaskName(e.target.value)} />
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"><Icons.Clock /></span>
                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-white font-bold outline-none" placeholder="預估小時" value={estTime} onChange={e => setEstTime(e.target.value)} />
              </div>
              <button onClick={saveTask} className="bg-indigo-600 text-white px-6 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                <Icons.Plus />
              </button>
            </div>
          </div>
        </section>

        {/* 任務清單 */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-4 mb-2">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Task Backlog</h3>
          </div>

          {dayData.tasks?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-300 font-bold italic text-[11px]">今日尚無安排任務</div>
          ) : (
            dayData.tasks.map((task: any) => (
              <div key={task.id} className={`group bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4 transition-all ${task.completed ? 'opacity-60 grayscale' : 'hover:border-indigo-200'}`}>
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-200 border border-slate-100'}`}
                >
                  <Icons.Check />
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[15px] font-black italic ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.name}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${categoryMap[task.category]?.color}`}>{task.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <span className="flex items-center gap-1"><Icons.Target /> {task.estTime}H</span>
                    {task.note && <span className="truncate max-w-[120px]">{task.note}</span>}
                  </div>
                </div>

                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-200 hover:text-rose-500 transition-all">
                  <Icons.Trash />
                </button>
              </div>
            ))
          )}
        </section>

      </div>
    </main>
  );
}