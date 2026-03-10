"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// 引入你的三個組件
import MacroTracker from '@/components/MacroTracker';
import MotionHub from '@/components/MotionHub';
import WeightTracker from '@/components/WeightTracker';

// --- 1. 定義數據介面 ---
interface AppData {
  macroHistory: Record<string, any>;
  myFoods: any[];
  motionData: Record<string, any>;
  weightHistory: any[];
}

export default function FitnessDashboard() {
  const [activeTab, setActiveTab] = useState<'macro' | 'motion' | 'weight'>('macro');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [loading, setLoading] = useState(true);
  
  const [allData, setAllData] = useState<AppData>({
    macroHistory: {},
    myFoods: [],
    motionData: {},
    weightHistory: []
  });

  useEffect(() => {
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

    const unsubMotion = onSnapshot(doc(db, "trackers", "my-motion-tracker"), (snap) => {
      if (snap.exists()) {
        setAllData((prev: AppData) => ({ 
          ...prev, 
          motionData: snap.data() 
        }));
      }
    });

    setLoading(false);
    return () => { unsubMacro(); unsubMotion(); };
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
      <div className="animate-pulse tracking-widest">YC_DASHBOARD INITIALIZING...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900 overflow-x-hidden">
      
      {/* --- 背景裝飾元素 (增加層次感) --- */}
      <div className="fixed top-[-10%] right-[-10%] w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-[10%] left-[-10%] w-80 h-80 bg-slate-200/30 rounded-full blur-3xl -z-10"></div>

      {/* --- YC_DASHBOARD 大標題區塊 (含動畫) --- */}
      <header className="pt-16 pb-8 px-8 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-indigo-600 rounded-full"></div>
          <h1 className="text-5xl font-black tracking-tighter leading-none italic bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent animate-gradient-x">
            YC_<span className="text-indigo-600">DASHBOARD</span>
          </h1>
          
          <div className="flex items-center gap-2 mt-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
              Project 60D / Precision Intelligence
            </p>
          </div>
        </div>
        
        {/* 科技感裝飾線條 */}
        <div className="flex gap-1.5 mt-6 items-center">
          <div className="h-1 w-16 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
          <div className="h-1 w-4 bg-indigo-200 rounded-full"></div>
          <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
          <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
        </div>
      </header>

      {/* 頂部導航 - 玻璃擬態與陰影優化 */}
      <nav className="sticky top-0 z-50 bg-[#F8FAFC]/60 backdrop-blur-xl px-4 py-4 transition-all duration-500">
        <div className="max-w-md mx-auto flex items-center justify-between bg-white/90 rounded-[2.5rem] p-2 shadow-[0_20px_50px_rgba(79,70,229,0.1)] border border-white/50">
          <NavButton active={activeTab === 'macro'} onClick={() => setActiveTab('macro'} icon="🍲" label="飲食" />
          <NavButton active={activeTab === 'motion'} onClick={() => setActiveTab('motion'} icon="⚡" label="訓練" />
          <NavButton active={activeTab === 'weight'} onClick={() => setActiveTab('weight'} icon="⚖️" label="體重" />
        </div>
      </nav>

      {/* 主內容區 */}
      <div className="max-w-md mx-auto px-4 mt-4 transition-all duration-700 ease-in-out">
        <div className="animate-in fade-in zoom-in-95 duration-500">
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

      {/* 底部裝飾 */}
      <footer className="text-center py-16 opacity-40">
        <div className="inline-block px-4 py-1 border-t border-slate-200">
          <p className="text-[9px] font-black tracking-[0.6em] uppercase italic text-slate-400">
            Data-Driven Transformation 2026
          </p>
        </div>
      </footer>
    </main>
  );
}

// --- 介面組件型別定義 ---
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
      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
        active 
          ? 'bg-slate-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] scale-105' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className={`text-lg transition-transform duration-500 ${active ? 'scale-110 rotate-12' : ''}`}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}