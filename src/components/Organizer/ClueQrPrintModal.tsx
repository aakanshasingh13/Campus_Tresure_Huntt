import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  QrCode,
  MapPin,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  Key,
  FileDown,
  List,
  ShieldAlert,
} from 'lucide-react-native';
import { Clue, TreasureEvent } from '../../types';
import {
  generateClueQrDataUrl,
  getClueBackupCode,
  getClueQrPayload,
} from '../../utils/qrCheckpointHelper';

interface ClueQrPrintModalProps {
  visible: boolean;
  event: TreasureEvent;
  selectedClue?: Clue | null;
  onClose: () => void;
}

function escapeHtml(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function downloadHtmlFile(html: string, filename: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ClueQrPrintModal: React.FC<ClueQrPrintModalProps> = ({
  visible,
  event,
  selectedClue,
  onClose,
}) => {
  const rawClues = event?.clues || [];
  const clues = useMemo(() => {
    if (!selectedClue) return rawClues;
    const exists = rawClues.some((c) => c.id === selectedClue.id);
    if (exists) {
      return rawClues.map((c) => (c.id === selectedClue.id ? { ...c, ...selectedClue } : c));
    } else {
      return [...rawClues, selectedClue];
    }
  }, [rawClues, selectedClue]);

  const [activeClueIndex, setActiveClueIndex] = useState(() => {
    if (selectedClue) {
      const idx = (event?.clues || []).findIndex((c) => c.id === selectedClue.id);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  // Default to line-wise table view when opened via 'PRINT ALL QRS' (selectedClue is null)
  const [viewMode, setViewMode] = useState<'table' | 'single' | 'all'>(
    selectedClue ? 'single' : 'table'
  );
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Set initial selected clue index
  useEffect(() => {
    if (selectedClue && clues.length > 0) {
      const idx = clues.findIndex((c) => c.id === selectedClue.id);
      if (idx !== -1) {
        setActiveClueIndex(idx);
      } else {
        setActiveClueIndex(clues.length - 1);
      }
      setViewMode('single');
    } else if (!selectedClue) {
      setViewMode('table');
    }
  }, [selectedClue, clues]);

  // Generate QR code data URLs for all clues in the event
  useEffect(() => {
    let isCancelled = false;
    async function generateAllQrs() {
      const mapping: Record<string, string> = {};
      for (const clue of clues) {
        try {
          const url = await generateClueQrDataUrl(event, clue, { width: 340 });
          mapping[clue.id] = url;
        } catch (e) {
          console.error(e);
        }
      }
      if (!isCancelled) {
        setQrDataUrls(mapping);
      }
    }

    if (visible && clues.length > 0) {
      generateAllQrs();
    }
    return () => {
      isCancelled = true;
    };
  }, [visible, event, clues]);

  if (!visible) return null;

  const currentClue = clues[activeClueIndex] || clues[0] || selectedClue;

  const startPoint =
    event.startLocation ||
    (event as any).meetingPoint ||
    event.campusName ||
    'Stanford Innovation Campus';
  const eventDate = event.date || '2026-09-30';
  const eventTime = event.time || '14:00';
  const eventCode = event.code || '849201';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyPayload = (clue: Clue) => {
    const payload = getClueQrPayload(event, clue);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(payload);
    }
    setCopiedId(clue.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQr = (clue: Clue, idx: number) => {
    const dataUrl = qrDataUrls[clue.id];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Checkpoint_${idx + 1}_${clue.title.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build complete printable & downloadable PDF/HTML master document
  const generateMasterDocumentHtml = () => {
    const tableRowsHtml = clues
      .map((clue, idx) => {
        const qrUrl = qrDataUrls[clue.id] || '';
        const backupCode = clue.backupKey || getClueBackupCode(clue, idx);
        const serialNo = clue.order || idx + 1;
        const answer = clue.solution || (clue as any).answerKey || 'NOT SPECIFIED';
        const placement = clue.placementNote || clue.locationHint || 'Designated checkpoint location';

        return `
          <tr style="border-bottom: 2px solid #e2e8f0; page-break-inside: avoid;">
            <td style="padding: 14px 10px; text-align: center; vertical-align: middle;">
              <div style="display: inline-block; background: #fef3c7; color: #92400e; border: 1.5px solid #d97706; border-radius: 8px; padding: 6px 12px; font-weight: 900; font-size: 16px;">
                #${serialNo}
              </div>
            </td>
            <td style="padding: 14px 12px; vertical-align: top;">
              <div style="font-weight: 900; font-size: 15px; color: #0f172a; margin-bottom: 5px; text-transform: uppercase;">
                ${escapeHtml(clue.title)}
              </div>
              <div style="font-style: italic; font-size: 12.5px; color: #1e293b; line-height: 1.45; margin-bottom: 8px; background: #f8fafc; padding: 8px 10px; border-left: 3.5px solid #3b82f6; border-radius: 4px;">
                "${escapeHtml(clue.riddle)}"
              </div>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 4px;">
                <strong style="color: #475569;">📍 Placement Location:</strong> ${escapeHtml(placement)}
              </div>
              ${
                clue.hint1
                  ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;"><strong style="color: #64748b;">Hint 1:</strong> ${escapeHtml(clue.hint1)}</div>`
                  : ''
              }
            </td>
            <td style="padding: 14px 12px; vertical-align: top;">
              <div style="display: inline-block; background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px;">
                <div style="font-size: 9.5px; font-weight: 900; color: #065f46; letter-spacing: 0.8px; text-transform: uppercase;">
                  ANSWER KEY:
                </div>
                <div style="font-size: 14px; font-weight: 900; color: #047857; text-transform: uppercase;">
                  ${escapeHtml(answer)}
                </div>
              </div>
              <div style="font-size: 11.5px; color: #475569; margin-top: 2px;">
                <strong>Backup Key:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 800; color: #0f172a;">${escapeHtml(backupCode)}</code>
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
                <strong>Points:</strong> ${clue.points || 100} PTS
              </div>
            </td>
            <td style="padding: 14px 10px; text-align: center; vertical-align: middle;">
              ${
                qrUrl
                  ? `<img src="${qrUrl}" width="125" height="125" style="border: 2px solid #0f172a; border-radius: 8px; padding: 4px; background: #ffffff; display: block; margin: 0 auto;" alt="QR Code for Checkpoint ${serialNo}" />`
                  : `<div style="width: 110px; height: 110px; border: 2px dashed #94a3b8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8; margin: 0 auto;">QR Code</div>`
              }
              <div style="font-size: 9.5px; color: #475569; font-weight: 700; margin-top: 5px;">
                Scan to reveal next clue
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(event.title)} - Master Checkpoints & Answer Key</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 16px;
            font-size: 12px;
          }
          .header-box {
            border: 2px solid #0f172a;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 16px;
            background: #f8fafc;
          }
          .brand-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .brand-title {
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #4338ca;
            text-transform: uppercase;
          }
          .confidential-tag {
            background: #fee2e2;
            color: #991b1b;
            font-size: 10px;
            font-weight: 900;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #f87171;
            letter-spacing: 0.5px;
          }
          .event-title {
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .meta-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
          }
          .meta-label {
            font-size: 9px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .meta-val {
            font-size: 12.5px;
            font-weight: 800;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 10px;
            text-align: left;
          }
          .footer-note {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1.5px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="brand-row">
            <span class="brand-title">CAMPUS QUEST • ORGANIZER MASTER CHECKPOINTS DOCUMENT</span>
            <span class="confidential-tag">⚠️ CONFIDENTIAL ORGANIZER ANSWER KEY</span>
          </div>
          <h1 class="event-title">${escapeHtml(event.title)}</h1>
          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">📍 START POINT / VENUE</div>
              <div class="meta-val">${escapeHtml(startPoint)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">📅 EVENT DATE</div>
              <div class="meta-val">${escapeHtml(eventDate)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">⏰ START TIME</div>
              <div class="meta-val">${escapeHtml(eventTime)}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">🔑 ACCESS PIN / CODE</div>
              <div class="meta-val">${escapeHtml(eventCode)}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">SR #</th>
              <th style="width: 44%;">CLUE RIDDLE & LOCATION</th>
              <th style="width: 28%;">ANSWER KEY & BACKUP CODE</th>
              <th style="width: 20%; text-align: center;">WORKING QR CODE</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer-note">
          <span>Campus Quest System • Verification Payload: CQ_CHECKPOINT (Scanning advances players to next clue in real-time)</span>
          <span>Total Checkpoints: ${clues.length} | Generated on: ${new Date().toLocaleDateString()}</span>
        </div>
      </body>
      </html>
    `;
  };

  // 1. Download as PDF (Opens print-ready window with auto-trigger for print / Save as PDF)
  const handleDownloadPdf = () => {
    if (typeof window === 'undefined') return;
    setIsExportingPdf(true);

    try {
      const htmlContent = generateMasterDocumentHtml();
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
        setTimeout(() => {
          printWin.focus();
          printWin.print();
          setIsExportingPdf(false);
        }, 500);
      } else {
        // Fallback: Trigger direct file download
        downloadHtmlFile(
          htmlContent,
          `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Master_Checkpoints.html`
        );
        setIsExportingPdf(false);
      }
    } catch (e) {
      console.error(e);
      setIsExportingPdf(false);
    }
  };

  // 2. Direct offline file download
  const handleDownloadMasterHtml = () => {
    const htmlContent = generateMasterDocumentHtml();
    downloadHtmlFile(
      htmlContent,
      `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Master_Checkpoints.html`
    );
  };

  // Render individual physical checkpoint poster sheet
  const renderPrintSheet = (clue: Clue, index: number) => {
    const qrUrl = qrDataUrls[clue.id];
    const backupCode = clue.backupKey || getClueBackupCode(clue, index);

    return (
      <View key={clue.id} style={styles.printSheetCard} className="printable-checkpoint-sheet">
        {/* Physical Sheet Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderBadge}>
            <Sparkles size={12} color="#4338ca" />
            <Text style={styles.sheetHeaderBadgeText}>CAMPUS QUEST • PHYSICAL CHECKPOINT MARKER</Text>
          </View>
          <Text style={styles.sheetEventTitle}>{event.title}</Text>
          <Text style={styles.sheetCampusName}>
            📍 {clue.locationHint || event.campusName || 'Stanford Innovation Campus'}
          </Text>
        </View>

        {/* Checkpoint Counter Banner */}
        <View style={styles.checkpointBanner}>
          <Text style={styles.checkpointBannerNum}>
            CHECKPOINT #{clue.order || index + 1} OF {clues.length}
          </Text>
          <Text style={styles.checkpointBannerTitle}>{clue.title}</Text>
        </View>

        {/* Physical Placement Location Box for Organizer */}
        <View style={styles.placementBox}>
          <View style={styles.placementHeader}>
            <MapPin size={14} color="#b45309" />
            <Text style={styles.placementHeaderText}>
              PHYSICAL PLACEMENT INSTRUCTION (ORGANIZER ONLY):
            </Text>
          </View>
          <Text style={styles.placementLocation}>
            {clue.placementNote || clue.locationHint || 'Tape or position this printout at the designated checkpoint location.'}
          </Text>
        </View>

        {/* QR Code Container */}
        <View style={styles.qrCodeFrame}>
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR Code for Checkpoint ${index + 1}`}
              style={{ width: 220, height: 220, display: 'block', margin: '0 auto' }}
            />
          ) : (
            <View style={styles.qrLoadingBox}>
              <QrCode size={64} color="#64748b" />
              <Text style={styles.qrLoadingText}>Generating High-Res QR...</Text>
            </View>
          )}

          <View style={styles.scanInstructionPill}>
            <QrCode size={13} color="#78350f" />
            <Text style={styles.scanInstructionText}>
              Scan with Campus Quest App to unlock next clue
            </Text>
          </View>
        </View>

        {/* Instructions for Players */}
        <View style={styles.playerNoticeBox}>
          <Text style={styles.playerNoticeTitle}>🎯 PLAYER INSTRUCTIONS</Text>
          <Text style={styles.playerNoticeBody}>
            1. You found this physical checkpoint! Scan this QR code in your active Campus Quest screen.
          </Text>
          <Text style={styles.playerNoticeBody}>
            2. Scanning validates your team's arrival and immediately unlocks the clue for the{' '}
            <Text style={{ fontWeight: 'bold' }}>NEXT step</Text>!
          </Text>
        </View>

        {/* Backup Code Footer */}
        <View style={styles.backupCodeRow}>
          <Text style={styles.backupCodeLabel}>Low lighting? Enter Manual Backup Key:</Text>
          <View style={styles.backupCodeBadge}>
            <Text style={styles.backupCodeText}>{backupCode}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Line-wise Clue Row for the Master List
  const renderLineWiseRow = (clue: Clue, index: number) => {
    const qrUrl = qrDataUrls[clue.id];
    const backupCode = clue.backupKey || getClueBackupCode(clue, index);
    const serialNo = clue.order || index + 1;
    const answer = clue.solution || (clue as any).answerKey || 'NOT SPECIFIED';
    const placement = clue.placementNote || clue.locationHint || 'Designated checkpoint location';

    return (
      <View key={clue.id || index} style={styles.masterRowCard}>
        {/* Top/Left: Serial Number Badge */}
        <View style={styles.masterRowSerialCol}>
          <View style={styles.masterSerialBadge}>
            <Text style={styles.masterSerialBadgeText}>#{serialNo}</Text>
          </View>
          <Text style={styles.masterSerialLabel}>CLUE {serialNo}</Text>
        </View>

        {/* Middle: Clue Info + Answer Key + Placement */}
        <View style={styles.masterRowInfoCol}>
          {/* Clue Header */}
          <View style={styles.masterRowTitleRow}>
            <Text style={styles.masterRowTitle}>{clue.title.toUpperCase()}</Text>
            <View style={styles.masterPointsBadge}>
              <Text style={styles.masterPointsText}>{clue.points || 100} PTS</Text>
            </View>
          </View>

          {/* Riddle Quote Box */}
          <View style={styles.masterRiddleBox}>
            <Text style={styles.masterRiddleText}>"{clue.riddle}"</Text>
          </View>

          {/* Answer Key & Manual Backup Key Row */}
          <View style={styles.masterKeyAnswersRow}>
            {/* The Answer Key Pill */}
            <View style={styles.masterAnswerPill}>
              <Text style={styles.masterAnswerLabel}>ANSWER KEY:</Text>
              <Text style={styles.masterAnswerText}>{answer.toUpperCase()}</Text>
            </View>

            {/* Manual Backup Key Pill */}
            <View style={styles.masterBackupKeyPill}>
              <Text style={styles.masterBackupKeyLabel}>BACKUP CODE:</Text>
              <Text style={styles.masterBackupKeyText}>{backupCode}</Text>
            </View>
          </View>

          {/* Placement Instruction */}
          <View style={styles.masterPlacementRow}>
            <MapPin size={13} color="#b45309" />
            <Text style={styles.masterPlacementText} numberOfLines={2}>
              <Text style={{ fontWeight: '700', color: '#78350f' }}>Physical Location: </Text>
              {placement}
            </Text>
          </View>
        </View>

        {/* Right: Working QR Code with Download & Copy */}
        <View style={styles.masterRowQrCol}>
          <View style={styles.masterQrImageContainer}>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR Code for Checkpoint ${serialNo}`}
                style={{
                  width: 110,
                  height: 110,
                  display: 'block',
                  margin: '0 auto',
                  borderRadius: 6,
                }}
              />
            ) : (
              <View style={styles.masterQrPlaceholder}>
                <QrCode size={40} color="#94a3b8" />
                <Text style={styles.masterQrPlaceholderText}>Generating...</Text>
              </View>
            )}
          </View>

          <Text style={styles.masterQrInstruction}>Scan reveals next clue</Text>

          {/* Action buttons */}
          <View style={styles.masterQrActionsRow}>
            <TouchableOpacity
              onPress={() => handleDownloadQr(clue, index)}
              style={styles.masterQrActionBtn}
              activeOpacity={0.7}
              title="Download QR Image"
            >
              <Download size={11} color="#4338ca" />
              <Text style={styles.masterQrActionBtnText}>PNG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleCopyPayload(clue)}
              style={styles.masterQrActionBtn}
              activeOpacity={0.7}
              title="Copy verification payload"
            >
              {copiedId === clue.id ? (
                <Check size={11} color="#10b981" />
              ) : (
                <Copy size={11} color="#475569" />
              )}
              <Text style={styles.masterQrActionBtnText}>
                {copiedId === clue.id ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            viewMode === 'table' ? styles.modalCardWide : styles.modalCardStandard,
          ]}
        >
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerPill}>
                <Printer size={12} color="#4338ca" />
                <Text style={styles.headerPillText}>PHYSICAL CHECKPOINTS & QR PRINTOUTS</Text>
              </View>
              <Text style={styles.headerTitle}>Print Checkpoint QR Codes</Text>
              <Text style={styles.headerSub}>
                Line-wise clue master list with working QR codes, answer keys, serial numbers, and PDF export.
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Action Toolbar */}
          <View style={styles.toolbar}>
            {/* View Mode Toggle */}
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                onPress={() => setViewMode('table')}
                style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
                activeOpacity={0.8}
              >
                <List size={13} color={viewMode === 'table' ? '#ffffff' : '#475569'} />
                <Text style={[styles.toggleBtnText, viewMode === 'table' && styles.toggleBtnTextActive]}>
                  Line-Wise Master List ({clues.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('single')}
                style={[styles.toggleBtn, viewMode === 'single' && styles.toggleBtnActive]}
                activeOpacity={0.8}
              >
                <FileText size={13} color={viewMode === 'single' ? '#ffffff' : '#475569'} />
                <Text style={[styles.toggleBtnText, viewMode === 'single' && styles.toggleBtnTextActive]}>
                  Single Sheet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('all')}
                style={[styles.toggleBtn, viewMode === 'all' && styles.toggleBtnActive]}
                activeOpacity={0.8}
              >
                <Layers size={13} color={viewMode === 'all' ? '#ffffff' : '#475569'} />
                <Text style={[styles.toggleBtnText, viewMode === 'all' && styles.toggleBtnTextActive]}>
                  Booklet Posters ({clues.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons: Download PDF & Print */}
            <View style={styles.toolbarActionsGroup}>
              {/* 1. Download PDF Master Document */}
              <TouchableOpacity
                onPress={handleDownloadPdf}
                style={styles.downloadPdfBtn}
                activeOpacity={0.8}
              >
                <Download size={14} color="#ffffff" strokeWidth={2.4} />
                <Text style={styles.downloadPdfBtnText}>
                  {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
                </Text>
              </TouchableOpacity>

              {/* 2. Direct HTML / Offline Master Save */}
              <TouchableOpacity
                onPress={handleDownloadMasterHtml}
                style={styles.saveFileBtn}
                activeOpacity={0.8}
                title="Save self-contained master file"
              >
                <FileDown size={14} color="#0f172a" />
                <Text style={styles.saveFileBtnText}>Save File</Text>
              </TouchableOpacity>

              {/* 3. Print Action Button */}
              <TouchableOpacity onPress={handlePrint} style={styles.printActionBtn} activeOpacity={0.8}>
                <Printer size={14} color="#ffffff" />
                <Text style={styles.printActionBtnText}>Print</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation carousel for Single View */}
          {viewMode === 'single' && clues.length > 1 && (
            <View style={styles.carouselNavRow}>
              <TouchableOpacity
                onPress={() => setActiveClueIndex((prev) => (prev > 0 ? prev - 1 : clues.length - 1))}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
              >
                <ChevronLeft size={16} color="#0f172a" />
                <Text style={styles.navArrowText}>Previous</Text>
              </TouchableOpacity>

              <Text style={styles.carouselStatusText}>
                Viewing Clue #{activeClueIndex + 1} of {clues.length}:{' '}
                <Text style={{ fontWeight: 'bold' }}>{currentClue?.title}</Text>
              </Text>

              <TouchableOpacity
                onPress={() => setActiveClueIndex((prev) => (prev < clues.length - 1 ? prev + 1 : 0))}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.navArrowText}>Next</Text>
                <ChevronRight size={16} color="#0f172a" />
              </TouchableOpacity>
            </View>
          )}

          {/* Scrollable Stage */}
          <ScrollView
            style={styles.scrollStage}
            contentContainerStyle={styles.scrollStageContent}
            showsVerticalScrollIndicator={true}
          >
            {clues.length === 0 ? (
              <View style={styles.emptyState}>
                <Info size={32} color="#94a3b8" />
                <Text style={styles.emptyStateTitle}>No Clues Added Yet</Text>
                <Text style={styles.emptyStateSub}>
                  Add clues in the clue manager first to generate printable QR checkpoint markers.
                </Text>
              </View>
            ) : viewMode === 'table' ? (
              /* LINE-WISE MASTER LIST VIEW (WITH EVENT NAME, START POINT, DATE & ANSWERS) */
              <View style={styles.masterListContainer}>
                {/* Event Summary Card */}
                <View style={styles.eventSummaryBanner}>
                  <View style={styles.eventSummaryTopRow}>
                    <View style={styles.confidentialPill}>
                      <ShieldAlert size={12} color="#991b1b" />
                      <Text style={styles.confidentialPillText}>
                        CONFIDENTIAL ORGANIZER ANSWER KEY & CHECKPOINT LIST
                      </Text>
                    </View>
                    <View style={styles.cluesCountPill}>
                      <Text style={styles.cluesCountText}>{clues.length} CHECKPOINTS</Text>
                    </View>
                  </View>

                  <Text style={styles.eventSummaryTitle}>{event.title}</Text>

                  {/* Event Meta Grid: Start Point, Date, Time, Access PIN */}
                  <View style={styles.eventMetaGrid}>
                    <View style={styles.eventMetaItem}>
                      <View style={styles.eventMetaLabelRow}>
                        <MapPin size={11} color="#b45309" />
                        <Text style={styles.eventMetaLabel}>START POINT</Text>
                      </View>
                      <Text style={styles.eventMetaVal}>{startPoint}</Text>
                    </View>

                    <View style={styles.eventMetaItem}>
                      <View style={styles.eventMetaLabelRow}>
                        <Calendar size={11} color="#0284c7" />
                        <Text style={styles.eventMetaLabel}>EVENT DATE</Text>
                      </View>
                      <Text style={styles.eventMetaVal}>{eventDate}</Text>
                    </View>

                    <View style={styles.eventMetaItem}>
                      <View style={styles.eventMetaLabelRow}>
                        <Clock size={11} color="#16a34a" />
                        <Text style={styles.eventMetaLabel}>START TIME</Text>
                      </View>
                      <Text style={styles.eventMetaVal}>{eventTime}</Text>
                    </View>

                    <View style={styles.eventMetaItem}>
                      <View style={styles.eventMetaLabelRow}>
                        <Key size={11} color="#7c3aed" />
                        <Text style={styles.eventMetaLabel}>ORGANIZER PIN</Text>
                      </View>
                      <Text style={styles.eventMetaVal}>{eventCode}</Text>
                    </View>
                  </View>
                </View>

                {/* Line-Wise Clues List */}
                <View style={styles.masterRowsList}>
                  {clues.map((clue, idx) => renderLineWiseRow(clue, idx))}
                </View>
              </View>
            ) : viewMode === 'all' ? (
              /* ALL BOOKLET POSTERS VIEW */
              <View style={{ gap: 20 }}>
                {clues.map((clue, idx) => (
                  <View key={clue.id} style={{ alignItems: 'center' }}>
                    {renderPrintSheet(clue, idx)}
                    <View style={styles.singleActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleDownloadQr(clue, idx)}
                        style={styles.downloadBtn}
                        activeOpacity={0.7}
                      >
                        <Download size={13} color="#4338ca" />
                        <Text style={styles.downloadBtnText}>Download PNG</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleCopyPayload(clue)}
                        style={styles.copyBtn}
                        activeOpacity={0.7}
                      >
                        {copiedId === clue.id ? (
                          <Check size={13} color="#10b981" />
                        ) : (
                          <Copy size={13} color="#475569" />
                        )}
                        <Text style={styles.copyBtnText}>
                          {copiedId === clue.id ? 'Copied' : 'Copy Payload'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              /* SINGLE VIEW */
              currentClue && (
                <View style={{ alignItems: 'center', width: '100%' }}>
                  {renderPrintSheet(currentClue, activeClueIndex)}
                </View>
              )
            )}
          </ScrollView>

          {/* Footer Helper */}
          <View style={styles.modalFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <CheckCircle2 size={15} color="#10b981" />
              <Text style={styles.footerNote}>
                QR codes are verified live by Campus Quest. When a player scans checkpoint #N, the
                system verifies arrival and automatically displays the clue for step #N+1.
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.footerCloseBtn} activeOpacity={0.8}>
              <Text style={styles.footerCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92vh' as any,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalCardStandard: {
    maxWidth: 640,
  },
  modalCardWide: {
    maxWidth: 900,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  headerPillText: {
    color: '#3730a3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  headerSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
    flexWrap: 'wrap',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: '#4338ca',
  },
  toggleBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },
  toolbarActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)',
  },
  downloadPdfBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  saveFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveFileBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
  },
  printActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  carouselNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  navArrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  navArrowText: {
    color: '#0f172a',
    fontSize: 11.5,
    fontWeight: '700',
  },
  carouselStatusText: {
    color: '#475569',
    fontSize: 12,
  },
  scrollStage: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollStageContent: {
    padding: 18,
    alignItems: 'center',
  },

  /* MASTER LIST / LINE-WISE CONTAINER & BANNER */
  masterListContainer: {
    width: '100%',
    maxWidth: 860,
  },
  eventSummaryBanner: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  eventSummaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  confidentialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidentialPillText: {
    color: '#991b1b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cluesCountPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cluesCountText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
  },
  eventSummaryTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  eventMetaGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  eventMetaItem: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
  },
  eventMetaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  eventMetaLabel: {
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '800',
  },
  eventMetaVal: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* LINE-WISE CLUE ROWS */
  masterRowsList: {
    gap: 12,
  },
  masterRowCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    flexWrap: 'wrap',
  },
  masterRowSerialCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 55,
  },
  masterSerialBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  masterSerialBadgeText: {
    color: '#92400e',
    fontSize: 18,
    fontWeight: '900',
  },
  masterSerialLabel: {
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '800',
  },
  masterRowInfoCol: {
    flex: 1,
    minWidth: 260,
  },
  masterRowTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  masterRowTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  masterPointsBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  masterPointsText: {
    color: '#3730a3',
    fontSize: 10.5,
    fontWeight: '800',
  },
  masterRiddleBox: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3.5,
    borderLeftColor: '#3b82f6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  masterRiddleText: {
    color: '#1e293b',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  masterKeyAnswersRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  masterAnswerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  masterAnswerLabel: {
    color: '#065f46',
    fontSize: 9.5,
    fontWeight: '900',
  },
  masterAnswerText: {
    color: '#047857',
    fontSize: 12.5,
    fontWeight: '900',
  },
  masterBackupKeyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  masterBackupKeyLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
  },
  masterBackupKeyText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  masterPlacementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  masterPlacementText: {
    color: '#78350f',
    fontSize: 11,
    flex: 1,
  },

  /* RIGHT: QR CODE COLUMN IN MASTER ROW */
  masterRowQrCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    borderLeftWidth: 1,
    borderLeftColor: '#f1f5f9',
    paddingLeft: 12,
  },
  masterQrImageContainer: {
    padding: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    borderRadius: 8,
    marginBottom: 4,
  },
  masterQrPlaceholder: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterQrPlaceholderText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
  },
  masterQrInstruction: {
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  masterQrActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  masterQrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  masterQrActionBtnText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
  },

  /* PHYSICAL PRINTABLE SHEET CARD (SINGLE & BOOKLET) */
  printSheetCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 24,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 14,
  },
  sheetHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  sheetHeaderBadgeText: {
    color: '#3730a3',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sheetEventTitle: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  sheetCampusName: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  checkpointBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkpointBannerNum: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  checkpointBannerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  placementBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  placementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  placementHeaderText: {
    color: '#92400e',
    fontSize: 9.5,
    fontWeight: '900',
  },
  placementLocation: {
    color: '#78350f',
    fontSize: 12,
    fontWeight: '700',
  },
  qrCodeFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    marginBottom: 14,
  },
  qrLoadingBox: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  scanInstructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
  },
  scanInstructionText: {
    color: '#78350f',
    fontSize: 10.5,
    fontWeight: '800',
  },
  playerNoticeBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  playerNoticeTitle: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 3,
  },
  playerNoticeBody: {
    color: '#15803d',
    fontSize: 11,
    lineHeight: 15,
  },
  backupCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  backupCodeLabel: {
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: '600',
  },
  backupCodeBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  backupCodeText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  singleActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: '#4338ca',
    fontSize: 11.5,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  footerNote: {
    color: '#475569',
    fontSize: 11.5,
    flex: 1,
  },
  footerCloseBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
  },
  footerCloseBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyStateSub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
