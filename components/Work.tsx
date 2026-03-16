"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// --- SVG Icons ---
const Icons = {
  Check: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>,
  Trash: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>,
};

export default function WeeklyVelocityHub() {
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [workData, setWorkData] = useState<any>({});
  const [inputStates, setInputStates] = useState<{ [key: string]: string }>({});

  const weekdays = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

  // 計算當週日期
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

  const addTask = async (dateStr: string) => {
    const name = inputStates[dateStr];
    if (!name) return;

    const dayData = workData[dateStr] || { tasks: [] };
    const newTask = { id: Date.now(), name, completed: false };
    const updatedTasks = [...(dayData.tasks || []), newTask];
    
    const newData = { ...workData, [dateStr]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
    setInputStates(prev => ({ ...prev, [dateStr]: '' }));
  };

  const toggleTask = async (dateStr: string, taskId: number) => {
    const dayData = workData[dateStr];
    const updatedTasks = dayData.tasks.map((t: any) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const newData = { ...workData, [dateStr]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
  };

  const deleteTask = async (dateStr: string, taskId: number) => {
    const dayData = workData[dateStr];
    const updatedTasks = dayData.tasks.filter((t: any) => t.id !== taskId);
    const newData = { ...workData, [dateStr]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">WEEKLY DEPLOYMENT LOADING...</div>;

  return (
    <main className="bg-[#F1F5F9] min-h-screen p-4 pb-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">
              Weekly <span className="text-indigo-600">Velocity</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Deployment Dashboard</p>
          </div>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
            <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() - 7)))} className="text-slate-400 hover:text-indigo-600"><Icons.ChevronLeft /></button>
            <span className="text-xs font-black text-slate-700 w-24 text-center">
                {new Date(currentWeek[0]).toLocaleDateString('zh-TW', {month:'short', day:'numeric'})} - {new Date(currentWeek[6]).toLocaleDateString('zh-TW', {day:'numeric'})}
            </span>
            <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() + 7)))} className="text-slate-400 hover:text-indigo-600"><Icons.ChevronRight /></button>
          </div>
        </header>

        {/* 瀑布流週清單 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {currentWeek.map((dateStr, idx) => {
            const d = new Date(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const tasks = workData[dateStr]?.tasks || [];

            return (
              <section key={dateStr} className={`flex flex-col bg-white rounded-[2rem] p-4 shadow-sm border-2 transition-all ${isToday ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-transparent'}`}>
                {/* 標題區 */}
                <div className="mb-4 px-1">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {weekdays[idx]}
                    </span>
                    {isToday && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>}
                  </div>
                  <h2 className="text-xl font-black text-slate-800">{d.getDate()}</h2>
                </div>

                {/* 輸入框 */}
                <div className="relative mb-4">
                  <input 
                    className="w-full bg-slate-50 p-3 pr-10 rounded-xl text-xs font-bold outline-none border border-slate-100 focus:bg-white focus:border-indigo-200 transition-all"
                    placeholder="新增任務..."
                    value={inputStates[dateStr] || ''}
                    onChange={(e) => setInputStates(prev => ({ ...prev, [dateStr]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addTask(dateStr)}
                  />
                  <button onClick={() => addTask(dateStr)} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors">
                    <Icons.Plus />
                  </button>
                </div>

                {/* 任務列表 */}
                <div className="flex-1 space-y-2">
                  {tasks.length === 0 ? (
                    <div className="py-4 text-center text-[10px] font-bold text-slate-200 italic border border-dashed border-slate-100 rounded-xl">Empty</div>
                  ) : (
                    tasks.map((task: any) => (
                      <div key={task.id} className="group flex items-start gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 hover:bg-white hover:border-indigo-100 transition-all">
                        <button 
                          onClick={() => toggleTask(dateStr, task.id)}
                          className={`mt-0.5 w-4 h-4 shrink-0 rounded flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-500 text-white' : 'bg-white border-2 border-slate-200 text-transparent'}`}
                        >
                          <Icons.Check />
                        </button>
                        <span className={`flex-1 text-[11px] font-bold leading-tight break-all ${task.completed ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                          {task.name}
                        </span>
                        <button onClick={() => deleteTask(dateStr, task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                          <Icons.Trash />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}