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
        // 解決 prev 隱含 any 的問題
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

  // 如果後續 MotionHub 需要從外部同步，可以使用這個
  const handleMotionSync = async (newMotionData: any) => {
    await setDoc(doc(db, "trackers", "my-motion-tracker"), newMotionData);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-black text-indigo-400 italic">
      <div className="animate-bounce text-4xl mb-4">🚀</div>
      PROJECT 60D INITIALIZING...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* --- 新增：大標題區塊 --- */}
      <header className="pt-10 pb-2 px-6 max-w-md mx-auto">
        <div className="flex items-baseline gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">
            PROJECT <span className="text-indigo-600">60D</span>
          </h1>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
            v1.0 Precision
          </span>
        </div>
        <p className="text-slate-500 text-xs font-medium mt-1 ml-1 uppercase tracking-tight opacity-70">
          Fitness & Nutrition Intelligence Dashboard
        </p>
      </header>
      
      {/* 頂部導航 */}
      <nav className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-lg px-4 pt-6 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between bg-white rounded-[2.5rem] p-2 shadow-sm border border-slate-100">
          <NavButton active={activeTab === 'macro'} onClick={() => setActiveTab('macro')} icon="🍲" label="飲食" />
          <NavButton active={activeTab === 'motion'} onClick={() => setActiveTab('motion')} icon="⚡" label="訓練" />
          <NavButton active={activeTab === 'weight'} onClick={() => setActiveTab('weight')} icon="⚖️" label="體重" />
        </div>
      </nav>

      {/* 主內容區 */}
      <div className="max-w-md mx-auto px-4">
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
      <footer className="text-center py-10 opacity-20">
        <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-900 italic">
          Yi-Ching's Precision Hub 2026
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
      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[2rem] transition-all ${
        active ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}