"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// --- SVG Icons (簡約灰色箭頭) ---
const Icons = {
  ChevronLeft: () => <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>,
  ChevronRight: () => <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>,
};

export default function WeeklyPlanHub() {
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date()); // 用來定位目前在哪一週
  const [weeklyData, setWeeklyData] = useState<{ [key: string]: string }>({});

  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

  // 1. 計算當前視圖週一到週日的日期
  const currentWeek = useMemo(() => {
    const tempDate = new Date(viewDate);
    const day = tempDate.getDay();
    // 調整週一為起始點
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(tempDate.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    });
  }, [viewDate]);

  // 2. 監聽 Firebase 數據
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "trackers", "weekly-planner"), (docSnap) => {
      if (docSnap.exists()) {
        setWeeklyData(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. 更新數據到 Firebase
  const updatePlan = async (dateStr: string, text: string) => {
    const newData = { ...weeklyData, [dateStr]: text };
    setWeeklyData(newData); // 即時更新本地 UI
    try {
      await setDoc(doc(db, "trackers", "weekly-planner"), newData);
    } catch (e) {
      console.error("Sync Error:", e);
    }
  };

  const shiftWeek = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() + (offset * 7));
    setViewDate(newDate);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-300 font-bold tracking-widest">LOADING...</div>;

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6 flex justify-center items-start">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] p-8 pt-12 relative overflow-hidden">
        
        {/* 背景裝飾圓點 (如圖右上角) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F1F5F9] rounded-full translate-x-10 -translate-y-10"></div>

        {/* Header: 月份與切換按鈕 */}
        <header className="flex justify-between items-center mb-12 relative z-10">
          <button onClick={() => shiftWeek(-1)} className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Icons.ChevronLeft />
          </button>
          
          <button 
            onClick={() => setViewDate(new Date())}
            className="text-[14px] font-black text-[#8E9AAF] uppercase tracking-[0.2em]"
          >
            {new Date(currentWeek[0]).getMonth() + 1} 月 紀錄週期
          </button>

          <button onClick={() => shiftWeek(1)} className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Icons.ChevronRight />
          </button>
        </header>

        {/* 週計畫清單 */}
        <div className="space-y-8 relative z-10 px-2">
          {currentWeek.map((dateStr, idx) => {
            const dateObj = new Date(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div key={dateStr} className="flex items-center gap-6 group">
                {/* 左側日期 */}
                <div className="flex flex-col items-center w-10 shrink-0">
                  <span className={`text-[10px] font-bold mb-1 ${isToday ? 'text-indigo-500' : 'text-[#8E9AAF]'}`}>
                    週{weekdays[idx]}
                  </span>
                  <span className={`text-[18px] font-black ${isToday ? 'text-indigo-600' : 'text-[#334155]'}`}>
                    {dateObj.getDate()}
                  </span>
                </div>

                {/* 右側輸入框 */}
                <input 
                  type="text"
                  value={weeklyData[dateStr] || ''}
                  onChange={(e) => updatePlan(dateStr, e.target.value)}
                  placeholder="點擊填寫週計畫..."
                  className={`flex-1 bg-transparent border-none outline-none text-[15px] font-bold placeholder:text-[#E2E8F0] transition-colors ${
                    isToday ? 'text-indigo-600' : 'text-[#64748B]'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}