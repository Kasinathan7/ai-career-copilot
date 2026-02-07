import * as faceapi from 'face-api.js'

let intervalId = null
let analyzing = false
let modelsLoaded = false

let totalFrames = 0
let faceFrames = 0

let metrics = {
  confidence: 0,
  eyeContact: 0,
  smile: 0,
  neutral: 0,
  nervous: 0,
  happy: 0,
  sad: 0,
  angry: 0,
  surprised: 0
}

const emptyMetrics = {
  confidence: 0,
  eyeContact: 0,
  smile: 0,
  neutral: 0,
  nervous: 0,
  happy: 0,
  sad: 0,
  angry: 0,
  surprised: 0
}

export async function loadFaceModels() {
  const MODEL_URL = '/models'

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)
  ])

  modelsLoaded = true
  console.log('Face models loaded correctly from flat /models directory')
}

export function startFaceAnalysis(video) {
  if (!modelsLoaded || !video) return

  stopFaceAnalysis()
  analyzing = true

  intervalId = setInterval(async () => {
    if (!analyzing) return

    totalFrames++

    try {
      if (!faceapi.nets.faceLandmark68TinyNet.isLoaded) return

      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.4
          })
        )
        .withFaceLandmarks(true)
        .withFaceExpressions()

      if (!detection) return

      faceFrames++

      const e = detection.expressions || {}

      metrics.smile += e.happy || 0
      metrics.happy += e.happy || 0
      metrics.sad += e.sad || 0
      metrics.angry += e.angry || 0
      metrics.surprised += e.surprised || 0
      metrics.neutral += e.neutral || 0
      metrics.nervous += (e.fearful || 0) + (e.disgusted || 0)

      if (e.neutral > 0.6 || e.happy > 0.4) {
  metrics.eyeContact += 1;
}

      metrics.confidence += (e.happy || 0) * 0.6 + (e.neutral || 0) * 0.4;


    } catch (err) {
      console.warn('Face analysis error:', err.message)
    }

  }, 150)
}

export function stopFaceAnalysis() {
  analyzing = false
  if (intervalId) clearInterval(intervalId)
  intervalId = null
}

export function resetFaceMetrics() {
  totalFrames = 0
  faceFrames = 0

  Object.keys(metrics).forEach(k => {
    metrics[k] = 0
  })
}

export function getFaceMetrics() {
  console.log('Total frames:', totalFrames, 'Face frames:', faceFrames)

  // If no face was ever detected → return zeros safely
  if (faceFrames === 0) {
    console.warn('No face detected during session')
    return { ...emptyMetrics }
  }

  const result = {}

  Object.keys(metrics).forEach(k => {
    result[k] = Number((metrics[k] / faceFrames).toFixed(3))
  })

  return result
}
