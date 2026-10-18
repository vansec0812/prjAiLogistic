# Vietnamese SOP speech review

Reviewed 2026-10-18 (Asia/Saigon). Bounded, read-only implementation research; no paid request, key inspection, provider audition, or code change. Read `server/vietnamese-tts.ts`, `components/use-vietnamese-speech.ts`, `lib/packing-narration.ts`, their unit tests and `lib/vietnamese-voice.ts`.

## Official protocol facts

[GenerateContent TTS guide](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation), accessed today, updated 2026-10-12: Gemini 3.8 single-speaker examples use `generationConfig.speechConfig.voiceConfig.voice`; unary output defaults to complete WAV, 24 kHz/mono/16-bit little-endian PCM. Streaming defaults to headerless PCM. Explicit REST `responseFormat.audio.mimeType: "AUDIO_WAV"` is documented. Style belongs in part metadata, separate from the transcript. The guide is now labelled legacy; do not mix its request/response envelope with the newer [Interactions guide](https://ai.google.dev/gemini-api/docs/speech-generation).

[API schema](https://ai.google.dev/api/generate-content#VoiceConfig): `voiceConfig.voice` and `voiceConfig.prebuiltVoiceConfig.voiceName` are alternative union members, not fields to send together. `Part.speechMetadata.style` is documented in camelCase; REST tutorial examples use `speech_metadata`. Baseline camelCase and `voice: "Kore"` therefore have schema support; changing them blindly is not a pronunciation fix.

[Model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-lite-tts): current configured default `gemini-3.8-flash-lite-tts` exists, supports Vietnamese, and uses the 3.8 schema. Documentation does not establish this project's entitlement or its pronunciation quality. Do not replace it with another model without configuration/acceptance evidence.

## Baseline findings

- Fixed `packingNarration` composition is preferable to generative rewriting, but raw abbreviations, decimals and ranges still reach device/cloud speech. Existing tests preserve text/order, not correct Vietnamese pronunciation.
- Cloud adapter checks only RIFF/WAVE markers. The success fixture has no valid `fmt`/`data` chunks, so that test cannot prove playable audio. Provider MIME, encoding, chunk bounds and duration are not validated server-side.
- `activate()` selects cloud even when a Vietnamese device voice exists; `usingCloud` becomes true before successful playback. The user needs an explicit, truthful device/cloud choice and notice of text sent to Google. Voice-list support alone does not prove audibility.
- Cloud cache key omits voice/style/normalizer revisions. Its per-owner scope is useful. A client abort stops playback/reception but does not prove an upstream call was cancelled or unbilled. The API accepts arbitrary consented text rather than a pinned server-rendered SOP transcript.
- Existing rate/quota and CSRF checks are useful. No test reviewed here proves real provider availability, native accent, pronunciation, or safe transcript recitation. No tests were run for this documentation task.

## Proposed deterministic pronunciation layer

Giữ nguyên SOP gốc để hiển thị/audit; tạo một bản đọc bằng quy tắc có version dùng chung cho browser/cloud. Không dùng LLM để viết lại. Chỉ xử lý token đã nhận dạng rõ; giữ nguyên phủ định, điều kiện, tên cây, giới hạn và câu nhắc thử nghiệm. Không làm tròn, đổi đơn vị, bổ sung khoảng dung sai hay đổi `dưới` thành `không quá`. Chuẩn hóa Unicode NFC và khoảng trắng; không xóa dấu tiếng Việt.

Lexicon đề xuất, cần người Việt nghe duyệt:

| Token trong ngữ cảnh đã nhận dạng | Bản đọc |
| --- | --- |
| `cm` sau số đo | `xen ti mét` |
| `kg` sau số đo | `ki lô gam` |
| `°C` sau nhiệt độ | `độ xê` |
| `0,50 kg` | `không phẩy năm không ki lô gam` |
| `5,08–10,16 cm` | `năm phẩy không tám đến mười phẩy một sáu xen ti mét` |
| `24–48 giờ` | `hai mươi bốn đến bốn mươi tám giờ` |
| `2–3 vòng` | `hai đến ba vòng` |
| `<20,32 cm` | `nhỏ hơn hai mươi phẩy ba hai xen ti mét` |
| `≤20,32 cm` | `nhỏ hơn hoặc bằng hai mươi phẩy ba hai xen ti mét` |
| `SOP` là tên loại tài liệu | `quy trình thao tác chuẩn` (giữ câu `chưa duyệt` nếu có) |

Sau dấu phẩy đọc từng chữ số để giữ chính xác số lẻ. Chỉ coi dấu chấm là thập phân trong grammar số đo rõ ràng; chuỗi mơ hồ như `1.000` cần giữ nguyên/đánh dấu, không đoán nghìn hay thập phân. Dấu gạch có thể là khoảng, số âm, mã hoặc phép trừ: không thay toàn cục thành `đến`. Không tách `cm`, `kg`, `SOP` bên trong từ, URL, mã hay tên khoa học. Không tự chèn vocal tags vào nội dung kỹ thuật.

## Adapter and acceptance proposal

1. Input references SOP/session/step/version; server derives the authoritative narration where practical. A pure normalizer returns `{rawText, spokenText, normalizerVersion, warnings}`. Both playback paths receive identical `spokenText`; unresolved tokens remain visible for review.
2. Pin model/voice/style/locale/normalizer version in request/cache identity. Use one documented GenerateContent configuration, never mixed Interactions envelopes. Request WAV explicitly; decode `inlineData` only from accepted audio MIME and a completed candidate. Validate real RIFF chunks, PCM format, sample rate/channels, data alignment and bounded duration. Do not prepend another WAV header to complete WAV. Unsupported raw PCM fails clearly or enters an explicitly configured conversion path.
3. Keep text usable on all failures. Start audio only after user gesture/consent; status reports actual start/end/error. Stop, disable, step change and unmount invalidate stale results, stop audio and pause microphone recognition to avoid the app hearing itself. TTS completion never advances a checklist or records a successful inspection.
4. Unit cases: every catalog step; decimals including zeros; ranges/negative temperatures; `<`/`≤`; unknown abbreviations; no mutation; replay determinism; both voice union alternatives; valid playable WAV; truncated/malformed/mismatched MIME; missing candidate; quota/auth; cache scope/version; duplicate concurrent request. Use a real tiny PCM WAV fixture, not markers alone.
5. Browser cases: device voice present/absent; blocked AudioContext; late result after cancel; replay; step change; rapid clicks; 401/429/503; no microphone self-command. A Vietnamese speaker must audition all technical number/unit/negation fixtures on actual supported devices and configured cloud voice. Record model/voice/version and errors; mock pass is not a pronunciation-quality result.
