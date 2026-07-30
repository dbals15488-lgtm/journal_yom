"use server";

// 서울 좌표 (나중에 위치 감지 붙일 때 교체)
const LAT = 37.5665;
const LON = 126.9780;

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
    time: string;      // ISO 문자열
    hour: number;      // 시간 (0~23)
    temperature: number;
    weatherCode: number;
  }>;
}

export async function fetchWeather(): Promise<{
  success: boolean;
  data?: WeatherData;
  message?: string;
}> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(LAT));
    url.searchParams.set("longitude", String(LON));
    url.searchParams.set("current", "temperature_2m,weather_code,is_day");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code"); // weather_code 추가
    url.searchParams.set("hourly", "temperature_2m,weather_code");
    url.searchParams.set("timezone", "Asia/Seoul");
    url.searchParams.set("forecast_days", "7"); // 1 → 7로 변경

    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return { success: false, message: "날씨 정보를 가져올 수 없습니다." };
    }

    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max"
    );

    const json = await res.json();

    // 시간별 (기존과 동일)
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

    // 주간 (7일치)
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
      },
    };
  } catch (error) {
    console.error("fetchWeather error:", error);
    return { success: false, message: "날씨 정보를 가져오는 중 오류가 발생했습니다." };
  }
}

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
}