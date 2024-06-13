import React, { useState, useEffect, useRef } from 'react';

const SpeechRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
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
      recognition.current = null;
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
    </div>
  );
};

export default SpeechRecognition;

