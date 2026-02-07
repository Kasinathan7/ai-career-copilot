// file: frontend/src/utils/speechRecognition.js

let recognitionInstance = null;

export const isSpeechRecognitionSupported = () => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const createSpeechRecognizer = ({
  lang = 'en-US',
  continuous = true,
  interimResults = true,
  onStart,
  onEnd,
  onResult,
  onError
} = {}) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    throw new Error('Speech Recognition API not supported in this browser');
  }

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.onerror = (event) => {
    if (onError) onError(event);
  };

  recognition.onresult = (event) => {
    let finalText = '';
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript + ' ';
      } else {
        interimText += transcript + ' ';
      }
    }

    if (onResult) {
      onResult({
        finalText: finalText.trim(),
        interimText: interimText.trim()
      });
    }
  };

  recognitionInstance = recognition;
  return recognition;
};

export const startSpeechRecognition = () => {
  if (recognitionInstance) {
    try {
      recognitionInstance.start();
    } catch (err) {
      // Prevent "already started" crash
      console.warn('Speech recognition start ignored:', err.message);
    }
  }
};

export const stopSpeechRecognition = () => {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch (err) {
      console.warn('Speech recognition stop ignored:', err.message);
    }
  }
};

export const destroySpeechRecognition = () => {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {}
    recognitionInstance = null;
  }
};
