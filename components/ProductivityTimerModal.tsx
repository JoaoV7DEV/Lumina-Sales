'use client';

import React, { useState } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Timer,
  Target,
  Flame,
  FileText,
} from 'lucide-react';

interface ProductivityTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductivityTimerModal({ isOpen, onClose }: ProductivityTimerModalProps) {
  const {
    timerActive,
    timerSeconds,
    timerSessionApproaches,
    timerSessionQualified,
    startTimer,
    pauseTimer,
    resetTimer,
    finishTimerSession,
    incrementSessionApproach,
    incrementSessionQualified,
    state,
    updateSettings,
  } = useLumina();

  const [sessionNotes, setSessionNotes] = useState('');
  const [goalInput, setGoalInput] = useState(state.settings.dailyGoal.toString());

  if (!isOpen) return null;

  const hours = Math.floor(timerSeconds / 3600);
  const minutes = Math.floor((timerSeconds % 3600) / 60);
  const seconds = timerSeconds % 60;

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const hoursElapsed = timerSeconds / 3600;
  const pacePerHour = hoursElapsed > 0.05 ? (timerSessionApproaches / hoursElapsed).toFixed(1) : '0';

  const handleSaveGoal = () => {
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val > 0) {
      updateSettings({ dailyGoal: val });
    }
  };

  const handleFinish = () => {
    finishTimerSession(sessionNotes.trim() || undefined);
    setSessionNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#151922] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#1B2230] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A46B]/20 border border-[#C9A46B]/40 flex items-center justify-center text-[#E6C387]">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cronômetro de Foco & Produtividade</h3>
              <p className="text-xs text-slate-400">Acompanhamento de ritmo de prospecção manual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Digital Display */}
        <div className="p-6 text-center bg-[#10141D] border-b border-slate-800/80">
          <div className="text-5xl font-mono font-bold tracking-tight text-white tabular-nums drop-shadow-sm">
            {formattedTime}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                timerActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span>{timerActive ? 'Sessão em andamento' : 'Cronômetro pausado'}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {!timerActive ? (
              <button
                onClick={startTimer}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl shadow-md transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar Sessão
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-md transition-all active:scale-95"
              >
                <Pause className="w-4 h-4 fill-current" />
                Pausar Sessão
              </button>
            )}

            <button
              onClick={resetTimer}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors"
              title="Zerar cronômetro"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#192130] p-3 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 block">Abordagens</span>
              <span className="text-xl font-bold text-white tabular-nums">
                {timerSessionApproaches}
              </span>
              <button
                onClick={incrementSessionApproach}
                className="mt-1 text-[10px] text-[#C9A46B] hover:underline block mx-auto"
              >
                +1 manual
              </button>
            </div>

            <div className="bg-[#192130] p-3 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 block">Qualificados</span>
              <span className="text-xl font-bold text-white tabular-nums">
                {timerSessionQualified}
              </span>
              <button
                onClick={incrementSessionQualified}
                className="mt-1 text-[10px] text-emerald-400 hover:underline block mx-auto"
              >
                +1 manual
              </button>
            </div>

            <div className="bg-[#192130] p-3 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400 block">Ritmo / Hora</span>
              <span className="text-xl font-bold text-[#E6C387] tabular-nums">{pacePerHour}</span>
              <span className="mt-1 text-[10px] text-slate-400 block">contatos/h</span>
            </div>
          </div>

          {/* Daily Goal Configuration */}
          <div className="bg-[#171E2C] p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#C9A46B]" />
              <div>
                <span className="text-xs font-semibold text-white block">Meta Diária de Abordagens</span>
                <span className="text-[11px] text-slate-400">Padrão configurável para a Lumina</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="500"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onBlur={handleSaveGoal}
                className="w-16 bg-[#111620] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold"
              />
              <span className="text-xs text-slate-400">contatos</span>
            </div>
          </div>

          {/* Session Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Anotações sobre a sessão (opcional)
            </label>
            <input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Ex: Foco no script v2.0 com corretoras de imóveis no RJ"
              className="w-full bg-[#18202E] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A46B]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#171E2C] border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {state.productivitySessions.length} sessão(ões) registradas
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:bg-slate-800"
            >
              Fechar
            </button>
            <button
              onClick={handleFinish}
              disabled={timerSeconds < 5}
              className="px-4 py-1.5 text-xs font-semibold bg-[#C9A46B] text-[#111827] rounded-lg hover:bg-[#D8B47E] disabled:opacity-40"
            >
              Finalizar e Salvar Sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
