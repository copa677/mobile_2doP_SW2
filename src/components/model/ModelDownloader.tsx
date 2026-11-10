import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ModelInfo } from '@/types/reports';
import {
  isModelDownloaded,
  startModelDownload,
  deleteModelFile,
  cancelCurrentDownload
} from '@/services/llm/modelManager';

interface ModelDownloaderProps {
  model: ModelInfo;
  onStatusChange?: () => void;
}

export const ModelDownloader: React.FC<ModelDownloaderProps> = ({ model, onStatusChange }) => {
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ fraction: number; downloadedMB: number; totalMB: number }>({
    fraction: 0,
    downloadedMB: 0,
    totalMB: model.sizeMB,
  });

  const checkStatus = async () => {
    const status = await isModelDownloaded(model.filename);
    setDownloaded(status.exists);
  };

  useEffect(() => {
    checkStatus();
  }, [model.filename]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await startModelDownload(model, (p) => {
        setProgress(p);
      });
      setDownloaded(true);
      setDownloading(false);
      onStatusChange?.();
    } catch (e: any) {
      console.warn('Error descargando modelo:', e.message);
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    await deleteModelFile(model.filename);
    setDownloaded(false);
    setProgress({ fraction: 0, downloadedMB: 0, totalMB: model.sizeMB });
    onStatusChange?.();
  };

  const handleCancel = async () => {
    await cancelCurrentDownload();
    setDownloading(false);
    setProgress({ fraction: 0, downloadedMB: 0, totalMB: model.sizeMB });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{model.name}</Text>
            {model.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>RECOMENDADO</Text>
              </View>
            )}
          </View>
          <Text style={styles.description}>{model.description}</Text>
        </View>

        <View style={styles.statusIndicator}>
          {downloaded ? (
            <View style={styles.badgeSuccess}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.accentPrimary} />
              <Text style={styles.badgeSuccessText}>Instalado</Text>
            </View>
          ) : (
            <View style={styles.badgePending}>
              <Text style={styles.badgePendingText}>{model.sizeMB} MB</Text>
            </View>
          )}
        </View>
      </View>

      {downloading && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.round(progress.fraction * 100)}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressSubText}>
              {progress.downloadedMB} MB / {progress.totalMB} MB
            </Text>
            <Text style={styles.progressPercentText}>{Math.round(progress.fraction * 100)}%</Text>
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        {!downloaded && !downloading && (
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.8}>
            <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.downloadBtnText}>Descargar Modelo ({model.sizeMB} MB)</Text>
          </TouchableOpacity>
        )}

        {downloading && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={16} color={Colors.accentDanger} style={styles.btnIcon} />
            <Text style={styles.cancelBtnText}>Cancelar Descarga</Text>
          </TouchableOpacity>
        )}

        {downloaded && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={14} color={Colors.accentDanger} style={styles.btnIcon} />
            <Text style={styles.deleteBtnText}>Liberar Espacio ({model.sizeMB} MB)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleColumn: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accentPrimary,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  statusIndicator: {
    alignItems: 'flex-end',
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accentPrimary,
  },
  badgePending: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  progressSection: {
    marginTop: Spacing.md,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accentSecondary,
    borderRadius: Radius.full,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressSubText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentSecondary,
  },
  actionRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accentDanger,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  deleteBtnText: {
    fontSize: 11,
    color: Colors.accentDanger,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
});
