/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ensec ERP - SMS Gateway Integration & Communication Service
 */

import { SMSGatewaySettings, SMSLog, SMSTemplate } from '../types/installment.ts';

export interface SendSMSParams {
  recipientPhone: string;
  recipientName: string;
  message: string;
  templateCode?: string;
  ruleId?: string;
  planId?: string;
  agreementNo?: string;
  gatewaySettings: SMSGatewaySettings;
}

export interface SendSMSResult {
  success: boolean;
  status: 'Sent' | 'Delivered' | 'Failed';
  gatewayResponse: string;
  log: SMSLog;
}

/**
 * Validate and format Bangladesh mobile phone number
 * Accepts formats like: 01711223344, +8801711223344, 8801711223344, 018-12345678
 */
export function formatBDPhoneNumber(phone: string): { isValid: boolean; formatted: string; raw: string } {
  if (!phone) return { isValid: false, formatted: '', raw: '' };
  
  // Strip non-digit characters except leading plus
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+88')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(2);
  }

  // BD mobile numbers must start with 01 and have 11 digits: 01[3-9]XXXXXXXX
  const bdMobileRegex = /^01[3-9]\d{8}$/;
  const isValid = bdMobileRegex.test(cleaned);

  return {
    isValid,
    formatted: isValid ? `+88${cleaned}` : phone,
    raw: cleaned,
  };
}

/**
 * Compile template with contextual values
 */
export function compileTemplate(templateBody: string, variables: Record<string, string | number>): string {
  let result = templateBody;
  for (const [key, value] of Object.entries(variables)) {
    const formattedVal = typeof value === 'number' ? value.toLocaleString('en-IN') : String(value || '');
    // Replace {Key} and {key}
    result = result.replaceAll(`{${key}}`, formattedVal);
  }
  return result;
}

/**
 * Generate direct WhatsApp link for manual or Web dispatch
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const { raw, isValid } = formatBDPhoneNumber(phone);
  const targetNumber = isValid ? `88${raw}` : phone.replace(/[^\d]/g, '');
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Dispatch SMS through the configured gateway.
 * Adheres strictly to the requirement: If gateway credentials are not configured,
 * return a real failure and configuration notice — do NOT pretend messages have been sent.
 */
export async function sendSMSViaGateway(params: SendSMSParams): Promise<SendSMSResult> {
  const {
    recipientPhone,
    recipientName,
    message,
    templateCode,
    ruleId,
    planId,
    agreementNo,
    gatewaySettings,
  } = params;

  const { isValid, formatted, raw } = formatBDPhoneNumber(recipientPhone);

  const baseLog: SMSLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientPhone: formatted || recipientPhone,
    recipientName,
    message,
    templateCode,
    ruleId,
    planId,
    agreementNo,
    status: 'Failed',
    gatewayResponse: '',
    sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    retryCount: 0,
  };

  // 1. Validate Phone Number
  if (!isValid) {
    baseLog.status = 'Failed';
    baseLog.gatewayResponse = 'Invalid Bangladesh Mobile Number format. Expected 01XXXXXXXXX';
    return {
      success: false,
      status: 'Failed',
      gatewayResponse: baseLog.gatewayResponse,
      log: baseLog,
    };
  }

  // 2. Check Gateway Configuration
  const isKeyAvailable = Boolean(gatewaySettings.apiKey && gatewaySettings.apiKey.trim().length > 0);
  const isUrlAvailable = Boolean(gatewaySettings.apiUrl && gatewaySettings.apiUrl.trim().length > 0);

  if (!gatewaySettings.isConfigured || !isKeyAvailable || !isUrlAvailable) {
    baseLog.status = 'Failed';
    baseLog.gatewayResponse = 'Gateway Not Configured: Missing API Key or Endpoint in SMS Gateway Settings.';
    return {
      success: false,
      status: 'Failed',
      gatewayResponse: baseLog.gatewayResponse,
      log: baseLog,
    };
  }

  // 3. Attempt Real HTTP Gateway Request
  try {
    let requestUrl = gatewaySettings.apiUrl;
    let requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (gatewaySettings.provider === 'greenweb') {
      // Greenweb BD SMS Gateway format: GET/POST token, to, message
      const params = new URLSearchParams();
      params.append('token', gatewaySettings.apiKey);
      params.append('to', `88${raw}`);
      params.append('message', message);
      requestUrl = `${gatewaySettings.apiUrl}?${params.toString()}`;
      requestOptions = { method: 'GET' };
    } else {
      // Generic JSON REST API format
      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewaySettings.apiKey}`,
        },
        body: JSON.stringify({
          sender_id: gatewaySettings.senderId || 'ENSEC',
          recipient: formatted,
          message,
        }),
      };
    }

    const response = await fetch(requestUrl, requestOptions);
    const responseText = await response.text();

    if (response.ok) {
      baseLog.status = 'Delivered';
      baseLog.gatewayResponse = `Gateway HTTP ${response.status}: ${responseText.slice(0, 150)}`;
      return {
        success: true,
        status: 'Delivered',
        gatewayResponse: baseLog.gatewayResponse,
        log: baseLog,
      };
    } else {
      baseLog.status = 'Failed';
      baseLog.gatewayResponse = `Gateway HTTP Error ${response.status}: ${responseText.slice(0, 150)}`;
      return {
        success: false,
        status: 'Failed',
        gatewayResponse: baseLog.gatewayResponse,
        log: baseLog,
      };
    }
  } catch (err: any) {
    baseLog.status = 'Failed';
    baseLog.gatewayResponse = `Network / Dispatch Error: ${err?.message || 'Connection failed'}`;
    return {
      success: false,
      status: 'Failed',
      gatewayResponse: baseLog.gatewayResponse,
      log: baseLog,
    };
  }
}
