"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getWeatherInfo } from "../../app/weather-utils";
import type { WeatherData } from "../../app/actions/weather";

interface WeatherWidgetProps {
  weather: WeatherData | null;
  error: string | null;
}

export default function WeatherWidget({ weather, error }: WeatherWidgetProps) {
  if (error) {
    return (
      <div className="card weather-card">
        <p className="weather-error">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="card weather-card">
        <p className="weather-loading">날씨 정보 불러오는 중...</p>
      </div>
    );
  }

  const currentInfo = getWeatherInfo(weather.current.weatherCode, weather.current.isDay);

  return (
    <div className="card weather-card">
      <div className="weather-main">
        <div className="weather-icon-large">{currentInfo.icon}</div>
        <div className="weather-info">
          <div className="weather-location">{weather.location.name}</div>
          <div className="weather-temp">{weather.current.temperature}°</div>
          <div className="weather-label">{currentInfo.label}</div>
          <div className="weather-minmax">
            <span className="weather-max">↑ {weather.today.max}°</span>
            <span className="weather-min">↓ {weather.today.min}°</span>
          </div>
        </div>
      </div>

      <div className="weather-section">
        <div className="weather-section-label">시간별 예보</div>
        <div className="weather-hourly">
          {weather.hourly.map((h, i) => {
            const info = getWeatherInfo(h.weatherCode);
            return (
              <div key={h.time} className="weather-hour-item">
                <div className="weather-hour-label">{i === 0 ? "지금" : `${h.hour}시`}</div>
                <div className="weather-hour-icon">{info.icon}</div>
                <div className="weather-hour-temp">{h.temperature}°</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="weather-section">
        <div className="weather-section-label">주간 예보</div>
        <div className="weather-weekly">
          {weather.weekly.map((d, i) => {
            const info = getWeatherInfo(d.weatherCode);
            const dateObj = new Date(d.date);
            const dayLabel = i === 0 ? "오늘" : format(dateObj, "EEE", { locale: ko });

            return (
              <div key={d.date} className="weather-day-item">
                <div className="weather-day-name">{dayLabel}</div>
                <div className="weather-day-icon">{info.icon}</div>
                <div className="weather-day-label">{info.label}</div>
                {d.precipitationProb > 0 && (
                  <div className="weather-day-rain">💧 {d.precipitationProb}%</div>
                )}
                <div className="weather-day-temps">
                  <span className="weather-day-max">{d.max}°</span>
                  <span className="weather-day-min">{d.min}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
