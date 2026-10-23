import { activeMvpConfig } from './mvp';
import { inferJourney } from '../../../../packages/rule-engine/src/mvp';
import type { JourneyContext } from '../../../../packages/domain/src/index';

export async function estimateJourneyWithAi(
  origin: string,
  destination: string,
  departure: string,
  channel: string
): Promise<JourneyContext> {
  const config = activeMvpConfig();
  const fallback = inferJourney(origin, destination, departure, channel, config);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const model = process.env.GEMINI_TEXT_MODEL || process.env.GEMINI_VISION_MODEL || 'gemini-3.8-flash';
  const effectiveModel = model.includes('2.5') || model.includes('3.1') ? 'gemini-3.8-flash' : model;

  try {
    const prompt = `Bạn là trợ lý logistics chuyên về vận chuyển cây cảnh tại Việt Nam.
Hãy ước tính các thông số vận chuyển thực tế giữa 2 địa điểm:
- Nơi đi: ${origin}
- Nơi đến: ${destination}
- Kênh bán / hình thức gửi: ${channel} (DIRECT: giao hàng trực tiếp/hỏa tốc; SHOPEE: sàn TMĐT Shopee Express; TIKTOK: sàn TMĐT TikTok Shop; OTHER: xe khách/chành xe liên tỉnh)
- Thời gian gửi hàng: ${departure} (giờ Việt Nam)

Dựa trên mạng lưới giao thông đường bộ và khí hậu thực tế tại Việt Nam vào thời điểm này, hãy tính toán và trả về đúng 1 JSON object tuân thủ schema:
{
  "distanceKm": number (khoảng cách đường bộ thực tế tính bằng km, số nguyên dương),
  "durationHours": number (thời gian vận chuyển dự kiến từ lúc gửi đến lúc nhận tính bằng giờ, số nguyên dương phù hợp với kênh bán),
  "minTemp": number (nhiệt độ thấp nhất dự kiến trên cung đường trong thời gian di chuyển, độ C),
  "maxTemp": number (nhiệt độ cao nhất dự kiến trên cung đường trong thời gian di chuyển, độ C),
  "summary": string (tóm tắt ngắn gọn cơ sở ước tính: cung đường, kênh vận chuyển, thời tiết, tối đa 120 ký tự)
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 600,
            temperature: 0.1
          }
        })
      }
    );

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallback;

    const parsed = JSON.parse(text);
    const dist =
      typeof parsed.distanceKm === 'number' && parsed.distanceKm > 0
        ? Math.round(parsed.distanceKm)
        : fallback.distanceKm;
    const dur =
      typeof parsed.durationHours === 'number' && parsed.durationHours > 0
        ? Math.round(parsed.durationHours)
        : fallback.duration;
    const minT =
      typeof parsed.minTemp === 'number' && Number.isFinite(parsed.minTemp)
        ? Math.round(parsed.minTemp)
        : fallback.minTemp;
    const maxT =
      typeof parsed.maxTemp === 'number' && Number.isFinite(parsed.maxTemp)
        ? Math.round(parsed.maxTemp)
        : fallback.maxTemp;

    const sourceText = parsed.summary
      ? `${parsed.summary} · Dự báo Gemini AI`
      : `Ước tính đường bộ ${dist} km, kênh ${channel} · Gemini AI`;

    return {
      distanceKm: dist,
      distanceKind: 'STRAIGHT_LINE',
      duration: dur,
      minTemp: minT,
      maxTemp: maxT,
      source: sourceText,
      seasonalFallback: false,
      configVersion: config.version
    };
  } catch {
    return fallback;
  }
}

