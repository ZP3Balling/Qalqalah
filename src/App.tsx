import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, RotateCcw, Award, Volume2, CheckCircle, Loader2, Download, AlertCircle } from 'lucide-react';

interface QariMatch {
  name: string;
  similarity: number;
  country: string;
  audioUrl: string;
  description: string;
}

interface AudioVisualizerProps {
  isRecording: boolean;
  audioLevel: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isRecording, audioLevel }) => {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const height = isRecording
      ? Math.max(10, audioLevel * 100 + (i % 5) * 2) // smoother gradient between bars
      : 10;
    return (
      <div
        key={i}
        className={`bg-emerald-500 rounded-md transition-all duration-150`}
        style={{
          width: '6px',
          height: `${height}px`,
        }}
      />
    );
  });

  return (
    <div className="flex items-end justify-center space-x-1 h-24 mt-4">
      {bars}
    </div>
  );
};


const QariCard: React.FC<{ qari: QariMatch; rank: number }> = ({ qari, rank }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rankColors = {
    1: 'from-yellow-400 to-yellow-600',
    2: 'from-gray-300 to-gray-500',
    3: 'from-amber-600 to-amber-800'
  };

  // Sample Surah Al-Fatiha recitation URLs (these would be replaced with actual Qari recitations)
  const sampleAudioUrls = {
    "Sheikh Mishary Rashid Alafasy": "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
    "Sheikh Abdul Rahman As-Sudais": "https://file-examples.com/storage/fe68c8a7c4bb3b2b8e8140f/2017/11/file_example_MP3_700KB.mp3",
    "Sheikh Saad Al-Ghamdi": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
  };

  const handlePlay = async () => {
    if (isLoading) return;

    try {
      if (!audioRef.current) {
        setIsLoading(true);
        // Use sample URL based on Qari name, fallback to a working sample
        const audioUrl = sampleAudioUrls[qari.name as keyof typeof sampleAudioUrls] ||
          "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3";

        audioRef.current = new Audio(audioUrl);
        audioRef.current.crossOrigin = "anonymous";

        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
        });

        audioRef.current.addEventListener('error', (e) => {
          console.error('Error playing audio for', qari.name, e);
          setIsPlaying(false);
          setIsLoading(false);
          // Fallback: simulate playback for demo
          setIsPlaying(true);
          setTimeout(() => setIsPlaying(false), 10000);
        });

        audioRef.current.addEventListener('canplaythrough', () => {
          setIsLoading(false);
        });

        audioRef.current.addEventListener('loadstart', () => {
          setIsLoading(true);
        });
      }

      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
      // Fallback: simulate playback for demo
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 10000);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-[#014345] text-[#FFD700] rounded-xl shadow-lg p-6 border border-[#FFD700]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${rankColors[rank as keyof typeof rankColors]} flex items-center justify-center text-white font-bold text-sm`}>
            {rank}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{qari.name}</h3>
            <p className="text-sm text-gray-600">{qari.country}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">
            {Math.round(qari.similarity)}%
          </div>
          <div className="text-xs text-gray-500">Match</div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4">{qari.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${qari.similarity}%` }}
          />
        </div>
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
          <span className="text-sm font-medium">
            {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Listen'}
          </span>
        </button>
      </div>
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState<'record' | 'analyzing' | 'results'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [silentRecordingError, setSilentRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeLevelsRef = useRef<number[]>([]);

  const [matchResults, setMatchResults] = useState<QariMatch[]>([]);

  useEffect(() => {
    if (currentView === 'results' && recordedBlob) {
      const fetchResults = async () => {
        const formData = new FormData();
        formData.append('audio', recordedBlob);

        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setMatchResults(data);
        } else {
          console.error("Analysis failed");
        }
      };

      fetchResults();
    }
  }, [currentView, recordedBlob]);


  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      volumeLevelsRef.current = [];

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const normalizedLevel = average / 255;

          volumeLevelsRef.current.push(normalizedLevel);
          setAudioLevel(normalizedLevel);

          requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  const checkForSilentRecording = (): boolean => {
    const levels = volumeLevelsRef.current;
    if (!levels || levels.length === 0) return true;

    const averageLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

    const silentThreshold = 0.002;
    const silentSamples = levels.filter(level => level < silentThreshold).length;
    const silentPercentage = (silentSamples / levels.length) * 100;

    console.log("Average Level:", averageLevel);
    console.log("Silent Percentage:", silentPercentage);

    return averageLevel < 0.001 || silentPercentage > 95;
  };


  const startRecording = async () => {
    console.log("Recording button was clicked!");
    console.log("Start recording function triggered");
    try {
      setPermissionError(null);
      setSilentRecordingError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });



      const audioTrack = stream.getAudioTracks()[0];
      console.log("Track settings:", audioTrack.getSettings());
      console.log("Track readyState:", audioTrack.readyState); // should be 'live'
      console.log("Track enabled:", audioTrack.enabled); // should be true


      console.log("Stream active?", stream.active);

      const tracks = stream.getAudioTracks();
      console.log("Mic stream tracks:", tracks, "enabled?", tracks[0]?.enabled);

      // 🔊 Temporary: Listen to mic live (for debugging only)
      // const audioElement = new Audio();
      // audioElement.srcObject = stream;
      // audioElement.play();


      streamRef.current = stream;
      audioChunksRef.current = [];
      volumeLevelsRef.current = [];

      // Setup audio analysis for silence detection
      setupAudioAnalysis(stream);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Chunk size:", event.data.size);
          audioChunksRef.current.push(event.data);
        } else {
          console.warn("Received empty audio data chunk");
        }
      };



      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log("Blob inspection:", audioBlob);
        console.log("Final audio blob size:", audioBlob.size);

        if (audioBlob.size < 1000) {
          console.warn("Audio blob too small, likely silent or broken.");
        }

        setRecordedBlob(audioBlob);
        setHasRecording(true);

        const testAudio = new Audio(URL.createObjectURL(audioBlob));
        const audioURL = URL.createObjectURL(audioBlob);
        // You can use audioURL later for a play button

      };



      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer - runs until stopped or 2 minutes reached
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at exactly 2 minutes (120 seconds)
          if (newTime >= 120) {
            stopRecording();
            return 120;
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setPermissionError('Microphone access is required. Please check your browser settings and allow microphone access.');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotSupportedError') {
          setPermissionError('Your browser does not support audio recording. Please try a different browser.');
        } else if (error.name === 'NotReadableError') {
          setPermissionError('Microphone is being used by another application. Please close other apps and try again.');
        } else {
          setPermissionError('Microphone access is required. Please check your browser settings.');
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
  };

  const analyzeRecording = () => {
    if (!recordedBlob) {
      console.error('No recording available for analysis');
      return;
    }

    // Check for silent recording
    if (checkForSilentRecording()) {
      setSilentRecordingError('It looks like your recitation was silent or too quiet. Please try recording again and speak closer to the microphone.');
      return;
    }

    setSilentRecordingError(null);
    setCurrentView('analyzing');
    setAnalysisProgress(0);

    // Simulate analysis progress with proper capping at 100%
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const increment = Math.random() * 8 + 2;
        const newProgress = prev + increment;

        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => setCurrentView('results'), 500);
          return 100; // Cap at exactly 100%
        }
        return Math.min(newProgress, 100); // Ensure never exceeds 100%
      });
    }, 200);
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surah-fatiha-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetApp = () => {
    // Clean up any ongoing recording
    if (isRecording) {
      stopRecording();
    }

    setCurrentView('record');
    setIsRecording(false);
    setRecordingTime(0);
    setHasRecording(false);
    setAudioLevel(0);
    setAnalysisProgress(0);
    setPermissionError(null);
    setSilentRecordingError(null);
    setRecordedBlob(null);
    volumeLevelsRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#012B2D] text-[#FFD700]">
      {/* Header */}
      <div className="bg-[#014345] shadow-sm border-b border-[#B88A44]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="text-center">
              <h1 className="text-5xl font-extrabold text-[#B88A44] tracking-tight mb-2">
                Qalqalah
              </h1>
            </div>
            <p className="text-lg italic text-[#B88A44]/80">
              Echo Reciters Until <span className="font-semibold text-emerald-600">YOU</span> Become One.
            </p>
            <div className="mt-4 text-center">
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentView === 'record' && (
          <div className="bg-[#B88A44] rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Mic size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {isRecording ? 'Recording...' : 'Ready to Record'}
              </h2>

              {isRecording && (
                <div className="mb-6">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Maximum: 2:00 minutes
                  </div>
                  <AudioVisualizer isRecording={isRecording} audioLevel={audioLevel} />
                </div>
              )}
            </div>

            {permissionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{permissionError}</p>
                </div>
              </div>
            )}

            {silentRecordingError && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <p className="text-orange-700 text-sm">{silentRecordingError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4 mb-6">
              {!isRecording && !hasRecording && (
                <button
                  onClick={startRecording}
                  className="bg-white text-[#012B2D] hover:bg-gray-200"
                >
                  <Mic size={20} />
                  <span>Start Recording</span>
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                >
                  <Pause size={20} />
                  <span>Stop Recording</span>
                </button>
              )}

              {hasRecording && !isRecording && (
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={analyzeRecording}
                    className="bg-white text-[#012B2D] hover:bg-gray-200"
                  >
                    <CheckCircle size={20} />
                    <span>Analyze Recording</span>
                  </button>

                  <button
                    onClick={downloadRecording}
                    className="bg-white text-[#012B2D] hover:bg-gray-200"
                  >
                    <Download size={20} />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => {
                      setHasRecording(false);
                      setRecordedBlob(null);
                      setRecordingTime(0);
                      setSilentRecordingError(null);
                      volumeLevelsRef.current = [];
                    }}
                    className="bg-white text-[#012B2D] hover:bg-gray-200"
                  >
                    <RotateCcw size={20} />
                    <span>Record Again</span>
                  </button>

                  <button
                    onClick={() => {
                      if (recordedBlob) {
                        const playbackAudio = new Audio(URL.createObjectURL(recordedBlob));
                        playbackAudio.play();
                      }
                    }}
                    className="bg-white text-[#012B2D] hover:bg-gray-200"
                  >
                    <Play size={20} />
                    <span>Play Recording</span>
                  </button>
                </div>
              )}

            </div>

            {hasRecording && (
              <div className="text-center text-green-600 mb-4">
                <p className="text-sm font-medium">
                  ✓ Recording completed ({formatTime(recordingTime)})
                </p>
              </div>
            )}

            <div className="text-center text-gray-600">
              <p className="text-sm">
                💡 <strong>Tip:</strong> Find a quiet space and recite clearly for the best analysis results
              </p>
              <p className="text-xs mt-2 text-gray-500">
                Recording will automatically stop after 2 minutes
              </p>
            </div>
          </div>
        )}

        {currentView === 'analyzing' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Analyzing Your Recitation
            </h2>
            <p className="text-gray-600 mb-6">
              Comparing your voice with famous Qaris using advanced audio analysis...
            </p>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(analysisProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-[#FFD700] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(analysisProgress, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>🎵 Analyzing pitch and tone patterns...</p>
              <p>🎤 Processing vocal characteristics...</p>
              <p>📊 Comparing with Qari database...</p>
            </div>
          </div>
        )}

        {currentView === 'results' && (
          <div>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <Award size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Your Voice Analysis Results
              </h2>
              <p className="text-gray-600">
                Here are the top 3 Qaris whose recitation style matches yours
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {matchResults.map((qari, index) => (
                <QariCard key={qari.name} qari={qari} rank={index + 1} />
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={resetApp}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <RotateCcw size={20} />
                <span>Record Another Recitation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;