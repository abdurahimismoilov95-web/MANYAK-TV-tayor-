# 🎬 MANYAK TV - Encoder Service

FFmpeg-powered video encoding service with HLS streaming, thumbnail generation, and file upload handling.

## 📋 Features

- ✅ **FFmpeg Integration** - Video encoding and processing
- ✅ **HLS Streaming** - Multi-quality adaptive streaming
- ✅ **Bull Queue** - Background job processing with Redis
- ✅ **Thumbnail Generation** - Extract frames from videos
- ✅ **Image Optimization** - Sharp image processing
- ✅ **File Upload** - Multer file handling
- ✅ **Progress Tracking** - Real-time encoding progress
- ✅ **Multiple Qualities** - 1080p, 720p, 480p, 360p

## 🚀 Quick Start

### Prerequisites

1. **FFmpeg** - Must be installed on system
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows (Chocolatey)
choco install ffmpeg
```

2. **Redis** - For Bull Queue
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Windows (Docker)
docker run -d -p 6379:6379 redis
```

### Installation

```bash
cd apps/encoder
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
ENCODER_PORT=3002
UPLOAD_DIR=./uploads
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://user:password@localhost:5432/manyak_tv
```

### Generate Prisma Client

```bash
cd ../../packages/database
npx prisma generate
```

### Run Service

**Development:**
```bash
npm run start:dev
```

**Production:**
```bash
npm run build
npm run start:prod
```

## 📹 Video Encoding

### Upload & Encode Video

```bash
curl -X POST http://localhost:3002/upload/video \
  -F "video=@movie.mp4" \
  -F "contentId=123" \
  -F "qualities[]=720p" \
  -F "qualities[]=480p" \
  -F "qualities[]=360p"
```

Response:
```json
{
  "success": true,
  "filepath": "/uploads/videos/123_1234567890.mp4",
  "fileSize": 524288000,
  "duration": 7200,
  "job": {
    "jobId": "1",
    "status": "queued",
    "contentId": "123"
  }
}
```

### Check Job Status

```bash
curl http://localhost:3002/encoder/job/1
```

Response:
```json
{
  "jobId": "1",
  "state": "completed",
  "progress": 100,
  "data": {
    "contentId": "123",
    "inputPath": "/uploads/videos/123_1234567890.mp4",
    "outputDir": "/uploads/videos/123_1234567890_hls"
  },
  "finishedOn": 1234567890
}
```

### HLS Output Structure

After encoding, HLS files are organized:

```
uploads/videos/123_1234567890_hls/
├── master.m3u8              # Master playlist
├── 720p/
│   ├── playlist.m3u8
│   ├── segment_000.ts
│   ├── segment_001.ts
│   └── ...
├── 480p/
│   ├── playlist.m3u8
│   └── segments...
├── 360p/
│   ├── playlist.m3u8
│   └── segments...
├── thumbnail.jpg            # Video thumbnail
└── preview.mp4              # 30-second preview
```

## 🖼️ Thumbnail Generation

### Generate from Video

```bash
curl -X POST http://localhost:3002/encoder/thumbnail \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "/path/to/video.mp4",
    "outputPath": "/path/to/thumbnail.jpg",
    "timestamp": "00:00:10"
  }'
```

### Upload & Optimize Image

```bash
curl -X POST http://localhost:3002/upload/image \
  -F "image=@poster.jpg" \
  -F "contentId=123"
```

Response:
```json
{
  "success": true,
  "original": "/uploads/images/123_1234567890.jpg",
  "sizes": {
    "small": "/uploads/images/123_1234567890_sizes/thumbnail_small.jpg",
    "medium": "/uploads/images/123_1234567890_sizes/thumbnail_medium.jpg",
    "large": "/uploads/images/123_1234567890_sizes/thumbnail_large.jpg"
  }
}
```

## 🔌 API Endpoints

Base URL: `http://localhost:3002`

