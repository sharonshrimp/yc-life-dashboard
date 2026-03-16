"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// --- SVG Icons ---
const Icons = {
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>,
};

const typeMap: { [key: string]: { icon: string, color: string, badge: string } } = {
  "緊急": { icon: "🚨", color: "bg-rose-50 text-rose-600", badge: "bg-rose-500" },
  "會議": { icon: "👥", color: "bg-amber-50 text-amber-600", badge: "bg-amber-500" },
  "其他": { icon: "📝", color: "bg-slate-50 text-slate-600", badge: "bg-slate-500" },
};

export default function WorkProgressHub() {
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date()); // 控制目前顯示哪一週
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workData, setWorkData] = useState<any>({});
  
  const [type, setType] = useState('緊急');
  const [taskName, setTaskName] = useState('');
  const [note, setNote] = useState('');

  // 1. 計算當前視圖的整週日期 (一到日)
  const currentWeek = useMemo(() => {
    const tempDate = new Date(viewDate);
    const day = tempDate.getDay();
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(tempDate.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [viewDate]);

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

  const saveTask = async () => {
    if (!taskName) return;
    const newTask = { id: Date.now(), name: taskName, type, note, completed: false };
    const updatedTasks = [...(dayData.tasks || []), newTask];
    const newData = { ...workData, [selectedDate]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
    setTaskName(''); setNote('');
  };

  const toggleTask = async (taskId: number) => {
    const updatedTasks = dayData.tasks.map((t: any) => t.id === taskId ? { ...t, completed: !t.completed } : t);
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

  const shiftWeek = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() + (offset * 7));
    setViewDate(newDate);
  };

  const completionStats = useMemo(() => {
    const tasks = dayData.tasks || [];
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t: any) => t.completed).length / tasks.length) * 100);
  }, [dayData.tasks]);

  if (loading) return <div className="p-10 text-center font-black text-slate-300">VELOCITY HUB LOADING...</div>;

  return (
    <main className="bg-[#F8FAFC] min-h-screen p-4 pb-20 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <header className="mb-6 flex justify-between items-center px-1">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase">Velocity <span className="text-indigo-600">Hub</span></h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Work Progress Tracker</p>
          </div>
          <button onClick={() => { setViewDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]); }} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-indigo-500">
            <Icons.Calendar />
          </button>
        </header>

        {/* 智慧週曆規劃區 */}
        <section className="bg-white rounded-3xl p-4 mb-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4 px-2">
            <button onClick={() => shiftWeek(-1)} className="text-slate-300 hover:text-indigo-500 transition-colors"><Icons.ChevronLeft /></button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {new Date(currentWeek[0]).getMonth() + 1}月 工作進度週期
            </span>
            <button onClick={() => shiftWeek(1)} className="text-slate-300 hover:text-indigo-500 transition-colors"><Icons.ChevronRight /></button>
          </div>
          
          <div className="flex justify-between">
            {currentWeek.map((dateStr) => {
              const d = new Date(dateStr);
              const isSelected = dateStr === selectedDate;
              const hasTasks = workData[dateStr]?.tasks?.length > 0;
              const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
              
              return (
                <button 
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center py-3 rounded-2xl min-w-[42px] transition-all ${
                    isSelected ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'hover:bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className={`text-[9px] font-bold mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {dayNames[d.getDay()]}
                  </span>
                  <span className="text-sm font-black">{d.getDate()}</span>
                  <div className={`w-1 h-1 rounded-full mt-1.5 ${hasTasks ? (isSelected ? 'bg-white' : 'bg-indigo-400') : 'bg-transparent'}`}></div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 任務輸入 */}
        <section className="bg-white rounded-[2rem] p-6 mb-6 shadow-sm border-t-4 border-indigo-500">
           {/* ... 保留上一版的任務輸入 UI ... */}
           <div className="flex gap-2 mb-5">
            {["緊急", "會議", "其他"].map(t => (
              <button key={t} onClick={() => setType(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${type === t ? `${typeMap[t].color} ring-1 ring-current` : 'bg-slate-50 text-slate-400'}`}>
                {typeMap[t].icon} {t}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border border-transparent focus:bg-white focus:border-indigo-100 transition-all text-sm" placeholder="輸入任務..." value={taskName} onChange={(e) => setTaskName(e.target.value)} />
            <button onClick={saveTask} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition-all">部署今日任務</button>
          </div>
        </section>

        {/* 當日任務明細 */}
        <section className="space-y-3">
          <div className="flex justify-between px-4 items-center">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{selectedDate} LOG</h3>
            {completionStats > 0 && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{completionStats}% DONE</span>}
          </div>

          {dayData.tasks.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-300 font-bold italic text-[10px]">無排定事項</div>
          ) : (
            dayData.tasks.map((task: any) => (
              <div key={task.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between transition-all ${task.completed ? 'opacity-40 border-transparent' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3 flex-1">
                  <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-500 text-white' : 'bg-slate-50 border border-slate-200 text-transparent'}`}><Icons.Check /></button>
                  <div>
                    <h4 className={`text-sm font-black text-slate-800 ${task.completed ? 'line-through' : ''}`}>{task.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{task.type}</span>
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-slate-200 hover:text-rose-400 p-2"><Icons.Trash /></button>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}