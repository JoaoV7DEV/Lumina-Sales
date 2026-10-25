'use client';

import React, { useState, useMemo } from 'react';
import { useLumina } from '@/context/LuminaContext';
import {
  DollarSign,
  Package,
  Plus,
  Receipt,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Percent,
  Sparkles,
} from 'lucide-react';
import {
  Sale,
  FinancialStatus,
  PackageOffer,
  PaymentEntry,
  Expense,
  ExpenseCategory,
  ServiceCategory,
} from '@/lib/types';
import { formatBRL, formatDateBR } from '@/lib/formatters';

const STATUS_FIN_MAP: Record<FinancialStatus, { label: string; bg: string; text: string }> = {
  waiting_payment: { label: 'Aguardando Pagto', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-500' },
  partially_paid: { label: 'Parcialmente Pago', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-500' },
  paid: { label: 'Totalmente Quitado', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-500' },
  cancelled: { label: 'Cancelado', bg: 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700', text: 'text-slate-500' },
  refunded: { label: 'Reembolsado', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-500' },
};

const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  ai_tools: 'Ferramentas de IA (GPU/Modelos)',
  subscriptions: 'Assinaturas & Softwares',
  advertising: 'Tráfego & Anúncios',
  infrastructure: 'Domínio & Servidores',
  other: 'Outros Custos',
};

export function FinancialView() {
  const {
    state,
    addSale,
    updateSale,
    addPaymentToSale,
    addExpense,
    deleteExpense,
    addPackage,
    updatePackage,
    openEditLeadModal,
    showToast,
  } = useLumina();

  // Sub-abas: 'sales' | 'tables' | 'packages' | 'expenses'
  const [subTab, setSubTab] = useState<'sales' | 'tables' | 'packages' | 'expenses'>('sales');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Nova venda modal
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleLeadId, setSaleLeadId] = useState('');
  const [saleTableType, setSaleTableType] = useState<'tabela_1' | 'tabela_2'>('tabela_1');
  const [salePackageId, setSalePackageId] = useState('');
  const [saleOriginalValue, setSaleOriginalValue] = useState(0);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [saleFinalValue, setSaleFinalValue] = useState(0);
  const [salePaymentMethod, setSalePaymentMethod] = useState('Pix');
  const [saleDueDate, setSaleDueDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Registro de pagamento parcial modal
  const [paymentModalSale, setPaymentModalSale] = useState<Sale | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('Pix');
  const [payNotes, setPayNotes] = useState('');

  // Despesa modal
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('ai_tools');
  const [expAmount, setExpAmount] = useState(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Cálculos financeiros consolidados
  const validSales = useMemo(() => {
    return state.sales.filter((s) => s.status !== 'cancelled');
  }, [state.sales]);

  const totalSold = useMemo(() => {
    return validSales.reduce((acc, s) => acc + s.finalValue, 0);
  }, [validSales]);

  const totalReceived = useMemo(() => {
    let sum = 0;
    validSales.forEach((s) => {
      (s.payments || []).forEach((p) => {
        sum += p.amount;
      });
    });
    return sum;
  }, [validSales]);

  const totalPending = Math.max(0, totalSold - totalReceived);
  const averageTicket = validSales.length > 0 ? totalSold / validSales.length : 0;

  const totalExpenses = useMemo(() => {
    return state.expenses.reduce((acc, e) => acc + e.amount, 0);
  }, [state.expenses]);

  const netProfit = totalReceived - totalExpenses;

  // Filtragem dos pacotes por tabela comercial
  const tabela1Packages = useMemo(() => {
    return state.packages.filter((p) => p.tableType === 'tabela_1');
  }, [state.packages]);

  const tabela2Packages = useMemo(() => {
    return state.packages.filter((p) => p.tableType === 'tabela_2');
  }, [state.packages]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Proposta comercial copiada com sucesso!');
  };

  const handleSelectPackageForSale = (pkgId: string) => {
    setSalePackageId(pkgId);
    const pkg = state.packages.find((p) => p.id === pkgId);
    if (pkg) {
      setSaleOriginalValue(pkg.price);
      setSaleFinalValue(pkg.price - saleDiscount);
    }
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = state.leads.find((l) => l.id === saleLeadId);
    if (!lead) {
      showToast('Selecione um lead válido para a venda.');
      return;
    }

    const pkg = state.packages.find((p) => p.id === salePackageId);
    const serviceName = pkg ? `${pkg.name} (${pkg.photoCount} Fotos)` : 'Ensaio Personalizado';

    addSale({
      leadId: lead.id,
      leadName: lead.name,
      closedDate: new Date().toISOString().split('T')[0],
      serviceName,
      tableType: saleTableType,
      packageId: salePackageId || undefined,
      originalValue: saleOriginalValue,
      discount: saleDiscount,
      finalValue: Math.max(0, saleFinalValue),
      paymentMethod: salePaymentMethod,
      dueDate: saleDueDate || undefined,
      notes: saleNotes.trim() || undefined,
      status: 'paid', // Venda confirmada via Pix/Cartão
      payments: [
        {
          id: `pay-${Date.now()}`,
          amount: Math.max(0, saleFinalValue),
          date: new Date().toISOString().split('T')[0],
          method: salePaymentMethod,
          notes: 'Pagamento de fechamento',
        },
      ],
    });

    setIsSaleModalOpen(false);
    setSaleLeadId('');
    setSalePackageId('');
    setSaleOriginalValue(0);
    setSaleDiscount(0);
    setSaleFinalValue(0);
    setSaleNotes('');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription.trim() || expAmount <= 0) {
      showToast('Preencha a descrição e um valor positivo.');
      return;
    }

    addExpense({
      description: expDescription.trim(),
      category: expCategory,
      amount: expAmount,
      date: expDate,
    });

    setIsExpModalOpen(false);
    setExpDescription('');
    setExpAmount(0);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSale || payAmount <= 0) return;

    addPaymentToSale(paymentModalSale.id, {
      amount: payAmount,
      date: payDate,
      method: payMethod,
      notes: payNotes.trim() || undefined,
    });

    setPaymentModalSale(null);
    setPayAmount(0);
    setPayNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-[#C9A46B]" />
            <span>Gestão Comercial & Financeira</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle de vendas, recebimentos em Pix/Cartão, as duas tabelas oficiais e resultado operacional real
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSubTab('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                subTab === 'sales'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vendas ({validSales.length})
            </button>
            <button
              onClick={() => setSubTab('tables')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                subTab === 'tables'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tabelas de Preços (1 & 2)
            </button>
            <button
              onClick={() => setSubTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                subTab === 'expenses'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Despesas & Lucro
            </button>
          </div>

          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Venda</span>
          </button>
        </div>
      </div>

      {/* Faixa de Indicadores Financeiros Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Vendido</span>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatBRL(totalSold)}
          </p>
          <span className="text-[11px] text-slate-500">{validSales.length} contratos fechados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Valor Recebido no Caixa</span>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatBRL(totalReceived)}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-500 font-medium">Compensado via Pix/Cartão</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Valor Pendente</span>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {formatBRL(totalPending)}
          </p>
          <span className="text-[11px] text-slate-500">Aguardando quitação ou parcelas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-[#9A743E] dark:text-[#C9A46B]">Ticket Médio por Cliente</span>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#9A743E] dark:text-[#C9A46B]">
            {formatBRL(averageTicket)}
          </p>
          <span className="text-[11px] text-slate-500">Receita média por ensaio</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ABA DE VENDAS E LANÇAMENTOS                            */}
      {/* ========================================================= */}
      {subTab === 'sales' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#C9A46B]" />
              <span>Extrato de Vendas e Pagamentos</span>
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">{validSales.length} vendas registradas</span>
          </div>

          {validSales.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Receipt className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-3">Nenhuma venda registrada ainda</p>
              <p className="text-xs text-slate-500 mt-1">
                Conforme os leads aprovarem as prévias, registre as vendas para acompanhar a evolução do caixa
              </p>
              <button
                onClick={() => setIsSaleModalOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-bold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-md"
              >
                Lançar Primeira Venda
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                    <th className="pb-3 font-semibold">Cliente</th>
                    <th className="pb-3 font-semibold">Serviço / Pacote</th>
                    <th className="pb-3 font-semibold">Data Fechamento</th>
                    <th className="pb-3 font-semibold">Valor Final</th>
                    <th className="pb-3 font-semibold">Valor Recebido</th>
                    <th className="pb-3 font-semibold">Status Financeiro</th>
                    <th className="pb-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {validSales.map((sale) => {
                    const statusMeta = STATUS_FIN_MAP[sale.status];
                    const paidAmount = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
                    const isPending = paidAmount < sale.finalValue;

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                          <button
                            onClick={() => openEditLeadModal(sale.leadId)}
                            className="hover:text-[#C9A46B] transition-colors text-left"
                          >
                            {sale.leadName}
                          </button>
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300">
                          <span>{sale.serviceName}</span>
                          {sale.tableType && (
                            <span className="block text-[10px] text-slate-400">
                              {sale.tableType === 'tabela_1' ? 'Tabela 1 (Direta)' : 'Tabela 2 (Brindes & Bio)'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400">
                          {formatDateBR(sale.closedDate)}
                        </td>
                        <td className="py-3.5 font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatBRL(sale.finalValue)}
                        </td>
                        <td className="py-3.5 font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatBRL(paidAmount)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusMeta.bg} ${statusMeta.text}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          {isPending && (
                            <button
                              onClick={() => {
                                setPaymentModalSale(sale);
                                setPayAmount(sale.finalValue - paidAmount);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 rounded-lg border border-emerald-500/30 transition-colors"
                            >
                              Registrar Pagto
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. AS DUAS TABELAS DE PREÇOS OFICIAIS (TABELA 1 & TABELA 2)*/}
      {/* ========================================================= */}
      {subTab === 'tables' && (
        <div className="space-y-6">
          {/* Seção da Tabela 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Documento Oficial · Página 16
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  <span>Tabela 1 — Fotos Profissionais Ultra Realista</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30">
                    Preço Direto
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  const text = `FOTOS PROFISSIONAIS ULTRA REALISTA ✨\n\n✨ Experimental: 5 Fotos - R$ 29,30\n🥈 BASICO: 10 fotos - R$ 69,90\n🏆 OURO: 20 fotos - R$ 119,90\n💎 DIAMANTE: 30 fotos - R$ 139,90`;
                  copyToClipboard(text, 'tabela-1');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors self-start"
              >
                {copiedKey === 'tabela-1' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>Copiar Texto Tabela 1 para WhatsApp</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tabela1Packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      {pkg.name}
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {formatBRL(pkg.price)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pkg.description}</p>
                    <ul className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                      {pkg.includedBenefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção da Tabela 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A743E] dark:text-[#C9A46B]">
                  Documento Oficial · Página 17 (Alta Conversão & Bônus)
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  <span>Tabela 2 — Fotos com IA + Brindes & Instabio</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A46B]/20 text-[#9A743E] dark:text-[#C9A46B] font-bold border border-[#C9A46B]/40">
                    Maior Ticket Médio
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  const text = `🖼️ *FOTOS PROFISSIONAIS COM IA + BRINDES*\n\n🥉 *BÁSICO* + 1 foto de brinde: 10 fotos - R$ 69,90\n🥈 *ESSENCIAL*: 20 fotos + Instabio Personalizado + 3 fotos de brinde - R$ 148,90\n🏆 *OURO*: 30 Fotos + Instabio Personalizado + 5 fotos de brinde - R$ 297,90\n💎 *DIAMANTE - Pacote Completo*: 45 Fotos + Instabio Personalizado + 7 fotos de brinde + Site personalizado - R$ 547,90\n\n*Exemplo de Instabio:* https://biiomagnetica.my.canva.site/daiana-raasch\n✨ Se quiser tenho o Experimental: 5 Fotos - R$ 34,90\n\n"Esses serviços entram no pacote como complemento. Se você preferir ficar somente com o ensaio, também consigo adaptar o pacote para você."`;
                  copyToClipboard(text, 'tabela-2');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors self-start"
              >
                {copiedKey === 'tabela-2' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>Copiar Texto Tabela 2 para WhatsApp</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {tabela2Packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      {pkg.name}
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {formatBRL(pkg.price)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pkg.description}</p>

                    {pkg.bonuses && pkg.bonuses.length > 0 && (
                      <div className="p-2 rounded-lg bg-[#C9A46B]/10 border border-[#C9A46B]/30 text-[11px] text-[#9A743E] dark:text-[#E6C387]">
                        <span className="font-bold">Brindes:</span> {pkg.bonuses.join(', ')}
                      </div>
                    )}

                    <ul className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                      {pkg.includedBenefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A46B] shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ABA DE DESPESAS OPERACIONAIS E LUCRO LÍQUIDO           */}
      {/* ========================================================= */}
      {subTab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Recebido</span>
              <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatBRL(totalReceived)}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Despesas Operacionais</span>
              <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                {formatBRL(totalExpenses)}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-[#9A743E] dark:text-[#C9A46B]">Lucro Líquido Real</span>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatBRL(netProfit)}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#151922] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Lista de Despesas Registradas</h3>
              <button
                onClick={() => setIsExpModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Despesa</span>
              </button>
            </div>

            {state.expenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhuma despesa registrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                      <th className="pb-3 font-semibold">Descrição</th>
                      <th className="pb-3 font-semibold">Categoria</th>
                      <th className="pb-3 font-semibold">Data</th>
                      <th className="pb-3 font-semibold">Valor</th>
                      <th className="pb-3 font-semibold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {state.expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 font-medium text-slate-900 dark:text-white">{exp.description}</td>
                        <td className="py-3 text-slate-500">
                          {EXPENSE_CATEGORIES[exp.category] || exp.category}
                        </td>
                        <td className="py-3 text-slate-500">{formatDateBR(exp.date)}</td>
                        <td className="py-3 font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400">
                          {formatBRL(exp.amount)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                            title="Remover despesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Registro de Venda */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151922] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#C9A46B]" />
                <span>Registrar Nova Venda</span>
              </h3>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selecionar Lead *
                </label>
                <select
                  value={saleLeadId}
                  onChange={(e) => setSaleLeadId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">Selecione o lead comprador...</option>
                  {state.leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.niche})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tabela Comercial
                  </label>
                  <select
                    value={saleTableType}
                    onChange={(e) => setSaleTableType(e.target.value as 'tabela_1' | 'tabela_2')}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="tabela_1">Tabela 1 (R$ 29,30 - R$ 139,90)</option>
                    <option value="tabela_2">Tabela 2 (+ Brindes & Bio)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pacote Escolhido
                  </label>
                  <select
                    value={salePackageId}
                    onChange={(e) => handleSelectPackageForSale(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Personalizado</option>
                    {(saleTableType === 'tabela_1' ? tabela1Packages : tabela2Packages).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatBRL(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Original (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={saleOriginalValue}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setSaleOriginalValue(v);
                      setSaleFinalValue(v - saleDiscount);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={saleDiscount}
                    onChange={(e) => {
                      const d = parseFloat(e.target.value) || 0;
                      setSaleDiscount(d);
                      setSaleFinalValue(saleOriginalValue - d);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Final (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={saleFinalValue}
                    onChange={(e) => setSaleFinalValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={salePaymentMethod}
                  onChange={(e) => setSalePaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Pix">Pix (Chave / QrCode)</option>
                  <option value="Cartão de Crédito">Cartão de Crédito (Link Seguro)</option>
                  <option value="Boleto">Boleto Bancário</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-md"
                >
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Lançamento de Pagamento */}
      {paymentModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151922] w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Lançar Pagamento para {paymentModalSale.leadName}
            </h3>

            <form onSubmit={handleAddPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.10"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Método
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalSale(null)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl"
                >
                  Confirmar Pagto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Despesa */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#151922] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Lançar Nova Despesa</h3>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição do Custo *
                </label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="Ex: Assinatura de modelo de IA ou Google Drive"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {Object.entries(EXPENSE_CATEGORIES).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#C9A46B] hover:bg-[#D8B47E] rounded-xl shadow-md"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