### Upload
```bash
POST /upload/video           # Upload video & start encoding
POST /upload/image           # Upload & optimize image
GET  /upload/stats           # Get disk usage stats
GET  /upload/health          # Health check
```

### Encoder
```bash
POST /encoder/encode         # Add video to encoding queue
POST /encoder/metadata       # Get video metadata
GET  /encoder/job/:id        # Get job status
POST /encoder/preview        # Generate preview clip
POST /encoder/extract-audio  # Extract audio track
GET  /encoder/health         # Health check
```

## 📦 Project Structure

```
apps/encoder/
├── src/
│   ├── encoder/             # FFmpeg encoding logic
│   │   ├── encoder.service.ts
│   │   ├── encoder.processor.ts
│   │   └── encoder.controller.ts
│   ├── upload/              # File upload handling
│   │   ├── upload.service.ts
│   │   └── upload.controller.ts
│   ├── thumbnail/           # Thumbnail generation
│   │   └── thumbnail.service.ts
│   ├── prisma/              # Database service
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## 🎯 Video Quality Presets

| Quality | Resolution | Video Bitrate | Audio Bitrate |
|---------|-----------|---------------|---------------|
| 1080p   | 1920x1080 | 5000k         | 192k          |
| 720p    | 1280x720  | 2800k         | 128k          |
| 480p    | 854x480   | 1400k         | 128k          |
| 360p    | 640x360   | 800k          | 96k           |

## 🔧 FFmpeg Command Examples

### Manual HLS Encoding

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -c:a aac \
  -b:v 2800k \
  -b:a 128k \
  -vf scale=1280:720 \
  -preset fast \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_segment_filename "segment_%03d.ts" \
  -f hls playlist.m3u8
```

### Extract Thumbnail

```bash
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 -s 1280x720 thumbnail.jpg
```

### Generate Preview

```bash
ffmpeg -i input.mp4 -ss 00:01:00 -t 30 -c:v libx264 -c:a aac preview.mp4
```

## 📊 Bull Queue Dashboard

Monitor encoding jobs with Bull Board:

```bash
npm install @bull-board/express
```

Access: `http://localhost:3002/admin/queues`

## 🛠 Development

### Watch Mode
```bash
npm run start:dev
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## 🔐 Security

- File type validation
- File size limits
- Rate limiting on uploads
- Sanitized file names
- Isolated processing directories

## ⚡ Performance

### Optimization Tips

1. **Parallel Processing**
   - Set `MAX_PARALLEL_JOBS` in `.env`
   - Default: 2 concurrent jobs

2. **FFmpeg Presets**
   - Use `fast` or `medium` preset
   - Avoid `slow` or `veryslow` in production

3. **Redis Configuration**
   - Use persistent Redis for job recovery
   - Monitor memory usage

4. **Storage**
   - Use SSD for faster I/O
   - Regular cleanup of old files

## 📈 Monitoring

### Health Checks

```bash
# Encoder service
curl http://localhost:3002/encoder/health

# Upload service
curl http://localhost:3002/upload/health
```

### Job Statistics

```bash
# Get active jobs
curl http://localhost:3002/encoder/stats

# Get disk usage
curl http://localhost:3002/upload/stats
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3002
CMD ["npm", "run", "start:prod"]
```

### Production Checklist

- [ ] FFmpeg installed
- [ ] Redis running
- [ ] PostgreSQL connected
- [ ] Upload directory writable
- [ ] Environment variables set
- [ ] File size limits configured
- [ ] Monitoring enabled

## 🎯 Next Steps

- [ ] Add subtitles/captions support
- [ ] Add watermark overlay
- [ ] Add video trimming/cutting
- [ ] Add audio normalization
- [ ] Add quality detection (auto-quality)
- [ ] Add CDN integration

## 📚 Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [Sharp](https://sharp.pixelplumbing.com/)

---

**Made with ❤️ by MANYAK TV Team**
