"use server";

// 기본 좌표 (서울) — 위치 못 얻었을 때 fallback
const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.9780;

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    isDay: boolean;
  };
  today: {
    max: number;
    min: number;
  };
  hourly: Array<{
    time: string;
    hour: number;
    temperature: number;
    weatherCode: number;
  }>;
  weekly: Array<{
    date: string;
    max: number;
    min: number;
    weatherCode: number;
    precipitationProb: number;
  }>;
  location: {
    name: string;   // "서울" 또는 실제 지역명
    lat: number;
    lon: number;
  };
}

export async function fetchWeather(
  lat?: number,
  lon?: number
): Promise<{
  success: boolean;
  data?: WeatherData;
  message?: string;
}> {
  const targetLat = lat ?? DEFAULT_LAT;
  const targetLon = lon ?? DEFAULT_LON;

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(targetLat));
    url.searchParams.set("longitude", String(targetLon));
    url.searchParams.set("current", "temperature_2m,weather_code,is_day");
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max"
    );
    url.searchParams.set("hourly", "temperature_2m,weather_code");
    url.searchParams.set("timezone", "Asia/Seoul");
    url.searchParams.set("forecast_days", "7");

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return { success: false, message: "날씨 정보를 가져올 수 없습니다." };
    }

    const json = await res.json();

  // 지역명 조회 (Reverse Geocoding)
    let locationName = "현재 위치";
    try {
      // BigDataCloud API 사용 (무료, API 키 불필요, 한국 지역 세밀)
      const geoUrl = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
      geoUrl.searchParams.set("latitude", String(targetLat));
      geoUrl.searchParams.set("longitude", String(targetLon));
      geoUrl.searchParams.set("localityLanguage", "ko");

      const geoRes = await fetch(geoUrl.toString(), {
        next: { revalidate: 86400 },
      });

      if (geoRes.ok) {
        const geoJson = await geoRes.json();
        // 우선순위: locality(구/동) > city(시) > principalSubdivision(도)
        locationName =
          geoJson.locality ||
          geoJson.city ||
          geoJson.principalSubdivision ||
          "현재 위치";
      }
    } catch (e) {
      console.warn("Geocoding failed:", e);
    }

    // 시간별 (기존 로직 그대로)
    const hourly = (json.hourly.time as string[])
      .map((time, i) => ({
        time,
        hour: new Date(time).getHours(),
        temperature: Math.round(json.hourly.temperature_2m[i]),
        weatherCode: json.hourly.weather_code[i] as number,
      }))
      .filter((h) => {
        const hDate = new Date(h.time);
        const nowDate = new Date();
        return hDate.getTime() >= nowDate.getTime() - 60 * 60 * 1000;
      })
      .slice(0, 8);

    const weekly = (json.daily.time as string[]).map((date, i) => ({
      date,
      max: Math.round(json.daily.temperature_2m_max[i]),
      min: Math.round(json.daily.temperature_2m_min[i]),
      weatherCode: json.daily.weather_code[i] as number,
      precipitationProb: json.daily.precipitation_probability_max?.[i] ?? 0,
    }));

    return {
      success: true,
      data: {
        current: {
          temperature: Math.round(json.current.temperature_2m),
          weatherCode: json.current.weather_code,
          isDay: json.current.is_day === 1,
        },
        today: {
          max: Math.round(json.daily.temperature_2m_max[0]),
          min: Math.round(json.daily.temperature_2m_min[0]),
        },
        hourly,
        weekly,
        location: {
          name: locationName,
          lat: targetLat,
          lon: targetLon,
        },
      },
    };
  } catch (error) {
    console.error("fetchWeather error:", error);
    return { success: false, message: "날씨 정보를 가져오는 중 오류가 발생했습니다." };
  }
}