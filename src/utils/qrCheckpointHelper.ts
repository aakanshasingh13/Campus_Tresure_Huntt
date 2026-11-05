import QRCode from 'qrcode';
import { Clue, TreasureEvent } from '../types';

/**
 * Standardized Checkpoint QR Payload format
 */
export function getClueQrPayload(event: TreasureEvent, clue: Clue): string {
  if (clue.qrCodeValue && clue.qrCodeValue.startsWith('CQ_CHECKPOINT:')) {
    return clue.qrCodeValue;
  }
  const cleanEvtId = (event?.id || 'event').trim();
  const cleanClueId = (clue?.id || 'clue').trim();
  const cleanCode = (clue.qrCodeValue || clue.solution || `QR_${cleanClueId}`).trim();
  return `CQ_CHECKPOINT:${cleanEvtId}:${cleanClueId}:${cleanCode}`;
}

/**
 * Generate high-resolution DataURL for QR code printing & scanning
 */
export async function generateClueQrDataUrl(
  event: TreasureEvent,
  clue: Clue,
  options?: { width?: number; margin?: number; darkColor?: string }
): Promise<string> {
  const payload = getClueQrPayload(event, clue);
  const width = options?.width || 360;
  const margin = options?.margin ?? 2;
  const darkColor = options?.darkColor || '#020617';

  try {
    return await QRCode.toDataURL(payload, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    // Fallback to simpler payload if needed
    return await QRCode.toDataURL(clue.qrCodeValue || clue.solution || 'CLUE_QR', {
      width: 250,
      margin: 1,
    });
  }
}

/**
 * Human-readable backup verification code printed on physical sheet
 */
export function getClueBackupCode(clue: Clue, idx?: number): string {
  if (clue && clue.backupKey) {
    return clue.backupKey;
  }
  const num = (clue?.order || (idx !== undefined ? idx + 1 : 1)).toString().padStart(2, '0');
  const solSnippet = (clue?.solution || 'KEY').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `CP${num}-${solSnippet}`;
}

/**
 * Check whether a scanned QR code or typed answer matches the current checkpoint clue
 */
export function verifyCheckpointQr(
  scannedText: string,
  event: TreasureEvent,
  currentClue: Clue
): { isValid: boolean; reason?: string } {
  if (!scannedText || !currentClue) {
    return { isValid: false, reason: 'No QR code data received.' };
  }

  let cleanScanned = scannedText.trim();

  // If a full URL is scanned (e.g. from camera app), extract the query payload
  if (cleanScanned.includes('?') || cleanScanned.startsWith('http://') || cleanScanned.startsWith('https://')) {
    try {
      const url = new URL(cleanScanned, 'http://dummy-campus.local');
      const paramVal =
        url.searchParams.get('scan') ||
        url.searchParams.get('code') ||
        url.searchParams.get('qr') ||
        url.searchParams.get('key') ||
        url.searchParams.get('checkpoint');
      if (paramVal) {
        cleanScanned = decodeURIComponent(paramVal).trim();
      }
    } catch (e) {
      // fallback to original string
    }
  }

  const cleanExpectedPayload = getClueQrPayload(event, currentClue);
  const cleanSolution = (currentClue.solution || (currentClue as any).answerKey || '').trim().toUpperCase();
  const cleanQrValue = (currentClue.qrCodeValue || '').trim().toUpperCase();
  const backupCode = getClueBackupCode(currentClue).toUpperCase();
  const currentOrder = currentClue.order || 1;

  // 1. Direct match with standard full payload
  if (cleanScanned === cleanExpectedPayload) {
    return { isValid: true };
  }

  // 2. Contains standard payload prefix (CQ_CHECKPOINT:<eventId>:<clueId>:<codeOrSolution>)
  if (cleanScanned.startsWith('CQ_CHECKPOINT:')) {
    const parts = cleanScanned.split(':');
    const scannedClueId = (parts[2] || '').trim();
    const scannedCode = (parts[3] || '').trim().toUpperCase();

    // Check if clue ID matches current clue
    const matchesClueId =
      scannedClueId === currentClue.id ||
      scannedClueId === String(currentOrder) ||
      scannedClueId === `clue-${currentOrder}` ||
      (currentClue.id && scannedClueId.toLowerCase().includes(currentClue.id.toLowerCase())) ||
      (currentClue.id && currentClue.id.toLowerCase().includes(scannedClueId.toLowerCase()));

    const matchesCode =
      scannedCode &&
      (scannedCode === cleanQrValue ||
        scannedCode === cleanSolution ||
        (cleanSolution.length >= 3 && scannedCode.includes(cleanSolution)));

    if (matchesClueId || matchesCode) {
      return { isValid: true };
    }

    // If it's for a different checkpoint number, provide clear guidance
    const numMatch = scannedClueId.match(/\d+/);
    if (numMatch) {
      const scannedOrder = parseInt(numMatch[0], 10);
      if (scannedOrder > currentOrder) {
        return {
          isValid: false,
          reason: `You scanned Checkpoint #${scannedOrder}! You must locate and complete Checkpoint #${currentOrder} first.`,
        };
      } else if (scannedOrder < currentOrder) {
        return {
          isValid: false,
          reason: `You already completed Checkpoint #${scannedOrder}! Look for Checkpoint #${currentOrder} near ${currentClue.locationHint || 'the next landmark'}.`,
        };
      }
    }

    return {
      isValid: false,
      reason: 'This QR code belongs to a different checkpoint on campus!',
    };
  }

  // 3. Match against clue's explicit qrCodeValue
  if (cleanQrValue && cleanScanned.toUpperCase() === cleanQrValue) {
    return { isValid: true };
  }

  // 4. Match against clue solution keyword
  if (cleanSolution && cleanScanned.toUpperCase() === cleanSolution) {
    return { isValid: true };
  }

  // 5. Match against human-readable backup code
  if (cleanScanned.toUpperCase() === backupCode) {
    return { isValid: true };
  }

  // 6. Loose substring match if payload contains clueId or solution or qrCodeValue
  if (
    cleanScanned.toUpperCase().includes(currentClue.id.toUpperCase()) ||
    (cleanSolution.length >= 4 && cleanScanned.toUpperCase().includes(cleanSolution)) ||
    (cleanQrValue && cleanScanned.toUpperCase().includes(cleanQrValue)) ||
    cleanScanned.toUpperCase() === `QR ${currentOrder}` ||
    cleanScanned.toUpperCase() === `QR_${currentOrder}` ||
    cleanScanned.toUpperCase() === `CHECKPOINT ${currentOrder}`
  ) {
    return { isValid: true };
  }

  return {
    isValid: false,
    reason: `Invalid QR marker for Checkpoint #${currentOrder}. Expected location: ${currentClue.locationHint || 'Checkpoint location'}.`,
  };
}
