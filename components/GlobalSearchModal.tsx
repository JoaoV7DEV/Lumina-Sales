'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLumina } from '@/context/LuminaContext';
import { Search, X, User, Phone, Instagram, ArrowRight, ExternalLink } from 'lucide-react';
import { normalizePhoneDisplay } from '@/lib/formatters';
import { Lead } from '@/lib/types';

export function GlobalSearchModal() {
  const { isSearchOpen, setIsSearchOpen, state, openEditLeadModal } = useLumina();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const results: Lead[] = trimmed
    ? state.leads.filter((l) => {
        const nameMatch = l.name.toLowerCase().includes(trimmed);
        const bizMatch = (l.businessName || '').toLowerCase().includes(trimmed);
        const igMatch = (l.instagram || '').toLowerCase().includes(trimmed);
        const phoneMatch = (l.whatsapp || '').includes(trimmed);
        const nicheMatch = l.niche.toLowerCase().includes(trimmed);
        return nameMatch || bizMatch || igMatch || phoneMatch || nicheMatch;
      })
    : state.leads.slice(0, 6); // Se vazio mostra os 6 mais recentes

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#151922] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-700/70 bg-[#1A202C]">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, @instagram, telefone, nicho ou empresa..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd
            onClick={() => setIsSearchOpen(false)}
            className="cursor-pointer text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 hover:text-white"
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/60">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Nenhum contato encontrado para &ldquo;<span className="text-white font-medium">{query}</span>&rdquo;.
            </div>
          ) : (
            results.map((lead) => (
              <div
                key={lead.id}
                onClick={() => {
                  setIsSearchOpen(false);
                  openEditLeadModal(lead.id);
                }}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/70 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0 group-hover:border-[#C9A46B]/50">
                    {lead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#E6C387]">
                        {lead.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 truncate">
                        · {lead.niche}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {lead.instagram && (
                        <span className="flex items-center gap-1 truncate text-slate-300">
                          <Instagram className="w-3 h-3 text-[#C9A46B]" />
                          {lead.instagram}
                        </span>
                      )}
                      {lead.whatsapp && (
                        <span className="flex items-center gap-1 tabular-nums">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {normalizePhoneDisplay(lead.whatsapp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] px-2 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-slate-300">
                    {lead.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-[#11161F] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{trimmed ? `${results.length} resultado(s)` : 'Contatos recentes'}</span>
          <span>Pressione Enter para selecionar ou ESC para fechar</span>
        </div>
      </div>
    </div>
  );
}
