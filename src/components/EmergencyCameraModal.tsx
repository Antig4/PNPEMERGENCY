import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  X,
  Camera,
  Video,
  Zap,
  ZapOff,
  Moon,
  Sun,
  HelpCircle,
  RefreshCw,
  Sliders,
  Check,
  RotateCcw,
  Play,
  Pause,
  ShieldAlert,
  MapPin,
  FileCheck,
  Plus,
} from 'lucide-react-native';
import { LocationCoordinates } from '../types/location';

export type CameraMode = 'PHOTO' | 'VIDEO' | 'EVIDENCE';
export type FlashMode = 'OFF' | 'ON' | 'AUTO';
export type ZoomLevel = '0.5x' | '1x' | '2x' | '3x';

export interface CapturedEvidenceItem {
  id: string;
  type: 'photo' | 'video';
  uri: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

interface EmergencyCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmEvidence: (items: CapturedEvidenceItem[]) => void;
  location?: LocationCoordinates | null;
  initialMode?: CameraMode;
  existingEvidence?: CapturedEvidenceItem[];
}

export const EmergencyCameraModal: React.FC<EmergencyCameraModalProps> = ({
  visible,
  onClose,
  onConfirmEvidence,
  location,
  initialMode = 'PHOTO',
  existingEvidence = [],
}) => {
  const [activeMode, setActiveMode] = useState<CameraMode>(initialMode);
  const [flashMode, setFlashMode] = useState<FlashMode>('OFF');
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('1x');

  // Permissions & Stream State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<any>(null);

  // Captured items buffer
  const [capturedItems, setCapturedItems] = useState<CapturedEvidenceItem[]>(existingEvidence);
  const [currentPreview, setCurrentPreview] = useState<CapturedEvidenceItem | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // HTML5 Media Elements Refs (Web support)
  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunksRef = useRef<any[]>([]);

  useEffect(() => {
    if (visible) {
      setCapturedItems(existingEvidence);
      initCameraStream();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [visible, facingMode]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const initCameraStream = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        stopCameraStream();
        setPermissionError(null);
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasPermission(true);
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setHasPermission(false);
        setPermissionError(
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. PNP EmergencyLink requires camera permission to capture evidence.'
            : 'Unable to access camera device on your browser.'
        );
      }
    } else {
      // Fallback for native/simulated
      setHasPermission(true);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: any) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCameraSwitch = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleFlash = () => {
    setFlashMode((prev) => {
      if (prev === 'OFF') return 'ON';
      if (prev === 'ON') return 'AUTO';
      return 'OFF';
    });
  };

  const handleCapturePhoto = () => {
    let photoUri = '';
    if (Platform.OS === 'web' && videoRef.current) {
      const videoEl = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 1280;
      canvas.height = videoEl.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Apply night mode brightness boost if active
        if (isNightMode) {
          ctx.filter = 'brightness(1.4) contrast(1.2)';
        }
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        photoUri = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!photoUri) {
      // Fallback placeholder photo URI for simulation environment
      photoUri = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';
    }

    const newItem: CapturedEvidenceItem = {
      id: `EV-${Date.now()}`,
      type: 'photo',
      uri: photoUri,
      timestamp: new Date().toLocaleTimeString(),
      latitude: location?.latitude || 8.9475,
      longitude: location?.longitude || 125.5406,
      accuracy: location?.accuracy || 8,
    };

    setCurrentPreview(newItem);
  };

  const handleStartRecording = () => {
    if (Platform.OS === 'web' && streamRef.current && typeof MediaRecorder !== 'undefined') {
      try {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const videoUri = URL.createObjectURL(blob);
          const newItem: CapturedEvidenceItem = {
            id: `EV-${Date.now()}`,
            type: 'video',
            uri: videoUri,
            timestamp: new Date().toLocaleTimeString(),
            latitude: location?.latitude || 8.9475,
            longitude: location?.longitude || 125.5406,
            accuracy: location?.accuracy || 8,
          };
          setCurrentPreview(newItem);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (e) {
        console.warn('MediaRecorder error:', e);
        fallbackSimulatedVideoRecording();
      }
    } else {
      fallbackSimulatedVideoRecording();
    }
  };

  const fallbackSimulatedVideoRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(false);
      // Simulated video sample fallback
      const newItem: CapturedEvidenceItem = {
        id: `EV-${Date.now()}`,
        type: 'video',
        uri: 'https://assets.mixkit.co/videos/preview/mixkit-police-car-lights-flashing-at-night-42232-large.mp4',
        timestamp: new Date().toLocaleTimeString(),
        latitude: location?.latitude || 8.9475,
        longitude: location?.longitude || 125.5406,
        accuracy: location?.accuracy || 8,
      };
      setCurrentPreview(newItem);
    }
  };

  const handleAcceptPreview = () => {
    if (currentPreview) {
      setCapturedItems((prev) => [...prev, currentPreview]);
      setCurrentPreview(null);
      setActiveMode('EVIDENCE');
    }
  };

  const handleRetakePreview = () => {
    setCurrentPreview(null);
  };

  const handleRemoveEvidenceItem = (id: string) => {
    setCapturedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFinishEvidence = () => {
    if (capturedItems.length === 0) {
      Alert.alert(
        'Evidence Required',
        'Please capture at least one photo or video before confirming evidence for your report.'
      );
      return;
    }
    onConfirmEvidence(capturedItems);
    onClose();
  };

  const handleCloseAttempt = () => {
    if (capturedItems.length > 0) {
      Alert.alert(
        'Exit Evidence Capture?',
        'You have captured evidence that has not been confirmed yet. Exit camera?',
        [
          { text: 'Continue Capturing', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              stopCameraStream();
              onClose();
            },
          },
        ]
      );
    } else {
      stopCameraStream();
      onClose();
    }
  };

  const getZoomScale = () => {
    switch (zoomLevel) {
      case '0.5x':
        return 0.75;
      case '2x':
        return 1.4;
      case '3x':
        return 1.8;
      default:
        return 1.0;
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={handleCloseAttempt}>
      <View style={styles.fullScreenContainer}>
        {/* Live Camera Viewport */}
        <View style={styles.viewport}>
          {Platform.OS === 'web' ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000000',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${getZoomScale()}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}`,
                  transition: 'transform 0.3s ease',
                  filter: isNightMode ? 'brightness(1.5) contrast(1.3) hue-rotate(-20deg)' : 'none',
                }}
              />
            </div>
          ) : (
            <View style={styles.simulatedCameraFeed}>
              <Camera color="#334155" size={64} />
              <Text style={styles.simulatedFeedText}>EMERGENCY CAMERA STREAM ACTIVE</Text>
            </View>
          )}

          {/* Flash Indicator Overlay */}
          {flashMode !== 'OFF' && (
            <View style={styles.flashBadge}>
              <Zap color="#FACC15" size={14} />
              <Text style={styles.flashBadgeText}>FLASH {flashMode}</Text>
            </View>
          )}

          {/* Night Mode Green Tint Filter */}
          {isNightMode && <View style={styles.nightVisionOverlay} pointerEvents="none" />}

          {/* Video Recording Live Banner */}
          {isRecording && (
            <View style={styles.recordingBanner}>
              <View style={styles.redDot} />
              <Text style={styles.recordingText}>● REC {formatTimer(recordingSeconds)}</Text>
            </View>
          )}

          {/* Captured Item Preview Screen */}
          {currentPreview && (
            <View style={styles.previewContainer}>
              {currentPreview.type === 'photo' ? (
                <Image source={{ uri: currentPreview.uri }} style={styles.fullPreviewMedia} resizeMode="contain" />
              ) : Platform.OS === 'web' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video src={currentPreview.uri} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80%' }} />
                </div>
              ) : (
                <View style={styles.videoPreviewFallback}>
                  <Video color="#FACC15" size={48} />
                  <Text style={styles.videoPreviewText}>Recorded Video Ready</Text>
                </View>
              )}

              {/* Preview Info & Action Footer */}
              <View style={styles.previewFooterCard}>
                <View style={styles.previewMetaRow}>
                  <ShieldAlert color="#FACC15" size={16} />
                  <Text style={styles.previewMetaTitle}>EVIDENCE CAPTURED</Text>
                </View>
                <Text style={styles.previewMetaText}>
                  {currentPreview.type.toUpperCase()} • {currentPreview.timestamp} • Lat: {currentPreview.latitude?.toFixed(4)}, Lng: {currentPreview.longitude?.toFixed(4)}
                </Text>

                <View style={styles.previewBtnRow}>
                  <TouchableOpacity style={styles.btnRetake} onPress={handleRetakePreview}>
                    <RotateCcw color="#FFFFFF" size={18} />
                    <Text style={styles.btnRetakeText}>RETAKE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnUseMedia} onPress={handleAcceptPreview}>
                    <Check color="#000000" size={20} strokeWidth={3} />
                    <Text style={styles.btnUseMediaText}>
                      USE {currentPreview.type === 'photo' ? 'PHOTO' : 'VIDEO'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Camera Permission Denied Fallback */}
          {hasPermission === false && (
            <View style={styles.permissionErrorOverlay}>
              <ShieldAlert color="#EF4444" size={48} />
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionMsg}>
                {permissionError ||
                  'PNP EmergencyLink needs camera access so you can capture photo or video evidence for emergency response.'}
              </Text>
              <TouchableOpacity style={styles.permissionRetryBtn} onPress={initCameraStream}>
                <Text style={styles.permissionRetryText}>TRY AGAIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.permissionCancelBtn} onPress={handleCloseAttempt}>
                <Text style={styles.permissionCancelText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Top Header Controls (Left, Center, Right) */}
        <View style={styles.topHeaderBar}>
          <View style={styles.headerGroupLeft}>
            {/* Flash Toggle */}
            <TouchableOpacity style={styles.iconCircleBtn} onPress={toggleFlash}>
              {flashMode === 'OFF' ? (
                <ZapOff color="#FFFFFF" size={20} />
              ) : (
                <Zap color="#FACC15" size={20} />
              )}
            </TouchableOpacity>

            {/* Utility / Grid Toggle */}
            <TouchableOpacity style={styles.iconCircleBtn} onPress={toggleCameraSwitch}>
              <RefreshCw color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>

          {/* Center: Night Mode / Low-Light Toggle */}
          <TouchableOpacity
            style={[styles.nightModeBtn, isNightMode && styles.nightModeBtnActive]}
            onPress={() => setIsNightMode(!isNightMode)}
          >
            {isNightMode ? <Sun color="#FACC15" size={16} /> : <Moon color="#FFFFFF" size={16} />}
            <Text style={[styles.nightModeText, isNightMode && styles.nightModeTextActive]}>
              {isNightMode ? 'NIGHT ON' : 'NIGHT MODE'}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerGroupRight}>
            {/* Help / Info Button */}
            <TouchableOpacity style={styles.iconCircleBtn} onPress={() => setShowHelpModal(true)}>
              <HelpCircle color="#FFFFFF" size={20} />
            </TouchableOpacity>

            {/* Exit Camera Button */}
            <TouchableOpacity style={styles.exitCircleBtn} onPress={handleCloseAttempt}>
              <X color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Zoom Selector Bar (0.5x, 1x, 2x, 3x) */}
        {!currentPreview && (
          <View style={styles.zoomSelectorBar}>
            {(['0.5x', '1x', '2x', '3x'] as ZoomLevel[]).map((z) => (
              <TouchableOpacity
                key={z}
                style={[styles.zoomPill, zoomLevel === z && styles.zoomPillSelected]}
                onPress={() => setZoomLevel(z)}
              >
                <Text style={[styles.zoomText, zoomLevel === z && styles.zoomTextSelected]}>{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Mode Selector & Controls Bar */}
        {!currentPreview && (
          <View style={styles.bottomControlsArea}>
            {/* Camera Modes Selector (PHOTO | VIDEO | EVIDENCE) */}
            <View style={styles.modesRow}>
              <TouchableOpacity
                style={[styles.modeTab, activeMode === 'PHOTO' && styles.modeTabActive]}
                onPress={() => setActiveMode('PHOTO')}
              >
                <Text style={[styles.modeLabel, activeMode === 'PHOTO' && styles.modeLabelActive]}>PHOTO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, activeMode === 'VIDEO' && styles.modeTabActive]}
                onPress={() => setActiveMode('VIDEO')}
              >
                <Text style={[styles.modeLabel, activeMode === 'VIDEO' && styles.modeLabelActive]}>VIDEO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, activeMode === 'EVIDENCE' && styles.modeTabActive]}
                onPress={() => setActiveMode('EVIDENCE')}
              >
                <Text style={[styles.modeLabel, activeMode === 'EVIDENCE' && styles.modeLabelActive]}>
                  EVIDENCE ({capturedItems.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode Specific Shutter / Action Controls */}
            <View style={styles.shutterActionContainer}>
              {activeMode === 'PHOTO' && (
                <TouchableOpacity style={styles.shutterBtnOuter} onPress={handleCapturePhoto}>
                  <View style={styles.shutterBtnInnerPhoto} />
                </TouchableOpacity>
              )}

              {activeMode === 'VIDEO' && (
                <TouchableOpacity
                  style={[styles.shutterBtnOuter, isRecording && styles.shutterBtnRecording]}
                  onPress={isRecording ? handleStopRecording : handleStartRecording}
                >
                  {isRecording ? (
                    <View style={styles.stopRecordingSquare} />
                  ) : (
                    <View style={styles.shutterBtnInnerVideo} />
                  )}
                </TouchableOpacity>
              )}

              {activeMode === 'EVIDENCE' && (
                <View style={styles.evidenceControlPanel}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceThumbsScroll}>
                    {capturedItems.map((item, idx) => (
                      <View key={item.id} style={styles.evidenceThumbCard}>
                        {item.type === 'photo' ? (
                          <Image source={{ uri: item.uri }} style={styles.thumbImg} />
                        ) : (
                          <View style={styles.thumbVideoIconBox}>
                            <Video color="#FACC15" size={20} />
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.thumbDeleteBadge}
                          onPress={() => handleRemoveEvidenceItem(item.id)}
                        >
                          <X color="#FFFFFF" size={10} />
                        </TouchableOpacity>
                        <Text style={styles.thumbLabel}>#{idx + 1} {item.type}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.evidenceActionBtnsRow}>
                    <TouchableOpacity
                      style={styles.btnAddMoreEvidence}
                      onPress={() => setActiveMode('PHOTO')}
                    >
                      <Plus color="#FFFFFF" size={16} />
                      <Text style={styles.btnAddMoreText}>CAPTURE MORE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnConfirmEvidence, capturedItems.length === 0 && styles.btnConfirmDisabled]}
                      onPress={handleFinishEvidence}
                      disabled={capturedItems.length === 0}
                    >
                      <FileCheck color="#000000" size={18} />
                      <Text style={styles.btnConfirmText}>
                        CONFIRM ({capturedItems.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Help & Guidelines Modal */}
        {showHelpModal && (
          <View style={styles.helpModalOverlay}>
            <View style={styles.helpCard}>
              <View style={styles.helpHeader}>
                <ShieldAlert color="#FACC15" size={22} />
                <Text style={styles.helpTitle}>Evidence Capture Guidelines</Text>
              </View>
              <Text style={styles.helpText}>
                • Capture clear photos or short videos of the scene, suspect details, vehicles, or damage.
              </Text>
              <Text style={styles.helpText}>
                • Enable <Text style={{ color: '#FACC15' }}>NIGHT MODE</Text> if capturing evidence in dim or nighttime conditions.
              </Text>
              <Text style={styles.helpText}>
                • GPS coordinates are attached automatically to each captured evidence file for BCPO Command Center verification.
              </Text>
              <TouchableOpacity style={styles.helpCloseBtn} onPress={() => setShowHelpModal(false)}>
                <Text style={styles.helpCloseText}>GOT IT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  viewport: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  simulatedCameraFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  simulatedFeedText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  flashBadge: {
    position: 'absolute',
    top: 80,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  flashBadgeText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '900',
  },
  nightVisionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  recordingBanner: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  fullPreviewMedia: {
    width: '100%',
    height: '100%',
  },
  videoPreviewFallback: {
    alignItems: 'center',
    gap: 10,
  },
  videoPreviewText: {
    color: '#FACC15',
    fontSize: 16,
    fontWeight: '800',
  },
  previewFooterCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    gap: 10,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewMetaTitle: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  previewMetaText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  previewBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnRetake: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnRetakeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  btnUseMedia: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnUseMediaText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  permissionErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  permissionMsg: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionRetryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionRetryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  permissionCancelBtn: {
    paddingVertical: 8,
  },
  permissionCancelText: {
    color: '#64748B',
    fontSize: 12,
  },
  topHeaderBar: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  headerGroupLeft: {
    flexDirection: 'row',
    gap: 10,
  },
  headerGroupRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  exitCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nightModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  nightModeBtnActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: '#FACC15',
  },
  nightModeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  nightModeTextActive: {
    color: '#FACC15',
  },
  zoomSelectorBar: {
    position: 'absolute',
    bottom: 150,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    zIndex: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoomPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  zoomPillSelected: {
    backgroundColor: '#FACC15',
  },
  zoomText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  zoomTextSelected: {
    color: '#000000',
    fontWeight: '900',
  },
  bottomControlsArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingBottom: 30,
    paddingTop: 14,
    zIndex: 40,
  },
  modesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  modeTab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FACC15',
  },
  modeLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modeLabelActive: {
    color: '#FACC15',
    fontWeight: '900',
  },
  shutterActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  shutterBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterBtnRecording: {
    borderColor: '#EF4444',
  },
  shutterBtnInnerPhoto: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
  },
  shutterBtnInnerVideo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EF4444',
  },
  stopRecordingSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  evidenceControlPanel: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 12,
  },
  evidenceThumbsScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  evidenceThumbCard: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbVideoIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDeleteBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 2,
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 3,
    borderRadius: 4,
  },
  evidenceActionBtnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnAddMoreEvidence: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  btnAddMoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  btnConfirmEvidence: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  btnConfirmDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  btnConfirmText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  helpModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 60,
  },
  helpCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    gap: 12,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  helpText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  helpCloseBtn: {
    backgroundColor: '#FACC15',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  helpCloseText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
  },
});
