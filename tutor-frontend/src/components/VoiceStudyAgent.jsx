import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Mic, MicOff, Volume2, VolumeX, RefreshCw, Sparkles } from 'lucide-react';
import { showError } from '../utils/toast';

export default function VoiceStudyAgent() {
  const [status, setStatus] = useState('idle'); // idle, connecting, listening, processing, speaking, error
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const speakResponse = useCallback((text, type) => {
    if (isMuted || !text) {
      setStatus('idle');
      return;
    }
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    setTimeout(() => {
      setStatus('speaking');
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = synthRef.current.getVoices();
      // Try to find a natural sounding English voice
      const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.includes('en')) 
                            || voices.find(v => v.lang.includes('en'))
                            || voices[0];
                            
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 1.0; 
      utterance.pitch = type === 'off_topic' ? 0.9 : 1.1; 
      
      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => setStatus('idle');
      utterance.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        setStatus('idle');
      };

      // FIX: Attach to window object so Chrome garbage collector does not abruptly kill the voice mid-sentence
      window.currentUtterance = utterance;
      synthRef.current.speak(utterance);
    }, 100);
  }, [isMuted]);

  const processVoiceDoubt = useCallback(async (text) => {
    setStatus('processing');
    try {
      const res = await axios.post('http://localhost:8000/api/voice-doubt-assistant/', { message: text });
      
      if (res.data.type === 'off_topic') {
        setAssistantReply("Off-topic politely rejected.");
        speakResponse(res.data.response, 'off_topic');
      } else {
        setAssistantReply(res.data.response);
        speakResponse(res.data.response, res.data.type);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      showError("Failed to reach voice agent service.");
      speakResponse("Sorry, I am having trouble connecting to my academic brain right now.", 'error');
    }
  }, [speakResponse]);

  useEffect(() => {
    let recog = null;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechReg = window.SpeechRecognition || window.webkitSpeechRecognition;
      recog = new SpeechReg();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = 'en-IN';

      recog.onresult = (event) => {
        let finalTrans = '';
        let interimTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        
        if (interimTrans) {
          setTranscript(prev => finalTrans ? finalTrans + " " + interimTrans : interimTrans);
        }

        if (finalTrans) {
          setTranscript(finalTrans);
          processVoiceDoubt(finalTrans);
          // Stop recognition immediately once we have a final result to avoid background noise/loop
          recog.stop(); 
        }
      };

      recog.onstart = () => setStatus('listening');
      
      recog.onend = () => {
        setStatus(prev => prev === 'listening' ? 'idle' : prev);
      };

      recog.onerror = (event) => {
        // Aborted usually means they stopped it manually
        if (event.error !== 'aborted') {
          setStatus('error');
          showError('Voice recognition error: ' + event.error);
        } else {
          setStatus('idle');
        }
      };

      recognitionRef.current = recog;
    }
    
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recog) recog.abort();
    };
  }, [processVoiceDoubt]);

  const toggleListen = () => {
    if (status === 'listening') {
      recognitionRef.current?.abort();
      setStatus('idle');
    } else {
      synthRef.current.cancel(); 
      setTranscript('');
      setAssistantReply('');
      try { 
        recognitionRef.current.start(); 
        setStatus('connecting');
      } catch(e) {
        showError("Microphone error. Ensure you granted permissions.");
      }
    }
  };

  const resetConversation = () => {
    synthRef.current.cancel();
    recognitionRef.current?.abort();
    setStatus('idle');
    setTranscript('');
    setAssistantReply('');
  };

  const getStatusText = () => {
    switch(status) {
      case 'idle': return "Tap to start";
      case 'connecting': return "Connecting...";
      case 'listening': return "Listening...";
      case 'processing': return "Thinking...";
      case 'speaking': return "Speaking...";
      case 'error': return "Error. Try again.";
      default: return "Ready";
    }
  };

  const renderVisualizer = () => {
    if (status === 'listening') {
      return (
        <div style={{ display: 'flex', gap: '4px', height: '30px', alignItems: 'center', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="sound-wave" style={{ animationDelay: `${i * 0.1}s`, backgroundColor: '#ef4444', width: '4px', borderRadius: '4px' }}></div>
          ))}
        </div>
      );
    } else if (status === 'speaking') {
      return (
        <div style={{ display: 'flex', gap: '4px', height: '30px', alignItems: 'center', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="sound-wave" style={{ animationDelay: `${i * 0.15}s`, backgroundColor: 'var(--primary)', width: '6px', borderRadius: '4px' }}></div>
          ))}
        </div>
      );
    }
    return <div style={{ height: '30px' }}></div>;
  };

  return (
    <div className="card card-modern hover-lift" style={{ 
       display: 'flex', flexDirection: 'column', alignItems: 'center', 
       padding: '30px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '200px', height: '200px', borderRadius: '50%',
        background: status === 'listening' ? 'rgba(239, 68, 68, 0.1)' : status === 'speaking' ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
        filter: 'blur(40px)', transition: 'all 0.5s ease', zIndex: 0
      }} />

      <h3 style={{ marginBottom: '8px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={20} color="var(--primary)" /> AI Voice Study Agent
      </h3>
      <p className="small" style={{ opacity: 0.7, marginBottom: '30px', position: 'relative', zIndex: 1 }}>
        Tap the mic and talk about your academic questions.
      </p>

      <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
         <button 
           onClick={toggleListen}
           className={`mic-button ${status === 'listening' ? 'pulsing-red' : ''} ${status === 'speaking' ? 'pulsing-blue' : ''}`}
           style={{
             width: '80px', height: '80px', borderRadius: '50%', border: 'none',
             background: status === 'listening' ? '#ef4444' : status === 'speaking' ? 'var(--primary)' : 'var(--text-main)',
             color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
             cursor: 'pointer', outline: 'none', transition: 'all 0.3s ease',
             boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
           }}
           title={status === 'listening' ? 'Stop listening' : 'Start speaking'}
         >
           {status === 'listening' ? <Mic size={36} /> : <MicOff size={36} />}
         </button>
      </div>
      
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '10px', height: '20px', fontWeight: '600', color: 'var(--text-main)', opacity: 0.8 }}>
        {getStatusText()}
      </div>

      <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
        {renderVisualizer()}
      </div>

      {(transcript || assistantReply) && (
        <div style={{ 
          position: 'relative', zIndex: 1, background: '#f8fafc', padding: '16px', 
          borderRadius: '12px', width: '100%', fontSize: '0.85rem', textAlign: 'left',
          borderLeft: '3px solid var(--primary)', marginBottom: '20px'
        }}>
          {transcript && (
            <div style={{ marginBottom: assistantReply ? '10px' : '0' }}>
              <strong style={{ color: '#64748b' }}>You said: </strong> 
              <span style={{ color: 'var(--text-main)' }}>"{transcript}"</span>
            </div>
          )}
          {assistantReply && (
            <div style={{ marginTop: '10px' }}>
              <strong style={{ color: 'var(--primary)' }}>Assistant understood: </strong> 
              <span style={{ color: 'var(--text-main)' }}>{assistantReply}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '15px', marginTop: 'auto' }}>
         <button onClick={() => setIsMuted(!isMuted)} className="btn btn-outline-modern" style={{ padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.8rem' }}>
           {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />} {isMuted ? 'Unmute' : 'Mute Voice'}
         </button>
         <button onClick={resetConversation} className="btn btn-outline-modern" style={{ padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', borderColor: '#ef4444', color: '#ef4444', fontSize: '0.8rem' }}>
           <RefreshCw size={16} /> Reset
         </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes soundWave { 0% { height: 4px; } 50% { height: 25px; } 100% { height: 4px; } }
        .sound-wave { animation: soundWave 0.5s ease-in-out infinite; }
        .pulsing-red { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); animation: pulse-red 1.5s infinite running; }
        @keyframes pulse-red { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        .pulsing-blue { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); animation: pulse-blue 1.5s infinite running; }
        @keyframes pulse-blue { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(79, 70, 229, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); } }
      `}} />
    </div>
  );
}
