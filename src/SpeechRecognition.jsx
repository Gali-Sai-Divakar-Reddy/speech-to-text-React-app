import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SpeechRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [llmResponse, setLlmResponse] = useState('');
  const recognition = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();

    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.lang = 'en-US';

    recognition.current.onstart = () => {
      setIsListening(true);
    };

    recognition.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      setText(transcript);
    };

    recognition.current.onerror = (event) => {
      console.error("Error occurred in recognition: " + event.error);
    };

    recognition.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognition.current) {
        recognition.current.stop();
        recognition.current = null;
      }
    };
  }, []);

  const handleStart = () => {
    if (recognition.current && !isListening) {
      recognition.current.start();
    }
  };

  const handleStop = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
    }
    sendTextToLLM(text);
  };

  const sendTextToLLM = async (text) => {
    try {
      const response = await axios.post('http://localhost:5000/api/llm', { text });
      setLlmResponse(response.data.response);
      // Send LLM response to TTS
      sendTextToTTS(response.data.response);
    } catch (error) {
      console.error("Error sending text to LLM:", error);
    }
  };

  const sendTextToTTS = async (text) => {
    try {
      const response = await axios.post('http://localhost:5000/api/tts', { text }, { responseType: 'blob' });
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("Error sending text to TTS:", error);
    }
  };

  return (
    <div>
      <h1>Speech to Text Converter</h1>
      <textarea 
        value={text}
        rows="10"
        cols="100"
        readOnly
      />
      <br />
      <button onClick={handleStart} disabled={isListening}>Start Listening</button>
      <button onClick={handleStop} disabled={!isListening}>Stop Listening</button>
      <div>
        <h2>LLM Response:</h2>
        <p>{llmResponse}</p>
      </div>
    </div>
  );
};
export default SpeechRecognition;