"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// --- 圖示與標籤配置 ---
const Icons = {
  ChevronLeft: () => <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>,
  ChevronRight: () => <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>,
  Check: () => <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>,
  Trash: () => <svg className="w-3.5 h-3.5 text-slate-200 hover:text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
};

const TAGS = [
  { id: 'urgent', label: '緊急', icon: '🚨' },
  { id: 'meeting', label: '會議', icon: '👥' },
  { id: 'other', label: '其他', icon: '📝' },
];

export default function WeeklyPlanHub() {
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [weeklyData, setWeeklyData] = useState<any>({});
  
  // 每一天獨立的輸入狀態
  const [inputState, setInputState] = useState<{ [key: string]: { text: string, tagIdx: number } }>({});

  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

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
    const unsub = onSnapshot(doc(db, "trackers", "weekly-planner-pro"), (docSnap) => {
      if (docSnap.exists()) setWeeklyData(docSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const syncData = async (newData: any) => {
    await setDoc(doc(db, "trackers", "weekly-planner-pro"), newData);
  };

  // 新增任務
  const handleAddTask = async (dateStr: string) => {
    const state = inputState[dateStr] || { text: '', tagIdx: 0 };
    if (!state.text.trim()) return;

    const newTask = {
      id: Date.now(),
      text: state.text,
      tag: TAGS[state.tagIdx].id,
      completed: false
    };

    const dayTasks = [...(weeklyData[dateStr] || []), newTask];
    const newData = { ...weeklyData, [dateStr]: dayTasks };
    
    setWeeklyData(newData);
    await syncData(newData);
    setInputState(prev => ({ ...prev, [dateStr]: { ...state, text: '' } }));
  };

  // 切換完成狀態
  const toggleTask = async (dateStr: string, taskId: number) => {
    const dayTasks = weeklyData[dateStr].map((t: any) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const newData = { ...weeklyData, [dateStr]: dayTasks };
    setWeeklyData(newData);
    await syncData(newData);
  };

  // 刪除任務
  const deleteTask = async (dateStr: string, taskId: number) => {
    const dayTasks = weeklyData[dateStr].filter((t: any) => t.id !== taskId);
    const newData = { ...weeklyData, [dateStr]: dayTasks };
    setWeeklyData(newData);
    await syncData(newData);
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-300 font-black">LOADING...</div>;

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 flex justify-center items-start">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-sm p-8 pt-12 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F1F5F9] rounded-full translate-x-10 -translate-y-10"></div>

        <header className="flex justify-between items-center mb-10 relative z-10">
          <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() - 7)))} className="w-9 h-9 rounded-full bg-[#F8FAFC] flex items-center justify-center"><Icons.ChevronLeft /></button>
          <button onClick={() => setViewDate(new Date())} className="text-[13px] font-black text-[#8E9AAF] uppercase tracking-widest">
            {new Date(currentWeek[0]).getMonth() + 1} 月 紀錄週期
          </button>
          <button onClick={() => setViewDate(new Date(viewDate.setDate(viewDate.getDate() + 7)))} className="w-9 h-9 rounded-full bg-[#F8FAFC] flex items-center justify-center"><Icons.ChevronRight /></button>
        </header>

        <div className="space-y-10 relative z-10">
          {currentWeek.map((dateStr, idx) => {
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const tasks = weeklyData[dateStr] || [];
            const state = inputState[dateStr] || { text: '', tagIdx: 0 };

            return (
              <div key={dateStr} className="flex gap-4">
                {/* 左側日期標記 */}
                <div className="flex flex-col items-center w-8 shrink-0 pt-1">
                  <span className={`text-[9px] font-bold ${isToday ? 'text-indigo-500' : 'text-slate-300'}`}>週{weekdays[idx]}</span>
                  <span className={`text-lg font-black ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{new Date(dateStr).getDate()}</span>
                </div>

                {/* 右側內容區 */}
                <div className="flex-1 space-y-3">
                  {/* 已有任務行 */}
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2 group animate-in fade-in slide-in-from-left-2">
                      <span className="text-sm shrink-0">{TAGS.find(t => t.id === task.tag)?.icon}</span>
                      <span className={`flex-1 text-[14px] font-bold ${task.completed ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                        {task.text}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => deleteTask(dateStr, task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Trash /></button>
                        <button 
                          onClick={() => toggleTask(dateStr, task.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${task.completed ? 'bg-emerald-400 border-emerald-400 shadow-sm' : 'border-slate-100 bg-white'}`}
                        >
                          {task.completed && <Icons.Check />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 輸入新任務行 */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setInputState(prev => ({ ...prev, [dateStr]: { ...state, tagIdx: (state.tagIdx + 1) % 3 } }))}
                      className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm hover:bg-slate-100 transition-colors"
                    >
                      {TAGS[state.tagIdx].icon}
                    </button>
                    <input 
                      className="flex-1 bg-transparent border-none outline-none text-[14px] font-bold placeholder:text-slate-100 text-slate-500"
                      placeholder="新增任務..."
                      value={state.text}
                      onChange={(e) => setInputState(prev => ({ ...prev, [dateStr]: { ...state, text: e.target.value } }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask(dateStr)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}