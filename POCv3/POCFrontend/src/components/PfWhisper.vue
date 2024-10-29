<template>
	<!-- <div>
		<form @submit.prevent="handleFileUpload">
			<input type="file" accept=".mp3" />
			<button type="submit">Upload</button>
		</form>
	</div> -->
	<!-- <video ref="audio-sample" controls width="250">
		<source src="/public/test.mp4" type="video/mp4" />
	</video> -->

	<div>
    <!-- Audio Player -->
    <audio ref="audioPlayer" controls @timeupdate="updateTranscription">
      <source src="/public/test.mp3" type="audio/mp3" /> <!-- Replace with your audio file path -->
      Your browser does not support the audio element.
    </audio>

    <!-- Transcription Display -->
    <div class="transcription">
      <span v-if="currentSubtitle">{{ currentSubtitle }}</span>
    </div>
  </div>
	<div>
		<button @click="startRecord">Start Voice Recording</button>
		<button @click="endRecord">End Voice Recording</button>
		<button @click="reset">Reset</button>
	</div>
	<div>
		<p>CC: {{ finalSentence }}</p>
	</div>
</template>

<script setup>
import { ref, useTemplateRef, onMounted } from 'vue'

const transcriptionData = ref([
	{ text: "Hello and welcome.", start: 0.0, end: 2.5 },
	{ text: "This is a transcription example.", start: 2.5, end: 5.0 },
	{ text: "Enjoy watching!", start: 5.0, end: 7.5 }
]);

const audioPlayer = ref(null);
const currentSubtitle = ref('');

const withUnconfirmedSentence = ref([])
const confirmedSentence = ref([])
const finalSentence = ref('')
const data = ref({})

const audioSample = useTemplateRef('audio-sample')

const extractConfirmedSentence = (sentence1, sentence2) => {
	const words1 = sentence1.split(' ')
	const words2 = sentence2.split(' ')
	
	const confirmedWords = []
	
	for (let i = 0; i < Math.max(words2.length, words1.length); i++) {
		const word1 = words1[i]
		const word2 = words2[i]
		
		if (word1 && word2 && (word1.toLocaleLowerCase() === word2.toLocaleLowerCase())) {
			confirmedWords.push(word1)
		} else {
			break 
		}
	}
	
	return confirmedWords.join(' ')
}

const mediaRecorder = ref(null)
const audioChunks = ref([])

// Update current subtitle based on audio's current time
const updateTranscription = () => {
	const currentTime = audioPlayer.value.currentTime
	
	// Find the current subtitle based on timestamp
	const subtitle = transcriptionData.value.find(
		segment => currentTime >= segment.start && currentTime <= segment.end
	)

	// Update currentSubtitle only if it's different from the previous value
	if (subtitle && currentSubtitle.value !== subtitle.text) {
		currentSubtitle.value = subtitle.text
	}
}

// const handleFileUpload = (event) => {
// 	if (event.target[0].files.length < 1) {
// 		console.log('No file uploaded')
// 		return
// 	}
// 	const file = event.target[0].files[0]
// 	const chunkDuration = 3 // duration of each chunk in seconds
// 	const bitrateKbps = 128 // Example bitrate replace with actual bitrate retrieval
// 	const bytesPerSecond = (bitrateKbps * 1000) / 8
// 	const chunkSize = bytesPerSecond * chunkDuration
// 	const totalChunks = Math.ceil(file.size / chunkSize)
// 	let currentChunk = 0
// 	let intervalId = undefined

// 	if (file && ['audio/mp3', 'audio/mpeg'].includes(file.type)) {
// 		const readNextChunk = () => {
// 			const start = currentChunk * chunkSize
// 			const end = Math.min(start + chunkSize, file.size)
// 			const chunk = file.slice(0, end)
// 			const reader = new FileReader()

// 			reader.onload = (e) => {
// 				const audioBlob = new Blob([e.target.result], { type: 'audio/mp3' })
// 				transcribeAudio(audioBlob)

// 				currentChunk++
// 				if (currentChunk < totalChunks) {
// 					intervalId = setInterval(() => {
// 						readNextChunk()
// 					}, 500)
// 				} else {
// 					clearInterval(intervalId)
// 					console.log("File upload complete.")
// 				}
// 			}

// 			reader.readAsArrayBuffer(chunk)
// 		}

// 		readNextChunk()
// 		audioSample.value?.play()
// 	} else {
// 		console.log("Please upload a valid MP3 file.")
// 	}
// }

const startRecord = async () => {
	navigator.mediaDevices
	.getUserMedia({ audio: true })
	.then((stream) => {		
		mediaRecorder.value = new MediaRecorder(stream)
		mediaRecorder.value.ondataavailable = (event) => {
			audioChunks.value.push(event.data)
			transcribeAudioChunk()
		}
		mediaRecorder.value.start(500)
	})
	.catch((error) => {
		console.log("Error accessing microphone:", error)
	})
}

const endRecord = async () => {
	if (mediaRecorder.value) {
		console.log('stop recording')
		mediaRecorder.value.stop()
	}
}

const reset = () => {
	withUnconfirmedSentence.value = []
	confirmedSentence.value = []
	audioChunks.value = []
	mediaRecorder.value.stop()
	finalSentence.value = ''
}

const transcribeAudioChunk = () => {
	const audioBlob = new Blob(audioChunks.value, {
		type: "audio/webm",
	})
	
	if (confirmedSentence.value.length > 0) {
		// const lastConfirmedSentence = confirmedSentence.value[confirmedSentence.value.length - 1].join(' ');
		
		// if (localAgreement(lastConfirmedSentence, finalSentence.value, 2)) {
		
		const timestamps = data.value.words 
		const endTs = Math.floor(Math.round((timestamps[timestamps.length - 1].end) * 100) / 100)
		const chunk = audioBlob.slice(endTs)
		transcribeAudio(chunk)
		// } 
	}
	transcribeAudio(audioBlob)
}

const transcribeAudio = async (audioBlob) => {
	try {
		// Convert Blob to File
		const audioFile = new File([audioBlob], "recording.webm", {
			type: "audio/webm",
		})
		const formData = new FormData()
		formData.append('audio', audioFile)
		formData.append('previous_token', finalSentence.value)
		
		const res = await fetch('http://127.0.0.1:3000/transcribe', {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With'
			},
			method: 'POST',
			body: formData
		})
		const result = await res.json()
		data.value = result
		const parsed = result.text
		const sentence1 = finalSentence.value
		const sentence2 = parsed
		
		confirmedSentence.value.push(...extractConfirmedSentence(sentence1, sentence2).split(' '))
		const spliceSentence2 = sentence2.split(' ')
		const unconfirmedSentence = spliceSentence2.slice(confirmedSentence.value.length, sentence2.length)
		withUnconfirmedSentence.value = confirmedSentence.value
		withUnconfirmedSentence.value.push(...unconfirmedSentence)
		const withoutWhitespace = withUnconfirmedSentence.value.filter(sentence => sentence != '')
		withUnconfirmedSentence.value.splice(0, withUnconfirmedSentence.value.length, ...withoutWhitespace)
		finalSentence.value = parsed
		
	} catch (error) {
		console.log("Error transcribing audio:", error)
	}
}
</script>

<style scoped>
div {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	margin-bottom: 1rem;
}
.transcription {
	font-size: 1.2em;
	color: #333;
	margin-top: 10px;
	background-color: rgba(0, 0, 0, 0.8);
	color: white;
	padding: 10px;
	width: 100%;
	max-width: 600px;
}
.highlight {
	color: yellow;
	font-weight: bold;
}
</style>
