"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// 引入組件
import MacroTracker from '@/components/MacroTracker';
import MotionHub from '@/components/MotionHub';
import WeightTracker from '@/components/WeightTracker';
import Work from '@/components/Work'; // 新增的專案組件

// --- 1. 定義數據介面 (新增 workData) ---
interface AppData {
  macroHistory: Record<string, any>;
  myFoods: any[];
  motionData: Record<string, any>;
  weightHistory: any[];
  workData: Record<string, any>; // 新增工作數據
}

export default function FitnessDashboard() {
  // 將 tab 選項擴充 'work'
  const [activeTab, setActiveTab] = useState<'macro' | 'motion' | 'weight' | 'work'>('work'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [loading, setLoading] = useState(true);
  
  const [allData, setAllData] = useState<AppData>({
    macroHistory: {},
    myFoods: [],
    motionData: {},
    weightHistory: [],
    workData: {}
  });

  useEffect(() => {
    // 監聽飲食數據
    const unsubMacro = onSnapshot(doc(db, "trackers", "yi-ching-data"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAllData((prev: AppData) => ({ 
          ...prev, 
          macroHistory: data.history || {}, 
          myFoods: data.myFoods || [] 
        }));
      }
    });

    // 監聽運動數據
    const unsubMotion = onSnapshot(doc(db, "trackers", "my-motion-tracker"), (snap) => {
      if (snap.exists()) {
        setAllData((prev: AppData) => ({ 
          ...prev, 
          motionData: snap.data() 
        }));
      }
    });

    // 監聽工作數據
    const unsubWork = onSnapshot(doc(db, "trackers", "my-work-tracker"), (snap) => {
      if (snap.exists()) {
        setAllData((prev: AppData) => ({ 
          ...prev, 
          workData: snap.data() 
        }));
      }
    });

    setLoading(false);
    return () => { unsubMacro(); unsubMotion(); unsubWork(); };
  }, []);

  const handleMacroSync = async (newHistory: any, newMyFoods: any[]) => {
    await setDoc(doc(db, "trackers", "yi-ching-data"), { 
      history: newHistory, 
      myFoods: newMyFoods 
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-black text-indigo-500 italic">
      <div className="animate-spin text-4xl mb-4 text-indigo-600">🌀</div>
      <div className="animate-pulse tracking-widest text-sm">SYSTEM_DASHBOARD INITIALIZING...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900 overflow-x-hidden">
      
      {/* 背景裝飾 */}
      <div className="fixed top-[-10%] right-[-10%] w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-[10%] left-[-10%] w-80 h-80 bg-slate-200/30 rounded-full blur-3xl -z-10"></div>

      {/* 標題區塊 */}
      <header className="pt-16 pb-8 px-8 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-indigo-600 rounded-full"></div>
          <h1 className="text-4xl font-black tracking-tighter leading-none italic bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent">
            YC_<span className="text-indigo-600">HUB</span>
          </h1>
          
          <div className="flex items-center gap-2 mt-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
              Efficiency & Transformation System
            </p>
          </div>
        </div>
      </header>

      {/* 導航欄 (新增工作切換) */}
      <nav className="sticky top-0 z-50 bg-[#F8FAFC]/60 backdrop-blur-xl px-2 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between bg-white/90 rounded-[2.5rem] p-1.5 shadow-[0_20px_50px_rgba(79,70,229,0.1)] border border-white/50">
          <NavButton active={activeTab === 'work'} onClick={() => setActiveTab('work')} icon="💻" label="工作" />
          <NavButton active={activeTab === 'macro'} onClick={() => setActiveTab('macro')} icon="🍲" label="飲食" />
          <NavButton active={activeTab === 'motion'} onClick={() => setActiveTab('motion')} icon="⚡" label="訓練" />
          <NavButton active={activeTab === 'weight'} onClick={() => setActiveTab('weight')} icon="⚖️" label="體重" />
        </div>
      </nav>

      {/* 內容區 */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="animate-in fade-in zoom-in-95 duration-500">
          {activeTab === 'work' && (
             <Work />
          )}

          {activeTab === 'macro' && (
            <MacroTracker 
              history={allData.macroHistory} 
              myFoods={allData.myFoods} 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onSync={handleMacroSync}
            />
          )}

          {activeTab === 'motion' && <MotionHub />}
          {activeTab === 'weight' && <WeightTracker />}
        </div>
      </div>

      <footer className="text-center py-16 opacity-40">
        <div className="inline-block px-4 py-1 border-t border-slate-200">
          <p className="text-[9px] font-black tracking-[0.6em] uppercase italic text-slate-400">
            Precision Intelligence 2026
          </p>
        </div>
      </footer>
    </main>
  );
}

// --- 介面組件 ---
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-[1.8rem] transition-all duration-500 ${
        active 
          ? 'bg-slate-900 text-white shadow-xl scale-105' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className={`text-base transition-transform duration-500 ${active ? 'scale-110' : ''}`}>{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}