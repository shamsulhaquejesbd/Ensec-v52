/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - Automated SMS Reminders & Notification Center
 * Configurable SMS templates, trigger rules, multi-provider gateway settings,
 * delivery logging, and future-ready WhatsApp integration.
 */

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Settings,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  ShieldCheck,
  Edit2,
  Save,
  X,
  ExternalLink,
  Smartphone,
  Sliders,
  Check,
  Layers,
  Terminal,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { SMSTemplate, SMSAutomationRule, SMSGatewaySettings } from '../../types/installment.ts';
import { formatBDPhoneNumber, generateWhatsAppLink } from '../../lib/smsService.ts';

interface SMSNotificationHubProps {
  initialSubTab?: string;
  onNavigate?: (module: string) => void;
}

export const SMSNotificationHub: React.FC<SMSNotificationHubProps> = ({
  initialSubTab = 'sms-dashboard',
  onNavigate,
}) => {
  const {
    smsTemplates,
    smsAutomationRules,
    smsLogs,
    smsGatewaySettings,
    updateSMSTemplate,
    toggleSMSAutomationRule,
    updateSMSGatewaySettings,
    testSMSGateway,
    installmentPlans,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  // Template Edit State
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [templateBody, setTemplateBody] = useState('');
  const [templateName, setTemplateName] = useState('');

  // Gateway Settings Form State
  const [gatewayProvider, setGatewayProvider] = useState(smsGatewaySettings.provider);
  const [gatewayUrl, setGatewayUrl] = useState(smsGatewaySettings.apiUrl);
  const [gatewayKey, setGatewayKey] = useState(smsGatewaySettings.apiKey);
  const [gatewaySenderId, setGatewaySenderId] = useState(smsGatewaySettings.senderId);
  const [gatewayClientId, setGatewayClientId] = useState(smsGatewaySettings.clientId || '');
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [gatewayFeedback, setGatewayFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Test SMS State
  const [testPhone, setTestPhone] = useState('01711223344');
  const [testMessage, setTestMessage] = useState('Ensec ERP Test: Automated SMS Gateway check successful.');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // WhatsApp manual sender state
  const [waTargetPhone, setWaTargetPhone] = useState('01711223344');
  const [waMessage, setWaMessage] = useState(
    'Dear Customer, your Ensec installment payment of BDT 15,000 is due. Please make payment to Eastern Bank PLC A/C. Thank you, Ensec.'
  );

  // KPI Calculations
  const totalSent = smsLogs.length;
  const deliveredCount = smsLogs.filter((l) => l.status === 'Delivered').length;
  const failedCount = smsLogs.filter((l) => l.status === 'Failed').length;
  const deliveryRate = totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100;

  // Open Template Modal
  const openEditTemplate = (tmpl: SMSTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setTemplateBody(tmpl.body);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    updateSMSTemplate(editingTemplate.id, {
      name: templateName,
      body: templateBody,
    });
    setEditingTemplate(null);
  };

  const insertVariableIntoTemplate = (variable: string) => {
    setTemplateBody((prev) => `${prev} ${variable}`);
  };

  // Save Gateway Settings
  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    setGatewayFeedback(null);

    updateSMSGatewaySettings({
      provider: gatewayProvider,
      apiUrl: gatewayUrl,
      apiKey: gatewayKey,
      senderId: gatewaySenderId,
      clientId: gatewayClientId,
      isConfigured: Boolean(gatewayKey && gatewayKey.trim().length > 0),
    });

    setTimeout(() => {
      setIsSavingGateway(false);
      setGatewayFeedback({
        type: 'success',
        message: 'SMS Gateway configurations updated successfully!',
      });
    }, 600);
  };

  // Run Test Ping
  const handleTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingGateway(true);
    setTestResult(null);

    try {
      const res = await testSMSGateway(testPhone, testMessage);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Dispatch failed' });
    } finally {
      setIsTestingGateway(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                SMS & Automated Notification Center
              </h1>
              <p className="text-xs text-slate-500">
                Rule-based SMS reminder triggers, editable notification templates, delivery logs, and gateway API settings.
              </p>
            </div>
          </div>
        </div>

        {/* Gateway Status Badge */}
        <div className="flex items-center gap-2">
          {smsGatewaySettings.isConfigured ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gateway: Online ({smsGatewaySettings.provider.toUpperCase()})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Gateway: Credentials Needed</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs matching Section 2 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'sms-dashboard', label: 'SMS Dashboard' },
          { id: 'sms-templates', label: `SMS Templates (${smsTemplates.length})` },
          { id: 'sms-rules', label: `Automated Rules (${smsAutomationRules.length})` },
          { id: 'sms-history', label: `Sending Logs (${smsLogs.length})` },
          { id: 'sms-failed', label: `Failed SMS (${failedCount})` },
          { id: 'sms-settings', label: 'Gateway Settings' },
          { id: 'whatsapp-integration', label: 'WhatsApp Hub (Ready)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. SMS DASHBOARD                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'sms-dashboard' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Total SMS Dispatched</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {totalSent}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Lifecycle installment notifications</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Delivery Success Rate</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {deliveryRate}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{deliveredCount} delivered receipts</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Active Automated Rules</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {smsAutomationRules.filter((r) => r.enabled).length} of {smsAutomationRules.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Pre-due, due & overdue triggers</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-slate-400">Failed / Queued Notices</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {failedCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {failedCount > 0 ? 'Retry needed in Failed SMS tab' : 'No undelivered errors'}
              </div>
            </div>
          </div>

          {/* Quick Test Send & Live Ping */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live SMS Gateway Dispatch Test
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify gateway connectivity with Bangladesh mobile numbers.
                  </p>
                </div>
                <Send className="w-4 h-4 text-blue-600" />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <form onSubmit={handleTestSMS} className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Mobile Number (Bangladesh)
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    Formatted: {formatBDPhoneNumber(testPhone).formatted || 'Invalid'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={2}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Chars: {testMessage.length} (1 SMS)
                  </span>
                  <button
                    type="submit"
                    disabled={isTestingGateway}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingGateway ? 'Transmitting...' : 'Send Test SMS'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Default Automated Rules Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Automated Milestone Triggers
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Active automated rules evaluated daily at 08:00 AM
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('sms-rules')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Configure Rules →
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {smsAutomationRules.slice(0, 5).map((rule) => (
                  <div
                    key={rule.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {rule.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{rule.description}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.enabled
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SMS TEMPLATES VIEW (Section 6)                                         */}
      {/* ========================================================================= */}
      {activeTab === 'sms-templates' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Editable SMS Notification Templates
            </h2>
            <p className="text-[11px] text-slate-500">
              Customize text messages sent to customers with dynamic placeholders ({'{CustomerName}'}, {'{DueAmount}'}, etc.).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {smsTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {tmpl.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {tmpl.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed font-mono">
                    "{tmpl.body}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400">Code: {tmpl.templateCode}</span>
                  <button
                    onClick={() => openEditTemplate(tmpl)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AUTOMATED SMS RULES VIEW (Section 6)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'sms-rules' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Automated Installment SMS Reminder Rules
            </h2>
            <p className="text-[11px] text-slate-500">
              Configure automated schedules for upcoming due date alerts, overdue reminders, and payment receipts.
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Rule Name</th>
                  <th className="p-3">Trigger Milestone</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Assigned Template</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Status / Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {smsAutomationRules.map((rule) => {
                  const tmpl = smsTemplates.find((t) => t.id === rule.templateId);
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {rule.name}
                      </td>

                      <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">
                        {rule.triggerDays < 0
                          ? `${Math.abs(rule.triggerDays)} days before due`
                          : rule.triggerDays === 0
                          ? 'On Due Date'
                          : `${rule.triggerDays} days overdue`}
                      </td>

                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {rule.channel}
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {tmpl?.name || 'Standard Notice'}
                      </td>

                      <td className="p-3 max-w-xs text-slate-500">
                        {rule.description}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleSMSAutomationRule(rule.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                            rule.enabled
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-300'
                          }`}
                        >
                          {rule.enabled ? 'Active (ON)' : 'Disabled (OFF)'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SMS LOGS & FAILED SMS VIEW (Section 6)                                  */}
      {/* ========================================================================= */}
      {(activeTab === 'sms-history' || activeTab === 'sms-failed') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeTab === 'sms-failed' ? 'Failed SMS Delivery Logs' : 'SMS Communication & Gateway Logs'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Audited dispatch history, recipient mobile numbers, gateway response codes, and retry actions.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Agreement</th>
                  <th className="p-3">Message Preview</th>
                  <th className="p-3">Gateway Response</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Retry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {smsLogs
                  .filter((l) => (activeTab === 'sms-failed' ? l.status === 'Failed' : true))
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500 whitespace-nowrap">{log.sentAt}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {log.recipientName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {log.recipientPhone}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-blue-600 dark:text-blue-400">
                        {log.agreementNo || 'Direct'}
                      </td>
                      <td className="p-3 max-w-xs text-slate-600 dark:text-slate-300">
                        "{log.message}"
                      </td>
                      <td className="p-3 text-[11px] font-mono text-slate-500 max-w-xs truncate">
                        {log.gatewayResponse || 'OK'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.status === 'Sent'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            testSMSGateway(log.recipientPhone, log.message);
                            alert(`Retrying SMS to ${log.recipientPhone}`);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="Retry SMS"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SMS GATEWAY SETTINGS VIEW (Section 6)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'sms-settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              SMS Gateway Provider Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Integrate with third-party SMS providers (Greenweb BD, Onnorokom SMS, Banglalink, Grameenphone, Twilio, or Generic REST).
            </p>
          </div>

          {gatewayFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                gatewayFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{gatewayFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveGateway} className="space-y-4 max-w-2xl text-xs">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                SMS Provider / Gateway Service
              </label>
              <select
                value={gatewayProvider}
                onChange={(e) => {
                  const p = e.target.value as any;
                  setGatewayProvider(p);
                  if (p === 'greenweb') setGatewayUrl('https://api.greenweb.com.bd/api.php');
                  else if (p === 'onnorokom') setGatewayUrl('https://api2.onnorokomsms.com/send-sms');
                  else if (p === 'twilio') setGatewayUrl('https://api.twilio.com/2010-04-01/Accounts');
                  else setGatewayUrl('https://api.sms-gateway.example.com/v1/send');
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="greenweb">Greenweb BD (api.greenweb.com.bd)</option>
                <option value="onnorokom">Onnorokom SMS (api2.onnorokomsms.com)</option>
                <option value="banglalink">Banglalink Enterprise SMS</option>
                <option value="grameenphone">Grameenphone Business Gateway</option>
                <option value="twilio">Twilio Global SMS</option>
                <option value="generic">Generic REST API (Bearer Token)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                SMS API Endpoint URL *
              </label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                API Key / Auth Token *
              </label>
              <input
                type="password"
                value={gatewayKey}
                onChange={(e) => setGatewayKey(e.target.value)}
                placeholder="Enter API Key from your SMS Provider Dashboard"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400">
                Encrypted in server state; never hardcoded in production source.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sender ID / Masking Name
                </label>
                <input
                  type="text"
                  value={gatewaySenderId}
                  onChange={(e) => setGatewaySenderId(e.target.value)}
                  placeholder="e.g. ENSEC_BD"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Client ID / Account SID
                </label>
                <input
                  type="text"
                  value={gatewayClientId}
                  onChange={(e) => setGatewayClientId(e.target.value)}
                  placeholder="Optional Client ID"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSavingGateway}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingGateway ? 'Saving...' : 'Save Gateway Credentials'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WHATSAPP INTEGRATION VIEW (Section 10)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp-integration' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>WhatsApp Business API & Direct Dispatch</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Future-ready for official Meta Cloud WhatsApp Business API, with instant 1-click WhatsApp Web link dispatch today.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick 1-Click WhatsApp Direct Dispatch */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                1-Click Direct WhatsApp Web Messenger
              </h3>
              <p className="text-[11px] text-slate-500">
                Dispatches pre-formatted installment reminders directly into WhatsApp Web or mobile app without requiring Meta API approval.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Customer Phone Number
                  </label>
                  <input
                    type="text"
                    value={waTargetPhone}
                    onChange={(e) => setWaTargetPhone(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message Text
                  </label>
                  <textarea
                    rows={3}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <a
                  href={generateWhatsAppLink(waTargetPhone, waMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in WhatsApp Web / App</span>
                </a>
              </div>
            </div>

            {/* Meta Business API Settings Placeholder */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Official Meta WhatsApp Cloud API Setup
              </h3>
              <p className="text-[11px] text-slate-500">
                Connect your Meta Business Manager WhatsApp Phone Number ID when expanding to verified green badge automated messaging.
              </p>

              <div className="space-y-3 text-xs opacity-70">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Meta Phone Number ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1098234871928"
                    disabled
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    WhatsApp Permanent Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="EAAG...."
                    disabled
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                  Status: Meta WhatsApp Cloud API module stub loaded. Ready to activate upon providing Token.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SMS TEMPLATE                                                  */}
      {/* ========================================================================= */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            onClick={() => setEditingTemplate(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Notification Template
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Click to Insert Dynamic Placeholder Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{CustomerName}',
                    '{DueAmount}',
                    '{AgreementNo}',
                    '{DueDate}',
                    '{OutstandingAmount}',
                    '{OverdueDays}',
                    '{PaidAmount}',
                    '{ReceiptNo}',
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertVariableIntoTemplate(token)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100"
                    >
                      +{token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
