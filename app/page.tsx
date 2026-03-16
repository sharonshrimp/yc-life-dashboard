"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// --- SVG Icons ---
const Icons = {
  Alert: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>,
  Users: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
  Briefcase: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V20a2 2 0 002 2h14a2 2 0 002-2v-6.745zM16 8V4a2 2 0 00-2-2H10a2 2 0 00-2 2v4H4a2 2 0 00-2 2v3.342c0 .603.492 1.108 1.083 1.201L12 15l8.917-1.457A1.083 1.083 0 0022 12.342V10a2 2 0 00-2-2h-4zM10 4h4v4h-4V4z"></path></svg>,
};

const typeMap: { [key: string]: { icon: string, color: string, label: string } } = {
  "緊急": { icon: "🚨", color: "bg-rose-50 text-rose-600 border-rose-100", label: "Urgent" },
  "會議": { icon: "👥", color: "bg-amber-50 text-amber-600 border-amber-100", label: "Meeting" },
  "其他": { icon: "📝", color: "bg-slate-50 text-slate-600 border-slate-100", label: "Others" },
};

export default function WorkProgressHub() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [workData, setWorkData] = useState<any>({});
  
  const [taskType, setTaskType] = useState('緊急');
  const [taskName, setTaskName] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "trackers", "my-work-tracker"), (snap) => {
      if (snap.exists()) setWorkData(snap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const syncData = async (newData: any) => {
    await setDoc(doc(db, "trackers", "my-work-tracker"), newData);
  };

  const dayData = workData[selectedDate] || { tasks: [], dailyGoal: '' };

  const addTask = async () => {
    if (!taskName) return;
    const newTask = {
      id: Date.now(),
      name: taskName,
      type: taskType,
      time: time,
      note: note,
      completed: false
    };
    const updatedTasks = [...(dayData.tasks || []), newTask];
    const newData = { ...workData, [selectedDate]: { ...dayData, tasks: updatedTasks } };
    setWorkData(newData);
    await syncData(newData);
    setTaskName(''); setTime(''); setNote('');
  };

  const toggleComplete = async (taskId: number) => {
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

  const completionRate = useMemo(() => {
    if (!dayData.tasks?.length) return 0;
    const done = dayData.tasks.filter((t: any) => t.completed).length;
    return Math.round((done / dayData.tasks.length) * 100);
  }, [dayData.tasks]);

  if (loading) return <div className="p-8 text-center animate-pulse font-black text-slate-300">VELOCITY LOADING...</div>;

  return (
    <main className="max-w-md mx-auto p-4 pb-24 animate-in fade-in duration-500">
      {/* Header: 顯示今日進度 */}
      <header className="mb-6 flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Velocity <span className="text-indigo-600">Hub</span></h2>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Daily Performance Track</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black italic text-indigo-600 leading-none">{completionRate}%</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase">Completed</div>
        </div>
      </header>

      {/* 快捷輸入區 */}
      <section className="bg-white rounded-[2rem] p-6 mb-6 shadow-sm border border-slate-100">
        <div className="flex gap-2 mb-6">
          {Object.keys(typeMap).map(type => (
            <button 
              key={type} 
              onClick={() => setTaskType(type)}
              className={`flex-1 py-3 rounded-2xl text-[11px] font-black transition-all border ${taskType === type ? `${typeMap[type].color} border-current shadow-sm` : 'bg-slate-50 text-slate-400 border-transparent'}`}
            >
              {typeMap[type].icon} {type}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-50 p-4 rounded-2xl font-bold outline-none focus:bg-white transition-all text-sm" 
              placeholder="任務名稱..." 
              value={taskName} 
              onChange={(e) => setTaskName(e.target.value)} 
            />
            <input 
              className="w-24 bg-slate-50 p-4 rounded-2xl font-bold outline-none text-center text-sm" 
              placeholder="時間" 
              value={time} 
              onChange={(e) => setTime(e.target.value)} 
            />
          </div>
          <textarea 
            className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-sm min-h-[80px]" 
            placeholder="補充備註 (選填)..." 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
          />
          <button 
            onClick={addTask}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Deploy Task
          </button>
        </div>
      </section>

      {/* 任務列表 */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-4 mb-2">
           <div className="flex items-center gap-2">
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-[10px] font-black uppercase bg-transparent text-slate-400 outline-none cursor-pointer" />
           </div>
           <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-tighter">
             {dayData.tasks?.length || 0} Tasks Active
           </span>
        </div>

        {!dayData.tasks?.length ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-300 font-bold italic text-[11px]">
            今日尚無安排任務，準備好開始了嗎？
          </div>
        ) : (
          dayData.tasks.map((task: any) => (
            <div 
              key={task.id} 
              className={`bg-white p-5 rounded-[1.8rem] shadow-sm border transition-all flex items-center justify-between ${task.completed ? 'opacity-50 border-transparent' : 'border-slate-100 hover:border-indigo-100'}`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleComplete(task.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-200 border border-slate-100'}`}
                >
                  <Icons.Check />
                </button>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-black uppercase ${typeMap[task.type].color} scale-75 origin-left`}>
                      {task.type}
                    </span>
                    {task.time && <span className="text-[10px] font-bold text-slate-400 italic">@ {task.time}</span>}
                  </div>
                  <h4 className={`font-black italic text-slate-800 leading-tight ${task.completed ? 'line-through' : ''}`}>
                    {task.name}
                  </h4>
                  {task.note && <p className="text-[10px] font-medium text-slate-400 mt-1">{task.note}</p>}
                </div>
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="text-slate-200 hover:text-rose-500 p-2 transition-colors"
              >
                <Icons.Trash />
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}