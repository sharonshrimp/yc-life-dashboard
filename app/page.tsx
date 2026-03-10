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
  
  // --- 2. 使用介面初始化 State ---
  const [allData, setAllData] = useState<AppData>({
    macroHistory: {},
    myFoods: [],
    motionData: {},
    weightHistory: []
  });

  // --- 實時監聽 ---
  useEffect(() => {
    // 1. 監聽飲食與常用食物
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

    // 2. 監聽運動數據
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

  // --- 統一數據同步函式 ---
  const handleMacroSync = async (newHistory: any, newMyFoods: any[]) => {
    await setDoc(doc(db, "trackers", "yi-ching-data"), { 
      history: newHistory, 
      myFoods: newMyFoods 
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-black text-indigo-400 italic">
      <div className="animate-bounce text-4xl mb-4">🚀</div>
      YC_DASHBOARD INITIALIZING...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      
      {/* --- YC_DASHBOARD 大標題區塊 --- */}
      <header className="pt-12 pb-6 px-6 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none italic">
              YC_<span className="text-indigo-600">DASHBOARD</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
              Project 60D / Precision Intelligence
            </p>
          </div>
        </div>
        
        {/* 科技感裝飾線條 */}
        <div className="flex gap-1 mt-4">
          <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
          <div className="h-1 w-2 bg-slate-200 rounded-full"></div>
          <div className="h-1 w-2 bg-slate-200 rounded-full"></div>
        </div>
      </header>

      {/* 頂部導航 - 加上玻璃擬態效果 */}
      <nav className="sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-md px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between bg-white rounded-[2.5rem] p-2 shadow-lg shadow-indigo-100/40 border border-slate-100">
          <NavButton active={activeTab === 'macro'} onClick={() => setActiveTab('macro')} icon="🍲" label="飲食" />
          <NavButton active={activeTab === 'motion'} onClick={() => setActiveTab('motion')} icon="⚡" label="訓練" />
          <NavButton active={activeTab === 'weight'} onClick={() => setActiveTab('weight')} icon="⚖️" label="體重" />
        </div>
      </nav>

      {/* 主內容區 */}
      <div className="max-w-md mx-auto px-4 mt-2">
        {activeTab === 'macro' && (
          <MacroTracker 
            history={allData.macroHistory} 
            myFoods={allData.myFoods} 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onSync={handleMacroSync}
          />
        )}

        {activeTab === 'motion' && (
          <MotionHub />
        )}

        {activeTab === 'weight' && (
          <WeightTracker />
        )}
      </div>

      {/* 底部裝飾 */}
      <footer className="text-center py-10 opacity-30">
        <p className="text-[9px] font-black tracking-[0.5em] uppercase italic text-slate-500">
          Data-Driven Transformation 2026
        </p>
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
      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[2rem] transition-all duration-300 ${
        active ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}