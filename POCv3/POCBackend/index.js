import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import url from 'url'
import { OpenAIClient } from "@langchain/openai"

dotenv.config()

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage })

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    console.log('No file uploaded')
    res.send('')
  } else {
    try {
      const model = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY })

      const __filename = url.fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)

      const filePath = path.join(__dirname, 'uploads', req.file.filename)

      const transcription = await model.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        prompt: 'req.body.previous_token',
        language: 'en',
        response_format: 'verbose_json',
        timestamp_granularities: ['word', 'segment']
      });

      res.json(transcription)
    } catch(err) {
      console.log('error file: ', err)
      res.send('')
    }
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})